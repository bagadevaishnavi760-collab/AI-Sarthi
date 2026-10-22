from __future__ import annotations

import logging
import os
from typing import Any
from urllib.parse import urlsplit, urlunsplit

import requests
from dotenv import load_dotenv

from api.structured_data import PROJECT_ROOT


load_dotenv(PROJECT_ROOT / ".env")
LOGGER = logging.getLogger(__name__)


class OllamaError(RuntimeError):
    pass


class OllamaUnavailable(OllamaError):
    pass


class OllamaModelMissing(OllamaError):
    pass


class OllamaRequestTimeout(OllamaError):
    pass


class OllamaInferenceError(OllamaError):
    pass


class OllamaClient:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        session: requests.Session | None = None,
        connect_timeout: float = 3,
        read_timeout: float = 180,
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")).rstrip("/")
        parsed_url = urlsplit(self.base_url)
        display_host = parsed_url.hostname or ""
        if ":" in display_host and not display_host.startswith("["):
            display_host = f"[{display_host}]"
        if parsed_url.port is not None:
            display_host = f"{display_host}:{parsed_url.port}"
        self.display_url = urlunsplit((parsed_url.scheme, display_host, parsed_url.path, "", ""))
        self.model = model or os.getenv("OLLAMA_MODEL", "llama3.2")
        self.session = session or requests.Session()
        self.timeout = (connect_timeout, read_timeout)

    def tags(self) -> list[str]:
        try:
            response = self.session.get(f"{self.base_url}/api/tags", timeout=self.timeout)
            response.raise_for_status()
            try:
                payload = response.json()
            except ValueError as exc:
                raise OllamaInferenceError("Ollama returned invalid JSON for /api/tags.") from exc
            if not isinstance(payload, dict) or not isinstance(payload.get("models"), list):
                raise OllamaInferenceError("Ollama returned an invalid /api/tags response.")
            return [
                str(item["name"])
                for item in payload["models"]
                if isinstance(item, dict) and isinstance(item.get("name"), str)
            ]
        except requests.Timeout as exc:
            LOGGER.warning("Ollama server probe timed out", extra={"operation": "tags"})
            raise OllamaRequestTimeout("Timed out checking the local Ollama model list at /api/tags.") from exc
        except requests.ConnectionError as exc:
            LOGGER.warning("Ollama server is unavailable", extra={"operation": "tags"})
            raise OllamaUnavailable(
                f"Cannot connect to local Ollama at {self.display_url}. Start Ollama and verify /api/tags."
            ) from exc
        except OllamaInferenceError:
            raise
        except requests.RequestException as exc:
            LOGGER.warning("Ollama server probe failed", extra={"operation": "tags"})
            raise OllamaInferenceError("The local Ollama /api/tags request failed.") from exc

    def model_installed(self, installed: list[str] | None = None) -> bool:
        names = installed if installed is not None else self.tags()
        configured_name = self.model if ":" in self.model else f"{self.model}:latest"
        return self.model in names or configured_name in names

    def require_model(self) -> list[str]:
        installed = self.tags()
        if not self.model_installed(installed):
            LOGGER.warning(
                "Configured Ollama model is not installed",
                extra={"operation": "model_check", "model": self.model},
            )
            raise OllamaModelMissing(
                f"Ollama is running, but model '{self.model}' is not installed. "
                f"Install it explicitly with 'ollama pull {self.model}'."
            )
        return installed

    def chat(
        self,
        messages: list[dict[str, str]],
        *,
        options: dict[str, Any] | None = None,
        response_format: str | dict[str, Any] | None = None,
        check_model: bool = True,
    ) -> str:
        if check_model:
            self.require_model()
        payload: dict[str, Any] = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }
        if options is not None:
            payload["options"] = options
        if response_format is not None:
            payload["format"] = response_format
        try:
            response = self.session.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=self.timeout,
            )
            if response.status_code == 404:
                raise OllamaModelMissing(
                    f"Ollama could not find model '{self.model}'. Install it explicitly with "
                    f"'ollama pull {self.model}'."
                )
            response.raise_for_status()
            result = response.json()
            content = result.get("message", {}).get("content") if isinstance(result, dict) else None
            if not isinstance(content, str) or not content.strip():
                raise OllamaInferenceError("Ollama completed the request without returning message content.")
            return content.strip()
        except requests.Timeout as exc:
            LOGGER.warning("Ollama inference timed out", extra={"operation": "chat", "model": self.model})
            raise OllamaRequestTimeout(
                f"Timed out waiting for local Ollama model '{self.model}' to generate a response."
            ) from exc
        except requests.ConnectionError as exc:
            LOGGER.warning("Ollama inference connection failed", extra={"operation": "chat", "model": self.model})
            raise OllamaUnavailable(
                f"Lost connection to local Ollama at {self.display_url} during inference."
            ) from exc
        except requests.RequestException as exc:
            LOGGER.warning("Ollama inference request failed", extra={"operation": "chat", "model": self.model})
            raise OllamaInferenceError(
                f"Local Ollama inference failed for model '{self.model}'."
            ) from exc
        except ValueError as exc:
            LOGGER.warning("Ollama returned invalid inference JSON", extra={"operation": "chat", "model": self.model})
            raise OllamaInferenceError("Ollama returned invalid JSON for the inference response.") from exc

    def probe_inference(self) -> dict[str, Any]:
        installed = self.require_model()
        self.chat(
            [{"role": "user", "content": "Reply with exactly the word READY."}],
            options={"temperature": 0, "num_predict": 8},
            check_model=False,
        )
        return {"server_available": True, "model_installed": True, "inference_available": True, "models": installed}

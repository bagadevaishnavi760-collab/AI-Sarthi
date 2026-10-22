import unittest
from unittest.mock import Mock

import requests

from api.ollama_client import (
    OllamaClient,
    OllamaInferenceError,
    OllamaModelMissing,
    OllamaRequestTimeout,
    OllamaUnavailable,
)


class OllamaClientTests(unittest.TestCase):
    def setUp(self):
        self.session = Mock()
        self.client = OllamaClient(
            base_url="http://localhost:11434",
            model="llama3.2",
            session=self.session,
        )

    def test_tags_returns_installed_model_names(self):
        response = Mock()
        response.json.return_value = {"models": [{"name": "llama3.2:latest"}]}
        self.session.get.return_value = response

        self.assertEqual(self.client.tags(), ["llama3.2:latest"])
        self.session.get.assert_called_once_with(
            "http://localhost:11434/api/tags",
            timeout=(3, 180),
        )

    def test_display_url_preserves_port_without_exposing_credentials(self):
        client = OllamaClient(base_url="http://user:secret@127.0.0.1:11435/proxy")

        self.assertEqual(client.display_url, "http://127.0.0.1:11435/proxy")

    def test_server_unavailable_and_timeout_are_distinct(self):
        self.session.get.side_effect = requests.ConnectionError("refused")
        with self.assertRaises(OllamaUnavailable):
            self.client.tags()

        self.session.get.side_effect = requests.Timeout("timed out")
        with self.assertRaises(OllamaRequestTimeout):
            self.client.tags()

    def test_invalid_tags_response_is_reported(self):
        response = Mock()
        response.json.return_value = {"installed": []}
        self.session.get.return_value = response

        with self.assertRaises(OllamaInferenceError):
            self.client.tags()

    def test_missing_model_is_reported_before_inference(self):
        response = Mock()
        response.json.return_value = {"models": [{"name": "other:latest"}]}
        self.session.get.return_value = response

        with self.assertRaises(OllamaModelMissing):
            self.client.chat([{"role": "user", "content": "hello"}])
        self.session.post.assert_not_called()

    def test_chat_uses_non_streaming_response_and_installed_model(self):
        tags_response = Mock()
        tags_response.json.return_value = {"models": [{"name": "llama3.2:latest"}]}
        chat_response = Mock()
        chat_response.status_code = 200
        chat_response.json.return_value = {"message": {"content": "  hello  "}}
        self.session.get.return_value = tags_response
        self.session.post.return_value = chat_response

        answer = self.client.chat([{"role": "user", "content": "hello"}])

        self.assertEqual(answer, "hello")
        self.session.post.assert_called_once_with(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.2",
                "messages": [{"role": "user", "content": "hello"}],
                "stream": False,
            },
            timeout=(3, 180),
        )

    def test_inference_timeout_and_invalid_response_are_reported(self):
        tags_response = Mock()
        tags_response.json.return_value = {"models": [{"name": "llama3.2:latest"}]}
        self.session.get.return_value = tags_response
        self.session.post.side_effect = requests.Timeout("timed out")
        with self.assertRaises(OllamaRequestTimeout):
            self.client.chat([{"role": "user", "content": "hello"}])

        self.session.post.side_effect = None
        invalid_response = Mock()
        invalid_response.status_code = 200
        invalid_response.json.return_value = {"message": {"content": ""}}
        self.session.post.return_value = invalid_response
        with self.assertRaises(OllamaInferenceError):
            self.client.chat([{"role": "user", "content": "hello"}])

    def test_inference_http_404_is_reported_as_model_missing(self):
        tags_response = Mock()
        tags_response.json.return_value = {"models": [{"name": "llama3.2:latest"}]}
        self.session.get.return_value = tags_response
        not_found = Mock()
        not_found.status_code = 404
        self.session.post.return_value = not_found

        with self.assertRaises(OllamaModelMissing):
            self.client.chat([{"role": "user", "content": "hello"}])

    def test_other_inference_http_errors_are_reported(self):
        tags_response = Mock()
        tags_response.json.return_value = {"models": [{"name": "llama3.2:latest"}]}
        self.session.get.return_value = tags_response
        failed_response = Mock()
        failed_response.status_code = 500
        failed_response.raise_for_status.side_effect = requests.HTTPError("server error")
        self.session.post.return_value = failed_response

        with self.assertRaises(OllamaInferenceError):
            self.client.chat([{"role": "user", "content": "hello"}])


if __name__ == "__main__":
    unittest.main()

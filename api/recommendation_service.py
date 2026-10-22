from __future__ import annotations

import json
import re
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator

from api.ollama_client import OllamaClient
from api.structured_data import StructuredDataService


PRIORITIES = (
    "Primary Healthcare",
    "Infrastructure",
    "Manpower & Training",
    "Disease Prevention",
    "Maternal & Child Health",
)


class RecommendationDraft(BaseModel):
    executive_summary: str = Field(min_length=1, max_length=1200)
    proposed_actions: list[str] = Field(min_length=3, max_length=5)
    reasoning: str = Field(min_length=1, max_length=1600)

    @field_validator("executive_summary", "reasoning")
    @classmethod
    def require_text_without_unverified_figures(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned or re.search(r"\d|[%₹]", cleaned):
            raise ValueError("Model explanation must be non-empty and contain no unsupported figures.")
        return cleaned

    @field_validator("proposed_actions")
    @classmethod
    def validate_actions(cls, actions: list[str]) -> list[str]:
        cleaned_actions = [action.strip() for action in actions]
        if any(not action or re.search(r"\d|[%₹]", action) for action in cleaned_actions):
            raise ValueError("Proposed actions must be non-empty and must not introduce figures.")
        return cleaned_actions


class RecommendationService:
    def __init__(
        self,
        structured_data: StructuredDataService | None = None,
        ollama: OllamaClient | None = None,
    ):
        self.structured_data = structured_data or StructuredDataService()
        self.ollama = ollama or OllamaClient()

    def options(self) -> dict[str, Any]:
        return self.structured_data.recommendation_options()

    def generate(self, state: str, year: str, priority: str) -> dict[str, Any]:
        if priority not in PRIORITIES:
            raise ValueError(f"Priority must be one of: {', '.join(PRIORITIES)}.")
        evidence = self.structured_data.recommendation_evidence(state, year)
        prompt = (
            "Write local decision-support guidance for the selected healthcare priority. "
            "Use only the verified facts and limitations supplied. State no unsupported facts, "
            "causal explanations, policy, or numeric figures. Proposed actions must be clearly "
            "framed as ideas for human review, not official guidance. If the data do not justify "
            "a specific action for this priority, propose monitoring or data collection instead. "
            "Return JSON with executive_summary, proposed_actions (3 to 5 strings), and reasoning.\n"
            f"Selected state: {state}\nFinancial year: {year}\nPriority: {priority}\n"
            f"Verified evidence: {json.dumps(evidence, ensure_ascii=False)}"
        )
        raw = self.ollama.chat(
            [
                {
                    "role": "system",
                    "content": (
                        "You explain verified healthcare budget and infrastructure evidence. "
                        "Never invent statistics, operational conditions, or official policies. "
                        "Do not repeat numeric values; the application displays verified figures separately."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            options={"temperature": 0.2},
            response_format="json",
        )
        try:
            draft = RecommendationDraft.model_validate_json(raw)
        except (ValidationError, ValueError) as exc:
            raise ValueError(
                "The local model returned an invalid recommendation. No unverified recommendation was shown."
            ) from exc
        return {
            "priorityClassification": priority,
            "executiveSummary": draft.executive_summary,
            "recommendedActions": draft.proposed_actions,
            "suggestedAllocationFocus": [],
            "supportingReasoning": draft.reasoning,
            "facts": evidence["facts"],
            "calculations": evidence["calculations"],
            "dataSources": evidence["data_sources"],
            "assumptionsAndLimitations": evidence["limitations"],
            "mode": "local-ollama",
        }

from __future__ import annotations

import json
import logging
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

LOGGER = logging.getLogger(__name__)
NUMBER_PATTERN = re.compile(r"(?<![A-Za-z])(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?%?")
UNSUPPORTED_COMPARISON_PATTERN = re.compile(
    r"\b(?:significant|substantial|high|low|large|small|adequate|inadequate|insufficient|"
    r"excessive|exceptional|poor|strong|weak)\b|\b(?:reasonable|acceptable|target)\s+range\b",
    re.IGNORECASE,
)


class RecommendationDraft(BaseModel):
    executive_summary: str = Field(min_length=1, max_length=1200)
    proposed_actions: list[str] = Field(min_length=3, max_length=5)
    reasoning: str = Field(min_length=1, max_length=1600)

    @field_validator("executive_summary", "reasoning")
    @classmethod
    def require_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Model explanation must not be empty.")
        return cleaned

    @field_validator("proposed_actions")
    @classmethod
    def validate_actions(cls, actions: list[str]) -> list[str]:
        cleaned_actions = [action.strip() for action in actions]
        if any(not action for action in cleaned_actions):
            raise ValueError("Proposed actions must not be empty.")
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
        system_message = (
            "You explain verified healthcare budget and infrastructure evidence. "
            "Never invent statistics, operational conditions, sources, or official policies. "
            "Do not include numeric figures; the application displays verified values separately. "
            "The selected financial year may be stated."
        )
        user_prompt = (
            "Write local decision-support guidance for the selected healthcare priority. "
            "Use only the verified facts and limitations supplied. State no unsupported facts, "
            "causal explanations, or policy. Proposed actions must be ideas for human review, not official guidance. "
            "If the data do not justify a specific action for this priority, propose monitoring or data collection instead. "
            "Return one JSON object with exactly executive_summary (string), proposed_actions (3 to 5 strings), "
            "and reasoning (string). Do not include numeric figures. The selected financial year may appear in the prose. "
            "Refer to the metric 'Central release' by that exact name; it is not a total or sanctioned budget. "
            "Expenditure divided by central release is not a utilization percentage of total sanctioned budget. "
            "NHM financial records are not broken down by healthcare priority; do not claim that they measure "
            "total public healthcare spending or spending for the selected priority. "
            "Do not describe amounts or facility counts as high, low, significant, "
            "substantial, adequate, or inadequate because no comparison benchmark was supplied. For Primary Healthcare, "
            "do not group CHC, SDH, district hospital, or medical college counts under primary-care evidence.\n"
            f"Selected state: {state}\nFinancial year: {year}\nPriority: {priority}\n"
            f"Verified evidence: {json.dumps(evidence, ensure_ascii=False)}"
        )
        messages = [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_prompt},
        ]
        validation_error: Exception | None = None
        validation_reason = ""
        for attempt in range(2):
            if attempt:
                messages = [
                    *messages,
                    {
                        "role": "assistant",
                        "content": raw,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"The previous draft failed this evidence check: {validation_reason}. "
                            "Rewrite it as one corrected JSON object with all required fields and 3 to 5 actions. "
                            "The CSVs contain state-level NHM Central_Release and Expenditure plus facility and bed counts. "
                            "They do not split financial figures by healthcare priority, report staffing, patient visits, "
                            "population need, service quality, or provide benchmarks. Do not claim that the selected "
                            "priority has a particular funding amount, that NHM figures represent total public healthcare "
                            "spending, that a current service gap exists, or that demand "
                            "or outcomes are established. Actions may propose collecting missing information or reviewing "
                            "records. Do not describe CHC, SDH, district hospital, or medical college records as Primary "
                            "Healthcare evidence. Do not include numeric figures except the selected financial year. "
                            "Do not add facts."
                        ),
                    },
                ]
            raw = self.ollama.chat(
                messages,
                options={"temperature": 0},
                response_format="json",
            )
            try:
                draft = self._parse_draft(raw)
                self._validate_numeric_claims(draft, year)
                self._validate_evidence_language(draft, priority)
                break
            except (ValidationError, ValueError) as exc:
                validation_error = exc
                validation_reason = (
                    "; ".join(
                        f"{'.'.join(str(part) for part in error['loc'])}: {error['type']}"
                        for error in exc.errors(include_input=False)
                    )
                    if isinstance(exc, ValidationError)
                    else str(exc)
                )
                LOGGER.warning(
                    "Local recommendation response failed validation",
                    extra={"attempt": attempt + 1, "validation_error": validation_reason},
                )
        else:
            raise ValueError(
                "The local model could not produce a valid evidence-grounded recommendation after one retry. "
                "Retry the request or check the configured Ollama model."
            ) from validation_error
        return {
            "priorityClassification": priority,
            "selectedState": state,
            "financialYear": year,
            "executiveSummary": draft.executive_summary,
            "recommendedActions": draft.proposed_actions,
            "suggestedAllocationFocus": [],
            "supportingReasoning": draft.reasoning,
            "facts": evidence["facts"],
            "calculations": evidence["calculations"],
            "dataSources": evidence["data_sources"],
            "assumptionsAndLimitations": evidence["limitations"],
            "mode": "local-ollama",
            "status": "generated",
        }

    @staticmethod
    def _parse_draft(raw: str) -> RecommendationDraft:
        if not isinstance(raw, str) or not raw.strip():
            raise ValueError("Model returned empty recommendation content.")
        decoder = json.JSONDecoder()
        for match in re.finditer(r"\{", raw):
            try:
                payload, _ = decoder.raw_decode(raw[match.start():])
                if isinstance(payload, dict):
                    return RecommendationDraft.model_validate(payload)
            except (json.JSONDecodeError, ValidationError):
                continue
        raise ValueError("Model response did not contain a valid recommendation JSON object.")

    @staticmethod
    def _validate_numeric_claims(
        draft: RecommendationDraft,
        year: str,
    ) -> None:
        year_pattern = re.escape(year).replace(r"\-", r"[-\u2013]")
        for text in (draft.executive_summary, *draft.proposed_actions, draft.reasoning):
            text_without_year = re.sub(year_pattern, "", text)
            if NUMBER_PATTERN.search(text_without_year):
                raise ValueError("Model response includes numeric figures outside the selected financial year.")

    @staticmethod
    def _validate_evidence_language(draft: RecommendationDraft, priority: str) -> None:
        texts = (draft.executive_summary, *draft.proposed_actions, draft.reasoning)
        for text in texts:
            if UNSUPPORTED_COMPARISON_PATTERN.search(text):
                raise ValueError("Model response uses an unverified comparative description.")
        factual_texts = (draft.executive_summary, draft.reasoning)
        priority_spending = re.compile(
            r"\b(?:budget|expenditure|spending|allocation|funding|central release(?: funds)?)\s+"
            r"(?:for|on|in|to|toward|towards)\s+"
            r"(?:(?:the|selected)\s+)*(?:healthcare\s+)?"
            r"(?:priority|primary healthcare|primary care|infrastructure|manpower|training|disease prevention|"
            r"maternal(?: and child)? health)\b|"
            r"(?:the\s+)?(?:primary healthcare|primary care|infrastructure|manpower|training|disease prevention|"
            r"maternal(?: and child)? health)\s+"
            r"(?:budget|expenditure|spending|allocation|funding)\b|"
            r"\b(?:primary healthcare|primary care|infrastructure|manpower|"
            r"training|disease prevention|maternal(?: and child)? health)\s+"
            r"(?:budget|expenditure|spending|allocation|funding)\b",
            re.IGNORECASE,
        )
        if any(priority_spending.search(text) for text in texts):
            raise ValueError("Model response presents NHM figures as specific to a healthcare priority.")
        if any(
            re.search(
                r"\b(?:identified|existing|current|known)\b.{0,40}"
                r"\b(?:gaps?|shortfalls?|unmet needs?|demand)\b",
                text,
                re.IGNORECASE,
            )
            for text in factual_texts
        ):
            raise ValueError("Model response claims that supplied records establish existing service gaps or demand.")
        if any(
            re.search(
                r"\b(?:indicate|show|suggest|demonstrate|reveal)\b.{0,50}\b"
                r"(?:issues?|problems?|shortfalls?|gaps?|underfunding|overfunding)\b",
                text,
                re.IGNORECASE,
            )
            for text in factual_texts
        ):
            raise ValueError("Model response infers an unverified issue from the supplied records.")
        if any(
            re.search(
                r"\b(?:total|overall)\b.{0,30}\b(?:public\s+)?health(?:care)?\b.{0,30}"
                r"\b(?:budget|expenditure|spending)\b|\b(?:total|overall)\s+"
                r"(?:expenditure|spending)\s+(?:on|for)\s+(?:public\s+)?health(?:care)?\b",
                text,
                re.IGNORECASE,
            )
            for text in texts
        ):
            raise ValueError("Model response presents NHM expenditure as total public healthcare spending.")
        if priority == "Primary Healthcare" and any(
            re.search(
                r"\b(?:primary[- ]healthcare|primary[- ]care)\b.{0,80}"
                r"\b(?:CHC|SDH|district hospitals?|medical colleges?)\b|"
                r"\b(?:CHC|SDH|district hospitals?|medical colleges?)\b.{0,80}"
                r"\b(?:primary[- ]healthcare|primary[- ]care)\b",
                text,
                re.IGNORECASE,
            )
            for text in texts
        ):
            raise ValueError(
                "Model response classifies secondary or tertiary facility counts as primary-care evidence."
            )

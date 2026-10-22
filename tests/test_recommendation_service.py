import unittest

from api.recommendation_service import PRIORITIES, RecommendationService
from api.ollama_client import OllamaModelMissing


class FakeStructuredData:
    def __init__(self, evidence=None):
        self.evidence = evidence or {
            "state": "Bihar",
            "year": "2022-23",
            "facts": [
                {"metric": "Central release", "value": 100, "unit": "source units (not specified)",
                 "source_file": "budget.csv"},
                {"metric": "PHCs", "value": 25, "unit": "count", "source_file": "infra.csv"},
            ],
            "calculations": [],
            "data_sources": [],
            "limitations": ["Blank fields remain missing."],
        }

    def recommendation_options(self):
        return {"states": ["Bihar"], "state_years": {"Bihar": ["2022-23"]}, "sources": []}

    def recommendation_evidence(self, state, year):
        if state != self.evidence["state"] or year != self.evidence["year"]:
            raise ValueError("No matching data.")
        return self.evidence


class FakeOllama:
    def __init__(self, response):
        self.response = response
        self.request = None

    def chat(self, messages, **kwargs):
        self.request = (messages, kwargs)
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


class RecommendationServiceTests(unittest.TestCase):
    def test_generate_returns_model_explanation_separate_from_verified_facts(self):
        ollama = FakeOllama(
            '{"executive_summary":"Review primary care capacity using reported records.",'
            '"proposed_actions":["Review reported facility coverage.","Validate local staffing records.",'
            '"Collect missing capacity data."],"reasoning":"The supplied evidence reports facility counts '
            'but does not establish staffing or service quality."}'
        )
        service = RecommendationService(FakeStructuredData(), ollama)

        result = service.generate("Bihar", "2022-23", PRIORITIES[0])

        self.assertEqual(result["mode"], "local-ollama")
        self.assertEqual(result["facts"][0]["value"], 100)
        self.assertEqual(len(result["recommendedActions"]), 3)
        self.assertIn("source units", ollama.request[0][1]["content"])
        self.assertEqual(ollama.request[1]["response_format"], "json")

    def test_generate_rejects_numeric_claims_and_invalid_model_output(self):
        ollama = FakeOllama(
            '{"executive_summary":"Increase funding by 20 percent.",'
            '"proposed_actions":["Review records.","Validate data.","Monitor needs."],'
            '"reasoning":"The evidence is limited."}'
        )
        service = RecommendationService(FakeStructuredData(), ollama)

        with self.assertRaisesRegex(ValueError, "invalid recommendation"):
            service.generate("Bihar", "2022-23", PRIORITIES[0])

    def test_generate_surfaces_ollama_failure(self):
        service = RecommendationService(FakeStructuredData(), FakeOllama(OllamaModelMissing("missing")))

        with self.assertRaises(OllamaModelMissing):
            service.generate("Bihar", "2022-23", PRIORITIES[0])

    def test_invalid_priority_is_rejected(self):
        service = RecommendationService(FakeStructuredData(), FakeOllama("{}"))

        with self.assertRaisesRegex(ValueError, "Priority must be one of"):
            service.generate("Bihar", "2022-23", "Unsupported")


if __name__ == "__main__":
    unittest.main()

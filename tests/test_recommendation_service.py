import unittest

from api.recommendation_service import PRIORITIES, RecommendationService
from api.ollama_client import OllamaModelMissing
from api.structured_data import StructuredDataService


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
        self.calls = []

    def chat(self, messages, **kwargs):
        self.request = (messages, kwargs)
        self.calls.append(self.request)
        response = self.response.pop(0) if isinstance(self.response, list) else self.response
        if isinstance(response, Exception):
            raise response
        return response


VALID_DRAFT = (
    '{"executive_summary":"Review primary care capacity using the reported financial year.",'
    '"proposed_actions":["Review reported facility coverage.","Validate local staffing records.",'
    '"Collect missing capacity data."],"reasoning":"The supplied evidence reports facility counts '
    'but does not establish staffing or service quality."}'
)


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

        with self.assertRaisesRegex(ValueError, "valid evidence-grounded recommendation"):
            service.generate("Bihar", "2022-23", PRIORITIES[0])

    def test_fenced_json_with_surrounding_prose_and_selected_year_is_accepted(self):
        response = (
            "Here is the requested guidance:\n```json\n"
            '{"executive_summary":"For financial year 2022-23, review primary care coverage.",'
            '"proposed_actions":["Review reported facility coverage.","Validate local staffing records.",'
            '"Collect missing capacity data."],"reasoning":"The source records do not establish staffing or quality."}'
            "\n```\n"
        )
        service = RecommendationService(FakeStructuredData(), FakeOllama(response))

        result = service.generate("Bihar", "2022-23", PRIORITIES[0])

        self.assertEqual(result["status"], "generated")
        self.assertEqual(result["selectedState"], "Bihar")
        self.assertEqual(result["financialYear"], "2022-23")

    def test_invalid_model_output_gets_one_corrective_retry(self):
        ollama = FakeOllama(["not JSON", VALID_DRAFT])
        result = RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)
        self.assertEqual(result["mode"], "local-ollama")
        self.assertIn("corrected JSON", ollama.calls[1][0][-1]["content"])

    def test_invalid_output_after_retry_fails_without_success_fallback(self):
        ollama = FakeOllama(["not JSON", '{"executive_summary":"Only a summary."}'])
        service = RecommendationService(FakeStructuredData(), ollama)

        with self.assertRaisesRegex(ValueError, "after one retry"):
            service.generate("Bihar", "2022-23", PRIORITIES[0])
        self.assertEqual(len(ollama.calls), 2)

    def test_unverified_numeric_claim_is_rejected_and_corrected(self):
        unsupported = (
            '{"executive_summary":"Increase coverage by 40 percent.",'
            '"proposed_actions":["Add 40 beds.","Validate local staffing records.",'
            '"Collect missing capacity data."],"reasoning":"The evidence is limited."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        result = RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)
        self.assertEqual(result["status"], "generated")

    def test_priority_specific_spending_and_unbenchmarked_comparisons_are_rejected(self):
        unsupported = (
            '{"executive_summary":"Haryana has substantial primary healthcare expenditure.",'
            '"proposed_actions":["Review reported facility coverage.","Validate local staffing records.",'
            '"Collect missing capacity data."],"reasoning":"The evidence is limited."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)

    def test_actions_cannot_attribute_nhm_spending_to_selected_priority_or_claim_gaps(self):
        unsupported = (
            '{"executive_summary":"Review the available evidence.",'
            '"proposed_actions":["Monitor expenditure for the selected healthcare priority.",'
            '"Identify infrastructure gaps from the available counts.",'
            '"Collect missing capacity data."],"reasoning":"The records are not disaggregated by priority."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)

    def test_primary_healthcare_response_cannot_relabel_secondary_facility_counts(self):
        unsupported = (
            '{"executive_summary":"Review the reported infrastructure.",'
            '"proposed_actions":["Review PHC and CHC beds as primary-care evidence.",'
            '"Validate local staffing records.","Collect missing capacity data."],'
            '"reasoning":"The records do not establish service outcomes."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)

    def test_model_cannot_claim_benchmark_or_issues_without_evidence(self):
        unsupported = (
            '{"executive_summary":"Review the verified records.",'
            '"proposed_actions":["Monitor expenditure to keep it within a reasonable range.",'
            '"Review records to identify service gaps.","Collect missing capacity data."],'
            '"reasoning":"The records do not establish service outcomes."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)

    def test_model_cannot_present_nhm_expenditure_as_total_healthcare_spending(self):
        unsupported = (
            '{"executive_summary":"The NHM records show total expenditure on healthcare.",'
            '"proposed_actions":["Review NHM financial records.","Validate infrastructure records.",'
            '"Collect missing capacity data."],"reasoning":"The evidence is limited."}'
        )
        ollama = FakeOllama([unsupported, VALID_DRAFT])

        RecommendationService(FakeStructuredData(), ollama).generate(
            "Bihar", "2022-23", PRIORITIES[0],
        )

        self.assertEqual(len(ollama.calls), 2)

    def test_generate_surfaces_ollama_failure(self):
        service = RecommendationService(FakeStructuredData(), FakeOllama(OllamaModelMissing("missing")))

        with self.assertRaises(OllamaModelMissing):
            service.generate("Bihar", "2022-23", PRIORITIES[0])

    def test_selected_haryana_year_has_real_budget_and_infrastructure_evidence(self):
        structured = StructuredDataService()
        options = structured.recommendation_options()
        self.assertIn("2022-23", options["state_years"].get("Haryana", []))

        evidence = structured.recommendation_evidence("Haryana", "2022-23")

        self.assertEqual(evidence["state"], "Haryana")
        self.assertEqual(evidence["year"], "2022-23")
        self.assertEqual(
            {source["filename"] for source in evidence["data_sources"]},
            {"nhm_budget_long_corrected.csv", "infrastructure_state_year.csv"},
        )
        self.assertTrue(evidence["facts"])
        self.assertTrue(evidence["calculations"])

    def test_second_supported_state_and_year_have_matching_real_records(self):
        structured = StructuredDataService()
        options = structured.recommendation_options()
        state = "Andaman and Nicobar Islands"
        year = "2021-22"
        self.assertIn(year, options["state_years"].get(state, []))

        evidence = structured.recommendation_evidence(state, year)

        self.assertEqual((evidence["state"], evidence["year"]), (state, year))
        self.assertEqual(len(evidence["data_sources"]), 2)
        self.assertTrue(evidence["facts"])

    def test_invalid_priority_is_rejected(self):
        service = RecommendationService(FakeStructuredData(), FakeOllama("{}"))

        with self.assertRaisesRegex(ValueError, "Priority must be one of"):
            service.generate("Bihar", "2022-23", "Unsupported")


if __name__ == "__main__":
    unittest.main()

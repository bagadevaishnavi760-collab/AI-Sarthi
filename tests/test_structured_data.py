import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import pandas as pd

from api.structured_data import StructuredDataError, StructuredDataService, _read_csv


class StructuredDataServiceTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        _read_csv.cache_clear()

    def _write_dataset(self, environment_name, filename, rows):
        path = Path(self.temp_dir.name) / filename
        pd.DataFrame(rows).to_csv(path, index=False)
        self.addCleanup(_read_csv.cache_clear)
        return patch.dict(os.environ, {environment_name: str(path)})

    def test_nhm_state_year_filter_and_percentage(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 75,
             "Expenditure_to_Release_Pct": None},
            {"State": "Bihar", "Year": "2023-24", "Central_Release": 120, "Expenditure": 90,
             "Expenditure_to_Release_Pct": 75},
            {"State": "All India", "Year": "2022-23", "Central_Release": 500, "Expenditure": 400,
             "Expenditure_to_Release_Pct": 80},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query("NHM expenditure in Bihar in 2022-23")

        self.assertEqual(len(result["records"]), 1)
        self.assertEqual(result["records"][0]["state"], "Bihar")
        self.assertEqual(result["records"][0]["year"], "2022-23")
        self.assertEqual(result["records"][0]["expenditure_to_release_pct"], 75)
        self.assertIn("not expenditure divided by total sanctioned budget", result["records"][0]["calculation"])

    def test_aggregate_excludes_all_india_and_computes_release_percentage(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 70,
             "Expenditure_to_Release_Pct": 70},
            {"State": "Kerala", "Year": "2022-23", "Central_Release": 200, "Expenditure": 180,
             "Expenditure_to_Release_Pct": 90},
            {"State": "All India", "Year": "2022-23", "Central_Release": 300, "Expenditure": 250,
             "Expenditure_to_Release_Pct": 83.3},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query("NHM total expenditure and percentage")

        self.assertEqual({record["state"] for record in result["records"]}, {"Bihar", "Kerala"})
        values = {calc["metric"]: calc["value"] for calc in result["calculations"]}
        self.assertEqual(values["Expenditure"], 250)
        self.assertAlmostEqual(values["Expenditure_to_Release_Pct"], 250 / 300 * 100)

    def test_comparison_filters_multiple_states_and_years(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 70,
             "Expenditure_to_Release_Pct": 70},
            {"State": "Kerala", "Year": "2022-23", "Central_Release": 200, "Expenditure": 180,
             "Expenditure_to_Release_Pct": 90},
            {"State": "Bihar", "Year": "2023-24", "Central_Release": 110, "Expenditure": 80,
             "Expenditure_to_Release_Pct": 72},
            {"State": "Kerala", "Year": "2023-24", "Central_Release": 210, "Expenditure": 190,
             "Expenditure_to_Release_Pct": 90},
            {"State": "All India/Total", "Year": "2022-23", "Central_Release": 300,
             "Expenditure": 250, "Expenditure_to_Release_Pct": 83},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query(
                "Compare highest NHM expenditure in Bihar and Kerala for 2022-23 vs 2023-24"
            )

        self.assertEqual(len(result["records"]), 4)
        self.assertEqual(
            {(record["state"], record["year"]) for record in result["records"]},
            {
                ("Bihar", "2022-23"),
                ("Kerala", "2022-23"),
                ("Bihar", "2023-24"),
                ("Kerala", "2023-24"),
            },
        )
        self.assertEqual(result["records"][0]["Expenditure"], 190)

    def test_nhm_utilization_is_a_deterministic_release_ratio(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 75,
             "Expenditure_to_Release_Pct": 75},
            {"State": "Kerala", "Year": "2022-23", "Central_Release": 300, "Expenditure": 240,
             "Expenditure_to_Release_Pct": 80},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query("NHM utilization in 2022-23")

        utilization = next(
            calculation for calculation in result["calculations"]
            if calculation["metric"] == "Expenditure_to_Release_Pct"
        )
        self.assertEqual(utilization["value"], 78.75)
        self.assertIn("not expenditure divided by total sanctioned budget", utilization["method"])

    def test_missing_infrastructure_values_remain_missing(self):
        rows = [{
            "State": "Bihar", "Year": "2022-23", "SHCs": None, "PHCs": 25,
            "District_Hospitals": None, "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None,
            "District_Hospital_Beds": None, "Medical_College_Beds": None, "Total_Beds": None,
        }]
        env = self._write_dataset("INFRASTRUCTURE_CSV", "infrastructure.csv", rows)
        with env:
            result = StructuredDataService().query("total beds in Bihar in 2022-23")

        self.assertEqual(len(result["records"]), 1)
        self.assertIsNone(result["records"][0]["Total_Beds"])
        self.assertEqual(result["calculations"], [])

    def test_non_finite_expenditure_is_excluded_from_results_and_totals(self):
        rows = [{
            "State": "Bihar",
            "Year": "2022-23",
            "Central_Release": 100,
            "Expenditure": float("inf"),
            "Expenditure_to_Release_Pct": None,
        }]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query("total NHM expenditure in 2022-23")

        self.assertIsNone(result["records"][0]["Expenditure"])
        self.assertEqual(result["calculations"], [])

    def test_hmis_reporting_period_is_not_treated_as_a_year_column(self):
        rows = [{
            "Indicator": "Immunization coverage",
            "S.No.": 1,
            "Parameters": "Children immunized",
            "Type": "Count",
            "State": "Bihar",
            "Observation_Category": "Reported",
            "Value": 42,
            "Value_Numeric": 42,
            "Reporting_Period": "FY 2022-23 snapshot",
        }]
        env = self._write_dataset("HMIS_CSV", "hmis.csv", rows)
        with env:
            result = StructuredDataService().query("HMIS immunization indicator in Bihar 2022-23")

        self.assertEqual(len(result["records"]), 1)
        self.assertEqual(result["records"][0]["Reporting_Period"], "FY 2022-23 snapshot")

    def test_missing_required_columns_are_reported(self):
        env = self._write_dataset("NHM_BUDGET_CSV", "incomplete.csv", [{"State": "Bihar"}])
        with env, self.assertRaisesRegex(StructuredDataError, "missing required columns"):
            StructuredDataService().query("NHM expenditure in Bihar")

    def test_exact_duplicate_state_year_rows_do_not_double_count_and_totals_are_excluded(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 50,
             "Expenditure_to_Release_Pct": 50},
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 50,
             "Expenditure_to_Release_Pct": 50},
            {"State": "Kerala", "Year": "2022-23", "Central_Release": 200, "Expenditure": 150,
             "Expenditure_to_Release_Pct": 75},
            {"State": "All India/Total", "Year": "2022-23", "Central_Release": 300,
             "Expenditure": 200, "Expenditure_to_Release_Pct": 66.7},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env:
            result = StructuredDataService().query("NHM total expenditure in 2022-23")

        self.assertEqual({record["state"] for record in result["records"]}, {"Bihar", "Kerala"})
        expenditure = next(calc for calc in result["calculations"] if calc["metric"] == "Expenditure")
        self.assertEqual(expenditure["value"], 200)
        self.assertEqual(expenditure["records_included"], 2)

    def test_conflicting_duplicate_state_year_rows_stop_aggregation(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 50,
             "Expenditure_to_Release_Pct": 50},
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 55,
             "Expenditure_to_Release_Pct": 55},
        ]
        env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with env, self.assertRaisesRegex(StructuredDataError, "conflicting duplicate"):
            StructuredDataService().query("NHM total expenditure in 2022-23")

    def test_recommendation_matches_state_and_year_and_reports_unspecified_units(self):
        budget_env = self._write_dataset(
            "NHM_BUDGET_CSV",
            "budget.csv",
            [
                {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 75,
                 "Expenditure_to_Release_Pct": 75},
                {"State": "Bihar", "Year": "2023-24", "Central_Release": 200, "Expenditure": 100,
                 "Expenditure_to_Release_Pct": 50},
                {"State": "All India", "Year": "2022-23", "Central_Release": 300, "Expenditure": 200,
                 "Expenditure_to_Release_Pct": 66.7},
            ],
        )
        infrastructure_env = self._write_dataset(
            "INFRASTRUCTURE_CSV",
            "infrastructure.csv",
            [
                {"State": "Bihar", "Year": "2022-23", "SHCs": 10, "PHCs": 20, "District_Hospitals": 3,
                 "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None, "District_Hospital_Beds": None,
                 "Medical_College_Beds": None, "Total_Beds": None},
                {"State": "Bihar", "Year": "2023-24", "SHCs": 11, "PHCs": 21, "District_Hospitals": 4,
                 "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None, "District_Hospital_Beds": None,
                 "Medical_College_Beds": None, "Total_Beds": None},
            ],
        )
        with budget_env, infrastructure_env:
            service = StructuredDataService()
            options = service.recommendation_options()
            evidence = service.recommendation_evidence("Bihar", "2022-23")

        self.assertEqual(options["state_years"]["Bihar"], ["2022-23", "2023-24"])
        facts = {fact["metric"]: fact for fact in evidence["facts"]}
        self.assertEqual(facts["Central release"]["value"], 100)
        self.assertEqual(facts["Central release"]["unit"], "source units (not specified)")
        self.assertEqual(facts["PHCs"]["value"], 20)
        self.assertNotIn("Total Beds", facts)
        self.assertEqual(evidence["calculations"][0]["value"], 75)
        self.assertEqual(evidence["data_sources"][0]["year"], "2022-23")

    def test_recommendation_options_require_same_state_year_pair(self):
        budget_env = self._write_dataset(
            "NHM_BUDGET_CSV",
            "budget.csv",
            [{"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 75,
              "Expenditure_to_Release_Pct": 75}],
        )
        infrastructure_env = self._write_dataset(
            "INFRASTRUCTURE_CSV",
            "infrastructure.csv",
            [{"State": "Bihar", "Year": "2023-24", "SHCs": 10, "PHCs": 20, "District_Hospitals": 3,
              "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None, "District_Hospital_Beds": None,
              "Medical_College_Beds": None, "Total_Beds": None}],
        )
        with budget_env, infrastructure_env:
            options = StructuredDataService().recommendation_options()

        self.assertEqual(options["states"], [])
        self.assertEqual(options["state_years"], {})

    def test_recommendation_missing_budget_values_and_zero_denominator_are_safe(self):
        rows = [
            {"State": "Bihar", "Year": "2022-23", "Central_Release": 0, "Expenditure": 5,
             "Expenditure_to_Release_Pct": None},
        ]
        budget_env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        infrastructure_env = self._write_dataset(
            "INFRASTRUCTURE_CSV",
            "infrastructure.csv",
            [{"State": "Bihar", "Year": "2022-23", "SHCs": 10, "PHCs": 20, "District_Hospitals": 3,
              "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None, "District_Hospital_Beds": None,
              "Medical_College_Beds": None, "Total_Beds": None}],
        )
        with budget_env, infrastructure_env:
            evidence = StructuredDataService().recommendation_evidence("Bihar", "2022-23")

        self.assertEqual(evidence["calculations"], [])
        self.assertFalse(any(fact["unit"] == "%" for fact in evidence["facts"]))

        rows[0]["Expenditure"] = None
        _read_csv.cache_clear()
        budget_env = self._write_dataset("NHM_BUDGET_CSV", "budget.csv", rows)
        with budget_env, infrastructure_env:
            evidence = StructuredDataService().recommendation_evidence("Bihar", "2022-23")
        self.assertFalse(any(fact["metric"] == "Expenditure" for fact in evidence["facts"]))
        self.assertTrue(any(fact["metric"] == "PHCs" for fact in evidence["facts"]))

    def test_recommendation_excludes_non_finite_values_and_rejects_conflicting_duplicates(self):
        budget_env = self._write_dataset(
            "NHM_BUDGET_CSV",
            "budget.csv",
            [
                {"State": "Bihar", "Year": "2022-23", "Central_Release": 100,
                 "Expenditure": float("inf"), "Expenditure_to_Release_Pct": None},
                {"State": "Bihar", "Year": "2022-23", "Central_Release": 100,
                 "Expenditure": float("inf"), "Expenditure_to_Release_Pct": None},
            ],
        )
        infrastructure_env = self._write_dataset(
            "INFRASTRUCTURE_CSV",
            "infrastructure.csv",
            [{"State": "Bihar", "Year": "2022-23", "SHCs": 10, "PHCs": 20, "District_Hospitals": 3,
              "PHC_Beds": None, "CHC_Beds": None, "SDH_Beds": None, "District_Hospital_Beds": None,
              "Medical_College_Beds": None, "Total_Beds": None}],
        )
        with budget_env, infrastructure_env:
            evidence = StructuredDataService().recommendation_evidence("Bihar", "2022-23")

        self.assertFalse(any(fact["metric"] == "Expenditure" for fact in evidence["facts"]))
        self.assertFalse(any(fact["unit"] == "%" for fact in evidence["facts"]))

        conflicting_budget_env = self._write_dataset(
            "NHM_BUDGET_CSV",
            "conflicting-budget.csv",
            [
                {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 50,
                 "Expenditure_to_Release_Pct": 50},
                {"State": "Bihar", "Year": "2022-23", "Central_Release": 100, "Expenditure": 55,
                 "Expenditure_to_Release_Pct": 55},
            ],
        )
        with conflicting_budget_env, infrastructure_env, self.assertRaisesRegex(
            StructuredDataError, "conflicting duplicate"
        ):
            StructuredDataService().recommendation_evidence("Bihar", "2022-23")


if __name__ == "__main__":
    unittest.main()

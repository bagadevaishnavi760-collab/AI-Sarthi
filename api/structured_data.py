from __future__ import annotations

import math
import os
import re
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATASETS = {
    "nhm_budget": (
        "NHM budget",
        "NHM_BUDGET_CSV",
        ("nhm_budget_long_corrected.csv",),
        {"State", "Year", "Central_Release", "Expenditure", "Expenditure_to_Release_Pct"},
    ),
    "infrastructure": (
        "Healthcare infrastructure",
        "INFRASTRUCTURE_CSV",
        ("infrastructure_state_year.csv",),
        {"State", "Year", "SHCs", "PHCs", "District_Hospitals", "PHC_Beds", "CHC_Beds",
         "SDH_Beds", "District_Hospital_Beds", "Medical_College_Beds", "Total_Beds"},
    ),
    "hmis": (
        "HMIS observations",
        "HMIS_CSV",
        ("hmis_long_normalized (1).csv", "hmis_long_normalized.csv"),
        {"Indicator", "S.No.", "Parameters", "Type", "State", "Observation_Category",
         "Value", "Value_Numeric", "Reporting_Period"},
    ),
}

DATA_KEYWORDS = {
    "nhm_budget": ("nhm", "budget", "expenditure", "central release", "release", "budget utilization",
                   "utilization", "utilisation", "financial"),
    "infrastructure": ("infrastructure", "healthcare capacity", "health capacity", "beds",
                       "phc", "shc", "chc", "district hospital", "medical college"),
    "hmis": ("hmis", "indicator", "observation", "reported", "reporting period", "health indicator"),
}
ORDERED_METRICS = {
    "nhm_budget": [
        "Central_Release", "Expenditure", "Expenditure_to_Release_Pct",
    ],
    "infrastructure": [
        "SHCs", "PHCs", "District_Hospitals", "PHC_Beds", "CHC_Beds", "SDH_Beds",
        "District_Hospital_Beds", "Medical_College_Beds", "Total_Beds",
    ],
    "hmis": [
        "Indicator", "S.No.", "Parameters", "Type", "Observation_Category", "Value",
        "Value_Numeric", "Reporting_Period",
    ],
}


class StructuredDataError(RuntimeError):
    pass


def _configured_path(environment_name: str, names: tuple[str, ...]) -> Path | None:
    configured = os.getenv(environment_name)
    if configured:
        candidate = Path(configured)
        resolved = candidate if candidate.is_absolute() else PROJECT_ROOT / candidate
        return resolved.resolve() if resolved.is_file() else None
    candidates = []
    for name in names:
        candidates.extend((PROJECT_ROOT / name, PROJECT_ROOT / "data" / "cleaned" / name))
    for candidate in candidates:
        resolved = candidate if candidate.is_absolute() else PROJECT_ROOT / candidate
        if resolved.is_file():
            return resolved.resolve()
    return None


@lru_cache(maxsize=6)
def _read_csv(path: str, modified_ns: int, size: int) -> pd.DataFrame:
    del modified_ns, size
    try:
        return pd.read_csv(path, low_memory=False)
    except (OSError, UnicodeError, pd.errors.ParserError) as exc:
        raise StructuredDataError(f"Could not read configured structured dataset: {Path(path).name}") from exc


def _state_key(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value).strip()).casefold()


def _is_total_state(value: Any) -> bool:
    normalized = re.sub(r"[^a-z]+", " ", str(value).casefold()).strip()
    return normalized == "total" or normalized.startswith("all india")


def _state_matches_question(name: str, question: str) -> bool:
    normalized = re.sub(r"[^a-z]+", " ", name.casefold()).strip()
    if normalized.startswith("all india"):
        return bool(re.search(r"(?<!\w)all\s+india(?!\w)", question, re.I))
    if normalized == "total":
        return bool(re.search(r"(?<!\w)total\s+row(?!\w)", question, re.I))
    return bool(re.search(rf"(?<!\w){re.escape(name)}(?!\w)", question, re.I))


class StructuredDataService:
    def recommendation_options(self) -> dict[str, Any]:
        budget, budget_path = self._recommendation_dataset("nhm_budget")
        infrastructure, infrastructure_path = self._recommendation_dataset("infrastructure")
        budget_pairs = {
            (_state_key(row.State), str(row.Year).strip())
            for row in budget.itertuples()
            if not _is_total_state(row.State)
        }
        infrastructure_pairs = {
            (_state_key(row.State), str(row.Year).strip())
            for row in infrastructure.itertuples()
            if not _is_total_state(row.State)
            and any(_numeric(getattr(row, metric, None)) is not None for metric in ORDERED_METRICS["infrastructure"])
        }
        valid_pairs = budget_pairs & infrastructure_pairs
        names_by_key = {
            _state_key(state): str(state).strip()
            for state in budget["State"].dropna().unique()
        }
        state_years: dict[str, list[str]] = {}
        for state_key, year in valid_pairs:
            state_years.setdefault(names_by_key[state_key], []).append(year)
        for years in state_years.values():
            years.sort()
        return {
            "states": sorted(state_years),
            "state_years": state_years,
            "sources": [
                {"dataset": DATASETS["nhm_budget"][0], "filename": budget_path.name},
                {"dataset": DATASETS["infrastructure"][0], "filename": infrastructure_path.name},
            ],
        }

    def recommendation_evidence(self, state: str, year: str) -> dict[str, Any]:
        budget, budget_path = self._recommendation_dataset("nhm_budget")
        infrastructure, infrastructure_path = self._recommendation_dataset("infrastructure")
        selected_budget = budget[
            budget["State"].map(_state_key).eq(_state_key(state))
            & budget["Year"].astype(str).str.strip().eq(year)
            & ~budget["State"].map(_is_total_state)
        ]
        selected_infrastructure = infrastructure[
            infrastructure["State"].map(_state_key).eq(_state_key(state))
            & infrastructure["Year"].astype(str).str.strip().eq(year)
            & ~infrastructure["State"].map(_is_total_state)
        ]
        if selected_budget.empty or selected_infrastructure.empty:
            raise StructuredDataError(
                f"No matching budget and infrastructure evidence is available for {state} in {year}."
            )

        budget_row = selected_budget.iloc[0]
        infrastructure_row = selected_infrastructure.iloc[0]
        release = _numeric(budget_row.get("Central_Release"))
        expenditure = _numeric(budget_row.get("Expenditure"))
        facts = []
        if release is not None:
            facts.append({
                "metric": "Central release",
                "value": release,
                "unit": "source units (not specified)",
                "source_file": budget_path.name,
            })
        if expenditure is not None:
            facts.append({
                "metric": "Expenditure",
                "value": expenditure,
                "unit": "source units (not specified)",
                "source_file": budget_path.name,
            })
        calculations = []
        if release is not None and expenditure is not None and release != 0:
            percentage = expenditure / release * 100
            if math.isfinite(percentage):
                facts.append({
                    "metric": "Expenditure as a share of central release",
                    "value": percentage,
                    "unit": "%",
                    "source_file": budget_path.name,
                })
                calculations.append({
                    "metric": "Expenditure-to-release percentage",
                    "value": percentage,
                    "formula": "Expenditure ÷ Central_Release × 100",
                    "source_file": budget_path.name,
                    "limitation": "This percentage is not expenditure as a share of the total sanctioned budget.",
                })
        infrastructure_metrics = [
            metric for metric in ORDERED_METRICS["infrastructure"]
            if metric not in {"State", "Year"}
        ]
        for metric in infrastructure_metrics:
            value = _numeric(infrastructure_row.get(metric))
            if value is not None:
                facts.append({
                    "metric": metric.replace("_", " "),
                    "value": value,
                    "unit": "count",
                    "source_file": infrastructure_path.name,
                })
        if not facts:
            raise StructuredDataError(
                f"No valid numeric budget or infrastructure evidence is available for {state} in {year}."
            )
        limitations = [
            "Budget and infrastructure observations are matched to the same state and financial year.",
            "Blank infrastructure values are omitted as missing observations, not treated as zero.",
            "Missing or non-finite budget values are omitted; the expenditure-to-release calculation is not shown unless both inputs and a non-zero release are available.",
            "The datasets describe NHM financial progress and reported infrastructure; they do not establish causal effects or prescribe an official allocation.",
            "NHM financial records are not disaggregated by the selected healthcare priority and must not be described as priority-specific expenditure.",
            "NHM expenditure is not total public healthcare expenditure.",
            "The datasets do not report staffing, service utilization, patient outcomes, population need, or comparison benchmarks.",
            "Proposed actions are local-model-generated decision support and require verification by authorized officials.",
        ]
        return {
            "state": state,
            "year": year,
            "facts": facts,
            "calculations": calculations,
            "data_sources": [
                {"dataset": DATASETS["nhm_budget"][0], "filename": budget_path.name, "year": year},
                {"dataset": DATASETS["infrastructure"][0], "filename": infrastructure_path.name, "year": year},
            ],
            "limitations": limitations,
        }

    def _recommendation_dataset(self, key: str) -> tuple[pd.DataFrame, Path]:
        _, env_name, filenames, required = DATASETS[key]
        path = _configured_path(env_name, filenames)
        if path is None:
            raise StructuredDataError(
                f"{DATASETS[key][0]} CSV is not available in the configured project data directories."
            )
        data = _read_csv(str(path), path.stat().st_mtime_ns, path.stat().st_size)
        missing_columns = required.difference(data.columns)
        if missing_columns:
            raise StructuredDataError(
                f"{path.name} is missing required columns: {', '.join(sorted(missing_columns))}"
            )
        if "Year" not in data.columns or "State" not in data.columns:
            raise StructuredDataError(f"{path.name} must contain State and Year columns.")
        return self._validate_state_year_rows(key, data, path.name), path

    def query(self, question: str) -> dict[str, Any]:
        lowered = question.casefold()
        selected = [
            key for key, terms in DATA_KEYWORDS.items()
            if any(term in lowered for term in terms)
        ]
        if not selected:
            return {"records": [], "data_sources": [], "limitations": []}

        records: list[dict[str, Any]] = []
        sources: list[dict[str, Any]] = []
        limitations: list[str] = []
        calculations: list[dict[str, Any]] = []
        for key in selected:
            title, env_name, filenames, required = DATASETS[key]
            path = _configured_path(env_name, filenames)
            if path is None:
                limitations.append(f"{title} CSV is not available in the configured project data directories.")
                continue
            data = _read_csv(str(path), path.stat().st_mtime_ns, path.stat().st_size)
            missing_columns = required.difference(data.columns)
            if missing_columns:
                raise StructuredDataError(
                    f"{path.name} is missing required columns: {', '.join(sorted(missing_columns))}"
                )

            filtered = self._filter_rows(key, data, question)
            if filtered.empty:
                continue
            filtered = self._validate_state_year_rows(key, filtered, path.name)
            dataset_calculations = self._calculations(key, filtered, question)
            for calculation in dataset_calculations:
                calculation["source_file"] = path.name
            calculations.extend(dataset_calculations)
            selected_rows = filtered.head(12)
            if len(filtered) > len(selected_rows):
                limitations.append(
                    f"{title} query matched {len(filtered)} rows; only the first {len(selected_rows)} are supplied as evidence."
                )
            for _, row in selected_rows.iterrows():
                record = self._normalize_record(key, row, path.name)
                records.append(record)
            sources.append({
                "dataset": title,
                "filename": path.name,
                "evidence_type": "structured_dataset",
                "provenance": f"Project CSV: {path.name}",
                "record_count": len(selected_rows),
                "fields": [str(column) for column in selected_rows.columns],
                "metrics": self._metric_definitions(key),
            })
        return {
            "records": records,
            "data_sources": sources,
            "calculations": calculations,
            "limitations": limitations,
        }

    @staticmethod
    def _validate_state_year_rows(key: str, frame: pd.DataFrame, filename: str) -> pd.DataFrame:
        if key not in {"nhm_budget", "infrastructure"} or frame.empty:
            return frame
        duplicates_to_remove = []
        for _, group in frame.groupby(["State", "Year"], dropna=False, sort=False):
            if len(group) < 2:
                continue
            unique_rows = group.drop_duplicates()
            if len(unique_rows) > 1:
                state = group.iloc[0]["State"]
                year = group.iloc[0]["Year"]
                raise StructuredDataError(
                    f"{filename} has conflicting duplicate {state}/{year} rows; "
                    "aggregation was stopped to avoid double-counting."
                )
            duplicates_to_remove.extend(group.index[1:])
        return frame.drop(index=duplicates_to_remove)

    def _filter_rows(self, key: str, frame: pd.DataFrame, question: str) -> pd.DataFrame:
        result = frame.copy()
        state_names = sorted(
            (str(name).strip() for name in frame["State"].dropna().unique()),
            key=len,
            reverse=True,
        )
        matched_states = [
            name for name in state_names
            if _state_matches_question(name, question)
        ]
        if matched_states:
            normalized_states = {_state_key(name) for name in matched_states}
            result = result[result["State"].map(_state_key).isin(normalized_states)]
        else:
            result = result[
                ~result["State"].map(_is_total_state)
            ]

        year_matches = re.findall(r"\b(?:19|20)\d{2}(?:\s*[-/]\s*(?:19|20)?\d{2})?\b", question)
        if year_matches and "Year" in result.columns:
            years = {
                re.sub(r"\s+", "", year).replace("/", "-").casefold()
                for year in year_matches
            }
            year_series = result["Year"].astype(str).str.replace(r"\s+", "", regex=True).str.replace("/", "-", regex=False)
            result = result[year_series.str.casefold().isin(years)]

        if key == "hmis":
            state_names = {
                str(name).strip().casefold()
                for name in frame["State"].dropna().unique()
            }
            year_text = year_matches
            query_terms = [
                term for term in re.findall(r"[a-zA-Z][a-zA-Z0-9-]+", question.casefold())
                if term not in {"what", "which", "show", "tell", "about", "hmis", "reported", "indicator"}
                and term not in {
                    "india", "state", "year", "during", "from", "the", "with", "and", "for",
                    "are", "was", "were", "how", "many", "does", "have", "in", "on", "of",
                }
                and term not in state_names
                and not term.isdigit()
                and not any(term in year.casefold() for year in year_text)
            ]
            if query_terms:
                searchable = (
                    result["Indicator"].fillna("").astype(str) + " " +
                    result["Parameters"].fillna("").astype(str) + " " +
                    result["Observation_Category"].fillna("").astype(str)
                ).str.casefold()
                scores = searchable.map(lambda value: sum(term in value for term in query_terms))
                result = result[scores > 0].assign(_query_score=scores[scores > 0]).sort_values(
                    "_query_score", ascending=False, kind="stable"
                ).drop(columns="_query_score")
            else:
                result = result.iloc[0:0]
        elif key == "infrastructure":
            metric_terms = {
                column.casefold().replace("_", " "): column
                for column in required_column_order(key)
                if column not in {"State", "Year"}
            }
            matched_metrics = [column for label, column in metric_terms.items() if label in question.casefold()]
            if matched_metrics:
                result = result[["State", "Year", *matched_metrics]]
        if self._asks_for_ranking(question):
            metric = self._ranking_metric(key, question, result.columns)
            if metric:
                result = result.sort_values(metric, ascending=not any(
                    word in question.casefold() for word in ("highest", "top", "most", "maximum", "largest")
                ), na_position="last", kind="stable")
                top_count = re.search(r"\btop\s+(\d+)\b", question, re.I)
                if top_count:
                    result = result.head(min(int(top_count.group(1)), 12))
        return result

    def _calculations(self, key: str, frame: pd.DataFrame, question: str) -> list[dict[str, Any]]:
        lowered = question.casefold()
        aggregate_requested = any(term in lowered for term in ("total", "overall", "aggregate", "sum"))
        trend_requested = "trend" in lowered
        ratio_requested = any(term in lowered for term in ("percent", "percentage", "utilization", "utilisation"))
        if not aggregate_requested and not trend_requested and not ratio_requested:
            return []
        metrics = []
        if key == "nhm_budget":
            if (
                "expenditure" in lowered
                or "utilization" in lowered
                or "utilisation" in lowered
                or (trend_requested and not any(term in lowered for term in ("release", "budget")))
            ):
                metrics.append("Expenditure")
            if "release" in lowered or "budget" in lowered or "allocation" in lowered:
                metrics.append("Central_Release")
        elif key == "infrastructure":
            requested = [
                column for column in required_column_order(key)
                if column.replace("_", " ").casefold() in lowered
            ]
            metrics.extend(requested)
            if not metrics and "bed" in question.casefold():
                metrics.append("Total_Beds")
        results = []
        group_columns = ["Year"] if "Year" in frame.columns else []
        grouped = list(frame.groupby(group_columns[0], dropna=False)) if group_columns else [(None, frame)]
        for period, group in grouped:
            for metric in metrics:
                values = pd.to_numeric(group[metric], errors="coerce")
                values = values.where(values.map(lambda value: pd.isna(value) or math.isfinite(float(value))))
                available = values.notna()
                if not available.any():
                    continue
                results.append({
                    "metric": metric,
                    "year": _json_value(period) if period is not None else None,
                    "value": float(values[available].sum()),
                    "records_included": int(available.sum()),
                    "missing_values_excluded": int(values.isna().sum()),
                    "method": (
                        f"Sum of {metric} over matching source rows; All India/Total rows are excluded "
                        "from state aggregation. Missing values are excluded, not treated as zero."
                    ),
                    "provenance": "Source CSV rows, filtered by the question",
                })
        if key == "nhm_budget" and {"Expenditure", "Central_Release"}.issubset(frame.columns):
            if ratio_requested:
                for period, group in grouped:
                    pairs = group[["Expenditure", "Central_Release"]].apply(
                        pd.to_numeric, errors="coerce"
                    ).dropna()
                    release_sum = pairs["Central_Release"].sum()
                    if not release_sum:
                        continue
                    results.append({
                        "metric": "Expenditure_to_Release_Pct",
                        "year": _json_value(period) if period is not None else None,
                        "value": float(pairs["Expenditure"].sum() / release_sum * 100),
                        "records_included": len(pairs),
                        "method": (
                            "Sum of expenditure divided by sum of central release, multiplied by 100. "
                            "This is not expenditure divided by total sanctioned budget."
                        ),
                        "provenance": "Source CSV rows, excluding All India/Total rows from state aggregation",
                    })
        return results

    @staticmethod
    def _asks_for_ranking(question: str) -> bool:
        return any(word in question.casefold() for word in (
            "highest", "lowest", "top", "bottom", "rank", "most", "least", "largest", "smallest",
        ))

    @staticmethod
    def _ranking_metric(key: str, question: str, columns: Any) -> str | None:
        lowered = question.casefold()
        if key == "nhm_budget":
            if any(term in lowered for term in ("percent", "percentage", "utilization", "utilisation", "pct")):
                if "Expenditure_to_Release_Pct" in columns:
                    return "Expenditure_to_Release_Pct"
            if "release" in lowered or "allocation" in lowered:
                if "Central_Release" in columns:
                    return "Central_Release"
            if "expenditure" in lowered and "Expenditure" in columns:
                return "Expenditure"
        candidates = {
            "nhm_budget": ("Expenditure", "Central_Release", "Expenditure_to_Release_Pct"),
            "infrastructure": (
                "Total_Beds", "Medical_College_Beds", "District_Hospital_Beds", "SDH_Beds",
                "CHC_Beds", "PHC_Beds", "District_Hospitals", "PHCs", "SHCs",
            ),
            "hmis": ("Value_Numeric",),
        }[key]
        for metric in candidates:
            label = metric.replace("_", " ").casefold()
            if metric in columns and (label in lowered or metric.casefold() in lowered):
                return metric
        for metric in candidates:
            if metric in columns:
                return metric
        return None

    def _normalize_record(self, key: str, row: pd.Series, filename: str) -> dict[str, Any]:
        result = {str(column): _json_value(value) for column, value in row.items() if not str(column).startswith("_")}
        original_state = str(result.get("State", ""))
        result["state"] = original_state
        result["year"] = result.get("Year")
        result["provenance"] = filename
        if key == "nhm_budget":
            expenditure = _numeric(result.get("Expenditure"))
            release = _numeric(result.get("Central_Release"))
            percentage = _numeric(result.get("Expenditure_to_Release_Pct"))
            if percentage is None and expenditure is not None and release not in (None, 0):
                percentage = expenditure / release * 100
                result["calculation"] = (
                    "Expenditure divided by central release, multiplied by 100; "
                    "this is not expenditure divided by total sanctioned budget."
                )
            if percentage is not None:
                result["expenditure_to_release_pct"] = percentage
        return result

    @staticmethod
    def _metric_definitions(key: str) -> list[str]:
        if key == "nhm_budget":
            return [
                "Expenditure_to_Release_Pct is expenditure as a percentage of Central_Release, "
                "not expenditure as a percentage of total sanctioned budget."
            ]
        if key == "infrastructure":
            return ["Blank numeric cells are missing observations, not zero."]
        return ["Value_Numeric is the parsed numeric value; Reporting_Period is preserved verbatim."]


def required_column_order(key: str) -> list[str]:
    return ORDERED_METRICS[key]


def _numeric(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None
    return numeric if math.isfinite(numeric) else None


def _json_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        value = value.item()
    if isinstance(value, (float, int)) and not isinstance(value, bool) and not math.isfinite(value):
        return None
    return value

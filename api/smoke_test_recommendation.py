from __future__ import annotations

import argparse
import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from api.app import RecommendationRequest, RecommendationResponse
from api.recommendation_service import PRIORITIES
from api.structured_data import StructuredDataService


def run_smoke_test(base_url: str, state: str, year: str, priority: str) -> dict[str, object]:
    selection = RecommendationRequest(state=state, year=year, priority=priority)
    structured_data = StructuredDataService()
    options = structured_data.recommendation_options()
    canonical_state = next(
        (available for available in options["states"] if available.casefold() == selection.state.casefold()),
        None,
    )
    if canonical_state is None or selection.year not in options["state_years"].get(canonical_state, []):
        raise RuntimeError(
            f"No matching budget and infrastructure records are available for {selection.state} in {selection.year}."
        )
    selection.state = canonical_state
    expected = structured_data.recommendation_evidence(selection.state, selection.year)
    request = Request(
        f"{base_url.rstrip('/')}/api/recommend",
        data=json.dumps(selection.model_dump()).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=200) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Recommendation API returned HTTP {exc.code}: {detail}") from exc
    except (TimeoutError, URLError) as exc:
        raise RuntimeError(f"Could not reach recommendation API at {base_url}: {exc}") from exc

    result = RecommendationResponse.model_validate(payload)
    if result.mode != "local-ollama" or result.status != "generated":
        raise RuntimeError("API did not return a successfully generated local-model recommendation.")
    if (
        result.selectedState != selection.state
        or result.financialYear != selection.year
        or result.priorityClassification != selection.priority
    ):
        raise RuntimeError("API recommendation does not match the requested state, year, and priority.")
    if result.facts != expected["facts"] or result.calculations != expected["calculations"]:
        raise RuntimeError("API recommendation facts or calculations do not match the selected CSV records.")
    if {source["filename"] for source in result.dataSources} != {
        source["filename"] for source in expected["data_sources"]
    }:
        raise RuntimeError("API recommendation sources do not match the selected CSV files.")
    return {
        "status": result.status,
        "mode": result.mode,
        "state": result.selectedState,
        "year": result.financialYear,
        "priority": result.priorityClassification,
        "summary": result.executiveSummary,
        "actions": result.recommendedActions,
        "source_files": [source["filename"] for source in result.dataSources],
        "csv_facts_and_calculations_verified": True,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Smoke-test a live recommendation against the real CSV data and local Ollama."
    )
    parser.add_argument("--api-url", default=os.getenv("AI_SARTHI_API_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--state", default="Haryana")
    parser.add_argument("--year", default="2022-23")
    parser.add_argument("--priority", choices=PRIORITIES, default=PRIORITIES[0])
    args = parser.parse_args()
    try:
        result = run_smoke_test(args.api_url, args.state, args.year, args.priority)
    except (RuntimeError, ValueError) as exc:
        parser.exit(1, f"Recommendation smoke test failed: {exc}\n")
    print(json.dumps(result, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()

"""
Reusable inference module for the Health Budget ML project.

Final V1 model:
    Linear Regression pipeline saved at models/budget_model.joblib

This module is intentionally limited to inference. Model training remains
inside the notebooks.
"""

from pathlib import Path
from typing import Union

import joblib
import pandas as pd


# ---------------------------------------------------------------------
# Project paths
# ---------------------------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_PATH = PROJECT_ROOT / "models" / "budget_model.joblib"


# ---------------------------------------------------------------------
# Model contract
# ---------------------------------------------------------------------

TARGET_COLUMN = "Expenditure"

PREDICTOR_COLUMNS = [
    "State",
    "Year_Numeric",
    "Central_Release",
    "Previous_Year_Expenditure",
    "Previous_Year_Central_Release",
]


# ---------------------------------------------------------------------
# Load the final trained pipeline
# ---------------------------------------------------------------------

def load_model():
    """Load and return the final trained Linear Regression pipeline."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model artifact not found: {MODEL_PATH}"
        )

    return joblib.load(MODEL_PATH)


# ---------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------

def predict_budget(
    state: str,
    year_numeric: Union[int, float],
    central_release: Union[int, float],
    previous_year_expenditure: Union[int, float],
    previous_year_central_release: Union[int, float],
) -> float:
    """
    Predict healthcare expenditure for one state-year observation.

    The saved joblib artifact contains the preprocessing pipeline
    (State encoding + numeric scaling) and the Linear Regression model,
    so preprocessing should NOT be duplicated here.
    """

    input_data = pd.DataFrame(
        [
            {
                "State": state,
                "Year_Numeric": year_numeric,
                "Central_Release": central_release,
                "Previous_Year_Expenditure": previous_year_expenditure,
                "Previous_Year_Central_Release": previous_year_central_release,
            }
        ]
    )

    # Ensure the exact feature order expected by the trained pipeline.
    input_data = input_data[PREDICTOR_COLUMNS]

    model = load_model()

    prediction = model.predict(input_data)[0]

    return float(prediction)


# ---------------------------------------------------------------------
# Simple local test
# ---------------------------------------------------------------------

if __name__ == "__main__":
    # Replace these values with a real row from
    # data/processed/budget_features.csv for validation.
    result = predict_budget(
        state="Odisha",
        year_numeric=2025,
        central_release=5000000000,
        previous_year_expenditure=3500000000,
        previous_year_central_release=4800000000,
    )

    print(f"Predicted Expenditure: {result:,.2f}")

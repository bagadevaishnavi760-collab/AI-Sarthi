"""
Automated validation for the Health Budget Linear Regression model.

Run from the project root:
    python src/validate_model.py

Expected files:
    data/processed/budget_features.csv
    models/budget_model.joblib
"""

from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "budget_features.csv"
MODEL_PATH = PROJECT_ROOT / "models" / "budget_model.joblib"
OUTPUT_PATH = PROJECT_ROOT / "validation_report.csv"

FEATURES = [
    "State",
    "Year_Numeric",
    "Central_Release",
    "Previous_Year_Expenditure",
    "Previous_Year_Central_Release",
]
TARGET = "Expenditure"


def main():
    df = pd.read_csv(DATA_PATH)

    valid = df.dropna(subset=FEATURES + [TARGET]).copy()

    model = joblib.load(MODEL_PATH)

    X = valid[FEATURES]
    y_actual = valid[TARGET]

    y_pred = model.predict(X)

    mae = mean_absolute_error(y_actual, y_pred)
    rmse = np.sqrt(mean_squared_error(y_actual, y_pred))
    r2 = r2_score(y_actual, y_pred)

    nonzero = y_actual != 0
    mape = (
        np.mean(
            np.abs(
                (y_actual[nonzero] - y_pred[nonzero])
                / y_actual[nonzero]
            )
        )
        * 100
    )

    results = valid[["State", "Year_Numeric", TARGET]].copy()
    results["Predicted_Expenditure"] = y_pred
    results["Absolute_Error"] = np.abs(
        results[TARGET] - results["Predicted_Expenditure"]
    )
    results["Absolute_Percentage_Error"] = np.where(
        results[TARGET] != 0,
        results["Absolute_Error"] / np.abs(results[TARGET]) * 100,
        np.nan,
    )

    results.to_csv(OUTPUT_PATH, index=False)

    print("=" * 55)
    print("HEALTH BUDGET MODEL VALIDATION")
    print("=" * 55)
    print(f"Valid observations : {len(valid)}")
    print(f"MAE                : {mae:.4f}")
    print(f"RMSE               : {rmse:.4f}")
    print(f"MAPE               : {mape:.2f}%")
    print(f"R²                 : {r2:.4f}")
    print(f"Report saved to    : {OUTPUT_PATH}")
    print("=" * 55)


if __name__ == "__main__":
    main()

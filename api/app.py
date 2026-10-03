from fastapi import FastAPI, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.database import Base, engine, get_db
from src.models import Prediction
from src.prediction import predict_budget


# Create database tables if they don't already exist
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Health Budget Prediction API",
    description="API for healthcare expenditure prediction",
    version="1.0.0"
)


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class PredictionRequest(BaseModel):
    state: str
    year_numeric: int
    central_release: float = Field(ge=0)
    previous_year_expenditure: float = Field(ge=0)
    previous_year_central_release: float = Field(ge=0)


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "Health Budget Prediction API",
        "model": "Linear Regression"
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.post("/predict")
def predict(
    request: PredictionRequest,
    db: Session = Depends(get_db)
):
    # Run ML prediction
    predicted_expenditure = predict_budget(
        state=request.state,
        year_numeric=request.year_numeric,
        central_release=request.central_release,
        previous_year_expenditure=request.previous_year_expenditure,
        previous_year_central_release=request.previous_year_central_release,
    )

    # Save prediction to PostgreSQL
    prediction_record = Prediction(
        state=request.state,
        year_numeric=request.year_numeric,
        central_release=request.central_release,
        previous_year_expenditure=request.previous_year_expenditure,
        previous_year_central_release=request.previous_year_central_release,
        predicted_expenditure=predicted_expenditure,
        model="Linear Regression",
    )

    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    # Return API response
    return {
        "state": request.state,
        "year_numeric": request.year_numeric,
        "predicted_expenditure": predicted_expenditure,
        "model": "Linear Regression",
        "status": "success",
        "prediction_id": prediction_record.id
    }
  
# ---------------------------------------------------------
# Prediction History
# ---------------------------------------------------------

@app.get("/predictions")
def get_predictions(
    state: str | None = Query(default=None),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction)

    # Optional state filter
    if state:
        query = query.filter(Prediction.state == state)

    # Newest predictions first
    predictions = (
        query
        .order_by(Prediction.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        {
            "id": prediction.id,
            "state": prediction.state,
            "year_numeric": prediction.year_numeric,
            "central_release": prediction.central_release,
            "previous_year_expenditure": prediction.previous_year_expenditure,
            "previous_year_central_release": prediction.previous_year_central_release,
            "predicted_expenditure": prediction.predicted_expenditure,
            "model": prediction.model,
            "created_at": prediction.created_at,
        }
        for prediction in predictions
    ]
# ---------------------------------------------------------
# Get one prediction by ID
# ---------------------------------------------------------

@app.get("/predictions/{prediction_id}")
def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    prediction = (
        db.query(Prediction)
        .filter(Prediction.id == prediction_id)
        .first()
    )

    if prediction is None:
        raise HTTPException(
            status_code=404,
            detail="Prediction not found"
        )

    return {
        "id": prediction.id,
        "state": prediction.state,
        "year_numeric": prediction.year_numeric,
        "central_release": prediction.central_release,
        "previous_year_expenditure": prediction.previous_year_expenditure,
        "previous_year_central_release": prediction.previous_year_central_release,
        "predicted_expenditure": prediction.predicted_expenditure,
        "model": prediction.model,
        "created_at": prediction.created_at,
    }
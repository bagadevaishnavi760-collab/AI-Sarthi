
from contextlib import asynccontextmanager
import logging
import platform
import re
import sys
from typing import Any, Literal

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session


from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.orm import Session
import os
import uuid

from src.database import get_db
from src.models import Prediction
from src.prediction import predict_budget
from api.ollama_client import OllamaError
from api.recommendation_service import PRIORITIES, RecommendationService
from api.rag_service import ModelUnavailable, RAGError, RAGService
from api.structured_data import StructuredDataError


LOGGER = logging.getLogger("uvicorn.error")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    LOGGER.info("AI Sarthi API Python runtime: executable=%s version=%s", sys.executable, platform.python_version())
    yield


app = FastAPI(
    title="AI Sarthi API",
    description="Healthcare budget prediction and local document intelligence",
    version="1.1.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

cors_origins = {
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
}
cors_origins.discard("*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(cors_origins),
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
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


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    session_id: str | None = Field(default=None, max_length=128)

    @field_validator("question")
    @classmethod
    def question_must_not_be_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question must not be empty.")
        return value


class RecommendationRequest(BaseModel):
    state: str = Field(min_length=1, max_length=100)
    year: str = Field(min_length=1, max_length=32)
    priority: str

    @field_validator("state")
    @classmethod
    def normalize_state(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("State must not be blank.")
        return cleaned

    @field_validator("year")
    @classmethod
    def normalize_year(cls, value: str) -> str:
        match = re.fullmatch(r"((?:19|20)\d{2})\s*[-/]\s*((?:19|20)?\d{2})", value.strip())
        if not match:
            raise ValueError("Year must be a financial year such as 2022-23.")
        start, end = match.groups()
        expected_end = str(int(start) + 1)
        if end not in {expected_end, expected_end[-2:]}:
            raise ValueError("Financial year must span consecutive years.")
        return f"{start}-{expected_end[-2:]}"

    @field_validator("priority")
    @classmethod
    def normalize_priority(cls, value: str) -> str:
        cleaned = value.strip()
        canonical = next((priority for priority in PRIORITIES if priority.casefold() == cleaned.casefold()), None)
        if canonical is None:
            raise ValueError(f"Priority must be one of: {', '.join(PRIORITIES)}.")
        return canonical

    model_config = {"extra": "forbid"}


class RecommendationResponse(BaseModel):
    priorityClassification: str
    selectedState: str
    financialYear: str
    executiveSummary: str
    recommendedActions: list[str] = Field(min_length=3, max_length=5)
    suggestedAllocationFocus: list[dict[str, Any]]
    supportingReasoning: str
    facts: list[dict[str, Any]]
    calculations: list[dict[str, Any]]
    dataSources: list[dict[str, Any]]
    assumptionsAndLimitations: list[str]
    mode: Literal["local-ollama"]
    status: Literal["generated"]


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
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Health Budget Prediction API",
        "model": "Linear Regression",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "service": "AI Sarthi API"}


@app.get("/api/rag/health")
def rag_health():
    return RAGService().health()


@app.get("/api/documents")
def indexed_documents():
    return {"documents": RAGService().documents()}


@app.post("/api/chat")
def chat(request: ChatRequest):
    try:
        result = RAGService().answer(request.question)
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ModelUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RAGError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except StructuredDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    return {
        **result,
        "session_id": request.session_id or str(uuid.uuid4()),
    }


@app.get("/api/recommend/options")
def recommendation_options():
    try:
        return RecommendationService().options()
    except StructuredDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/api/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest):
    service = RecommendationService()
    try:
        options = service.options()
        canonical_state = next(
            (state for state in options["states"] if state.casefold() == request.state.casefold()),
            None,
        )
        supported_years = options["state_years"].get(canonical_state, []) if canonical_state else []
        if canonical_state is None or request.year not in supported_years:
            raise HTTPException(
                status_code=422,
                detail=f"No matching budget and infrastructure data is available for {request.state} in {request.year}.",
            )
        return service.generate(canonical_state, request.year, request.priority)
    except OllamaError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except StructuredDataError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


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

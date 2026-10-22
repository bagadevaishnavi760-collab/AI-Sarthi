import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from pathlib import Path


load_dotenv(Path(__file__).resolve().parents[1] / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")
engine = None

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


def get_db():
    global engine
    if not DATABASE_URL:
        raise HTTPException(
            status_code=503,
            detail="Prediction database is unavailable; configure DATABASE_URL to use prediction endpoints.",
        )
    try:
        if engine is None:
            engine = create_engine(DATABASE_URL)
        Base.metadata.create_all(bind=engine)
        db = SessionLocal(bind=engine)
    except (SQLAlchemyError, ModuleNotFoundError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Prediction database is unavailable.",
        ) from exc
    try:
        yield db
    finally:
        db.close()
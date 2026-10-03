from sqlalchemy import Column, Integer, Float, String, DateTime
from sqlalchemy.sql import func

from .database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    state = Column(String, nullable=False)
    year_numeric = Column(Integer, nullable=False)

    central_release = Column(Float, nullable=False)
    previous_year_expenditure = Column(Float, nullable=False)
    previous_year_central_release = Column(Float, nullable=False)

    predicted_expenditure = Column(Float, nullable=False)

    model = Column(String, default="Linear Regression")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
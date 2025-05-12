# app/core/dependencies.py
from sqlalchemy.orm import Session
from typing import Generator
from app.models.database import SessionLocal



def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

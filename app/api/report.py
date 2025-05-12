# app/api/report.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.dependencies import get_db
from app.models.models import Report

# Pydantic-схемы для работы с Report
class ReportCreate(BaseModel):
    schedule_id: int
    description: Optional[str] = None

class ReportUpdate(BaseModel):
    schedule_id: Optional[int] = None
    description: Optional[str] = None

class ReportOut(BaseModel):
    report_id: int
    schedule_id: int
    description: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

router = APIRouter()

@router.get("/reports", response_model=List[ReportOut])
def get_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).all()
    return [
        ReportOut(
            report_id=r.Report_ID,
            schedule_id=r.Schedule_ID,
            description=r.Description
        ) for r in reports
    ]

@router.post("/reports", response_model=ReportOut)
def create_report(report_in: ReportCreate, db: Session = Depends(get_db)):
    new_report = Report(
        Schedule_ID=report_in.schedule_id,
        Description=report_in.description
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return ReportOut(
        report_id=new_report.Report_ID,
        schedule_id=new_report.Schedule_ID,
        description=new_report.Description
    )

@router.put("/reports/{report_id}", response_model=ReportOut)
def update_report(report_id: int, report_in: ReportUpdate, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.Report_ID == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    if report_in.schedule_id is not None:
        report.Schedule_ID = report_in.schedule_id
    if report_in.description is not None:
        report.Description = report_in.description
    db.commit()
    db.refresh(report)
    return ReportOut(
        report_id=report.Report_ID,
        schedule_id=report.Schedule_ID,
        description=report.Description
    )

@router.delete("/reports/{report_id}", response_model=dict)
def delete_report(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.Report_ID == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Отчёт не найден")
    db.delete(report)
    db.commit()
    return {"detail": "Отчёт удалён успешно"}

from typing import List, Optional
from datetime import date as dt_date, time as dt_time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.dependencies import get_db
from ..models.models import Schedule, Group_Learn
from datetime import datetime, timedelta

router = APIRouter()

class ScheduleCreate(BaseModel):
    date: dt_date
    start_time: dt_time
    end_time: dt_time
    group_id: int

class ScheduleUpdate(BaseModel):
    date: Optional[dt_date] = None
    start_time: Optional[dt_time] = None
    end_time: Optional[dt_time] = None
    group_id: Optional[int] = None

@router.get("/groups/{group_id}/schedules", response_model=List[dict])
def get_group_schedules(group_id: int, db: Session = Depends(get_db)):
    schedules = db.query(Schedule).filter(Schedule.Group_ID == group_id).all()
    return [
        {
            "schedule_id": schedule.Schedule_ID,
            "date": schedule.Date,
            "start_time": schedule.Start_Time,
            "end_time": schedule.End_Time,
        }
        for schedule in schedules
    ]

@router.get("/schedules", response_model=List[dict])
def get_all_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).join(Group_Learn).all()
    return [
        {
            "schedule_id": schedule.Schedule_ID,
            "date": schedule.Date,
            "start_time": schedule.Start_Time,
            "end_time": schedule.End_Time,
            "group": {
                "group_id": schedule.Group_ID,
                "group_name": schedule.group.Group_Name
            }
        }
        for schedule in schedules
    ]

@router.post("/schedules", response_model=dict)
def create_schedule(schedule_data: ScheduleCreate, db: Session = Depends(get_db)):
    new_schedule = Schedule(
        Date=schedule_data.date,
        Start_Time=schedule_data.start_time,
        End_Time=schedule_data.end_time,
        Group_ID=schedule_data.group_id
    )
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    return {"message": "Расписание успешно создано", "schedule_id": new_schedule.Schedule_ID}

@router.put("/schedules/{schedule_id}", response_model=dict)
def update_schedule(schedule_id: int, schedule_data: ScheduleUpdate, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.Schedule_ID == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    if schedule_data.date is not None:
        schedule.Date = schedule_data.date
    if schedule_data.start_time is not None:
        schedule.Start_Time = schedule_data.start_time
    if schedule_data.end_time is not None:
        schedule.End_Time = schedule_data.end_time
    if schedule_data.group_id is not None:
        schedule.Group_ID = schedule_data.group_id
    db.commit()
    db.refresh(schedule)
    return {"message": "Расписание успешно обновлено", "schedule_id": schedule.Schedule_ID}


@router.delete("/schedules/{schedule_id}", response_model=dict)
def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    # Ищем расписание
    schedule = db.query(Schedule).filter(Schedule.Schedule_ID == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Расписание не найдено")
    # Удаляем. Каскадно удалятся Homework и Reports
    db.delete(schedule)
    db.commit()
    return {"message": "Расписание успешно удалено", "schedule_id": schedule_id}


@router.delete("/schedules/cleanup/old", response_model=dict)
def delete_old_schedules(db: Session = Depends(get_db)):
    three_months_ago = datetime.utcnow().date() - timedelta(days=90)
    old_schedules = db.query(Schedule).filter(Schedule.Date < three_months_ago).all()

    deleted_count = len(old_schedules)
    for schedule in old_schedules:
        db.delete(schedule)
    db.commit()

    return {"message": f"Удалено {deleted_count} расписаний старше 3 месяцев"}
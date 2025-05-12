# app/api/homework.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.core.dependencies import get_db
from app.models.models import Homework

# Схемы Pydantic для ввода/вывода
class HomeworkCreate(BaseModel):
    schedule_id: int
    description: Optional[str] = None

class HomeworkUpdate(BaseModel):
    schedule_id: Optional[int] = None
    description: Optional[str] = None

class HomeworkOut(BaseModel):
    homework_id: int
    schedule_id: int
    description: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

# Маршрутизатор
router = APIRouter()

@router.get("/homeworks", response_model=List[HomeworkOut])
def get_homeworks(db: Session = Depends(get_db)):
    homeworks = db.query(Homework).all()
    return [
        HomeworkOut(
            homework_id=hw.Homework_ID,
            schedule_id=hw.Schedule_ID,
            description=hw.Description
        )
        for hw in homeworks
    ]

@router.post("/homeworks", response_model=HomeworkOut)
def create_homework(hw_in: HomeworkCreate, db: Session = Depends(get_db)):
    # Используем имена колонок SQLAlchemy-модели
    new_hw = Homework(
        Schedule_ID=hw_in.schedule_id,
        Description=hw_in.description
    )
    db.add(new_hw)
    db.commit()
    db.refresh(new_hw)
    return HomeworkOut(
        homework_id=new_hw.Homework_ID,
        schedule_id=new_hw.Schedule_ID,
        description=new_hw.Description
    )

@router.put("/homeworks/{homework_id}", response_model=HomeworkOut)
def update_homework(homework_id: int, hw_in: HomeworkUpdate, db: Session = Depends(get_db)):
    homework = db.query(Homework).filter(Homework.Homework_ID == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Домашнее задание не найдено")
    if hw_in.schedule_id is not None:
        homework.Schedule_ID = hw_in.schedule_id
    if hw_in.description is not None:
        homework.Description = hw_in.description
    db.commit()
    db.refresh(homework)
    return HomeworkOut(
        homework_id=homework.Homework_ID,
        schedule_id=homework.Schedule_ID,
        description=homework.Description
    )

@router.delete("/homeworks/{homework_id}", response_model=dict)
def delete_homework(homework_id: int, db: Session = Depends(get_db)):
    homework = db.query(Homework).filter(Homework.Homework_ID == homework_id).first()
    if not homework:
        raise HTTPException(status_code=404, detail="Домашнее задание не найдено")
    db.delete(homework)
    db.commit()
    return {"detail": "Домашнее задание удалено успешно"}

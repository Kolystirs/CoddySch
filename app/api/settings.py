# app/api/settings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

from app.core.dependencies import get_db
from app.api.auth import get_current_user
from app.models.models import User

pwd_context = CryptContext(schemes=["bcrypt"])
router = APIRouter(tags=["Settings"])

class SettingsUpdate(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    middle_name: str | None = None  # добавлено
    email: EmailStr | None = None
    password: str | None = None

@router.put("/users/me", response_model=dict)
def update_current_user(
    data: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.User_ID == current_user.User_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if data.username is not None:
        user.Username = data.username
    if data.first_name is not None:
        user.First_Name = data.first_name
    if data.last_name is not None:
        user.Last_Name = data.last_name
    if data.middle_name is not None:
        user.Middle_Name = data.middle_name  # обновляем отчество
    if data.email is not None:
        user.Email = data.email
    if data.password:
        user.Password = pwd_context.hash(data.password)

    db.commit()
    return {"message": "Настройки успешно обновлены"}
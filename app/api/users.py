from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from ..models.models import User, Group_User

router = APIRouter()
ctx = CryptContext(schemes=["bcrypt"])

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    role: str
    
class UserUpdate(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: str

@router.get("/users-edit/{user_id}", response_model=dict)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.User_ID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return {
        "user_id": user.User_ID,
        "username": user.Username,
        "first_name": user.First_Name,
        "last_name": user.Last_Name,
        "middle_name": user.Middle_Name,
        "email": user.Email,
        "role": user.Role
    }

@router.put("/users-edit/{user_id}", response_model=dict)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.User_ID == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    user.Username = user_data.username
    user.First_Name = user_data.first_name
    user.Last_Name = user_data.last_name
    user.Email = user_data.email
    user.Role = user_data.role

    if user_data.password:
        user.Password = ctx.hash(user_data.password)

    db.commit()
    return {"message": "Пользователь успешно обновлен", "user_id": user.User_ID}

@router.post("/create-user", response_model=dict)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.Username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким именем уже существует")
    hashed_password = ctx.hash(user_data.password)
    new_user = User(
        Username=user_data.username,
        Password=hashed_password,
        Email=user_data.email,
        First_Name=user_data.first_name,
        Last_Name=user_data.last_name,
        Middle_Name=user_data.middle_name,
        Role=user_data.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Добавьте возврат данных
    return {"message": "Пользователь успешно создан", "user_id": new_user.User_ID}


@router.get("/users", response_model=List[dict])
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {
            "user_id": user.User_ID,
            "username": user.Username,
            "first_name": user.First_Name,
            "last_name": user.Last_Name,
            "middle_name": user.Middle_Name,
            "role": user.Role,
        } for user in users
    ]

@router.get("/filtered-users", response_model=List[dict])
def get_filtered_users(db: Session = Depends(get_db), role: Optional[str] = None, group_id: Optional[int] = None):
    query = db.query(User)
    
    if role:
        query = query.filter(User.Role == role)
    if group_id:
        query = query.join(Group_User).filter(Group_User.Group_ID == group_id)
    
    users = query.all()
    
    return [
        {
            "user_id": user.User_ID,
            "username": user.Username,
            "first_name": user.First_Name,
            "last_name": user.Last_Name,
            "middle_name": user.Middle_Name,
            "role": user.Role,
        } for user in users
    ]


@router.delete("/delete-user/{user_id}", response_model=dict)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    # Поиск пользователя по идентификатору
    user = db.query(User).filter(User.User_ID == user_id).first()
    if not user:
        # Если пользователь не найден - возвращаем ошибку 404
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Удаляем пользователя из сессии
    db.delete(user)
    db.commit()
    
    # Возвращаем подтверждение удаления
    return {"message": "Пользователь успешно удален", "user_id": user.User_ID}
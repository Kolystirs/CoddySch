from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import jwt, JWTError
from app.core.dependencies import get_db
from ..models.models import User

KEY = "AGFshjjbghfj"
ALG = "HS256"

router = APIRouter()

ctx = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, KEY, algorithms=[ALG])
        username = payload.get("username")
        if username is None:
            raise HTTPException(status_code=401, detail="Неверные учетные данные")
    except JWTError:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    
    user = db.query(User).filter(User.Username == username).first()
    if user is None:
        raise HTTPException(status_code=401, detail="Пользователь не найден")
    
    return user

@router.post("/token")
def login(user: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = user.username
    us = db.query(User).filter_by(Username=username).first()
    
    if not us:
        raise HTTPException(status_code=403, detail="Неверный логин или пароль")
    
    if ctx.verify(user.password, us.Password):
        token = jwt.encode({
            "username": us.Username, 
            "type": "access", 
            "exp": datetime.utcnow() + timedelta(minutes=45)
        }, key=KEY, algorithm=ALG)

        return {
            "access_token": token,
            "role": us.Role,
            "userId": us.User_ID,
            "lastname": us.Last_Name,
            "firstname": us.First_Name,
            "middlename": us.Middle_Name
        }

    raise HTTPException(status_code=403, detail="Неверный логин или пароль")

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from pydantic import BaseModel
from ..models.models import Group_Learn, Group_User, Group_Course, User

router = APIRouter()

class GroupCreate(BaseModel):
    course_id: int
    group_name: Optional[str] = None
    teacher_id: Optional[int] = None
    student_ids: Optional[List[int]] = None

class GroupUpdate(BaseModel):
    course_id: Optional[int] = None
    group_name: Optional[str] = None
    teacher_id: Optional[int] = None
    student_ids: Optional[List[int]] = None

@router.get("/groups/info", response_model=List[dict])
def get_groups_info(db: Session = Depends(get_db)):
    groups = db.query(Group_Learn).all()
    result = []
    for group in groups:
        teacher = None
        students = []
        for gu in group.users:
            if gu.user.Role == "Преподаватель":
                teacher = {
                    "user_id": gu.user.User_ID,
                    "username": gu.user.Username,
                    "first_name": gu.user.First_Name,
                    "last_name": gu.user.Last_Name,
                }
            elif gu.user.Role == "Ученик":
                students.append({
                    "user_id": gu.user.User_ID,
                    "username": gu.user.Username,
                    "first_name": gu.user.First_Name,
                    "last_name": gu.user.Last_Name,
                })

        course_link = db.query(Group_Course).filter(Group_Course.Group_ID == group.Group_ID).first()
        course_id = course_link.Course_ID if course_link else None

        result.append({
            "group_id": group.Group_ID,
            "group_name": group.Group_Name,
            "teacher": teacher,
            "students": students,
            "course_id": course_id
        })
    return result


@router.post("/groups", response_model=dict, status_code=201)
def create_group(group_data: GroupCreate, db: Session = Depends(get_db)):
    # 1. Создаём саму группу
    new_group = Group_Learn(Group_Name=group_data.group_name or "")
    db.add(new_group)
    db.commit()
    db.refresh(new_group)

    # 2. Связываем группу с курсом
    db.add(Group_Course(Group_ID=new_group.Group_ID, Course_ID=group_data.course_id))

    # 3. Привязываем классного руководителя
    if group_data.teacher_id:
        teacher = db.query(User).filter(
            User.User_ID == group_data.teacher_id,
            User.Role == "Преподаватель"
        ).first()
        if not teacher:
            raise HTTPException(404, "Преподаватель не найден")
        db.add(Group_User(Group_ID=new_group.Group_ID, User_ID=teacher.User_ID))

    # 4. Привязываем учеников
    if group_data.student_ids:
        for sid in group_data.student_ids:
            student = db.query(User).filter(
                User.User_ID == sid,
                User.Role == "Ученик"
            ).first()
            if not student:
                raise HTTPException(404, f"Ученик с ID {sid} не найден")
            db.add(Group_User(Group_ID=new_group.Group_ID, User_ID=student.User_ID))

    db.commit()
    return {"message": "Группа успешно создана", "group_id": new_group.Group_ID}




@router.put("/groups/{group_id}", response_model=dict)
def update_group(group_id: int, data: GroupUpdate, db: Session = Depends(get_db)):
    group = db.query(Group_Learn).get(group_id)
    if not group:
        raise HTTPException(404, "Группа не найдена")

    # 1. Обновляем имя, если передано
    if data.group_name is not None:
        group.Group_Name = data.group_name

    # 2. Перепривязываем к курсу, если передано
    if data.course_id is not None:
        # удаляем старую связь
        db.query(Group_Course).filter(Group_Course.Group_ID == group_id).delete()
        # добавляем новую
        db.add(Group_Course(Group_ID=group_id, Course_ID=data.course_id))

    # 3. Обновляем состав (teacher + students)
    # чистим всех пользователей
    db.query(Group_User).filter(Group_User.Group_ID == group_id).delete()

    if data.teacher_id is not None:
        teacher = db.query(User).filter(
            User.User_ID == data.teacher_id, User.Role == "Преподаватель"
        ).first()
        if not teacher:
            raise HTTPException(404, "Преподаватель не найден")
        db.add(Group_User(Group_ID=group_id, User_ID=teacher.User_ID))

    if data.student_ids is not None:
        for sid in data.student_ids:
            student = db.query(User).filter(
                User.User_ID == sid, User.Role == "Ученик"
            ).first()
            if not student:
                raise HTTPException(404, f"Ученик с ID {sid} не найден")
            db.add(Group_User(Group_ID=group_id, User_ID=student.User_ID))

    db.commit()
    return {"message": "Группа успешно обновлена", "group_id": group_id}



@router.get("/groups", response_model=List[dict])
def get_groups(db: Session = Depends(get_db)):
    groups = db.query(Group_Learn).all()
    return [
        {
            "group_id": group.Group_ID,
            "group_name": group.Group_Name,
            "users": [{"user_id": user.user.User_ID, "username": user.user.Username} for user in group.users]
        } for group in groups
    ]


@router.delete("/groups/{group_id}", response_model=dict)
def delete_group(group_id: int, db: Session = Depends(get_db)):
    group = db.query(Group_Learn).get(group_id)
    if not group:
        raise HTTPException(404, "Группа не найдена")

    # 1. Убираем связи с пользователями
    db.query(Group_User).filter(Group_User.Group_ID == group_id).delete()
    # 2. Убираем связь с курсом
    db.query(Group_Course).filter(Group_Course.Group_ID == group_id).delete()
    # 3. Удаляем саму группу
    db.delete(group)
    db.commit()

    return {"message": "Группа успешно удалена", "group_id": group_id}
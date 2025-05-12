from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db
from pydantic import BaseModel
from ..models.models import Course, Course_Teacher, User, Group_Learn, Group_Course, Group_User
from app.api.auth import get_current_user
from ..models.models import Course

router = APIRouter()

class TeacherOut(BaseModel):
    teacher_id: int
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    email: Optional[str] = None


class CourseOut(BaseModel):
    course_id: int
    course_name: str
    description: Optional[str] = None
    photo_course: Optional[str] = None
    time_learn: Optional[str] = None
    teachers: List[TeacherOut]   

class CourseCreate(BaseModel):
    course_name: str
    description: str | None = None
    photo_course: str | None = None
    time_learn: str | None = None
    teacher_ids: list[int]
    
class CourseUpdate(BaseModel):
    course_name: Optional[str] = None
    description: Optional[str] = None
    photo_course: Optional[str] = None
    time_learn: Optional[str] = None
    teacher_ids: Optional[List[int]] = None
    
@router.post("/create-course")
def create_course(course_data: CourseCreate, db: Session = Depends(get_db)):
    course = Course(
        Course_Name=course_data.course_name,
        Description=course_data.description,
        Photo_Course=course_data.photo_course,
        Time_learn=course_data.time_learn,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    print(f"Курс создан с ID: {course.Course_ID}")
    for teacher_id in course_data.teacher_ids:
        print(f"Добавление связи с преподавателем ID: {teacher_id}")
        teacher = db.query(User).filter(
            User.User_ID == teacher_id, 
            User.Role == "Преподаватель"
        ).first()
        if not teacher:
            print(f"Преподаватель с ID {teacher_id} не найден!")
            raise HTTPException(
                status_code=404, 
                detail=f"Teacher with ID {teacher_id} not found."
            )
        course_teacher = Course_Teacher(
            Course_ID=course.Course_ID,
            Teacher_ID=teacher.User_ID
        )
        db.add(course_teacher)
    try:
        db.commit()
        print("Все связи успешно сохранены.")
    except Exception as e:
        print(f"Ошибка при сохранении связей: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail="Ошибка при добавлении связей с преподавателями."
        )
    return {"message": "Course created successfully", "course_id": course.Course_ID}

@router.put("/courses/{course_id}", response_model=dict)
def update_course(course_id: int, course_data: CourseUpdate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.Course_ID == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    if course_data.course_name is not None:
        course.Course_Name = course_data.course_name
    if course_data.description is not None:
        course.Description = course_data.description
    if course_data.photo_course is not None:
        course.Photo_Course = course_data.photo_course
    if course_data.time_learn is not None:
        course.Time_learn = course_data.time_learn
    if course_data.teacher_ids is not None:
        db.query(Course_Teacher).filter(Course_Teacher.Course_ID == course_id).delete()
        for teacher_id in course_data.teacher_ids:
            teacher = db.query(User).filter(
                User.User_ID == teacher_id,
                User.Role == "Преподаватель"
            ).first()
            if not teacher:
                raise HTTPException(
                    status_code=404, 
                    detail=f"Преподаватель с ID {teacher_id} не найден"
                )
            course_teacher = Course_Teacher(
                Course_ID=course.Course_ID,
                Teacher_ID=teacher.User_ID
            )
            db.add(course_teacher)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, 
            detail=f"Ошибка при обновлении курса: {str(e)}"
        )
    return {"message": "Курс успешно обновлен", "course_id": course.Course_ID}

@router.get("/courses-page")
def get_courses_page(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    result = []
    for course in courses:
        teachers = [
            f"{teacher.teacher.Last_Name} {teacher.teacher.First_Name}"
            for teacher in course.teachers
        ]
        result.append({
            "course_id": course.Course_ID,
            "course_name": course.Course_Name,
            "photo_course": course.Photo_Course,
            "teachers": teachers,
        })
    return result

@router.get("/courses/{course_id}", response_model=CourseOut)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.Course_ID == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")

    # Собираем преподавателей
    teachers = (
        db.query(User)
          .join(Course_Teacher, Course_Teacher.Teacher_ID == User.User_ID)
          .filter(Course_Teacher.Course_ID == course_id, User.Role == "Преподаватель")
          .all()
    )

    return {
        "course_id":   course.Course_ID,
        "course_name": course.Course_Name,
        "description": course.Description,
        "photo_course": course.Photo_Course,
        "time_learn":  course.Time_learn,
        "teachers": [
            {
                "teacher_id":  t.User_ID,
                "first_name":  t.First_Name,
                "last_name":   t.Last_Name,
                "middle_name": t.Middle_Name,
                "email":       t.Email,
            }
            for t in teachers
        ]
    }



@router.get("/courses", response_model=List[dict])
def get_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    return [
        {
            "course_id": course.Course_ID,
            "course_name": course.Course_Name,
            "description": course.Description,
            "time_learn": course.Time_learn,
        } for course in courses
    ]


  
@router.get("/courses/{course_id}/info", response_model=dict)
def get_course_info(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.Course_ID == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    groups = db.query(Group_Learn).join(Group_Course).filter(Group_Course.Course_ID == course_id).all()
    teachers = db.query(User).join(Course_Teacher).filter(Course_Teacher.Course_ID == course_id, User.Role == "Преподаватель").all()
    response = {
        "course_id": course.Course_ID,
        "course_name": course.Course_Name,
        "description": course.Description,
        "groups": []
    }
    for group in groups:
        group_users = db.query(User).join(Group_User).filter(Group_User.Group_ID == group.Group_ID).all()
        students = [
            {
                "student_id": student.User_ID,
                "first_name": student.First_Name,
                "last_name": student.Last_Name,
                "middle_name": student.Middle_Name
            } for student in group_users
        ]
        response["groups"].append({
            "group_id": group.Group_ID,
            "group_name": group.Group_Name,
            "students": students
        })
    response["teachers"] = [
        {
            "teacher_id": teacher.User_ID,
            "first_name": teacher.First_Name,
            "last_name": teacher.Last_Name,
            "middle_name": teacher.Middle_Name,
            "email": teacher.Email
        } for teacher in teachers
    ]
    return response

@router.get("/courses/teacher_info/all", response_model=list)
def get_all_courses_teacher_info(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    if not courses:
        return []
    response = []
    for course in courses:
        teachers = (
            db.query(User)
            .join(Course_Teacher)
            .filter(Course_Teacher.Course_ID == course.Course_ID, User.Role == "Преподаватель")
            .all()
        )
        response.append({
            "course_id": course.Course_ID,
            "course_name": course.Course_Name,
            "description": course.Description,
            "photo_course": course.Photo_Course,
            "hours": course.Time_learn,
            "teachers": [
                {
                    "teacher_id": teacher.User_ID,
                    "first_name": teacher.First_Name,
                    "last_name": teacher.Last_Name,
                    "middle_name": teacher.Middle_Name,
                    "email": teacher.Email,
                    "photo": teacher.Photo,
                } for teacher in teachers
            ]
        })
    return response 
 
 # Получение всех преподавателей
@router.get("/teachers", response_model=List[dict])
def get_teachers(db: Session = Depends(get_db)):
    teachers = db.query(User).filter(User.Role == "Преподаватель").all()
    return [
        {
            "user_id": teacher.User_ID,
            "username": teacher.Username,
            "first_name": teacher.First_Name,
            "last_name": teacher.Last_Name,
            "role": teacher.Role,
            "photo": teacher.Photo,
            
        } for teacher in teachers
    ]
    
    
@router.delete("/courses/{course_id}", status_code=status.HTTP_200_OK)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db)
):
    course = db.query(Course).filter(Course.Course_ID == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Курс не найден")
    
    # Удаляем связанные записи
    db.query(Course_Teacher).filter(Course_Teacher.Course_ID == course_id).delete()
    db.query(Group_Course).filter(Group_Course.Course_ID == course_id).delete()
    
    try:
        db.delete(course)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка при удалении курса: {str(e)}"
        )
    return {"message": "Курс успешно удалён"}



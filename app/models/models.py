from typing import Optional, List
from sqlalchemy import Integer, String, Text, ForeignKey, Date, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time
from .database import Base

# Модель Courses
class Course(Base):
    __tablename__ = 'Courses'
    
    Course_ID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    Course_Name: Mapped[str] = mapped_column(String(100), nullable=False)
    Description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    Photo_Course: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    Time_learn: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    # Связи
    teachers: Mapped[List["Course_Teacher"]] = relationship("Course_Teacher", back_populates="course", cascade="all, delete-orphan")
    groups: Mapped[List["Group_Course"]] = relationship("Group_Course", back_populates="course", cascade="all, delete-orphan")


# Модель Users
class User(Base):
    __tablename__ = 'Users'
    
    User_ID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    Username: Mapped[str] = mapped_column(String(50), nullable=False)
    Password: Mapped[str] = mapped_column(String(255), nullable=False)
    Email: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    Last_Name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    First_Name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    Middle_Name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    Role: Mapped[str] = mapped_column(String(50), nullable=False)
    Photo: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Связи
    courses_teached: Mapped[List["Course_Teacher"]] = relationship("Course_Teacher", back_populates="teacher", cascade="all, delete-orphan")
    groups: Mapped[List["Group_User"]] = relationship("Group_User", back_populates="user", cascade="all, delete-orphan")


# Модель Course_Teachers
class Course_Teacher(Base):
    __tablename__ = 'Course_Teachers'
    
    Course_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Courses.Course_ID', ondelete='CASCADE'), primary_key=True)
    Teacher_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Users.User_ID', ondelete='CASCADE'), primary_key=True)

    # Связи
    course: Mapped["Course"] = relationship("Course", back_populates="teachers")
    teacher: Mapped["User"] = relationship("User", back_populates="courses_teached")


# Модель Group_learn
class Group_Learn(Base):
    __tablename__ = 'Group_learn'
    
    Group_ID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    Group_Name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Связи
    users: Mapped[List["Group_User"]] = relationship("Group_User", back_populates="group", cascade="all, delete-orphan")
    courses: Mapped[List["Group_Course"]] = relationship("Group_Course", back_populates="group", cascade="all, delete-orphan")
    schedules: Mapped[List["Schedule"]] = relationship("Schedule", back_populates="group", cascade="all, delete-orphan")


# Модель Group_Courses
class Group_Course(Base):
    __tablename__ = 'Group_Courses'
    
    Group_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Group_learn.Group_ID', ondelete='CASCADE'), primary_key=True)
    Course_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Courses.Course_ID', ondelete='CASCADE'), primary_key=True)

    # Связи
    group: Mapped["Group_Learn"] = relationship("Group_Learn", back_populates="courses")
    course: Mapped["Course"] = relationship("Course", back_populates="groups")


# Модель Group_User
class Group_User(Base):
    __tablename__ = 'Group_User'
    
    Group_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Group_learn.Group_ID', ondelete='CASCADE'), primary_key=True)
    User_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Users.User_ID', ondelete='CASCADE'), primary_key=True)

    # Связи
    group: Mapped["Group_Learn"] = relationship("Group_Learn", back_populates="users")
    user: Mapped["User"] = relationship("User", back_populates="groups")


# Модель Schedules
class Schedule(Base):
    __tablename__ = 'Schedules'
    
    Schedule_ID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    Date: Mapped[date] = mapped_column(Date, nullable=False)
    Start_Time: Mapped[time] = mapped_column(Time, nullable=False)
    End_Time: Mapped[time] = mapped_column(Time, nullable=False)
    Group_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Group_learn.Group_ID', ondelete='CASCADE'), nullable=False)

    # Связи
    group: Mapped["Group_Learn"] = relationship("Group_Learn", back_populates="schedules")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="schedule", cascade="all, delete-orphan")
    homeworks: Mapped[List["Homework"]] = relationship("Homework", back_populates="schedule", cascade="all, delete-orphan")


# Новая модель Reports (Отчёты)
class Report(Base):
    __tablename__ = 'Reports'
    
    Report_ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    Schedule_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Schedules.Schedule_ID', ondelete='CASCADE'), nullable=False)
    Description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Связь с таблицей расписаний
    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="reports")


# Новая модель Homework (Домашнее задание)
class Homework(Base):
    __tablename__ = 'Homework'
    
    Homework_ID: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    Schedule_ID: Mapped[int] = mapped_column(Integer, ForeignKey('Schedules.Schedule_ID', ondelete='CASCADE'), nullable=False)
    Description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Связь с таблицей расписаний
    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="homeworks")


if __name__ == "__main__":
    Base.metadata.create_all()

from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.api.courses import router as courses_router
from app.api.groups import router as groups_router
from app.api.schedules import router as schedules_router
from app.api.homework import router as homework_router
from app.api.report import router as report_router
from app.api.settings import router as settings_router

router = APIRouter()

router.include_router(auth_router, prefix="", tags=["Auth"])
router.include_router(settings_router, prefix="", tags=["Settings"])
router.include_router(users_router, prefix="", tags=["Users"])
router.include_router(courses_router, prefix="", tags=["Courses"])
router.include_router(groups_router, prefix="", tags=["Groups"])
router.include_router(schedules_router, prefix="", tags=["Schedules"])
router.include_router(homework_router, prefix="", tags=["Homework"])
router.include_router(report_router, prefix="", tags=["Report"])
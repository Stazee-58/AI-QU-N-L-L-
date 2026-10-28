from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.roles import router as roles_router
from app.api.v1.users import router as users_router
from app.api.v1.materials import router as materials_router
from app.api.v1.norms import router as norms_router
from app.api.v1.ai_settings import router as ai_settings_router
from app.api.v1.ai_audit import router as ai_audit_router
from app.api.v1.projects import router as projects_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(roles_router)
api_v1_router.include_router(users_router)
api_v1_router.include_router(materials_router)
api_v1_router.include_router(norms_router)
api_v1_router.include_router(ai_settings_router)
api_v1_router.include_router(ai_audit_router)
api_v1_router.include_router(projects_router)

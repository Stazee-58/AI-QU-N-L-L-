from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.ai_settings import AISetting
from app.models.user import User
from app.schemas.ai_settings import AISettingUpdate, AISettingResponse
from app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/ai-settings", tags=["Cấu hình Quyền AI (Admin)"])

@router.get("", response_model=List[AISettingResponse])
async def list_ai_settings(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user)
):
    result = await db.execute(select(AISetting).order_by(AISetting.feature_key))
    return result.scalars().all()

@router.put("/{feature_key}", response_model=AISettingResponse)
async def update_ai_setting(
    feature_key: str,
    req: AISettingUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN", "DIRECTOR"]))
):
    result = await db.execute(select(AISetting).where(AISetting.feature_key == feature_key))
    setting = result.scalars().first()
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy cấu hình tính năng AI '{feature_key}'.",
        )

    if req.permission_level is not None:
        setting.permission_level = req.permission_level
    if req.is_enabled is not None:
        setting.is_enabled = req.is_enabled
    if req.provider is not None:
        setting.provider = req.provider
    if req.model_name is not None:
        setting.model_name = req.model_name
    if req.monthly_budget_usd is not None:
        setting.monthly_budget_usd = req.monthly_budget_usd
    if req.alert_threshold_ratio is not None:
        setting.alert_threshold_ratio = req.alert_threshold_ratio

    setting.updated_by = admin_user.id
    await db.commit()
    await db.refresh(setting)
    return setting

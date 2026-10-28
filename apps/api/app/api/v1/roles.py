from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.role import Role
from app.schemas.user import RoleResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/roles", tags=["Vai trò"])

@router.get("", response_model=List[RoleResponse])
async def list_roles(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(select(Role).order_by(Role.code))
    return result.scalars().all()

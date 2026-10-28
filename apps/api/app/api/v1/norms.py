from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.norm import Norm
from app.schemas.norm import NormCreate, NormUpdate, NormResponse
from app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/norms", tags=["Định mức sản xuất (BOM)"])

@router.get("", response_model=List[NormResponse])
async def list_norms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    product_type: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    query = select(Norm).order_by(Norm.name)
    if product_type:
        query = query.where(Norm.product_type == product_type)
    if is_active is not None:
        query = query.where(Norm.is_active == is_active)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=NormResponse, status_code=status.HTTP_201_CREATED)
async def create_norm(
    req: NormCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    norm = Norm(**req.model_dump())
    db.add(norm)
    await db.commit()
    await db.refresh(norm)
    return norm

@router.get("/{norm_id}", response_model=NormResponse)
async def get_norm(
    norm_id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    norm = await db.get(Norm, norm_id)
    if not norm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy định mức.")
    return norm

@router.put("/{norm_id}", response_model=NormResponse)
async def update_norm(
    norm_id: str,
    req: NormUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    norm = await db.get(Norm, norm_id)
    if not norm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy định mức.")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(norm, field, val)

    await db.commit()
    await db.refresh(norm)
    return norm

@router.delete("/{norm_id}")
async def deactivate_norm(
    norm_id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    norm = await db.get(Norm, norm_id)
    if not norm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy định mức.")

    norm.is_active = False
    await db.commit()
    return {"message": f"Đã tạm dừng định mức '{norm.name}'."}

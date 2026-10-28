from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.services.auth import get_password_hash
from app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/users", tags=["Người dùng (Admin)"])

@router.get("", response_model=List[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN", "DIRECTOR"]))
):
    query = select(User).options(selectinload(User.role)).order_by(User.created_at.desc())
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (User.username.ilike(search_filter)) |
            (User.full_name.ilike(search_filter)) |
            (User.phone.ilike(search_filter))
        )
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    req: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    # Kiểm tra username trùng
    check_user = await db.execute(select(User).where(User.username == req.username))
    if check_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tên đăng nhập '{req.username}' đã được sử dụng.",
        )
    
    # Kiểm tra phone trùng nếu có
    if req.phone:
        check_phone = await db.execute(select(User).where(User.phone == req.phone))
        if check_phone.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Số điện thoại '{req.phone}' đã được đăng ký.",
            )

    # Kiểm tra role_id
    role = await db.get(Role, req.role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vai trò được chỉ định không tồn tại.",
        )

    new_user = User(
        username=req.username,
        full_name=req.full_name,
        phone=req.phone,
        telegram_id=req.telegram_id,
        role_id=req.role_id,
        is_active=req.is_active,
        password_hash=get_password_hash(req.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_detail(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    req: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.phone is not None:
        user.phone = req.phone
    if req.telegram_id is not None:
        user.telegram_id = req.telegram_id
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.role_id is not None:
        role = await db.get(Role, req.role_id)
        if not role:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vai trò không tồn tại.")
        user.role_id = req.role_id
    if req.password:
        user.password_hash = get_password_hash(req.password)

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role(["ADMIN"]))
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Người dùng không tồn tại.")
    
    if user.id == admin_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tự khóa tài khoản của chính mình.")

    user.is_active = False
    await db.commit()
    return {"message": f"Đã khóa tài khoản '{user.username}' thành công."}

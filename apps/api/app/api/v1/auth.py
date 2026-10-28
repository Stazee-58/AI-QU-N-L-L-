from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserResponse
from app.services.auth import verify_password, get_password_hash, create_access_token
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Xác thực"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    clean_username = req.username.strip().lower()
    check_user = await db.execute(select(User).where(User.username == clean_username))
    if check_user.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tên đăng nhập '{clean_username}' đã được sử dụng. Vui lòng chọn tên khác."
        )

    role = await db.get(Role, req.role_id)
    if not role or role.code == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vai trò chỉ định không hợp lệ hoặc không được phép tự đăng ký quyền Quản trị."
        )

    new_user = User(
        username=clean_username,
        full_name=req.full_name.strip(),
        phone=req.phone.strip() if req.phone else None,
        role_id=role.id,
        is_active=False,  # Chưa kích hoạt, chờ Admin duyệt
        password_hash=get_password_hash(req.password)
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {
        "message": f"Đăng ký thành công! Tài khoản '{clean_username}' với chức vụ '{role.name}' đang chờ Quản trị viên (Admin) xét duyệt.",
        "username": new_user.username
    }

@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    clean_username = req.username.strip().lower()
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.username == clean_username)
    )
    user = result.scalars().first()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tên đăng nhập hoặc mật khẩu không chính xác.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản này đang ở trạng thái CHỜ DUYỆT hoặc ĐÃ KHÓA. Vui lòng liên hệ Quản trị viên để kích hoạt.",
        )

    token_data = {
        "sub": user.id,
        "username": user.username,
        "role_code": user.role.code if user.role else ""
    }
    access_token = create_access_token(data=token_data)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        full_name=user.full_name,
        role_code=user.role.code if user.role else "",
        role_name=user.role.name if user.role else "",
        permissions=user.role.permissions if user.role else []
    )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

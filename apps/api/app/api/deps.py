from typing import List, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.services.auth import decode_access_token

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yêu cầu xác thực tài khoản. Vui lòng đăng nhập lại.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mã định danh người dùng trong token không tồn tại.",
        )
    
    result = await db.execute(
        select(User).options(selectinload(User.role)).where(User.id == user_id)
    )
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản người dùng không tồn tại trong hệ thống.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ quản trị viên.",
        )
    
    return user

def require_role(allowed_roles: List[str]):
    """
    Ràng buộc RBAC: người dùng bắt buộc phải thuộc một trong các vai trò được chỉ định.
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.code if current_user.role else ""
        if user_role not in allowed_roles and user_role != "ADMIN":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền truy cập chức năng này. Yêu cầu vai trò: {', '.join(allowed_roles)}.",
            )
        return current_user
    return role_checker

def require_permission(permission: str):
    """
    Ràng buộc RBAC theo quyền chi tiết (vd: 'user:write', 'material:import')
    """
    async def perm_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.code if current_user.role else ""
        if user_role == "ADMIN":
            return current_user
        
        perms = current_user.role.permissions if current_user.role else []
        if permission not in perms and "*:*" not in perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Tài khoản của bạn không có quyền '{permission}'.",
            )
        return current_user
    return perm_checker

async def verify_project_access(
    project_id: str,
    current_user: User,
    db: AsyncSession
) -> Project:
    """
    Kiểm tra phân quyền theo dự án:
    Admin và Giám đốc có quyền toàn cục;
    Người dùng khác phải là người phụ trách (manager) của dự án.
    """
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dự án với mã '{project_id}' không tồn tại.",
        )
    
    user_role = current_user.role.code if current_user.role else ""
    if user_role in ["ADMIN", "DIRECTOR"]:
        return project
    
    if project.manager_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không được phân công phụ trách dự án này.",
        )
    
    return project

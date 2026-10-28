from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.api.deps import get_current_user, verify_project_access

router = APIRouter(prefix="/projects", tags=["Dự án & Đơn hàng"])

def mask_sensitive_project_data(project: Project, current_user: User) -> ProjectResponse:
    """
    Ẩn thông tin giá trị hợp đồng / tài chính với các vai trò không có quyền xem tiền
    (như Quản đốc/Tổ trưởng, Thủ kho, Thi công).
    """
    user_role = current_user.role.code if current_user.role else ""
    contract_val = float(project.contract_value)
    if user_role in ["FOREMAN", "WAREHOUSE", "SITE"]:
        contract_val = 0.0  # Ẩn tiền bạc
    
    return ProjectResponse(
        id=project.id,
        code=project.code,
        name=project.name,
        customer_name=project.customer_name,
        customer_phone=project.customer_phone,
        manager_id=project.manager_id,
        status=project.status,
        contract_value=contract_val,
        created_at=project.created_at,
        updated_at=project.updated_at
    )

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_role = current_user.role.code if current_user.role else ""
    query = select(Project).order_by(Project.created_at.desc())
    
    # Nếu không phải Quản trị viên/Giám đốc, chỉ thấy dự án mình quản lý hoặc tất cả nếu là kinh doanh
    if user_role not in ["ADMIN", "DIRECTOR", "ACCOUNTANT", "SALES"]:
        query = query.where(Project.manager_id == current_user.id)
        
    if status_filter:
        query = query.where(Project.status == status_filter)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return [mask_sensitive_project_data(p, current_user) for p in projects]

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    req: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check = await db.execute(select(Project).where(Project.code == req.code))
    if check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã dự án '{req.code}' đã tồn tại.",
        )

    project = Project(
        code=req.code,
        name=req.name,
        customer_name=req.customer_name,
        customer_phone=req.customer_phone,
        manager_id=req.manager_id or current_user.id,
        status=req.status,
        contract_value=req.contract_value
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return mask_sensitive_project_data(project, current_user)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project_detail(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await verify_project_access(project_id, current_user, db)
    return mask_sensitive_project_data(project, current_user)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    req: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = await verify_project_access(project_id, current_user, db)
    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(project, field, val)

    await db.commit()
    await db.refresh(project)
    return mask_sensitive_project_data(project, current_user)

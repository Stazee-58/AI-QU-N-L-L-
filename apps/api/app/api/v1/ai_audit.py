from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.ai_audit import AIAudit
from app.models.user import User
from app.schemas.ai_audit import AIAuditCreate, AIAuditResponse
from app.services.audit import log_ai_action
from app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/ai-audit", tags=["Nhật ký đối soát AI (Bất biến)"])

@router.get("", response_model=List[AIAuditResponse])
async def list_ai_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    module_name: Optional[str] = None,
    is_modified: Optional[bool] = None,
    user_id: Optional[str] = None,
    project_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DIRECTOR"]))
):
    """
    Xem nhật ký bất biến ghi nhận mọi đề xuất AI và chỉnh sửa của con người.
    """
    query = select(AIAudit).order_by(AIAudit.created_at.desc())
    if module_name:
        query = query.where(AIAudit.module_name == module_name)
    if is_modified is not None:
        query = query.where(AIAudit.is_modified == is_modified)
    if user_id:
        query = query.where(AIAudit.user_id == user_id)
    if project_id:
        query = query.where(AIAudit.project_id == project_id)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=AIAuditResponse, status_code=status.HTTP_201_CREATED)
async def record_audit_entry(
    req: AIAuditCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ghi một bản ghi nhật ký bất biến mới vào hệ thống.
    """
    entry = await log_ai_action(
        db=db,
        module_name=req.module_name,
        user_id=req.user_id or current_user.id,
        project_id=req.project_id,
        ai_prompt_sent=req.ai_prompt_sent,
        ai_raw_response=req.ai_raw_response,
        parsed_output=req.parsed_output,
        confidence_score=req.confidence_score,
        human_final_output=req.human_final_output,
        latency_ms=req.latency_ms,
        cost_usd=req.cost_usd
    )
    return entry

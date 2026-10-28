"""
Settlements & Acceptance API Router (G5).
Handles project cost reconciliation, material variance from BOM,
labor aggregation from shift logs, and formal customer acceptance.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.api.v1.auth import get_current_user
from app.schemas.settlement import (
    ProjectSettlementResponse,
    SettlementFinalizeRequest
)
from app.services.settlement_service import (
    calculate_project_settlement,
    finalize_project_settlement
)

router = APIRouter(prefix="/settlements", tags=["Nghiệm thu & Quyết toán (G5)"])

@router.get("", response_model=List[ProjectSettlementResponse])
async def list_project_settlements(
    status_filter: Optional[str] = Query(None, description="DRAFT, IN_REVIEW, FINALIZED"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách bảng quyết toán và lãi/lỗ của tất cả các dự án.
    """
    projs_res = await db.execute(select(Project).order_by(Project.created_at))
    projects = projs_res.scalars().all()

    results = []
    for p in projects:
        try:
            settle_data = await calculate_project_settlement(db, p.id)
            if status_filter and settle_data.status != status_filter:
                continue
            results.append(settle_data)
        except Exception as e:
            continue

    return results

@router.get("/{project_id}", response_model=ProjectSettlementResponse)
async def get_project_settlement(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy chi tiết bảng quyết toán, đối chiếu BOM vs Thực tế, và nhật ký ca làm việc.
    """
    try:
        settlement = await calculate_project_settlement(db, project_id)
        return settlement
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.post("/{project_id}/finalize", response_model=ProjectSettlementResponse)
async def finalize_settlement(
    project_id: str,
    payload: SettlementFinalizeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chốt nghiệm thu và khóa sổ quyết toán dự án (Dành cho Giám đốc / Kế toán / Kỹ thuật).
    """
    try:
        updated = await finalize_project_settlement(db, project_id, current_user.id, payload)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/{project_id}/export")
async def export_settlement_statement(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Xuất hồ sơ quyết toán và biên bản nghiệm thu (chuẩn đối soát tài chính).
    """
    settlement = await calculate_project_settlement(db, project_id)
    return {
        "statement_code": f"QT-{settlement.project_code}",
        "project": {
            "code": settlement.project_code,
            "name": settlement.project_name,
            "customer": settlement.customer_name,
            "phone": settlement.customer_phone
        },
        "financial_summary": {
            "contract_value_vnd": settlement.contract_value,
            "actual_material_cost_vnd": settlement.actual_material_cost,
            "actual_labor_cost_vnd": settlement.actual_labor_cost,
            "total_actual_cost_vnd": settlement.total_actual_cost,
            "gross_profit_vnd": settlement.gross_profit,
            "profit_margin_pct": settlement.profit_margin_pct,
            "amount_paid_vnd": settlement.amount_paid,
            "remaining_receivable_vnd": settlement.remaining_receivable
        },
        "materials_reconciliation": [m.model_dump() for m in settlement.materials_detail],
        "labor_reconciliation": [l.model_dump() for l in settlement.labor_detail],
        "acceptance": {
            "status": settlement.acceptance_status,
            "date": str(settlement.acceptance_date) if settlement.acceptance_date else None,
            "notes": settlement.acceptance_notes,
            "finalized_by": settlement.finalized_by_name
        }
    }

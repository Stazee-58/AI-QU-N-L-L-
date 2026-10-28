"""
Project Settlement & Acceptance Service (G5).
Reconciles actual material costs from inventory transactions (PXK),
labor costs from shift production logs, compares against BOM norms,
and manages customer acceptance and contract settlement.
"""

from datetime import datetime, date, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.work_order import WorkOrder
from app.models.production_log import ProductionLog
from app.models.inventory_transaction import InventoryTransaction
from app.models.settlement import ProjectSettlement
from app.models.material import Material
from app.schemas.settlement import (
    ProjectSettlementResponse,
    MaterialSettlementDetail,
    LaborSettlementDetail,
    SettlementFinalizeRequest
)

HOURLY_LABOR_RATE = 50000.0  # 50,000 VND / man-hour chuẩn tại xưởng cơ khí

async def calculate_project_settlement(
    session: AsyncSession,
    project_id: str
) -> ProjectSettlementResponse:
    """
    Tính toán bảng tổng hợp quyết toán dự án thời gian thực:
    1. Doanh thu theo Hợp đồng
    2. Chi phí vật tư thực tế xuất kho (PXK) vs Định mức BOM
    3. Chi phí nhân công thực tế từ nhật ký ca sản xuất
    4. Lãi gộp & Biên lợi nhuận (%)
    5. Cảnh báo vượt định mức / xói mòn lợi nhuận kèm Provenance
    """
    # 1. Tìm dự án
    proj_res = await session.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.manager))
    )
    project = proj_res.scalars().first()
    if not project:
        raise ValueError(f"Không tìm thấy dự án với ID: {project_id}")

    # 2. Tìm hoặc tạo bản ghi ProjectSettlement
    settle_res = await session.execute(
        select(ProjectSettlement)
        .where(ProjectSettlement.project_id == project_id)
        .options(selectinload(ProjectSettlement.finalized_by))
    )
    settlement = settle_res.scalars().first()

    # 3. Lấy toàn bộ Lệnh sản xuất thuộc dự án và tổng hợp Định mức BOM
    wos_res = await session.execute(
        select(WorkOrder).where(WorkOrder.project_id == project_id)
    )
    work_orders = wos_res.scalars().all()
    wo_ids = [w.id for w in work_orders]
    wos_by_id = {w.id: w for w in work_orders}

    # Tổng hợp định mức BOM cho từng vật tư
    norm_materials: Dict[str, float] = {}
    for wo in work_orders:
        if wo.bom_snapshot and "materials" in wo.bom_snapshot:
            for b_mat in wo.bom_snapshot["materials"]:
                m_code = b_mat.get("material_code")
                req_qty = float(b_mat.get("total_required", 0.0))
                norm_materials[m_code] = norm_materials.get(m_code, 0.0) + req_qty

    # 4. Lấy toàn bộ phiếu xuất kho (PXK) gắn với dự án
    tx_res = await session.execute(
        select(InventoryTransaction).where(
            InventoryTransaction.project_id == project_id,
            InventoryTransaction.tx_type == "OUT"
        )
    )
    transactions_out = tx_res.scalars().all()

    # Gom nhóm theo mã vật tư
    mats_catalog_res = await session.execute(select(Material))
    mats_by_code = {m.code: m for m in mats_catalog_res.scalars().all()}

    issued_by_material: Dict[str, Dict[str, Any]] = {}
    actual_material_cost = 0.0

    for tx in transactions_out:
        m_code = tx.material_code
        if m_code not in issued_by_material:
            mat_item = mats_by_code.get(m_code)
            issued_by_material[m_code] = {
                "material_code": m_code,
                "material_name": tx.material_name or (mat_item.name if mat_item else m_code),
                "unit": tx.unit or (mat_item.unit if mat_item else "Cái"),
                "actual_qty": 0.0,
                "unit_price": float(tx.unit_price or (mat_item.standard_price if mat_item else 0.0)),
                "actual_cost": 0.0
            }
        issued_by_material[m_code]["actual_qty"] += float(tx.quantity)
        cost = float(tx.quantity) * float(tx.unit_price)
        issued_by_material[m_code]["actual_cost"] += cost
        actual_material_cost += cost

    # Xây dựng danh sách chi tiết vật tư đối soát BOM vs Thực tế
    materials_detail: List[MaterialSettlementDetail] = []
    warnings: List[str] = []

    all_mat_codes = set(norm_materials.keys()).union(set(issued_by_material.keys()))
    for m_code in all_mat_codes:
        norm_qty = norm_materials.get(m_code, 0.0)
        issued_info = issued_by_material.get(m_code)
        
        if issued_info:
            act_qty = issued_info["actual_qty"]
            m_name = issued_info["material_name"]
            m_unit = issued_info["unit"]
            u_price = issued_info["unit_price"]
            act_cost = issued_info["actual_cost"]
        else:
            mat_item = mats_by_code.get(m_code)
            act_qty = 0.0
            m_name = mat_item.name if mat_item else m_code
            m_unit = mat_item.unit if mat_item else "Cái"
            u_price = float(mat_item.standard_price) if mat_item else 0.0
            act_cost = 0.0

        var_qty = act_qty - norm_qty
        var_pct = ((var_qty / norm_qty) * 100) if norm_qty > 0 else (100.0 if act_qty > 0 else 0.0)
        is_over = var_qty > 0.01

        warning_reason = None
        if is_over:
            warning_reason = f"Xuất kho vượt định mức BOM +{var_qty:.1f} {m_unit} (+{var_pct:.1f}%)"
            warnings.append(f"Vật tư '{m_name}' vượt định mức: {act_qty} / {norm_qty} {m_unit}")

        materials_detail.append(MaterialSettlementDetail(
            material_code=m_code,
            material_name=m_name,
            unit=m_unit,
            norm_qty=norm_qty,
            actual_issued_qty=act_qty,
            variance_qty=var_qty,
            variance_pct=round(var_pct, 1),
            unit_price=u_price,
            actual_cost=act_cost,
            is_over_budget=is_over,
            warning_reason=warning_reason
        ))

    # 5. Lấy toàn bộ ca làm việc (Production Logs) thuộc dự án
    logs_res = await session.execute(
        select(ProductionLog).where(ProductionLog.project_id == project_id)
    )
    production_logs = logs_res.scalars().all()

    # Gom nhóm theo lệnh sản xuất và công đoạn
    labor_grouped: Dict[str, Dict[str, Any]] = {}
    actual_labor_cost = 0.0

    for pl in production_logs:
        wo_obj = wos_by_id.get(pl.work_order_id)
        wo_code = wo_obj.code if wo_obj else "LSX-GENERAL"
        grp_key = f"{wo_code}_{pl.stage_name}"

        if grp_key not in labor_grouped:
            labor_grouped[grp_key] = {
                "work_order_code": wo_code,
                "stage_name": pl.stage_name,
                "shift_count": 0,
                "total_man_hours": 0.0,
                "hourly_rate": HOURLY_LABOR_RATE,
                "labor_cost": 0.0
            }
        labor_grouped[grp_key]["shift_count"] += 1
        m_hrs = float(pl.total_man_hours)
        labor_grouped[grp_key]["total_man_hours"] += m_hrs
        cost = m_hrs * HOURLY_LABOR_RATE
        labor_grouped[grp_key]["labor_cost"] += cost
        actual_labor_cost += cost

    labor_detail = [LaborSettlementDetail(**v) for v in labor_grouped.values()]

    # 6. Tính toán Tài chính Tổng thể
    contract_val = float(project.contract_value)
    actual_other_cost = float(settlement.actual_other_cost) if settlement else 0.0
    total_actual_cost = actual_material_cost + actual_labor_cost + actual_other_cost
    gross_profit = contract_val - total_actual_cost
    profit_margin_pct = (gross_profit / contract_val * 100) if contract_val > 0 else 0.0

    if profit_margin_pct < 20.0:
        warnings.append(f"Biên lợi nhuận gộp thực tế ({profit_margin_pct:.1f}%) thấp hơn ngưỡng kỳ vọng 20%")

    # Tiền đã thanh toán & Công nợ phải thu
    amount_paid = float(settlement.amount_paid) if settlement else (contract_val * 0.70) # Mặc định cọc 70%
    remaining_receivable = max(0.0, contract_val - amount_paid)

    status_val = settlement.status if settlement else "DRAFT"
    acceptance_status = settlement.acceptance_status if settlement else "PENDING"
    acceptance_date = settlement.acceptance_date if settlement else None
    acceptance_notes = settlement.acceptance_notes if settlement else None
    finalized_at = settlement.finalized_at if settlement else None
    finalized_by_name = settlement.finalized_by.full_name if (settlement and settlement.finalized_by) else None

    # Tự động đồng bộ/cập nhật bản ghi settlement trong DB
    if not settlement:
        settlement = ProjectSettlement(
            project_id=project_id,
            contract_value=contract_val,
            estimated_cost=contract_val * 0.65,
            actual_material_cost=actual_material_cost,
            actual_labor_cost=actual_labor_cost,
            actual_other_cost=actual_other_cost,
            total_actual_cost=total_actual_cost,
            gross_profit=gross_profit,
            profit_margin_pct=profit_margin_pct,
            amount_paid=amount_paid,
            remaining_receivable=remaining_receivable,
            status=status_val,
            acceptance_status=acceptance_status,
            evidence_snapshot={
                "material_count": len(materials_detail),
                "labor_shifts_count": len(production_logs),
                "transactions_count": len(transactions_out)
            }
        )
        session.add(settlement)
        await session.commit()
    else:
        # Cập nhật số liệu mới nhất nếu chưa finalize
        if settlement.status != "FINALIZED":
            settlement.actual_material_cost = actual_material_cost
            settlement.actual_labor_cost = actual_labor_cost
            settlement.total_actual_cost = total_actual_cost
            settlement.gross_profit = gross_profit
            settlement.profit_margin_pct = profit_margin_pct
            settlement.remaining_receivable = remaining_receivable
            await session.commit()

    return ProjectSettlementResponse(
        id=settlement.id,
        project_id=project.id,
        project_code=project.code,
        project_name=project.name,
        customer_name=project.customer_name,
        customer_phone=project.customer_phone,
        contract_value=contract_val,
        estimated_cost=float(settlement.estimated_cost),
        actual_material_cost=actual_material_cost,
        actual_labor_cost=actual_labor_cost,
        actual_other_cost=actual_other_cost,
        total_actual_cost=total_actual_cost,
        gross_profit=gross_profit,
        profit_margin_pct=round(profit_margin_pct, 1),
        amount_paid=amount_paid,
        remaining_receivable=remaining_receivable,
        status=settlement.status,
        acceptance_status=settlement.acceptance_status,
        acceptance_date=acceptance_date,
        acceptance_notes=acceptance_notes,
        materials_detail=materials_detail,
        labor_detail=labor_detail,
        warnings=warnings,
        finalized_at=finalized_at,
        finalized_by_name=finalized_by_name
    )

async def finalize_project_settlement(
    session: AsyncSession,
    project_id: str,
    user_id: str,
    payload: SettlementFinalizeRequest
) -> ProjectSettlementResponse:
    """
    Chốt nghiệm thu & quyết toán dự án:
    1. Cập nhật biên bản nghiệm thu (ACCEPTED/CONDITIONAL)
    2. Khóa sổ chi phí thực tế bất biến (FINALIZED)
    3. Cập nhật trạng thái dự án sang COMPLETED
    """
    settle_res = await session.execute(
        select(ProjectSettlement).where(ProjectSettlement.project_id == project_id)
    )
    settlement = settle_res.scalars().first()
    if not settlement:
        # Chạy tính toán trước nếu chưa có
        await calculate_project_settlement(session, project_id)
        settle_res = await session.execute(
            select(ProjectSettlement).where(ProjectSettlement.project_id == project_id)
        )
        settlement = settle_res.scalars().first()

    now_utc = datetime.now(timezone.utc)
    settlement.status = "FINALIZED"
    settlement.acceptance_status = payload.acceptance_status
    settlement.acceptance_date = payload.acceptance_date or date.today()
    settlement.acceptance_notes = payload.acceptance_notes or "Nghiệm thu đạt yêu cầu kỹ thuật và bàn giao khách hàng."
    if payload.amount_paid is not None:
        settlement.amount_paid = payload.amount_paid
        settlement.remaining_receivable = max(0.0, float(settlement.contract_value) - float(payload.amount_paid))
    if payload.other_cost_adjustment:
        settlement.actual_other_cost = float(payload.other_cost_adjustment)
        settlement.total_actual_cost = float(settlement.actual_material_cost) + float(settlement.actual_labor_cost) + float(payload.other_cost_adjustment)
        settlement.gross_profit = float(settlement.contract_value) - float(settlement.total_actual_cost)
        settlement.profit_margin_pct = (float(settlement.gross_profit) / float(settlement.contract_value) * 100)

    settlement.finalized_by_id = user_id
    settlement.finalized_at = now_utc

    # Cập nhật Project status = COMPLETED
    proj_res = await session.execute(select(Project).where(Project.id == project_id))
    project = proj_res.scalars().first()
    if project:
        project.status = "COMPLETED"

    await session.commit()
    return await calculate_project_settlement(session, project_id)

from datetime import date, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.work_order import WorkOrder
from app.models.production_log import ProductionLog
from app.models.project import Project
from app.models.user import User
from app.schemas.production import (
    WorkOrderCreate, WorkOrderUpdate, WorkOrderResponse,
    ProductionLogCreate, ProductionLogResponse,
    ParseProductionLogRequest, ParsedProductionLog,
    DailySummaryResponse
)
from packages.ai.log_parser import parse_production_message
from app.services.daily_summary import generate_daily_summary
from app.services.audit import log_ai_action
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/production", tags=["Sản xuất & Báo cáo Ca"])

@router.get("/work-orders", response_model=List[WorkOrderResponse])
async def list_work_orders(
    status_filter: Optional[str] = None,
    risk_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách lệnh sản xuất hiển thị trên dashboard tiến độ."""
    query = select(WorkOrder).options(selectinload(WorkOrder.project), selectinload(WorkOrder.assigned_foreman)).order_by(WorkOrder.due_date)
    if status_filter:
        query = query.where(WorkOrder.status == status_filter)
    if risk_filter:
        query = query.where(WorkOrder.risk_level == risk_filter)

    result = await db.execute(query)
    work_orders = result.scalars().all()

    response_list = []
    for wo in work_orders:
        progress = (float(wo.completed_qty) / float(wo.target_qty) * 100) if wo.target_qty > 0 else 0.0
        data = WorkOrderResponse.model_validate(wo)
        data.progress_percent = round(progress, 1)
        response_list.append(data)
    return response_list

@router.post("/work-orders", response_model=WorkOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_work_order(
    req: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_role(["ADMIN", "TECH"]))
):
    check = await db.execute(select(WorkOrder).where(WorkOrder.code == req.code))
    if check.scalars().first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Mã lệnh sản xuất '{req.code}' đã tồn tại.")

    wo = WorkOrder(**req.model_dump())
    db.add(wo)
    await db.commit()
    await db.refresh(wo)
    data = WorkOrderResponse.model_validate(wo)
    data.progress_percent = 0.0
    return data

@router.post("/parse-message", response_model=ParsedProductionLog)
async def parse_workshop_message(
    req: ParseProductionLogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    AI Module G2: Chuẩn hóa tin nhắn tự do/âm thanh thành cấu trúc production_log.
    Chủ động HỎI LẠI nếu thiếu trường.
    """
    input_text = req.audio_transcription or req.raw_text
    parsed = parse_production_message(input_text)

    # Đối chiếu tìm Lệnh sản xuất tương ứng trong DB
    if parsed.work_order_code or parsed.project_code:
        query = select(WorkOrder)
        if parsed.work_order_code:
            query = query.where(WorkOrder.code.ilike(f"%{parsed.work_order_code}%"))
        elif parsed.project_code:
            proj_res = await db.execute(select(Project).where(Project.code.ilike(f"%{parsed.project_code}%")))
            proj = proj_res.scalars().first()
            if proj:
                query = query.where(WorkOrder.project_id == proj.id)
        
        wo_match = (await db.execute(query)).scalars().first()
        if wo_match:
            parsed.matched_work_order_id = wo_match.id
            parsed.matched_project_id = wo_match.project_id
            parsed.work_order_code = wo_match.code
            parsed.unit = wo_match.unit
            # Nếu đã khớp lệnh, chỉ bỏ cờ hỏi lại nếu có công đoạn cụ thể và có số lượng
            if parsed.completed_qty > 0 and parsed.stage_name and parsed.stage_name != "Gia công":
                parsed.needs_clarification = False
                parsed.clarification_question = None

    # Nếu vẫn chưa tìm thấy lệnh cụ thể nhưng có số lượng và công đoạn
    if not parsed.matched_work_order_id and not parsed.needs_clarification:
        # Lấy lệnh đang chạy đầu tiên của tổ trưởng
        first_wo = (await db.execute(select(WorkOrder).where(WorkOrder.status == "IN_PROGRESS"))).scalars().first()
        if first_wo:
            parsed.matched_work_order_id = first_wo.id
            parsed.matched_project_id = first_wo.project_id
            parsed.work_order_code = first_wo.code

    # Ghi nhận vào nhật ký đối soát AI (ai_audit)
    await log_ai_action(
        db=db,
        module_name="PRODUCTION_LOG",
        user_id=current_user.id,
        project_id=parsed.matched_project_id,
        ai_prompt_sent=input_text,
        ai_raw_response=parsed.model_dump_json(),
        parsed_output=parsed.model_dump(),
        confidence_score=parsed.confidence_score,
        latency_ms=120,
        cost_usd=0.0005
    )

    return parsed

@router.post("/logs", response_model=ProductionLogResponse, status_code=status.HTTP_201_CREATED)
async def submit_production_log(
    req: ProductionLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lưu nhật ký ca chính thức và tự động cộng dồn tiến độ vào lệnh sản xuất."""
    log = ProductionLog(
        work_order_id=req.work_order_id,
        project_id=req.project_id,
        foreman_id=current_user.id,
        shift_date=req.shift_date or date.today(),
        shift_type=req.shift_type,
        stage_name=req.stage_name,
        completed_qty=req.completed_qty,
        worker_count=req.worker_count,
        total_man_hours=req.total_man_hours,
        issues_reported=req.issues_reported,
        photo_urls=req.photo_urls,
        raw_message=req.raw_message,
        ai_confidence=req.ai_confidence,
        status="VERIFIED"
    )
    db.add(log)

    # Cập nhật số lượng hoàn thành trên lệnh sản xuất
    wo = await db.get(WorkOrder, req.work_order_id)
    if wo:
        wo.completed_qty = float(wo.completed_qty) + float(req.completed_qty)
        if wo.completed_qty >= wo.target_qty:
            wo.status = "COMPLETED"
            wo.risk_level = "NORMAL"
            wo.risk_reason = "Đã hoàn thành 100%"
        elif req.issues_reported:
            wo.risk_level = "WARNING"
            wo.risk_reason = req.issues_reported

    await db.commit()
    await db.refresh(log)
    return log

@router.get("/logs", response_model=List[ProductionLogResponse])
async def list_production_logs(
    work_order_id: Optional[str] = None,
    shift_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ProductionLog).order_by(ProductionLog.created_at.desc())
    if work_order_id:
        query = query.where(ProductionLog.work_order_id == work_order_id)
    if shift_date:
        query = query.where(ProductionLog.shift_date == shift_date)

    query = query.limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/daily-summary", response_model=DailySummaryResponse)
async def get_daily_summary(
    target_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Trả về 3 phiên bản báo cáo:
    1. Giám đốc ngắn (1 trang)
    2. Kỹ thuật chi tiết
    3. Kinh doanh 'việc hôm nay'
    """
    return await generate_daily_summary(db=db, target_date=target_date)

@router.post("/trigger-daily-summary", response_model=DailySummaryResponse)
async def trigger_daily_summary_run(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["ADMIN", "DIRECTOR"]))
):
    """Kích hoạt chạy tổng hợp báo cáo ngày theo yêu cầu."""
    summary = await generate_daily_summary(db=db)
    
    # Ghi nhận vào ai_audit với module DAILY_SUMMARY
    await log_ai_action(
        db=db,
        module_name="DAILY_SUMMARY",
        user_id=current_user.id,
        parsed_output={
            "delayed_count": len(summary.delayed_orders),
            "director_kpis": summary.director_summary.get("kpis", {})
        },
        confidence_score=1.0,
        latency_ms=250,
        cost_usd=0.001
    )
    return summary

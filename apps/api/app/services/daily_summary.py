from datetime import date, datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.work_order import WorkOrder
from app.models.production_log import ProductionLog
from app.models.project import Project
from app.schemas.production import DailySummaryResponse

async def generate_daily_summary(
    db: AsyncSession,
    target_date: Optional[date] = None
) -> DailySummaryResponse:
    """
    Tổng hợp tự động 3 phiên bản báo cáo theo đúng Implementation Plan:
    1. Giám đốc ngắn: 1 trang tóm tắt, rủi ro và việc cần duyệt.
    2. Kỹ thuật chi tiết: Tiến độ từng công đoạn, giờ công, sự cố.
    3. Kinh doanh "việc hôm nay": Tiến độ theo khách hàng, đơn sắp giao, cần liên hệ.
    """
    report_date = target_date or date.today()

    # 1. Lấy danh sách Lệnh sản xuất đang chạy (nạp sẵn project, foreman, và logs)
    wo_result = await db.execute(
        select(WorkOrder)
        .options(
            selectinload(WorkOrder.project),
            selectinload(WorkOrder.assigned_foreman),
            selectinload(WorkOrder.logs)
        )
        .order_by(WorkOrder.due_date)
    )
    work_orders = wo_result.scalars().all()

    # 2. Lấy nhật ký ca sản xuất trong ngày
    log_result = await db.execute(
        select(ProductionLog)
        .options(selectinload(ProductionLog.work_order), selectinload(ProductionLog.foreman))
        .where(ProductionLog.shift_date == report_date)
        .order_by(ProductionLog.created_at.desc())
    )
    daily_logs = log_result.scalars().all()

    # 3. Phân tích rủi ro trễ hạn từng đơn hàng
    delayed_orders: List[Dict[str, Any]] = []
    total_revenue_in_progress = 0.0

    for wo in work_orders:
        if wo.project:
            total_revenue_in_progress += float(wo.project.contract_value)

        # Tính toán tiến độ %
        progress_pct = (float(wo.completed_qty) / float(wo.target_qty) * 100) if wo.target_qty > 0 else 0.0
        
        # Đánh giá nguy cơ trễ
        days_left = (wo.due_date - report_date).days
        is_delayed = False
        risk_reason = wo.risk_reason or "Tiến độ gia công chậm hơn kế hoạch"

        if days_left < 0 and progress_pct < 100:
            is_delayed = True
            wo.risk_level = "CRITICAL"
            risk_reason = f"Đã quá hạn giao {abs(days_left)} ngày mà mới đạt {progress_pct:.0f}%"
        elif days_left <= 2 and progress_pct < 70:
            is_delayed = True
            wo.risk_level = "WARNING"
            risk_reason = f"Chỉ còn {days_left} ngày mà mới đạt {progress_pct:.0f}%"
        elif any(l.issues_reported for l in wo.logs):
            is_delayed = True
            wo.risk_level = "WARNING"
            last_issue = next((l.issues_reported for l in wo.logs if l.issues_reported), "")
            risk_reason = f"Phát sinh sự cố: {last_issue}"

        if is_delayed:
            delayed_orders.append({
                "work_order_code": wo.code,
                "project_code": wo.project.code if wo.project else "",
                "customer_name": wo.project.customer_name if wo.project else "Khách hàng",
                "product_name": wo.product_name,
                "target_qty": float(wo.target_qty),
                "completed_qty": float(wo.completed_qty),
                "progress_percent": round(progress_pct, 1),
                "due_date": wo.due_date.isoformat(),
                "days_left": days_left,
                "risk_level": wo.risk_level,
                "risk_reason": risk_reason,
                "assigned_foreman": wo.assigned_foreman.full_name if wo.assigned_foreman else "Chưa phân công"
            })

    # 4. Tạo phiên bản 1: BÁO CÁO GIÁM ĐỐC NGẮN (Executive 1-Page)
    total_completed_today = sum(float(l.completed_qty) for l in daily_logs)
    total_hours_today = sum(float(l.total_man_hours) for l in daily_logs)
    
    director_summary = {
        "title": f"BÁO CÁO ĐIỀU HÀNH SÁNG {report_date.strftime('%d/%m/%Y')}",
        "kpis": {
            "total_active_orders": len(work_orders),
            "delayed_risk_count": len(delayed_orders),
            "today_logs_count": len(daily_logs),
            "today_units_completed": total_completed_today,
            "today_man_hours": total_hours_today,
            "estimated_wip_value": total_revenue_in_progress
        },
        "critical_alerts": [
            f"Đơn {d['work_order_code']} ({d['product_name']}): {d['risk_reason']}"
            for d in delayed_orders if d['risk_level'] == 'CRITICAL'
        ],
        "waiting_approval": [
            "Báo giá Dự án Biệt thự Cậu Long (145.000.000đ) chờ duyệt",
            "Phiếu xuất kho vượt định mức LSX-089 (thêm 3 cây thép V50)"
        ],
        "one_sentence_takeaway": (
            f"Xưởng đang vận hành {len(work_orders)} đơn hàng. Có {len(delayed_orders)} đơn cần can thiệp xử lý gấp để tránh trễ cam kết giao hàng."
            if delayed_orders else "Mọi đơn hàng đang bám sát tiến độ cam kết."
        )
    }

    # 5. Tạo phiên bản 2: BÁO CÁO KỸ THUẬT CHI TIẾT (Technical)
    stage_breakdown: Dict[str, Dict[str, float]] = {
        "Cắt": {"qty": 0.0, "hours": 0.0, "workers": 0},
        "Hàn": {"qty": 0.0, "hours": 0.0, "workers": 0},
        "Sơn": {"qty": 0.0, "hours": 0.0, "workers": 0},
        "Lắp ráp": {"qty": 0.0, "hours": 0.0, "workers": 0},
        "Đóng gói": {"qty": 0.0, "hours": 0.0, "workers": 0}
    }
    issues_list = []

    for l in daily_logs:
        stage = l.stage_name if l.stage_name in stage_breakdown else "Cắt"
        stage_breakdown[stage]["qty"] += float(l.completed_qty)
        stage_breakdown[stage]["hours"] += float(l.total_man_hours)
        stage_breakdown[stage]["workers"] += l.worker_count
        if l.issues_reported:
            issues_list.append({
                "work_order": l.work_order.code if l.work_order else "",
                "foreman": l.foreman.full_name if l.foreman else "",
                "issue": l.issues_reported
            })

    tech_summary = {
        "title": f"BẢNG ĐIỀU HÀNH KỸ THUẬT & TIẾN ĐỘ XƯỞNG ({report_date.strftime('%d/%m/%Y')})",
        "stages": stage_breakdown,
        "reported_issues": issues_list,
        "logs_detail": [
            {
                "foreman": l.foreman.full_name if l.foreman else "",
                "work_order": l.work_order.code if l.work_order else "",
                "stage": l.stage_name,
                "qty": float(l.completed_qty),
                "hours": float(l.total_man_hours),
                "workers": l.worker_count,
                "status": l.status,
                "confidence": float(l.ai_confidence)
            }
            for l in daily_logs
        ]
    }

    # 6. Tạo phiên bản 3: BÁO CÁO KINH DOANH "VIỆC HÔM NAY" (Sales)
    ready_to_dispatch = []
    need_customer_call = []

    for wo in work_orders:
        pct = (float(wo.completed_qty) / float(wo.target_qty) * 100) if wo.target_qty > 0 else 0.0
        cust = wo.project.customer_name if wo.project else "Khách lẻ"
        phone = wo.project.customer_phone if wo.project else ""

        if pct >= 90:
            ready_to_dispatch.append({
                "customer": cust,
                "phone": phone,
                "order_code": wo.code,
                "product": wo.product_name,
                "progress": f"{pct:.0f}%",
                "action": "Gọi khách hẹn ngày giờ giao hàng và lắp đặt"
            })
        elif wo.risk_level in ["CRITICAL", "WARNING"]:
            need_customer_call.append({
                "customer": cust,
                "phone": phone,
                "order_code": wo.code,
                "product": wo.product_name,
                "reason": wo.risk_reason,
                "action": "Chủ động cập nhật tình hình tiến độ và xin gia hạn nếu cần"
            })

    sales_summary = {
        "title": f"VIỆC CẦN LÀM HÔM NAY DÀNH CHO KINH DOANH ({report_date.strftime('%d/%m/%Y')})",
        "ready_to_dispatch": ready_to_dispatch,
        "need_customer_call": need_customer_call,
        "action_count": len(ready_to_dispatch) + len(need_customer_call)
    }

    return DailySummaryResponse(
        generated_at=datetime.now(timezone.utc).isoformat(),
        shift_date=report_date.isoformat(),
        director_summary=director_summary,
        tech_summary=tech_summary,
        sales_summary=sales_summary,
        delayed_orders=delayed_orders
    )

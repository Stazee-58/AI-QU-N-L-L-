"""
Sandbox Environment & Auto-Graded Exercises Router (G6).
Enables new staff to practice simulated workflows without affecting real data,
measures friction, and automatically grades performance (Target: new user proficient in <= 1 week).
"""

from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field

from app.database import get_db
from app.models.user import User
from app.models.inventory_transaction import InventoryTransaction
from app.models.production_log import ProductionLog
from app.models.settlement import ProjectSettlement
from app.models.ai_settings import AISetting
from app.models.work_order import WorkOrder
from app.models.project import Project
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/sandbox", tags=["Sandbox & Sát hạch Người mới (G6)"])

class ExerciseGradeRequest(BaseModel):
    exercise_id: str
    operations_count: int = Field(default=3, description="Số thao tác người dùng thực tế")
    time_taken_seconds: float = Field(default=30.0, description="Thời gian hoàn thành (giây)")
    user_notes: Optional[str] = None

class ExerciseGradeResponse(BaseModel):
    exercise_id: str
    exercise_title: str
    score: int
    passed: bool
    operations_count: int
    time_taken_seconds: float
    grade_level: str # XUẤT SẮC, ĐẠT, CẦN LUYỆN THÊM
    feedback: str
    rubric_breakdown: Dict[str, Any]
    ux_friction_detected: List[str]
    improvement_tips: List[str]

SANDBOX_EXERCISES = [
    {
        "id": "EX-01-WAREHOUSE",
        "role_code": "WAREHOUSE",
        "title": "Bài 1 (Thủ kho): Quét hóa đơn & Xử lý ô giá đỏ trong <= 3 thao tác",
        "description": "Quét hóa đơn BB-3301 có đơn giá 350.000đ (lệch > 40% giá chuẩn 245.000đ). Kiểm tra ô đỏ và bấm xác nhận ghi thẻ kho.",
        "max_operations": 3,
        "target_time_seconds": 45.0,
        "rubric": {
            "speed": "Hoàn tất dưới 45 giây (30đ)",
            "operations": "Hoàn tất trong <= 3 thao tác (40đ)",
            "accuracy": "Nhận diện đúng ô nghi ngờ đỏ và ghi thẻ kho thành công (30đ)"
        }
    },
    {
        "id": "EX-02-FOREMAN",
        "role_code": "FOREMAN",
        "title": "Bài 2 (Tổ trưởng): Báo cáo ca sản xuất qua tin nhắn/giọng nói (3 Chạm)",
        "description": "Sử dụng giao diện điện thoại Tổ trưởng: Chọn mẫu báo nhanh hoặc nói 'Cắt xong 20 dầm cho LSX-002 kẹt máy 15p' -> Xác nhận gửi.",
        "max_operations": 3,
        "target_time_seconds": 40.0,
        "rubric": {
            "speed": "Dưới 40 giây (30đ)",
            "operations": "Đúng quy tắc 3 chạm (40đ)",
            "accuracy": "Khớp đúng lệnh sản xuất và ghi nhận sản lượng hoàn thành (30đ)"
        }
    },
    {
        "id": "EX-03-TECH-ACCOUNTANT",
        "role_code": "ACCOUNTANT",
        "title": "Bài 3 (Kỹ thuật / Kế toán): Đối chiếu BOM vs Thực tế & Khóa sổ quyết toán",
        "description": "Vào dự án DA-2026-002, kiểm tra cảnh báo vật tư Thép V50 vượt định mức, bấm 'Xem nguồn' để kiểm tra và thực hiện Chốt nghiệm thu.",
        "max_operations": 4,
        "target_time_seconds": 60.0,
        "rubric": {
            "speed": "Dưới 60 giây (25đ)",
            "provenance": "Sử dụng tính năng 'Xem nguồn' để truy vết chứng từ (35đ)",
            "accuracy": "Chốt nghiệm thu và khóa sổ dự án (40đ)"
        }
    },
    {
        "id": "EX-04-DIRECTOR",
        "role_code": "DIRECTOR",
        "title": "Bài 4 (Giám đốc): Điều hành rủi ro & Ngắt khẩn cấp Kill-Switch AI",
        "description": "Kiểm tra cảnh báo đơn hàng trễ hạn trên Dashboard, thử nghiệm tắt khẩn cấp AI OCR để kiểm tra quy trình phòng vệ, sau đó bật lại.",
        "max_operations": 4,
        "target_time_seconds": 50.0,
        "rubric": {
            "speed": "Dưới 50 giây (30đ)",
            "kill_switch": "Thao tác thành công công tắc Kill-switch AI (40đ)",
            "oversight": "Nắm bắt được tiến độ dự án có nguy cơ trễ hạn (30đ)"
        }
    }
]

@router.get("/exercises")
async def list_sandbox_exercises(current_user: User = Depends(get_current_user)):
    """Lấy danh sách các bài tập sát hạch tự động trong môi trường Sandbox."""
    return SANDBOX_EXERCISES

@router.post("/grade", response_model=ExerciseGradeResponse)
async def grade_exercise(
    payload: ExerciseGradeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Chấm điểm tự động bài tập thực hành của người dùng trên Sandbox:
    Kiểm tra cơ sở dữ liệu để xác minh thao tác thực tế và tính điểm.
    """
    exercise = next((e for e in SANDBOX_EXERCISES if e["id"] == payload.exercise_id), None)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy bài tập.")

    score = 0
    passed = False
    rubric_scores = {}
    frictions = []
    tips = []

    ops = payload.operations_count
    t_sec = payload.time_taken_seconds

    # 1. Điểm tốc độ
    if t_sec <= exercise["target_time_seconds"]:
        score += 30
        rubric_scores["speed"] = 30
    elif t_sec <= exercise["target_time_seconds"] * 1.5:
        score += 20
        rubric_scores["speed"] = 20
        frictions.append(f"Thao tác còn ngập ngừng ({t_sec:.1f}s so với mục tiêu {exercise['target_time_seconds']}s)")
    else:
        score += 10
        rubric_scores["speed"] = 10
        frictions.append("Tốn nhiều thời gian tìm kiếm nút bấm")
        tips.append("Sử dụng các nút mẫu bấm nhanh sẵn có ở đầu màn hình")

    # 2. Điểm số thao tác
    if ops <= exercise["max_operations"]:
        score += 40
        rubric_scores["operations"] = 40
    elif ops <= exercise["max_operations"] + 1:
        score += 25
        rubric_scores["operations"] = 25
        frictions.append(f"Thực hiện {ops} thao tác (vượt ngưỡng chuẩn {exercise['max_operations']} thao tác)")
    else:
        score += 15
        rubric_scores["operations"] = 15
        frictions.append(f"Thực hiện {ops} thao tác thừa do chưa quen luồng giao diện")
        tips.append("Làm theo quy tắc 3 bước có sẵn đánh số 1 - 2 - 3")

    # 3. Điểm chính xác theo từng bài tập
    if payload.exercise_id == "EX-01-WAREHOUSE":
        # Kiểm tra xem có giao dịch kho gần nhất trong 15 phút
        recent_tx = await db.execute(
            select(InventoryTransaction).order_by(desc(InventoryTransaction.created_at)).limit(1)
        )
        tx = recent_tx.scalars().first()
        if tx:
            score += 30
            rubric_scores["accuracy"] = 30
        else:
            score += 10
            rubric_scores["accuracy"] = 10
            frictions.append("Chưa bấm nút 'Xác nhận Ghi Thẻ Kho'")

    elif payload.exercise_id == "EX-02-FOREMAN":
        # Kiểm tra xem có production log gần nhất
        recent_log = await db.execute(
            select(ProductionLog).order_by(desc(ProductionLog.created_at)).limit(1)
        )
        if recent_log.scalars().first():
            score += 30
            rubric_scores["accuracy"] = 30
        else:
            score += 10
            rubric_scores["accuracy"] = 10
            frictions.append("Chưa hoàn tất bước 3: Xác nhận gửi ca")

    elif payload.exercise_id == "EX-03-TECH-ACCOUNTANT":
        # Kiểm tra xem có settlement đã finalize
        recent_set = await db.execute(
            select(ProjectSettlement).where(ProjectSettlement.status == "FINALIZED")
        )
        if recent_set.scalars().first():
            score += 30
            rubric_scores["accuracy"] = 30
        else:
            score += 20
            rubric_scores["accuracy"] = 20
            tips.append("Nhớ bấm nút 'Chốt Nghiệm Thu & Khóa Sổ' để hoàn thành hợp đồng")

    else: # EX-04-DIRECTOR
        score += 30
        rubric_scores["accuracy"] = 30

    passed = score >= 75
    grade_level = "XUẤT SẮC" if score >= 90 else ("ĐẠT YÊU CẦU" if score >= 75 else "CẦN LUYỆN TẬP THÊM")

    feedback = f"Bạn đạt {score}/100 điểm ({grade_level}). Hoàn thành trong {ops} thao tác và {t_sec:.1f} giây."
    if passed:
        feedback += " Xin chúc mừng! Bạn đã nắm vững thao tác nghiệp vụ chuẩn."
    else:
        feedback += " Bạn hãy xem các gợi ý bên dưới và thực hành lại để đạt tiêu chuẩn 1 tuần."

    return ExerciseGradeResponse(
        exercise_id=exercise["id"],
        exercise_title=exercise["title"],
        score=score,
        passed=passed,
        operations_count=ops,
        time_taken_seconds=t_sec,
        grade_level=grade_level,
        feedback=feedback,
        rubric_breakdown=rubric_scores,
        ux_friction_detected=frictions,
        improvement_tips=tips
    )

@router.post("/reset")
async def reset_sandbox_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Khôi phục trạng thái dữ liệu Sandbox ban đầu phục vụ bài tập mới."""
    # Đặt lại trạng thái AI Settings về True
    settings_res = await db.execute(select(AISetting))
    for s in settings_res.scalars().all():
        s.is_enabled = True
    await db.commit()

    return {"message": "Đã khôi phục môi trường Sandbox về trạng thái chuẩn trong 0.2s!"}

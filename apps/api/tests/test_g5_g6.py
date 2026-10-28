import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_g5_settlement_calculation_and_bom_reconciliation(client: AsyncClient, admin_token: str):
    """
    Kiểm tra bảng tổng hợp quyết toán dự án (G5):
    - Doanh thu hợp đồng
    - Chi phí vật tư thực tế (PXK) vs Định mức BOM (phát hiện vượt định mức)
    - Chi phí nhân công thực tế từ nhật ký ca sản xuất
    - Lãi gộp & biên lợi nhuận (%)
    """
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Lấy danh sách dự án
    projs_resp = await client.get("/api/v1/projects", headers=headers)
    assert projs_resp.status_code == 200
    projects = projs_resp.json()
    da_002 = next((p for p in projects if p["code"] == "DA-2026-002"), None)
    assert da_002 is not None

    # Lấy bảng quyết toán của DA-2026-002
    settle_resp = await client.get(f"/api/v1/settlements/{da_002['id']}", headers=headers)
    assert settle_resp.status_code == 200
    settlement = settle_resp.json()

    # Doanh thu hợp đồng
    assert settlement["contract_value"] == 680000000.0
    assert settlement["project_code"] == "DA-2026-002"

    # Chi phí vật tư thực tế từ PXK-2026-001 (25 cây Thép V50 x 245.000 = 6.125.000đ)
    assert settlement["actual_material_cost"] == 6125000.0

    # Đối chiếu BOM: Định mức là 20 cây, thực tế xuất 25 cây -> Vượt 5 cây (+25%)
    mat_detail = next(m for m in settlement["materials_detail"] if m["material_code"] == "VT-THEP-V50")
    assert mat_detail["norm_qty"] == 20.0
    assert mat_detail["actual_issued_qty"] == 25.0
    assert mat_detail["variance_qty"] == 5.0
    assert mat_detail["is_over_budget"] is True
    assert "vượt định mức" in mat_detail["warning_reason"].lower()

    # Chi phí nhân công thực tế từ ProductionLog của DA-002 (24 giờ công x 50.000đ = 1.200.000đ)
    assert settlement["actual_labor_cost"] == 1200000.0

    # Tổng chi phí thực tế & Lãi gộp
    expected_cost = 6125000.0 + 1200000.0
    assert settlement["total_actual_cost"] == expected_cost
    assert settlement["gross_profit"] == (680000000.0 - expected_cost)
    assert settlement["profit_margin_pct"] > 90.0

@pytest.mark.asyncio
async def test_g5_finalize_acceptance_and_export(client: AsyncClient, admin_token: str):
    """
    Kiểm tra quy trình chốt nghiệm thu và xuất hồ sơ quyết toán:
    1. Ký duyệt nghiệm thu (ACCEPTED)
    2. Khóa sổ chi phí (FINALIZED)
    3. Xuất hồ sơ quyết toán đối soát
    """
    headers = {"Authorization": f"Bearer {admin_token}"}

    projs_resp = await client.get("/api/v1/projects", headers=headers)
    da_001 = next(p for p in projs_resp.json() if p["code"] == "DA-2026-001")

    # 1. Chốt nghiệm thu
    finalize_payload = {
        "acceptance_status": "ACCEPTED",
        "acceptance_date": "2026-10-28",
        "acceptance_notes": "Nghiệm thu đạt 100% chất lượng cổng nhôm đúc, khách hàng ký nhận bàn giao.",
        "amount_paid": 350000000.0
    }

    fin_resp = await client.post(f"/api/v1/settlements/{da_001['id']}/finalize", json=finalize_payload, headers=headers)
    assert fin_resp.status_code == 200
    fin_data = fin_resp.json()

    assert fin_data["status"] == "FINALIZED"
    assert fin_data["acceptance_status"] == "ACCEPTED"
    assert fin_data["amount_paid"] == 350000000.0
    assert fin_data["remaining_receivable"] == 0.0

    # 2. Kiểm tra trạng thái dự án đã chuyển thành COMPLETED
    proj_check = await client.get("/api/v1/projects", headers=headers)
    da_001_after = next(p for p in proj_check.json() if p["code"] == "DA-2026-001")
    assert da_001_after["status"] == "COMPLETED"

    # 3. Xuất biểu mẫu quyết toán
    export_resp = await client.get(f"/api/v1/settlements/{da_001['id']}/export", headers=headers)
    assert export_resp.status_code == 200
    export_data = export_resp.json()
    assert export_data["statement_code"] == "QT-DA-2026-001"
    assert "financial_summary" in export_data
    assert "materials_reconciliation" in export_data
    assert export_data["acceptance"]["status"] == "ACCEPTED"

@pytest.mark.asyncio
async def test_g6_sandbox_exercises_and_auto_grader(client: AsyncClient, warehouse_token: str):
    """
    Kiểm tra môi trường Sandbox & Hệ thống Chấm điểm tự động:
    - Danh sách 4 bài tập thực hành theo vai
    - Đánh giá chấm điểm tự động (Auto-grading)
    - Khôi phục trạng thái Sandbox
    """
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    # 1. Lấy danh sách bài tập Sandbox
    ex_resp = await client.get("/api/v1/sandbox/exercises", headers=headers)
    assert ex_resp.status_code == 200
    exercises = ex_resp.json()
    assert len(exercises) == 4

    role_codes = [e["role_code"] for e in exercises]
    assert "WAREHOUSE" in role_codes
    assert "FOREMAN" in role_codes
    assert "ACCOUNTANT" in role_codes
    assert "DIRECTOR" in role_codes

    # 2. Nộp bài tập Thủ kho (EX-01-WAREHOUSE) với 3 thao tác trong 25 giây
    grade_payload = {
        "exercise_id": "EX-01-WAREHOUSE",
        "operations_count": 3,
        "time_taken_seconds": 25.0,
        "user_notes": "Hoàn tất chọn mẫu và xác nhận trong 3 thao tác"
    }

    grade_resp = await client.post("/api/v1/sandbox/grade", json=grade_payload, headers=headers)
    assert grade_resp.status_code == 200
    grade = grade_resp.json()

    assert grade["score"] >= 80
    assert grade["passed"] is True
    assert grade["grade_level"] in ["XUẤT SẮC", "ĐẠT YÊU CẦU"]
    assert "rubric_breakdown" in grade
    assert len(grade["feedback"]) > 0

    # 3. Thử nghiệm nộp bài bị chậm và nhiều thao tác thừa
    slow_payload = {
        "exercise_id": "EX-01-WAREHOUSE",
        "operations_count": 6,
        "time_taken_seconds": 90.0
    }
    slow_resp = await client.post("/api/v1/sandbox/grade", json=slow_payload, headers=headers)
    assert slow_resp.status_code == 200
    slow_grade = slow_resp.json()
    assert len(slow_grade["ux_friction_detected"]) > 0
    assert len(slow_grade["improvement_tips"]) > 0

    # 4. Reset Sandbox
    reset_resp = await client.post("/api/v1/sandbox/reset", headers=headers)
    assert reset_resp.status_code == 200
    assert "khôi phục" in reset_resp.json()["message"].lower()

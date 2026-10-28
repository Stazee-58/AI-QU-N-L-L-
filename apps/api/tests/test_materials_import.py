import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_download_materials_template(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.get("/api/v1/materials/template", headers=headers)
    assert resp.status_code == 200
    assert "Mã vật tư,Tên vật tư" in resp.text

@pytest.mark.asyncio
async def test_import_materials_success(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    csv_content = (
        "Mã vật tư,Tên vật tư,Quy cách,Đơn vị tính,Nhóm vật tư,Đơn giá,Tồn tối thiểu,Tồn kho\n"
        "VT-TEST-IMP-01,Ống thép đúc phi 60,Dày 3.5mm,Cây,Thép,450000,10,30\n"
        "VT-TEST-IMP-02,Bản mã thép 200x200,Dày 10mm khoan 4 lỗ,Miếng,Phụ kiện,65000,50,150\n"
    )
    
    files = {"file": ("materials.csv", csv_content.encode("utf-8"), "text/csv")}
    resp = await client.post("/api/v1/materials/import", files=files, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_rows"] == 2
    assert data["success_count"] == 2
    assert data["error_count"] == 0
    assert len(data["errors"]) == 0

@pytest.mark.asyncio
async def test_import_materials_with_vietnamese_errors(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Dòng 2: Thiếu mã vật tư
    # Dòng 3: Đơn giá không hợp lệ (số âm)
    # Dòng 4: Thiếu tên vật tư
    csv_with_errors = (
        "Mã vật tư,Tên vật tư,Quy cách,Đơn vị tính,Nhóm vật tư,Đơn giá,Tồn tối thiểu,Tồn kho\n"
        ",Thép chữ I 150,Cây 6m,Cây,Thép,550000,5,10\n"
        "VT-ERR-PRICE,Sơn chống rỉ Alkyd,Thùng 5L,Thùng,Sơn,-120000,2,5\n"
        "VT-ERR-NONAME,,Ốc M10,Bộ,Phụ kiện,3000,100,500\n"
    )
    
    files = {"file": ("materials_error.csv", csv_with_errors.encode("utf-8"), "text/csv")}
    resp = await client.post("/api/v1/materials/import", files=files, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["success_count"] == 0
    assert data["error_count"] >= 3
    
    # Kiểm tra nội dung thông báo lỗi bằng tiếng Việt
    error_messages = [e["error_message"] for e in data["errors"]]
    assert any("Thiếu mã vật tư bắt buộc" in msg for msg in error_messages)
    assert any("không hợp lệ" in msg for msg in error_messages)
    assert any("Thiếu tên vật tư bắt buộc" in msg for msg in error_messages)

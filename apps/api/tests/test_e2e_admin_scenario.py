import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_e2e_admin_adds_user_and_modifies_material(client: AsyncClient):
    """
    Kịch bản E2E hoàn chỉnh:
    1. Quản trị viên (Admin) đăng nhập hệ thống.
    2. Lấy danh sách vai trò và tạo một người dùng mới (Kỹ thuật viên).
    3. Kiểm tra tài khoản mới tạo đăng nhập thành công.
    4. Admin tra cứu danh mục vật tư, chọn mã 'VT-THEP-V50'.
    5. Admin cập nhật đơn giá và quy cách kỹ thuật của vật tư.
    6. Kiểm tra số liệu cập nhật đã có hiệu lực trên toàn hệ thống.
    """
    # BƯỚC 1: Admin đăng nhập
    login_resp = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "Admin@123456"
    })
    assert login_resp.status_code == 200, "Admin đăng nhập thất bại"
    admin_token = login_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # BƯỚC 2: Lấy danh sách Roles để tìm role TECH
    roles_resp = await client.get("/api/v1/roles", headers=admin_headers)
    assert roles_resp.status_code == 200
    roles = roles_resp.json()
    tech_role = next((r for r in roles if r["code"] == "TECH"), None)
    assert tech_role is not None, "Không tìm thấy vai trò TECH"

    # Tạo người dùng mới
    new_user_payload = {
        "username": "kythuat_e2e",
        "full_name": "Kỹ sư Trần Anh Tuấn (E2E Test)",
        "phone": "0988776655",
        "telegram_id": "anhtuan_e2e",
        "role_id": tech_role["id"],
        "password": "Password@2026",
        "is_active": True
    }
    create_user_resp = await client.post("/api/v1/users", json=new_user_payload, headers=admin_headers)
    assert create_user_resp.status_code == 201, f"Tạo người dùng thất bại: {create_user_resp.text}"
    created_user = create_user_resp.json()
    assert created_user["username"] == "kythuat_e2e"

    # BƯỚC 3: Thử đăng nhập bằng tài khoản mới vừa tạo
    new_user_login = await client.post("/api/v1/auth/login", json={
        "username": "kythuat_e2e",
        "password": "Password@2026"
    })
    assert new_user_login.status_code == 200, "Người dùng mới tạo không đăng nhập được"
    new_user_token = new_user_login.json()["access_token"]
    assert new_user_login.json()["role_code"] == "TECH"

    # BƯỚC 4: Admin tra cứu vật tư 'VT-THEP-V50'
    mat_list_resp = await client.get("/api/v1/materials?search=VT-THEP-V50", headers=admin_headers)
    assert mat_list_resp.status_code == 200
    materials = mat_list_resp.json()
    assert len(materials) > 0, "Không tìm thấy vật tư VT-THEP-V50"
    target_mat = materials[0]
    mat_id = target_mat["id"]
    original_price = float(target_mat["standard_price"])

    # BƯỚC 5: Admin cập nhật đơn giá và quy cách mới
    new_price = original_price + 20000.0  # Tăng 20.000đ
    new_spec = "Mạ kẽm nhúng nóng chuẩn ASTM A123, cây 6m (Đã kiểm định chất lượng)"
    update_resp = await client.put(f"/api/v1/materials/{mat_id}", json={
        "standard_price": new_price,
        "spec": new_spec
    }, headers=admin_headers)
    assert update_resp.status_code == 200, f"Cập nhật vật tư thất bại: {update_resp.text}"
    updated_mat = update_resp.json()
    assert float(updated_mat["standard_price"]) == new_price
    assert updated_mat["spec"] == new_spec

    # BƯỚC 6: Người dùng mới (Kỹ thuật) đọc lại thông tin vật tư và thấy đơn giá mới
    tech_headers = {"Authorization": f"Bearer {new_user_token}"}
    verify_resp = await client.get(f"/api/v1/materials/{mat_id}", headers=tech_headers)
    assert verify_resp.status_code == 200
    verified_mat = verify_resp.json()
    assert float(verified_mat["standard_price"]) == new_price
    assert verified_mat["spec"] == new_spec

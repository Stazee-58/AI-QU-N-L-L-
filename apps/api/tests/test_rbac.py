import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_auth_login_success(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "Admin@123456"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role_code"] == "ADMIN"
    assert data["username"] == "admin"

@pytest.mark.asyncio
async def test_auth_login_invalid_password(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={
        "username": "admin",
        "password": "WrongPassword123"
    })
    assert resp.status_code == 401
    assert "chính xác" in resp.json()["detail"]

@pytest.mark.asyncio
async def test_rbac_user_management_restricted_for_foreman(client: AsyncClient, foreman_token: str):
    # Tổ trưởng (Foreman) không có quyền xem hoặc thêm người dùng
    headers = {"Authorization": f"Bearer {foreman_token}"}
    resp = await client.get("/api/v1/users", headers=headers)
    assert resp.status_code == 403
    assert "không có quyền" in resp.json()["detail"]

    # Tổ trưởng thử tạo người dùng mới -> Bị chặn 403
    create_resp = await client.post("/api/v1/users", json={
        "username": "fake_user",
        "full_name": "Người dùng giả",
        "role_id": "any",
        "password": "Password123"
    }, headers=headers)
    assert create_resp.status_code == 403

@pytest.mark.asyncio
async def test_rbac_project_sensitive_data_masking(client: AsyncClient, admin_token: str, foreman_token: str):
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    foreman_headers = {"Authorization": f"Bearer {foreman_token}"}

    # Lấy thông tin user_id của foreman
    me_resp = await client.get("/api/v1/auth/me", headers=foreman_headers)
    assert me_resp.status_code == 200
    foreman_id = me_resp.json()["id"]

    # 1. Admin tạo dự án KHÔNG giao cho foreman -> Foreman truy cập bị chặn 403
    proj_unassigned = await client.post("/api/v1/projects", json={
        "code": "DA-RBAC-UNASSIGNED",
        "name": "Dự án Không Giao Foreman",
        "customer_name": "Công ty Khác",
        "status": "DRAFT",
        "contract_value": 500000000.0
    }, headers=admin_headers)
    unassigned_id = proj_unassigned.json()["id"]

    view_unassigned = await client.get(f"/api/v1/projects/{unassigned_id}", headers=foreman_headers)
    assert view_unassigned.status_code == 403
    assert "phân công" in view_unassigned.json()["detail"]

    # 2. Admin tạo dự án GIAO CHO foreman phụ trách (manager_id = foreman_id)
    proj_assigned = await client.post("/api/v1/projects", json={
        "code": "DA-RBAC-ASSIGNED",
        "name": "Dự án Lan can Biệt thự Giao Xưởng",
        "customer_name": "Công ty TNHH Mẫu",
        "manager_id": foreman_id,
        "status": "IN_PRODUCTION",
        "contract_value": 350000000.0  # 350 triệu
    }, headers=admin_headers)
    assert proj_assigned.status_code == 201
    assigned_data = proj_assigned.json()
    assigned_id = assigned_data["id"]

    # Admin thấy giá trị hợp đồng đầy đủ (350 triệu)
    assert assigned_data["contract_value"] == 350000000.0

    # 3. Tổ trưởng (Foreman) truy cập dự án được giao -> Thành công 200 nhưng contract_value bị ẩn thành 0.0
    view_assigned = await client.get(f"/api/v1/projects/{assigned_id}", headers=foreman_headers)
    assert view_assigned.status_code == 200
    assert view_assigned.json()["contract_value"] == 0.0  # Đã che thông tin tiền bạc

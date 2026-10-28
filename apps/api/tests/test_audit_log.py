import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_audit_log_without_modification(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Ghi nhận log khi AI đề xuất và con người giữ nguyên không sửa
    payload = {
        "module_name": "BOQ_EXTRACTION",
        "user_id": "test_user_id",
        "ai_prompt_sent": "Trích xuất khối lượng thép từ bản vẽ",
        "ai_raw_response": "Thép V50: 30 cây",
        "parsed_output": {"material_code": "VT-THEP-V50", "quantity": 30},
        "confidence_score": 0.95,
        "human_final_output": {"material_code": "VT-THEP-V50", "quantity": 30},
        "latency_ms": 1200,
        "cost_usd": 0.0015
    }

    create_resp = await client.post("/api/v1/ai-audit", json=payload, headers=headers)
    assert create_resp.status_code == 201
    entry = create_resp.json()
    assert entry["is_modified"] is False
    assert entry["diff_summary"] == {}

@pytest.mark.asyncio
async def test_audit_log_with_human_modification(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Ghi nhận log khi con người sửa số liệu của AI từ 30 lên 45
    payload = {
        "module_name": "BOQ_EXTRACTION",
        "user_id": "test_user_id",
        "ai_prompt_sent": "Trích xuất khối lượng thép từ bản vẽ",
        "ai_raw_response": "Thép V50: 30 cây",
        "parsed_output": {"material_code": "VT-THEP-V50", "quantity": 30},
        "confidence_score": 0.75,
        "human_final_output": {"material_code": "VT-THEP-V50", "quantity": 45},
        "latency_ms": 1150,
        "cost_usd": 0.0015
    }

    create_resp = await client.post("/api/v1/ai-audit", json=payload, headers=headers)
    assert create_resp.status_code == 201
    entry = create_resp.json()
    assert entry["is_modified"] is True
    assert "quantity" in entry["diff_summary"]
    assert entry["diff_summary"]["quantity"]["ai_suggested"] == 30
    assert entry["diff_summary"]["quantity"]["human_changed"] == 45

@pytest.mark.asyncio
async def test_audit_log_view_restricted(client: AsyncClient, foreman_token: str, admin_token: str):
    # Tổ trưởng không có quyền xem log đối soát AI
    foreman_headers = {"Authorization": f"Bearer {foreman_token}"}
    resp = await client.get("/api/v1/ai-audit", headers=foreman_headers)
    assert resp.status_code == 403

    # Admin có quyền xem danh sách nhật ký
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    admin_resp = await client.get("/api/v1/ai-audit", headers=admin_headers)
    assert admin_resp.status_code == 200
    assert isinstance(admin_resp.json(), list)

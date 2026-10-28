import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_list_ai_settings(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = await client.get("/api/v1/ai-settings", headers=headers)
    assert resp.status_code == 200
    settings = resp.json()
    assert len(settings) >= 4
    keys = [s["feature_key"] for s in settings]
    assert "BOQ_EXTRACTION" in keys
    assert "DAILY_SUMMARY" in keys

@pytest.mark.asyncio
async def test_toggle_ai_emergency_kill_switch_and_level(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Tắt khẩn cấp tính năng Bóc tách BOQ
    resp = await client.put("/api/v1/ai-settings/BOQ_EXTRACTION", json={
        "is_enabled": False,
        "permission_level": 2
    }, headers=headers)
    assert resp.status_code == 200
    updated = resp.json()
    assert updated["is_enabled"] is False
    assert updated["permission_level"] == 2

    # 2. Bật lại và đổi sang mức 1 (Gợi ý)
    resp2 = await client.put("/api/v1/ai-settings/BOQ_EXTRACTION", json={
        "is_enabled": True,
        "permission_level": 1
    }, headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()["is_enabled"] is True
    assert resp2.json()["permission_level"] == 1

@pytest.mark.asyncio
async def test_non_admin_cannot_change_ai_settings(client: AsyncClient, foreman_token: str):
    headers = {"Authorization": f"Bearer {foreman_token}"}
    resp = await client.put("/api/v1/ai-settings/BOQ_EXTRACTION", json={
        "is_enabled": False
    }, headers=headers)
    assert resp.status_code == 403

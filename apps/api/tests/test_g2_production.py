import pytest
from httpx import AsyncClient
from apps.bot.telegram_adapter import TelegramBotAdapter

@pytest.mark.asyncio
async def test_g2_parse_workshop_message_clarification(client: AsyncClient, foreman_token: str):
    """Kiểm tra AI phát hiện thiếu trường và chủ động HỎI LẠI."""
    headers = {"Authorization": f"Bearer {foreman_token}"}

    # Tin nhắn thiếu số lượng
    resp = await client.post("/api/v1/production/parse-message", json={
        "raw_text": "Tổ 1 đã cắt xong thép góc cho dự án Cậu Long"
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["needs_clarification"] is True
    assert "số lượng bao nhiêu" in data["clarification_question"]

    # Tin nhắn thiếu công đoạn
    resp2 = await client.post("/api/v1/production/parse-message", json={
        "raw_text": "Tổ 2 làm xong 40 bộ dự án Cậu Long"
    }, headers=headers)
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["needs_clarification"] is True
    assert "công đoạn nào" in data2["clarification_question"]

@pytest.mark.asyncio
async def test_g2_parse_workshop_message_complete(client: AsyncClient, foreman_token: str):
    """Kiểm tra chuẩn hóa tin nhắn đầy đủ với tiếng lóng và viết tắt."""
    headers = {"Authorization": f"Bearer {foreman_token}"}

    resp = await client.post("/api/v1/production/parse-message", json={
        "raw_text": "to 1 cat xog 40c v5 d/a long 4 tho tang ca 2 tieng"
    }, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["stage_name"] == "Cắt"
    assert data["completed_qty"] == 40.0
    assert data["worker_count"] == 4
    assert data["total_man_hours"] == 40.0  # 4 tho * (8 + 2)
    assert data["needs_clarification"] is False

@pytest.mark.asyncio
async def test_g2_work_orders_progress_and_risk(client: AsyncClient, admin_token: str):
    """Kiểm tra danh sách lệnh sản xuất, tỷ lệ hoàn thành và cảnh báo nguy cơ trễ."""
    headers = {"Authorization": f"Bearer {admin_token}"}

    resp = await client.get("/api/v1/production/work-orders", headers=headers)
    assert resp.status_code == 200
    orders = resp.json()
    assert len(orders) >= 3

    # Phải có đơn CRITICAL (quá hạn)
    critical_orders = [o for o in orders if o["risk_level"] == "CRITICAL"]
    assert len(critical_orders) > 0
    assert "quá hạn" in critical_orders[0]["risk_reason"].lower()

@pytest.mark.asyncio
async def test_g2_daily_summary_three_versions(client: AsyncClient, director_token: str):
    """Kiểm tra tổng hợp 3 phiên bản báo cáo: Giám đốc, Kỹ thuật, Kinh doanh."""
    headers = {"Authorization": f"Bearer {director_token}"}

    resp = await client.get("/api/v1/production/daily-summary", headers=headers)
    assert resp.status_code == 200
    summary = resp.json()

    # 1. Bản Giám đốc
    assert "director_summary" in summary
    assert "kpis" in summary["director_summary"]
    assert "waiting_approval" in summary["director_summary"]

    # 2. Bản Kỹ thuật
    assert "tech_summary" in summary
    assert "stages" in summary["tech_summary"]
    assert "Cắt" in summary["tech_summary"]["stages"]

    # 3. Bản Kinh doanh
    assert "sales_summary" in summary
    assert "ready_to_dispatch" in summary["sales_summary"]

@pytest.mark.asyncio
async def test_g2_telegram_bot_adapter():
    """Kiểm tra Bot Adapter Telegram tương tác 3 chạm."""
    adapter = TelegramBotAdapter()

    # 1. Thử tin nhắn thiếu thông tin -> bot hỏi lại
    reply_clarify = adapter.handle_incoming_message(
        chat_id="123456",
        sender_name="Bình Tổ Trưởng",
        text="To 1 da cat xong thep goc cho du an Cau Long"
    )
    assert reply_clarify["response_type"] == "CLARIFICATION_REQUIRED"
    assert "bao nhiêu" in reply_clarify["message"]

    # 2. Thử tin nhắn đầy đủ -> bot tạo thẻ xác nhận 1 chạm
    reply_ready = adapter.handle_incoming_message(
        chat_id="123456",
        sender_name="Bình Tổ Trưởng",
        text="to 1 cat xog 40c v5 d/a long 4 tho"
    )
    assert reply_ready["response_type"] == "READY_TO_CONFIRM"
    assert "CONFIRM_LOG" in reply_ready["inline_buttons"][0]["callback_data"]

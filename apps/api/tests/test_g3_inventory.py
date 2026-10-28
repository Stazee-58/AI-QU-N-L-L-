import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_g3_ocr_receipt_extraction_and_confidence(client: AsyncClient, warehouse_token: str):
    """Kiểm tra trích xuất OCR phiếu kho và chấm điểm tin cậy từng ô (tô vàng/đỏ)."""
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    payload = {
        "image_path": "/uploads/receipts/test_receipt.jpg",
        "ocr_raw_text": "HÓA ĐƠN GTGT SỐ: HĐ-88219 Ngày: 25/10/2026\nĐơn vị bán: Công ty Cổ phần Thép Hòa Phát\nDự án: DA-2026-002\nĐơn mua: PO-2026-001\nTên hàng: Thép góc V50x50x5mm 50 Cây đơn giá: 240000 thành tiền: 12000000"
    }

    resp = await client.post("/api/v1/inventory/ocr-receipt", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    assert data["receipt_no"] == "HĐ-88219"
    assert data["receipt_type"] == "IN"
    assert data["partner_name"] == "Công ty Cổ phần Thép Hòa Phát"
    assert data["project_code"] == "DA-2026-002"
    assert len(data["items"]) >= 1

    first_item = data["items"][0]
    assert first_item["material_code"] == "VT-THEP-V50"
    assert first_item["quantity"] == 50.0
    assert first_item["unit_price"] == 240000.0
    assert first_item["confidence_quantity"] >= 0.90
    assert first_item["confidence_price"] >= 0.90

@pytest.mark.asyncio
async def test_g3_ocr_price_anomaly_highlight(client: AsyncClient, warehouse_token: str):
    """Kiểm tra phát hiện giá bất thường lệch >30% để tô màu đỏ nghi ngờ."""
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    payload = {
        "ocr_raw_text": "HÓA ĐƠN SỐ: BB-3301 Ngày: 22/10/2026\nThép góc V50 60 Cây đơn giá: 350000 thành tiền: 21000000"
    }

    resp = await client.post("/api/v1/inventory/ocr-receipt", json=payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    first_item = data["items"][0]
    # Đơn giá 350,000đ lệch >40% so với giá chuẩn 245,000đ -> Tô đỏ (< 0.70)
    assert first_item["confidence_price"] < 0.70
    assert data["needs_manual_review"] is True
    assert "lệch >30%" in first_item["flag_reason"]

@pytest.mark.asyncio
async def test_g3_batch_create_transactions(client: AsyncClient, warehouse_token: str):
    """Kiểm tra lưu 1-chạm toàn bộ phiếu nhập kho và cập nhật số tồn."""
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    # Lấy tồn ban đầu của Thép V50
    mats_resp = await client.get("/api/v1/materials?limit=50", headers=headers)
    assert mats_resp.status_code == 200
    mats_data = mats_resp.json()
    mats = mats_data if isinstance(mats_data, list) else mats_data["items"]
    v50_before = next(m for m in mats if m["code"] == "VT-THEP-V50")
    initial_stock = float(v50_before["current_stock"])

    batch_payload = {
        "receipt_no": "HĐ-TEST-BATCH",
        "receipt_type": "IN",
        "partner_name": "Công ty Cổ phần Thép Hòa Phát",
        "receipt_image_path": "/uploads/test_batch.jpg",
        "items": [
            {
                "material_code": "VT-THEP-V50",
                "quantity": 20.0,
                "unit_price": 240000.0,
                "confidence_by_field": {"quantity": 0.98, "unit_price": 0.95},
                "notes": "Nhập kho theo lô test"
            }
        ]
    }

    resp = await client.post("/api/v1/inventory/batch-transactions", json=batch_payload, headers=headers)
    assert resp.status_code == 201
    created_txs = resp.json()
    assert len(created_txs) == 1
    assert created_txs[0]["tx_code"].startswith("PNK-")
    assert created_txs[0]["quantity"] == 20.0

    # Kiểm tra tồn sau cập nhật
    mats_after_resp = await client.get("/api/v1/materials?limit=50", headers=headers)
    mats_after_data = mats_after_resp.json()
    mats_after = mats_after_data if isinstance(mats_after_data, list) else mats_after_data["items"]
    v50_after = next(m for m in mats_after if m["code"] == "VT-THEP-V50")
    assert float(v50_after["current_stock"]) == initial_stock + 20.0

@pytest.mark.asyncio
async def test_g3_kill_switch_compliance_and_manual_entry(client: AsyncClient, admin_token: str, warehouse_token: str):
    """
    Kiểm tra tuân thủ Kill-switch:
    1. Khi tắt AI OCR, endpoint OCR trả về 403 Forbidden.
    2. Nghiệp vụ Nhập tay thủ công vẫn chạy bình thường 100%.
    """
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    wh_headers = {"Authorization": f"Bearer {warehouse_token}"}

    # 1. Tắt AI OCR bằng Admin Setting
    put_resp = await client.put("/api/v1/ai-settings/INVENTORY_OCR", json={"is_enabled": False}, headers=admin_headers)
    assert put_resp.status_code == 200

    # 2. Thủ kho gọi OCR -> Phải bị chặn 403
    ocr_resp = await client.post("/api/v1/inventory/ocr-receipt", json={"ocr_raw_text": "Hóa đơn test"}, headers=wh_headers)
    assert ocr_resp.status_code == 403
    assert "TẮT khẩn cấp" in ocr_resp.json()["detail"]

    # 3. Chuyển sang Nhập tay thủ công -> Hoạt động 100%
    manual_payload = {
        "tx_type": "IN",
        "material_code": "VT-SON-EPOXY",
        "quantity": 2.0,
        "unit_price": 1250000.0,
        "partner_name": "Đại lý Sơn Cầu Giấy (Mua trực tiếp)",
        "receipt_no": "TAY-0992",
        "notes": "Nhập tay khẩn cấp khi tắt AI"
    }
    manual_resp = await client.post("/api/v1/inventory/manual-transaction", json=manual_payload, headers=wh_headers)
    assert manual_resp.status_code == 201
    assert manual_resp.json()["material_code"] == "VT-SON-EPOXY"
    assert manual_resp.json()["ai_confidence"] == 1.0

    # 4. Bật lại AI OCR
    await client.put("/api/v1/ai-settings/INVENTORY_OCR", json={"is_enabled": True}, headers=admin_headers)

@pytest.mark.asyncio
async def test_g3_inventory_alerts_and_provenance(client: AsyncClient, warehouse_token: str):
    """Kiểm tra 4 nhóm cảnh báo kho và liên kết bằng chứng 'Xem nguồn'."""
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    resp = await client.get("/api/v1/inventory/alerts", headers=headers)
    assert resp.status_code == 200
    alerts = resp.json()
    assert len(alerts) >= 3

    types = [a["type"] for a in alerts]
    assert "SHORTAGE" in types
    assert "OVER_CONSUMPTION" in types

    # Mọi cảnh báo bắt buộc phải có source_ref và evidence_details để nút 'Xem nguồn' hoạt động
    for alert in alerts:
        assert "source_ref" in alert and len(alert["source_ref"]) > 0
        assert "evidence_details" in alert and isinstance(alert["evidence_details"], dict)

    # Chi tiết cảnh báo Vượt định mức BOM
    over_alert = next(a for a in alerts if a["type"] == "OVER_CONSUMPTION")
    assert "norm_required" in over_alert["evidence_details"]
    assert "actual_issued" in over_alert["evidence_details"]

@pytest.mark.asyncio
async def test_g3_purchase_suggestions(client: AsyncClient, warehouse_token: str):
    """Kiểm tra gợi ý mua hàng thông minh phục vụ các lệnh sản xuất sắp tới."""
    headers = {"Authorization": f"Bearer {warehouse_token}"}

    resp = await client.get("/api/v1/inventory/purchase-suggestions", headers=headers)
    assert resp.status_code == 200
    suggestions = resp.json()
    assert len(suggestions) > 0

    first_sug = suggestions[0]
    assert "material_code" in first_sug
    assert "suggested_purchase_qty" in first_sug
    assert "supplier_name" in first_sug
    assert "supplier_phone" in first_sug
    assert "urgency" in first_sug

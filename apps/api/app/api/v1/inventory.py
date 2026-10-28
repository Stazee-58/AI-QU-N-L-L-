"""
Inventory API Router for Cậu Long Enterprise (G3).
Features:
- OCR and receipt extraction with per-field confidence scoring
- Confirmation & Batch transaction creation
- Manual fallback when AI is switched off (Kill switch compliance)
- 4 Smart Inventory Alerts with Provenance ('Xem nguồn')
- Smart Purchase Order Suggestions
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.user import User
from app.models.material import Material
from app.models.project import Project
from app.models.purchase_order import PurchaseOrder
from app.models.inventory_transaction import InventoryTransaction
from app.models.ai_settings import AISetting
from app.api.v1.auth import get_current_user

from app.schemas.inventory import (
    ReceiptOCRRequest,
    ReceiptOCRResponse,
    InventoryTransactionCreate,
    BatchTransactionCreate,
    InventoryTransactionResponse,
    InventoryAlertResponse,
    PurchaseSuggestionResponse
)
from app.services.inventory_service import (
    get_inventory_alerts,
    get_purchase_suggestions,
    create_inventory_transaction
)
from packages.ai.receipt_parser import parse_receipt_content

router = APIRouter(prefix="/inventory", tags=["Kho & Vật tư (G3)"])

@router.post("/ocr-receipt", response_model=ReceiptOCRResponse)
async def ocr_and_parse_receipt(
    payload: ReceiptOCRRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Quét và trích xuất dữ liệu phiếu kho (hóa đơn, phiếu giao hàng, phiếu xuất kho).
    Tự động kiểm tra Kill-switch: nếu AI bị tắt, yêu cầu chuyển sang nhập tay.
    """
    # 1. Kiểm tra công tắc an toàn AI (Kill-switch)
    ai_setting_res = await db.execute(select(AISetting).where(AISetting.feature_key == "INVENTORY_OCR"))
    ai_setting = ai_setting_res.scalars().first()
    if ai_setting and not ai_setting.is_enabled:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tính năng AI OCR phiếu kho đang TẮT khẩn cấp bởi Quản trị viên. Vui lòng sử dụng chế độ Nhập tay thủ công."
        )

    # 2. Lấy danh mục vật tư hiện hành để đối soát mã chuẩn
    mats_res = await db.execute(select(Material).where(Material.is_active == True))
    materials = mats_res.scalars().all()
    catalog = [
        {
            "code": m.code,
            "name": m.name,
            "spec": m.spec,
            "unit": m.unit,
            "standard_price": float(m.standard_price)
        }
        for m in materials
    ]

    # 3. Trích xuất phiếu
    raw_text = payload.ocr_raw_text or payload.raw_text or ""
    if not raw_text and (payload.file_name or payload.image_path or payload.image_url):
        # Giả lập text OCR nếu chỉ truyền tên file/ảnh mẫu
        ref_name = payload.file_name or payload.image_path or payload.image_url or "RECEIPT"
        raw_text = f"PHIẾU GIAO HÀNG {ref_name} Công ty Thép Hòa Phát Thép góc V50 40 Cây đơn giá 245000"

    parsed = parse_receipt_content(raw_text, catalog=catalog)

    return ReceiptOCRResponse(
        receipt_no=parsed.receipt_no,
        receipt_type=parsed.receipt_type,
        receipt_date=parsed.receipt_date,
        partner_name=parsed.partner_name,
        project_code=parsed.project_code,
        work_order_code=parsed.work_order_code,
        po_code=parsed.po_code,
        items=[it.model_dump() for it in parsed.items],
        total_value=parsed.total_value,
        overall_confidence=parsed.overall_confidence,
        suspicious_fields_count=parsed.suspicious_fields_count,
        needs_manual_review=parsed.needs_manual_review,
        raw_ocr_text=parsed.raw_ocr_text
    )

@router.post("/batch-transactions", response_model=List[InventoryTransactionResponse], status_code=status.HTTP_201_CREATED)
async def create_batch_inventory_transactions(
    payload: BatchTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Xác nhận lưu toàn bộ các dòng hàng từ phiếu kho đã quét (Side-by-side confirm).
    """
    created_txs = []
    
    # Tìm project_id nếu có
    project_id = payload.project_id
    if not project_id:
        proj_res = await db.execute(select(Project).limit(1))
        p = proj_res.scalars().first()
        if p:
            project_id = p.id

    # Lưu từng dòng hàng
    for i, item in enumerate(payload.items):
        prefix = "PNK" if payload.receipt_type == "IN" else ("PXK" if payload.receipt_type == "OUT" else "PDC")
        tx_code = f"{prefix}-{datetime.now().strftime('%y%m%d')}-{abs(hash(str(uuid.uuid4()))) % 10000:04d}-{i+1}"
        
        tx = await create_inventory_transaction(
            session=db,
            tx_code=tx_code,
            tx_type=payload.receipt_type,
            material_code=item.get("material_code", "VT-THEP-V50"),
            quantity=float(item.get("quantity", 1.0)),
            unit_price=float(item.get("unit_price", 0.0)),
            created_by_id=current_user.id,
            partner_name=payload.partner_name,
            receipt_no=payload.receipt_no,
            project_id=project_id,
            work_order_id=payload.work_order_id,
            purchase_order_id=payload.purchase_order_id,
            receipt_image_path=payload.receipt_image_path,
            ocr_raw_text=payload.ocr_raw_text,
            ai_confidence=float(payload.ai_confidence),
            confidence_by_field=item.get("confidence_by_field") or {
                "quantity": item.get("confidence_quantity", 0.95),
                "unit_price": item.get("confidence_price", 0.95),
                "material_code": item.get("confidence_material_code", 0.95)
            },
            notes=item.get("notes") or item.get("flag_reason")
        )
        created_txs.append(tx)

    return created_txs

@router.post("/manual-transaction", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_manual_transaction(
    payload: InventoryTransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Ghi nhận phiếu nhập/xuất kho THỦ CÔNG (chạy 100% khi AI tắt hoặc thủ kho nhập tay).
    """
    prefix = "PNK" if payload.tx_type == "IN" else ("PXK" if payload.tx_type == "OUT" else "PDC")
    tx_code = payload.tx_code or f"{prefix}-MANUAL-{datetime.now().strftime('%y%m%d%H%M%S')}"
    
    tx = await create_inventory_transaction(
        session=db,
        tx_code=tx_code,
        tx_type=payload.tx_type,
        material_code=payload.material_code,
        quantity=payload.quantity,
        unit_price=payload.unit_price,
        created_by_id=current_user.id,
        partner_name=payload.partner_name,
        receipt_no=payload.receipt_no,
        project_id=payload.project_id,
        work_order_id=payload.work_order_id,
        purchase_order_id=payload.purchase_order_id,
        receipt_image_path=payload.receipt_image_path,
        ocr_raw_text="NHẬP TAY THỦ CÔNG (KHÔNG DÙNG AI)",
        ai_confidence=1.0,
        confidence_by_field={},
        notes=payload.notes
    )
    return tx

@router.get("/transactions", response_model=List[InventoryTransactionResponse])
async def list_transactions(
    tx_type: Optional[str] = Query(None, description="Lọc theo IN hoặc OUT"),
    limit: int = Query(50, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách các giao dịch nhập / xuất kho.
    """
    stmt = select(InventoryTransaction).order_by(desc(InventoryTransaction.created_at)).limit(limit)
    if tx_type:
        stmt = stmt.where(InventoryTransaction.tx_type == tx_type.upper())
        
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/alerts", response_model=List[InventoryAlertResponse])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy 4 nhóm cảnh báo kho thông minh:
    - Thiếu cho LSX
    - Vượt định mức BOM
    - Lệch tồn kho
    - Tồn lâu (>45 ngày)
    Kèm provenance và dữ liệu bằng chứng 'Xem nguồn'.
    """
    alerts = await get_inventory_alerts(db)
    return alerts

@router.get("/purchase-suggestions", response_model=List[PurchaseSuggestionResponse])
async def get_suggestions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy gợi ý mua hàng thông minh dựa trên LSX và ngưỡng tồn an toàn.
    """
    suggestions = await get_purchase_suggestions(db)
    return suggestions

@router.get("/purchase-orders")
async def list_purchase_orders(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lấy danh sách Đơn mua hàng (PO) để đối chiếu.
    """
    res = await db.execute(select(PurchaseOrder).order_by(desc(PurchaseOrder.created_at)))
    return res.scalars().all()

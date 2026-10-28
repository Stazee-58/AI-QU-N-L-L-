from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, ConfigDict, Field

class ReceiptItemSchema(BaseModel):
    item_name: str
    material_code: str
    spec: Optional[str] = None
    unit: str
    quantity: float
    unit_price: float
    total_amount: float
    confidence_quantity: float = 0.95
    confidence_price: float = 0.95
    confidence_material_code: float = 0.95
    flag_reason: Optional[str] = None

class ReceiptOCRRequest(BaseModel):
    image_url: Optional[str] = None
    image_path: Optional[str] = None
    raw_text: Optional[str] = None
    ocr_raw_text: Optional[str] = None
    file_name: Optional[str] = None

class ReceiptOCRResponse(BaseModel):
    receipt_no: str
    receipt_type: str = "IN"
    receipt_date: str
    partner_name: str
    project_code: Optional[str] = None
    work_order_code: Optional[str] = None
    po_code: Optional[str] = None
    items: List[ReceiptItemSchema] = []
    total_value: float = 0.0
    overall_confidence: float = 0.95
    suspicious_fields_count: int = 0
    needs_manual_review: bool = False
    raw_ocr_text: str = ""

class InventoryTransactionCreate(BaseModel):
    tx_code: Optional[str] = None
    tx_type: str = Field(..., description="IN, OUT, hoặc ADJUSTMENT")
    material_code: str
    quantity: float
    unit_price: float = 0.0
    project_id: Optional[str] = None
    work_order_id: Optional[str] = None
    purchase_order_id: Optional[str] = None
    partner_name: Optional[str] = None
    receipt_no: Optional[str] = None
    receipt_image_path: Optional[str] = None
    ocr_raw_text: Optional[str] = None
    ai_confidence: float = 1.0
    confidence_by_field: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class BatchTransactionCreate(BaseModel):
    receipt_no: Optional[str] = None
    receipt_type: str = "IN"
    partner_name: Optional[str] = None
    project_id: Optional[str] = None
    work_order_id: Optional[str] = None
    purchase_order_id: Optional[str] = None
    receipt_image_path: Optional[str] = None
    ocr_raw_text: Optional[str] = None
    ai_confidence: float = 1.0
    items: List[Dict[str, Any]] = []

class InventoryTransactionResponse(BaseModel):
    id: str
    tx_code: str
    tx_type: str
    material_code: str
    material_name: str
    unit: str
    quantity: float
    unit_price: float
    total_value: float
    partner_name: Optional[str] = None
    receipt_no: Optional[str] = None
    receipt_image_path: Optional[str] = None
    ai_confidence: float
    confidence_by_field: Dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InventoryAlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str
    material_code: str
    project_code: str
    source_ref: str
    evidence_details: Dict[str, Any]

class PurchaseSuggestionResponse(BaseModel):
    material_code: str
    material_name: str
    unit: str
    current_stock: float
    min_stock_alert: float
    suggested_purchase_qty: float
    estimated_unit_price: float
    estimated_total_cost: float
    supplier_name: str
    supplier_phone: str
    lead_time_days: int
    urgency: str
    reason: str

from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

class WorkOrderBase(BaseModel):
    project_id: str
    code: str = Field(..., max_length=50)
    product_name: str = Field(..., max_length=255)
    target_qty: float = Field(..., gt=0)
    completed_qty: float = Field(default=0.0, ge=0)
    unit: str = "Bộ"
    start_date: date
    due_date: date
    assigned_foreman_id: Optional[str] = None
    status: str = "IN_PROGRESS"
    risk_level: str = "NORMAL"  # NORMAL, WARNING, CRITICAL
    risk_reason: Optional[str] = None
    bom_snapshot: Optional[Dict[str, Any]] = Field(default_factory=dict)

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    product_name: Optional[str] = None
    target_qty: Optional[float] = None
    completed_qty: Optional[float] = None
    due_date: Optional[date] = None
    assigned_foreman_id: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None
    risk_reason: Optional[str] = None

class WorkOrderResponse(WorkOrderBase):
    id: str
    progress_percent: float = 0.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProductionLogCreate(BaseModel):
    work_order_id: str
    project_id: str
    shift_date: Optional[date] = None
    shift_type: str = "DAY"
    stage_name: str
    completed_qty: float = Field(..., gt=0)
    worker_count: int = Field(default=1, ge=1)
    total_man_hours: float = Field(default=8.0, ge=0)
    issues_reported: Optional[str] = None
    photo_urls: List[str] = []
    raw_message: Optional[str] = None
    ai_confidence: float = 1.0

class ProductionLogResponse(ProductionLogCreate):
    id: str
    foreman_id: str
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ParseProductionLogRequest(BaseModel):
    raw_text: str
    photo_urls: List[str] = []
    audio_transcription: Optional[str] = None
    foreman_id: Optional[str] = None

class ParsedProductionLog(BaseModel):
    project_code: Optional[str] = None
    work_order_code: Optional[str] = None
    stage_name: Optional[str] = None
    completed_qty: Optional[float] = None
    unit: Optional[str] = None
    worker_count: int = 1
    total_man_hours: float = 8.0
    issues_reported: Optional[str] = None
    confidence_score: float = 1.0
    needs_clarification: bool = False
    clarification_question: Optional[str] = None
    matched_work_order_id: Optional[str] = None
    matched_project_id: Optional[str] = None

class DailySummaryResponse(BaseModel):
    generated_at: str
    shift_date: str
    
    # 1. Phiên bản Giám đốc ngắn (1 trang)
    director_summary: Dict[str, Any]
    
    # 2. Phiên bản Kỹ thuật chi tiết
    tech_summary: Dict[str, Any]
    
    # 3. Phiên bản Kinh doanh "việc hôm nay"
    sales_summary: Dict[str, Any]
    
    # Danh sách đơn hàng nguy cơ trễ hạn kèm nguyên nhân
    delayed_orders: List[Dict[str, Any]] = []

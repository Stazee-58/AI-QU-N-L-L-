from datetime import date, datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class MaterialSettlementDetail(BaseModel):
    material_code: str
    material_name: str
    unit: str
    norm_qty: float
    actual_issued_qty: float
    variance_qty: float
    variance_pct: float
    unit_price: float
    actual_cost: float
    is_over_budget: bool
    warning_reason: Optional[str] = None

class LaborSettlementDetail(BaseModel):
    work_order_code: str
    stage_name: str
    shift_count: int
    total_man_hours: float
    hourly_rate: float = 50000.0
    labor_cost: float

class SettlementFinalizeRequest(BaseModel):
    acceptance_status: str = Field(..., description="ACCEPTED hoặc CONDITIONAL")
    acceptance_date: Optional[date] = None
    acceptance_notes: Optional[str] = None
    amount_paid: Optional[float] = None
    other_cost_adjustment: Optional[float] = 0.0

class ProjectSettlementResponse(BaseModel):
    id: Optional[str] = None
    project_id: str
    project_code: str
    project_name: str
    customer_name: str
    customer_phone: Optional[str] = None
    contract_value: float
    estimated_cost: float
    actual_material_cost: float
    actual_labor_cost: float
    actual_other_cost: float
    total_actual_cost: float
    gross_profit: float
    profit_margin_pct: float
    amount_paid: float
    remaining_receivable: float
    status: str
    acceptance_status: str
    acceptance_date: Optional[date] = None
    acceptance_notes: Optional[str] = None
    materials_detail: List[MaterialSettlementDetail] = []
    labor_detail: List[LaborSettlementDetail] = []
    warnings: List[str] = []
    finalized_at: Optional[datetime] = None
    finalized_by_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


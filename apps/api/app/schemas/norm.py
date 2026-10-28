from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class NormItem(BaseModel):
    material_id: Optional[str] = None
    material_code: Optional[str] = None
    material_name: Optional[str] = None
    qty_per_unit: float = Field(..., gt=0)
    scrap_rate_percent: float = Field(default=0.0, ge=0)

class NormBase(BaseModel):
    name: str = Field(..., max_length=255)
    product_type: str = Field(..., max_length=100)
    unit: str = Field(..., max_length=20)
    items: List[Dict[str, Any]] = []
    labor_hours_per_unit: float = Field(default=0.0, ge=0)
    version: int = 1
    is_active: bool = True

class NormCreate(NormBase):
    pass

class NormUpdate(BaseModel):
    name: Optional[str] = None
    product_type: Optional[str] = None
    unit: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    labor_hours_per_unit: Optional[float] = None
    version: Optional[int] = None
    is_active: Optional[bool] = None

class NormResponse(NormBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

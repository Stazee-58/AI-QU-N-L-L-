from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class MaterialBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    spec: Optional[str] = None
    unit: str = Field(..., max_length=20)
    category: str = Field(..., max_length=100)
    standard_price: float = Field(default=0.0, ge=0)
    min_stock_alert: float = Field(default=0.0, ge=0)
    current_stock: float = Field(default=0.0)
    is_active: bool = True

class MaterialCreate(MaterialBase):
    pass

class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    spec: Optional[str] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    standard_price: Optional[float] = None
    min_stock_alert: Optional[float] = None
    current_stock: Optional[float] = None
    is_active: Optional[bool] = None

class MaterialResponse(MaterialBase):
    id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class MaterialImportRowError(BaseModel):
    row_number: int
    field: str
    error_message: str
    raw_value: Optional[Any] = None

class MaterialImportResult(BaseModel):
    total_rows: int
    success_count: int
    error_count: int
    created_materials: List[MaterialResponse] = []
    errors: List[MaterialImportRowError] = []

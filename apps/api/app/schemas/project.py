from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ProjectBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    customer_name: str = Field(..., max_length=255)
    customer_phone: Optional[str] = None
    manager_id: Optional[str] = None
    status: str = "DRAFT"
    contract_value: float = 0.0

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    manager_id: Optional[str] = None
    status: Optional[str] = None
    contract_value: Optional[float] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

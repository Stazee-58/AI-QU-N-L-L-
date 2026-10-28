from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class RoleResponse(BaseModel):
    id: str
    code: str
    name: str
    permissions: List[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    role_id: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    role_id: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    phone: Optional[str] = None
    telegram_id: Optional[str] = None
    role_id: str
    role: Optional[RoleResponse] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

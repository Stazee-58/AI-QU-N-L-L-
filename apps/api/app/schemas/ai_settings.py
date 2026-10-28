from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AISettingUpdate(BaseModel):
    permission_level: Optional[int] = Field(None, ge=1, le=3, description="1: Gợi ý, 2: Làm rồi duyệt, 3: Tự chạy")
    is_enabled: Optional[bool] = Field(None, description="Công tắc khẩn cấp")
    provider: Optional[str] = None
    model_name: Optional[str] = None
    monthly_budget_usd: Optional[float] = Field(None, ge=0)
    alert_threshold_ratio: Optional[float] = Field(None, ge=0.1, le=1.0)

class AISettingResponse(BaseModel):
    id: str
    feature_key: str
    feature_name: str
    permission_level: int
    is_enabled: bool
    provider: str
    model_name: str
    monthly_budget_usd: float
    current_month_cost_usd: float
    alert_threshold_ratio: float
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

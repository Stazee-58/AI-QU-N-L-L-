from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class AIAuditCreate(BaseModel):
    module_name: str
    user_id: str
    project_id: Optional[str] = None
    ai_prompt_sent: Optional[str] = None
    ai_raw_response: Optional[str] = None
    parsed_output: Dict[str, Any] = {}
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    human_final_output: Optional[Dict[str, Any]] = None
    is_modified: bool = False
    diff_summary: Optional[Dict[str, Any]] = None
    latency_ms: int = 0
    cost_usd: float = 0.0

class AIAuditResponse(BaseModel):
    id: str
    module_name: str
    user_id: str
    project_id: Optional[str] = None
    ai_prompt_sent: Optional[str] = None
    ai_raw_response: Optional[str] = None
    parsed_output: Dict[str, Any]
    confidence_score: float
    human_final_output: Optional[Dict[str, Any]] = None
    is_modified: bool
    diff_summary: Optional[Dict[str, Any]] = None
    latency_ms: int
    cost_usd: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

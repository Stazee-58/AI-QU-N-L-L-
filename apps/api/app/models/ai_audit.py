import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Numeric, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AIAudit(Base):
    """
    Nhật ký bất biến ghi nhận mọi thao tác của AI và đối soát chỉnh sửa của con người.
    Append-only: không bao giờ xóa hay sửa đè.
    """
    __tablename__ = "ai_audit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    module_name: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True, index=True)
    
    ai_prompt_sent: Mapped[str] = mapped_column(Text, nullable=True)
    ai_raw_response: Mapped[str] = mapped_column(Text, nullable=True)
    parsed_output: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0, nullable=False)
    
    human_final_output: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    is_modified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    diff_summary: Mapped[dict] = mapped_column(JSON, default=dict, nullable=True)
    
    latency_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Numeric(8, 5), default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", foreign_keys=[user_id], lazy="joined")
    project = relationship("Project", foreign_keys=[project_id], lazy="joined")

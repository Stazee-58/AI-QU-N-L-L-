import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class AISetting(Base):
    """
    Cấu hình quyền và công tắc ngắt khẩn cấp cho từng tính năng AI.
    Mức 1: Gợi ý (AI chỉ đề xuất)
    Mức 2: Làm rồi duyệt (AI làm hoàn chỉnh, người duyệt)
    Mức 3: Tự chạy (chỉ việc không đụng đến tiền/kho)
    """
    __tablename__ = "ai_settings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feature_key: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    feature_name: Mapped[str] = mapped_column(String(100), nullable=False)
    permission_level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)  # 1, 2, 3
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)    # Công tắc khẩn cấp
    provider: Mapped[str] = mapped_column(String(50), default="gemini", nullable=False)
    model_name: Mapped[str] = mapped_column(String(100), default="gemini-2.0-flash", nullable=False)
    
    monthly_budget_usd: Mapped[float] = mapped_column(Numeric(8, 2), default=50.0, nullable=False)
    current_month_cost_usd: Mapped[float] = mapped_column(Numeric(8, 2), default=0.0, nullable=False)
    alert_threshold_ratio: Mapped[float] = mapped_column(Numeric(3, 2), default=0.80, nullable=False)
    
    updated_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    updater = relationship("User", foreign_keys=[updated_by], lazy="joined")

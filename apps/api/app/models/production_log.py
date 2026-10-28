import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Numeric, Integer, Text, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProductionLog(Base):
    """
    Nhật ký báo cáo ca sản xuất của Tổ trưởng xưởng.
    Hỗ trợ trích xuất từ tin nhắn tự do / ảnh / ghi âm.
    """
    __tablename__ = "production_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=False, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    foreman_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    shift_date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False, index=True)
    shift_type: Mapped[str] = mapped_column(String(20), default="DAY", nullable=False) # DAY, NIGHT
    stage_name: Mapped[str] = mapped_column(String(100), nullable=False) # Cắt, Hàn, Sơn, Lắp ráp, Đóng gói
    
    completed_qty: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    worker_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    total_man_hours: Mapped[float] = mapped_column(Numeric(8, 2), default=8.0, nullable=False)
    
    issues_reported: Mapped[str] = mapped_column(Text, nullable=True) # Hỏng máy, thiếu phôi, mất điện...
    photo_urls: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    raw_message: Mapped[str] = mapped_column(Text, nullable=True)
    
    ai_confidence: Mapped[float] = mapped_column(Numeric(3, 2), default=1.0, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="AUTO_PARSED", nullable=False) # AUTO_PARSED, VERIFIED, REVISED
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True)

    work_order = relationship("WorkOrder", back_populates="logs", lazy="joined")
    project = relationship("Project", foreign_keys=[project_id], lazy="joined")
    foreman = relationship("User", foreign_keys=[foreman_id], lazy="joined")

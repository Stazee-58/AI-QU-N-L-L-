import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class WorkOrder(Base):
    """
    Lệnh sản xuất phát hành xuống xưởng (Work Order).
    Liên kết chặt chẽ với Dự án và Tổ trưởng phụ trách.
    """
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_qty: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    completed_qty: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    unit: Mapped[str] = mapped_column(String(20), default="Bộ", nullable=False)
    
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    assigned_foreman_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    status: Mapped[str] = mapped_column(String(30), default="IN_PROGRESS", index=True, nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="NORMAL", index=True, nullable=False) # NORMAL, WARNING, CRITICAL
    risk_reason: Mapped[str] = mapped_column(String(255), nullable=True)
    
    bom_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", foreign_keys=[project_id], lazy="joined")
    assigned_foreman = relationship("User", foreign_keys=[assigned_foreman_id], lazy="joined")
    logs = relationship("ProductionLog", back_populates="work_order", cascade="all, delete-orphan")

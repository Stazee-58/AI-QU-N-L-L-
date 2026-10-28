import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Numeric, Text, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ProjectSettlement(Base):
    """
    Bảng tổng hợp quyết toán và nghiệm thu dự án (G5).
    Lưu trữ chi phí vật tư thực tế, nhân công thực tế, đối soát với dự toán BOM ban đầu.
    """
    __tablename__ = "project_settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), unique=True, nullable=False, index=True)
    
    # Doanh thu & Dự toán
    contract_value: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    estimated_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    
    # Chi phí thực tế tổng hợp từ kho và xưởng
    actual_material_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    actual_labor_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    actual_other_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    total_actual_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    
    # Lãi gộp & Hiệu quả tài chính
    gross_profit: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    profit_margin_pct: Mapped[float] = mapped_column(Numeric(5, 2), default=0.0, nullable=False)
    
    # Thu tiền & Công nợ
    amount_paid: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    remaining_receivable: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    
    # Trạng thái nghiệm thu & Quyết toán
    status: Mapped[str] = mapped_column(String(30), default="DRAFT", nullable=False, index=True) # DRAFT, IN_REVIEW, FINALIZED
    acceptance_status: Mapped[str] = mapped_column(String(30), default="PENDING", nullable=False) # PENDING, ACCEPTED, CONDITIONAL
    acceptance_date: Mapped[date] = mapped_column(Date, nullable=True)
    acceptance_notes: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Snapshot dữ liệu chứng cứ đối soát (Provenance)
    evidence_snapshot: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    finalized_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    project = relationship("Project", foreign_keys=[project_id], lazy="joined")
    finalized_by = relationship("User", foreign_keys=[finalized_by_id], lazy="joined")


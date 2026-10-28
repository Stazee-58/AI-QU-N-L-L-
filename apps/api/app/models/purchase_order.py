import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class PurchaseOrder(Base):
    """
    Đơn đặt hàng mua vật tư từ nhà cung cấp (Purchase Order - PO).
    Dùng để đối chiếu khi nhà cung cấp giao hàng tới kho.
    """
    __tablename__ = "purchase_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    po_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    supplier_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True, index=True)
    
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_delivery_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="ORDERED", index=True, nullable=False) # ORDERED, PARTIAL, COMPLETED, CANCELLED
    
    # Danh sách mặt hàng đặt: [{"material_code": "VT-THEP-V50", "quantity_ordered": 100, "unit_price": 245000, "unit": "Cây"}]
    items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    notes: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    project = relationship("Project", foreign_keys=[project_id], lazy="joined")

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class InventoryTransaction(Base):
    """
    Giao dịch biến động kho (Inventory Transaction).
    Ghi nhận chi tiết phiếu nhập (IN), xuất (OUT), hoặc kiểm kê lệch (ADJUSTMENT).
    Lưu vết nguồn gốc: ảnh phiếu, độ tin cậy từng ô, liên kết dự án và lệnh sản xuất.
    """
    __tablename__ = "inventory_transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    tx_code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False) # e.g. PNK-2026-001, PXK-2026-001
    tx_type: Mapped[str] = mapped_column(String(20), index=True, nullable=False) # IN (Nhập kho), OUT (Xuất kho), ADJUSTMENT (Kiểm kê)
    
    material_id: Mapped[str] = mapped_column(String(36), ForeignKey("materials.id"), nullable=False, index=True)
    material_code: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    material_name: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    
    quantity: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    total_value: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("projects.id"), nullable=True, index=True)
    work_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("work_orders.id"), nullable=True, index=True)
    purchase_order_id: Mapped[str] = mapped_column(String(36), ForeignKey("purchase_orders.id"), nullable=True, index=True)
    
    partner_name: Mapped[str] = mapped_column(String(255), nullable=True) # Nhà cung cấp hoặc Tổ xưởng nhận
    receipt_no: Mapped[str] = mapped_column(String(100), nullable=True, index=True) # Số phiếu trên hóa đơn giấy
    receipt_image_path: Mapped[str] = mapped_column(String(500), nullable=True) # Ảnh phiếu gốc
    ocr_raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    
    ai_confidence: Mapped[float] = mapped_column(Numeric(4, 2), default=1.0, nullable=False)
    confidence_by_field: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False) # Điểm từng ô: {"quantity": 0.95, "unit_price": 0.65}
    
    created_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    notes: Mapped[str] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    material = relationship("Material", foreign_keys=[material_id], lazy="joined")
    project = relationship("Project", foreign_keys=[project_id], lazy="joined")
    work_order = relationship("WorkOrder", foreign_keys=[work_order_id], lazy="joined")
    purchase_order = relationship("PurchaseOrder", foreign_keys=[purchase_order_id], lazy="joined")
    created_by = relationship("User", foreign_keys=[created_by_id], lazy="joined")

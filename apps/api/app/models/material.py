import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Numeric, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Material(Base):
    __tablename__ = "materials"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    spec: Mapped[str] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    standard_price: Mapped[float] = mapped_column(Numeric(15, 2), default=0.0, nullable=False)
    min_stock_alert: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    current_stock: Mapped[float] = mapped_column(Numeric(12, 2), default=0.0, nullable=False)
    last_movement_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

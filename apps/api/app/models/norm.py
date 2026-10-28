import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Numeric, Integer, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base

class Norm(Base):
    __tablename__ = "norms"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    items: Mapped[list] = mapped_column(JSON, default=list, nullable=False)
    labor_hours_per_unit: Mapped[float] = mapped_column(Numeric(8, 2), default=0.0, nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from ..database import Base


class UnitType(str, enum.Enum):
    STUDIO = "studio"
    ONE_BED = "1bed"
    TWO_BED = "2bed"
    THREE_BED = "3bed"
    PENTHOUSE = "penthouse"
    COMMERCIAL = "commercial"


class OccupancyStatus(str, enum.Enum):
    VACANT = "vacant"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    unit_number = Column(String(50), nullable=False)
    unit_type = Column(SAEnum(UnitType), nullable=False, default=UnitType.ONE_BED)
    monthly_rent = Column(Float, nullable=False)
    status = Column(SAEnum(OccupancyStatus), default=OccupancyStatus.VACANT)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    property = relationship("Property", back_populates="units")
    tenant = relationship("User", foreign_keys=[tenant_id])
    leases = relationship("Lease", back_populates="unit")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="unit")
    payments = relationship("Payment", back_populates="unit")

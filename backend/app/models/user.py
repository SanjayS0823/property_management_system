from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from ..database import Base


class UserRole(str, enum.Enum):
    LANDLORD = "landlord"
    PROPERTY_MANAGER = "property_manager"
    TENANT = "tenant"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(SAEnum(UserRole), nullable=False, default=UserRole.TENANT)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owned_properties = relationship("Property", back_populates="owner", foreign_keys="Property.owner_id")
    managed_properties = relationship("Property", back_populates="property_manager", foreign_keys="Property.property_manager_id")
    lease_tenant = relationship("Lease", back_populates="tenant", foreign_keys="Lease.tenant_id")
    maintenance_requests = relationship("MaintenanceRequest", back_populates="tenant", foreign_keys="MaintenanceRequest.tenant_id")
    notifications = relationship("Notification", back_populates="user")

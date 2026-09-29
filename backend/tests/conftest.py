import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

os.environ["DATABASE_URL"] = "sqlite:///./test_propmanager.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing"

from app.database import Base, get_db
from app.main import app
from app.models.user import User, UserRole
from app.auth.security import get_password_hash, create_access_token

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_propmanager.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def landlord(db):
    user = User(
        email="landlord@test.com",
        full_name="Test Landlord",
        hashed_password=get_password_hash("test123"),
        phone="+1-555-0001",
        role=UserRole.LANDLORD,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def manager(db):
    user = User(
        email="manager@test.com",
        full_name="Test Manager",
        hashed_password=get_password_hash("test123"),
        phone="+1-555-0002",
        role=UserRole.PROPERTY_MANAGER,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def tenant(db):
    user = User(
        email="tenant@test.com",
        full_name="Test Tenant",
        hashed_password=get_password_hash("test123"),
        phone="+1-555-0003",
        role=UserRole.TENANT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def tenant2(db):
    user = User(
        email="tenant2@test.com",
        full_name="Test Tenant 2",
        hashed_password=get_password_hash("test123"),
        phone="+1-555-0004",
        role=UserRole.TENANT,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_auth_header(user):
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}

import os
import sys
import pytest
import pytest_asyncio

# Đảm bảo import được packages và apps/api
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db
from app.main import app
from app.seed import seed_all_data

# Sử dụng test database sqlite riêng biệt
TEST_DB_URL = "sqlite+aiosqlite:///./test_caulong.db"

test_engine = create_async_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSessionLocal = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)

async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    # Khởi tạo bảng và nạp seed data cho test
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Nạp seed data trực tiếp vào test DB
    from app.database import AsyncSessionLocal as OrigSession
    # Thay tạm thời session để seed vào test db
    import app.seed
    orig_engine = app.seed.engine
    orig_session = app.seed.AsyncSessionLocal
    app.seed.engine = test_engine
    app.seed.AsyncSessionLocal = TestSessionLocal
    await seed_all_data()
    app.seed.engine = orig_engine
    app.seed.AsyncSessionLocal = orig_session

    yield

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest_asyncio.fixture
async def admin_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin@123456"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest_asyncio.fixture
async def foreman_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"username": "totruong", "password": "Foreman@123456"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest_asyncio.fixture
async def director_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"username": "director", "password": "Director@123456"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest_asyncio.fixture
async def sales_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"username": "kinhdoanh", "password": "Sales@123456"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

@pytest_asyncio.fixture
async def warehouse_token(client: AsyncClient):
    resp = await client.post("/api/v1/auth/login", json={"username": "thukho", "password": "Warehouse@123456"})
    assert resp.status_code == 200
    return resp.json()["access_token"]

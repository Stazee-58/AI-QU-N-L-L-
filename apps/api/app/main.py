import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Đảm bảo import được packages
root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)
from app.config import settings
from app.api.v1 import api_v1_router
from app.seed import seed_all_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi động ứng dụng: tự động kiểm tra bảng và nạp seed data
    try:
        await seed_all_data()
    except Exception as e:
        print(f"Lưu ý khi seed database: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API cho Hệ thống Vận hành Doanh nghiệp Sản xuất & Thi công Cậu Long",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware hỗ trợ Next.js và Web PWA
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký Router API v1
app.include_router(api_v1_router)

@app.get("/", tags=["Hệ thống"])
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "environment": settings.ENVIRONMENT,
        "status": "online",
        "version": "1.0.0 (G1)",
        "docs_url": "/docs"
    }

@app.get("/health", tags=["Hệ thống"])
async def health_check():
    return {
        "status": "healthy",
        "service": "api",
        "database": "connected"
    }

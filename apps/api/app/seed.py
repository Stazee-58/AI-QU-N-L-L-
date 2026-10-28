import asyncio
from sqlalchemy import select
from app.database import engine, AsyncSessionLocal, Base
from app.models.role import Role
from app.models.user import User
from app.models.material import Material
from app.models.norm import Norm
from app.models.ai_settings import AISetting
from app.services.auth import get_password_hash

ROLES_SEED = [
    {
        "code": "ADMIN",
        "name": "Quản trị viên hệ thống",
        "permissions": ["*:*"]
    },
    {
        "code": "DIRECTOR",
        "name": "Giám đốc / Ban điều hành",
        "permissions": ["project:*", "quote:approve", "price:view_cost", "report:view_all", "ai:view_audit"]
    },
    {
        "code": "SALES",
        "name": "Nhân viên Kinh doanh & Dự án",
        "permissions": ["project:write", "quote:create", "boq:view", "price:view_sale"]
    },
    {
        "code": "TECH",
        "name": "Kỹ thuật / Điều hành sản xuất",
        "permissions": ["project:read", "drawing:parse", "boq:write", "norm:write", "work_order:create"]
    },
    {
        "code": "FOREMAN",
        "name": "Quản đốc / Tổ trưởng xưởng",
        "permissions": ["production_log:write", "work_order:read", "issue:report"]
    },
    {
        "code": "WAREHOUSE",
        "name": "Thủ kho",
        "permissions": ["inventory:read", "inventory:write", "material:read"]
    },
    {
        "code": "SITE",
        "name": "Điều phối / Thi công lắp đặt",
        "permissions": ["delivery:read", "acceptance:write", "site:report"]
    },
    {
        "code": "ACCOUNTANT",
        "name": "Kế toán quyết toán",
        "permissions": ["settlement:read", "settlement:write", "invoice:audit", "export:misa"]
    }
]

AI_SETTINGS_SEED = [
    {
        "feature_key": "BOQ_EXTRACTION",
        "feature_name": "Bóc tách bản vẽ & Đề xuất bảng BOQ",
        "permission_level": 1,  # Mức 1: Gợi ý (mặc định cho báo giá, BOQ)
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 25.0
    },
    {
        "feature_key": "INVOICE_OCR",
        "feature_name": "OCR trích xuất phiếu nhập/xuất kho",
        "permission_level": 2,  # Mức 2: Làm rồi duyệt
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 15.0
    },
    {
        "feature_key": "PRODUCTION_LOG",
        "feature_name": "Chuẩn hóa tin nhắn báo cáo ca sản xuất",
        "permission_level": 2,  # Mức 2: Làm rồi duyệt
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 10.0
    },
    {
        "feature_key": "DAILY_SUMMARY",
        "feature_name": "Tổng hợp báo cáo điều hành tự động sáng/chiều",
        "permission_level": 3,  # Mức 3: Tự chạy (không liên quan đến tiền)
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 5.0
    }
]

MATERIALS_SEED = [
    {
        "code": "VT-THEP-V50",
        "name": "Thép góc V50x50x5mm (DỮ LIỆU GIẢ)",
        "spec": "Mạ kẽm nhúng nóng, cây tiêu chuẩn 6m",
        "unit": "Cây",
        "category": "Thép kết cấu",
        "standard_price": 245000.0,
        "min_stock_alert": 20.0,
        "current_stock": 58.0
    },
    {
        "code": "VT-THEP-HOP50",
        "name": "Thép hộp 50x100 dày 2mm (DỮ LIỆU GIẢ)",
        "spec": "Thép hộp mạ kẽm Hòa Phát, cây 6m",
        "unit": "Cây",
        "category": "Thép kết cấu",
        "standard_price": 380000.0,
        "min_stock_alert": 15.0,
        "current_stock": 34.0
    },
    {
        "code": "VT-INOX-304",
        "name": "Tấm Inox 304 xước dày 1.5mm (DỮ LIỆU GIẢ)",
        "spec": "Khổ 1220x2440mm bọc màng PE",
        "unit": "Tấm",
        "category": "Inox",
        "standard_price": 850000.0,
        "min_stock_alert": 5.0,
        "current_stock": 12.0
    },
    {
        "code": "VT-SON-EPOXY",
        "name": "Sơn Epoxy chống gỉ 2 thành phần (DỮ LIỆU GIẢ)",
        "spec": "Thùng 20L màu ghi xám",
        "unit": "Thùng",
        "category": "Sơn & Hóa chất",
        "standard_price": 1250000.0,
        "min_stock_alert": 4.0,
        "current_stock": 9.0
    }
]

async def seed_all_data():
    """Khởi tạo toàn bộ dữ liệu nền tảng cho G1."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # 1. Khởi tạo Roles
        roles_by_code = {}
        for r_data in ROLES_SEED:
            result = await session.execute(select(Role).where(Role.code == r_data["code"]))
            existing_role = result.scalars().first()
            if not existing_role:
                new_role = Role(**r_data)
                session.add(new_role)
                await session.flush()
                roles_by_code[r_data["code"]] = new_role
            else:
                roles_by_code[r_data["code"]] = existing_role

        # 2. Khởi tạo Tài khoản Admin
        admin_result = await session.execute(select(User).where(User.username == "admin"))
        if not admin_result.scalars().first():
            admin_user = User(
                username="admin",
                full_name="Quản trị viên Hệ thống Cậu Long",
                phone="0901234567",
                role_id=roles_by_code["ADMIN"].id,
                password_hash=get_password_hash("Admin@123456"),
                is_active=True
            )
            session.add(admin_user)

        # 3. Khởi tạo Tài khoản Mẫu cho từng vai trò (Ghi rõ là dữ liệu giả lập đào tạo)
        sample_users = [
            ("director", "Giám đốc Nguyễn Văn An (GIẢ LẬP)", "0901000001", "DIRECTOR", "Director@123456"),
            ("kinhdoanh", "Kinh doanh Phạm Thị Dung (GIẢ LẬP)", "0901000002", "SALES", "Sales@123456"),
            ("kythuat", "Kỹ sư Lê Hoàng Nam (GIẢ LẬP)", "0901000003", "TECH", "Tech@123456"),
            ("totruong", "Tổ trưởng xưởng Trần Văn Bình (GIẢ LẬP)", "0901000004", "FOREMAN", "Foreman@123456"),
            ("thukho", "Thủ kho Lê Văn Chung (GIẢ LẬP)", "0901000005", "WAREHOUSE", "Warehouse@123456"),
            ("thicong", "Giám sát thi công Vũ Minh Đức (GIẢ LẬP)", "0901000006", "SITE", "Site@123456"),
            ("ketoan", "Kế toán trưởng Hoàng Kim Oanh (GIẢ LẬP)", "0901000007", "ACCOUNTANT", "Account@123456"),
        ]
        for uname, fname, phone, rcode, pwd in sample_users:
            u_res = await session.execute(select(User).where(User.username == uname))
            if not u_res.scalars().first():
                session.add(User(
                    username=uname,
                    full_name=fname,
                    phone=phone,
                    role_id=roles_by_code[rcode].id,
                    password_hash=get_password_hash(pwd),
                    is_active=True
                ))

        # 4. Khởi tạo Cấu hình AI Settings
        for ai_data in AI_SETTINGS_SEED:
            ai_res = await session.execute(select(AISetting).where(AISetting.feature_key == ai_data["feature_key"]))
            if not ai_res.scalars().first():
                session.add(AISetting(**ai_data))

        # 5. Khởi tạo Danh mục Vật tư Mẫu
        for mat_data in MATERIALS_SEED:
            m_res = await session.execute(select(Material).where(Material.code == mat_data["code"]))
            if not m_res.scalars().first():
                session.add(Material(**mat_data))

        await session.commit()
        print("Đã khởi tạo thành công dữ liệu nền G1 (Roles, Users, AI Settings, Materials)!")

if __name__ == "__main__":
    asyncio.run(seed_all_data())

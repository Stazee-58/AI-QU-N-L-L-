import asyncio
from datetime import date, timedelta
from sqlalchemy import select, text
from app.database import engine, AsyncSessionLocal, Base
from app.models.role import Role
from app.models.user import User
from app.models.project import Project
from app.models.material import Material
from app.models.norm import Norm
from app.models.ai_settings import AISetting
from app.models.work_order import WorkOrder
from app.models.production_log import ProductionLog
from app.models.purchase_order import PurchaseOrder
from app.models.inventory_transaction import InventoryTransaction
from app.services.auth import get_password_hash

ROLES_SEED = [
    {"code": "ADMIN", "name": "Quản trị viên hệ thống", "permissions": ["*:*"]},
    {"code": "DIRECTOR", "name": "Giám đốc / Ban điều hành", "permissions": ["project:*", "quote:approve", "price:view_cost", "report:view_all", "ai:view_audit"]},
    {"code": "SALES", "name": "Nhân viên Kinh doanh & Dự án", "permissions": ["project:write", "quote:create", "boq:view", "price:view_sale"]},
    {"code": "TECH", "name": "Kỹ thuật / Điều hành sản xuất", "permissions": ["project:read", "drawing:parse", "boq:write", "norm:write", "work_order:create"]},
    {"code": "FOREMAN", "name": "Quản đốc / Tổ trưởng xưởng", "permissions": ["production_log:write", "work_order:read", "issue:report"]},
    {"code": "WAREHOUSE", "name": "Thủ kho", "permissions": ["inventory:read", "inventory:write", "material:read"]},
    {"code": "SITE", "name": "Điều phối / Thi công lắp đặt", "permissions": ["delivery:read", "acceptance:write", "site:report"]},
    {"code": "ACCOUNTANT", "name": "Kế toán quyết toán", "permissions": ["settlement:read", "settlement:write", "invoice:audit", "export:misa"]}
]

AI_SETTINGS_SEED = [
    {
        "feature_key": "BOQ_EXTRACTION",
        "feature_name": "Bóc tách bản vẽ & Đề xuất bảng BOQ",
        "permission_level": 1,
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 25.0
    },
    {
        "feature_key": "INVOICE_OCR",
        "feature_name": "OCR trích xuất phiếu nhập/xuất kho (Legacy)",
        "permission_level": 2,
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 15.0
    },
    {
        "feature_key": "INVENTORY_OCR",
        "feature_name": "OCR trích xuất phiếu nhập/xuất kho (G3)",
        "permission_level": 2,
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 20.0
    },
    {
        "feature_key": "PRODUCTION_LOG",
        "feature_name": "Chuẩn hóa tin nhắn báo cáo ca sản xuất",
        "permission_level": 2,
        "is_enabled": True,
        "provider": "gemini",
        "model_name": "gemini-2.0-flash",
        "monthly_budget_usd": 10.0
    },
    {
        "feature_key": "DAILY_SUMMARY",
        "feature_name": "Tổng hợp báo cáo điều hành tự động sáng/chiều",
        "permission_level": 3,
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
    """Khởi tạo toàn bộ dữ liệu nền tảng cho G1, G2 và G3."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE materials ADD COLUMN last_movement_at DATETIME"))
        except Exception:
            pass
        try:
            await conn.execute(text("ALTER TABLE work_orders ADD COLUMN bom_snapshot JSON DEFAULT '{}' NOT NULL"))
        except Exception:
            pass

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

        # 2. Khởi tạo Admin
        admin_result = await session.execute(select(User).where(User.username == "admin"))
        admin_user = admin_result.scalars().first()
        if not admin_user:
            admin_user = User(
                username="admin",
                full_name="Quản trị viên Hệ thống Cậu Long",
                phone="0901234567",
                role_id=roles_by_code["ADMIN"].id,
                password_hash=get_password_hash("Admin@123456"),
                is_active=True
            )
            session.add(admin_user)
            await session.flush()

        # 3. Khởi tạo Sample Users
        sample_users = [
            ("director", "Giám đốc Nguyễn Văn An (GIẢ LẬP)", "0901000001", "DIRECTOR", "Director@123456"),
            ("kinhdoanh", "Kinh doanh Phạm Thị Dung (GIẢ LẬP)", "0901000002", "SALES", "Sales@123456"),
            ("kythuat", "Kỹ sư Lê Hoàng Nam (GIẢ LẬP)", "0901000003", "TECH", "Tech@123456"),
            ("totruong", "Tổ trưởng xưởng Trần Văn Bình (GIẢ LẬP)", "0901000004", "FOREMAN", "Foreman@123456"),
            ("thukho", "Thủ kho Lê Văn Chung (GIẢ LẬP)", "0901000005", "WAREHOUSE", "Warehouse@123456"),
            ("thicong", "Giám sát thi công Vũ Minh Đức (GIẢ LẬP)", "0901000006", "SITE", "Site@123456"),
            ("ketoan", "Kế toán trưởng Hoàng Kim Oanh (GIẢ LẬP)", "0901000007", "ACCOUNTANT", "Account@123456"),
        ]
        users_by_uname = {"admin": admin_user}
        for uname, fname, phone, rcode, pwd in sample_users:
            u_res = await session.execute(select(User).where(User.username == uname))
            u_obj = u_res.scalars().first()
            if not u_obj:
                u_obj = User(
                    username=uname,
                    full_name=fname,
                    phone=phone,
                    role_id=roles_by_code[rcode].id,
                    password_hash=get_password_hash(pwd),
                    is_active=True
                )
                session.add(u_obj)
                await session.flush()
            users_by_uname[uname] = u_obj

        # 4. Khởi tạo AI Settings
        for ai_data in AI_SETTINGS_SEED:
            ai_res = await session.execute(select(AISetting).where(AISetting.feature_key == ai_data["feature_key"]))
            if not ai_res.scalars().first():
                session.add(AISetting(**ai_data))

        # 5. Khởi tạo Materials
        for mat_data in MATERIALS_SEED:
            m_res = await session.execute(select(Material).where(Material.code == mat_data["code"]))
            if not m_res.scalars().first():
                session.add(Material(**mat_data))

        # 6. Khởi tạo Projects Mẫu (G2)
        today = date.today()
        projects_data = [
            ("DA-2026-001", "Cổng nhôm đúc Biệt thự Cậu Long (GIẢ LẬP)", "Ông Long (Quận 7, TP.HCM)", "0908889999", 350000000.0, "IN_PRODUCTION"),
            ("DA-2026-002", "Khung thép tiền chế Xưởng Tân Bình (GIẢ LẬP)", "Công ty TNHH Tân Bình", "0907776655", 680000000.0, "IN_PRODUCTION"),
            ("DA-2026-003", "Lan can Inox Khách sạn Riverside (GIẢ LẬP)", "Tập đoàn Riverside", "0903332211", 220000000.0, "IN_PRODUCTION"),
        ]
        projs_by_code = {}
        for code, name, c_name, c_phone, c_val, st in projects_data:
            p_res = await session.execute(select(Project).where(Project.code == code))
            p_obj = p_res.scalars().first()
            if not p_obj:
                p_obj = Project(
                    code=code,
                    name=name,
                    customer_name=c_name,
                    customer_phone=c_phone,
                    manager_id=users_by_uname["kinhdoanh"].id,
                    status=st,
                    contract_value=c_val
                )
                session.add(p_obj)
                await session.flush()
            projs_by_code[code] = p_obj

        # 7. Khởi tạo Lệnh sản xuất mẫu (Work Orders - G2)
        wo_data = [
            # LSX 1: Sắp xong, chuẩn bị giao (90%)
            (
                "LSX-2026-001",
                projs_by_code["DA-2026-001"].id,
                "Cổng nhôm đúc 4 cánh hoa văn rồng",
                4.0, 3.0, "Bộ",
                today - timedelta(days=10), today + timedelta(days=2),
                users_by_uname["totruong"].id,
                "IN_PROGRESS", "NORMAL", None
            ),
            # LSX 2: ĐÃ QUÁ HẠN 2 NGÀY (CRITICAL ALERT)
            (
                "LSX-2026-002",
                projs_by_code["DA-2026-002"].id,
                "Khung dầm thép chịu lực I-300",
                50.0, 15.0, "Cấu kiện",
                today - timedelta(days=15), today - timedelta(days=2),
                users_by_uname["totruong"].id,
                "IN_PROGRESS", "CRITICAL", "Đã quá hạn giao 2 ngày! Thiếu phôi thép góc V50 và kẹt máy cắt"
            ),
            # LSX 3: NGUY CƠ TRỄ (WARNING)
            (
                "LSX-2026-003",
                projs_by_code["DA-2026-003"].id,
                "Lan can Inox 304 uốn cong nghệ thuật",
                80.0, 25.0, "Mét",
                today - timedelta(days=5), today + timedelta(days=2),
                users_by_uname["totruong"].id,
                "IN_PROGRESS", "WARNING", "Chỉ còn 2 ngày, thiếu sơn Epoxy xám và nhân công hàn bận ca khác"
            ),
        ]
        wos_by_code = {}
        for code, pid, pname, tqty, cqty, unit, sdate, ddate, fid, st, rlvl, rrs in wo_data:
            wo_res = await session.execute(select(WorkOrder).where(WorkOrder.code == code))
            wo_obj = wo_res.scalars().first()
            if not wo_obj:
                wo_obj = WorkOrder(
                    code=code,
                    project_id=pid,
                    product_name=pname,
                    target_qty=tqty,
                    completed_qty=cqty,
                    unit=unit,
                    start_date=sdate,
                    due_date=ddate,
                    assigned_foreman_id=fid,
                    status=st,
                    risk_level=rlvl,
                    risk_reason=rrs,
                    bom_snapshot={
                        "materials": [
                            {"material_code": "VT-THEP-V50", "norm_per_unit": 0.4, "total_required": 20.0}
                        ]
                    } if code == "LSX-2026-002" else None
                )
                session.add(wo_obj)
                await session.flush()
            elif code == "LSX-2026-002" and not wo_obj.bom_snapshot:
                wo_obj.bom_snapshot = {
                    "materials": [
                        {"material_code": "VT-THEP-V50", "norm_per_unit": 0.4, "total_required": 20.0}
                    ]
                }
            wos_by_code[code] = wo_obj

        # 8. Khởi tạo Nhật ký ca hôm nay (Production Logs)
        logs_seed = [
            (wos_by_code["LSX-2026-001"].id, projs_by_code["DA-2026-001"].id, "Sơn", 1.0, 4, 32.0, None, "Sơn phủ hoàn thiện 1 bộ cổng nhôm"),
            (wos_by_code["LSX-2026-002"].id, projs_by_code["DA-2026-002"].id, "Cắt", 5.0, 3, 24.0, "Máy cắt CNC kẹt bàn đẩy 45 phút", "Cắt được 5 cây dầm thì máy cắt trục trặc"),
            (wos_by_code["LSX-2026-003"].id, projs_by_code["DA-2026-003"].id, "Hàn", 10.0, 4, 36.0, "Hết que hàn Inox đặc biệt", "Tổ 2 hàn xong 10m lan can khách sạn"),
        ]
        for woid, pid, stage, qty, workers, mhours, issue, raw in logs_seed:
            pl_check = await session.execute(select(ProductionLog).where(ProductionLog.work_order_id == woid))
            if not pl_check.scalars().first():
                pl = ProductionLog(
                    work_order_id=woid,
                    project_id=pid,
                    foreman_id=users_by_uname["totruong"].id,
                    shift_date=today,
                    shift_type="DAY",
                    stage_name=stage,
                    completed_qty=qty,
                    worker_count=workers,
                    total_man_hours=mhours,
                    issues_reported=issue,
                    raw_message=raw,
                    ai_confidence=0.95,
                    status="VERIFIED"
                )
                session.add(pl)

        # 9. Khởi tạo Đơn mua hàng (Purchase Orders - G3)
        po_seed = [
            (
                "PO-2026-001",
                "Công ty Cổ phần Thép Hòa Phát",
                projs_by_code["DA-2026-002"].id,
                today - timedelta(days=5),
                today - timedelta(days=1),
                "APPROVED",
                [
                    {"material_code": "VT-THEP-V50", "material_name": "Thép góc V50x50x5mm", "quantity_ordered": 100.0, "unit_price": 240000.0, "unit": "Cây"},
                    {"material_code": "VT-THEP-HOP50", "material_name": "Thép hộp 50x100 dày 2mm", "quantity_ordered": 50.0, "unit_price": 375000.0, "unit": "Cây"}
                ],
                42750000.0,
                "Đơn đặt hàng cung ứng thép dự án Xưởng Tân Bình"
            ),
            (
                "PO-2026-002",
                "Công ty TNHH Sơn Jotun Việt Nam",
                projs_by_code["DA-2026-001"].id,
                today - timedelta(days=8),
                today - timedelta(days=2),
                "COMPLETED",
                [
                    {"material_code": "VT-SON-EPOXY", "material_name": "Sơn Epoxy chống gỉ 2 thành phần", "quantity_ordered": 10.0, "unit_price": 1200000.0, "unit": "Thùng"}
                ],
                12000000.0,
                "Đơn đặt hàng sơn biệt thự Cậu Long"
            )
        ]
        pos_by_code = {}
        for pcode, sname, pid, odate, ddate, st, itms, tot, nts in po_seed:
            po_check = await session.execute(select(PurchaseOrder).where(PurchaseOrder.po_code == pcode))
            po_obj = po_check.scalars().first()
            if not po_obj:
                po_obj = PurchaseOrder(
                    po_code=pcode,
                    supplier_name=sname,
                    project_id=pid,
                    order_date=odate,
                    expected_delivery_date=ddate,
                    status=st,
                    items=itms,
                    total_amount=tot,
                    notes=nts
                )
                session.add(po_obj)
                await session.flush()
            pos_by_code[pcode] = po_obj

        # 10. Khởi tạo Giao dịch kho mẫu (Inventory Transactions - G3)
        # Lấy vật tư theo mã
        mats_res = await session.execute(select(Material))
        mats_dict = {m.code: m for m in mats_res.scalars().all()}

        tx_seed = [
            # Phiếu nhập theo PO-001 (50 cây Thép V50)
            (
                "PNK-2026-001", "IN", "VT-THEP-V50", 50.0, 240000.0,
                projs_by_code["DA-2026-002"].id, None, pos_by_code["PO-2026-001"].id,
                "Công ty Cổ phần Thép Hòa Phát", "HĐ-88219",
                0.98, {"quantity": 0.99, "unit_price": 0.97}, "Nhập kho đợt 1 theo PO-2026-001"
            ),
            # Phiếu xuất vượt định mức cho LSX-2026-002 (Xuất 25 cây, BOM chỉ cho 20 -> cảnh báo vượt định mức!)
            (
                "PXK-2026-001", "OUT", "VT-THEP-V50", 25.0, 245000.0,
                projs_by_code["DA-2026-002"].id, wos_by_code["LSX-2026-002"].id, None,
                "Tổ cắt & hàn dầm thép", "PX-0412",
                0.96, {"quantity": 0.96, "unit_price": 0.96}, "Xuất phôi gia công khung dầm"
            ),
            # Phiếu nhập sơn theo PO-002
            (
                "PNK-2026-002", "IN", "VT-SON-EPOXY", 5.0, 1200000.0,
                projs_by_code["DA-2026-001"].id, None, pos_by_code["PO-2026-002"].id,
                "Công ty TNHH Sơn Jotun Việt Nam", "HĐ-1142",
                0.95, {"quantity": 0.95, "unit_price": 0.95}, "Nhập kho sơn hoàn thiện"
            )
        ]
        for tcode, ttype, mcode, qty, uprice, pid, woid, poid, partner, rno, aiconf, confmap, nts in tx_seed:
            tx_check = await session.execute(select(InventoryTransaction).where(InventoryTransaction.tx_code == tcode))
            if not tx_check.scalars().first() and mcode in mats_dict:
                mat_item = mats_dict[mcode]
                tx_obj = InventoryTransaction(
                    tx_code=tcode,
                    tx_type=ttype,
                    material_id=mat_item.id,
                    material_code=mat_item.code,
                    material_name=mat_item.name,
                    unit=mat_item.unit,
                    quantity=qty,
                    unit_price=uprice,
                    total_value=qty * uprice,
                    project_id=pid,
                    work_order_id=woid,
                    purchase_order_id=poid,
                    partner_name=partner,
                    receipt_no=rno,
                    ai_confidence=aiconf,
                    confidence_by_field=confmap,
                    created_by_id=users_by_uname["thukho"].id,
                    notes=nts
                )
                session.add(tx_obj)

        await session.commit()
        print("[OK] Khoi tao thanh cong du lieu nen G1, G2 & G3 (PO, Transactions, BOM)!")

if __name__ == "__main__":
    asyncio.run(seed_all_data())

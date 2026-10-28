import io
import pandas as pd
from typing import List, Tuple, Set
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.material import Material
from app.schemas.material import MaterialImportResult, MaterialImportRowError, MaterialResponse

COLUMN_MAP = {
    # Mã vật tư
    "mã": "code",
    "mã vật tư": "code",
    "ma vat tu": "code",
    "code": "code",
    "material_code": "code",
    
    # Tên vật tư
    "tên": "name",
    "tên vật tư": "name",
    "ten vat tu": "name",
    "name": "name",
    "material_name": "name",
    
    # Quy cách
    "quy cách": "spec",
    "quy cach": "spec",
    "thông số": "spec",
    "spec": "spec",
    "specification": "spec",
    
    # Đơn vị tính
    "đơn vị": "unit",
    "đơn vị tính": "unit",
    "dvt": "unit",
    "don vi tinh": "unit",
    "unit": "unit",
    
    # Nhóm vật tư
    "nhóm": "category",
    "nhóm vật tư": "category",
    "loại": "category",
    "loại vật tư": "category",
    "category": "category",
    
    # Đơn giá
    "đơn giá": "standard_price",
    "giá chuẩn": "standard_price",
    "giá": "standard_price",
    "gia": "standard_price",
    "price": "standard_price",
    "standard_price": "standard_price",
    
    # Tồn tối thiểu
    "tồn tối thiểu": "min_stock_alert",
    "mức báo động": "min_stock_alert",
    "min_stock": "min_stock_alert",
    "min_stock_alert": "min_stock_alert",
    
    # Tồn hiện tại
    "tồn kho": "current_stock",
    "tồn hiện tại": "current_stock",
    "current_stock": "current_stock",
    "stock": "current_stock"
}

def normalize_column_name(col: str) -> str:
    clean = str(col).strip().lower()
    return COLUMN_MAP.get(clean, clean)

async def parse_and_validate_materials_file(
    file_bytes: bytes,
    filename: str,
    db: AsyncSession
) -> MaterialImportResult:
    """
    Đọc tệp Excel hoặc CSV, kiểm tra lỗi từng dòng và báo lỗi chi tiết bằng tiếng Việt.
    Nếu dòng hợp lệ: thêm vào danh sách tạo mới/cập nhật.
    """
    errors: List[MaterialImportRowError] = []
    created_materials: List[MaterialResponse] = []

    # 1. Đọc tệp thành DataFrame
    try:
        if filename.endswith(".csv"):
            # Thử utf-8, nếu lỗi thử cp1258 hoặc latin1
            try:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(io.BytesIO(file_bytes), encoding="cp1258")
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(file_bytes))
        else:
            return MaterialImportResult(
                total_rows=0,
                success_count=0,
                error_count=1,
                errors=[
                    MaterialImportRowError(
                        row_number=0,
                        field="file",
                        error_message="Định dạng tệp không được hỗ trợ. Vui lòng tải lên tệp .xlsx, .xls hoặc .csv."
                    )
                ]
            )
    except Exception as e:
        return MaterialImportResult(
            total_rows=0,
            success_count=0,
            error_count=1,
            errors=[
                MaterialImportRowError(
                    row_number=0,
                    field="file",
                    error_message=f"Lỗi khi đọc tệp dữ liệu: {str(e)}"
                )
            ]
        )

    # Chuẩn hóa tên cột
    df.columns = [normalize_column_name(c) for c in df.columns]

    # Kiểm tra các cột bắt buộc
    required_fields = ["code", "name", "unit"]
    for rf in required_fields:
        if rf not in df.columns:
            errors.append(
                MaterialImportRowError(
                    row_number=1,
                    field=rf,
                    error_message=f"Tệp thiếu cột bắt buộc: '{rf}'. Vui lòng kiểm tra lại dòng tiêu đề mẫu."
                )
            )
    if errors:
        return MaterialImportResult(
            total_rows=len(df),
            success_count=0,
            error_count=len(errors),
            errors=errors
        )

    # Lấy danh sách mã vật tư đã có trong cơ sở dữ liệu
    existing_result = await db.execute(select(Material.code))
    existing_codes: Set[str] = set(existing_result.scalars().all())
    seen_in_file: Set[str] = set()

    # Duyệt từng dòng (row_idx tính từ 2 vì dòng 1 là tiêu đề)
    valid_materials_to_add: List[Material] = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # Dòng thực tế trong Excel (1-indexed + header)

        # Bỏ qua nếu dòng hoàn toàn trống
        if row.isna().all():
            continue

        raw_code = str(row.get("code", "")).strip()
        raw_name = str(row.get("name", "")).strip()
        raw_unit = str(row.get("unit", "")).strip()
        raw_spec = str(row.get("spec", "")).strip() if pd.notna(row.get("spec")) else ""
        raw_category = str(row.get("category", "")).strip() if pd.notna(row.get("category")) else "Vật tư chung"

        # Kiểm tra mã
        if not raw_code or raw_code.lower() == "nan":
            errors.append(MaterialImportRowError(
                row_number=row_num,
                field="code",
                error_message=f"Dòng {row_num}: Thiếu mã vật tư bắt buộc.",
                raw_value=raw_code
            ))
            continue

        if raw_code in seen_in_file:
            errors.append(MaterialImportRowError(
                row_number=row_num,
                field="code",
                error_message=f"Dòng {row_num}: Mã vật tư '{raw_code}' bị trùng lặp trong tệp tải lên.",
                raw_value=raw_code
            ))
            continue
        seen_in_file.add(raw_code)

        if raw_code in existing_codes:
            errors.append(MaterialImportRowError(
                row_number=row_num,
                field="code",
                error_message=f"Dòng {row_num}: Mã vật tư '{raw_code}' đã tồn tại trong hệ thống.",
                raw_value=raw_code
            ))
            continue

        # Kiểm tra tên
        if not raw_name or raw_name.lower() == "nan":
            errors.append(MaterialImportRowError(
                row_number=row_num,
                field="name",
                error_message=f"Dòng {row_num}: Thiếu tên vật tư bắt buộc.",
                raw_value=raw_name
            ))
            continue

        # Kiểm tra đơn vị tính
        if not raw_unit or raw_unit.lower() == "nan":
            errors.append(MaterialImportRowError(
                row_number=row_num,
                field="unit",
                error_message=f"Dòng {row_num}: Thiếu đơn vị tính (kg, m, tấm, cây...).",
                raw_value=raw_unit
            ))
            continue

        # Kiểm tra đơn giá
        standard_price = 0.0
        val_price = row.get("standard_price", 0)
        if pd.notna(val_price) and str(val_price).strip() != "":
            try:
                # Xóa dấu phẩy phân cách ngàn nếu có
                clean_p = str(val_price).replace(",", "").replace(".", "").strip() if isinstance(val_price, str) and "." in val_price and "," in val_price else str(val_price).replace(",", "").strip()
                standard_price = float(clean_p)
                if standard_price < 0:
                    raise ValueError()
            except Exception:
                errors.append(MaterialImportRowError(
                    row_number=row_num,
                    field="standard_price",
                    error_message=f"Dòng {row_num}: Đơn giá '{val_price}' không hợp lệ. Phải là số dương.",
                    raw_value=val_price
                ))
                continue

        # Kiểm tra tồn tối thiểu
        min_stock = 0.0
        val_min = row.get("min_stock_alert", 0)
        if pd.notna(val_min) and str(val_min).strip() != "":
            try:
                min_stock = float(str(val_min).replace(",", "").strip())
                if min_stock < 0:
                    raise ValueError()
            except Exception:
                errors.append(MaterialImportRowError(
                    row_number=row_num,
                    field="min_stock_alert",
                    error_message=f"Dòng {row_num}: Mức tồn cảnh báo '{val_min}' không hợp lệ. Phải là số dương.",
                    raw_value=val_min
                ))
                continue

        # Kiểm tra tồn hiện tại
        current_stock = 0.0
        val_stock = row.get("current_stock", 0)
        if pd.notna(val_stock) and str(val_stock).strip() != "":
            try:
                current_stock = float(str(val_stock).replace(",", "").strip())
            except Exception:
                errors.append(MaterialImportRowError(
                    row_number=row_num,
                    field="current_stock",
                    error_message=f"Dòng {row_num}: Số lượng tồn '{val_stock}' không hợp lệ.",
                    raw_value=val_stock
                ))
                continue

        # Dòng hợp lệ, chuẩn bị thêm vào database
        new_mat = Material(
            code=raw_code,
            name=raw_name,
            spec=raw_spec,
            unit=raw_unit,
            category=raw_category,
            standard_price=standard_price,
            min_stock_alert=min_stock,
            current_stock=current_stock,
            is_active=True
        )
        valid_materials_to_add.append(new_mat)

    # Nếu có lỗi, KHÔNG commit dữ liệu rác, báo đầy đủ danh sách lỗi
    # Nếu không có lỗi, commit toàn bộ
    if not errors and valid_materials_to_add:
        for m in valid_materials_to_add:
            db.add(m)
        await db.commit()
        for m in valid_materials_to_add:
            await db.refresh(m)
            created_materials.append(MaterialResponse.model_validate(m))

    return MaterialImportResult(
        total_rows=len(df),
        success_count=len(created_materials),
        error_count=len(errors),
        created_materials=created_materials,
        errors=errors
    )

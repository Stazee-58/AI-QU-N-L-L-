from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.material import Material
from app.schemas.material import (
    MaterialCreate, MaterialUpdate, MaterialResponse, MaterialImportResult
)
from app.services.excel_import import parse_and_validate_materials_file
from app.api.deps import require_role, get_current_user

router = APIRouter(prefix="/materials", tags=["Vật tư & Bảng giá"])

@router.get("", response_model=List[MaterialResponse])
async def list_materials(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Material).order_by(Material.code)
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Material.code.ilike(search_filter)) |
            (Material.name.ilike(search_filter)) |
            (Material.spec.ilike(search_filter))
        )
    if category:
        query = query.where(Material.category == category)
    if is_active is not None:
        query = query.where(Material.is_active == is_active)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def create_material(
    req: MaterialCreate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    check = await db.execute(select(Material).where(Material.code == req.code))
    if check.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Mã vật tư '{req.code}' đã tồn tại trong danh mục.",
        )
    
    material = Material(**req.model_dump())
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return material

@router.get("/template", response_class=PlainTextResponse)
async def download_import_template():
    """
    Trả về mẫu tệp CSV chuẩn tiếng Việt để người dùng điền và tải lên.
    """
    content = "Mã vật tư,Tên vật tư,Quy cách,Đơn vị tính,Nhóm vật tư,Đơn giá,Tồn tối thiểu,Tồn kho\n" \
              "VT-THEP-V50,Thép góc V50,Dày 5mm mạ kẽm,Cây,Thép,240000,20,50\n" \
              "VT-GO-MDF18,Ván Gỗ MDF 18mm,Khổ 1220x2440 lõi xanh chống ẩm,Tấm,Gỗ,380000,10,25\n" \
              "VT-OC-M8,Bu lông ốc vít M8,Inox 304 dài 40mm,Bộ,Phụ kiện,2500,200,1000\n"
    return PlainTextResponse(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mau_danh_muc_vat_tu.csv"}
    )

@router.post("/import", response_model=MaterialImportResult)
async def import_materials(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    """
    Nhập danh mục vật tư / bảng giá từ file Excel/CSV.
    Có kiểm tra lỗi từng dòng và báo lỗi chi tiết bằng tiếng Việt.
    """
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tệp tải lên rỗng.")
    
    result = await parse_and_validate_materials_file(
        file_bytes=file_bytes,
        filename=file.filename or "upload.csv",
        db=db
    )
    return result

@router.get("/{material_id}", response_model=MaterialResponse)
async def get_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(get_current_user)
):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vật tư.")
    return material

@router.put("/{material_id}", response_model=MaterialResponse)
async def update_material(
    material_id: str,
    req: MaterialUpdate,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN", "TECH"]))
):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vật tư.")

    update_data = req.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(material, field, val)

    await db.commit()
    await db.refresh(material)
    return material

@router.delete("/{material_id}")
async def deactivate_material(
    material_id: str,
    db: AsyncSession = Depends(get_db),
    user = Depends(require_role(["ADMIN"]))
):
    material = await db.get(Material, material_id)
    if not material:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy vật tư.")

    material.is_active = False
    await db.commit()
    return {"message": f"Đã tạm dừng sử dụng vật tư '{material.code}'."}

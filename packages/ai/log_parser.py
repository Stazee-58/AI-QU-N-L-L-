import re
import unicodedata
from typing import Dict, Any, Optional, List, Tuple
from app.schemas.production import ParsedProductionLog

# Bộ từ điển chuẩn hóa tiếng lóng, viết tắt tại xưởng
ABBREVIATIONS = {
    r"\bxog\b": "xong",
    r"\bxog r\b": "xong rồi",
    r"\bdc\b": "được",
    r"\bdk\b": "được",
    r"\bđc\b": "được",
    r"\bduoc\b": "được",
    r"\bchiec\b": "chiếc",
    r"\bcai\b": "cái",
    r"\bda\b": "dự án",
    r"\bd/a\b": "dự án",
    r"\bd\.a\b": "dự án",
    r"\bdu an\b": "dự án",
    r"\blsx\b": "lệnh sản xuất",
    r"\blenh\b": "lệnh",
    r"\btho\b": "thợ",
    r"\bae\b": "anh em",
    r"\bng\b": "người",
    r"\bko\b": "không",
    r"\bk\b": "không",
    r"\btc\b": "tăng ca",
    r"\btg\b": "thời gian",
    r"\bbjo\b": "bây giờ"
}

def remove_accents(input_str: str) -> str:
    """Loại bỏ dấu tiếng Việt để so khớp tương đối."""
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return "".join([c for c in nfkd_form if not unicodedata.combining(c)])

def normalize_workshop_text(text: str) -> str:
    """Làm sạch và chuẩn hóa tin nhắn xưởng."""
    clean = text.lower().strip()
    for pattern, replacement in ABBREVIATIONS.items():
        clean = re.sub(pattern, replacement, clean)
    return clean

def extract_stage(text: str) -> Optional[str]:
    """Nhận diện công đoạn sản xuất (dùng regex word boundaries tránh nhận nhầm chữ cái lồng)."""
    clean = text.lower()
    no_accent = remove_accents(clean)

    # 1. Lắp ráp (kiểm tra trước đóng gói/xuất xưởng)
    if re.search(r"\b(lap rap|lap ghep|ghep|rap|hoan thien|ban le)\b", no_accent):
        return "Lắp ráp"
    # 2. Đóng gói
    if re.search(r"\b(dong goi|boc mang|dong kien|xuat xuong)\b", no_accent):
        return "Đóng gói"
    # 3. Sơn
    if re.search(r"\b(son|phun|epoxy|chong ri)\b", no_accent):
        return "Sơn"
    # 4. Hàn (dùng \bhan\b để không nhầm với 'hang' hay 'hoan thanh')
    if re.search(r"\b(han|dinh|ga|gia co)\b", no_accent):
        return "Hàn"
    # 5. Cắt
    if re.search(r"\b(cat|dot dap|xe|cua thep)\b", no_accent):
        return "Cắt"

    return None

def extract_quantity_and_unit(text: str) -> Tuple[Optional[float], Optional[str]]:
    """Trích xuất số lượng hoàn thành và đơn vị tính."""
    clean = text.lower()
    no_accent = remove_accents(clean)

    # 1. Mẫu: số + đơn vị tính (hỗ trợ cả có dấu và không dấu, viết tắt 'c')
    pattern = r"(\d+(?:[.,]\d+)?)\s*(cây|cay|bộ|bo|chiếc|chiec|cái|cai|tấm|tam|mét|met|m2|m|kg|tấn|khung|cánh|canh|kiện|kien|c\b)"
    match = re.search(pattern, clean)
    if match:
        qty = float(match.group(1).replace(",", "."))
        unit = match.group(2).lower()
        if unit in ["cay", "cây"]: unit = "Cây"
        elif unit in ["bo", "bộ"]: unit = "Bộ"
        elif unit in ["chiec", "chiếc", "cai", "cái", "c"]: unit = "Chiếc"
        elif unit in ["tam", "tấm"]: unit = "Tấm"
        elif unit in ["met", "mét", "m"]: unit = "Mét"
        elif unit in ["khung"]: unit = "Khung"
        elif unit in ["canh", "cánh"]: unit = "Cánh"
        elif unit in ["kien", "kiện"]: unit = "Kiện"
        return qty, unit

    # 2. Mẫu: từ công đoạn + số (vd: "cat xong 40", "han dc 25", "hoan thanh 30")
    pattern_action = r"(?:xong|duoc|hoan thanh|lam duoc|ra duoc)\s+(\d+(?:[.,]\d+)?)"
    match_action = re.search(pattern_action, no_accent)
    if match_action:
        return float(match_action.group(1).replace(",", ".")), "Bộ"

    return None, None

def extract_workers_and_hours(text: str) -> Tuple[int, float]:
    """Trích xuất số thợ và tổng giờ công."""
    clean = text.lower()
    no_accent = remove_accents(clean)

    worker_count = 1
    total_hours = 8.0

    # 1. Tìm số thợ (vd: "4 tho", "5 anh em", "to 3 nguoi", "2 tho")
    worker_match = re.search(r"(\d+)\s*(?:tho|thợ|anh em|nguoi|người|ae)", clean)
    if worker_match:
        worker_count = int(worker_match.group(1))

    # 2. Tìm giờ công hoặc tăng ca (vd: "tang ca 2 tieng", "lam 9 gio")
    ot_match = re.search(r"(?:tang ca|ot|them)\s+(\d+(?:[.,]\d+)?)\s*(?:tieng|h|gio)", no_accent)
    extra_hours = 0.0
    if ot_match:
        extra_hours = float(ot_match.group(1).replace(",", "."))

    hours_per_worker = 8.0 + extra_hours
    total_hours = worker_count * hours_per_worker

    return worker_count, total_hours

def extract_issues(text: str) -> Optional[str]:
    """Trích xuất sự cố hỏng hóc, thiếu phôi vật tư (dùng word boundaries tránh khớp lồng 'chong' -> 'hong')."""
    clean = text.lower()
    no_accent = remove_accents(clean)

    issue_pattern = r"\b(hong|su co|thieu|chay|het|cham|ket|loi|mat dien|dung may|chay nguon)\b"
    if re.search(issue_pattern, no_accent):
        sentences = re.split(r"[.,;!?\n]", text)
        for s in sentences:
            s_no_accent = remove_accents(s.lower())
            if re.search(issue_pattern, s_no_accent):
                return s.strip()
        return text.strip()
    return None

def extract_project_reference(text: str) -> Tuple[Optional[str], Optional[str]]:
    """Trích xuất mã Dự án (DA-...) hoặc Lệnh sản xuất (LSX-...)."""
    clean = text.upper()
    
    # 1. Tìm mã chính quy DA-xxx hoặc LSX-xxx
    da_match = re.search(r"\b(DA-[A-Z0-9-]+)\b", clean)
    lsx_match = re.search(r"\b(LSX-[A-Z0-9-]+)\b", clean)
    
    da_code = da_match.group(1) if da_match else None
    lsx_code = lsx_match.group(1) if lsx_match else None

    # 2. Ánh xạ tên dự án phổ biến thực tế
    no_accent = remove_accents(text.lower())
    if not da_code and not lsx_code:
        if "tan binh" in no_accent:
            da_code = "DA-2026-002"
            lsx_code = "LSX-2026-002"
        elif "riverside" in no_accent:
            da_code = "DA-2026-003"
            lsx_code = "LSX-2026-003"
        elif any(k in no_accent for k in ["cau long", "long", "biet thu"]):
            da_code = "DA-2026-001"
            lsx_code = "LSX-2026-001"

    return da_code, lsx_code

def parse_production_message(raw_text: str) -> ParsedProductionLog:
    """
    Chuẩn hóa tin nhắn tự do / âm thanh của tổ trưởng thành dữ liệu cấu trúc.
    HỎI LẠI KHI THIẾU TRƯỜNG để đảm bảo tiêu chí chính xác tuyệt đối.
    """
    norm_text = normalize_workshop_text(raw_text)

    stage_name = extract_stage(norm_text)
    completed_qty, unit = extract_quantity_and_unit(norm_text)
    worker_count, total_man_hours = extract_workers_and_hours(norm_text)
    issues_reported = extract_issues(raw_text)
    project_code, work_order_code = extract_project_reference(norm_text)

    # Đánh giá độ tin cậy
    confidence = 0.95
    if not stage_name: confidence -= 0.3
    if completed_qty is None: confidence -= 0.35
    if not (project_code or work_order_code): confidence -= 0.25

    # KIỂM TRA ĐIỀU KIỆN CẦN HỎI LẠI (Clarification Trigger)
    needs_clarification = False
    clarification_question = None

    if completed_qty is None or completed_qty == 0:
        needs_clarification = True
        clarification_question = "Dạ anh cho em hỏi mẻ này tổ mình hoàn thành được số lượng bao nhiêu ạ?"
    elif not stage_name:
        needs_clarification = True
        clarification_question = f"Dạ anh đã làm xong {completed_qty} {unit or 'sản phẩm'}, anh cho em hỏi là ở công đoạn nào ạ (Cắt, Hàn, Sơn hay Lắp ráp)?"
    elif not (project_code or work_order_code):
        needs_clarification = True
        clarification_question = f"Dạ em đã nhận diện: {stage_name} xong {completed_qty} {unit or ''}. Anh cho em hỏi số này thuộc Dự án / Lệnh sản xuất nào ạ?"

    return ParsedProductionLog(
        project_code=project_code,
        work_order_code=work_order_code,
        stage_name=stage_name or "Gia công",
        completed_qty=completed_qty or 0.0,
        unit=unit or "Bộ",
        worker_count=worker_count,
        total_man_hours=total_man_hours,
        issues_reported=issues_reported,
        confidence_score=max(0.2, round(confidence, 2)),
        needs_clarification=needs_clarification,
        clarification_question=clarification_question
    )

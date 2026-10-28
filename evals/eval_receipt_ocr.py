"""
EVALS SUITE: Smart Receipt & Delivery Note OCR Extraction (G3)
Hệ thống Vận hành Sản xuất & Kho Cậu Long Enterprise
Đánh giá độ chính xác trích xuất hóa đơn/phiếu kho và hiệu năng phát hiện ô nghi ngờ (vàng/đỏ).
"""

import os
import sys
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Đường dẫn dự án
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from packages.ai.receipt_parser import parse_receipt_content

# Danh mục vật tư chuẩn để đối soát
STANDARD_CATALOG = [
    {"code": "VT-THEP-V50", "name": "Thép góc V50x50x5mm", "unit": "Cây", "standard_price": 245000.0},
    {"code": "VT-THEP-HOP50", "name": "Thép hộp 50x100 dày 2mm", "unit": "Cây", "standard_price": 380000.0},
    {"code": "VT-INOX-304", "name": "Tấm Inox 304 xước dày 1.5mm", "unit": "Tấm", "standard_price": 850000.0},
    {"code": "VT-SON-EPOXY", "name": "Sơn Epoxy chống gỉ 2 thành phần", "unit": "Thùng", "standard_price": 1250000.0},
]

def run_receipt_ocr_evaluation():
    dataset_path = os.path.join(os.path.dirname(__file__), "data", "receipt_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)

    total_samples = len(samples)
    no_correct = 0
    type_correct = 0
    material_correct = 0
    qty_correct = 0
    price_correct = 0
    suspicious_correct = 0
    latencies = []

    print("=" * 80)
    print("BỘ ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÍCH XUẤT PHIẾU KHO & HÓA ĐƠN (EVALS G3)")
    print(f"Tổng số mẫu kiểm định thực tế: {total_samples}")
    print("=" * 80)

    for s in samples:
        t0 = time.perf_counter()
        parsed = parse_receipt_content(s["raw_ocr_text"], STANDARD_CATALOG)
        latency = (time.perf_counter() - t0) * 1000
        latencies.append(latency)

        # 1. Kiểm tra Số phiếu
        is_no_ok = (parsed.receipt_no == s["expected_no"])
        if is_no_ok: no_correct += 1

        # 2. Kiểm tra Loại giao dịch IN/OUT
        is_type_ok = (parsed.receipt_type == s["expected_type"])
        if is_type_ok: type_correct += 1

        # 3. Kiểm tra Dòng hàng đầu tiên
        first_item = parsed.items[0] if parsed.items else None
        
        # Mã vật tư
        is_mat_ok = bool(first_item and first_item.material_code == s["expected_material"])
        if is_mat_ok: material_correct += 1

        # Số lượng
        is_qty_ok = bool(first_item and abs(first_item.quantity - s["expected_qty"]) < 0.01)
        if is_qty_ok: qty_correct += 1

        # Đơn giá
        is_price_ok = bool(first_item and abs(first_item.unit_price - s["expected_price"]) < 100.0)
        if is_price_ok: price_correct += 1

        # Kiểm tra Phát hiện Ô nghi ngờ (Tô vàng / đỏ)
        detected_suspicious = (parsed.suspicious_fields_count > 0 or parsed.needs_manual_review)
        is_suspicious_ok = (detected_suspicious == s["has_suspicious"])
        if is_suspicious_ok: suspicious_correct += 1

        all_ok = is_no_ok and is_type_ok and is_mat_ok and is_qty_ok and is_price_ok and is_suspicious_ok
        status_tag = "PASS" if all_ok else "WARN"

        qty_val = first_item.quantity if first_item else 0
        price_val = first_item.unit_price if first_item else 0
        mat_val = first_item.material_code if first_item else "N/A"

        print(f"[{status_tag:4}] #{s['id']:02d} | Số: {parsed.receipt_no:10} | Loại: {parsed.receipt_type:3} | Mã: {mat_val:14} | SL: {qty_val:5.1f} | Giá: {price_val:9,.0f} | Nghi ngờ: {detected_suspicious} ({latency:.2f}ms)")

    # Báo cáo tổng kết
    no_acc = (no_correct / total_samples) * 100
    type_acc = (type_correct / total_samples) * 100
    mat_acc = (material_correct / total_samples) * 100
    qty_acc = (qty_correct / total_samples) * 100
    price_acc = (price_correct / total_samples) * 100
    suspicious_acc = (suspicious_correct / total_samples) * 100
    avg_latency = sum(latencies) / len(latencies)

    print("=" * 80)
    print("KẾT QUẢ ĐO LƯỜNG CHỈ SỐ G3 (BENCHMARK METRICS):")
    print(f"1. Độ chính xác Số phiếu:                {no_acc:.1f}% ({no_correct}/{total_samples})")
    print(f"2. Độ chính xác Loại phiếu (IN/OUT):      {type_acc:.1f}% ({type_correct}/{total_samples})")
    print(f"3. Khớp mã vật tư chuẩn:                 {mat_acc:.1f}% ({material_correct}/{total_samples})")
    print(f"4. Trích xuất đúng số lượng:             {qty_acc:.1f}% ({qty_correct}/{total_samples})")
    print(f"5. Trích xuất đúng đơn giá:              {price_acc:.1f}% ({price_correct}/{total_samples})")
    print(f"6. Hiệu chuẩn phát hiện ô nghi ngờ:      {suspicious_acc:.1f}% ({suspicious_correct}/{total_samples})")
    print(f"7. Thời gian phản hồi trung bình (AI):   {avg_latency:.2f} ms")
    print("=" * 80)

    # Đánh giá tiêu chuẩn >= 90%
    overall_score = (no_acc + type_acc + mat_acc + qty_acc + price_acc + suspicious_acc) / 6
    print(f">> ĐIỂM TỔNG THỂ EVALS G3: {overall_score:.2f}%")
    assert overall_score >= 90.0, f"Độ chính xác {overall_score:.2f}% không đạt tiêu chuẩn tối thiểu 90%!"
    print(">> KẾT LUẬN: ĐẠT TIÊU CHUẨN NGHIỆP VỤ G3 (PASSED)")

if __name__ == "__main__":
    run_receipt_ocr_evaluation()

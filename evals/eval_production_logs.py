import os
import sys
import json
import time

# Thêm đường dẫn project vào sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "apps", "api")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from packages.ai.log_parser import parse_production_message

def run_evaluation():
    dataset_path = os.path.join(os.path.dirname(__file__), "data", "production_messages_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        samples = json.load(f)

    total_samples = len(samples)
    stage_correct = 0
    qty_correct = 0
    workers_correct = 0
    issue_correct = 0
    clarification_correct = 0
    latencies = []

    print(f"================================================================================")
    print(f"BỘ ĐÁNH GIÁ ĐỘ CHÍNH XÁC TRÍCH XUẤT BÁO CÁO CA SẢN XUẤT (EVALS G2)")
    print(f"Số lượng mẫu kiểm thử thực tế xưởng: {total_samples}")
    print(f"================================================================================")

    for s in samples:
        t0 = time.perf_counter()
        result = parse_production_message(s["raw_message"])
        latency = (time.perf_counter() - t0) * 1000
        latencies.append(latency)

        # 1. Kiểm tra Công đoạn
        is_stage_ok = (result.stage_name == s["expected_stage"])
        if is_stage_ok: stage_correct += 1

        # 2. Kiểm tra Số lượng
        is_qty_ok = (result.completed_qty == s["expected_qty"]) if s["expected_qty"] is not None else (result.completed_qty == 0.0 or result.needs_clarification)
        if is_qty_ok: qty_correct += 1

        # 3. Kiểm tra Số thợ
        is_workers_ok = (result.worker_count == s["expected_workers"])
        if is_workers_ok: workers_correct += 1

        # 4. Kiểm tra Sự cố
        detected_issue = bool(result.issues_reported)
        is_issue_ok = (detected_issue == s["has_issue"])
        if is_issue_ok: issue_correct += 1

        # 5. Kiểm tra phát hiện HỎI LẠI (Clarification Trigger)
        is_clarify_ok = (result.needs_clarification == s["should_ask_clarification"])
        if is_clarify_ok: clarification_correct += 1

        status_str = "PASS" if (is_stage_ok and is_qty_ok and is_issue_ok and is_clarify_ok) else "REVISE"
        print(f"[{status_str:6}] #{s['id']:02d} | '{s['raw_message'][:40]:40}' | CĐ: {result.stage_name:8} | SL: {result.completed_qty:4} | Thợ: {result.worker_count} | Hỏi lại: {result.needs_clarification} ({latency:.1f}ms)")

    # Tổng kết chỉ số
    avg_latency = sum(latencies) / len(latencies)
    stage_acc = (stage_correct / total_samples) * 100
    qty_acc = (qty_correct / total_samples) * 100
    workers_acc = (workers_correct / total_samples) * 100
    issue_acc = (issue_correct / total_samples) * 100
    clarify_acc = (clarification_correct / total_samples) * 100
    overall_ftr = ((stage_correct + qty_correct + issue_correct + clarify_acc) / (total_samples * 4)) * 100

    print(f"\n================================================================================")
    print(f"KẾT QUẢ ĐO LƯỜNG ĐỊNH LƯỢNG TIÊU CHÍ G2 (ACCURACY METRICS TABLE):")
    print(f"--------------------------------------------------------------------------------")
    print(f"1. Độ chính xác nhận diện Công đoạn (Stage Accuracy)    : {stage_acc:.1f}% ({stage_correct}/{total_samples})")
    print(f"2. Độ chính xác trích xuất Số lượng (Quantity Accuracy) : {qty_acc:.1f}% ({qty_correct}/{total_samples})")
    print(f"3. Độ chính xác số lượng Thợ (Worker Count Accuracy)    : {workers_acc:.1f}% ({workers_correct}/{total_samples})")
    print(f"4. Phát hiện Sự cố xưởng (Issue Detection Accuracy)     : {issue_acc:.1f}% ({issue_correct}/{total_samples})")
    print(f"5. Nhận diện chuẩn khi nào cần HỎI LẠI (Clarification)  : {clarify_acc:.1f}% ({clarification_correct}/{total_samples})")
    print(f"6. Tỷ lệ Đúng ngay lần đầu (First-Time-Right - FTR)     : {overall_ftr:.1f}%")
    print(f"7. Thời gian phản hồi trung bình (Average Latency)      : {avg_latency:.2f} ms")
    print(f"================================================================================")

    # Đánh giá tiêu chuẩn nghiệm thu
    if overall_ftr >= 90.0 and avg_latency < 500:
        print("✓ NGHIỆM THU ĐẠT: Đạt ngưỡng chính xác >= 90% và thời gian xử lý siêu tốc < 500ms.")
    else:
        print("✗ CHƯA ĐẠT: Cần tinh chỉnh parser.")

if __name__ == "__main__":
    run_evaluation()

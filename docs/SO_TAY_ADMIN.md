# SỔ TAY QUẢN TRỊ HỆ THỐNG (ADMIN HANDBOOK)
**Dành cho Quản trị viên Kỹ thuật (System Administrator) • Cậu Long Enterprise**

---

## 1. Triển Khai Hệ Thống 1 Lệnh (Docker Compose)

### 1.1. Yêu cầu Hệ thống Tối thiểu
- **Hệ điều hành**: Linux (Ubuntu 22.04 LTS+) hoặc Windows 10/11 Pro có WSL2.
- **Phần cứng**: 2 CPU Cores, 4GB RAM, 20GB SSD lưu trữ.
- **Cài đặt sẵn**: Docker Engine 24.0+ và Docker Compose v2.20+.

### 1.2. Khởi động Toàn bộ Hệ thống
Từ thư mục gốc dự án:
```bash
# 1. Sao chép tệp cấu hình môi trường
cp infra/.env.example infra/.env

# 2. Khởi chạy 3 container: PostgreSQL 16 (pgvector), FastAPI Backend, Next.js Frontend
docker-compose -f infra/docker-compose.yml up -d

# 3. Khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu ban đầu
docker-compose -f infra/docker-compose.yml exec api python app/seed.py
```
- **Web App**: `http://localhost:3000`
- **FastAPI OpenAPI Swagger**: `http://localhost:8000/docs`
- **Tài khoản Admin mặc định**: `admin` / `Admin@123456`

---

## 2. Quản Trị Công Tắc Khẩn Cấp AI (Kill-Switch Policy - ADR-003)

Hệ thống thiết lập cơ chế phòng vệ 3 lớp. Khi có sự cố (API bên thứ ba gián đoạn, chi phí bất thường, hoặc AI trả kết quả ảo giác):

### 2.1. Thao tác Ngắt Khẩn Cấp Trong 1 Giây
1. Đăng nhập quyền `ADMIN` hoặc `DIRECTOR`.
2. Mở tab **"Dashboard Điều Hành"** hoặc **"Cài đặt & Quyền AI"**.
3. Tại dòng tính năng cần ngắt (ví dụ: `INVENTORY_OCR` hoặc `PRODUCTION_LOG`), bấm nút **"Ngắt khẩn cấp"** (màu đỏ).
4. **Hệ quả tức thì**:
   - Mọi request OCR gửi đến API bị chặn lập tức với mã lỗi `403 Forbidden`.
   - Giao diện của Thủ kho/Tổ trưởng tự động hiện thông báo vàng và chuyển 100% sang chế độ Nhập tay thủ công.
   - Không phát sinh chi phí gọi API.

---

## 3. Quản Trị Ngân Sách & Chi Phí AI (ADR-006)

- Mọi tác vụ AI đều được giám sát qua bảng `ai_audit` ghi nhận:
  - `latency_ms`: Thời gian xử lý từng request (chuẩn < 1.000ms).
  - `cost_usd`: Chi phí tính toán trên từng cuộc gọi.
  - `is_modified`: Tỷ lệ người dùng phải sửa đổi lại kết quả AI.
- **Hạn mức an toàn mặc định**:
  - `BOQ_EXTRACTION`: $25.00/tháng
  - `INVENTORY_OCR`: $20.00/tháng
  - `PRODUCTION_LOG`: $10.00/tháng
  - `DAILY_SUMMARY`: $5.00/tháng
- Hệ thống tự động kích hoạt cảnh báo vàng khi tổng chi phí tháng chạm ngưỡng 80% ngân sách.

---

## 4. Quản Trị Phân Quyền Vai Trò (RBAC Matrix)

| Vai trò (`Role`) | Quyền hạn cốt lõi | Màn hình truy cập chính |
| :--- | :--- | :--- |
| **`ADMIN`** | `*:*` (Toàn quyền hệ thống) | Tất cả các màn hình, Phân quyền, Nhật ký AI Audit |
| **`DIRECTOR`** | Xem tiến độ, Báo cáo 3 bản, Quyết toán, Kill-Switch | Dashboard Điều Hành, Báo cáo ngày, Quyết toán |
| **`TECH`** | Bóc tách bản vẽ, Thiết lập BOM, Tạo LSX | Tiến độ LSX, Định mức BOM, Vật tư |
| **`FOREMAN`** | Báo cáo ca sản xuất, Ghi nhận sự cố xưởng | ĐT Tổ Trưởng (Mobile First) |
| **`WAREHOUSE`** | Quét phiếu OCR, Nhập/xuất kho, Gợi ý mua hàng | Phiếu Nhập/Xuất Kho, Thẻ kho, Cảnh báo kho |
| **`ACCOUNTANT`**| Đối soát chi phí, Nghiệm thu, Khóa sổ quyết toán | Quyết Toán Dự Án, Xuất báo cáo tài chính |

---

## 5. Quy Trình Sao Lưu & Khôi Phục Dữ Liệu (Backup & Disaster Recovery)

### 5.1. Sao Lưu Cơ Sở Dữ Liệu Tự Động Hằng Ngày (00:00)
Chạy script sao lưu PostgreSQL:
```bash
docker-compose -f infra/docker-compose.yml exec -T db pg_dump -U caulong caulong_db > /backup/caulong_db_$(date +%Y%m%d).sql
```

### 5.2. Khôi Phục Dữ Liệu Khi Gặp Sự Cố
```bash
cat /backup/caulong_db_20261028.sql | docker-compose -f infra/docker-compose.yml exec -T db psql -U caulong -d caulong_db
```
Thời gian khôi phục hoàn chỉnh: dưới 3 phút.


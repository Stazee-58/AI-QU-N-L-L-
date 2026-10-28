# SỔ TAY VẬN HÀNH THEO VAI TRÒ (CẬU LONG ENTERPRISE)
**Tiêu chuẩn: Người mới sử dụng thành thạo trong vòng 1 tuần • Quy tắc $\le$ 3 chạm • Dưới 45 giây/tác vụ**

---

## 1. Vai trò: GIÁM ĐỐC / BAN ĐIỀU HÀNH (`DIRECTOR`)

### 1.1. Mục tiêu & Trách nhiệm
- Giám sát toàn diện tiến độ sản xuất, tình hình vật tư, sức khỏe tài chính và an toàn AI.
- Ra quyết định điều phối khi phát hiện cảnh báo đỏ (quá hạn giao hàng, xói mòn lợi nhuận).
- Nắm quyền ngắt khẩn cấp AI (Kill-Switch) khi có biến động bất thường.

### 1.2. Thói quen Vận hành Hằng ngày
1. **Đầu ngày (08:00 - 08:05 • 5 phút)**:
   - Mở màn hình **Dashboard Điều Hành**: Liếc nhanh KPI tổng thể: Số lệnh đang chạy, số lệnh quá hạn, biên lãi gộp dự kiến.
   - Kiểm tra **Báo cáo Sáng (Bản Giám đốc)**: Xem 3 mục tiêu trọng tâm trong ngày và các nguy cơ trễ hạn.
2. **Trong ngày (Khi có cảnh báo đỏ)**:
   - Khi có đơn hàng báo ĐỎ (như `LSX-2026-002: Quá hạn giao 2 ngày`): Bấm nút **"Kiểm tra kho ngay"** hoặc bấm gọi Quản đốc/Khách hàng trong 1-chạm.
3. **Cuối ngày (17:30 - 17:35 • 5 phút)**:
   - Đọc **Bản tổng hợp Báo cáo Chiều**: Xem khối lượng đã hoàn thành trong ngày, tỷ lệ tiêu hao giờ công và hạn mức ngân sách AI đã dùng.

---

## 2. Vai trò: TỔ TRƯỞNG XƯỞNG SẢN XUẤT (`FOREMAN`)

### 2.1. Mục tiêu & Trách nhiệm
- Ghi nhận tiến độ công việc từng ca, số giờ công thợ, và sự cố phát sinh tại xưởng.
- Thao tác trực tiếp trên điện thoại thông minh (giao diện ngón tay to, không dùng chuột).

### 2.2. Quy trình Báo Ca Siêu Tốc (Quy tắc 3 Chạm • Dưới 30 giây)
- **Chạm 1 (Chọn Lệnh & Công đoạn)**:
  - Mở tab **"ĐT Tổ Trưởng"** trên điện thoại.
  - Chạm chip nhanh: `+LSX-002 (Khung dầm)` và `Cắt phôi xong 20c`. (Hệ thống tự điền mã chuẩn).
- **Chạm 2 (Xem lại Dữ liệu AI Trích xuất)**:
  - Bấm **"Tiếp tục"**: AI tự động chuẩn hóa số lượng: `20`, công đoạn: `Cắt`, nhân công: `4 thợ`.
- **Chạm 3 (Gửi báo cáo)**:
  - Bấm nút to màu xanh: **"Xác Nhận Gửi Báo Cáo Ca"** $\rightarrow$ Hoàn tất! Bảng tiến độ và thẻ kho tự động cập nhật.

---

## 3. Vai trò: THỦ KHO (`WAREHOUSE`)

### 3.1. Mục tiêu & Trách nhiệm
- Tiếp nhận phiếu giao hàng, hóa đơn nhập vật tư và cấp phát vật tư cho các lệnh sản xuất.
- Đối soát hóa đơn với đơn mua (PO) và định mức BOM; kiểm soát số tồn an toàn.

### 3.2. Quy trình Xử lý Phiếu Kho OCR ($\le$ 3 Thao tác • Dưới 45 giây)
- **Thao tác 1 (Chọn hoặc Chụp ảnh phiếu)**:
  - Đặt hóa đơn lên bàn phẳng, chụp ảnh rõ nét hoặc bấm chọn mẫu hóa đơn nhà cung cấp (Thép Hòa Phát, Sơn Jotun).
  - AI OCR tự động trích xuất mã số phiếu, nhà cung cấp, danh mục vật tư, đơn giá.
- **Thao tác 2 (Đối chiếu Side-by-Side & Xử lý ô nghi ngờ)**:
  - Màn hình chia đôi: Bên trái ảnh hóa đơn gốc, bên phải bảng dữ liệu.
  - **Nếu ô đơn giá tô ĐỎ (< 70%)**: Bấm ngay nút 1-chạm **"⚡ Áp giá chuẩn catalog (245.000đ)"** ngay dưới ô để đồng bộ giá chuẩn, ô chuyển xanh lập tức.
- **Thao tác 3 (Xác nhận ghi thẻ kho)**:
  - Bấm nút **"Xác nhận Ghi Thẻ Kho"** (hoặc bấm `[Enter]`). Thẻ kho cập nhật số tồn tức thì, liên kết trực tiếp mã dự án `DA-2026-002`.

---

## 4. Vai trò: KỸ THUẬT / QUẢN LÝ SẢN XUẤT (`TECH`)

### 4.1. Mục tiêu & Trách nhiệm
- Tạo lệnh sản xuất (LSX), thiết lập định mức nguyên vật liệu (BOM) từ bản vẽ thiết kế.
- Theo dõi cảnh báo vượt định mức vật tư và điều phối máy móc thiết bị xưởng.

### 4.2. Thao tác Hằng ngày
1. **Thiết lập Định Mức BOM**: Nhập số lượng vật tư tiêu hao chuẩn cho mỗi đơn vị sản phẩm (ví dụ: 1 dầm cần 0.4 cây thép V50).
2. **Kiểm tra Cảnh báo Vượt Định mức (`OVER_CONSUMPTION`)**:
   - Khi thủ kho xuất vượt số lượng định mức BOM: Bấm **"Xem nguồn"** để so sánh `norm_required` vs `actual_issued`, tìm nguyên nhân hao hụt (do phôi lỗi, cắt sai hay mối hàn hỏng).

---

## 5. Vai trò: KẾ TOÁN QUYẾT TOÁN (`ACCOUNTANT`)

### 5.1. Mục tiêu & Trách nhiệm
- Kiểm soát chi phí thực tế (vật tư thực xuất + giờ công thợ) so với giá trị hợp đồng ban đầu.
- Lập biên bản nghiệm thu bàn giao và chốt khóa sổ quyết toán dự án.

### 5.2. Quy trình Quyết Toán Dự Án (G5)
1. **Mở Tab "Quyết Toán Dự Án"**: Chọn dự án chuẩn bị bàn giao (ví dụ `DA-2026-001: Cổng nhôm Biệt thự Cậu Long`).
2. **Đối soát 2 Bảng Chi Phí**:
   - Bảng 1: Vật tư thực xuất kho (PXK) vs Định mức BOM.
   - Bảng 2: Giờ công thợ xưởng (Production Logs).
3. **Ký duyệt Nghiệm thu & Khóa sổ**:
   - Nhập số tiền khách đã thanh toán, chọn trạng thái `ĐẠT CHUẨN 100%`.
   - Bấm **"Chốt Nghiệm Thu & Khóa Sổ Quyết Toán"**: Hồ sơ chuyển sang `FINALIZED`, dự án chuyển sang `COMPLETED`, lưu trữ snapshot bất biến.
   - Bấm **"Xuất Báo Cáo Quyết Toán"** để gửi file bảng tính đối soát cho khách hàng hoặc nhập vào phần mềm kế toán.

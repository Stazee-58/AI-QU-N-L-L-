# KỊCH BẢN XỬ LÝ SỰ CỐ VẬN HÀNH (INCIDENT RUNBOOK)
**Dành cho Ban Điều Hành, Quản Đốc & Đội Ngũ Vận Hành • Cậu Long Enterprise**

---

## SỰ CỐ 1: MẤT KẾT NỐI MẠNG HOẶC API AI BÊN NGOÀI BỊ TREO / GIÁN ĐOẠN

### Hiện tượng
- Màn hình quét OCR báo xoay vòng tròn hoặc thông báo "Không thể kết nối dịch vụ AI".
- Xe tải chở vật tư đang đỗ ngoài cổng xưởng, thủ kho cần nhập hàng gấp để thợ dỡ hàng.

### Quy trình Xử lý Khẩn cấp (Dưới 1 phút)
1. **Thủ kho chuyển sang Chế độ Nhập tay**:
   - Bấm vào sub-tab **"Nhập tay Thủ công"** (nằm ngay cạnh tab Quét OCR).
   - Nhập 4 trường cơ bản: Số phiếu, Mã vật tư (chọn trong danh sách dropdown), Số lượng, Đơn giá.
   - Bấm **"Ghi Thẻ Kho Thủ Công"**.
2. **Hệ quả**: Thẻ kho cập nhật số tồn ngay tức thì mà không cần mạng Internet hay API bên ngoài.
3. **Admin kiểm tra**: Mở `Dashboard Điều Hành` kiểm tra hạn mức ngân sách AI hoặc trạng thái mạng máy chủ.

---

## SỰ CỐ 2: AI OCR ĐỌC SAI MÃ HÀNG HOẶC ĐƠN GIÁ BỊ ẢO GIÁC

### Hiện tượng
- Hóa đơn ghi "Thép góc V50x50x5" nhưng AI nhận nhầm thành "Thép hộp 50x100" hoặc đơn giá bị lệch gấp đôi.

### Quy trình Xử lý (Nguyên tắc Provenance ADR-004)
1. **Cơ chế Tô màu Cảnh báo**:
   - Khi đơn giá lệch > 30% so với giá chuẩn: Hệ thống tự động **TÔ ĐỎ (< 70%)** và hiện cờ `needs_manual_review = True`.
2. **Thủ kho sửa lỗi trong 1-chạm**:
   - Bấm nút **"⚡ Áp giá chuẩn catalog"** ngay dưới ô để đồng bộ giá niêm yết của xưởng.
   - Nếu mã vật tư bị nhầm: Bấm dropdown mã vật tư để chọn lại mã đúng.
3. **Bấm "Xác nhận Ghi Thẻ Kho"**: Hệ thống tự động ghi nhật ký `AIAudit` với cờ `is_modified = True` ghi nhận việc con người đã can thiệp sửa đổi để huấn luyện lại bộ parser.

---

## SỰ CỐ 3: XUẤT KHO VƯỢT ĐỊNH MỨC BOM TRONG CA SẢN XUẤT

### Hiện tượng
- Lệnh `LSX-2026-002` theo định mức BOM chỉ được xuất 20 cây Thép V50.
- Thủ kho phát hiện tổ thợ xin xuất thêm 5 cây nữa (tổng 25 cây). Hệ thống kích hoạt cảnh báo vàng `OVER_CONSUMPTION: Vượt định mức BOM 25.0%`.

### Quy trình Xử lý
1. **Thủ kho bấm "Xem nguồn"**: Mở màn hình Provenance xem chi tiết: Định mức BOM yêu cầu bao nhiêu, phiếu xuất kho nào đã ký.
2. **Yêu cầu Tổ trưởng ghi nhận lý do**:
   - Nếu do phôi bị cong vênh / phế liệu: Tổ trưởng phải ghi chú lý do trong báo cáo ca.
   - Nếu do thay đổi thiết kế: Kỹ sư thiết kế phải cập nhật lại BOM Version mới trước khi thủ kho xuất tiếp đợt 2.

---

## SỰ CỐ 4: KIỂM KÊ PHÁT HIỆN LỆCH TỒN SỔ SÁCH VS THỰC TẾ TRONG KHO

### Hiện tượng
- Thẻ kho ghi còn 35 cây Thép V50, nhưng thủ kho đếm thực tế ngoài giá chỉ còn 30 cây (thiếu 5 cây).

### Quy trình Xử lý
1. **Kiểm tra lịch sử giao dịch**: Mở tab **"Lịch sử Giao dịch"**, lọc theo mã `VT-THEP-V50` để kiểm tra các phiếu xuất gần nhất xem có tổ nào lấy chưa lập phiếu.
2. **Lập Phiếu Điều Chỉnh Kiểm Kê**:
   - Mở **"Nhập tay Thủ công"** $\rightarrow$ Chọn loại nghiệp vụ: **`ĐIỀU CHỈNH KIỂM KÊ (ADJUSTMENT)`**.
   - Nhập số lượng thực tế: `30`.
   - Ghi chú: *"Kiểm kê định kỳ ngày 28/10 lệch 5 cây phế phẩm chưa ghi nhận"*.
   - Hệ thống tự động cập nhật số tồn thực tế về 30 và lưu vết đối soát cho Kế toán.

---

## SỰ CỐ 5: NHÂN SỰ MỚI THAO TÁC NHẦM / LỠ GHI SAI SỐ LIỆU

### Hiện tượng
- Nhân viên mới nhập nhầm 500 cây thay vì 50 cây trên phiếu kho.

### Quy trình Xử lý
1. **Nguyên tắc Bất biến (Immutable Audit Trail)**: Không bao giờ xóa bản ghi cũ để tránh gian lận.
2. **Thực hiện Nghiệp vụ Bù Trừ (Reversal Entry)**:
   - Nếu nhập thừa 450 cây: Lập một phiếu xuất điều chỉnh giảm 450 cây gắn mã tham chiếu của phiếu nhập sai.
   - Hoặc lập phiếu `ADJUSTMENT` điều chỉnh số tồn về đúng con số kiểm kê.
3. **Đưa nhân sự mới vào Sandbox luyện tập lại**: Bấm vào tab **"Sandbox & Sát Hạch"**, yêu cầu làm lại Bài tập 1 cho đến khi đạt điểm $\ge 80/100$.


# BỘ NHIỆM VỤ SÁT HẠCH & BÀI KIỂM TRA NGƯỜI MỚI (ONBOARDING EVALUATION)
**Tiêu chuẩn: Nhân sự mới đạt chuẩn vận hành độc lập trong vòng 1 tuần • Cậu Long Enterprise**

---

## 1. Mục Tiêu & Quy Chế Sát Hạch
- **Đối tượng**: Mọi nhân sự mới tuyển dụng thuộc 5 vai trò (Thủ kho, Tổ trưởng, Kỹ thuật, Kế toán, Quản lý).
- **Môi trường thực hiện**: 100% trên môi trường **Sandbox** (không ảnh hưởng dữ liệu sản xuất thật).
- **Hệ thống chấm điểm**: Tự động chấm điểm từ 0 đến 100 dựa trên tốc độ, số thao tác và độ chính xác thực tế.
- **Tiêu chuẩn vượt qua**: Đạt tối thiểu **80/100 điểm** trên cả 2 phần Lý thuyết và Thực hành trong tuần làm việc đầu tiên.

---

## 2. Phần 1: Trắc Nghiệm Tình Huống Vận Hành (15 Phút • 30 Điểm)

### Câu 1: Khi quét hóa đơn nhập kho, nếu một ô đơn giá bị tô màu ĐỎ, điều đó có nghĩa là gì?
- A. Hóa đơn bị mờ không đọc được.
- B. Đơn giá trên hóa đơn lệch > 30% so với giá chuẩn của xưởng, cần kiểm tra kỹ trước khi lưu. *(Đáp án đúng)*
- C. Hóa đơn giả mạo, phải từ chối nhận hàng ngay.
- D. Hệ thống bị mất kết nối mạng Internet.

### Câu 2: Khi mạng xưởng bị mất hoặc tính năng AI bị Quản trị viên ngắt khẩn cấp, Thủ kho phải làm gì?
- A. Dừng toàn bộ việc dỡ hàng, đợi có mạng mới làm tiếp.
- B. Ghi tạm ra sổ giấy rồi cuối tuần nhập bù.
- C. Chuyển sang sub-tab "Nhập tay Thủ công" để ghi thẻ kho bình thường trong 1 phút. *(Đáp án đúng)*
- D. Nhắn tin Zalo nhờ Kế toán nhập hộ.

### Câu 3: Tổ trưởng xưởng báo cáo ca theo quy tắc mấy chạm và trong bao lâu?
- A. 10 chạm, trong vòng 10 phút.
- B. 5 chạm, trong vòng 3 phút.
- C. 3 chạm (Chọn việc $\rightarrow$ Xem lại $\rightarrow$ Xác nhận gửi), dưới 45 giây. *(Đáp án đúng)*
- D. Không cần báo cáo hằng ngày.

### Câu 4: Khi Kế toán quyết toán dự án, chỉ số Lãi gộp thực tế được tính bằng công thức nào?
- A. Doanh thu hợp đồng trừ đi Tiền đặt cọc.
- B. Doanh thu hợp đồng trừ đi (Chi phí vật tư thực xuất kho + Chi phí nhân công ca xưởng + Chi phí khác). *(Đáp án đúng)*
- C. Tổng chi phí vật tư chia cho Định mức BOM.
- D. Giá trị hợp đồng nhân với 10%.

---

## 3. Phần 2: Thực Hành Sát Hạch Thực Tế Trên Sandbox (70 Điểm)

### Nhiệm Vụ 1 (Thủ Kho): Quét Hóa Đơn Lệch Giá & Xử Lý Trong $\le$ 3 Thao Tác
- **Mã bài tập**: `EX-01-WAREHOUSE`
- **Tình huống**: Nhận hóa đơn `BB-3301` có 60 cây Thép V50 với đơn giá 350.000đ (lệch > 40% so với giá chuẩn 245.000đ).
- **Nhiệm vụ**:
  1. Chọn mẫu phiếu hoặc quét ảnh trong $\le 1$ thao tác.
  2. Tại màn hình Side-by-Side: Nhận diện ô ĐỎ và bấm nút `⚡ Áp giá chuẩn catalog` để sửa về 245.000đ trong 1 chạm.
  3. Bấm `Xác nhận Ghi Thẻ Kho`.
- **Tiêu chuẩn chấm điểm**:
  - Tốc độ: $\le 45$ giây (30đ).
  - Thao tác: $\le 3$ chạm (40đ).
  - Độ chính xác: Ghi thành công thẻ kho và không còn cờ đỏ (30đ).

---

### Nhiệm Vụ 2 (Tổ Trưởng): Báo Cáo Ca Sản Xuất 3 Chạm
- **Mã bài tập**: `EX-02-FOREMAN`
- **Tình huống**: Tổ 1 vừa cắt xong 20 dầm cho lệnh `LSX-2026-002` với 4 thợ làm việc 8 tiếng.
- **Nhiệm vụ**:
  1. Mở màn hình điện thoại Tổ trưởng, chạm chip `+LSX-002 (Khung dầm)` và `Cắt phôi xong 20c`.
  2. Bấm `Tiếp tục` để AI kiểm tra đối soát.
  3. Bấm `Xác Nhận Gửi Báo Cáo Ca`.
- **Tiêu chuẩn chấm điểm**:
  - Tốc độ: $\le 40$ giây (30đ).
  - Thao tác: Đúng 3 chạm (40đ).
  - Độ chính xác: Khớp đúng mã lệnh và sản lượng 20 dầm (30đ).

---

### Nhiệm Vụ 3 (Kế Toán / Kỹ Thuật): Đối Soát BOM & Khóa Sổ Quyết Toán
- **Mã bài tập**: `EX-03-TECH-ACCOUNTANT`
- **Tình huống**: Dự án `DA-2026-002` hoàn thành lắp dựng khung thép, cần lập biên bản nghiệm thu và quyết toán hợp đồng 680 triệu.
- **Nhiệm vụ**:
  1. Mở dự án `DA-2026-002` trong tab Quyết toán.
  2. Bấm nút `Xem nguồn` kiểm tra nguyên nhân Thép V50 xuất vượt định mức 5 cây.
  3. Nhập số tiền thanh toán 680.000.000đ, chọn `ĐẠT CHUẨN 100%`.
  4. Bấm `Chốt Nghiệm Thu & Khóa Sổ Quyết Toán` và xuất file đối soát.
- **Tiêu chuẩn chấm điểm**:
  - Tốc độ: $\le 60$ giây (25đ).
  - Truy vết: Có thao tác bấm `Xem nguồn` (35đ).
  - Hoàn tất khóa sổ: Trạng thái chuyển thành `FINALIZED` (40đ).

---

## 4. Bảng Đánh Giá & Rubric Xếp Loại Cuối Khóa

| Tổng điểm | Xếp loại | Quyền hạn sau sát hạch |
| :--- | :--- | :--- |
| **90 - 100 điểm** | **XUẤT SẮC** | Cấp tài khoản chính thức, vận hành độc lập không cần người kèm cặp. |
| **75 - 89 điểm** | **ĐẠT YÊU CẦU** | Cấp tài khoản chính thức, có tổ trưởng/kế toán trưởng hỗ trợ rà soát tuần đầu. |
| **Dưới 75 điểm** | **CHƯA ĐẠT** | Thực hành lại trên Sandbox 03 lần và thi lại sau 48 giờ. |

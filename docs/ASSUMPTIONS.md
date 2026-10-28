# TÀI LIỆU CÁC GIẢ ĐỊNH VẬN HÀNH (ASSUMPTIONS.md)

Tài liệu này ghi nhận các giả định ban đầu phục vụ thiết kế hệ thống trong giai đoạn khảo sát G0. Khi khách hàng làm rõ các câu hỏi mở, tài liệu này sẽ được cập nhật tương ứng.

## 1. Giả định về Ngành nghề & Đặc thù Sản xuất
- **Lĩnh vực cốt lõi**: Sản xuất gia công cơ khí, nội thất, kết cấu thép, quảng cáo hoặc sản phẩm xây lắp theo đơn hàng riêng lẻ (make-to-order / project-based manufacturing).
- **Quy mô điển hình**: Doanh nghiệp SME (từ 20 đến 150 nhân sự), có 1 văn phòng điều hành và 1-2 xưởng sản xuất kèm kho vật tư.
- **Đơn vị đo lường**: Hệ mét tiêu chuẩn (mm, m, m2, m3, kg, tấn, chiếc, bộ, mét dài).
- **Tiền tệ**: Việt Nam Đồng (VND), làm tròn đến hàng đơn vị nguyên.

## 2. Giả định về Định dạng Dữ liệu Đầu vào
- **Bản vẽ kỹ thuật**:
  - Tệp 2D CAD: Định dạng DXF (AutoCAD R12 đến 2018), tệp DWG (sẽ được chuyển đổi nội bộ thành DXF qua công cụ tiện ích).
  - Bản vẽ PDF: Bản vẽ vector xuất từ CAD (có text/đường nét trích xuất được) và bản vẽ scan/ảnh (yêu cầu OCR + Vision model).
- **Phiếu kho / Hóa đơn**:
  - Ảnh chụp từ điện thoại chụp phiếu giao hàng của nhà cung cấp (chữ in kim, hóa đơn VAT hoặc phiếu viết tay có kẻ ô).
- **Báo cáo của công nhân/tổ trưởng**:
  - Tin nhắn gõ nhanh trên điện thoại hoặc tin nhắn thoại (audio note) tiếng Việt có dấu/không dấu, có tiếng lóng nghề nghiệp (ví dụ: "cắt xong 20 cây V5", "sơn xong mớ chân bàn").

## 3. Giả định về Môi trường & Hạ tầng Kỹ thuật
- **Thiết bị người dùng**:
  - Giám đốc, Kỹ thuật, Kinh doanh, Kế toán: Máy tính để bàn / Laptop có trình duyệt Chrome, Cốc Cốc, Edge.
  - Tổ trưởng, Quản đốc, Thủ kho, Thi công: Điện thoại thông minh Android/iOS phổ thông, kết nối mạng 4G/Wifi xưởng.
- **Hạ tầng máy chủ**:
  - Máy chủ nội bộ tại xưởng hoặc VPS đám mây chạy hệ điều hành Linux (Ubuntu 22.04+) hỗ trợ Docker & Docker Compose.
- **Kênh Chatbot**:
  - Giai đoạn đầu sử dụng Telegram Bot (do API mở, miễn phí, hỗ trợ gửi tệp/ảnh/âm thanh dung lượng lớn và thiết lập webhook tức thì).
  - Kiến trúc backend xây dựng cổng kết nối trừu tượng (Adapter Pattern) sẵn sàng đấu nối Zalo Official Account (Zalo OA) khi doanh nghiệp đăng ký tài khoản doanh nghiệp được xác thực.

## 4. Giả định về Kết nối Kế toán & Hệ thống Bên ngoài
- Giai đoạn 1-5 không can thiệp API trực tiếp vào phần mềm kế toán (như MISA, Fast) để tránh rủi ro bảo mật tài chính.
- Hệ thống hỗ trợ cấu trúc dữ liệu xuất bản (export) và nhập liệu (import) theo định dạng bảng tính Excel chuẩn xác 100% với cột mã tương thích của các phần mềm kế toán phổ biến.

# TÀI LIỆU QUYẾT ĐỊNH KIẾN TRÚC (DECISIONS.md)

## ADR 001: Kiến trúc hệ thống Modular Monolith
- **Bối cảnh**: Doanh nghiệp sản xuất theo đơn hàng vừa và nhỏ cần triển khai nhanh, vận hành ổn định, dễ sao lưu và bảo trì bởi đội ngũ nhỏ (thậm chí 1 người không chuyên).
- **Quyết định**: Sử dụng kiến trúc Modular Monolith:
  - Backend: Python 3.11+ với FastAPI (xử lý async cao, OpenAPI tự sinh, Pydantic validation chặt chẽ).
  - Background Worker: Celery + Redis hoặc APScheduler tích hợp phục vụ tổng hợp báo cáo định kỳ, xử lý OCR/CAD nền.
  - Frontend: Next.js (TypeScript) + Tailwind CSS theo chuẩn PWA (Progressive Web App) tối ưu hóa giao diện di động.
  - Cơ sở dữ liệu: PostgreSQL 16+ tích hợp `pgvector` phục vụ tìm kiếm ngữ nghĩa dự án, tài liệu và quy chuẩn.
  - Lưu trữ tệp: MinIO (tương thích S3 API), lưu trữ bản vẽ, phiếu kho, ảnh nghiệm thu.
- **Hệ quả**: Triển khai `docker-compose` 1 lệnh, không phức tạp hóa microservices, dễ dàng truy vết giao dịch và bảo toàn dữ liệu.

---

## ADR 002: Đa kênh tương tác (Dual-channel UI)
- **Bối cảnh**: Công nhân, tổ trưởng, thủ kho không rành công nghệ, tay lấm dầu mỡ hoặc đang ở công trường, khó mở máy tính hay thao tác biểu mẫu phức tạp.
- **Quyết định**: 
  - Kênh 1: Ứng dụng Web Responsive (PWA) hỗ trợ cài đặt icon lên màn hình điện thoại (Mobile First) cho thao tác nghiệp vụ, xem báo cáo, duyệt lệnh.
  - Kênh 2: Chatbot Bot Adapter (Telegram bot trước, Zalo OA sau) để nhận tin nhắn giọng nói, ảnh chụp phiếu, báo cáo ca tự nhiên.
- **Hệ quả**: Đạt quy tắc 3 chạm và dưới 1 phút cho các tác vụ hiện trường.

---

## ADR 003: Phân cấp quyền tự động hóa AI 3 mức & Công tắc ngắt khẩn cấp (Emergency Kill-Switch)
- **Bối cảnh**: AI có xác suất ảo giác; các thao tác liên quan đến tiền bạc, định mức và vật tư nếu tự động hóa hoàn toàn sẽ gây rủi ro kinh doanh nghiêm trọng.
- **Quyết định**:
  - Mức 1 (Gợi ý): AI chỉ phân tích và đề xuất phương án (mặc định cho Bóc tách BOQ, Báo giá, Dự toán).
  - Mức 2 (Làm rồi duyệt): AI tạo đầy đủ bản ghi nháp, người có thẩm quyền bấm "Duyệt" mới có hiệu lực pháp lý/kho (Phiếu nhập/xuất, Lệnh sản xuất).
  - Mức 3 (Tự chạy): Chỉ áp dụng cho các tác vụ không tác động số dư tiền/kho (Tổng hợp báo cáo sáng/chiều, nhắc việc quá hạn, cảnh báo rủi ro).
  - Từng chức năng có công tắc (Kill-Switch) trong Admin: nếu tắt, hệ thống chuyển tức thì sang nhập liệu thủ công truyền thống.

---

## ADR 004: Truy vết nguồn gốc tuyệt đối (Provenance) và Điểm tin cậy (Confidence Score)
- **Bối cảnh**: Người duyệt cần biết tại sao AI đưa ra con số này và kiểm tra nhanh trong vài giây thay vì phải rà lại toàn bộ hồ sơ.
- **Quyết định**:
  - Mọi trường dữ liệu do AI trích xuất phải gắn `source_ref` (tên file, số trang, tọa độ bounding box trên PDF/ảnh, hoặc layer/handle trên DXF).
  - Hiển thị trực quan: Cạnh số liệu có nút "Xem nguồn" (mở đúng vị trí trên bản vẽ/phiếu gốc) kèm huy hiệu màu:
    - Xanh (Tin cậy cao >= 90%): Kiểm tra lướt.
    - Vàng (Tin cậy vừa 70-89%): Cần đối chiếu kỹ.
    - Đỏ / Cảnh báo (< 70% hoặc thiếu dữ liệu): Bắt buộc người xác nhận thủ công.

---

## ADR 005: Lớp trừu tượng hóa mô hình AI (Agnostic AI Provider)
- **Bối cảnh**: Chi phí API biến động, chính sách nhà cung cấp thay đổi hoặc doanh nghiệp muốn chuyển đổi linh hoạt giữa OpenAI, Anthropic, Gemini, DeepSeek hoặc Local Ollama.
- **Quyết định**:
  - Xây dựng module `packages/ai` với giao diện thống nhất `LLMProvider`.
  - Toàn bộ output AI bắt buộc serialize qua Pydantic Model với JSON Schema nghiêm ngặt.
  - Cơ chế tự động retry với prompt sửa lỗi khi schema vi phạm; nếu thất bại sau 2 lần -> trả về trạng thái "Cần hỗ trợ nhập tay" kèm câu hỏi cần làm rõ.

---

## ADR 006: Kiểm soát chi phí AI và An toàn thông tin
- **Bối cảnh**: Tránh phát sinh chi phí vô tội vạ hoặc lộ dữ liệu khách hàng nhạy cảm.
- **Quyết định**:
  - Thiết lập bảng `ai_settings` lưu hạn mức ngân sách tháng (USD/VND).
  - Hệ thống tự động gửi cảnh báo cho Giám đốc & Admin khi đạt ngưỡng 80% ngân sách.
  - Bộ lọc dữ liệu trước khi gửi đến API bên ngoài: ẩn thông tin cá nhân khách hàng (số điện thoại, email) khi chỉ bóc tách kỹ thuật.

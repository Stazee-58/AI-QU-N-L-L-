from typing import Dict, Any, Optional
from packages.ai.log_parser import parse_production_message
from app.schemas.production import ParsedProductionLog

class TelegramBotAdapter:
    """
    Adapter xử lý tin nhắn từ Telegram Bot cho Tổ trưởng xưởng.
    Hỗ trợ tin nhắn văn bản, ảnh chụp tiến độ và tin nhắn thoại (voice note).
    Kiến trúc thiết kế sẵn sàng đấu nối Zalo OA mà không cần đổi core logic.
    """

    def __init__(self, bot_token: Optional[str] = None):
        self.bot_token = bot_token

    def handle_incoming_message(
        self,
        chat_id: str,
        sender_name: str,
        text: Optional[str] = None,
        voice_file_id: Optional[str] = None,
        photo_file_ids: Optional[list] = None
    ) -> Dict[str, Any]:
        """
        Nhận tin nhắn tự do từ Telegram, gọi parser chuẩn hóa và trả về phản hồi tương tác 3 chạm.
        """
        raw_content = text or ""
        # Giả lập giải mã voice note thành text nếu người dùng gửi tin nhắn thoại
        if voice_file_id and not text:
            raw_content = "Tổ 1 cắt xong 40 cây V5 dự án Cậu Long có 4 thợ"

        parsed: ParsedProductionLog = parse_production_message(raw_content)

        # Trường hợp 1: Thiếu thông tin quan trọng -> HỎI LẠI
        if parsed.needs_clarification:
            return {
                "chat_id": chat_id,
                "response_type": "CLARIFICATION_REQUIRED",
                "message": f"🤖 Chào anh {sender_name},\n\n{parsed.clarification_question}",
                "parsed_partial": parsed.model_dump(),
                "quick_replies": [
                    "Dự án Cậu Long (LSX-001)",
                    "Dự án Tân Bình (LSX-002)",
                    "Dự án Riverside (LSX-003)"
                ]
            }

        # Trường hợp 2: Đầy đủ thông tin -> Trả về thẻ xem trước kèm nút bấm Xác nhận 1 chạm
        status_color = "🟢 Tin cậy cao" if parsed.confidence_score >= 0.9 else "🟡 Cần kiểm tra"
        summary_msg = (
            f"📋 **XÁC NHẬN BÁO CÁO CA SẢN XUẤT**\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"• **Lệnh SX**: `{parsed.work_order_code or 'LSX-2026-001'}`\n"
            f"• **Công đoạn**: {parsed.stage_name}\n"
            f"• **Sản lượng**: **{parsed.completed_qty} {parsed.unit}**\n"
            f"• **Nhân sự**: {parsed.worker_count} thợ ({parsed.total_man_hours} giờ công)\n"
            f"• **Sự cố ghi nhận**: {parsed.issues_reported or 'Không có'}\n"
            f"• **Độ tin cậy AI**: {int(parsed.confidence_score * 100)}% ({status_color})\n"
            f"━━━━━━━━━━━━━━━━━━━\n"
            f"👉 Anh bấm nút bên dưới để gửi báo cáo về hệ thống điều hành."
        )

        return {
            "chat_id": chat_id,
            "response_type": "READY_TO_CONFIRM",
            "message": summary_msg,
            "parsed_data": parsed.model_dump(),
            "inline_buttons": [
                {"text": "✅ XÁC NHẬN GỬI CA (1 CHẠM)", "callback_data": "CONFIRM_LOG"},
                {"text": "✏️ SỬA LẠI", "callback_data": "EDIT_LOG"}
            ]
        }

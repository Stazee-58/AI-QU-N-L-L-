'use client';
import React from 'react';
import { HelpCircle, X, CheckCircle2, AlertTriangle, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
}

export default function HelpModal({ isOpen, onClose, activeTab }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: 'var(--accent)' }}>
              <HelpCircle size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Sổ tay Hướng dẫn Nhanh</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quy trình vận hành 1 tuần cho người mới</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'users' && (
            <div>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} /> Hướng dẫn Quản lý Người dùng & Phân quyền
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <li><b>Tạo tài khoản:</b> Bấm nút "Thêm người dùng", nhập tên, số điện thoại và chọn vai trò tương ứng.</li>
                <li><b>8 Vai trò nghiệp vụ:</b> Giám đốc, Quản trị viên, Kinh doanh, Kỹ thuật, Tổ trưởng xưởng, Thủ kho, Thi công, Kế toán.</li>
                <li><b>Khóa tài khoản:</b> Bấm "Khóa" nếu nhân sự nghỉ việc hoặc đổi bộ phận; tài khoản bị khóa không thể đăng nhập.</li>
              </ul>
            </div>
          )}

          {activeTab === 'materials' && (
            <div>
              <h4 style={{ color: '#34d399', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSpreadsheet size={18} /> Hướng dẫn Quản lý Vật tư & Nhập Excel
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <li><b>Tải tệp mẫu:</b> Luôn bấm "Tải file mẫu Excel" trước để đảm bảo đúng định dạng cột tiếng Việt.</li>
                <li><b>Nhập hàng loạt:</b> Chọn tệp Excel/CSV và tải lên. Hệ thống tự động kiểm tra lỗi từng dòng.</li>
                <li><b>Báo lỗi tiếng Việt:</b> Nếu có dòng bị thiếu mã, thiếu tên hoặc đơn giá âm, bảng lỗi sẽ chỉ rõ số dòng để bạn sửa trên Excel rồi tải lại.</li>
                <li><b>Sửa trực tiếp:</b> Bấm nút "Sửa" ở từng dòng để cập nhật đơn giá chuẩn hoặc định mức tồn kho an toàn.</li>
              </ul>
            </div>
          )}

          {activeTab === 'ai_settings' && (
            <div>
              <h4 style={{ color: '#fbbf24', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} /> 3 Mức Quyền AI & Công tắc Ngắt Khẩn Cấp
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <li><b>Mức 1 (Gợi ý):</b> AI chỉ phân tích và đề xuất (áp dụng cho Báo giá và Bóc tách bản vẽ BOQ).</li>
                <li><b>Mức 2 (Làm rồi duyệt):</b> AI làm hoàn thiện bản ghi, người có thẩm quyền bấm duyệt mới có hiệu lực.</li>
                <li><b>Mức 3 (Tự chạy):</b> Chỉ dành cho việc không đụng đến tiền/vật tư (báo cáo sáng 1 trang, nhắc việc).</li>
                <li><b>Công tắc ngắt khẩn cấp:</b> Nếu phát hiện AI chạy sai hoặc mạng chập chờn, gạt công tắc sang TẮT. Hệ thống sẽ ngay lập tức quay về nhập tay thủ công mà không gián đoạn xưởng.</li>
              </ul>
            </div>
          )}

          {activeTab === 'ai_audit' && (
            <div>
              <h4 style={{ color: 'var(--accent)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={18} /> Nhật ký Bất biến & Đối soát AI
              </h4>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                <li><b>Tính bất biến:</b> Bảng nhật ký này chỉ ghi thêm (append-only), không ai (kể cả admin) được quyền xóa hay sửa để bảo đảm minh bạch.</li>
                <li><b>Độ tin cậy:</b> Màu Xanh (≥90%), Vàng (70-89%), Đỏ (&lt;70%).</li>
                <li><b>Đối soát sửa đổi:</b> Cột "Người có sửa" cho biết nhân viên thực tế có phải sửa số liệu AI gợi ý hay không, giúp đo lường mức độ tin cậy của AI theo thời gian.</li>
              </ul>
            </div>
          )}

          <div style={{ background: 'var(--raised)', padding: '14px 18px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--muted)' }}>
            <b>Mẹo vận hành:</b> Mục tiêu của hệ thống là người mới tự làm được sau 30 phút hướng dẫn. Mọi thao tác hằng ngày được tối ưu dưới 3 chạm và dưới 1 phút.
          </div>
        </div>

        <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>Đã hiểu, đóng hướng dẫn</button>
        </div>
      </div>
    </div>
  );
}

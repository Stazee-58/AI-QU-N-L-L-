'use client';
import React, { useState } from 'react';
import { 
  Mic, Camera, AlertTriangle, ClipboardList, CheckCircle2, 
  Send, X, Sparkles, MessageSquare, ArrowLeft, Clock
} from 'lucide-react';

interface ForemanMobileViewProps {
  token: string;
  onClose?: () => void;
  onLogSubmitted?: () => void;
}

export default function ForemanMobileView({ token, onClose, onLogSubmitted }: ForemanMobileViewProps) {
  const [step, setStep] = useState<'HOME' | 'INPUT' | 'CONFIRM' | 'SUCCESS'>('HOME');
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [clarificationAnswer, setClarificationAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeIssue, setActiveIssue] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Chạm 1: Chọn mẫu báo nhanh hoặc nhập tin nhắn tự do
  const handleQuickPreset = (text: string) => {
    setRawText(text);
    handleParse(text);
  };

  const handleParse = async (overrideText?: string) => {
    const textToParse = overrideText || rawText;
    if (!textToParse.trim()) return;

    setIsParsing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/production/parse-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ raw_text: textToParse })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedData(data);
        setStep('CONFIRM');
      }
    } catch (err) {
      alert('Lỗi kết nối khi trích xuất tin nhắn.');
    } finally {
      setIsParsing(false);
    }
  };

  // Trả lời câu hỏi làm rõ của AI
  const handleAnswerClarification = (answer: string) => {
    const combined = `${rawText} ${answer}`;
    setRawText(combined);
    handleParse(combined);
  };

  // Chạm 3: Xác nhận gửi ca (1 chạm)
  const handleConfirmLog = async () => {
    if (!parsedData) return;
    setIsSubmitting(true);

    try {
      const payload = {
        work_order_id: parsedData.matched_work_order_id || 'default',
        project_id: parsedData.matched_project_id || 'default',
        stage_name: parsedData.stage_name,
        completed_qty: parsedData.completed_qty,
        worker_count: parsedData.worker_count,
        total_man_hours: parsedData.total_man_hours,
        issues_reported: parsedData.issues_reported,
        raw_message: rawText,
        ai_confidence: parsedData.confidence_score
      };

      const res = await fetch(`${API_BASE}/api/v1/production/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStep('SUCCESS');
        if (onLogSubmitted) onLogSubmitted();
      }
    } catch (err) {
      alert('Không thể lưu báo cáo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      maxWidth: '420px',
      margin: '0 auto',
      background: '#0d111a',
      borderRadius: '24px',
      border: '2px solid rgba(255, 255, 255, 0.1)',
      overflow: 'hidden',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '620px'
    }}>
      {/* Mobile Top Bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {step !== 'HOME' && (
            <button 
              onClick={() => setStep('HOME')} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f8fafc' }}>MÀN HÌNH TỔ TRƯỞNG</p>
            <p style={{ fontSize: '0.7rem', color: '#38bdf8' }}>Ca ngày 28/10 • Xưởng Cơ khí 1</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* MÀN HÌNH CHÍNH (4 NÚT LỚN CẢM ỨNG) */}
      {step === 'HOME' && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <div style={{ 
            background: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)', 
            padding: '12px 16px', 
            borderRadius: '14px' 
          }}>
            <p style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>VIỆC CẦN LÀM HÔM NAY:</p>
            <p style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>
              • LSX-001 (Dự án Cậu Long): Cắt & Sơn 4 bộ cổng
            </p>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Quy tắc 3 chạm • Xong dưới 45 giây
          </p>

          {/* 4 Nút Lớn */}
          <button 
            onClick={() => setStep('INPUT')}
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '16px',
              padding: '18px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '10px', borderRadius: '12px' }}>
              <Mic size={24} />
            </div>
            <div>
              <p style={{ fontSize: '1rem', fontWeight: 800 }}>1. BÁO CÁO CA NHANH</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Nói hoặc nhắn tin tự do (AI tự điền)</p>
            </div>
          </button>

          <button 
            onClick={() => handleQuickPreset('to 1 cat xog 40c v5 da long 4 tho')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '10px', borderRadius: '12px' }}>
              <Sparkles size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>Mẫu thử: "Cắt xong 40 cây V5"</p>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Bấm thử luồng 3 chạm siêu tốc</p>
            </div>
          </button>

          <button 
            onClick={() => handleQuickPreset('Chieu nay may cat bi ket luoi to 3 tho da long')}
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              color: '#fb7185',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '10px', borderRadius: '12px' }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>2. BÁO SỰ CỐ / THIẾU VẬT TƯ</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Báo ngay cho Kỹ thuật & Kho xử lý</p>
            </div>
          </button>

          <button 
            onClick={() => alert('Danh sách việc ngày mai: Hàn 4 bộ khung cổng và nhận phôi thép V50')}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <ClipboardList size={20} style={{ color: '#60a5fa' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>3. Xem việc ngày mai</span>
          </button>
        </div>
      )}

      {/* CHẠM 1: NHẬP TIN NHẮN TỰ DO / NÓI */}
      {step === 'INPUT' && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
            Nhắn tin tự nhiên như trên Zalo/Telegram:
          </p>
          <textarea 
            className="form-input" 
            rows={4}
            value={rawText} 
            onChange={(e) => setRawText(e.target.value)}
            placeholder="vd: to 1 cat xog 40c thep v5 da cau long co 4 tho..."
            style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={() => setRawText('to 1 cat xog 40c v5 d/a long 4 tho tang ca 2 tieng')}
            >
              Gợi ý 1
            </button>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
              onClick={() => setRawText('to 2 han xong 12 bo khung cua da biet thu to 3 nguoi')}
            >
              Gợi ý 2
            </button>
          </div>

          <button 
            className="btn-primary" 
            style={{ justifyContent: 'center', padding: '14px', marginTop: 'auto' }}
            onClick={() => handleParse()}
            disabled={!rawText.trim() || isParsing}
          >
            {isParsing ? 'AI đang bóc tách...' : 'Tiếp tục (Xem lại) →'}
          </button>
        </div>
      )}

      {/* CHẠM 2: AI HIỂN THỊ XEM TRƯỚC HOẶC HỎI LẠI */}
      {step === 'CONFIRM' && parsedData && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {parsedData.needs_clarification ? (
            /* TRƯỜNG HỢP THIẾU THÔNG TIN -> HỎI LẠI */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                background: 'rgba(245, 158, 11, 0.12)', 
                border: '1px solid rgba(245, 158, 11, 0.3)', 
                padding: '16px', 
                borderRadius: '16px' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontWeight: 700, marginBottom: '6px' }}>
                  <MessageSquare size={18} /> AI Cần hỏi lại:
                </div>
                <p style={{ fontSize: '0.9rem', color: '#f8fafc', lineHeight: '1.5' }}>
                  {parsedData.clarification_question}
                </p>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chọn nhanh câu trả lời:</p>
              <button 
                className="btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => handleAnswerClarification('Dự án Cậu Long LSX-001')}
              >
                👉 Dự án Cậu Long (LSX-2026-001)
              </button>
              <button 
                className="btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => handleAnswerClarification('Công đoạn Cắt thép')}
              >
                👉 Công đoạn Cắt thép
              </button>
              <button 
                className="btn-secondary" 
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                onClick={() => handleAnswerClarification('Số lượng 30 cây')}
              >
                👉 Số lượng 30 cây
              </button>
            </div>
          ) : (
            /* TRƯỜNG HỢP ĐỦ THÔNG TIN -> XÁC NHẬN 1 CHẠM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                background: 'rgba(16, 185, 129, 0.1)', 
                border: '1px solid rgba(16, 185, 129, 0.3)', 
                padding: '14px 18px', 
                borderRadius: '16px' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700 }}>✓ ĐÃ TRÍCH XUẤT XONG</span>
                  <span className="badge badge-green">Tin cậy {intConfidence(parsedData.confidence_score)}%</span>
                </div>
                
                <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#f8fafc' }}>
                  <p>• <b>Lệnh SX:</b> <span style={{ color: '#38bdf8' }}>{parsedData.work_order_code || 'LSX-2026-001'}</span></p>
                  <p>• <b>Công đoạn:</b> {parsedData.stage_name}</p>
                  <p>• <b>Sản lượng:</b> <span style={{ color: '#34d399', fontWeight: 800, fontSize: '1rem' }}>{parsedData.completed_qty} {parsedData.unit}</span></p>
                  <p>• <b>Nhân sự:</b> {parsedData.worker_count} thợ ({parsedData.total_man_hours} giờ công)</p>
                  {parsedData.issues_reported && (
                    <p style={{ color: '#fb7185' }}>• <b>Sự cố:</b> {parsedData.issues_reported}</p>
                  )}
                </div>
              </div>

              {/* CHẠM 3: BẤM DUYỆT GỬI CA */}
              <button 
                className="btn-primary" 
                style={{ 
                  justifyContent: 'center', 
                  padding: '16px', 
                  fontSize: '1rem', 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)'
                }}
                onClick={handleConfirmLog}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={20} /> {isSubmitting ? 'Đang gửi...' : 'XÁC NHẬN GỬI BÁO CÁO (XONG!)'}
              </button>

              <button 
                className="btn-secondary" 
                style={{ justifyContent: 'center', padding: '10px' }}
                onClick={() => setStep('INPUT')}
              >
                Sửa lại tin nhắn
              </button>
            </div>
          )}
        </div>
      )}

      {/* HOÀN TẤT */}
      {step === 'SUCCESS' && (
        <div style={{ padding: '32px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', flex: 1, justifyContent: 'center' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '16px', borderRadius: '50%' }}>
            <CheckCircle2 size={44} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>GỬI CA THÀNH CÔNG!</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: '1.5' }}>
            Số liệu đã được cập nhật trực tiếp vào tiến độ xưởng và gửi về bảng điều hành của Quản đốc & Giám đốc.
          </p>
          <button 
            className="btn-primary" 
            style={{ marginTop: '12px' }}
            onClick={() => {
              setRawText('');
              setParsedData(null);
              setStep('HOME');
            }}
          >
            Về màn hình chính
          </button>
        </div>
      )}
    </div>
  );
}

function intConfidence(score: number): number {
  return Math.round((score || 1.0) * 100);
}

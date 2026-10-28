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
      background: 'var(--surface)',
      borderRadius: 'var(--radius-card)',
      border: '1px solid var(--border)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '580px'
    }}>
      {/* Mobile Top Bar */}
      <div style={{
        background: 'var(--raised)',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {step !== 'HOME' && (
            <button 
              onClick={() => setStep('HOME')} 
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>MÀN HÌNH TỔ TRƯỞNG</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Ca ngày 28/10 • Xưởng Cơ khí 1</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* MÀN HÌNH CHÍNH (4 NÚT LỚN CẢM ỨNG) */}
      {step === 'HOME' && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <div style={{ 
            background: 'var(--raised)', 
            border: '1px solid var(--border)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-control)' 
          }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>VIỆC CẦN LÀM HÔM NAY</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600, marginTop: '2px' }}>
              LSX-001 (Dự án Cậu Long): Cắt & Sơn 4 bộ cổng
            </p>
          </div>

          <p style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>
            Quy tắc 3 chạm • Hoàn thành dưới 45 giây
          </p>

          {/* 4 Nút Lớn */}
          <button 
            onClick={() => setStep('INPUT')}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-ink)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-control)',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', padding: '10px', borderRadius: '4px' }}>
              <Mic size={22} />
            </div>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>1. Báo cáo ca nhanh</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Nói hoặc nhắn tin tự do (AI tự điền)</p>
            </div>
          </button>

          <button 
            onClick={() => handleQuickPreset('to 1 cat xog 40c v5 da long 4 tho')}
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--control)',
              borderRadius: 'var(--radius-control)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ background: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)', padding: '10px', borderRadius: '4px' }}>
              <Sparkles size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Mẫu thử: "Cắt xong 40 cây V5"</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Bấm thử luồng 3 chạm siêu tốc</p>
            </div>
          </button>

          <button 
            onClick={() => handleQuickPreset('Chieu nay may cat bi ket luoi to 3 tho da long')}
            style={{
              background: 'var(--pill-negative-bg)',
              color: 'var(--pill-negative-ink)',
              border: '1px solid rgba(185, 28, 28, 0.25)',
              borderRadius: 'var(--radius-control)',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ padding: '10px', borderRadius: '4px', background: 'rgba(185, 28, 28, 0.1)' }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>2. Báo sự cố / thiếu vật tư</p>
              <p style={{ fontSize: '0.75rem', opacity: 0.85 }}>Báo ngay cho Kỹ thuật & Kho xử lý</p>
            </div>
          </button>

          <button 
            onClick={() => alert('Danh sách việc ngày mai: Hàn 4 bộ khung cổng và nhận phôi thép V50')}
            style={{
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-control)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer'
            }}
          >
            <ClipboardList size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>3. Xem việc ngày mai</span>
          </button>
        </div>
      )}

      {/* CHẠM 1: NHẬP TIN NHẮN TỰ DO / NÓI HOẶC CHẠM CHIPS NHANH (SỬA LỖI VƯỚNG) */}
      {step === 'INPUT' && (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
            Nhắn tin hoặc chạm nhanh các nút bên dưới:
          </p>

          {/* Chips Lệnh sản xuất đang chạy */}
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
              ⚡ 1. Chạm chọn Lệnh sản xuất:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: 'LSX-001 (Cổng nhôm)', val: 'LSX-2026-001 cổng nhôm' },
                { label: 'LSX-002 (Khung dầm)', val: 'LSX-2026-002 khung dầm thép' },
                { label: 'LSX-003 (Lan can)', val: 'LSX-2026-003 lan can inox' },
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(prev => prev ? `${prev} ${chip.val}` : `Tổ 1 làm ${chip.val}`)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--accent)',
                    background: 'var(--surface)',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  +{chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chips Công đoạn */}
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 600, display: 'block', marginBottom: '3px' }}>
              ⚡ 2. Chạm chọn Công đoạn:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['Cắt phôi xong 20c', 'Hàn xong 15 bộ', 'Sơn phủ 2 bộ', 'Lắp ráp xong 4 thợ'].map((act, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawText(prev => prev ? `${prev} ${act}` : act)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--raised)',
                    cursor: 'pointer'
                  }}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          <textarea 
            className="form-input" 
            rows={3}
            value={rawText} 
            onChange={(e) => setRawText(e.target.value)}
            placeholder="vd: to 1 cat xog 40c thep v5 da cau long co 4 tho..."
            style={{ fontSize: '0.85rem', lineHeight: '1.4' }}
            autoFocus
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.75rem' }}
              onClick={() => setRawText('to 1 cat xog 40c v5 d/a long 4 tho tang ca 2 tieng')}
            >
              Gợi ý 1
            </button>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '0.75rem' }}
              onClick={() => setRawText('to 2 han xong 12 bo khung cua da biet thu to 3 nguoi')}
            >
              Gợi ý 2
            </button>
          </div>

          <button 
            className="btn-primary" 
            style={{ justifyContent: 'center', padding: '12px', marginTop: 'auto' }}
            onClick={() => handleParse()}
            disabled={!rawText.trim() || isParsing}
          >
            {isParsing ? 'AI đang xử lý...' : 'Tiếp tục (Xem lại) →'}
          </button>
        </div>
      )}

      {/* CHẠM 2: AI TRÍCH XUẤT + HỎI LẠI (NẾU THIẾU) */}
      {step === 'CONFIRM' && parsedData && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          {/* CẢNH BÁO THIẾU TRƯỜNG & HỎI LẠI */}
          {parsedData.needs_clarification ? (
            <div style={{ 
              background: 'var(--pill-warning-bg)', 
              border: '1px solid rgba(180, 83, 9, 0.3)', 
              padding: '14px', 
              borderRadius: 'var(--radius-control)' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color="var(--pill-warning-ink)" />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--pill-warning-ink)' }}>
                  CẦN BỔ SUNG THÔNG TIN
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--pill-warning-ink)', lineHeight: '1.4' }}>
                {parsedData.clarification_question || 'Báo cáo chưa rõ mã lệnh sản xuất hoặc công đoạn.'}
              </p>

              {/* Nút bấm gợi ý trả lời nhanh */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--pill-warning-ink)', fontWeight: 600 }}>CHỌN NHANH:</p>
                <button 
                  className="btn-secondary" 
                  style={{ textAlign: 'left', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--surface)' }}
                  onClick={() => handleAnswerClarification('cho du an Cau Long')}
                >
                  • Dự án Cậu Long (LSX-001)
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ textAlign: 'left', fontSize: '0.8rem', padding: '6px 10px', background: 'var(--surface)' }}
                  onClick={() => handleAnswerClarification('cho du an Tan Binh')}
                >
                  • Dự án Tân Bình (LSX-002)
                </button>
              </div>
            </div>
          ) : (
            /* ĐỦ TRƯỜNG - HIỂN THỊ ĐỂ DUYỆT */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                background: 'var(--surface)', 
                border: '1px solid var(--border)', 
                padding: '14px 16px', 
                borderRadius: 'var(--radius-control)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--positive)', fontWeight: 600 }}>ĐÃ TRÍCH XUẤT XONG</span>
                  <span className="pill pos">Tin cậy {intConfidence(parsedData.confidence_score)}%</span>
                </div>
                
                <div style={{ fontSize: '0.875rem', lineHeight: '1.8', color: 'var(--text)' }}>
                  <p>• <b>Lệnh SX:</b> <span className="mono" style={{ color: 'var(--accent)' }}>{parsedData.work_order_code || 'LSX-2026-001'}</span></p>
                  <p>• <b>Công đoạn:</b> {parsedData.stage_name}</p>
                  <p>• <b>Sản lượng:</b> <span className="mono" style={{ color: 'var(--positive)', fontWeight: 600 }}>{parsedData.completed_qty} {parsedData.unit}</span></p>
                  <p>• <b>Nhân sự:</b> <span className="mono">{parsedData.worker_count}</span> thợ (<span className="mono">{parsedData.total_man_hours}</span> giờ công)</p>
                  {parsedData.issues_reported && (
                    <p style={{ color: 'var(--negative)' }}>• <b>Sự cố:</b> {parsedData.issues_reported}</p>
                  )}
                </div>
              </div>

              {/* CHẠM 3: BẤM DUYỆT GỬI CA */}
              <button 
                className="btn-primary" 
                style={{ 
                  justifyContent: 'center', 
                  padding: '14px', 
                  fontSize: '0.95rem'
                }}
                onClick={handleConfirmLog}
                disabled={isSubmitting}
              >
                <CheckCircle2 size={18} /> {isSubmitting ? 'Đang gửi...' : 'Xác nhận gửi báo cáo (Hoàn tất)'}
              </button>

              <button 
                className="btn-secondary" 
                style={{ justifyContent: 'center', padding: '8px', fontSize: '0.8rem' }}
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
          <div style={{ background: 'var(--pill-positive-bg)', color: 'var(--pill-positive-ink)', padding: '16px', borderRadius: '50%' }}>
            <CheckCircle2 size={40} />
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>GỬI CA THÀNH CÔNG</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: '1.5' }}>
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

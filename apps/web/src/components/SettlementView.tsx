'use client';
import React, { useState, useEffect } from 'react';
import { 
  FileCheck2, DollarSign, AlertTriangle, CheckCircle2, TrendingUp, 
  Download, Eye, Lock, ArrowRight, ShieldCheck, X, RefreshCw, UserCheck
} from 'lucide-react';

interface SettlementViewProps {
  token: string;
  currentUser: any;
}

export default function SettlementView({ token, currentUser }: SettlementViewProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [settlements, setSettlements] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [currentSettlement, setCurrentSettlement] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Form Nghiệm thu
  const [acceptanceStatus, setAcceptanceStatus] = useState('ACCEPTED');
  const [acceptanceNotes, setAcceptanceNotes] = useState('Nghiệm thu đạt tiêu chuẩn kích thước và bề mặt sơn. Bàn giao khách hàng sử dụng.');
  const [amountPaidInput, setAmountPaidInput] = useState<number>(0);
  const [activeEvidence, setActiveEvidence] = useState<any | null>(null);

  useEffect(() => {
    loadSettlements();
  }, [token]);

  const loadSettlements = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/settlements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettlements(data);
        if (data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(data[0].project_id);
          setCurrentSettlement(data[0]);
          setAmountPaidInput(data[0].amount_paid);
        } else if (selectedProjectId) {
          const match = data.find((d: any) => d.project_id === selectedProjectId);
          if (match) {
            setCurrentSettlement(match);
            setAmountPaidInput(match.amount_paid);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    const match = settlements.find(s => s.project_id === projectId);
    if (match) {
      setCurrentSettlement(match);
      setAmountPaidInput(match.amount_paid);
    }
  };

  const handleFinalize = async () => {
    if (!currentSettlement) return;
    if (!confirm(`Xác nhận Khóa sổ quyết toán và Chốt nghiệm thu dự án ${currentSettlement.project_code}? Dữ liệu sau khi khóa sẽ được lưu bất biến.`)) return;

    setIsFinalizing(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/settlements/${currentSettlement.project_id}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          acceptance_status: acceptanceStatus,
          acceptance_date: new Date().toISOString().split('T')[0],
          acceptance_notes: acceptanceNotes,
          amount_paid: amountPaidInput
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể chốt nghiệm thu.');
      }

      alert('Đã chốt nghiệm thu & khóa sổ quyết toán thành công!');
      loadSettlements();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsFinalizing(false);
    }
  };

  const handleExportStatement = async () => {
    if (!currentSettlement) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/settlements/${currentSettlement.project_id}/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const exportData = await res.json();
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `QuyetToan_${currentSettlement.project_code}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      alert('Không thể xuất hồ sơ quyết toán.');
    }
  };

  const formatVND = (v: number) => Math.round(v).toLocaleString('vi-VN') + ' đ';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileCheck2 size={22} style={{ color: 'var(--accent)' }} /> Quyết Toán Dự Án & Nghiệm Thu Bàn Giao (G5)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Đối soát chi phí thực tế (Kho PXK + Ca xưởng) vs Định mức BOM • Tính lãi gộp • Khóa sổ nghiệm thu
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={loadSettlements} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            <RefreshCw size={14} /> Làm mới
          </button>
          {currentSettlement && (
            <button onClick={handleExportStatement} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
              <Download size={14} /> Xuất Báo Cáo Quyết Toán
            </button>
          )}
        </div>
      </div>

      {/* Tabs chọn Dự án */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {settlements.map((s) => {
          const isSelected = s.project_id === selectedProjectId;
          const isFinal = s.status === 'FINALIZED';

          return (
            <div
              key={s.project_id}
              onClick={() => handleSelectProject(s.project_id)}
              style={{
                background: isSelected ? 'var(--surface)' : 'var(--raised)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '12px 16px',
                cursor: 'pointer',
                minWidth: '220px',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: isSelected ? 'var(--accent)' : 'var(--text)' }}>
                  {s.project_code}
                </span>
                <span className={isFinal ? 'pill pos' : 'pill warn'} style={{ fontSize: '0.65rem' }}>
                  {isFinal ? 'ĐÃ KHÓA SỔ' : 'DỰ THẢO'}
                </span>
              </div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {s.project_name}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                Khách: {s.customer_name}
              </p>
            </div>
          );
        })}
      </div>

      {currentSettlement && (
        <div>
          {/* Cảnh báo nếu có chênh lệch / vượt định mức */}
          {currentSettlement.warnings && currentSettlement.warnings.length > 0 && (
            <div style={{
              background: 'var(--pill-warning-bg)',
              border: '1px solid var(--warning)',
              color: 'var(--pill-warning-ink)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-card)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <AlertTriangle size={22} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Cảnh báo Chênh lệch Dự toán & Lợi nhuận:</p>
                <ul style={{ margin: '4px 0 0 16px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  {currentSettlement.warnings.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 5 Thẻ KPI Tài chính Quyết toán */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            {/* Doanh thu hợp đồng */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Doanh Thu Hợp Đồng</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                {formatVND(currentSettlement.contract_value)}
              </p>
              <span className="pill neutral" style={{ fontSize: '0.65rem', marginTop: '6px' }}>Giá trị ký kết 100%</span>
            </div>

            {/* Chi phí Vật tư thực tế */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Chi Phí Vật Tư Thực Tế</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                {formatVND(currentSettlement.actual_material_cost)}
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--faint)', display: 'block', marginTop: '4px' }}>
                Xuất kho PXK đối soát BOM
              </span>
            </div>

            {/* Chi phí Nhân công thực tế */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Chi Phí Nhân Công & Ca</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                {formatVND(currentSettlement.actual_labor_cost)}
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--faint)', display: 'block', marginTop: '4px' }}>
                Tổng hợp giờ công ca xưởng
              </span>
            </div>

            {/* Lãi gộp thực tế */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Lãi Gộp Thực Tế</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: currentSettlement.gross_profit > 0 ? 'var(--positive)' : 'var(--negative)', marginTop: '4px' }}>
                {formatVND(currentSettlement.gross_profit)}
              </p>
              <span className={currentSettlement.profit_margin_pct >= 20 ? 'pill pos' : 'pill warn'} style={{ fontSize: '0.65rem', marginTop: '6px' }}>
                Biên lãi: {currentSettlement.profit_margin_pct}%
              </span>
            </div>

            {/* Công nợ còn phải thu */}
            <div className="card" style={{ padding: '16px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Công Nợ Khách Còn Nợ</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 800, color: currentSettlement.remaining_receivable > 0 ? 'var(--warning)' : 'var(--positive)', marginTop: '4px' }}>
                {formatVND(currentSettlement.remaining_receivable)}
              </p>
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                Đã thu: {formatVND(currentSettlement.amount_paid)}
              </span>
            </div>
          </div>

          {/* Hai Bảng Đối Soát: Vật Tư & Nhân Công */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1.4fr) minmax(320px, 1fr)', gap: '18px', marginBottom: '24px' }}>
            
            {/* BẢNG 1: ĐỐI SOÁT VẬT TƯ (BOM vs THỰC XUẤT KHO) */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>1. Đối Soát Chi Phí Vật Tư (BOM vs Phiếu Xuất Kho)</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tự động phát hiện vật tư xuất vượt định mức thiết kế ban đầu</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--raised)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Vật tư</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Định mức BOM</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Thực xuất</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Chênh lệch</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Thành tiền</th>
                      <th style={{ padding: '8px' }}>Đánh giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSettlement.materials_detail.map((m: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)', background: m.is_over_budget ? '#fff1f2' : undefined }}>
                        <td style={{ padding: '8px' }}>
                          <p style={{ fontWeight: 600 }}>{m.material_code}</p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{m.material_name}</p>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>
                          {m.norm_qty} {m.unit}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                          {m.actual_issued_qty} {m.unit}
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: m.is_over_budget ? 'var(--negative)' : 'var(--positive)' }}>
                          {m.variance_qty > 0 ? `+${m.variance_qty}` : m.variance_qty} ({m.variance_pct > 0 ? `+${m.variance_pct}%` : `${m.variance_pct}%`})
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>
                          {formatVND(m.actual_cost)}
                        </td>
                        <td style={{ padding: '8px' }}>
                          {m.is_over_budget ? (
                            <span className="pill neg" style={{ fontSize: '0.65rem' }}>VƯỢT BOM</span>
                          ) : (
                            <span className="pill pos" style={{ fontSize: '0.65rem' }}>ĐẠT ĐỊNH MỨC</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BẢNG 2: ĐỐI SOÁT NHÂN CÔNG CA XƯỞNG */}
            <div className="card" style={{ padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>2. Chi Phí Giờ Công Ca Xưởng</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tổng hợp từ tin nhắn báo ca của các Tổ trưởng</p>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--raised)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>Lệnh / Công đoạn</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Số ca</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Giờ công</th>
                      <th style={{ padding: '8px', textAlign: 'right' }}>Chi phí (đ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSettlement.labor_detail.map((l: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px' }}>
                          <p style={{ fontWeight: 600 }}>{l.work_order_code}</p>
                          <span className="pill neutral" style={{ fontSize: '0.65rem' }}>{l.stage_name}</span>
                        </td>
                        <td style={{ padding: '8px', textAlign: 'right' }}>{l.shift_count} ca</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 600 }}>{l.total_man_hours} h</td>
                        <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{formatVND(l.labor_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* KHỐI BIÊN BẢN NGHIỆM THU & CHỐT KHÓA SỔ */}
          <div className="card" style={{ padding: '24px', background: currentSettlement.status === 'FINALIZED' ? 'var(--raised)' : 'var(--surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--positive)' }} />
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Biên Bản Nghiệm Thu & Khóa Sổ Quyết Toán Bàn Giao</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    Căn cứ pháp lý hoàn tất hợp đồng, ghi nhận doanh thu và bảo toàn số liệu bất biến
                  </p>
                </div>
              </div>
              <span className={currentSettlement.status === 'FINALIZED' ? 'pill pos' : 'pill warn'}>
                {currentSettlement.status === 'FINALIZED' ? 'HỒ SƠ ĐÃ KHÓA SỔ BẤT BIẾN' : 'CHỜ KÝ DUYỆT NGHIỆM THU'}
              </span>
            </div>

            {currentSettlement.status === 'FINALIZED' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', fontSize: '0.8rem' }}>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Trạng thái nghiệm thu:</span>
                  <p style={{ fontWeight: 700, color: 'var(--positive)', marginTop: '2px' }}>{currentSettlement.acceptance_status}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Ngày ký nghiệm thu:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>{currentSettlement.acceptance_date || '28/10/2026'}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Người chốt quyết toán:</span>
                  <p style={{ fontWeight: 600, marginTop: '2px' }}>{currentSettlement.finalized_by_name || currentUser.full_name}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--muted)' }}>Nội dung đánh giá bàn giao:</span>
                  <p style={{ marginTop: '2px', fontStyle: 'italic' }}>"{currentSettlement.acceptance_notes}"</p>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Đánh giá nghiệm thu:</label>
                    <select
                      value={acceptanceStatus}
                      onChange={(e) => setAcceptanceStatus(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                    >
                      <option value="ACCEPTED">ĐẠT CHUẨN 100% - BÀN GIAO KHÁCH HÀNG</option>
                      <option value="CONDITIONAL">ĐẠT CÓ ĐIỀU KIỆN (BẢO HÀNH THÊM 1 THÁNG)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số tiền khách đã thanh toán (VNĐ):</label>
                    <input
                      type="number"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(parseFloat(e.target.value) || 0)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem', fontWeight: 700 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Biên bản ý kiến khách hàng & kiểm định xưởng:</label>
                  <textarea
                    rows={2}
                    value={acceptanceNotes}
                    onChange={(e) => setAcceptanceNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={handleFinalize}
                    disabled={isFinalizing}
                    className="btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontSize: '0.85rem',
                      background: 'var(--positive)',
                      borderColor: 'var(--positive)',
                      color: '#ffffff',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Lock size={16} />
                    {isFinalizing ? 'Đang khóa sổ...' : 'Chốt Nghiệm Thu & Khóa Sổ Quyết Toán'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


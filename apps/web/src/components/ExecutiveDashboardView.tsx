'use client';
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, AlertTriangle, ShieldCheck, DollarSign, Activity, 
  Power, PhoneCall, RefreshCw, Layers, Boxes, FileSpreadsheet, CheckCircle2, 
  TrendingUp, ArrowRight
} from 'lucide-react';

interface ExecutiveDashboardProps {
  token: string;
  currentUser: any;
  onNavigateTab: (tab: any) => void;
}

export default function ExecutiveDashboardView({ token, currentUser, onNavigateTab }: ExecutiveDashboardProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [stats, setStats] = useState({
    totalProjects: 3,
    activeWorkOrders: 3,
    criticalWOCount: 1,
    warningWOCount: 1,
    totalContractValue: 1250000000,
    totalGrossProfit: 840000000,
    avgMarginPct: 67.2,
    lowStockCount: 2,
    stagnantCount: 1,
    aiMonthlySpentUsd: 12.40,
    aiBudgetUsd: 50.00
  });

  const [aiSettings, setAiSettings] = useState<any[]>([]);
  const [criticalWorkOrders, setCriticalWorkOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [token]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [wosRes, aiRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/production/work-orders`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/v1/ai-settings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (wosRes.ok) {
        const wos = await wosRes.json();
        const crits = wos.filter((w: any) => w.risk_level === 'CRITICAL' || w.risk_level === 'WARNING');
        setCriticalWorkOrders(crits);
      }

      if (aiRes.ok) {
        const aiList = await aiRes.json();
        setAiSettings(aiList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAiKillSwitch = async (featureKey: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-settings/${featureKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_enabled: !currentStatus })
      });
      if (res.ok) {
        setAiSettings(aiSettings.map(s => s.feature_key === featureKey ? { ...s, is_enabled: !currentStatus } : s));
      }
    } catch (err) {
      alert('Không thể cập nhật công tắc an toàn AI.');
    }
  };

  const formatVND = (v: number) => (v / 1000000).toFixed(0) + ' Triệu đ';

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={22} style={{ color: 'var(--accent)' }} /> Trung Tâm Điều Hành Tổng Thể Doanh Nghiệp (Executive Dashboard)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Dành cho Giám đốc & Ban Điều hành: Giám sát tức thì Tiến độ • Kho vận • Lãi gộp • An toàn AI Kill-Switch
          </p>
        </div>
        <button onClick={loadDashboardData} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          <RefreshCw size={13} /> Làm mới số liệu
        </button>
      </div>

      {/* KHỐI CẢNH BÁO NÓNG CẦN XỬ LÝ NGAY (Actionable Crisis Banner) */}
      {criticalWorkOrders.length > 0 && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #f87171',
          borderRadius: 'var(--radius-card)',
          padding: '16px 20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--negative)' }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Có {criticalWorkOrders.length} Lệnh Sản Xuất Đang Tắc Nghẽn / Quá Hạn</h3>
            </div>
            <button onClick={() => onNavigateTab('work_orders')} className="btn-secondary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
              Xem bảng tiến độ <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
            {criticalWorkOrders.map((wo) => (
              <div key={wo.id} style={{ background: '#ffffff', padding: '10px 14px', borderRadius: '4px', border: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>{wo.code} - {wo.product_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--negative)', marginTop: '2px' }}>{wo.risk_reason}</p>
                </div>
                <button 
                  onClick={() => onNavigateTab('warehouse')}
                  className="btn-primary" 
                  style={{ fontSize: '0.7rem', padding: '4px 10px', background: 'var(--negative)', borderColor: 'var(--negative)' }}
                >
                  Kiểm tra kho ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Nhóm Chỉ Số Chiến Lược Cấp Cao */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Doanh số & Lãi gộp */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--positive)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tài Chính & Lợi Nhuận Dự Án</span>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--positive)', marginTop: '4px' }}>
            {formatVND(stats.totalGrossProfit)}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px', color: 'var(--muted)' }}>
            <span>Doanh thu: {formatVND(stats.totalContractValue)}</span>
            <span style={{ fontWeight: 700, color: 'var(--positive)' }}>Biên lãi: {stats.avgMarginPct}%</span>
          </div>
        </div>

        {/* Tiến độ sản xuất */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Tiến Độ Sản Xuất Xưởng</span>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
            3 / 3 Lệnh Đang Chạy
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <span className="pill neg" style={{ fontSize: '0.65rem' }}>1 Quá hạn</span>
            <span className="pill warn" style={{ fontSize: '0.65rem' }}>1 Nguy cơ trễ</span>
            <span className="pill pos" style={{ fontSize: '0.65rem' }}>1 Đúng hạn (90%)</span>
          </div>
        </div>

        {/* Tồn kho & Đọng vốn */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid var(--warning)' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Cảnh Báo Vật Tư Kho</span>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
            2 Vật Tư Dưới An Toàn
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: '6px', color: 'var(--muted)' }}>
            <span>1 Mặt hàng tồn &gt; 45 ngày</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Cần mua: 60 cây V50</span>
          </div>
        </div>

        {/* Ngân sách AI & An toàn */}
        <div className="card" style={{ padding: '18px', borderLeft: '4px solid #6366f1' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>Chi Phí AI & Kiểm Soát</span>
          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
            ${stats.aiMonthlySpentUsd.toFixed(2)} / ${stats.aiBudgetUsd.toFixed(2)}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <span className="pill pos" style={{ fontSize: '0.65rem' }}>24.8% Hạn mức tháng</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--positive)', fontWeight: 600 }}>An toàn</span>
          </div>
        </div>

      </div>

      {/* BỐ CỤC 2 CỘT: CÔNG TẮC KHẨN CẤP AI & PHÍM TẮT ĐIỀU HÀNH */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(320px, 1fr)', gap: '20px' }}>
        
        {/* CỘT 1: BẢNG ĐIỀU KHIỂN CÔNG TẮC KHẨN CẤP AI (KILL-SWITCH OVERSIGHT) */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Power size={18} style={{ color: 'var(--negative)' }} /> Công Tắc Ngắt Khẩn Cấp AI 1-Chạm (Kill-Switch)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Quyền hạn cấp Giám đốc: Ngắt tức thì khi AI ảo giác hoặc biến động API
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {aiSettings.map((setting) => (
              <div 
                key={setting.feature_key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: setting.is_enabled ? 'var(--surface)' : '#fef2f2',
                  border: `1px solid ${setting.is_enabled ? 'var(--border)' : '#f87171'}`,
                  borderRadius: 'var(--radius-control)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{setting.feature_name}</span>
                    <span className={setting.is_enabled ? 'pill pos' : 'pill neg'} style={{ fontSize: '0.65rem' }}>
                      {setting.is_enabled ? 'ĐANG CHẠY' : 'ĐÃ NGẮT KHẨN CẤP'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Mã: <code>{setting.feature_key}</code> • Model: {setting.model_name}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleAiKillSwitch(setting.feature_key, setting.is_enabled)}
                  className={setting.is_enabled ? 'btn-secondary' : 'btn-primary'}
                  style={{
                    fontSize: '0.75rem',
                    padding: '6px 12px',
                    color: setting.is_enabled ? 'var(--negative)' : '#ffffff',
                    borderColor: setting.is_enabled ? 'var(--negative)' : undefined,
                    background: setting.is_enabled ? 'transparent' : 'var(--positive)'
                  }}
                >
                  <Power size={13} style={{ marginRight: '4px' }} />
                  {setting.is_enabled ? 'Ngắt khẩn cấp' : 'Khôi phục bật'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT 2: TRUNG TÂM PHÍM TẮT & BÀN GIAO ĐÀO TẠO (QUICK ACTIONS) */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px' }}>
            Lối Tắt Điều Hành & Sát Hạch Người Mới
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '14px' }}>
            Truy cập trực tiếp các module nghiệp vụ và phòng thực hành Sandbox
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={() => onNavigateTab('sandbox')}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--accent)', borderColor: 'var(--accent)' }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>Phòng Thực Hành Sandbox (G6)</p>
                <p style={{ fontSize: '0.7rem', opacity: 0.9 }}>Bộ bài tập tự động chấm điểm cho nhân viên mới</p>
              </div>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => onNavigateTab('settlements')}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Quyết toán & Biên bản nghiệm thu (G5)</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Khóa sổ hợp đồng và đối chiếu lãi gộp</p>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('warehouse')}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Quét phiếu kho OCR & Gợi ý mua hàng (G3)</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Xử lý hóa đơn trong &le; 3 thao tác</p>
              </div>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => onNavigateTab('daily_reports')}
              className="btn-secondary"
              style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
            >
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Xem 3 Báo cáo Điều hành hôm nay (G2)</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Bản Giám đốc • Bản Kỹ thuật • Bản Kinh doanh</p>
              </div>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { 
  Camera, Upload, FileText, CheckCircle2, AlertTriangle, AlertOctagon, 
  ArrowRight, Search, Plus, RefreshCw, Phone, Eye, ShoppingCart, 
  Truck, X, Layers, Boxes, Database, ShieldAlert, Sparkles, Check
} from 'lucide-react';

interface WarehouseViewProps {
  token: string;
  currentUser: any;
  materialsCatalog: any[];
}

export default function WarehouseView({ token, currentUser, materialsCatalog }: WarehouseViewProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'ocr_scan' | 'manual_entry' | 'alerts_suggestions' | 'transactions_log'>('ocr_scan');

  // OCR Wizard State
  const [ocrStep, setOcrStep] = useState<'SELECT' | 'CONFIRM' | 'SUCCESS'>('SELECT');
  const [isScanning, setIsScanning] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);

  // Raw OCR & Parsed receipt
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number | null>(null);
  const [customOcrText, setCustomOcrText] = useState('');
  const [parsedReceipt, setParsedReceipt] = useState<any>(null);
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [createdTxResult, setCreatedTxResult] = useState<any[]>([]);

  // Alerts & Purchase Suggestions
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  // Evidence modal for 'Xem nguồn'
  const [activeEvidence, setActiveEvidence] = useState<any | null>(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    tx_type: 'IN',
    material_code: materialsCatalog[0]?.code || 'VT-THEP-V50',
    quantity: 10,
    unit_price: 245000,
    partner_name: 'Đại lý Kim khí Hà Nội',
    receipt_no: 'TAY-001',
    project_id: '',
    notes: 'Nhập tay theo thủ tục kho'
  });
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  // Real-world Presets for Warehouse Staff (Thao tác 1: chọn là xong)
  const PRESET_RECEIPTS = [
    {
      title: 'Hóa đơn GTGT Thép V50 (Hòa Phát)',
      desc: 'HĐ-88219 | 50 Cây | Khớp Đơn mua PO-2026-001 & Dự án DA-2026-002',
      badge: 'Bình thường (Độ tin cậy 95%)',
      badgeClass: 'pill pos',
      rawText: "HÓA ĐƠN GTGT SỐ: HĐ-88219 Ngày: 25/10/2026\nĐơn vị bán: Công ty Cổ phần Thép Hòa Phát\nDự án: DA-2026-002\nĐơn mua: PO-2026-001\nTên hàng: Thép góc V50x50x5mm 50 Cây đơn giá: 240000 thành tiền: 12000000"
    },
    {
      title: 'Hóa đơn Thép V50 Giá Bất Thường (Lệch > 40%)',
      desc: 'BB-3301 | 60 Cây giá 350,000đ | Cần tô ĐỎ cảnh báo thủ kho',
      badge: 'Nghi ngờ ĐỎ (< 70%)',
      badgeClass: 'pill neg',
      rawText: "HÓA ĐƠN SỐ: BB-3301 Ngày: 22/10/2026\nĐơn vị bán: Công ty Thép Đại Nam\nThép góc V50 60 Cây đơn giá: 350000 thành tiền: 21000000"
    },
    {
      title: 'Phiếu Giao Hàng Sơn Epoxy (Jotun)',
      desc: 'PGH-4412 | 10 Thùng sơn chống gỉ | Chữ viết tay kiểm tra số lượng',
      badge: 'Kiểm tra lướt VÀNG (88%)',
      badgeClass: 'pill warn',
      rawText: "PHIẾU GIAO HÀNG SỐ: PGH-4412 Ngày: 24/10/2026\nNhà cung cấp: Công ty TNHH Sơn Jotun Việt Nam\nSơn Epoxy xám 10 Thùng đơn giá: 1200000 thành tiền: 12000000 ghi chú chữ tay"
    },
    {
      title: 'Phiếu Xuất Kho Phôi Thép Theo LSX',
      desc: 'PXK-0412 | 25 Cây thép V50 cấp cho LSX-2026-001 (Tổ Cơ khí 1)',
      badge: 'Xuất kho LSX (96%)',
      badgeClass: 'pill neutral',
      rawText: "PHIẾU XUẤT KHO SỐ: PXK-0412 Ngày: 25/10/2026\nĐơn vị nhận: Tổ Cơ khí 1 (Tổ trưởng Bình)\nLệnh sản xuất: LSX-2026-001\nDự án: DA-2026-001\nThép V50 25 Cây đơn giá: 245000 thành tiền: 6125000"
    }
  ];

  // Fetch initial data
  useEffect(() => {
    loadAlertsAndSuggestions();
    loadTransactions();
    checkAiSetting();
  }, [token]);

  const checkAiSetting = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const settings = await res.json();
        const ocrSetting = settings.find((s: any) => s.feature_key === 'INVENTORY_OCR');
        if (ocrSetting) {
          setIsAiEnabled(ocrSetting.is_enabled);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAlertsAndSuggestions = async () => {
    setIsLoadingAlerts(true);
    try {
      const [resAlerts, resSugs] = await Promise.all([
        fetch(`${API_BASE}/api/v1/inventory/alerts`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/v1/inventory/purchase-suggestions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (resAlerts.ok) setAlerts(await resAlerts.json());
      if (resSugs.ok) setSuggestions(await resSugs.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/transactions?limit=25`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setTransactions(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // THAO TÁC 1: Chọn mẫu hoặc quét ảnh -> Trích xuất OCR
  const handleSelectPresetAndScan = async (index: number) => {
    setSelectedPresetIndex(index);
    const text = PRESET_RECEIPTS[index].rawText;
    await triggerOcr(text);
  };

  const handleCustomScan = async () => {
    if (!customOcrText.trim()) return;
    await triggerOcr(customOcrText);
  };

  const triggerOcr = async (text: string) => {
    setIsScanning(true);
    setScanError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/ocr-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ocr_raw_text: text })
      });

      if (!res.ok) {
        const data = await res.json();
        if (res.status === 403) {
          setIsAiEnabled(false);
          setActiveSubTab('manual_entry');
        }
        throw new Error(data.detail || 'Không thể quét phiếu kho.');
      }

      const parsed = await res.json();
      setParsedReceipt(parsed);
      setOcrStep('CONFIRM'); // Chuyển sang màn hình xác nhận Side-by-side
    } catch (err: any) {
      setScanError(err.message);
    } finally {
      setIsScanning(false);
    }
  };

  // THAO TÁC 2: Cập nhật dòng hàng nếu thủ kho chỉnh sửa ô nghi ngờ
  const handleUpdateItemField = (itemIdx: number, field: string, value: any) => {
    if (!parsedReceipt) return;
    const updatedItems = [...parsedReceipt.items];
    const item = { ...updatedItems[itemIdx] };
    item[field] = value;
    if (field === 'quantity' || field === 'unit_price') {
      const q = parseFloat(item.quantity) || 0;
      const p = parseFloat(item.unit_price) || 0;
      item.total_amount = q * p;
    }
    updatedItems[itemIdx] = item;
    const totalVal = updatedItems.reduce((acc, it) => acc + (it.total_amount || 0), 0);
    setParsedReceipt({
      ...parsedReceipt,
      items: updatedItems,
      total_value: totalVal
    });
  };

  // THAO TÁC 3: Xác nhận & Lưu 1-chạm (Commit Batch Transaction)
  const handleConfirmBatch = async () => {
    if (!parsedReceipt || !parsedReceipt.items || parsedReceipt.items.length === 0) return;
    setIsSubmittingTx(true);

    try {
      const payload = {
        receipt_no: parsedReceipt.receipt_no,
        receipt_type: parsedReceipt.receipt_type,
        partner_name: parsedReceipt.partner_name,
        project_id: parsedReceipt.project_code || 'DA-2026-001',
        work_order_id: parsedReceipt.work_order_code,
        purchase_order_id: parsedReceipt.po_code,
        receipt_image_path: '/uploads/receipts/sample_slip.jpg',
        ocr_raw_text: parsedReceipt.raw_ocr_text,
        ai_confidence: parsedReceipt.overall_confidence,
        items: parsedReceipt.items.map((it: any) => ({
          material_code: it.material_code,
          quantity: it.quantity,
          unit_price: it.unit_price,
          confidence_by_field: {
            quantity: it.confidence_quantity,
            unit_price: it.confidence_price,
            material_code: it.confidence_material_code
          },
          notes: it.flag_reason
        }))
      };

      const res = await fetch(`${API_BASE}/api/v1/inventory/batch-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể lưu phiếu kho.');
      }

      const result = await res.json();
      setCreatedTxResult(result);
      setOcrStep('SUCCESS');
      loadTransactions();
      loadAlertsAndSuggestions();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi ghi thẻ kho.');
    } finally {
      setIsSubmittingTx(false);
    }
  };

  // Xử lý lưu Nhập tay thủ công khi tắt AI
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingManual(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/inventory/manual-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(manualForm)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Không thể lưu phiếu nhập tay.');
      }

      const tx = await res.json();
      alert(`Đã ghi thành công thẻ kho: ${tx.tx_code} (${tx.tx_type})`);
      setManualForm({
        ...manualForm,
        receipt_no: `TAY-${Math.floor(100 + Math.random() * 900)}`
      });
      loadTransactions();
      loadAlertsAndSuggestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  // Helper hàm render màu ô theo độ tin cậy
  const getCellHighlightClass = (confidence: number) => {
    if (confidence < 0.70) return 'ocr-cell-red';
    if (confidence < 0.90) return 'ocr-cell-yellow';
    return 'ocr-cell-green';
  };

  return (
    <div>
      {/* Kill-switch Alert Banner nếu AI đang tắt */}
      {!isAiEnabled && (
        <div style={{
          background: 'var(--pill-warning-bg)',
          border: '1px solid var(--warning)',
          color: 'var(--pill-warning-ink)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-card)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={20} style={{ color: 'var(--warning)', flexShrink: 0 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Công tắc An toàn AI (Kill-Switch) đang TẮT</p>
              <p style={{ fontSize: '0.75rem' }}>Tính năng AI OCR phiếu kho đã được Quản trị viên ngắt. Thủ kho thực hiện nhập tay theo quy trình dự phòng.</p>
            </div>
          </div>
          <button 
            onClick={() => setActiveSubTab('manual_entry')}
            className="btn-primary" 
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            Chuyển sang Nhập tay
          </button>
        </div>
      )}

      {/* Top Header & Sub-navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Boxes size={22} style={{ color: 'var(--accent)' }} /> Quản lý Kho & Trích xuất Phiếu Thông minh (G3)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Chụp ảnh phiếu nhập/xuất ➔ OCR tự động ➔ Đối chiếu PO/LSX ➔ Ghi thẻ kho trong &le; 3 thao tác
          </p>
        </div>

        {/* Sub-tab Pills */}
        <div style={{ display: 'flex', background: 'var(--raised)', padding: '3px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveSubTab('ocr_scan')}
            className={activeSubTab === 'ocr_scan' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeSubTab === 'ocr_scan' ? undefined : 'transparent' }}
          >
            <Camera size={14} /> Quét Phiếu OCR (AI)
          </button>
          <button
            onClick={() => setActiveSubTab('manual_entry')}
            className={activeSubTab === 'manual_entry' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeSubTab === 'manual_entry' ? undefined : 'transparent' }}
          >
            <Plus size={14} /> Nhập tay Thủ công
          </button>
          <button
            onClick={() => setActiveSubTab('alerts_suggestions')}
            className={activeSubTab === 'alerts_suggestions' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeSubTab === 'alerts_suggestions' ? undefined : 'transparent' }}
          >
            <ShieldAlert size={14} /> Cảnh báo & Mua hàng ({alerts.length})
          </button>
          <button
            onClick={() => setActiveSubTab('transactions_log')}
            className={activeSubTab === 'transactions_log' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.75rem', padding: '6px 14px', border: 'none', background: activeSubTab === 'transactions_log' ? undefined : 'transparent' }}
          >
            <Database size={14} /> Lịch sử Giao dịch
          </button>
        </div>
      </div>

      {/* 4 Cảnh báo Kho tóm tắt trên đầu (Quick Alerts Strip) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {alerts.slice(0, 4).map((alt) => {
          const isCritical = alt.severity === 'CRITICAL';
          const isWarning = alt.severity === 'WARNING';
          const pillClass = isCritical ? 'pill neg' : isWarning ? 'pill warn' : 'pill neutral';

          return (
            <div 
              key={alt.id}
              className="card"
              style={{ 
                padding: '12px 14px', 
                borderLeft: `4px solid ${isCritical ? 'var(--negative)' : isWarning ? 'var(--warning)' : 'var(--accent)'}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className={pillClass} style={{ fontSize: '0.65rem' }}>{alt.type}</span>
                  <button 
                    onClick={() => setActiveEvidence(alt)}
                    className="btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Xem vết bằng chứng đối soát"
                  >
                    <Eye size={12} /> Xem nguồn
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{alt.title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px', lineHeight: 1.3 }}>{alt.description}</p>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--faint)' }}>Nguồn: {alt.source_ref}</p>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          SUB-TAB 1: QUÉT PHIẾU OCR THÔNG MINH (THE 3-STEP WIZARD)
          ========================================================================= */}
      {activeSubTab === 'ocr_scan' && (
        <div>
          {/* Progress Breadcrumbs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <span className={`pill ${ocrStep === 'SELECT' ? 'pos' : 'neutral'}`}>1. Chọn hoặc Chụp ảnh phiếu</span>
            <ArrowRight size={14} style={{ color: 'var(--faint)' }} />
            <span className={`pill ${ocrStep === 'CONFIRM' ? 'pos' : 'neutral'}`}>2. Đối chiếu Side-by-Side (Tô vàng/đỏ)</span>
            <ArrowRight size={14} style={{ color: 'var(--faint)' }} />
            <span className={`pill ${ocrStep === 'SUCCESS' ? 'pos' : 'neutral'}`}>3. Xác nhận Thẻ kho (1-Chạm)</span>
          </div>

          {/* STEP 1: CHỌN MẪU HOẶC CHỤP ẢNH */}
          {ocrStep === 'SELECT' && (
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Thao tác 1: Chọn Phiếu Kho cần xử lý</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                    Bấm trực tiếp vào mẫu thực tế dưới đây để quét tức thì trong &lt; 1 giây, hoặc dán chữ OCR từ camera.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => triggerOcr("PHIẾU GIAO HÀNG HĐ-88219 Hòa Phát Thép V50 50 Cây")}>
                    <Camera size={14} /> Chụp từ Camera ĐT
                  </button>
                </div>
              </div>

              {/* 4 Mẫu thực tế 1-chạm cho thủ kho */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                {PRESET_RECEIPTS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectPresetAndScan(idx)}
                    style={{
                      border: selectedPresetIndex === idx ? '2px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: 'var(--radius-card)',
                      padding: '16px',
                      background: selectedPresetIndex === idx ? 'var(--raised)' : 'var(--surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onMouseLeave={(e) => {
                      if (selectedPresetIndex !== idx) e.currentTarget.style.borderColor = 'var(--border)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text)' }}>Mẫu #{idx + 1}</span>
                      <span className={preset.badgeClass} style={{ fontSize: '0.65rem' }}>{preset.badge}</span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{preset.title}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.3 }}>{preset.desc}</p>
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-primary" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        Chọn & Quét ngay <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tuỳ chọn dán OCR raw text tự do */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                  Hoặc dán nội dung văn bản OCR từ ảnh chụp phiếu:
                </p>
                <textarea
                  value={customOcrText}
                  onChange={(e) => setCustomOcrText(e.target.value)}
                  placeholder="Ví dụ: HÓA ĐƠN GTGT SỐ: HĐ-9912 ... Đơn vị bán: Công ty Thép Hòa Phát ... Thép V50 40 Cây đơn giá: 245000"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 'var(--radius-control)',
                    border: '1px solid var(--control)',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    marginBottom: '10px'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={handleCustomScan}
                    disabled={isScanning || !customOcrText.trim()}
                    className="btn-primary" 
                    style={{ fontSize: '0.8rem', padding: '8px 16px' }}
                  >
                    {isScanning ? 'Đang trích xuất OCR...' : 'Trích xuất Dữ liệu Phiếu'}
                  </button>
                </div>
              </div>

              {scanError && (
                <div style={{ marginTop: '14px', color: 'var(--negative)', fontSize: '0.8rem' }}>
                  Lỗi: {scanError}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: MÀN HÌNH XÁC NHẬN SIDE-BY-SIDE (HIỂN THỊ ẢNH GỐC CẠNH DỮ LIỆU) */}
          {ocrStep === 'CONFIRM' && parsedReceipt && (
            <div>
              {/* Thanh cảnh báo độ tin cậy */}
              <div style={{
                background: parsedReceipt.needs_manual_review ? 'var(--pill-warning-bg)' : 'var(--pill-positive-bg)',
                border: `1px solid ${parsedReceipt.needs_manual_review ? 'var(--warning)' : 'var(--positive)'}`,
                color: parsedReceipt.needs_manual_review ? 'var(--pill-warning-ink)' : 'var(--pill-positive-ink)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-card)',
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {parsedReceipt.needs_manual_review ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                      {parsedReceipt.needs_manual_review
                        ? `Phát hiện ${parsedReceipt.suspicious_fields_count} ô nghi ngờ (Tô đỏ/vàng). Thủ kho vui lòng liếc kiểm tra trước khi bấm lưu!`
                        : 'Dữ liệu trích xuất đạt độ tin cậy cao (>= 90%). Sẵn sàng ghi sổ kho.'}
                    </p>
                    <p style={{ fontSize: '0.75rem' }}>
                      Độ tin cậy tổng thể: <b>{(parsedReceipt.overall_confidence * 100).toFixed(0)}%</b> | Loại phiếu: <b>{parsedReceipt.receipt_type === 'IN' ? 'NHẬP KHO' : 'XUẤT KHO'}</b>
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => setOcrStep('SELECT')} 
                    className="btn-secondary" 
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    Quét lại phiếu khác
                  </button>
                  <button 
                    onClick={handleConfirmBatch}
                    disabled={isSubmittingTx}
                    className="btn-primary" 
                    style={{ 
                      fontSize: '0.85rem', 
                      padding: '8px 20px', 
                      background: 'var(--positive)', 
                      borderColor: 'var(--positive)',
                      color: '#ffffff',
                      fontWeight: 700 
                    }}
                  >
                    {isSubmittingTx ? 'Đang ghi sổ...' : 'Xác nhận Ghi Thẻ Kho (Thao tác 3)'}
                  </button>
                </div>
              </div>

              {/* BỐ CỤC SIDE-BY-SIDE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(480px, 1.4fr)', gap: '16px', alignItems: 'start' }}>
                
                {/* CỘT TRÁI: BẢN MÔ PHỎNG ẢNH GỐC PHIẾU KHO */}
                <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Ảnh Gốc Phiếu Kho (Scanned Slip)
                    </span>
                    <span className="pill neutral" style={{ fontSize: '0.7rem' }}>Tọa độ OCR Bounding-box</span>
                  </div>

                  {/* Render Visual Slip */}
                  <div style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    color: '#0f172a',
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: '0.75rem',
                    lineHeight: 1.5,
                    position: 'relative'
                  }}>
                    {/* Header hóa đơn */}
                    <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '8px', marginBottom: '10px', textAlign: 'center' }}>
                      <p style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>
                        {parsedReceipt.receipt_type === 'IN' ? 'HÓA ĐƠN BÁN HÀNG / PHIẾU GIAO HÀNG' : 'PHIẾU XUẤT KHO VẬT TƯ'}
                      </p>
                      <p style={{ fontSize: '0.7rem', color: '#64748b' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <p><b>Số phiếu:</b> <span style={{ background: '#e0f2fe', padding: '1px 4px', fontWeight: 700 }}>{parsedReceipt.receipt_no}</span></p>
                      <p><b>Ngày lập:</b> {parsedReceipt.receipt_date}</p>
                      <p><b>Đối tác:</b> {parsedReceipt.partner_name}</p>
                      {parsedReceipt.po_code && <p><b>Đơn mua PO:</b> <span style={{ color: '#0369a1', fontWeight: 600 }}>{parsedReceipt.po_code}</span></p>}
                      {parsedReceipt.project_code && <p><b>Mã Dự án:</b> <span style={{ color: '#0369a1', fontWeight: 600 }}>{parsedReceipt.project_code}</span></p>}
                    </div>

                    {/* Bảng vật tư mô phỏng */}
                    <div style={{ border: '1px solid #94a3b8', marginBottom: '10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', background: '#f1f5f9', padding: '4px', fontWeight: 700, borderBottom: '1px solid #94a3b8' }}>
                        <span>Tên hàng</span>
                        <span style={{ textAlign: 'right' }}>SL</span>
                        <span style={{ textAlign: 'right' }}>Đơn giá</span>
                        <span style={{ textAlign: 'right' }}>T.Tiền</span>
                      </div>
                      {parsedReceipt.items.map((it: any, idx: number) => {
                        const isSuspiciousPrice = it.confidence_price < 0.70;
                        const isSuspiciousQty = it.confidence_quantity < 0.90;

                        return (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '4px', borderBottom: '1px dashed #cbd5e1' }}>
                            <span>{it.item_name}</span>
                            <span style={{ textAlign: 'right', background: isSuspiciousQty ? '#fef08a' : 'transparent' }}>
                              {it.quantity} {it.unit}
                            </span>
                            <span style={{ textAlign: 'right', background: isSuspiciousPrice ? '#fecaca' : 'transparent', fontWeight: isSuspiciousPrice ? 700 : 400 }}>
                              {it.unit_price.toLocaleString('vi-VN')}
                            </span>
                            <span style={{ textAlign: 'right' }}>
                              {it.total_amount.toLocaleString('vi-VN')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Tổng tiền */}
                    <div style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.85rem' }}>
                      Tổng cộng: {parsedReceipt.total_value.toLocaleString('vi-VN')} VNĐ
                    </div>

                    {/* Dấu mộc / chữ ký */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '10px', textAlign: 'center', fontSize: '0.7rem' }}>
                      <div>
                        <p>Người giao hàng</p>
                        <p style={{ color: '#94a3b8', marginTop: '15px' }}>(Đã ký nhận)</p>
                      </div>
                      <div>
                        <p>Thủ kho nhận</p>
                        <div style={{
                          border: '2px solid #dc2626',
                          color: '#dc2626',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginTop: '6px',
                          transform: 'rotate(-4deg)',
                          fontWeight: 700
                        }}>
                          ĐÃ KIỂM SOÁT KHO
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '0.7rem', color: 'var(--faint)', marginBottom: '4px' }}>Văn bản trích xuất OCR thô:</p>
                    <pre style={{
                      background: 'var(--raised)',
                      padding: '8px',
                      borderRadius: '4px',
                      fontSize: '0.7rem',
                      maxHeight: '120px',
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {parsedReceipt.raw_ocr_text}
                    </pre>
                  </div>
                </div>

                {/* CỘT PHẢI: DỮ LIỆU ĐÃ TRÍCH XUẤT VỚI Ô TÔ VÀNG / ĐỎ */}
                <div className="card" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      Thao tác 2: Bảng Dữ liệu Đối Soát (Ô nghi ngờ tô màu)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <span className="pill pos" style={{ fontSize: '0.65rem' }}>&ge;90% Chuẩn</span>
                      <span className="pill warn" style={{ fontSize: '0.65rem' }}>70-89% Vàng</span>
                      <span className="pill neg" style={{ fontSize: '0.65rem' }}>&lt;70% Đỏ</span>
                    </div>
                  </div>

                  {/* Header Thông tin chung của phiếu */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Số phiếu:</label>
                      <input 
                        type="text" 
                        value={parsedReceipt.receipt_no}
                        onChange={(e) => setParsedReceipt({ ...parsedReceipt, receipt_no: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontWeight: 600, fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Loại giao dịch:</label>
                      <select
                        value={parsedReceipt.receipt_type}
                        onChange={(e) => setParsedReceipt({ ...parsedReceipt, receipt_type: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontWeight: 600, fontSize: '0.8rem' }}
                      >
                        <option value="IN">NHẬP KHO (IN)</option>
                        <option value="OUT">XUẤT KHO (OUT)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Nhà cung cấp / Đối tác:</label>
                      <input 
                        type="text" 
                        value={parsedReceipt.partner_name}
                        onChange={(e) => setParsedReceipt({ ...parsedReceipt, partner_name: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '3px' }}>Gắn mã Dự án:</label>
                      <input 
                        type="text" 
                        value={parsedReceipt.project_code || 'DA-2026-001'}
                        onChange={(e) => setParsedReceipt({ ...parsedReceipt, project_code: e.target.value })}
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontWeight: 600, fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>

                  {/* Bảng Danh sách Vật tư Chi tiết với Bôi màu Nghi ngờ */}
                  <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: 'var(--raised)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px' }}>Mã VT & Tên hàng</th>
                          <th style={{ padding: '8px 10px', width: '90px' }}>Số lượng</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Đơn giá (đ)</th>
                          <th style={{ padding: '8px 10px', width: '110px' }}>Thành tiền</th>
                          <th style={{ padding: '8px 10px' }}>Cảnh báo / Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedReceipt.items.map((it: any, idx: number) => {
                          const qtyClass = getCellHighlightClass(it.confidence_quantity);
                          const priceClass = getCellHighlightClass(it.confidence_price);
                          const codeClass = getCellHighlightClass(it.confidence_material_code);

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                              {/* Cột 1: Mã vật tư */}
                              <td style={{ padding: '8px 10px' }}>
                                <select
                                  value={it.material_code}
                                  onChange={(e) => handleUpdateItemField(idx, 'material_code', e.target.value)}
                                  className={codeClass}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}
                                >
                                  {materialsCatalog.map((m) => (
                                    <option key={m.code} value={m.code}>
                                      {m.code} - {m.name}
                                    </option>
                                  ))}
                                </select>
                                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '2px' }}>
                                  Khớp OCR: {it.item_name}
                                </p>
                              </td>

                              {/* Cột 2: Số lượng (Tô vàng nếu chữ viết tay) */}
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number"
                                  value={it.quantity}
                                  onChange={(e) => handleUpdateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className={qtyClass}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', textAlign: 'right', fontWeight: 600 }}
                                />
                                <span style={{ fontSize: '0.65rem', color: 'var(--faint)', display: 'block', textAlign: 'right' }}>
                                  ĐVT: {it.unit} ({(it.confidence_quantity * 100).toFixed(0)}%)
                                </span>
                              </td>

                              {/* Cột 3: Đơn giá (Tô ĐỎ nếu lệch >30%) */}
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="number"
                                  value={it.unit_price}
                                  onChange={(e) => handleUpdateItemField(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                  className={priceClass}
                                  style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', textAlign: 'right', fontWeight: 700 }}
                                />
                                <span style={{ fontSize: '0.65rem', color: 'var(--faint)', display: 'block', textAlign: 'right' }}>
                                  Tin cậy: ({(it.confidence_price * 100).toFixed(0)}%)
                                </span>
                              </td>

                              {/* Cột 4: Thành tiền */}
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                                {it.total_amount.toLocaleString('vi-VN')}
                              </td>

                              {/* Cột 5: Ghi chú cảnh báo */}
                              <td style={{ padding: '8px 10px' }}>
                                {it.flag_reason ? (
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: it.confidence_price < 0.70 ? 'var(--negative)' : 'var(--warning)',
                                    fontSize: '0.7rem',
                                    fontWeight: 600
                                  }}>
                                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                                    <span>{it.flag_reason}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--positive)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                    <Check size={12} /> Khớp danh mục
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Tổng tiền & Nút Xác nhận Cuối */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--raised)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-control)'
                  }}>
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tổng giá trị phiếu:</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                        {parsedReceipt.total_value.toLocaleString('vi-VN')} VNĐ
                      </p>
                    </div>

                    <button
                      onClick={handleConfirmBatch}
                      disabled={isSubmittingTx}
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
                      <CheckCircle2 size={16} />
                      {isSubmittingTx ? 'Đang lưu...' : 'Xác nhận Ghi Thẻ Kho (Thao tác 3)'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* STEP 3: HOÀN TẤT GHI SỔ THÀNH CÔNG */}
          {ocrStep === 'SUCCESS' && (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--pill-positive-bg)',
                color: 'var(--positive)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
                Đã ghi nhận Phiếu Kho Thành Công!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', maxWidth: '500px', margin: '0 auto 20px' }}>
                Toàn bộ {createdTxResult.length} dòng vật tư đã được cập nhật vào thẻ kho, gắn mã dự án và ghi vết nhật ký bất biến AI Audit.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  onClick={() => {
                    setOcrStep('SELECT');
                    setParsedReceipt(null);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '8px 18px' }}
                >
                  <Plus size={14} /> Quét tiếp Phiếu mới
                </button>
                <button
                  onClick={() => setActiveSubTab('transactions_log')}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '8px 18px' }}
                >
                  <Database size={14} /> Xem Thẻ Kho
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: NHẬP TAY THỦ CÔNG (DỰ PHÒNG KHI TẮT AI - KILL-SWITCH COMPLIANT)
          ========================================================================= */}
      {activeSubTab === 'manual_entry' && (
        <div className="card" style={{ padding: '24px', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Database size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Chế độ Nhập tay Thủ công (Không phụ thuộc AI)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                Đảm bảo nghiệp vụ kho thông suốt 100% ngay cả khi AI bị tắt khẩn cấp hoặc mất kết nối mạng.
              </p>
            </div>
          </div>

          <form onSubmit={handleManualSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số chứng từ / Phiếu:</label>
                <input
                  type="text"
                  required
                  value={manualForm.receipt_no}
                  onChange={(e) => setManualForm({ ...manualForm, receipt_no: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Loại nghiệp vụ:</label>
                <select
                  value={manualForm.tx_type}
                  onChange={(e) => setManualForm({ ...manualForm, tx_type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                >
                  <option value="IN">NHẬP KHO (IN)</option>
                  <option value="OUT">XUẤT KHO (OUT)</option>
                  <option value="ADJUSTMENT">ĐIỀU CHỈNH KIỂM KÊ</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Mã Vật tư:</label>
                <select
                  value={manualForm.material_code}
                  onChange={(e) => {
                    const mat = materialsCatalog.find(m => m.code === e.target.value);
                    setManualForm({
                      ...manualForm,
                      material_code: e.target.value,
                      unit_price: mat ? parseFloat(mat.standard_price) : manualForm.unit_price
                    });
                  }}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                >
                  {materialsCatalog.map((m) => (
                    <option key={m.code} value={m.code}>
                      {m.code} - {m.name} ({m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Số lượng:</label>
                <input
                  type="number"
                  required
                  min="0.1"
                  step="any"
                  value={manualForm.quantity}
                  onChange={(e) => setManualForm({ ...manualForm, quantity: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Đơn giá (VNĐ):</label>
                <input
                  type="number"
                  required
                  value={manualForm.unit_price}
                  onChange={(e) => setManualForm({ ...manualForm, unit_price: parseFloat(e.target.value) || 0 })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nhà cung cấp / Đơn vị nhận:</label>
                <input
                  type="text"
                  value={manualForm.partner_name}
                  onChange={(e) => setManualForm({ ...manualForm, partner_name: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Ghi chú:</label>
              <input
                type="text"
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-control)', border: '1px solid var(--control)', fontSize: '0.8rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="submit"
                disabled={isSubmittingManual}
                className="btn-primary"
                style={{ padding: '8px 24px', fontSize: '0.85rem' }}
              >
                {isSubmittingManual ? 'Đang lưu thẻ kho...' : 'Ghi Thẻ Kho Thủ Công'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: CẢNH BÁO KHO & GỢI Ý MUA HÀNG THÔNG MINH
          ========================================================================= */}
      {activeSubTab === 'alerts_suggestions' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(360px, 1fr)', gap: '20px' }}>
          
          {/* CỘT TRÁI: 4 NHÓM CẢNH BÁO KHO */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>4 Nhóm Cảnh báo Kho Tự động</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Thiếu LSX | Vượt định mức BOM | Lệch tồn | Tồn đọng &gt; 45 ngày</p>
              </div>
              <button onClick={loadAlertsAndSuggestions} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>
                <RefreshCw size={13} /> Cập nhật
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {alerts.map((alt) => (
                <div 
                  key={alt.id}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '14px',
                    background: 'var(--surface)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className={alt.severity === 'CRITICAL' ? 'pill neg' : alt.severity === 'WARNING' ? 'pill warn' : 'pill neutral'} style={{ fontSize: '0.65rem' }}>
                      {alt.type}
                    </span>
                    <button
                      onClick={() => setActiveEvidence(alt)}
                      className="btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Eye size={12} /> Xem nguồn
                    </button>
                  </div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '3px' }}>{alt.title}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.4 }}>{alt.description}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--faint)', marginTop: '8px' }}>
                    Chứng cứ: <i>{alt.source_ref}</i>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: GỢI Ý MUA HÀNG THÔNG MINH DỰA TRÊN LỆNH SẢN XUẤT */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingCart size={18} style={{ color: 'var(--accent)' }} /> Gợi ý Mua hàng Phục vụ LSX
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Tự động cân đối tiến độ đơn hàng và bù đắp ngưỡng an toàn</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {suggestions.map((sug, idx) => (
                <div
                  key={idx}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                    padding: '14px',
                    background: sug.urgency === 'HIGH' ? 'var(--raised)' : 'var(--surface)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{sug.material_code}</span>
                    <span className={sug.urgency === 'HIGH' ? 'pill neg' : 'pill neutral'} style={{ fontSize: '0.65rem' }}>
                      {sug.urgency === 'HIGH' ? 'CẦN GẤP' : 'TIÊU CHUẨN'}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{sug.material_name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Hiện có: <b>{sug.current_stock} {sug.unit}</b> | Ngưỡng an toàn: <b>{sug.min_stock_alert} {sug.unit}</b>
                  </p>
                  
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: 'var(--surface)',
                    border: '1px dashed var(--border)',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    <p>Đề xuất mua: <b style={{ color: 'var(--accent)' }}>{sug.suggested_purchase_qty} {sug.unit}</b> (&sim; {sug.estimated_total_cost.toLocaleString('vi-VN')} đ)</p>
                    <p style={{ color: 'var(--faint)', fontSize: '0.7rem', marginTop: '2px' }}>Lý do: {sug.reason}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                      NCC: <b>{sug.supplier_name}</b> ({sug.lead_time_days} ngày)
                    </div>
                    <a
                      href={`tel:${sug.supplier_phone.replace(/\./g, '')}`}
                      className="btn-secondary"
                      style={{ fontSize: '0.7rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                    >
                      <Phone size={12} /> Gọi {sug.supplier_phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: LỊCH SỬ GIAO DỊCH KHO (THẺ KHO)
          ========================================================================= */}
      {activeSubTab === 'transactions_log' && (
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Thẻ Kho & Lịch sử Giao dịch Nhập/Xuất</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Toàn bộ phiếu kho phát sinh thời gian thực gắn mã dự án</p>
            </div>
            <button onClick={loadTransactions} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
              <RefreshCw size={13} /> Làm mới
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ background: 'var(--raised)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Mã GD</th>
                  <th style={{ padding: '8px 10px' }}>Loại</th>
                  <th style={{ padding: '8px 10px' }}>Vật tư</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Số lượng</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền</th>
                  <th style={{ padding: '8px 10px' }}>Chứng từ / Đối tác</th>
                  <th style={{ padding: '8px 10px' }}>Độ tin cậy</th>
                  <th style={{ padding: '8px 10px' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{tx.tx_code}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={tx.tx_type === 'IN' ? 'pill pos' : 'pill neutral'} style={{ fontSize: '0.7rem' }}>
                        {tx.tx_type === 'IN' ? 'NHẬP' : tx.tx_type === 'OUT' ? 'XUẤT' : 'ĐIỀU CHỈNH'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontWeight: 600 }}>{tx.material_code}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{tx.material_name}</p>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {tx.quantity} {tx.unit}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {tx.unit_price.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {tx.total_value.toLocaleString('vi-VN')} đ
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <p style={{ fontWeight: 500 }}>{tx.receipt_no || 'N/A'}</p>
                      <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{tx.partner_name || 'Nội bộ'}</p>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className={tx.ai_confidence >= 0.90 ? 'pill pos' : tx.ai_confidence >= 0.70 ? 'pill warn' : 'pill neg'} style={{ fontSize: '0.7rem' }}>
                        {(tx.ai_confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: '0.7rem', color: 'var(--faint)' }}>
                      {new Date(tx.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL XEM NGUỒN (PROVENANCE EVIDENCE VIEWER)
          ========================================================================= */}
      {activeEvidence && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '90%', maxWidth: '580px', padding: '24px', position: 'relative' }}>
            <button
              onClick={() => setActiveEvidence(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Eye size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hồ sơ Nguồn gốc & Bằng chứng Đối soát</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Truy vết căn cứ theo nguyên tắc Provenance ADR-004</p>
              </div>
            </div>

            <div style={{ background: 'var(--raised)', padding: '14px', borderRadius: 'var(--radius-control)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className={activeEvidence.severity === 'CRITICAL' ? 'pill neg' : 'pill warn'} style={{ fontSize: '0.7rem' }}>
                  {activeEvidence.type}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>Mã: {activeEvidence.material_code}</span>
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{activeEvidence.title}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{activeEvidence.description}</p>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--faint)', marginBottom: '8px' }}>
                Chi tiết bằng chứng số liệu (Evidence Details):
              </p>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '12px', fontSize: '0.8rem' }}>
                {Object.entries(activeEvidence.evidence_details || {}).map(([key, value]: [string, any]) => (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px dashed var(--rule)' }}>
                    <span style={{ color: 'var(--muted)' }}>{key}:</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{typeof value === 'number' ? value.toLocaleString('vi-VN') : String(value)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--faint)' }}>
                Nguồn: {activeEvidence.source_ref}
              </span>
              <button
                onClick={() => setActiveEvidence(null)}
                className="btn-primary"
                style={{ fontSize: '0.8rem', padding: '6px 16px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for OCR highlights */}
      <style jsx global>{`
        .ocr-cell-green {
          border: 1px solid var(--border) !important;
          background: #f8fafc;
        }
        .ocr-cell-yellow {
          border: 1px solid #eab308 !important;
          background: #fef9c3 !important;
          color: #854d0e !important;
        }
        .ocr-cell-red {
          border: 1px solid #ef4444 !important;
          background: #fee2e2 !important;
          color: #991b1b !important;
        }
      `}</style>
    </div>
  );
}

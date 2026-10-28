'use client';
import React, { useState, useEffect } from 'react';
import { Edit3, X, AlertCircle } from 'lucide-react';

interface Material {
  id: string;
  code: string;
  name: string;
  spec: string;
  unit: string;
  category: string;
  standard_price: number;
  min_stock_alert: number;
  current_stock: number;
}

interface EditMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  material: Material | null;
  onMaterialUpdated: () => void;
}

export default function EditMaterialModal({
  isOpen,
  onClose,
  token,
  material,
  onMaterialUpdated
}: EditMaterialModalProps) {
  const [standardPrice, setStandardPrice] = useState(0);
  const [spec, setSpec] = useState('');
  const [minStockAlert, setMinStockAlert] = useState(0);
  const [currentStock, setCurrentStock] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (material) {
      setStandardPrice(material.standard_price);
      setSpec(material.spec || '');
      setMinStockAlert(material.min_stock_alert);
      setCurrentStock(material.current_stock);
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/v1/materials/${material.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          standard_price: Number(standardPrice),
          spec,
          min_stock_alert: Number(minStockAlert),
          current_stock: Number(currentStock)
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Không thể cập nhật vật tư.');
      }

      onMaterialUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi cập nhật.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: 'var(--accent)' }}>
              <Edit3 size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Chỉnh sửa Vật tư & Bảng giá</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{material.code}</span> ({material.name})</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', color: '#fb7185', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.85rem' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Đơn vị tính</label>
            <input className="form-input" value={material.unit} disabled style={{ opacity: 0.6 }} />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Đơn giá chuẩn mua vào (VNĐ) *</label>
            <input 
              className="form-input" 
              type="number" 
              value={standardPrice} 
              onChange={(e) => setStandardPrice(Number(e.target.value))} 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Quy cách kỹ thuật / Tiêu chuẩn</label>
            <textarea 
              className="form-input" 
              rows={3}
              value={spec} 
              onChange={(e) => setSpec(e.target.value)} 
              placeholder="vd: Mạ kẽm nhúng nóng, dày 5mm, cây 6m..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Tồn kho tối thiểu báo động</label>
              <input 
                className="form-input" 
                type="number" 
                value={minStockAlert} 
                onChange={(e) => setMinStockAlert(Number(e.target.value))} 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Tồn kho thực tế hiện tại</label>
              <input 
                className="form-input" 
                type="number" 
                value={currentStock} 
                onChange={(e) => setCurrentStock(Number(e.target.value))} 
              />
            </div>
          </div>

          <div style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

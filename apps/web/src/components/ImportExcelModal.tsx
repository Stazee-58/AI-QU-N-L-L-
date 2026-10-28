'use client';
import React, { useState, useRef } from 'react';
import { Upload, X, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react';

interface ImportError {
  row_number: number;
  field: string;
  error_message: string;
  raw_value?: any;
}

interface ImportResult {
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: ImportError[];
}

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onImportSuccess: () => void;
}

export default function ImportExcelModal({ isOpen, onClose, token, onImportSuccess }: ImportExcelModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setApiError(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/v1/materials/template`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mau_danh_muc_vat_tu.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Không thể tải file mẫu. Vui lòng thử lại.');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setApiError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/v1/materials/import`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Lỗi khi tải tệp lên.');
      }

      const data: ImportResult = await res.json();
      setResult(data);
      if (data.success_count > 0 && data.error_count === 0) {
        onImportSuccess();
      }
    } catch (err: any) {
      setApiError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34d399' }}>
              <Upload size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Nhập Danh mục Vật tư từ Excel / CSV</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kiểm tra tự động và báo lỗi tiếng Việt từng dòng</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chưa có file mẫu chuẩn? Tải về tại đây:</span>
            <button className="btn-secondary" onClick={handleDownloadTemplate} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              <Download size={15} /> Tải file mẫu (.CSV)
            </button>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: '2px dashed var(--border-subtle)', 
              borderRadius: '14px', 
              padding: '32px 20px', 
              textAlign: 'center', 
              cursor: 'pointer',
              background: file ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
              style={{ display: 'none' }} 
            />
            <FileText size={36} style={{ color: file ? 'var(--accent)' : 'var(--text-dim)', margin: '0 auto 12px' }} />
            {file ? (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>{file.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {(file.size / 1024).toFixed(1)} KB — Bấm để chọn tệp khác
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 600, color: 'var(--text-main)' }}>Kéo thả hoặc Bấm vào đây để chọn tệp</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>Hỗ trợ tệp .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {apiError && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: '10px', color: '#fb7185', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.85rem' }}>{apiError}</span>
            </div>
          )}

          {result && (
            <div>
              {result.error_count === 0 ? (
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle2 size={24} />
                  <div>
                    <h4 style={{ fontWeight: 700 }}>Nhập thành công 100%!</h4>
                    <p style={{ fontSize: '0.85rem' }}>Đã nạp {result.success_count} mã vật tư vào hệ thống.</p>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px 18px', borderRadius: '10px', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <AlertCircle size={20} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      Phát hiện {result.error_count} dòng lỗi! Dữ liệu chưa được lưu. Vui lòng sửa trên Excel theo danh sách dưới:
                    </span>
                  </div>

                  <div className="data-table-container" style={{ maxHeight: '200px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Vị trí dòng</th>
                          <th>Cột lỗi</th>
                          <th>Nội dung lỗi chi tiết</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.errors.map((err, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 700, color: '#fbbf24' }}>Dòng {err.row_number}</td>
                            <td style={{ color: '#94a3b8' }}>{err.field}</td>
                            <td style={{ color: '#fb7185' }}>{err.error_message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn-secondary" onClick={onClose}>Đóng</button>
          <button 
            className="btn-primary" 
            onClick={handleUpload} 
            disabled={!file || isUploading}
            style={{ opacity: (!file || isUploading) ? 0.6 : 1 }}
          >
            {isUploading ? 'Đang kiểm tra và nhập...' : 'Bắt đầu Nhập'}
          </button>
        </div>
      </div>
    </div>
  );
}

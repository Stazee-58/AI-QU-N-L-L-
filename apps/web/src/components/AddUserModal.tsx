'use client';
import React, { useState } from 'react';
import { UserPlus, X, AlertCircle } from 'lucide-react';

interface Role {
  id: string;
  code: string;
  name: string;
}

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  roles: Role[];
  onUserAdded: () => void;
}

export default function AddUserModal({ isOpen, onClose, token, roles, onUserAdded }: AddUserModalProps) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id || '');
  const [password, setPassword] = useState('Password@2026');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/api/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          full_name: fullName,
          phone: phone || null,
          role_id: roleId,
          password,
          is_active: true
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Không thể tạo người dùng.');
      }

      onUserAdded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo người dùng.');
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
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>Thêm Người dùng Mới</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cấp quyền theo vai trò nghiệp vụ</p>
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
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Tên đăng nhập *</label>
            <input 
              className="form-input" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="vd: totruong_xuong1" 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Họ và tên *</label>
            <input 
              className="form-input" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="vd: Nguyễn Văn Tuấn" 
              required 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Số điện thoại (liên kết Zalo/Telegram)</label>
            <input 
              className="form-input" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="vd: 0988123456" 
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Vai trò nghiệp vụ *</label>
            <select 
              className="form-input" 
              value={roleId} 
              onChange={(e) => setRoleId(e.target.value)}
              required
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mật khẩu ban đầu *</label>
            <input 
              className="form-input" 
              type="text" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <div style={{ padding: '16px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo...' : 'Tạo Tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

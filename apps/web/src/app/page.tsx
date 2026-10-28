'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Settings, ShieldCheck, History, LogOut, 
  HelpCircle, Plus, Search, FileSpreadsheet, Download, 
  CheckCircle2, AlertTriangle, Power, Edit3, ArrowRight, Activity
} from 'lucide-react';
import HelpModal from '../components/HelpModal';
import ImportExcelModal from '../components/ImportExcelModal';
import AddUserModal from '../components/AddUserModal';
import EditMaterialModal from '../components/EditMaterialModal';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AdminPortal() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form đăng nhập
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'users' | 'materials' | 'norms' | 'ai_settings' | 'ai_audit'>('users');

  // Modals
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);

  // Dữ liệu
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [norms, setNorms] = useState<any[]>([]);
  const [aiSettings, setAiSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  // Tự động kiểm tra token trong localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('caulong_token');
    const savedUser = localStorage.getItem('caulong_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Nạp dữ liệu khi tab thay đổi
  useEffect(() => {
    if (token) {
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'materials') loadMaterials();
      if (activeTab === 'norms') loadNorms();
      if (activeTab === 'ai_settings') loadAiSettings();
      if (activeTab === 'ai_audit') loadAuditLogs();
      loadRoles();
    }
  }, [token, activeTab]);

  const handleLogin = async (e?: React.FormEvent, uName?: string, uPwd?: string) => {
    if (e) e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    const targetUser = uName || username;
    const targetPwd = uPwd || password;

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: targetUser, password: targetPwd })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Đăng nhập không thành công.');
      }

      const data = await res.json();
      setToken(data.access_token);
      setCurrentUser(data);
      localStorage.setItem('caulong_token', data.access_token);
      localStorage.setItem('caulong_user', JSON.stringify(data));
    } catch (err: any) {
      setLoginError(err.message || 'Lỗi mạng hoặc sai mật khẩu.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('caulong_token');
    localStorage.removeItem('caulong_user');
  };

  // Nạp API dữ liệu
  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setRoles(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/materials?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMaterials(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadNorms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/norms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setNorms(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAiSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAiSettings(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-audit?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setAuditLogs(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  // Khóa / Mở người dùng
  const handleToggleUserStatus = async (user: any) => {
    if (!confirm(`Bạn có chắc muốn ${user.is_active ? 'khóa' : 'kích hoạt lại'} tài khoản ${user.username}?`)) return;
    try {
      await fetch(`${API_BASE}/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !user.is_active })
      });
      loadUsers();
    } catch (err) {
      alert('Thao tác thất bại.');
    }
  };

  // Thay đổi cài đặt AI (Công tắc ngắt hoặc mức quyền)
  const handleUpdateAiSetting = async (featureKey: string, payload: any) => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai-settings/${featureKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadAiSettings();
      }
    } catch (err) {
      alert('Không thể lưu cài đặt AI.');
    }
  };

  // Format tiền VNĐ
  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Giao diện Đăng nhập
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '16px', color: '#60a5fa', marginBottom: '14px' }}>
              <ShieldCheck size={36} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              CẬU LONG ENTERPRISE
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hệ thống Vận hành Sản xuất & Thi công theo đơn
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loginError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', color: '#fb7185', fontSize: '0.85rem' }}>
                {loginError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Tên đăng nhập</label>
              <input 
                className="form-input" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mật khẩu</label>
              <input 
                className="form-input" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={isLoggingIn}>
              {isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
              Tài khoản mẫu thử nghiệm G1 (bấm để đăng nhập nhanh):
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
                onClick={() => handleLogin(undefined, 'admin', 'Admin@123456')}
              >
                👑 Quản trị viên (Admin)
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
                onClick={() => handleLogin(undefined, 'director', 'Director@123456')}
              >
                👔 Giám đốc điều hành
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
                onClick={() => handleLogin(undefined, 'kythuat', 'Tech@123456')}
              >
                📐 Kỹ thuật viên
              </button>
              <button 
                type="button" 
                className="btn-secondary" 
                style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }}
                onClick={() => handleLogin(undefined, 'totruong', 'Foreman@123456')}
              >
                🏭 Tổ trưởng xưởng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Giao diện Trang Quản trị (Admin Portal)
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navigation Bar */}
      <header style={{ 
        background: 'var(--glass-bg)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '14px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', padding: '8px 12px', borderRadius: '10px', fontWeight: 800, fontSize: '0.95rem' }}>
            CL
          </div>
          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>CẬU LONG ENTERPRISE</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Cổng Quản trị Vận hành & Phân quyền (G1)</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Trạng thái chi phí AI */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.03)', 
            border: '1px solid var(--border-subtle)', 
            padding: '6px 12px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontSize: '0.75rem'
          }}>
            <Activity size={15} style={{ color: '#10b981' }} />
            <span style={{ color: 'var(--text-dim)' }}>Hạn mức AI tháng:</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>$12.40 / $50.00</span>
            <span className="badge badge-green" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>An toàn (24.8%)</span>
          </div>

          {/* User badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.825rem', fontWeight: 600 }}>{currentUser.full_name}</p>
              <p style={{ fontSize: '0.7rem', color: '#60a5fa' }}>{currentUser.role_name}</p>
            </div>
            <span className="badge badge-blue">{currentUser.role_code}</span>
          </div>

          {/* Contextual Help Button */}
          <button 
            className="btn-secondary" 
            style={{ padding: '8px 14px', fontSize: '0.8rem' }}
            onClick={() => setIsHelpOpen(true)}
            title="Mở sổ tay hướng dẫn cho vai trò hiện tại"
          >
            <HelpCircle size={16} /> <b>?</b> Hướng dẫn
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="btn-secondary" 
            style={{ padding: '8px 12px', color: '#fb7185' }}
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Tabs */}
        <aside style={{ 
          width: '260px', 
          background: 'rgba(18, 23, 34, 0.5)', 
          borderRight: '1px solid var(--border-subtle)', 
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px 8px' }}>
            Trang Quản trị Hệ thống
          </p>

          <button 
            onClick={() => setActiveTab('users')} 
            className={`btn-secondary ${activeTab === 'users' ? 'btn-primary' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'users' ? 'none' : undefined }}
          >
            <Users size={18} /> Quản lý Người dùng
          </button>

          <button 
            onClick={() => setActiveTab('materials')} 
            className={`btn-secondary ${activeTab === 'materials' ? 'btn-primary' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'materials' ? 'none' : undefined }}
          >
            <Package size={18} /> Vật tư & Bảng giá
          </button>

          <button 
            onClick={() => setActiveTab('norms')} 
            className={`btn-secondary ${activeTab === 'norms' ? 'btn-primary' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'norms' ? 'none' : undefined }}
          >
            <FileSpreadsheet size={18} /> Định mức Sản xuất (BOM)
          </button>

          <button 
            onClick={() => setActiveTab('ai_settings')} 
            className={`btn-secondary ${activeTab === 'ai_settings' ? 'btn-primary' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'ai_settings' ? 'none' : undefined }}
          >
            <Settings size={18} /> Cài đặt & Quyền AI
          </button>

          <button 
            onClick={() => setActiveTab('ai_audit')} 
            className={`btn-secondary ${activeTab === 'ai_audit' ? 'btn-primary' : ''}`}
            style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'ai_audit' ? 'none' : undefined }}
          >
            <History size={18} /> Nhật ký Đối soát AI
          </button>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '28px 36px', overflowY: 'auto' }}>
          {/* TAB 1: QUẢN LÝ NGƯỜI DÙNG */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Danh sách Nhân sự & Phân quyền Vai trò</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cấp quyền theo 8 vai trò nghiệp vụ chuỗi sản xuất</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                    <input 
                      className="form-input" 
                      style={{ paddingLeft: '36px', width: '280px' }} 
                      placeholder="Tìm nhân sự, số điện thoại..." 
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary" onClick={() => setIsAddUserOpen(true)}>
                    <Plus size={16} /> Thêm người dùng
                  </button>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên đăng nhập</th>
                      <th>Họ và tên</th>
                      <th>Số điện thoại</th>
                      <th>Vai trò nghiệp vụ</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => 
                        u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
                        u.full_name.toLowerCase().includes(userSearch.toLowerCase())
                      )
                      .map((u) => (
                        <tr key={u.id}>
                          <td style={{ fontWeight: 600, color: '#60a5fa' }}>{u.username}</td>
                          <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                          <td style={{ color: 'var(--text-muted)' }}>{u.phone || 'Chưa cập nhật'}</td>
                          <td>
                            <span className="badge badge-blue">
                              {u.role ? u.role.name : u.role_id}
                            </span>
                          </td>
                          <td>
                            {u.is_active ? (
                              <span className="badge badge-green">Đang hoạt động</span>
                            ) : (
                              <span className="badge badge-red">Đã khóa</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {u.username !== 'admin' && (
                              <button 
                                className={u.is_active ? 'btn-danger' : 'btn-secondary'}
                                onClick={() => handleToggleUserStatus(u)}
                                style={{ padding: '6px 12px' }}
                              >
                                {u.is_active ? 'Khóa' : 'Kích hoạt'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VẬT TƯ & BẢNG GIÁ */}
          {activeTab === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Danh mục Vật tư & Bảng giá Mua Chuẩn</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dữ liệu làm căn cứ tính giá vốn báo giá và đối chiếu phiếu kho</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                    <input 
                      className="form-input" 
                      style={{ paddingLeft: '36px', width: '280px' }} 
                      placeholder="Tìm theo mã, tên vật tư..." 
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                    />
                  </div>
                  <button className="btn-secondary" onClick={() => setIsImportOpen(true)}>
                    <FileSpreadsheet size={16} /> Nhập Excel / CSV
                  </button>
                </div>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã vật tư</th>
                      <th>Tên vật tư</th>
                      <th>Quy cách kỹ thuật</th>
                      <th>ĐVT</th>
                      <th>Nhóm</th>
                      <th>Đơn giá chuẩn</th>
                      <th>Tồn cảnh báo</th>
                      <th>Tồn thực tế</th>
                      <th style={{ textAlign: 'right' }}>Sửa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials
                      .filter(m => 
                        m.code.toLowerCase().includes(materialSearch.toLowerCase()) || 
                        m.name.toLowerCase().includes(materialSearch.toLowerCase())
                      )
                      .map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontWeight: 700, color: '#38bdf8' }}>{m.code}</td>
                          <td style={{ fontWeight: 600 }}>{m.name}</td>
                          <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.spec || '-'}</td>
                          <td><span className="badge badge-blue">{m.unit}</span></td>
                          <td>{m.category}</td>
                          <td style={{ fontWeight: 700, color: '#34d399' }}>{formatVND(m.standard_price)}</td>
                          <td style={{ color: 'var(--text-dim)' }}>{m.min_stock_alert}</td>
                          <td>
                            <span className={m.current_stock < m.min_stock_alert ? 'badge badge-red' : 'badge badge-green'}>
                              {m.current_stock} {m.unit}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                              onClick={() => setEditingMaterial(m)}
                            >
                              <Edit3 size={14} /> Sửa
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ĐỊNH MỨC SẢN XUẤT */}
          {activeTab === 'norms' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Định mức Tiêu hao Sản xuất (BOM)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cơ sở bóc tách tự động và tính giá trị lệnh sản xuất</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {norms.map((norm) => (
                  <div key={norm.id} className="card-glass" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span className="badge badge-blue">{norm.product_type}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Phiên bản {norm.version}</span>
                    </div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px' }}>{norm.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Đơn vị tính: <b>{norm.unit}</b> | Giờ công định mức: <b>{norm.labor_hours_per_unit} giờ</b>
                    </p>

                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontSize: '0.8rem' }}>
                      <p style={{ color: 'var(--text-dim)', marginBottom: '6px' }}>Vật tư tiêu chuẩn theo định mức:</p>
                      {norm.items && norm.items.length > 0 ? (
                        <ul style={{ paddingLeft: '18px', color: 'var(--text-main)' }}>
                          {norm.items.map((item: any, idx: number) => (
                            <li key={idx} style={{ marginBottom: '4px' }}>
                              {item.material_code || 'Vật tư'}: {item.qty_per_unit} (Hao hụt {item.scrap_rate_percent}%)
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Chưa thiết lập chi tiết định mức con</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CÀI ĐẶT & QUYỀN AI */}
          {activeTab === 'ai_settings' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cấu hình Mức Quyền AI & Công Tắc Ngắt Khẩn Cấp</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Nguyên tắc cốt lõi: AI đề xuất, người duyệt. Khi phát hiện sự cố, gạt công tắc để ngắt AI tức thì về nhập tay.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
                {aiSettings.map((s) => (
                  <div key={s.id} className="card-glass" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>{s.feature_key}</span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{s.feature_name}</h3>
                      </div>
                      
                      {/* Công tắc khẩn cấp */}
                      <button 
                        onClick={() => handleUpdateAiSetting(s.feature_key, { is_enabled: !s.is_enabled })}
                        className={s.is_enabled ? 'badge badge-green' : 'badge badge-red'}
                        style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '0.75rem' }}
                      >
                        <Power size={14} /> {s.is_enabled ? 'ĐANG BẬT' : 'ĐÃ NGẮT'}
                      </button>
                    </div>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Mô hình: <b>{s.model_name}</b> ({s.provider}) | Hạn mức tháng: <b>${s.monthly_budget_usd}</b>
                    </p>

                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block', marginBottom: '8px' }}>
                        Mức quyền vận hành (Admin tùy chỉnh):
                      </label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name={`level_${s.feature_key}`} 
                            checked={s.permission_level === 1}
                            onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 1 })}
                          />
                          <span><b>Mức 1 (Gợi ý):</b> AI chỉ phân tích & đề xuất số liệu</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name={`level_${s.feature_key}`} 
                            checked={s.permission_level === 2}
                            onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 2 })}
                          />
                          <span><b>Mức 2 (Làm rồi duyệt):</b> AI tạo bản ghi hoàn chỉnh, người duyệt mới có hiệu lực</span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input 
                            type="radio" 
                            name={`level_${s.feature_key}`} 
                            checked={s.permission_level === 3}
                            onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 3 })}
                          />
                          <span><b>Mức 3 (Tự chạy):</b> Chỉ cho tác vụ không đụng đến tiền/kho</span>
                        </label>
                      </div>
                    </div>

                    <div style={{ background: s.is_enabled ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)', padding: '10px 14px', borderRadius: '10px', fontSize: '0.75rem', color: s.is_enabled ? '#34d399' : '#fb7185' }}>
                      {s.is_enabled 
                        ? '✓ Tính năng đang vận hành bình thường theo mức quyền đã chọn.' 
                        : '⚠️ ĐÃ NGẮT KHẨN CẤP: Hệ thống chuyển sang nhập tay thủ công cho chức năng này.'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: NHẬT KÝ ĐỐI SOÁT AI */}
          {activeTab === 'ai_audit' && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nhật ký Đối soát AI & Sửa đổi của Con người (Bất biến)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Cơ chế Append-only: Không thể sửa, không thể xóa. Mọi con số AI sinh ra đều có điểm tin cậy và theo dõi sửa đổi.
                </p>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Module AI</th>
                      <th>Người thực hiện</th>
                      <th>Điểm tin cậy</th>
                      <th>Người có sửa không?</th>
                      <th>Chi tiết khác biệt (AI vs Người)</th>
                      <th>Chi phí API</th>
                      <th>Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '32px' }}>
                          Chưa có phát sinh thao tác AI nào. Khi các module G2–G4 hoạt động, toàn bộ log sẽ xuất hiện tại đây.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600, color: '#60a5fa' }}>{log.module_name}</td>
                          <td>{log.user_id}</td>
                          <td>
                            <span className={log.confidence_score >= 0.9 ? 'badge badge-green' : log.confidence_score >= 0.7 ? 'badge badge-amber' : 'badge badge-red'}>
                              {(log.confidence_score * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td>
                            {log.is_modified ? (
                              <span className="badge badge-amber">Có sửa đổi</span>
                            ) : (
                              <span className="badge badge-green">Giữ nguyên AI</span>
                            )}
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {log.is_modified ? (
                              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.75rem', color: '#fbbf24' }}>
                                {JSON.stringify(log.diff_summary)}
                              </pre>
                            ) : (
                              <span style={{ color: 'var(--text-dim)' }}>Không có chênh lệch</span>
                            )}
                          </td>
                          <td style={{ color: '#34d399', fontWeight: 600 }}>${log.cost_usd.toFixed(4)}</td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        activeTab={activeTab} 
      />

      <ImportExcelModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        token={token}
        onImportSuccess={() => {
          setIsImportOpen(false);
          loadMaterials();
        }}
      />

      <AddUserModal 
        isOpen={isAddUserOpen} 
        onClose={() => setIsAddUserOpen(false)} 
        token={token}
        roles={roles}
        onUserAdded={() => {
          loadUsers();
        }}
      />

      <EditMaterialModal 
        isOpen={!!editingMaterial} 
        onClose={() => setEditingMaterial(null)} 
        token={token}
        material={editingMaterial}
        onMaterialUpdated={() => {
          loadMaterials();
        }}
      />
    </div>
  );
}

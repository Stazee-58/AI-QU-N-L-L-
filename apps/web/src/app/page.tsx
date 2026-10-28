'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Settings, ShieldCheck, History, LogOut, 
  HelpCircle, Plus, Search, FileSpreadsheet, Download, 
  CheckCircle2, AlertTriangle, Power, Edit3, ArrowRight, Activity,
  Smartphone, BarChart3, AlertOctagon, RefreshCw, PhoneCall, Truck
} from 'lucide-react';
import HelpModal from '../components/HelpModal';
import ImportExcelModal from '../components/ImportExcelModal';
import AddUserModal from '../components/AddUserModal';
import EditMaterialModal from '../components/EditMaterialModal';
import ForemanMobileView from '../components/ForemanMobileView';
import WarehouseView from '../components/WarehouseView';
import { Boxes } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AppHome() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form đăng nhập
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'work_orders' | 'daily_reports' | 'foreman_mobile' | 'warehouse' | 'materials' | 'norms' | 'ai_settings' | 'ai_audit' | 'users'
  >('work_orders');

  // Sub-tab cho 3 phiên bản báo cáo
  const [reportVersion, setReportVersion] = useState<'director' | 'tech' | 'sales'>('director');

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
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string | null>(null);

  // Tự động nạp token từ localStorage
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
      if (activeTab === 'work_orders') loadWorkOrders();
      if (activeTab === 'daily_reports') loadDailySummary();
      if (activeTab === 'warehouse') loadMaterials();
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

  const loadWorkOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/production/work-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setWorkOrders(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const loadDailySummary = async () => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/production/daily-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDailySummary(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleTriggerSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/production/trigger-daily-summary`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setDailySummary(await res.json());
        alert('Đã cập nhật bản tổng hợp báo cáo ngày mới nhất!');
      }
    } catch (err) {
      alert('Không thể tạo báo cáo tổng hợp.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

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
      if (res.ok) loadAiSettings();
    } catch (err) {
      alert('Không thể lưu cài đặt AI.');
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Màn hình Đăng nhập
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card-glass" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '16px', color: 'var(--accent)', marginBottom: '14px' }}>
              <ShieldCheck size={36} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              CẬU LONG ENTERPRISE
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hệ thống Vận hành Sản xuất & Báo cáo Ca Xưởng
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loginError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', color: 'var(--negative)', fontSize: '0.85rem' }}>
                {loginError}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Tên đăng nhập</label>
              <input className="form-input" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Mật khẩu</label>
              <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={isLoggingIn}>
              {isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
              Đăng nhập nhanh các vai trò:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }} onClick={() => handleLogin(undefined, 'admin', 'Admin@123456')}>
                Quản trị (admin)
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }} onClick={() => handleLogin(undefined, 'director', 'Director@123456')}>
                Giám đốc (director)
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }} onClick={() => handleLogin(undefined, 'totruong', 'Foreman@123456')}>
                Tổ trưởng (totruong)
              </button>
              <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px 10px', justifyContent: 'center' }} onClick={() => handleLogin(undefined, 'kinhdoanh', 'Sales@123456')}>
                Kinh doanh (kinhdoanh)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header style={{ 
        background: 'var(--surface)', 
        borderBottom: '1px solid var(--border)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--primary)', color: 'var(--primary-ink)', padding: '6px 10px', borderRadius: 'var(--radius-control)', fontWeight: 700, fontSize: '0.9rem' }}>
            CL
          </div>
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>CẬU LONG ENTERPRISE</h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Hệ thống Điều hành Sản xuất & Báo cáo Ca Xưởng</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'var(--raised)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: 'var(--radius-control)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
            <Activity size={14} style={{ color: 'var(--positive)' }} />
            <span style={{ color: 'var(--muted)' }}>Hạn mức AI tháng:</span>
            <span style={{ color: 'var(--text)', fontWeight: 600 }}>$12.40 / $50.00</span>
            <span className="pill pos" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>24.8%</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', fontWeight: 600 }}>{currentUser.full_name}</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--accent)' }}>{currentUser.role_name}</p>
            </div>
            <span className="pill neutral">{currentUser.role_code}</span>
          </div>

          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setIsHelpOpen(true)}>
            <HelpCircle size={15} /> <b>?</b> Hướng dẫn
          </button>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '6px 10px', color: 'var(--negative)' }} title="Đăng xuất">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ 
          width: '240px', 
          background: 'var(--raised)', 
          borderRight: '1px solid var(--border)', 
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 6px', fontWeight: 600 }}>
            Điều hành Xưởng (G2)
          </p>

          <button onClick={() => setActiveTab('work_orders')} className={activeTab === 'work_orders' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'work_orders' ? 'none' : '1px solid transparent', background: activeTab === 'work_orders' ? undefined : 'transparent' }}>
            <BarChart3 size={16} /> Tiến độ Lệnh Sản xuất
          </button>

          <button onClick={() => setActiveTab('daily_reports')} className={activeTab === 'daily_reports' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'daily_reports' ? 'none' : '1px solid transparent', background: activeTab === 'daily_reports' ? undefined : 'transparent' }}>
            <FileSpreadsheet size={16} /> Báo cáo Điều hành (3 Bản)
          </button>

          <button onClick={() => setActiveTab('foreman_mobile')} className={activeTab === 'foreman_mobile' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'foreman_mobile' ? 'none' : '1px solid transparent', background: activeTab === 'foreman_mobile' ? undefined : 'transparent' }}>
            <Smartphone size={16} /> ĐT Tổ Trưởng (3 Chạm)
          </button>

          <p style={{ fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '14px 8px 6px', fontWeight: 600 }}>
            Kho & Vật tư (G3)
          </p>

          <button onClick={() => setActiveTab('warehouse')} className={activeTab === 'warehouse' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'warehouse' ? 'none' : '1px solid transparent', background: activeTab === 'warehouse' ? undefined : 'transparent' }}>
            <Boxes size={16} /> Phiếu Nhập / Xuất Kho
          </button>

          <p style={{ fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '14px 8px 6px', fontWeight: 600 }}>
            Quản trị Nền tảng (G1)
          </p>

          <button onClick={() => setActiveTab('materials')} className={activeTab === 'materials' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'materials' ? 'none' : '1px solid transparent', background: activeTab === 'materials' ? undefined : 'transparent' }}>
            <Package size={16} /> Vật tư & Bảng giá
          </button>

          <button onClick={() => setActiveTab('norms')} className={activeTab === 'norms' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'norms' ? 'none' : '1px solid transparent', background: activeTab === 'norms' ? undefined : 'transparent' }}>
            <FileSpreadsheet size={16} /> Định mức (BOM)
          </button>

          <button onClick={() => setActiveTab('ai_settings')} className={activeTab === 'ai_settings' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'ai_settings' ? 'none' : '1px solid transparent', background: activeTab === 'ai_settings' ? undefined : 'transparent' }}>
            <Settings size={16} /> Cài đặt & Quyền AI
          </button>

          <button onClick={() => setActiveTab('ai_audit')} className={activeTab === 'ai_audit' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'ai_audit' ? 'none' : '1px solid transparent', background: activeTab === 'ai_audit' ? undefined : 'transparent' }}>
            <History size={16} /> Nhật ký Đối soát AI
          </button>

          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'users' ? 'none' : '1px solid transparent', background: activeTab === 'users' ? undefined : 'transparent' }}>
            <Users size={16} /> Quản lý Người dùng
          </button>
        </aside>

        {/* Content Area */}
        <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
          {/* TAB: WORK ORDERS DASHBOARD */}
          {activeTab === 'work_orders' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Bảng Tiến độ Lệnh Sản xuất & Cảnh báo Rủi ro</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Theo dõi thực tế từng đơn hàng, tự động phát hiện nguy cơ trễ hạn</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className={`btn-secondary ${riskFilter === null ? 'btn-primary' : ''}`} style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => setRiskFilter(null)}>
                    Tất cả ({workOrders.length})
                  </button>
                  <button className={`btn-secondary ${riskFilter === 'CRITICAL' ? 'btn-primary' : ''}`} style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--negative)' }} onClick={() => setRiskFilter('CRITICAL')}>
                    <span className="status-dot red" style={{ marginRight: '6px' }}></span> Quá hạn ({workOrders.filter(w => w.risk_level === 'CRITICAL').length})
                  </button>
                  <button className={`btn-secondary ${riskFilter === 'WARNING' ? 'btn-primary' : ''}`} style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--warning)' }} onClick={() => setRiskFilter('WARNING')}>
                    <span className="status-dot amber" style={{ marginRight: '6px' }}></span> Nguy cơ trễ ({workOrders.filter(w => w.risk_level === 'WARNING').length})
                  </button>
                </div>
              </div>

              {/* Work Order Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {workOrders
                  .filter(wo => !riskFilter || wo.risk_level === riskFilter)
                  .map((wo) => {
                    const isCritical = wo.risk_level === 'CRITICAL';
                    const isWarning = wo.risk_level === 'WARNING';
                    return (
                      <div key={wo.id} className="card-glass" style={{ 
                        padding: '22px', 
                        borderLeft: isCritical ? '4px solid var(--negative)' : isWarning ? '4px solid var(--warning)' : '4px solid var(--positive)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '14px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)' }}>{wo.code}</span>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{wo.product_name}</h3>
                          </div>
                          {isCritical ? (
                            <span className="badge badge-red"><AlertOctagon size={14} /> QUÁ HẠN</span>
                          ) : isWarning ? (
                            <span className="badge badge-amber"><AlertTriangle size={14} /> NGUY CƠ TRỄ</span>
                          ) : (
                            <span className="badge badge-green"><CheckCircle2 size={14} /> ĐÚNG TIẾN ĐỘ</span>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tiến độ: <b>{wo.completed_qty} / {wo.target_qty} {wo.unit}</b></span>
                            <span style={{ fontWeight: 800, color: isCritical ? 'var(--negative)' : isWarning ? 'var(--warning)' : 'var(--positive)' }}>
                              {wo.progress_percent}%
                            </span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div style={{ 
                              width: `${Math.min(100, wo.progress_percent)}%`, 
                              height: '100%', 
                              background: isCritical ? 'var(--negative)' : isWarning ? 'var(--warning)' : 'var(--positive)',
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>

                        {/* Risk Reason Alert */}
                        {wo.risk_reason && (
                          <div style={{ 
                            background: isCritical ? 'rgba(244, 63, 94, 0.12)' : 'rgba(245, 158, 11, 0.12)', 
                            border: isCritical ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '10px 14px', 
                            borderRadius: '10px', 
                            fontSize: '0.8rem',
                            color: isCritical ? 'var(--negative)' : 'var(--warning)',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                          }}>
                            <AlertTriangle size={16} />
                            <span><b>Nguyên nhân:</b> {wo.risk_reason}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                          <span>Hạn giao: <b>{new Date(wo.due_date).toLocaleDateString('vi-VN')}</b></span>
                          <span>Tổ trưởng: <b>Trần Văn Bình</b></span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: BÁO CÁO ĐIỀU HÀNH 3 PHIÊN BẢN */}
          {activeTab === 'daily_reports' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Hệ thống Báo cáo Điều hành Tự động (3 Phiên bản)</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đúng thông tin cho đúng người: Giám đốc (Ngắn gọn) • Kỹ thuật (Chi tiết) • Kinh doanh (Khách hàng)</p>
                </div>
                <button className="btn-secondary" onClick={handleTriggerSummary} disabled={isLoadingSummary}>
                  <RefreshCw size={16} className={isLoadingSummary ? 'spin' : ''} /> Tổng hợp mới nhất
                </button>
              </div>

              {/* Version Switcher */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.03)', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
                <button 
                  onClick={() => setReportVersion('director')}
                  className={`btn-secondary ${reportVersion === 'director' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.85rem', padding: '8px 16px', border: reportVersion === 'director' ? 'none' : undefined }}
                >
                  1. Bản Giám đốc (1 Trang)
                </button>
                <button 
                  onClick={() => setReportVersion('tech')}
                  className={`btn-secondary ${reportVersion === 'tech' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.85rem', padding: '8px 16px', border: reportVersion === 'tech' ? 'none' : undefined }}
                >
                  2. Bản Kỹ thuật & Xưởng
                </button>
                <button 
                  onClick={() => setReportVersion('sales')}
                  className={`btn-secondary ${reportVersion === 'sales' ? 'btn-primary' : ''}`}
                  style={{ fontSize: '0.85rem', padding: '8px 16px', border: reportVersion === 'sales' ? 'none' : undefined }}
                >
                  3. Bản Kinh doanh "Việc hôm nay"
                </button>
              </div>

              {dailySummary && (
                <div>
                  {/* 1. BẢN GIÁM ĐỐC NGẮN */}
                  {reportVersion === 'director' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="panel" style={{ padding: '20px', background: 'var(--raised)' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase' }}>KẾT LUẬN ĐIỀU HÀNH HÔM NAY</p>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '4px', color: 'var(--text)' }}>
                          {dailySummary.director_summary.one_sentence_takeaway}
                        </h3>
                      </div>

                      {/* 4 Chỉ số cốt lõi */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ĐƠN ĐANG CHẠY</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', marginTop: '4px' }}>
                            {dailySummary.director_summary.kpis.total_active_orders}
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>NGUY CƠ TRỄ HẠN</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--negative)', marginTop: '4px' }}>
                            {dailySummary.director_summary.kpis.delayed_risk_count}
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SẢN LƯỢNG HÔM NAY</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--positive)', marginTop: '4px' }}>
                            {dailySummary.director_summary.kpis.today_units_completed} sản phẩm
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TỔNG GIÁ TRỊ XƯỞNG ĐANG LÀM</p>
                          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                            {formatVND(dailySummary.director_summary.kpis.estimated_wip_value)}
                          </p>
                        </div>
                      </div>

                      {/* Cảnh báo đỏ & Chờ duyệt */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="card-glass" style={{ padding: '22px' }}>
                          <h4 style={{ color: 'var(--negative)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> Cảnh báo rủi ro nghiêm trọng:
                          </h4>
                          <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            {dailySummary.director_summary.critical_alerts.map((al: string, i: number) => (
                              <li key={i}>{al}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="card-glass" style={{ padding: '22px' }}>
                          <h4 style={{ color: 'var(--warning)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={18} /> Mục chờ Giám đốc duyệt nhanh:
                          </h4>
                          <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            {dailySummary.director_summary.waiting_approval.map((wa: string, i: number) => (
                              <li key={i}>{wa}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. BẢN KỸ THUẬT CHI TIẾT */}
                  {reportVersion === 'tech' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="data-table-container">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Công đoạn sản xuất</th>
                              <th>Sản lượng hôm nay</th>
                              <th>Tổng giờ công</th>
                              <th>Số thợ tham gia</th>
                              <th>Trạng thái</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(dailySummary.tech_summary.stages).map(([stage, info]: [string, any]) => (
                              <tr key={stage}>
                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{stage}</td>
                                <td style={{ fontWeight: 800, color: 'var(--positive)' }}>{info.qty}</td>
                                <td>{info.hours} giờ</td>
                                <td>{info.workers} thợ</td>
                                <td><span className="badge badge-green">Hoạt động</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {dailySummary.tech_summary.reported_issues.length > 0 && (
                        <div className="card-glass" style={{ padding: '20px' }}>
                          <h4 style={{ color: 'var(--negative)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={16} /> Báo cáo sự cố từ các tổ trưởng:
                          </h4>
                          <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            {dailySummary.tech_summary.reported_issues.map((iss: any, i: number) => (
                              <li key={i}>
                                <b>{iss.work_order}</b> ({iss.foreman}): {iss.issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. BẢN KINH DOANH "VIỆC HÔM NAY" */}
                  {reportVersion === 'sales' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Sắp hoàn thành giao hàng */}
                      <div className="card-glass" style={{ padding: '22px' }}>
                        <h4 style={{ color: 'var(--positive)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Truck size={18} /> Đơn hàng sắp xong ({'>= 90%'}): Gọi khách hẹn ngày lắp đặt
                        </h4>
                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Sản phẩm</th>
                                <th>Tiến độ</th>
                                <th>Hành động cần làm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailySummary.sales_summary.ready_to_dispatch.map((item: any, i: number) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 700 }}>{item.customer}</td>
                                  <td style={{ color: 'var(--accent)' }}>{item.phone}</td>
                                  <td>{item.product}</td>
                                  <td><span className="badge badge-green">{item.progress}</span></td>
                                  <td style={{ color: 'var(--positive)', fontWeight: 600 }}>{item.action}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Đơn bị vướng trễ */}
                      <div className="card-glass" style={{ padding: '22px' }}>
                        <h4 style={{ color: 'var(--negative)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <PhoneCall size={18} /> Đơn có nguy cơ trễ: Cần gọi khách thông báo & chăm sóc
                        </h4>
                        <div className="data-table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Khách hàng</th>
                                <th>Số điện thoại</th>
                                <th>Sản phẩm</th>
                                <th>Nguyên nhân trễ</th>
                                <th>Hành động đề xuất</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dailySummary.sales_summary.need_customer_call.map((item: any, i: number) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 700 }}>{item.customer}</td>
                                  <td style={{ color: 'var(--accent)' }}>{item.phone}</td>
                                  <td>{item.product}</td>
                                  <td style={{ color: 'var(--negative)' }}>{item.reason}</td>
                                  <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{item.action}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: MÀN HÌNH ĐIỆN THOẠI TỔ TRƯỞNG (3 CHẠM) */}
          {activeTab === 'foreman_mobile' && (
            <div style={{ padding: '20px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Giao diện Di động Tổ trưởng Xưởng (Mobile First)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  Thao tác ngón tay to • Quy tắc 3 chạm: Báo nhanh $\rightarrow$ Xem lại $\rightarrow$ Xác nhận gửi (dưới 45s)
                </p>
              </div>

              <ForemanMobileView 
                token={token} 
                onLogSubmitted={() => {
                  loadWorkOrders();
                  loadDailySummary();
                }}
              />
            </div>
          )}

          {/* TAB: KHO & VẬT TƯ (G3) */}
          {activeTab === 'warehouse' && (
            <WarehouseView 
              token={token}
              currentUser={currentUser}
              materialsCatalog={materials}
            />
          )}

          {/* TAB: VẬT TƯ */}
          {activeTab === 'materials' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Danh mục Vật tư & Bảng giá Mua Chuẩn</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Căn cứ tính giá vốn báo giá và đối chiếu phiếu kho</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input className="form-input" style={{ width: '240px' }} placeholder="Tìm theo mã, tên..." value={materialSearch} onChange={(e) => setMaterialSearch(e.target.value)} />
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
                      <th>Quy cách</th>
                      <th>ĐVT</th>
                      <th>Nhóm</th>
                      <th>Đơn giá chuẩn</th>
                      <th>Tồn cảnh báo</th>
                      <th>Tồn thực tế</th>
                      <th style={{ textAlign: 'right' }}>Sửa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.filter(m => m.code.toLowerCase().includes(materialSearch.toLowerCase()) || m.name.toLowerCase().includes(materialSearch.toLowerCase())).map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{m.code}</td>
                        <td style={{ fontWeight: 600 }}>{m.name}</td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{m.spec || '-'}</td>
                        <td><span className="badge badge-blue">{m.unit}</span></td>
                        <td>{m.category}</td>
                        <td style={{ fontWeight: 700, color: 'var(--positive)' }}>{formatVND(m.standard_price)}</td>
                        <td style={{ color: 'var(--text-dim)' }}>{m.min_stock_alert}</td>
                        <td>
                          <span className={m.current_stock < m.min_stock_alert ? 'badge badge-red' : 'badge badge-green'}>
                            {m.current_stock} {m.unit}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem' }} onClick={() => setEditingMaterial(m)}>
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

          {/* TAB: ĐỊNH MỨC BOM */}
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
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CÀI ĐẶT QUYỀN AI */}
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
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 700 }}>{s.feature_key}</span>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>{s.feature_name}</h3>
                      </div>
                      
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
                          <input type="radio" name={`level_${s.feature_key}`} checked={s.permission_level === 1} onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 1 })} />
                          <span><b>Mức 1 (Gợi ý):</b> AI chỉ phân tích & đề xuất số liệu</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name={`level_${s.feature_key}`} checked={s.permission_level === 2} onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 2 })} />
                          <span><b>Mức 2 (Làm rồi duyệt):</b> AI tạo bản ghi hoàn chỉnh, người duyệt mới có hiệu lực</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name={`level_${s.feature_key}`} checked={s.permission_level === 3} onChange={() => handleUpdateAiSetting(s.feature_key, { permission_level: 3 })} />
                          <span><b>Mức 3 (Tự chạy):</b> Chỉ cho tác vụ không đụng đến tiền/kho</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: AUDIT LOGS */}
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
                      <th>Chi phí API</th>
                      <th>Thời điểm</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.module_name}</td>
                        <td>{log.user_id}</td>
                        <td>
                          <span className={log.confidence_score >= 0.9 ? 'badge badge-green' : 'badge badge-amber'}>
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
                        <td style={{ color: 'var(--positive)', fontWeight: 600 }}>${log.cost_usd.toFixed(4)}</td>
                        <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NGƯỜI DÙNG */}
          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Danh sách Nhân sự & Phân quyền Vai trò</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cấp quyền theo 8 vai trò nghiệp vụ chuỗi sản xuất</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input className="form-input" style={{ width: '240px' }} placeholder="Tìm nhân sự..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
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
                      <th>Vai trò</th>
                      <th>Trạng thái</th>
                      <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()) || u.full_name.toLowerCase().includes(userSearch.toLowerCase())).map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{u.username}</td>
                        <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.phone || '-'}</td>
                        <td><span className="badge badge-blue">{u.role ? u.role.name : u.role_id}</span></td>
                        <td>
                          {u.is_active ? <span className="badge badge-green">Đang hoạt động</span> : <span className="badge badge-red">Đã khóa</span>}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {u.username !== 'admin' && (
                            <button className={u.is_active ? 'btn-danger' : 'btn-secondary'} onClick={() => handleToggleUserStatus(u)} style={{ padding: '6px 12px' }}>
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
        </main>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} activeTab={activeTab} />
      <ImportExcelModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} token={token} onImportSuccess={() => loadMaterials()} />
      <AddUserModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} token={token} roles={roles} onUserAdded={() => loadUsers()} />
      <EditMaterialModal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} token={token} material={editingMaterial} onMaterialUpdated={() => loadMaterials()} />
    </div>
  );
}

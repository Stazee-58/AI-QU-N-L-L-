'use client';
import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Settings, ShieldCheck, History, LogOut, 
  HelpCircle, Plus, Search, FileSpreadsheet, Download, 
  CheckCircle2, AlertTriangle, Power, Edit3, ArrowRight, Activity,
  Smartphone, BarChart3, AlertOctagon, RefreshCw, PhoneCall, Truck,
  ShieldAlert, UserPlus, X, Clock, Check
} from 'lucide-react';
import HelpModal from '../components/HelpModal';
import ImportExcelModal from '../components/ImportExcelModal';
import AddUserModal from '../components/AddUserModal';
import EditMaterialModal from '../components/EditMaterialModal';
import ForemanMobileView from '../components/ForemanMobileView';
import WarehouseView from '../components/WarehouseView';
import SettlementView from '../components/SettlementView';
import ExecutiveDashboardView from '../components/ExecutiveDashboardView';
import SandboxTrainingView from '../components/SandboxTrainingView';
import { Boxes, FileCheck2, GraduationCap, LayoutDashboard } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export default function AppHome() {
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form đăng nhập
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@123456');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Chế độ Auth & Form đăng ký tài khoản tự do
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRoleId, setRegRoleId] = useState<number>(3); // Mặc định: Nhân viên Kinh doanh
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<
    'executive_dashboard' | 'work_orders' | 'daily_reports' | 'foreman_mobile' | 'warehouse' | 'settlements' | 'sandbox' | 'materials' | 'norms' | 'ai_settings' | 'ai_audit' | 'users'
  >('executive_dashboard');

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
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : (data.items || []));
      }
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
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(Array.isArray(data) ? data : (data.items || []));
      }
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

  const handleSystemReset = async () => {
    if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn RESET toàn bộ hệ thống về MỚI NGUYÊN (0 dữ liệu)? Thao tác này sẽ xóa sạch dữ liệu sản xuất, kho, quyết toán và nhật ký đối soát.')) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/system/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ mode: 'empty' })
      });
      if (res.ok) {
        alert('Đã reset toàn bộ hệ thống về mới nguyên thành công!');
        window.location.reload();
      } else {
        alert('Không thể reset hệ thống.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi reset hệ thống.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccessMessage(null);

    if (regPassword !== regConfirmPassword) {
      setRegError('Mật khẩu và xác nhận mật khẩu không khớp nhau.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Mật khẩu phải có độ dài tối thiểu từ 6 ký tự.');
      return;
    }

    setIsRegistering(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: regFullName,
          username: regUsername,
          phone: regPhone,
          role_id: regRoleId,
          password: regPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Không thể gửi yêu cầu đăng ký.');
      }

      setRegSuccessMessage(data.message || 'Đăng ký thành công! Tài khoản đang chờ Quản trị viên (Admin) xét duyệt.');
      setRegFullName('');
      setRegUsername('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: any) {
      setRegError(err.message || 'Lỗi khi gửi yêu cầu đăng ký.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleApproveUser = async (user: any) => {
    if (!confirm(`Phê duyệt và kích hoạt tài khoản "${user.username}" (${user.full_name}) với vai trò "${user.role?.name || 'Thành viên'}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${user.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role_id: user.role_id })
      });
      if (res.ok) {
        alert(`Đã phê duyệt tài khoản "${user.username}" thành công! Người dùng có thể đăng nhập ngay.`);
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.detail || 'Lỗi khi duyệt tài khoản.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi phê duyệt tài khoản.');
    }
  };

  const handleRejectUser = async (user: any) => {
    if (!confirm(`Từ chối yêu cầu đăng ký của tài khoản "${user.username}" (${user.full_name})?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${user.id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert(`Đã từ chối tài khoản "${user.username}".`);
        loadUsers();
      } else {
        const err = await res.json();
        alert(err.detail || 'Lỗi khi từ chối tài khoản.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi từ chối tài khoản.');
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Xóa vĩnh viễn tài khoản "${user.username}" khỏi hệ thống?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert(`Đã xóa tài khoản "${user.username}".`);
        loadUsers();
      } else {
        alert('Không thể xóa tài khoản.');
      }
    } catch (err) {
      alert('Lỗi kết nối khi xóa tài khoản.');
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Màn hình Đăng nhập / Đăng ký
  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="card-glass" style={{ width: '100%', maxWidth: authMode === 'register' ? '480px' : '440px', padding: '36px 30px', transition: 'max-width 0.2s ease' }}>
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '16px', color: 'var(--accent)', marginBottom: '12px' }}>
              <ShieldCheck size={36} />
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              CẬU LONG ENTERPRISE
            </h1>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Hệ thống Vận hành Sản xuất & Báo cáo Ca Xưởng
            </p>
          </div>

          {/* Tab Switcher: Đăng nhập vs Đăng ký */}
          <div style={{ display: 'flex', background: 'var(--raised)', padding: '3px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setLoginError(null); setRegError(null); }}
              className={authMode === 'login' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 12px', border: 'none', background: authMode === 'login' ? undefined : 'transparent' }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setLoginError(null); setRegError(null); }}
              className={authMode === 'register' ? 'btn-primary' : 'btn-secondary'}
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem', padding: '6px 12px', border: 'none', background: authMode === 'register' ? undefined : 'transparent' }}
            >
              Đăng ký chức vụ
            </button>
          </div>

          {/* CHẾ ĐỘ 1: ĐĂNG NHẬP */}
          {authMode === 'login' && (
            <div>
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

                <button type="submit" className="btn-primary" style={{ justifyContent: 'center', marginTop: '6px' }} disabled={isLoggingIn}>
                  {isLoggingIn ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'} <ArrowRight size={16} />
                </button>
              </form>

              <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '14px', color: 'var(--text-muted)' }}>
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setLoginError(null); setRegError(null); }}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Đăng ký chức vụ ngay
                </button>
              </p>

              <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
                  Đăng nhập nhanh các vai trò mẫu:
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
          )}

          {/* CHẾ ĐỘ 2: ĐĂNG KÝ TỰ DO (CHỌN CHỨC VỤ RIÊNG -> ADMIN DUYỆT) */}
          {authMode === 'register' && (
            <div>
              {regSuccessMessage ? (
                <div style={{ background: 'var(--pill-positive-bg)', border: '1px solid var(--positive)', padding: '16px', borderRadius: 'var(--radius-card)', color: 'var(--pill-positive-ink)', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, marginBottom: '6px' }}>
                    <CheckCircle2 size={18} /> Gửi yêu cầu đăng ký thành công!
                  </div>
                  <p style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>{regSuccessMessage}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>
                    Quản trị viên (Admin) sẽ nhận được thông báo để kiểm tra và phê duyệt quyền truy cập cho bạn.
                  </p>
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); setRegSuccessMessage(null); }}
                    className="btn-primary" 
                    style={{ marginTop: '14px', fontSize: '0.8rem', padding: '8px 16px', width: '100%', justifyContent: 'center' }}
                  >
                    Về màn hình Đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {regError && (
                    <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', color: 'var(--negative)', fontSize: '0.8rem' }}>
                      {regError}
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Họ và tên *</label>
                    <input 
                      className="form-input" 
                      placeholder="Ví dụ: Nguyễn Văn Hưng"
                      value={regFullName} 
                      onChange={(e) => setRegFullName(e.target.value)} 
                      required 
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Tên đăng nhập *</label>
                      <input 
                        className="form-input" 
                        placeholder="vanhung"
                        value={regUsername} 
                        onChange={(e) => setRegUsername(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Số điện thoại</label>
                      <input 
                        className="form-input" 
                        placeholder="0912..."
                        value={regPhone} 
                        onChange={(e) => setRegPhone(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Chức vụ xin gia nhập *</label>
                    <select 
                      className="form-input"
                      value={regRoleId} 
                      onChange={(e) => setRegRoleId(Number(e.target.value))}
                      style={{ fontWeight: 600 }}
                    >
                      <option value={2}>Giám đốc / Ban điều hành (DIRECTOR)</option>
                      <option value={3}>Nhân viên Kinh doanh & Dự án (SALES)</option>
                      <option value={4}>Kỹ thuật / Điều hành sản xuất (TECH)</option>
                      <option value={5}>Quản đốc / Tổ trưởng xưởng (FOREMAN)</option>
                      <option value={6}>Thủ kho (WAREHOUSE)</option>
                      <option value={7}>Điều phối / Thi công lắp đặt (SITE)</option>
                      <option value={8}>Kế toán quyết toán (ACCOUNTANT)</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Mật khẩu *</label>
                      <input 
                        className="form-input" 
                        type="password" 
                        placeholder="Tối thiểu 6 ký tự"
                        value={regPassword} 
                        onChange={(e) => setRegPassword(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nhập lại mật khẩu *</label>
                      <input 
                        className="form-input" 
                        type="password" 
                        placeholder="Xác nhận"
                        value={regConfirmPassword} 
                        onChange={(e) => setRegConfirmPassword(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ background: 'var(--raised)', padding: '10px', borderRadius: 'var(--radius-control)', border: '1px dashed var(--border)', fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                    Hồ sơ sau khi gửi sẽ ở trạng thái <b>Chờ Admin duyệt</b>. Sau khi Quản trị viên kích hoạt, bạn mới có thể đăng nhập.
                  </div>

                  <button 
                    type="submit" 
                    className="btn-primary" 
                    style={{ justifyContent: 'center', marginTop: '4px' }} 
                    disabled={isRegistering}
                  >
                    {isRegistering ? 'Đang gửi hồ sơ...' : 'Gửi Yêu Cầu Đăng Ký'} <ArrowRight size={16} />
                  </button>

                  <p style={{ fontSize: '0.75rem', textAlign: 'center', marginTop: '8px', color: 'var(--text-muted)' }}>
                    Đã có tài khoản?{' '}
                    <button
                      type="button"
                      onClick={() => { setAuthMode('login'); setRegError(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                      Đăng nhập ngay
                    </button>
                  </p>
                </form>
              )}
            </div>
          )}

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

          {/* Badge thông báo yêu cầu đăng ký chờ duyệt cho Admin */}
          {(currentUser?.role_code === 'ADMIN' || currentUser?.role?.code === 'ADMIN') && users.some(u => u.approval_status === 'PENDING') && (
            <button
              onClick={() => setActiveTab('users')}
              className="btn-secondary"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderColor: 'var(--warning)',
                color: 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Có tài khoản tự đăng ký mới chờ Admin phê duyệt"
            >
              <ShieldAlert size={14} />
              <span>{users.filter(u => u.approval_status === 'PENDING').length} chờ duyệt</span>
            </button>
          )}

          <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => setIsHelpOpen(true)}>
            <HelpCircle size={15} /> <b>?</b> Hướng dẫn
          </button>

          <button 
            onClick={handleSystemReset} 
            className="btn-secondary" 
            style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--negative)', borderColor: 'var(--border)' }} 
            title="Reset toàn bộ hệ thống về mới nguyên (0 dữ liệu)"
          >
            <RefreshCw size={14} /> Reset Hệ Thống
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
            Tổng Quản & Sát Hạch (G6)
          </p>

          <button onClick={() => setActiveTab('executive_dashboard')} className={activeTab === 'executive_dashboard' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'executive_dashboard' ? 'none' : '1px solid transparent', background: activeTab === 'executive_dashboard' ? undefined : 'transparent' }}>
            <LayoutDashboard size={16} /> Dashboard Điều Hành
          </button>

          <button onClick={() => setActiveTab('sandbox')} className={activeTab === 'sandbox' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'sandbox' ? 'none' : '1px solid transparent', background: activeTab === 'sandbox' ? undefined : 'transparent' }}>
            <GraduationCap size={16} /> Sandbox & Sát Hạch
          </button>

          <p style={{ fontSize: '0.7rem', color: 'var(--faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '14px 8px 6px', fontWeight: 600 }}>
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
            Nghiệm Thu & Quyết Toán (G5)
          </p>

          <button onClick={() => setActiveTab('settlements')} className={activeTab === 'settlements' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'flex-start', border: activeTab === 'settlements' ? 'none' : '1px solid transparent', background: activeTab === 'settlements' ? undefined : 'transparent' }}>
            <FileCheck2 size={16} /> Quyết Toán Dự Án
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

          <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'space-between', border: activeTab === 'users' ? 'none' : '1px solid transparent', background: activeTab === 'users' ? undefined : 'transparent' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Quản lý Người dùng
            </span>
            {users.some(u => u.approval_status === 'PENDING') && (
              <span className="pill warn" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                {users.filter(u => u.approval_status === 'PENDING').length}
              </span>
            )}
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
              {workOrders.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--raised)', border: '1px solid var(--border)' }}>
                  <BarChart3 size={40} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hệ thống mới nguyên — Chưa có Lệnh sản xuất</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                    Chưa có lệnh sản xuất nào được khởi tạo. Bạn có thể sử dụng các chức năng theo vai để tạo lệnh sản xuất mới.
                  </p>
                </div>
              ) : (
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
              )}
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
                          {dailySummary.director_summary?.one_sentence_takeaway || 'Mọi đơn hàng đang bám sát tiến độ cam kết.'}
                        </h3>
                      </div>

                      {/* 4 Chỉ số cốt lõi */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>ĐƠN ĐANG CHẠY</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginTop: '4px' }}>
                            {dailySummary.director_summary?.kpis?.total_active_orders || 0}
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>NGUY CƠ TRỄ HẠN</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--negative)', marginTop: '4px' }}>
                            {dailySummary.director_summary?.kpis?.delayed_risk_count || 0}
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>SẢN LƯỢNG HÔM NAY</p>
                          <p style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--positive)', marginTop: '4px' }}>
                            {dailySummary.director_summary?.kpis?.today_units_completed || 0} sản phẩm
                          </p>
                        </div>
                        <div className="card-glass" style={{ padding: '18px' }}>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>TỔNG GIÁ TRỊ XƯỞNG ĐANG LÀM</p>
                          <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent)', marginTop: '4px' }}>
                            {formatVND(dailySummary.director_summary?.kpis?.estimated_wip_value || 0)}
                          </p>
                        </div>
                      </div>

                      {/* Cảnh báo đỏ & Chờ duyệt */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="card-glass" style={{ padding: '22px' }}>
                          <h4 style={{ color: 'var(--negative)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} /> Cảnh báo rủi ro nghiêm trọng:
                          </h4>
                          {(dailySummary.director_summary?.critical_alerts || []).length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Không có cảnh báo rủi ro phát sinh.</p>
                          ) : (
                            <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                              {(dailySummary.director_summary?.critical_alerts || []).map((al: string, i: number) => (
                                <li key={i}>{al}</li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="card-glass" style={{ padding: '22px' }}>
                          <h4 style={{ color: 'var(--warning)', fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={18} /> Mục chờ Giám đốc duyệt nhanh:
                          </h4>
                          {(dailySummary.director_summary?.waiting_approval || []).length === 0 ? (
                            <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>Không có đề xuất nào đang chờ duyệt.</p>
                          ) : (
                            <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                              {(dailySummary.director_summary?.waiting_approval || []).map((wa: string, i: number) => (
                                <li key={i}>{wa}</li>
                              ))}
                            </ul>
                          )}
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
                            {Object.entries(dailySummary.tech_summary?.stages || {}).map(([stage, info]: [string, any]) => (
                              <tr key={stage}>
                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{stage}</td>
                                <td style={{ fontWeight: 800, color: 'var(--positive)' }}>{info?.qty || 0}</td>
                                <td>{info?.hours || 0} giờ</td>
                                <td>{info?.workers || 0} thợ</td>
                                <td><span className="badge badge-green">Hoạt động</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {(dailySummary.tech_summary?.reported_issues || []).length > 0 && (
                        <div className="card-glass" style={{ padding: '20px' }}>
                          <h4 style={{ color: 'var(--negative)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={16} /> Báo cáo sự cố từ các tổ trưởng:
                          </h4>
                          <ul style={{ paddingLeft: '18px', color: 'var(--text-main)', fontSize: '0.85rem', lineHeight: '1.8' }}>
                            {(dailySummary.tech_summary?.reported_issues || []).map((iss: any, i: number) => (
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
                              {(dailySummary.sales_summary?.ready_to_dispatch || []).length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px', fontSize: '0.8rem' }}>
                                    Chưa có đơn hàng nào cần điều phối giao nhận hôm nay.
                                  </td>
                                </tr>
                              ) : (
                                (dailySummary.sales_summary?.ready_to_dispatch || []).map((item: any, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{item.customer}</td>
                                    <td style={{ color: 'var(--accent)' }}>{item.phone}</td>
                                    <td>{item.product}</td>
                                    <td><span className="badge badge-green">{item.progress}</span></td>
                                    <td style={{ color: 'var(--positive)', fontWeight: 600 }}>{item.action}</td>
                                  </tr>
                                ))
                              )}
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
                              {(dailySummary.sales_summary?.need_customer_call || []).length === 0 ? (
                                <tr>
                                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--muted)', padding: '16px', fontSize: '0.8rem' }}>
                                    Không có đơn hàng nào bị vướng cần gọi điện hỗ trợ khách hàng.
                                  </td>
                                </tr>
                              ) : (
                                (dailySummary.sales_summary?.need_customer_call || []).map((item: any, i: number) => (
                                  <tr key={i}>
                                    <td style={{ fontWeight: 700 }}>{item.customer}</td>
                                    <td style={{ color: 'var(--accent)' }}>{item.phone}</td>
                                    <td>{item.product}</td>
                                    <td style={{ color: 'var(--negative)' }}>{item.reason}</td>
                                    <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{item.action}</td>
                                  </tr>
                                ))
                              )}
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

          {/* TAB: EXECUTIVE DASHBOARD (G6) */}
          {activeTab === 'executive_dashboard' && (
            <ExecutiveDashboardView 
              token={token}
              currentUser={currentUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB: SANDBOX & SÁT HẠCH (G6) */}
          {activeTab === 'sandbox' && (
            <SandboxTrainingView 
              token={token}
              currentUser={currentUser}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {/* TAB: KHO & VẬT TƯ (G3) */}
          {activeTab === 'warehouse' && (
            <WarehouseView 
              token={token}
              currentUser={currentUser}
              materialsCatalog={materials}
            />
          )}

          {/* TAB: QUYẾT TOÁN & NGHIỆM THU (G5) */}
          {activeTab === 'settlements' && (
            <SettlementView 
              token={token}
              currentUser={currentUser}
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
                    {(Array.isArray(materials) ? materials : []).length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                          Chưa có vật tư nào trong danh mục. Bấm "Nhập Excel / CSV" để tải lên danh mục mới.
                        </td>
                      </tr>
                    ) : (
                      (Array.isArray(materials) ? materials : []).filter(m => (m.code || '').toLowerCase().includes(materialSearch.toLowerCase()) || (m.name || '').toLowerCase().includes(materialSearch.toLowerCase())).map((m) => (
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
                      ))
                    )}
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

              {norms.length === 0 ? (
                <div className="card" style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--raised)', border: '1px solid var(--border)' }}>
                  <Package size={40} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Hệ thống mới nguyên — Chưa có Định mức BOM</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '6px', maxWidth: '480px', margin: '6px auto 0' }}>
                    Chưa có định mức tiêu hao sản xuất nào. Bạn có thể cấu hình định mức mới theo từng dòng sản phẩm.
                  </p>
                </div>
              ) : (
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
              )}
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
                    {(Array.isArray(auditLogs) ? auditLogs : []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                          Chưa có nhật ký đối soát AI nào được ghi nhận.
                        </td>
                      </tr>
                    ) : (
                      (Array.isArray(auditLogs) ? auditLogs : []).map((log) => (
                        <tr key={log.id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{log.module_name || log.feature_key || 'AI_MODULE'}</td>
                          <td>{log.user_id || 'system'}</td>
                          <td>
                            <span className={(log.confidence_score ?? 1) >= 0.9 ? 'badge badge-green' : 'badge badge-amber'}>
                              {((log.confidence_score ?? 1) * 100).toFixed(0)}%
                            </span>
                          </td>
                          <td>
                            {log.is_modified ? (
                              <span className="badge badge-amber">Có sửa đổi</span>
                            ) : (
                              <span className="badge badge-green">Giữ nguyên AI</span>
                            )}
                          </td>
                          <td style={{ color: 'var(--positive)', fontWeight: 600 }}>${(log.cost_usd || 0).toFixed(4)}</td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                            {log.created_at ? new Date(log.created_at).toLocaleString('vi-VN') : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NGƯỜI DÙNG */}
          {activeTab === 'users' && (() => {
            const pendingUsers = users.filter(u => u.approval_status === 'PENDING' || (!u.is_active && u.approval_status !== 'REJECTED' && u.username !== 'admin'));
            const activeUsers = users.filter(u => u.approval_status !== 'PENDING' && !pendingUsers.some(p => p.id === u.id));
            const filteredActive = activeUsers.filter(u => (u.username || '').toLowerCase().includes(userSearch.toLowerCase()) || (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()));

            return (
              <div>
                {/* Header Tab */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Users size={22} style={{ color: 'var(--accent)' }} /> Quản trị Nhân sự & Phê duyệt Đăng ký
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Mỗi nhân sự tự đăng ký theo chức vụ riêng • Admin xét duyệt và kích hoạt quyền truy cập
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-secondary" onClick={loadUsers} style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                      <RefreshCw size={13} /> Làm mới
                    </button>
                    <button className="btn-primary" onClick={() => setIsAddUserOpen(true)} style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                      <Plus size={15} /> Thêm nhân sự trực tiếp
                    </button>
                  </div>
                </div>

                {/* KHỐI 1: YÊU CẦU ĐĂNG KÝ CHỜ ADMIN DUYỆT (ƯU TIÊN HÀNG ĐẦU) */}
                <div className="card" style={{ padding: '20px', marginBottom: '28px', borderLeft: pendingUsers.length > 0 ? '4px solid var(--warning)' : '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldAlert size={20} style={{ color: pendingUsers.length > 0 ? 'var(--warning)' : 'var(--muted)' }} />
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Yêu Cầu Tự Đăng Ký Chờ Xét Duyệt</h3>
                      <span className={pendingUsers.length > 0 ? 'pill warn' : 'pill neutral'} style={{ fontSize: '0.7rem' }}>
                        {pendingUsers.length} tài khoản chờ duyệt
                      </span>
                    </div>
                  </div>

                  {pendingUsers.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', background: 'var(--raised)', borderRadius: 'var(--radius-control)', border: '1px dashed var(--border)' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                        Hiện không có yêu cầu đăng ký nào đang chờ duyệt. Khi có nhân sự mới tự đăng ký ngoài màn hình đăng nhập, hồ sơ sẽ lập tức hiển thị tại đây để bạn bấm duyệt.
                      </p>
                    </div>
                  ) : (
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tên đăng nhập</th>
                            <th>Họ và tên</th>
                            <th>Số điện thoại</th>
                            <th>Chức vụ xin gia nhập</th>
                            <th>Thời điểm đăng ký</th>
                            <th style={{ textAlign: 'right' }}>Quyết định của Admin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingUsers.map((u) => (
                            <tr key={u.id} style={{ background: 'rgba(245, 158, 11, 0.04)' }}>
                              <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{u.username}</td>
                              <td style={{ fontWeight: 600 }}>{u.full_name}</td>
                              <td style={{ color: 'var(--text-muted)' }}>{u.phone || '-'}</td>
                              <td>
                                <select 
                                  value={u.role_id}
                                  onChange={(e) => {
                                    const newRoleId = Number(e.target.value);
                                    const r = roles.find(item => item.id === newRoleId);
                                    u.role_id = newRoleId;
                                    if (r) u.role = r;
                                    setUsers([...users]);
                                  }}
                                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 600, background: 'var(--raised)' }}
                                  title="Admin có thể đổi chức vụ khác trước khi duyệt"
                                >
                                  {roles.filter(r => r.code !== 'ADMIN').map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} ({r.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ fontSize: '0.75rem', color: 'var(--faint)' }}>
                                {u.registered_at ? new Date(u.registered_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Vừa đăng ký'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '6px 14px', fontSize: '0.75rem', background: 'var(--positive)', borderColor: 'var(--positive)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    onClick={() => handleApproveUser(u)}
                                    title="Duyệt và cấp quyền hoạt động ngay"
                                  >
                                    <Check size={14} /> Duyệt & Kích hoạt
                                  </button>
                                  <button
                                    className="btn-danger"
                                    style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    onClick={() => handleRejectUser(u)}
                                    title="Từ chối yêu cầu đăng ký"
                                  >
                                    <X size={14} /> Từ chối
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* KHỐI 2: DANH SÁCH NHÂN SỰ ĐÃ DUYỆT & ĐANG HOẠT ĐỘNG */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Danh Sách Nhân Sự Đã Kích Hoạt ({filteredActive.length})</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tài khoản hợp lệ đang vận hành trong chuỗi sản xuất</p>
                  </div>
                  <input 
                    className="form-input" 
                    style={{ width: '260px' }} 
                    placeholder="Tìm theo tên đăng nhập, họ tên..." 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                  />
                </div>

                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Tên đăng nhập</th>
                        <th>Họ và tên</th>
                        <th>Số điện thoại</th>
                        <th>Chức vụ / Vai trò</th>
                        <th>Trạng thái</th>
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredActive.map((u) => {
                        const isRejected = u.approval_status === 'REJECTED';
                        const isActive = u.is_active && !isRejected;

                        return (
                          <tr key={u.id}>
                            <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{u.username}</td>
                            <td style={{ fontWeight: 500 }}>{u.full_name}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{u.phone || '-'}</td>
                            <td><span className="badge badge-blue">{u.role ? u.role.name : u.role_id}</span></td>
                            <td>
                              {isRejected ? (
                                <span className="pill neg" style={{ fontSize: '0.7rem' }}>Đã từ chối</span>
                              ) : isActive ? (
                                <span className="pill pos" style={{ fontSize: '0.7rem' }}>Đang hoạt động</span>
                              ) : (
                                <span className="pill warn" style={{ fontSize: '0.7rem' }}>Đã khóa</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              {u.username !== 'admin' && (
                                <div style={{ display: 'inline-flex', gap: '6px' }}>
                                  <button 
                                    className={isActive ? 'btn-danger' : 'btn-secondary'} 
                                    onClick={() => handleToggleUserStatus(u)} 
                                    style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                                  >
                                    {isActive ? 'Khóa' : 'Mở khóa'}
                                  </button>
                                  <button 
                                    className="btn-secondary" 
                                    onClick={() => handleDeleteUser(u)} 
                                    style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--negative)' }}
                                    title="Xóa tài khoản"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} activeTab={activeTab} />
      <ImportExcelModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} token={token} onImportSuccess={() => loadMaterials()} />
      <AddUserModal isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} token={token} roles={roles} onUserAdded={() => loadUsers()} />
      <EditMaterialModal isOpen={!!editingMaterial} onClose={() => setEditingMaterial(null)} token={token} material={editingMaterial} onMaterialUpdated={() => loadMaterials()} />
    </div>
  );
}

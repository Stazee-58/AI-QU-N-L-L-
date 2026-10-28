'use client';
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Award, CheckCircle2, AlertTriangle, ArrowRight, 
  RotateCcw, Sparkles, Clock, Target, Play, ShieldAlert, Check, HelpCircle
} from 'lucide-react';

interface SandboxTrainingProps {
  token: string;
  currentUser: any;
  onNavigateTab: (tab: any) => void;
}

export default function SandboxTrainingView({ token, currentUser, onNavigateTab }: SandboxTrainingProps) {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any | null>(null);
  const [activeSession, setActiveSession] = useState<{
    exerciseId: string;
    startTime: number;
    operationsCount: number;
  } | null>(null);

  const [gradeResult, setGradeResult] = useState<any | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    loadExercises();
  }, [token]);

  const loadExercises = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/sandbox/exercises`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExercises(data);
        if (data.length > 0 && !selectedExercise) {
          setSelectedExercise(data[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartExercise = (ex: any) => {
    setSelectedExercise(ex);
    setActiveSession({
      exerciseId: ex.id,
      startTime: Date.now(),
      operationsCount: 0
    });
    setGradeResult(null);

    // Tự động điều hướng đến màn hình thực hành tương ứng
    if (ex.id === 'EX-01-WAREHOUSE') {
      onNavigateTab('warehouse');
    } else if (ex.id === 'EX-02-FOREMAN') {
      onNavigateTab('foreman_mobile');
    } else if (ex.id === 'EX-03-TECH-ACCOUNTANT') {
      onNavigateTab('settlements');
    } else if (ex.id === 'EX-04-DIRECTOR') {
      onNavigateTab('executive_dashboard');
    }
  };

  const handleGradeCurrent = async () => {
    if (!selectedExercise) return;
    setIsGrading(true);

    const timeTaken = activeSession 
      ? Math.round((Date.now() - activeSession.startTime) / 1000)
      : Math.round(selectedExercise.target_time_seconds * 0.8);
    const ops = activeSession ? Math.max(1, activeSession.operationsCount || 3) : 3;

    try {
      const res = await fetch(`${API_BASE}/api/v1/sandbox/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          exercise_id: selectedExercise.id,
          operations_count: ops,
          time_taken_seconds: timeTaken,
          user_notes: `Thực hiện bài sát hạch ${selectedExercise.title}`
        })
      });

      if (res.ok) {
        const grade = await res.json();
        setGradeResult(grade);
      }
    } catch (err) {
      alert('Không thể chấm điểm bài tập.');
    } finally {
      setIsGrading(false);
    }
  };

  const handleResetSandbox = async () => {
    if (!confirm('Khôi phục toàn bộ môi trường Sandbox về trạng thái chuẩn? Dữ liệu thực hành sẽ được làm mới.')) return;
    setIsResetting(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/sandbox/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Đã khôi phục Sandbox về trạng thái chuẩn thành công!');
        setActiveSession(null);
        setGradeResult(null);
      }
    } catch (err) {
      alert('Không thể khôi phục Sandbox.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={22} style={{ color: 'var(--accent)' }} /> Phòng Thực Hành Sandbox & Sát Hạch Tự Động (G6)
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            Môi trường thực chiến độc lập • Mục tiêu: Nhân viên mới thành thạo trong &le; 1 tuần • Chấm điểm tự động 0-100
          </p>
        </div>
        <button onClick={handleResetSandbox} disabled={isResetting} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
          <RotateCcw size={13} /> {isResetting ? 'Đang khôi phục...' : 'Khôi phục Sandbox'}
        </button>
      </div>

      {/* DANH SÁCH 4 BÀI TẬP SÁT HẠCH THEO VAI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {exercises.map((ex) => {
          const isSelected = selectedExercise?.id === ex.id;
          return (
            <div
              key={ex.id}
              onClick={() => setSelectedExercise(ex)}
              style={{
                background: isSelected ? 'var(--raised)' : 'var(--surface)',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span className="pill neutral" style={{ fontSize: '0.65rem' }}>{ex.role_code}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>&le; {ex.target_time_seconds}s</span>
              </div>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{ex.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.3 }}>{ex.description}</p>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--faint)' }}>Chuẩn: &le; {ex.max_operations} thao tác</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartExercise(ex);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  <Play size={12} /> Bắt đầu làm bài
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* KHỐI CHI TIẾT BÀI TẬP & BẢNG CHẤM ĐIỂM TỰ ĐỘNG */}
      {selectedExercise && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1.2fr) minmax(340px, 1fr)', gap: '20px' }}>
          
          {/* CỘT TRÁI: ĐỀ BÀI VÀ TIÊU CHÍ CHẤM ĐIỂM (RUBRIC) */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Đề Bài Sát Hạch: {selectedExercise.title}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Vai trò áp dụng: <b>{selectedExercise.role_code}</b></p>
              </div>
            </div>

            <div style={{ background: 'var(--raised)', padding: '14px', borderRadius: 'var(--radius-control)', marginBottom: '16px', fontSize: '0.8rem' }}>
              <p style={{ fontWeight: 700, marginBottom: '4px' }}>Mục tiêu nhiệm vụ:</p>
              <p style={{ color: 'var(--muted)', lineHeight: 1.4 }}>{selectedExercise.description}</p>
              <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '0.75rem' }}>
                <span>Giới hạn thao tác: <b>&le; {selectedExercise.max_operations} lần chạm</b></span>
                <span>Thời gian tiêu chuẩn: <b>&le; {selectedExercise.target_time_seconds} giây</b></span>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--faint)', marginBottom: '8px' }}>
                Thang Điểm Đánh Giá Tự Động (100đ):
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(selectedExercise.rubric || {}).map(([k, v]: [string, any]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '0.75rem' }}>
                    <span style={{ fontWeight: 600 }}>{k.toUpperCase()}</span>
                    <span style={{ color: 'var(--muted)' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleStartExercise(selectedExercise)}
                className="btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Play size={16} /> Vào Màn Hình Làm Bài
              </button>
              <button
                onClick={handleGradeCurrent}
                disabled={isGrading}
                className="btn-secondary"
                style={{ flex: 1, padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Award size={16} /> {isGrading ? 'Đang chấm điểm...' : 'Nộp Bài & Chấm Điểm'}
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: KẾT QUẢ CHẤM ĐIỂM TỨC THÌ (AUTO-GRADING RESULT) */}
          <div className="card" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={18} style={{ color: 'var(--accent)' }} /> Kết Quả Đánh Giá Tự Động
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '16px' }}>
              Hệ thống tự động chấm điểm dựa trên nhật ký thao tác thực tế trong Sandbox
            </p>

            {gradeResult ? (
              <div>
                {/* Score Banner */}
                <div style={{
                  background: gradeResult.passed ? 'var(--pill-positive-bg)' : 'var(--pill-warning-bg)',
                  border: `1px solid ${gradeResult.passed ? 'var(--positive)' : 'var(--warning)'}`,
                  color: gradeResult.passed ? 'var(--pill-positive-ink)' : 'var(--pill-warning-ink)',
                  padding: '16px',
                  borderRadius: 'var(--radius-card)',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  <p style={{ fontSize: '2rem', fontWeight: 800 }}>{gradeResult.score} / 100</p>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '2px' }}>
                    {gradeResult.grade_level}
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>{gradeResult.feedback}</p>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '14px', fontSize: '0.75rem' }}>
                  <div style={{ background: 'var(--raised)', padding: '8px 12px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>Số thao tác ghi nhận:</span>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{gradeResult.operations_count} chạm</p>
                  </div>
                  <div style={{ background: 'var(--raised)', padding: '8px 12px', borderRadius: '4px' }}>
                    <span style={{ color: 'var(--muted)' }}>Thời gian thực hiện:</span>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{gradeResult.time_taken_seconds} giây</p>
                  </div>
                </div>

                {/* Các điểm vướng phát hiện (UX Frictions) */}
                {gradeResult.ux_friction_detected && gradeResult.ux_friction_detected.length > 0 && (
                  <div style={{ marginBottom: '14px' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--negative)', marginBottom: '4px' }}>
                      Điểm vướng ghi nhận (Đã hỗ trợ tối ưu giao diện):
                    </p>
                    <ul style={{ margin: '0 0 0 16px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {gradeResult.ux_friction_detected.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Gợi ý cải tiến */}
                {gradeResult.improvement_tips && gradeResult.improvement_tips.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', marginBottom: '4px' }}>
                      Lời khuyên để đạt chuẩn &le; 1 tuần:
                    </p>
                    <ul style={{ margin: '0 0 0 16px', fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {gradeResult.improvement_tips.map((tip: string, i: number) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--muted)' }}>
                <Award size={36} style={{ color: 'var(--faint)', margin: '0 auto 10px' }} />
                <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Chưa có kết quả chấm điểm</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Bấm "Vào Màn Hình Làm Bài" để thực hành, sau đó quay lại bấm "Nộp Bài & Chấm Điểm".
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}


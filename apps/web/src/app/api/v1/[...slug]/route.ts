import { NextRequest, NextResponse } from 'next/server';

// ==============================================================================
// IN-MEMORY SEED STORE (Full functional simulation for Vercel Serverless / Demo)
// Allows 100% features to work standalone without requiring external DB
// If BACKEND_API_URL is configured, proxies to real FastAPI backend.
// ==============================================================================

const BACKEND_URL = process.env.BACKEND_API_URL;

// Roles
const ROLES = [
  { id: 1, code: 'ADMIN', name: 'Quản trị viên hệ thống', permissions: ['*:*'] },
  { id: 2, code: 'DIRECTOR', name: 'Giám đốc / Ban điều hành', permissions: ['project:*', 'quote:approve', 'price:view_cost', 'report:view_all', 'ai:view_audit'] },
  { id: 3, code: 'SALES', name: 'Nhân viên Kinh doanh & Dự án', permissions: ['project:write', 'quote:create', 'boq:view', 'price:view_sale'] },
  { id: 4, code: 'TECH', name: 'Kỹ thuật / Điều hành sản xuất', permissions: ['project:read', 'drawing:parse', 'boq:write', 'norm:write', 'work_order:create'] },
  { id: 5, code: 'FOREMAN', name: 'Quản đốc / Tổ trưởng xưởng', permissions: ['production_log:write', 'work_order:read', 'issue:report'] },
  { id: 6, code: 'WAREHOUSE', name: 'Thủ kho', permissions: ['inventory:read', 'inventory:write', 'material:read'] },
  { id: 7, code: 'SITE', name: 'Điều phối / Thi công lắp đặt', permissions: ['delivery:read', 'acceptance:write', 'site:report'] },
  { id: 8, code: 'ACCOUNTANT', name: 'Kế toán quyết toán', permissions: ['settlement:read', 'settlement:write', 'invoice:audit', 'export:misa'] }
];

// Users
let users = [
  { id: 1, username: 'admin', full_name: 'Quản trị viên Hệ thống Cậu Long', phone: '0901234567', role_id: 1, is_active: true, role: ROLES[0] },
  { id: 2, username: 'director', full_name: 'Giám đốc Nguyễn Văn An', phone: '0901000001', role_id: 2, is_active: true, role: ROLES[1] },
  { id: 3, username: 'kinhdoanh', full_name: 'Kinh doanh Phạm Thị Dung', phone: '0901000002', role_id: 3, is_active: true, role: ROLES[2] },
  { id: 4, username: 'kythuat', full_name: 'Kỹ sư Lê Hoàng Nam', phone: '0901000003', role_id: 4, is_active: true, role: ROLES[3] },
  { id: 5, username: 'totruong', full_name: 'Tổ trưởng xưởng Trần Văn Bình', phone: '0901000004', role_id: 5, is_active: true, role: ROLES[4] },
  { id: 6, username: 'thukho', full_name: 'Thủ kho Lê Văn Chung', phone: '0901000005', role_id: 6, is_active: true, role: ROLES[5] },
  { id: 7, username: 'thicong', full_name: 'Giám sát thi công Vũ Minh Đức', phone: '0901000006', role_id: 7, is_active: true, role: ROLES[6] },
  { id: 8, username: 'ketoan', full_name: 'Kế toán trưởng Hoàng Kim Oanh', phone: '0901000007', role_id: 8, is_active: true, role: ROLES[7] }
];

// Materials Catalog (FastAPI returns List[MaterialResponse] - Array format)
let materials = [
  { id: 1, code: 'VT-THEP-V50', name: 'Thép góc V50x50x5mm', spec: 'Mạ kẽm nhúng nóng, cây tiêu chuẩn 6m', unit: 'Cây', category: 'Thép kết cấu', standard_price: 245000.0, min_stock_alert: 20.0, current_stock: 58.0 },
  { id: 2, code: 'VT-THEP-HOP50', name: 'Thép hộp 50x100 dày 2mm', spec: 'Thép hộp mạ kẽm Hòa Phát, cây 6m', unit: 'Cây', category: 'Thép kết cấu', standard_price: 380000.0, min_stock_alert: 15.0, current_stock: 34.0 },
  { id: 3, code: 'VT-INOX-304', name: 'Tấm Inox 304 xước dày 1.5mm', spec: 'Khổ 1220x2440mm bọc màng PE', unit: 'Tấm', category: 'Inox', standard_price: 850000.0, min_stock_alert: 5.0, current_stock: 12.0 },
  { id: 4, code: 'VT-SON-EPOXY', name: 'Sơn Epoxy chống gỉ 2 thành phần', spec: 'Thùng 20L màu ghi xám', unit: 'Thùng', category: 'Sơn & Hóa chất', standard_price: 1250000.0, min_stock_alert: 4.0, current_stock: 9.0 }
];

// Norms
const norms = [
  { id: 1, product_type: 'Cổng nhôm đúc', component_name: 'Khung viền chính', material_code: 'VT-THEP-V50', quantity_per_unit: 0.5, unit: 'Cây/m2', scrap_rate: 0.05 },
  { id: 2, product_type: 'Khung dầm thép', component_name: 'Dầm giằng ngang', material_code: 'VT-THEP-HOP50', quantity_per_unit: 1.2, unit: 'Cây/bộ', scrap_rate: 0.03 },
  { id: 3, product_type: 'Lan can Inox', component_name: 'Tay vịn & nan đứng', material_code: 'VT-INOX-304', quantity_per_unit: 0.25, unit: 'Tấm/m', scrap_rate: 0.08 }
];

// Work Orders (G2)
let workOrders = [
  {
    id: 1,
    code: 'LSX-2026-001',
    project_id: 1,
    project_code: 'DA-2026-001',
    project_name: 'Cổng nhôm đúc Biệt thự Cậu Long',
    product_name: 'Cổng nhôm đúc 4 cánh hoa văn rồng',
    target_qty: 4.0,
    completed_qty: 3.0,
    unit: 'Bộ',
    start_date: '2026-10-18',
    due_date: '2026-10-30',
    assigned_foreman_id: 5,
    foreman_name: 'Tổ trưởng xưởng Trần Văn Bình',
    status: 'IN_PROGRESS',
    risk_level: 'NORMAL',
    risk_reason: null,
    progress_percent: 75.0,
    progress_pct: 75.0,
    bom_snapshot: { materials: [{ material_code: 'VT-THEP-V50', norm_per_unit: 0.5, total_required: 2.0 }] }
  },
  {
    id: 2,
    code: 'LSX-2026-002',
    project_id: 2,
    project_code: 'DA-2026-002',
    project_name: 'Khung thép tiền chế Xưởng Tân Bình',
    product_name: 'Khung dầm thép chịu lực I-300',
    target_qty: 50.0,
    completed_qty: 15.0,
    unit: 'Cấu kiện',
    start_date: '2026-10-13',
    due_date: '2026-10-26',
    assigned_foreman_id: 5,
    foreman_name: 'Tổ trưởng xưởng Trần Văn Bình',
    status: 'IN_PROGRESS',
    risk_level: 'CRITICAL',
    risk_reason: 'Đã quá hạn giao 2 ngày! Thiếu phôi thép góc V50 và kẹt máy cắt',
    progress_percent: 30.0,
    progress_pct: 30.0,
    bom_snapshot: { materials: [{ material_code: 'VT-THEP-V50', norm_per_unit: 0.4, total_required: 20.0 }] }
  },
  {
    id: 3,
    code: 'LSX-2026-003',
    project_id: 3,
    project_code: 'DA-2026-003',
    project_name: 'Lan can Inox Khách sạn Riverside',
    product_name: 'Lan can Inox 304 uốn cong nghệ thuật',
    target_qty: 80.0,
    completed_qty: 25.0,
    unit: 'Mét',
    start_date: '2026-10-23',
    due_date: '2026-10-30',
    assigned_foreman_id: 5,
    foreman_name: 'Tổ trưởng xưởng Trần Văn Bình',
    status: 'IN_PROGRESS',
    risk_level: 'WARNING',
    risk_reason: 'Chỉ còn 2 ngày, thiếu sơn Epoxy xám và nhân công hàn bận ca khác',
    progress_percent: 31.25,
    progress_pct: 31.25,
    bom_snapshot: { materials: [{ material_code: 'VT-INOX-304', norm_per_unit: 0.25, total_required: 20.0 }] }
  }
];

// Production Logs (G2)
let productionLogs = [
  {
    id: 1,
    work_order_id: 1,
    work_order_code: 'LSX-2026-001',
    project_id: 1,
    project_code: 'DA-2026-001',
    foreman_id: 5,
    shift_date: '2026-10-28',
    shift_type: 'DAY',
    stage_name: 'Sơn',
    completed_qty: 1.0,
    worker_count: 4,
    total_man_hours: 32.0,
    issues_reported: null,
    raw_message: 'Sơn phủ hoàn thiện 1 bộ cổng nhôm biệt thự',
    ai_confidence: 0.95,
    status: 'VERIFIED'
  },
  {
    id: 2,
    work_order_id: 2,
    work_order_code: 'LSX-2026-002',
    project_id: 2,
    project_code: 'DA-2026-002',
    foreman_id: 5,
    shift_date: '2026-10-28',
    shift_type: 'DAY',
    stage_name: 'Cắt',
    completed_qty: 5.0,
    worker_count: 3,
    total_man_hours: 24.0,
    issues_reported: 'Máy cắt CNC kẹt bàn đẩy 45 phút',
    raw_message: 'Cắt được 5 cây dầm thì máy cắt trục trặc',
    ai_confidence: 0.92,
    status: 'VERIFIED'
  }
];

// Daily Summaries (G2) - Nested 3 versions according to DailySummaryResponse schema
let dailySummary = {
  shift_date: '2026-10-28',
  generated_at: new Date().toISOString(),
  director_summary: {
    title: 'BÁO CÁO ĐIỀU HÀNH SÁNG 28/10/2026',
    kpis: {
      total_active_orders: 3,
      delayed_risk_count: 2,
      today_logs_count: 3,
      today_units_completed: 6,
      today_man_hours: 56.0,
      estimated_wip_value: 1250000000.0
    },
    critical_alerts: [
      'Đơn LSX-2026-002 (Khung dầm thép chịu lực I-300): Đã quá hạn giao 2 ngày! Thiếu phôi thép góc V50 và kẹt máy cắt CNC',
      'Đơn LSX-2026-003 (Lan can Inox 304 uốn cong nghệ thuật): Chỉ còn 2 ngày, thiếu sơn Epoxy xám và nhân công hàn bận ca khác'
    ],
    waiting_approval: [
      'Báo giá Dự án Biệt thự Cậu Long (145.000.000đ) chờ duyệt',
      'Phiếu xuất kho vượt định mức LSX-002 (thêm 3 cây thép V50)'
    ],
    one_sentence_takeaway: 'Xưởng đang vận hành 3 đơn hàng. Có 2 đơn cần can thiệp xử lý gấp để tránh trễ cam kết giao hàng.'
  },
  tech_summary: {
    title: 'BẢNG ĐIỀU HÀNH KỸ THUẬT & TIẾN ĐỘ XƯỞNG (28/10/2026)',
    stages: {
      'Cắt': { qty: 5.0, hours: 24.0, workers: 3 },
      'Hàn': { qty: 10.0, hours: 36.0, workers: 4 },
      'Sơn': { qty: 1.0, hours: 32.0, workers: 4 },
      'Lắp ráp': { qty: 3.0, hours: 20.0, workers: 3 },
      'Đóng gói': { qty: 0.0, hours: 0.0, workers: 0 }
    },
    reported_issues: [
      { work_order: 'LSX-2026-002', foreman: 'Tổ trưởng xưởng Trần Văn Bình', issue: 'Máy cắt CNC kẹt bàn đẩy 45 phút' },
      { work_order: 'LSX-2026-003', foreman: 'Tổ trưởng xưởng Trần Văn Bình', issue: 'Hết que hàn Inox đặc biệt' }
    ],
    logs_detail: []
  },
  sales_summary: {
    title: 'VIỆC CẦN LÀM HÔM NAY DÀNH CHO KINH DOANH (28/10/2026)',
    ready_to_dispatch: [
      {
        customer: 'Ông Long (Quận 7, TP.HCM)',
        phone: '0908889999',
        order_code: 'LSX-2026-001',
        product: 'Cổng nhôm đúc 4 cánh hoa văn rồng',
        progress: '75%',
        action: 'Gọi khách xác nhận ngày giờ bàn giao và khảo sát vị trí lắp đặt'
      }
    ],
    need_customer_call: [
      {
        customer: 'Công ty TNHH Tân Bình',
        phone: '0907776655',
        order_code: 'LSX-2026-002',
        product: 'Khung dầm thép chịu lực I-300',
        reason: 'Đã quá hạn giao 2 ngày! Thiếu phôi thép góc V50 và kẹt máy cắt CNC',
        action: 'Chủ động gọi xin gia hạn tiến độ giao dầm thêm 3 ngày'
      },
      {
        customer: 'Tập đoàn Riverside',
        phone: '0903332211',
        order_code: 'LSX-2026-003',
        product: 'Lan can Inox 304 uốn cong nghệ thuật',
        reason: 'Chỉ còn 2 ngày, thiếu sơn Epoxy xám và nhân công hàn bận ca khác',
        action: 'Cập nhật tình hình nghiệm thu màu sơn vào chiều nay'
      }
    ],
    action_count: 3
  },
  delayed_orders: []
};

// Inventory Transactions (G3)
let inventoryTransactions = [
  {
    id: 1,
    transaction_code: 'PNK-2026-001',
    material_id: 1,
    material_code: 'VT-THEP-V50',
    material_name: 'Thép góc V50x50x5mm',
    transaction_type: 'IN',
    quantity: 50.0,
    unit: 'Cây',
    unit_price: 245000.0,
    total_amount: 12250000.0,
    project_code: 'DA-2026-002',
    reference_code: 'PO-2026-001',
    performed_by: 6,
    operator_name: 'Lê Văn Chung',
    notes: 'Nhập kho đợt 1 từ Thép Hòa Phát',
    created_at: '2026-10-27T09:30:00Z'
  },
  {
    id: 2,
    transaction_code: 'PXK-2026-001',
    material_id: 1,
    material_code: 'VT-THEP-V50',
    material_name: 'Thép góc V50x50x5mm',
    transaction_type: 'OUT',
    quantity: 12.0,
    unit: 'Cây',
    unit_price: 245000.0,
    total_amount: 2940000.0,
    project_code: 'DA-2026-002',
    reference_code: 'LSX-2026-002',
    performed_by: 6,
    operator_name: 'Lê Văn Chung',
    notes: 'Xuất phôi cho tổ cắt gia công',
    created_at: '2026-10-28T08:00:00Z'
  }
];

// Settlements (G5) - Matches ProjectSettlementResponse schema with materials_detail and labor_detail
let settlements = [
  {
    id: 'DA-2026-001',
    project_id: 'DA-2026-001',
    project_code: 'DA-2026-001',
    project_name: 'Cổng nhôm đúc Biệt thự Cậu Long',
    customer_name: 'Ông Long (Quận 7, TP.HCM)',
    customer_phone: '0908889999',
    contract_value: 350000000.0,
    estimated_cost: 250000000.0,
    actual_material_cost: 180000000.0,
    actual_labor_cost: 65000000.0,
    actual_subcontractor_cost: 15000000.0,
    actual_other_cost: 15000000.0,
    total_actual_cost: 260000000.0,
    gross_profit: 90000000.0,
    profit_margin_pct: 25.71,
    margin_pct: 25.71,
    amount_paid: 280000000.0,
    remaining_receivable: 70000000.0,
    status: 'READY_FOR_FINALIZATION',
    acceptance_status: 'ACCEPTED',
    acceptance_date: '2026-10-28',
    acceptance_notes: 'Nghiệm thu đạt chuẩn bề mặt sơn và khớp khóa tự động.',
    materials_detail: [
      {
        material_code: 'VT-THEP-V50',
        material_name: 'Thép góc V50x50x5mm',
        unit: 'Cây',
        norm_qty: 20.0,
        actual_issued_qty: 20.0,
        variance_qty: 0.0,
        variance_pct: 0.0,
        unit_price: 245000.0,
        actual_cost: 4900000.0,
        is_over_budget: false
      },
      {
        material_code: 'VT-SON-EPOXY',
        material_name: 'Sơn Epoxy chống gỉ 2 thành phần',
        unit: 'Thùng',
        norm_qty: 4.0,
        actual_issued_qty: 3.5,
        variance_qty: -0.5,
        variance_pct: -12.5,
        unit_price: 1250000.0,
        actual_cost: 4375000.0,
        is_over_budget: false
      }
    ],
    labor_detail: [
      {
        work_order_code: 'LSX-2026-001',
        stage_name: 'Sơn phủ hoàn thiện',
        shift_count: 2,
        total_man_hours: 32.0,
        hourly_rate: 50000.0,
        labor_cost: 1600000.0
      },
      {
        work_order_code: 'LSX-2026-001',
        stage_name: 'Lắp ráp cánh cổng',
        shift_count: 3,
        total_man_hours: 48.0,
        hourly_rate: 50000.0,
        labor_cost: 2400000.0
      }
    ],
    warnings: [
      'Tiết kiệm 5% chi phí nhân công so với định mức ban đầu nhờ tối ưu ca.'
    ]
  },
  {
    id: 'DA-2026-002',
    project_id: 'DA-2026-002',
    project_code: 'DA-2026-002',
    project_name: 'Khung thép tiền chế Xưởng Tân Bình',
    customer_name: 'Công ty TNHH Tân Bình',
    customer_phone: '0907776655',
    contract_value: 680000000.0,
    estimated_cost: 500000000.0,
    actual_material_cost: 395000000.0,
    actual_labor_cost: 120000000.0,
    actual_subcontractor_cost: 30000000.0,
    actual_other_cost: 30000000.0,
    total_actual_cost: 545000000.0,
    gross_profit: 135000000.0,
    profit_margin_pct: 19.85,
    margin_pct: 19.85,
    amount_paid: 400000000.0,
    remaining_receivable: 280000000.0,
    status: 'IN_PROGRESS',
    acceptance_status: 'PENDING',
    acceptance_date: null,
    acceptance_notes: null,
    materials_detail: [
      {
        material_code: 'VT-THEP-V50',
        material_name: 'Thép góc V50x50x5mm',
        unit: 'Cây',
        norm_qty: 20.0,
        actual_issued_qty: 23.0,
        variance_qty: 3.0,
        variance_pct: 15.0,
        unit_price: 245000.0,
        actual_cost: 5635000.0,
        is_over_budget: true,
        warning_reason: 'Cắt bù 3 cây do máy CNC kẹt bàn đẩy làm hỏng phôi'
      }
    ],
    labor_detail: [
      {
        work_order_code: 'LSX-2026-002',
        stage_name: 'Cắt phôi thép',
        shift_count: 4,
        total_man_hours: 64.0,
        hourly_rate: 50000.0,
        labor_cost: 3200000.0
      }
    ],
    warnings: [
      'Phát sinh vượt định mức 3 cây thép V50 do sự cố kẹt máy cắt CNC.',
      'Biên lợi nhuận dự kiến giảm 1.5% so với báo giá ban đầu.'
    ]
  },
  {
    id: 'DA-2026-003',
    project_id: 'DA-2026-003',
    project_code: 'DA-2026-003',
    project_name: 'Lan can Inox Khách sạn Riverside',
    customer_name: 'Tập đoàn Riverside',
    customer_phone: '0903332211',
    contract_value: 220000000.0,
    estimated_cost: 150000000.0,
    actual_material_cost: 110000000.0,
    actual_labor_cost: 45000000.0,
    actual_subcontractor_cost: 10000000.0,
    actual_other_cost: 10000000.0,
    total_actual_cost: 165000000.0,
    gross_profit: 55000000.0,
    profit_margin_pct: 25.0,
    margin_pct: 25.0,
    amount_paid: 150000000.0,
    remaining_receivable: 70000000.0,
    status: 'IN_PROGRESS',
    acceptance_status: 'PENDING',
    acceptance_date: null,
    acceptance_notes: null,
    materials_detail: [
      {
        material_code: 'VT-INOX-304',
        material_name: 'Tấm Inox 304 xước dày 1.5mm',
        unit: 'Tấm',
        norm_qty: 10.0,
        actual_issued_qty: 10.0,
        variance_qty: 0.0,
        variance_pct: 0.0,
        unit_price: 850000.0,
        actual_cost: 8500000.0,
        is_over_budget: false
      }
    ],
    labor_detail: [
      {
        work_order_code: 'LSX-2026-003',
        stage_name: 'Uốn cong nghệ thuật',
        shift_count: 2,
        total_man_hours: 36.0,
        hourly_rate: 50000.0,
        labor_cost: 1800000.0
      }
    ],
    warnings: []
  }
];

// Sandbox Exercises (G6)
let sandboxExercises = [
  {
    id: 'EX-WH-01',
    role_code: 'WAREHOUSE',
    title: 'Thủ kho mới: Quét OCR phiếu nhập & Sửa lỗi lệch giá trong <= 3 chạm',
    description: 'Thực hành quét phiếu nhập kho có 1 dòng sai đơn giá so với catalog chuẩn. Nhiệm vụ: Xác nhận phiếu, bấm nút áp giá chuẩn 1 chạm và hoàn tất ghi thẻ kho trong <= 3 thao tác.',
    target_time_seconds: 60,
    max_operations: 3,
    rubric: {
      ocr_accuracy: 'Trích xuất chính xác số lượng và mã vật tư (30đ)',
      correction_action: 'Phát hiện ô cảnh báo và áp giá chuẩn thành công (40đ)',
      operations_limit: 'Hoàn tất trong <= 3 thao tác chạm (30đ)'
    }
  },
  {
    id: 'EX-FM-01',
    role_code: 'FOREMAN',
    title: 'Quản đốc: Báo cáo ca sản xuất bằng giọng nói / tin nhắn nhanh',
    description: 'Nhập tin nhắn ca xưởng: Chọn LSX, chọn công đoạn xong và báo cáo máy cắt kẹt trong <= 3 lần chạm.',
    target_time_seconds: 45,
    max_operations: 3,
    rubric: {
      input_speed: 'Nhập nội dung dưới 45 giây (30đ)',
      data_precision: 'Ghi nhận đủ mã LSX và số lượng hoàn thành (40đ)',
      operations_limit: 'Hoàn tất trong <= 3 lần chạm (30đ)'
    }
  },
  {
    id: 'EX-AC-01',
    role_code: 'ACCOUNTANT',
    title: 'Kế toán: Đối chiếu lãi gộp & Khóa sổ nghiệm thu DA-001',
    description: 'Kiểm tra 3 nguồn chi phí (vật tư, nhân công, thầu phụ), đối chiếu biên lãi gộp dự án Cổng nhôm và thực hiện Khóa sổ quyết toán.',
    target_time_seconds: 90,
    max_operations: 4,
    rubric: {
      audit_precision: 'Đối chiếu đúng chênh lệch thực tế vs dự toán (40đ)',
      finalization: 'Thực hiện thao tác Khóa sổ quyết toán hợp lệ (30đ)',
      operations_limit: 'Hoàn tất trong <= 4 thao tác (30đ)'
    }
  }
];

// AI Settings (Kill-switch Oversight)
let aiSettings = [
  {
    feature_key: 'BOQ_EXTRACTION',
    feature_name: 'Bóc tách bản vẽ & Đề xuất bảng BOQ',
    permission_level: 1,
    is_enabled: true,
    provider: 'gemini',
    model_name: 'gemini-2.0-flash',
    monthly_budget_usd: 25.0
  },
  {
    feature_key: 'INVENTORY_OCR',
    feature_name: 'OCR trích xuất phiếu nhập/xuất kho (G3)',
    permission_level: 2,
    is_enabled: true,
    provider: 'gemini',
    model_name: 'gemini-2.0-flash',
    monthly_budget_usd: 20.0
  },
  {
    feature_key: 'PRODUCTION_LOG',
    feature_name: 'Chuẩn hóa tin nhắn báo cáo ca sản xuất (G2)',
    permission_level: 2,
    is_enabled: true,
    provider: 'gemini',
    model_name: 'gemini-2.0-flash',
    monthly_budget_usd: 10.0
  },
  {
    feature_key: 'DAILY_SUMMARY',
    feature_name: 'Tổng hợp báo cáo điều hành tự động sáng/chiều',
    permission_level: 3,
    is_enabled: true,
    provider: 'gemini',
    model_name: 'gemini-2.0-flash',
    monthly_budget_usd: 5.0
  }
];

// AI Audit Logs (Matches AIAuditResponse schema with module_name and cost_usd)
let aiAuditLogs = [
  {
    id: 'AUD-001',
    module_name: 'INVENTORY_OCR',
    feature_key: 'INVENTORY_OCR',
    user_id: 'thukho',
    project_id: 'DA-2026-002',
    action_type: 'OCR_PARSE',
    input_text: 'Hóa đơn GTGT số 0045231 Công ty CP Thép Hòa Phát',
    parsed_output: { items: 2, total: 42750000 },
    confidence_score: 0.94,
    is_modified: false,
    cost_usd: 0.0025,
    latency_ms: 650,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'AUD-002',
    module_name: 'PRODUCTION_LOG',
    feature_key: 'PRODUCTION_LOG',
    user_id: 'totruong',
    project_id: 'DA-2026-002',
    action_type: 'TEXT_STANDARDIZATION',
    input_text: 'Tổ 1 cắt được 5 cây dầm thì máy cắt trục trặc',
    parsed_output: { wo: 'LSX-2026-002', qty: 5, stage: 'Cắt' },
    confidence_score: 0.96,
    is_modified: false,
    cost_usd: 0.0018,
    latency_ms: 480,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'AUD-003',
    module_name: 'BOQ_EXTRACTION',
    feature_key: 'BOQ_EXTRACTION',
    user_id: 'kythuat',
    project_id: 'DA-2026-001',
    action_type: 'BOQ_PARSE',
    input_text: 'Bản vẽ cổng nhôm đúc 4 cánh hoa văn rồng CAD',
    parsed_output: { materials_found: 4, confidence: 0.92 },
    confidence_score: 0.92,
    is_modified: true,
    cost_usd: 0.0042,
    latency_ms: 1200,
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

// ==============================================================================
// MAIN HANDLER
// ==============================================================================

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join('/');

  // 1. Auth check / me
  if (path === 'auth/me') {
    return NextResponse.json(users[0]);
  }

  // 2. Roles
  if (path === 'roles') {
    return NextResponse.json(ROLES);
  }

  // 3. Users
  if (path === 'users') {
    return NextResponse.json(users);
  }

  // 4. Materials (Returns Array to match FastAPI List[MaterialResponse])
  if (path === 'materials') {
    return NextResponse.json(materials);
  }

  // 5. Norms
  if (path === 'norms') {
    return NextResponse.json(norms);
  }

  // 6. Production Work Orders
  if (path === 'production/work-orders') {
    return NextResponse.json(workOrders);
  }

  // 7. Production Daily Summary
  if (path === 'production/daily-summary') {
    return NextResponse.json(dailySummary);
  }

  // 8. Production Logs
  if (path === 'production/logs') {
    return NextResponse.json(productionLogs);
  }

  // 9. Inventory Alerts
  if (path === 'inventory/alerts') {
    return NextResponse.json({
      alerts: [
        {
          material_code: 'VT-THEP-V50',
          material_name: 'Thép góc V50x50x5mm',
          current_stock: 58.0,
          min_stock: 20.0,
          alert_type: 'EXCESS_OR_SLOW',
          severity: 'WARNING',
          message: 'Tồn đọng > 45 ngày: Còn 58 cây chưa xuất cho dự án mới'
        },
        {
          material_code: 'VT-SON-EPOXY',
          material_name: 'Sơn Epoxy chống gỉ',
          current_stock: 3.0,
          min_stock: 4.0,
          alert_type: 'LOW_STOCK',
          severity: 'CRITICAL',
          message: 'Dưới mức an toàn: Hiện còn 3/4 thùng (Cần cho LSX-003)'
        }
      ]
    });
  }

  // 10. Inventory Purchase Suggestions
  if (path === 'inventory/purchase-suggestions') {
    return NextResponse.json({
      suggestions: [
        {
          material_code: 'VT-THEP-V50',
          material_name: 'Thép góc V50x50x5mm',
          required_quantity: 60.0,
          suggested_quantity: 100.0,
          estimated_unit_price: 245000.0,
          estimated_total: 24500000.0,
          reason: 'Cung ứng gấp cho LSX-2026-002 đang quá hạn',
          supplier: 'Công ty Cổ phần Thép Hòa Phát'
        }
      ]
    });
  }

  // 11. Inventory Transactions
  if (path === 'inventory/transactions') {
    return NextResponse.json(inventoryTransactions);
  }

  // 12. Settlements
  if (path === 'settlements') {
    return NextResponse.json(settlements);
  }

  // 13. Settlement Export
  if (slug[0] === 'settlements' && slug[2] === 'export') {
    const pCode = slug[1];
    const s = settlements.find(it => it.project_id === pCode) || settlements[0];
    return NextResponse.json({
      project_code: s.project_code,
      project_name: s.project_name,
      contract_value: s.contract_value,
      gross_profit: s.gross_profit,
      profit_margin_pct: s.profit_margin_pct,
      misa_export_status: 'EXPORTED_XML_READY',
      export_timestamp: new Date().toISOString()
    });
  }

  // 14. Sandbox Exercises
  if (path === 'sandbox/exercises') {
    return NextResponse.json(sandboxExercises);
  }

  // 15. AI Settings
  if (path === 'ai-settings') {
    return NextResponse.json(aiSettings);
  }

  // 16. AI Audit Logs
  if (path === 'ai-audit') {
    return NextResponse.json(aiAuditLogs);
  }

  return NextResponse.json({ message: `Path ${path} received` }, { status: 200 });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join('/');
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {
    // Empty body
  }

  // 1. Auth login
  if (path === 'auth/login') {
    const { username } = body;
    const user = users.find(u => u.username.toLowerCase() === (username || '').toLowerCase()) || users[0];
    return NextResponse.json({
      access_token: `token-cau-long-${user.username}-${Date.now()}`,
      token_type: 'bearer',
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role
    });
  }

  // 2. Add User
  if (path === 'users') {
    const role = ROLES.find(r => r.id === Number(body.role_id)) || ROLES[0];
    const newUser = {
      id: users.length + 1,
      username: body.username,
      full_name: body.full_name,
      phone: body.phone,
      role_id: role.id,
      is_active: true,
      role
    };
    users.push(newUser);
    return NextResponse.json(newUser, { status: 201 });
  }

  // 3. Trigger Daily Summary
  if (path === 'production/trigger-daily-summary') {
    dailySummary.generated_at = new Date().toISOString();
    return NextResponse.json(dailySummary);
  }

  // 4. Parse Foreman Speech/Text (G2)
  if (path === 'production/parse-message') {
    const raw = body.raw_text || '';
    let wo = 'LSX-2026-001';
    let qty = 1.0;
    let stage = 'Lắp ráp';
    if (raw.includes('002') || raw.toLowerCase().includes('dầm')) {
      wo = 'LSX-2026-002';
      qty = 5.0;
      stage = 'Cắt';
    } else if (raw.includes('003') || raw.toLowerCase().includes('lan can')) {
      wo = 'LSX-2026-003';
      qty = 10.0;
      stage = 'Hàn';
    }

    return NextResponse.json({
      work_order_code: wo,
      stage_name: stage,
      completed_qty: qty,
      worker_count: 4,
      total_man_hours: 32.0,
      issues_reported: raw.includes('kẹt') || raw.includes('hỏng') ? 'Máy cắt kẹt bàn trượt' : null,
      ai_confidence: 0.95
    });
  }

  // 5. Add Production Log
  if (path === 'production/logs') {
    const newLog = {
      id: productionLogs.length + 1,
      work_order_id: body.work_order_id || 1,
      work_order_code: body.work_order_code || 'LSX-2026-001',
      project_id: 1,
      project_code: 'DA-2026-001',
      foreman_id: 5,
      shift_date: '2026-10-28',
      shift_type: 'DAY',
      stage_name: body.stage_name || 'Lắp ráp',
      completed_qty: Number(body.completed_qty) || 1.0,
      worker_count: Number(body.worker_count) || 4,
      total_man_hours: Number(body.total_man_hours) || 32.0,
      issues_reported: body.issues_reported || null,
      raw_message: body.raw_message || 'Báo cáo ca qua giao diện mobile',
      ai_confidence: 0.96,
      status: 'VERIFIED'
    };
    productionLogs.unshift(newLog);
    return NextResponse.json(newLog, { status: 201 });
  }

  // 6. OCR Receipt Parsing (G3)
  if (path === 'inventory/ocr-receipt') {
    return NextResponse.json({
      ocr_confidence_score: 0.94,
      suggested_project_id: 2,
      suggested_project_code: 'DA-2026-002',
      receipt_number: 'HD-2026-0452',
      vendor_name: 'Công ty Cổ phần Thép Hòa Phát',
      items: [
        {
          material_code: 'VT-THEP-V50',
          material_name: 'Thép góc V50x50x5mm',
          quantity: 100.0,
          unit: 'Cây',
          unit_price: 245000.0,
          total_amount: 24500000.0,
          confidence_qty: 0.98,
          confidence_price: 0.95,
          flag_reason: null
        },
        {
          material_code: 'VT-THEP-HOP50',
          material_name: 'Thép hộp 50x100 dày 2mm',
          quantity: 50.0,
          unit: 'Cây',
          unit_price: 395000.0,
          total_amount: 19750000.0,
          confidence_qty: 0.96,
          confidence_price: 0.65,
          flag_reason: 'Lệch giá: Đơn giá hóa đơn (395.000đ) cao hơn giá chuẩn catalog (380.000đ)'
        }
      ]
    });
  }

  // 7. Inventory Batch Transactions (G3)
  if (path === 'inventory/batch-transactions') {
    const items = body.items || [];
    items.forEach((it: any) => {
      const tx = {
        id: inventoryTransactions.length + 1,
        transaction_code: `PNK-2026-00${inventoryTransactions.length + 1}`,
        material_id: 1,
        material_code: it.material_code,
        material_name: it.material_name,
        transaction_type: body.receipt_type || 'IN',
        quantity: Number(it.quantity) || 0,
        unit: it.unit || 'Cây',
        unit_price: Number(it.unit_price) || 0,
        total_amount: (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
        project_code: body.project_code || 'DA-2026-002',
        reference_code: body.receipt_number || 'PNK-G3-OCR',
        performed_by: 6,
        operator_name: 'Lê Văn Chung',
        notes: 'Xác nhận nhập kho từ OCR phiếu thông minh',
        created_at: new Date().toISOString()
      };
      inventoryTransactions.unshift(tx);

      // Cập nhật tồn kho thực tế
      const mat = materials.find(m => m.code === it.material_code);
      if (mat) {
        if (body.receipt_type === 'OUT') mat.current_stock -= tx.quantity;
        else mat.current_stock += tx.quantity;
      }
    });

    return NextResponse.json({ message: 'Lưu kho thành công', count: items.length }, { status: 201 });
  }

  // 8. Manual Inventory Transaction (G3)
  if (path === 'inventory/manual-transaction') {
    const tx = {
      id: inventoryTransactions.length + 1,
      transaction_code: body.transaction_type === 'IN' ? `PNK-2026-00${inventoryTransactions.length + 1}` : `PXK-2026-00${inventoryTransactions.length + 1}`,
      material_id: body.material_id || 1,
      material_code: body.material_code || 'VT-THEP-V50',
      material_name: body.material_name || 'Thép góc V50x50x5mm',
      transaction_type: body.transaction_type || 'IN',
      quantity: Number(body.quantity) || 1,
      unit: body.unit || 'Cây',
      unit_price: Number(body.unit_price) || 245000,
      total_amount: (Number(body.quantity) || 1) * (Number(body.unit_price) || 245000),
      project_code: body.project_code || 'DA-2026-001',
      reference_code: body.reference_code || 'MANUAL-ENTRY',
      performed_by: 6,
      operator_name: 'Lê Văn Chung',
      notes: body.notes || 'Nhập thẻ kho thủ công',
      created_at: new Date().toISOString()
    };
    inventoryTransactions.unshift(tx);
    return NextResponse.json(tx, { status: 201 });
  }

  // 9. Settlement Finalize (G5)
  if (slug[0] === 'settlements' && slug[2] === 'finalize') {
    const pCode = slug[1];
    const target = settlements.find(s => s.project_id === pCode);
    if (target) {
      target.status = 'FINALIZED';
      target.acceptance_status = 'ACCEPTED';
      target.acceptance_date = new Date().toISOString().split('T')[0];
    }
    return NextResponse.json({ message: 'Quyết toán thành công', settlement: target });
  }

  // 10. Sandbox Grade (G6)
  if (path === 'sandbox/grade') {
    const ops = Number(body.operations_count) || 2;
    const time = Number(body.duration_seconds) || 40;
    const exId = body.exercise_id || 'EX-WH-01';

    let score = 95;
    let feedback = 'Thao tác chuẩn mực, hoàn thành trong định mức thời gian và thao tác!';
    if (ops > 3) {
      score -= (ops - 3) * 10;
      feedback = 'Vượt quá số lượt thao tác tiêu chuẩn (tối đa 3 thao tác). Cần rèn luyện lại.';
    }

    return NextResponse.json({
      exercise_id: exId,
      score: Math.max(score, 60),
      passed: score >= 85,
      feedback,
      operations_count: ops,
      duration_seconds: time,
      graded_at: new Date().toISOString()
    });
  }

  // 11. Sandbox Reset
  if (path === 'sandbox/reset') {
    return NextResponse.json({ message: 'Đã thiết lập lại dữ liệu phòng thực hành Sandbox' });
  }

  return NextResponse.json({ message: 'Success' }, { status: 200 });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  const path = slug.join('/');
  let body: any = {};
  try {
    body = await req.json();
  } catch (e) {}

  // 1. Toggle AI Kill-Switch
  if (slug[0] === 'ai-settings' && slug[1]) {
    const key = slug[1];
    const item = aiSettings.find(s => s.feature_key === key);
    if (item) {
      item.is_enabled = body.is_enabled !== undefined ? body.is_enabled : !item.is_enabled;
      return NextResponse.json(item);
    }
  }

  // 2. Update user status
  if (slug[0] === 'users' && slug[1]) {
    const uid = Number(slug[1]);
    const u = users.find(it => it.id === uid);
    if (u) {
      if (body.is_active !== undefined) u.is_active = body.is_active;
      return NextResponse.json(u);
    }
  }

  // 3. Update material
  if (slug[0] === 'materials' && slug[1]) {
    const mid = Number(slug[1]);
    const m = materials.find(it => it.id === mid);
    if (m) {
      Object.assign(m, body);
      return NextResponse.json(m);
    }
  }

  return NextResponse.json({ message: `PUT ${path} updated` }, { status: 200 });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const slug = params.slug || [];
  if (slug[0] === 'users' && slug[1]) {
    const uid = Number(slug[1]);
    users = users.filter(it => it.id !== uid);
    return NextResponse.json({ message: 'User deleted' });
  }

  if (slug[0] === 'materials' && slug[1]) {
    const mid = Number(slug[1]);
    materials = materials.filter(it => it.id !== mid);
    return NextResponse.json({ message: 'Material deleted' });
  }

  return NextResponse.json({ message: 'Deleted' }, { status: 200 });
}

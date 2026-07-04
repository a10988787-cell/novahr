'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// ==========================================
// 1. Core Interfaces matching @novahr/shared-types
// ==========================================

export enum Role {
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  HR = 'HR',
}

export enum LeaveType {
  PAID = 'PAID',
  SICK = 'SICK',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  HALF_DAY = 'HALF_DAY',
  LEAVE = 'LEAVE',
}

export interface UserProfile {
  id: string;
  employeeCode: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  managerId: string | null;
  phone: string | null;
  address: string | null;
  photoUrl: string | null;
  status: 'active' | 'inactive';
  skills: { name: string; level: number }[];
  documents: { id: string; name: string; type: string; url: string; ocrData?: any; uploadedAt: string }[];
  versionHistory: { version: number; date: string; updatedBy: string; changes: string }[];
}

export interface LeaveBalance {
  leaveType: LeaveType;
  allotted: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  remarks: string;
  status: LeaveStatus;
  approverId: string | null;
  approverComment: string | null;
  createdAt: string;
  appliedDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: AttendanceStatus;
  geoFlag: boolean;
  anomalyFlag: boolean;
  anomalyReason: string | null;
}

export interface KudosItem {
  id: string;
  fromName: string;
  toName: string;
  toEmployeeId: string;
  message: string;
  createdAt: string;
}

export interface WellnessScore {
  employeeId: string;
  score: number;
  factors: {
    overtimeHours: number;
    leaveUtilization: number;
    daysSinceLastBreak: number;
    daysSinceLastKudos: number;
  };
}

export interface AttritionRisk {
  employeeId: string;
  employeeName: string;
  riskScore: number;
  factors: { label: string; value: number; contribution: number }[];
}

export interface PayrollRecord {
  employeeId: string;
  baseSalary: number;
  allowances: { type: string; amount: number }[];
  deductions: { type: string; amount: number }[];
  effectiveMonth: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'leave' | 'attendance' | 'kudos' | 'system';
  read: boolean;
  createdAt: string;
}

export interface SessionItem {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

// ==========================================
// 2. Default Seed Data
// ==========================================

const INITIAL_EMPLOYEES: UserProfile[] = [
  {
    id: 'EMP001',
    employeeCode: 'EMP001',
    name: 'Sarah Jenkins',
    email: 'admin@novahr.com',
    role: Role.HR,
    department: 'People Operations',
    managerId: null,
    phone: '+1 (555) 019-2834',
    address: '452 Pine St, San Francisco, CA',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    status: 'active',
    skills: [
      { name: 'Talent Acquisition', level: 5 },
      { name: 'Conflict Resolution', level: 4 },
      { name: 'Strategic HR', level: 5 }
    ],
    documents: [
      { id: 'doc-101', name: 'Contract_Sarah.pdf', type: 'Employment Agreement', url: '#', uploadedAt: '2025-01-10' }
    ],
    versionHistory: [
      { version: 1, date: '2025-01-10 09:00', updatedBy: 'System', changes: 'Initial Profile Created' }
    ]
  },
  {
    id: 'EMP002',
    employeeCode: 'EMP002',
    name: 'Marcus Vance',
    email: 'manager@novahr.com',
    role: Role.MANAGER,
    department: 'Engineering',
    managerId: 'EMP001',
    phone: '+1 (555) 014-9988',
    address: '102 Oak Ave, San Jose, CA',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    status: 'active',
    skills: [
      { name: 'System Architecture', level: 5 },
      { name: 'Team Leadership', level: 4 },
      { name: 'Next.js & React', level: 4 }
    ],
    documents: [
      { id: 'doc-102', name: 'Contract_Marcus.pdf', type: 'Employment Agreement', url: '#', uploadedAt: '2025-03-12' }
    ],
    versionHistory: [
      { version: 1, date: '2025-03-12 10:00', updatedBy: 'Sarah Jenkins', changes: 'Profile Created' }
    ]
  },
  {
    id: 'EMP003',
    employeeCode: 'EMP003',
    name: 'Alex Rivera',
    email: 'alex@novahr.com',
    role: Role.EMPLOYEE,
    department: 'Engineering',
    managerId: 'EMP002',
    phone: '+1 (555) 012-3456',
    address: '742 Evergreen Terrace, Springfield, IL',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    status: 'active',
    skills: [
      { name: 'React Native', level: 4 },
      { name: 'Node.js', level: 3 },
      { name: 'CSS Grid', level: 5 }
    ],
    documents: [
      { id: 'doc-103', name: 'Identity_Card_Alex.jpg', type: 'National ID', url: '#', uploadedAt: '2025-05-18' }
    ],
    versionHistory: [
      { version: 1, date: '2025-05-18 11:30', updatedBy: 'Sarah Jenkins', changes: 'Profile Created' }
    ]
  },
  {
    id: 'EMP004',
    employeeCode: 'EMP004',
    name: 'Jordan Chen',
    email: 'jordan@novahr.com',
    role: Role.EMPLOYEE,
    department: 'Design',
    managerId: 'EMP002',
    phone: '+1 (555) 015-6789',
    address: '88 Broadway, New York, NY',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120',
    status: 'active',
    skills: [
      { name: 'Figma System Design', level: 5 },
      { name: 'Typography', level: 4 },
      { name: 'UI Prototyping', level: 4 }
    ],
    documents: [
      { id: 'doc-104', name: 'Design_Certificate.pdf', type: 'Certification', url: '#', uploadedAt: '2025-06-01' }
    ],
    versionHistory: [
      { version: 1, date: '2025-06-01 14:00', updatedBy: 'Sarah Jenkins', changes: 'Profile Created' }
    ]
  },
  {
    id: 'EMP005',
    employeeCode: 'EMP005',
    name: 'Taylor Smith',
    email: 'taylor@novahr.com',
    role: Role.EMPLOYEE,
    department: 'People Operations',
    managerId: 'EMP001',
    phone: '+1 (555) 018-1234',
    address: '321 Cypress Rd, Mill Valley, CA',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120',
    status: 'active',
    skills: [
      { name: 'Onboarding Operations', level: 4 },
      { name: 'Data Visualization', level: 3 }
    ],
    documents: [],
    versionHistory: [
      { version: 1, date: '2025-06-15 09:15', updatedBy: 'Sarah Jenkins', changes: 'Profile Created' }
    ]
  }
];

const INITIAL_LEAVE_BALANCES: Record<string, LeaveBalance[]> = {
  EMP001: [
    { leaveType: LeaveType.PAID, allotted: 20, used: 2, remaining: 18 },
    { leaveType: LeaveType.SICK, allotted: 10, used: 1, remaining: 9 },
    { leaveType: LeaveType.UNPAID, allotted: 15, used: 0, remaining: 15 }
  ],
  EMP002: [
    { leaveType: LeaveType.PAID, allotted: 20, used: 5, remaining: 15 },
    { leaveType: LeaveType.SICK, allotted: 10, used: 2, remaining: 8 },
    { leaveType: LeaveType.UNPAID, allotted: 15, used: 1, remaining: 14 }
  ],
  EMP003: [
    { leaveType: LeaveType.PAID, allotted: 20, used: 4, remaining: 16 },
    { leaveType: LeaveType.SICK, allotted: 10, used: 6, remaining: 4 },
    { leaveType: LeaveType.UNPAID, allotted: 15, used: 0, remaining: 15 }
  ],
  EMP004: [
    { leaveType: LeaveType.PAID, allotted: 20, used: 8, remaining: 12 },
    { leaveType: LeaveType.SICK, allotted: 10, used: 1, remaining: 9 },
    { leaveType: LeaveType.UNPAID, allotted: 15, used: 2, remaining: 13 }
  ],
  EMP005: [
    { leaveType: LeaveType.PAID, allotted: 20, used: 10, remaining: 10 },
    { leaveType: LeaveType.SICK, allotted: 10, used: 2, remaining: 8 },
    { leaveType: LeaveType.UNPAID, allotted: 15, used: 0, remaining: 15 }
  ]
};

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'req-201',
    employeeId: 'EMP003',
    employeeName: 'Alex Rivera',
    department: 'Engineering',
    leaveType: LeaveType.PAID,
    startDate: '2026-07-15',
    endDate: '2026-07-18',
    remarks: 'Family trip out of state.',
    status: LeaveStatus.APPROVED,
    approverId: 'EMP002',
    approverComment: 'Approved. Ensure tasks are delegated.',
    createdAt: '2026-06-25 14:22',
    appliedDate: '2026-06-25'
  },
  {
    id: 'req-202',
    employeeId: 'EMP004',
    employeeName: 'Jordan Chen',
    department: 'Design',
    leaveType: LeaveType.PAID,
    startDate: '2026-07-16',
    endDate: '2026-07-20',
    remarks: 'Attending product conference.',
    status: LeaveStatus.PENDING,
    approverId: null,
    approverComment: null,
    createdAt: '2026-07-02 10:15',
    appliedDate: '2026-07-02'
  },
  {
    id: 'req-203',
    employeeId: 'EMP005',
    employeeName: 'Taylor Smith',
    department: 'People Operations',
    leaveType: LeaveType.SICK,
    startDate: '2026-07-01',
    endDate: '2026-07-03',
    remarks: 'Down with flu.',
    status: LeaveStatus.PENDING,
    approverId: null,
    approverComment: null,
    createdAt: '2026-07-01 08:30', // > 48h pending (SLA alert)
    appliedDate: '2026-07-01'
  }
];

const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  // EMP003 - Alex Rivera - 5 consecutive late checks to trigger anomaly heuristic
  { id: 'att-301', employeeId: 'EMP003', employeeName: 'Alex Rivera', date: '2026-06-29', checkInTime: '09:45 AM', checkOutTime: '06:15 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: true, anomalyReason: 'Shift in punctuality: 15+ mins late' },
  { id: 'att-302', employeeId: 'EMP003', employeeName: 'Alex Rivera', date: '2026-06-30', checkInTime: '09:52 AM', checkOutTime: '06:05 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: true, anomalyReason: 'Shift in punctuality: 15+ mins late' },
  { id: 'att-303', employeeId: 'EMP003', employeeName: 'Alex Rivera', date: '2026-07-01', checkInTime: '09:48 AM', checkOutTime: '06:00 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: true, anomalyReason: 'Shift in punctuality: 15+ mins late' },
  { id: 'att-304', employeeId: 'EMP003', employeeName: 'Alex Rivera', date: '2026-07-02', checkInTime: '09:55 AM', checkOutTime: '06:10 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: true, anomalyReason: 'Shift in punctuality: 15+ mins late' },
  { id: 'att-305', employeeId: 'EMP003', employeeName: 'Alex Rivera', date: '2026-07-03', checkInTime: '09:50 AM', checkOutTime: '06:00 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: true, anomalyReason: 'Repeated late arrivals (5 consecutive shifts after 9:30 AM threshold)' },
  
  // EMP004 - Jordan Chen - normal checks
  { id: 'att-401', employeeId: 'EMP004', employeeName: 'Jordan Chen', date: '2026-07-02', checkInTime: '09:12 AM', checkOutTime: '05:30 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: false, anomalyReason: null },
  { id: 'att-402', employeeId: 'EMP004', employeeName: 'Jordan Chen', date: '2026-07-03', checkInTime: '09:15 AM', checkOutTime: '05:45 PM', status: AttendanceStatus.PRESENT, geoFlag: false, anomalyFlag: false, anomalyReason: null },

  // EMP005 - Taylor Smith
  { id: 'att-501', employeeId: 'EMP005', employeeName: 'Taylor Smith', date: '2026-07-02', checkInTime: '09:28 AM', checkOutTime: '06:02 PM', status: AttendanceStatus.PRESENT, geoFlag: true, anomalyFlag: true, anomalyReason: 'Possible Gaming: check-in 2 mins before half-day threshold (9:30 AM)' },
  { id: 'att-502', employeeId: 'EMP005', employeeName: 'Taylor Smith', date: '2026-07-03', checkInTime: '09:29 AM', checkOutTime: '06:01 PM', status: AttendanceStatus.PRESENT, geoFlag: true, anomalyFlag: true, anomalyReason: 'Possible Gaming: check-in 1 min before half-day threshold (9:30 AM)' }
];

const INITIAL_KUDOS: KudosItem[] = [
  { id: 'kd-1', fromName: 'Marcus Vance', toName: 'Alex Rivera', toEmployeeId: 'EMP003', message: 'Outstanding work designing the layout of our main component dashboard. Visually stunning!', createdAt: '2026-07-01 16:40' },
  { id: 'kd-2', fromName: 'Alex Rivera', toName: 'Jordan Chen', toEmployeeId: 'EMP004', message: 'Big thanks to Jordan for designing the Figma assets so quickly. You saved the team days of layout guessing!', createdAt: '2026-07-02 11:10' },
  { id: 'kd-3', fromName: 'Sarah Jenkins', toName: 'Taylor Smith', toEmployeeId: 'EMP005', message: 'Taylor did an exceptional job preparing the bulk CSV importer. Highly intuitive UI!', createdAt: '2026-07-03 14:00' }
];

const INITIAL_WELLNESS: WellnessScore[] = [
  { employeeId: 'EMP001', score: 85, factors: { overtimeHours: 2, leaveUtilization: 10, daysSinceLastBreak: 8, daysSinceLastKudos: 15 } },
  { employeeId: 'EMP002', score: 68, factors: { overtimeHours: 12, leaveUtilization: 25, daysSinceLastBreak: 32, daysSinceLastKudos: 4 } },
  { employeeId: 'EMP003', score: 55, factors: { overtimeHours: 20, leaveUtilization: 20, daysSinceLastBreak: 45, daysSinceLastKudos: 2 } }, // High overtime, long time since break
  { employeeId: 'EMP004', score: 72, factors: { overtimeHours: 4, leaveUtilization: 40, daysSinceLastBreak: 14, daysSinceLastKudos: 1 } },
  { employeeId: 'EMP005', score: 92, factors: { overtimeHours: 0, leaveUtilization: 50, daysSinceLastBreak: 2, daysSinceLastKudos: 1 } }
];

const INITIAL_RISKS: AttritionRisk[] = [
  {
    employeeId: 'EMP003',
    employeeName: 'Alex Rivera',
    riskScore: 78,
    factors: [
      { label: 'Unpaid Leave Spike', value: 0, contribution: 0.1 },
      { label: 'Burnout / Low Wellness Score', value: 45, contribution: 0.4 },
      { label: 'Long Stretch Without Time-Off', value: 45, contribution: 0.3 },
      { label: 'Shift in Punctuality Pattern', value: 5, contribution: 0.2 }
    ]
  },
  {
    employeeId: 'EMP002',
    employeeName: 'Marcus Vance',
    riskScore: 42,
    factors: [
      { label: 'High Overtime Load', value: 12, contribution: 0.5 },
      { label: 'Time Since Last Break', value: 32, contribution: 0.5 }
    ]
  }
];

const INITIAL_PAYROLL: PayrollRecord[] = [
  { employeeId: 'EMP001', baseSalary: 9500, allowances: [{ type: 'HRA', amount: 1500 }, { type: 'Special', amount: 800 }], deductions: [{ type: 'Professional Tax', amount: 200 }], effectiveMonth: '2026-06' },
  { employeeId: 'EMP002', baseSalary: 11000, allowances: [{ type: 'HRA', amount: 2000 }, { type: 'Medical', amount: 500 }], deductions: [{ type: 'Professional Tax', amount: 200 }], effectiveMonth: '2026-06' },
  { employeeId: 'EMP003', baseSalary: 7200, allowances: [{ type: 'HRA', amount: 1000 }, { type: 'Internet', amount: 150 }], deductions: [{ type: 'Professional Tax', amount: 150 }], effectiveMonth: '2026-06' },
  { employeeId: 'EMP004', baseSalary: 7000, allowances: [{ type: 'HRA', amount: 1000 }, { type: 'Internet', amount: 150 }], deductions: [{ type: 'Professional Tax', amount: 150 }], effectiveMonth: '2026-06' },
  { employeeId: 'EMP005', baseSalary: 5500, allowances: [{ type: 'HRA', amount: 800 }, { type: 'Special', amount: 200 }], deductions: [{ type: 'Professional Tax', amount: 150 }], effectiveMonth: '2026-06' }
];

const INITIAL_SESSIONS: SessionItem[] = [
  { id: 'sess-1', device: 'Chrome / Windows 11 (Desktop)', location: 'San Jose, CA', lastActive: 'Active Now', isCurrent: true },
  { id: 'sess-2', device: 'Safari / iPhone 15 Pro (Mobile)', location: 'San Jose, CA', lastActive: '2 hours ago', isCurrent: false },
  { id: 'sess-3', device: 'Firefox / MacBook Pro (Laptop)', location: 'Mill Valley, CA', lastActive: '3 days ago', isCurrent: false }
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'not-1', title: 'Leave Pending Approval', message: 'Taylor Smith applied for Sick Leave starting 2026-07-01. SLA warning: pending for >48h.', type: 'leave', read: false, createdAt: '2026-07-03 08:30' },
  { id: 'not-2', title: 'Punctuality Shift Detected', message: 'Alex Rivera checked in late 5 consecutive days this week.', type: 'attendance', read: false, createdAt: '2026-07-03 09:50' },
  { id: 'not-3', title: 'Kudos Received!', message: 'Marcus Vance gave you Kudos: "Outstanding work designing the layout..."', type: 'kudos', read: true, createdAt: '2026-07-01 16:40' }
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'log-1', actor: 'Sarah Jenkins', action: 'Update Profile (EMP003)', timestamp: '2026-07-02 15:30', details: 'Changed address from "12 Main St" to "742 Evergreen Terrace"' },
  { id: 'log-2', actor: 'Marcus Vance', action: 'Approve Leave Request (req-201)', timestamp: '2026-06-25 14:22', details: 'Approved Alex Rivera paid leave from 2026-07-15 to 2026-07-18' },
  { id: 'log-3', actor: 'Sarah Jenkins', action: 'Configured Blackout Period', timestamp: '2026-06-01 10:00', details: 'Added annual blackout dates: December 20 - December 31' }
];

// ==========================================
// 3. Context Creation & Hook
// ==========================================

interface AppContextType {
  employees: UserProfile[];
  leaveBalances: Record<string, LeaveBalance[]>;
  leaveRequests: LeaveRequest[];
  attendance: AttendanceRecord[];
  kudos: KudosItem[];
  wellness: WellnessScore[];
  risks: AttritionRisk[];
  payroll: PayrollRecord[];
  sessions: SessionItem[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  currentUser: UserProfile | null;
  activeRole: Role | null;
  impersonatingUser: UserProfile | null;
  rememberMe: boolean;
  twoFactorEnabled: boolean;
  wfhSettings: { radiusMeter: number; officeLat: number; officeLng: number };
  
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (employeeId: string, name: string, email: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  impersonate: (employeeId: string | null) => void;
  checkIn: (lat?: number, lng?: number, qrCode?: string) => { success: boolean; anomaly: boolean; reason: string | null };
  checkOut: () => void;
  applyLeave: (leaveType: LeaveType, start: string, end: string, remarks: string) => { success: boolean; error?: string; warning?: string };
  approveLeave: (requestId: string, comment: string) => void;
  rejectLeave: (requestId: string, comment: string) => void;
  giveKudos: (toEmployeeId: string, message: string) => void;
  updateProfile: (employeeId: string, updates: Partial<UserProfile>) => void;
  importCSV: (csvText: string) => { success: boolean; count: number; error?: string };
  chatWithCopilot: (message: string) => Promise<{ reply: string; sources: { type: 'db' | 'policy'; ref: string }[] }>;
  revokeSession: (sessionId: string) => void;
  toggle2FA: () => void;
  dismissNotification: (id: string) => void;
  updatePayroll: (employeeId: string, base: number, allowances: { type: string; amount: number }[], deductions: { type: string; amount: number }[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<Record<string, LeaveBalance[]>>({});
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [kudos, setKudos] = useState<KudosItem[]>([]);
  const [wellness, setWellness] = useState<WellnessScore[]>([]);
  const [risks, setRisks] = useState<AttritionRisk[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const [impersonatingUser, setImpersonatingUser] = useState<UserProfile | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  
  // Geofencing Defaults: Office Location near downtown San Jose, CA
  const officeCoords = { lat: 37.3382, lng: -121.8863 };
  const allowedRadius = 200; // 200 meters

  // Hydrate from localStorage or initialize with seed data
  useEffect(() => {
    const loadOrSeed = <T,>(key: string, initialData: T): T => {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          return JSON.parse(stored) as T;
        } catch (e) {
          console.error(`Error parsing localStorage key ${key}`, e);
        }
      }
      localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    };

    setEmployees(loadOrSeed('novahr_employees', INITIAL_EMPLOYEES));
    setLeaveBalances(loadOrSeed('novahr_leave_balances', INITIAL_LEAVE_BALANCES));
    setLeaveRequests(loadOrSeed('novahr_leave_requests', INITIAL_LEAVE_REQUESTS));
    setAttendance(loadOrSeed('novahr_attendance', INITIAL_ATTENDANCE));
    setKudos(loadOrSeed('novahr_kudos', INITIAL_KUDOS));
    setWellness(loadOrSeed('novahr_wellness', INITIAL_WELLNESS));
    setRisks(loadOrSeed('novahr_risks', INITIAL_RISKS));
    setPayroll(loadOrSeed('novahr_payroll', INITIAL_PAYROLL));
    setSessions(loadOrSeed('novahr_sessions', INITIAL_SESSIONS));
    setNotifications(loadOrSeed('novahr_notifications', INITIAL_NOTIFICATIONS));
    setAuditLogs(loadOrSeed('novahr_audit_logs', INITIAL_AUDIT_LOGS));

    // Restore login session
    const storedUser = localStorage.getItem('novahr_session_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as UserProfile;
        setCurrentUser(user);
        setActiveRole(user.role);
      } catch (e) {}
    }
    
    setTwoFactorEnabled(localStorage.getItem('novahr_2fa_enabled') === 'true');
  }, []);

  // Save changes wrapper
  const saveState = (key: string, data: any, stateSetter: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    stateSetter(data);
  };

  const getActiveUser = (): UserProfile | null => {
    return impersonatingUser || currentUser;
  };

  // ==========================================
  // 4. CRUD & Interactive Methods
  // ==========================================

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Basic password checking policy simulation
    // Let's allow standard seed passwords
    const user = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Invalid email address. User does not exist.' };
    }
    if (password !== 'Password123!') {
      return { success: false, error: 'Incorrect password. Please try again.' };
    }

    setCurrentUser(user);
    setActiveRole(user.role);
    if (rememberMe) {
      localStorage.setItem('novahr_session_user', JSON.stringify(user));
    }
    
    // Log audit log
    addAuditLogEntry(user.name, `User Login`, `Logged into the system via standard session.`);
    return { success: true };
  };

  const logout = () => {
    const actUser = getActiveUser();
    if (actUser) {
      addAuditLogEntry(actUser.name, 'User Logout', 'Logged out of session.');
    }
    setCurrentUser(null);
    setActiveRole(null);
    setImpersonatingUser(null);
    localStorage.removeItem('novahr_session_user');
  };

  const signup = async (employeeId: string, name: string, email: string, role: Role): Promise<{ success: boolean; error?: string }> => {
    const existing = employees.find(e => e.id === employeeId || e.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, error: 'Employee ID or Email already registered in the system.' };
    }

    const newUser: UserProfile = {
      id: employeeId,
      employeeCode: employeeId,
      name,
      email,
      role,
      department: role === Role.HR ? 'People Operations' : 'Engineering',
      managerId: role === Role.EMPLOYEE ? 'EMP002' : null,
      phone: null,
      address: null,
      photoUrl: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120`,
      status: 'active',
      skills: [],
      documents: [],
      versionHistory: [{ version: 1, date: new Date().toISOString().replace('T', ' ').slice(0, 16), updatedBy: 'Self Sign-up', changes: 'Profile Created' }]
    };

    const updated = [...employees, newUser];
    saveState('novahr_employees', updated, setEmployees);

    // Initialise Leave balances
    const initialBal: LeaveBalance[] = [
      { leaveType: LeaveType.PAID, allotted: 20, used: 0, remaining: 20 },
      { leaveType: LeaveType.SICK, allotted: 10, used: 0, remaining: 10 },
      { leaveType: LeaveType.UNPAID, allotted: 15, used: 0, remaining: 15 }
    ];
    const newBalances = { ...leaveBalances, [employeeId]: initialBal };
    saveState('novahr_leave_balances', newBalances, setLeaveBalances);

    // Initialize wellness score
    const newWellness: WellnessScore[] = [...wellness, { employeeId, score: 95, factors: { overtimeHours: 0, leaveUtilization: 0, daysSinceLastBreak: 0, daysSinceLastKudos: 0 } }];
    saveState('novahr_wellness', newWellness, setWellness);

    // Initialize payroll structure
    const newPayroll: PayrollRecord[] = [...payroll, { employeeId, baseSalary: 6000, allowances: [{ type: 'HRA', amount: 1000 }], deductions: [{ type: 'Professional Tax', amount: 150 }], effectiveMonth: '2026-07' }];
    saveState('novahr_payroll', newPayroll, setPayroll);

    addAuditLogEntry(name, 'Signup', `Employee ${employeeId} self-registered into the database.`);
    return { success: true };
  };

  const impersonate = (employeeId: string | null) => {
    if (!employeeId) {
      setImpersonatingUser(null);
      setActiveRole(currentUser?.role || null);
      return;
    }
    const user = employees.find(e => e.id === employeeId);
    if (user) {
      setImpersonatingUser(user);
      setActiveRole(user.role);
      addAuditLogEntry(currentUser?.name || 'Admin', 'Admin Context Switch', `Switched dashboard context to view as ${user.name}`);
    }
  };

  const addAuditLogEntry = (actorName: string, action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      actor: actorName,
      action,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      details
    };
    saveState('novahr_audit_logs', [newLog, ...auditLogs], setAuditLogs);
  };

  // Check In Check Out Simulation
  const checkIn = (lat?: number, lng?: number, qrCode?: string) => {
    const actUser = getActiveUser();
    if (!actUser) return { success: false, anomaly: false, reason: 'No active session.' };

    const todayStr = new Date().toISOString().split('T')[0];
    const existing = attendance.find(a => a.employeeId === actUser.id && a.date === todayStr);
    if (existing && existing.checkInTime) {
      return { success: false, anomaly: false, reason: 'Already checked in for today.' };
    }

    const checkInTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let geoFlag = false;
    let anomalyFlag = false;
    let anomalyReason: string | null = null;

    // SLA hours verification
    // Office start threshold: 09:30 AM.
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const limitMinutes = 9 * 60 + 30; // 09:30 AM
    
    if (currentMinutes > limitMinutes) {
      // 15 mins buffer or consecutive check
      const lateDiff = currentMinutes - limitMinutes;
      if (lateDiff > 15) {
        anomalyFlag = true;
        anomalyReason = `Late arrival: Checked in at ${checkInTimeStr} (${lateDiff} mins past 09:30 AM)`;
      }
    }

    // Geofencing Check
    if (lat && lng) {
      const distance = getDistance(lat, lng, officeCoords.lat, officeCoords.lng);
      if (distance > allowedRadius) {
        geoFlag = true;
        anomalyFlag = true;
        anomalyReason = anomalyReason 
          ? `${anomalyReason} + Geolocation mismatch: Checked in ${Math.round(distance)}m away from office.`
          : `Geolocation mismatch: Checked in ${Math.round(distance)}m away from office limits.`;
      }
    } else if (qrCode) {
      if (qrCode !== 'OFFICE-DESK-QR-MAIN-2026') {
        anomalyFlag = true;
        anomalyReason = 'Invalid Office Desk QR Code scanned.';
      }
    }

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: actUser.id,
      employeeName: actUser.name,
      date: todayStr,
      checkInTime: checkInTimeStr,
      checkOutTime: null,
      status: AttendanceStatus.PRESENT,
      geoFlag,
      anomalyFlag,
      anomalyReason
    };

    const updated = [newRecord, ...attendance];
    saveState('novahr_attendance', updated, setAttendance);

    if (anomalyFlag) {
      const newNotif: NotificationItem = {
        id: `not-${Date.now()}`,
        title: 'Attendance Anomaly Flagged',
        message: `${actUser.name} checked in with an anomaly: ${anomalyReason}`,
        type: 'attendance',
        read: false,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };
      saveState('novahr_notifications', [newNotif, ...notifications], setNotifications);
    }

    addAuditLogEntry(actUser.name, 'Check In', `Checked in at ${checkInTimeStr}. Anomaly: ${anomalyFlag ? 'YES (' + anomalyReason + ')' : 'NO'}`);
    return { success: true, anomaly: anomalyFlag, reason: anomalyReason };
  };

  const checkOut = () => {
    const actUser = getActiveUser();
    if (!actUser) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const recordIndex = attendance.findIndex(a => a.employeeId === actUser.id && a.date === todayStr);

    if (recordIndex === -1) return;

    const checkOutTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const records = [...attendance];
    records[recordIndex] = {
      ...records[recordIndex],
      checkOutTime: checkOutTimeStr
    };

    saveState('novahr_attendance', records, setAttendance);
    addAuditLogEntry(actUser.name, 'Check Out', `Checked out at ${checkOutTimeStr}`);
  };

  // Leave Simulation
  const applyLeave = (leaveType: LeaveType, start: string, end: string, remarks: string) => {
    const actUser = getActiveUser();
    if (!actUser) return { success: false, error: 'No active session.' };

    // Check balances
    const userBals = leaveBalances[actUser.id] || [];
    const targetBal = userBals.find(b => b.leaveType === leaveType);
    if (!targetBal || targetBal.remaining <= 0) {
      return { success: false, error: 'Insufficient leave balance for the requested type.' };
    }

    // Smart Conflict Detection:
    // Case A: Team overlaps - if > 25% of team members in same department are on leave in overlap date range
    const startDate = new Date(start);
    const endDate = new Date(end);
    let overlapCount = 0;
    
    leaveRequests.forEach(req => {
      if (req.status === LeaveStatus.APPROVED && req.employeeId !== actUser.id) {
        const emp = employees.find(e => e.id === req.employeeId);
        if (emp && emp.department === actUser.department) {
          const rStart = new Date(req.startDate);
          const rEnd = new Date(req.endDate);
          // Overlap check
          if (startDate <= rEnd && rStart <= endDate) {
            overlapCount++;
          }
        }
      }
    });

    const teamSize = employees.filter(e => e.department === actUser.department).length;
    const ratio = teamSize > 0 ? (overlapCount / teamSize) : 0;
    let warning: string | undefined;

    if (ratio >= 0.25) {
      warning = `Leave Conflict Warning: ${overlapCount} other colleague(s) in the ${actUser.department} department (${Math.round(ratio * 100)}%) are already on leave during this period. Over-threshold may delay approval.`;
    }

    // Case B: Blackout Dates (e.g. July 4-6, or end of year)
    if (start.includes('-12-25') || start.includes('-12-31') || start.includes('-07-04')) {
      warning = warning 
        ? `${warning} Also, this period hits a company blackout window (Quarterly audit & compliance review).`
        : 'Leave overlaps with a company blackout window (Quarterly review period). Approval requires additional audit justification.';
    }

    const newRequest: LeaveRequest = {
      id: `req-${Date.now()}`,
      employeeId: actUser.id,
      employeeName: actUser.name,
      department: actUser.department,
      leaveType,
      startDate: start,
      endDate: end,
      remarks,
      status: LeaveStatus.PENDING,
      approverId: null,
      approverComment: null,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      appliedDate: new Date().toISOString().split('T')[0]
    };

    saveState('novahr_leave_requests', [newRequest, ...leaveRequests], setLeaveRequests);

    // Notify Manager/HR
    const managers = employees.filter(e => e.role === Role.MANAGER || e.role === Role.HR);
    const newNotif: NotificationItem = {
      id: `not-${Date.now()}`,
      title: 'New Leave Application',
      message: `${actUser.name} applied for ${leaveType} leave from ${start} to ${end}.`,
      type: 'leave',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    saveState('novahr_notifications', [newNotif, ...notifications], setNotifications);

    addAuditLogEntry(actUser.name, 'Apply Leave', `Applied for ${leaveType} leave (${start} to ${end}). Warnings: ${warning || 'None'}`);
    return { success: true, warning };
  };

  const approveLeave = (requestId: string, comment: string) => {
    const actUser = getActiveUser();
    if (!actUser) return;

    const requestIndex = leaveRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return;

    const reqs = [...leaveRequests];
    const targetReq = reqs[requestIndex];

    reqs[requestIndex] = {
      ...targetReq,
      status: LeaveStatus.APPROVED,
      approverId: actUser.id,
      approverComment: comment
    };

    saveState('novahr_leave_requests', reqs, setLeaveRequests);

    // Decrement Balance
    const start = new Date(targetReq.startDate);
    const end = new Date(targetReq.endDate);
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;

    const userBals = [...(leaveBalances[targetReq.employeeId] || [])];
    const balIndex = userBals.findIndex(b => b.leaveType === targetReq.leaveType);
    if (balIndex !== -1) {
      const bal = userBals[balIndex];
      userBals[balIndex] = {
        ...bal,
        used: bal.used + days,
        remaining: Math.max(0, bal.remaining - days)
      };
      const allBals = { ...leaveBalances, [targetReq.employeeId]: userBals };
      saveState('novahr_leave_balances', allBals, setLeaveBalances);
    }

    // Notify applicant
    const newNotif: NotificationItem = {
      id: `not-${Date.now()}`,
      title: 'Leave Approved',
      message: `Your leave request from ${targetReq.startDate} has been approved by ${actUser.name}. Comment: ${comment}`,
      type: 'leave',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    saveState('novahr_notifications', [newNotif, ...notifications], setNotifications);

    addAuditLogEntry(actUser.name, 'Approve Leave', `Approved leave request ${requestId} for ${targetReq.employeeName}. Comment: ${comment}`);
  };

  const rejectLeave = (requestId: string, comment: string) => {
    const actUser = getActiveUser();
    if (!actUser) return;

    const requestIndex = leaveRequests.findIndex(r => r.id === requestId);
    if (requestIndex === -1) return;

    const reqs = [...leaveRequests];
    const targetReq = reqs[requestIndex];

    reqs[requestIndex] = {
      ...targetReq,
      status: LeaveStatus.REJECTED,
      approverId: actUser.id,
      approverComment: comment
    };

    saveState('novahr_leave_requests', reqs, setLeaveRequests);

    // Notify applicant
    const newNotif: NotificationItem = {
      id: `not-${Date.now()}`,
      title: 'Leave Rejected',
      message: `Your leave request from ${targetReq.startDate} was rejected by ${actUser.name}. Reason: ${comment}`,
      type: 'leave',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    saveState('novahr_notifications', [newNotif, ...notifications], setNotifications);

    addAuditLogEntry(actUser.name, 'Reject Leave', `Rejected leave request ${requestId} for ${targetReq.employeeName}. Reason: ${comment}`);
  };

  // Give Kudos
  const giveKudos = (toEmployeeId: string, message: string) => {
    const actUser = getActiveUser();
    if (!actUser) return;

    const toEmp = employees.find(e => e.id === toEmployeeId);
    if (!toEmp) return;

    const newItem: KudosItem = {
      id: `kd-${Date.now()}`,
      fromName: actUser.name,
      toName: toEmp.name,
      toEmployeeId,
      message,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };

    saveState('novahr_kudos', [newItem, ...kudos], setKudos);

    // Notify receiving employee
    const newNotif: NotificationItem = {
      id: `not-${Date.now()}`,
      title: 'Kudos Received! 🎉',
      message: `${actUser.name} recognized your work: "${message.slice(0, 50)}..."`,
      type: 'kudos',
      read: false,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    saveState('novahr_notifications', [newNotif, ...notifications], setNotifications);

    addAuditLogEntry(actUser.name, 'Send Recognition', `Sent Kudos to ${toEmp.name}`);
  };

  // Update employee profile
  const updateProfile = (employeeId: string, updates: Partial<UserProfile>) => {
    const actUser = getActiveUser();
    const updaterName = actUser ? actUser.name : 'System';

    const index = employees.findIndex(e => e.id === employeeId);
    if (index === -1) return;

    const currentProfile = employees[index];
    const prevSkills = currentProfile.skills;
    const prevDocs = currentProfile.documents;
    
    // Track diffs
    const changedFields: string[] = [];
    if (updates.phone && updates.phone !== currentProfile.phone) changedFields.push('phone');
    if (updates.address && updates.address !== currentProfile.address) changedFields.push('address');
    if (updates.photoUrl && updates.photoUrl !== currentProfile.photoUrl) changedFields.push('photoUrl');
    if (updates.skills) changedFields.push('skills matrix');
    if (updates.documents) changedFields.push('documents onboarding list');

    const changeDesc = changedFields.length > 0 
      ? `Updated fields: ${changedFields.join(', ')}`
      : 'Self updates completed';

    const nextVer = (currentProfile.versionHistory[0]?.version || 1) + 1;
    const newVer = {
      version: nextVer,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedBy: updaterName,
      changes: changeDesc
    };

    const nextProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      skills: updates.skills || prevSkills,
      documents: updates.documents || prevDocs,
      versionHistory: [newVer, ...currentProfile.versionHistory]
    };

    const list = [...employees];
    list[index] = nextProfile;
    saveState('novahr_employees', list, setEmployees);

    addAuditLogEntry(updaterName, 'Profile Edit', `Modified profile for ${currentProfile.name}. Changes: ${changeDesc}`);
  };

  // Bulk Employee CSV Parser
  const importCSV = (csvText: string) => {
    const actUser = getActiveUser();
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return { success: false, count: 0, error: 'CSV file must contain a header and at least one employee row.' };
    }

    // Header validation
    // Expected: employeeId, name, email, role, department
    const header = lines[0].toLowerCase();
    if (!header.includes('employeeid') || !header.includes('name') || !header.includes('email')) {
      return { success: false, count: 0, error: 'CSV columns must include: employeeId, name, email, role, department.' };
    }

    let successCount = 0;
    const newEmps = [...employees];
    const newBals = { ...leaveBalances };
    const newWellnessList = [...wellness];
    const newPayrollList = [...payroll];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 3) continue;

      const [empId, name, email, roleStr, deptStr] = parts;
      
      // Duplication skip
      if (newEmps.some(e => e.id === empId || e.email.toLowerCase() === email.toLowerCase())) {
        continue;
      }

      const roleVal = roleStr?.toUpperCase() === 'MANAGER' ? Role.MANAGER 
                    : roleStr?.toUpperCase() === 'ADMIN' ? Role.ADMIN
                    : roleStr?.toUpperCase() === 'HR' ? Role.HR
                    : Role.EMPLOYEE;

      const profile: UserProfile = {
        id: empId,
        employeeCode: empId,
        name,
        email,
        role: roleVal,
        department: deptStr || 'Engineering',
        managerId: 'EMP002',
        phone: null,
        address: null,
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
        status: 'active',
        skills: [],
        documents: [],
        versionHistory: [{ version: 1, date: new Date().toISOString().replace('T', ' ').slice(0, 16), updatedBy: actUser?.name || 'CSV Bulk Import', changes: 'Imported via bulk CSV' }]
      };

      newEmps.push(profile);

      // Seed Balances
      newBals[empId] = [
        { leaveType: LeaveType.PAID, allotted: 20, used: 0, remaining: 20 },
        { leaveType: LeaveType.SICK, allotted: 10, used: 0, remaining: 10 },
        { leaveType: LeaveType.UNPAID, allotted: 15, used: 0, remaining: 15 }
      ];

      // Seed wellness
      newWellnessList.push({
        employeeId: empId,
        score: 95,
        factors: { overtimeHours: 0, leaveUtilization: 0, daysSinceLastBreak: 0, daysSinceLastKudos: 0 }
      });

      // Seed Payroll
      newPayrollList.push({
        employeeId: empId,
        baseSalary: 6000,
        allowances: [{ type: 'HRA', amount: 1000 }],
        deductions: [{ type: 'Professional Tax', amount: 150 }],
        effectiveMonth: '2026-07'
      });

      successCount++;
    }

    if (successCount > 0) {
      saveState('novahr_employees', newEmps, setEmployees);
      saveState('novahr_leave_balances', newBals, setLeaveBalances);
      saveState('novahr_wellness', newWellnessList, setWellness);
      saveState('novahr_payroll', newPayrollList, setPayroll);
      addAuditLogEntry(actUser?.name || 'HR Admin', 'Bulk CSV Import', `Successfully onboarded ${successCount} employees.`);
    }

    return { success: true, count: successCount };
  };

  // AI Copilot Chatbot Engine
  const chatWithCopilot = async (message: string): Promise<{ reply: string; sources: { type: 'db' | 'policy'; ref: string }[] }> => {
    const actUser = getActiveUser();
    if (!actUser) return { reply: 'Please login to speak with the HR Copilot.', sources: [] };

    await new Promise(resolve => setTimeout(resolve, 800)); // Simulating LLM API thinking time

    const cleanMsg = message.toLowerCase();
    let reply = `Hello ${actUser.name}. I am grounding my logic in the NovaHR databases and the corporate handbook. Can you please rephrase or ask details about your leaves, attendance rules, or coworker skills?`;
    let sources: { type: 'db' | 'policy'; ref: string }[] = [];

    // HR Policy Document citations (Bookmarked policies)
    const POLICY_REF = 'Corporate Policy Handbook 2026';

    if (cleanMsg.includes('sick') || cleanMsg.includes('leave balance') || cleanMsg.includes('leaves remaining') || cleanMsg.includes('vacation')) {
      const userBals = leaveBalances[actUser.id] || [];
      const sick = userBals.find(b => b.leaveType === LeaveType.SICK)?.remaining || 0;
      const paid = userBals.find(b => b.leaveType === LeaveType.PAID)?.remaining || 0;
      const unpaid = userBals.find(b => b.leaveType === LeaveType.UNPAID)?.remaining || 0;
      
      reply = `According to your leave logs, you have **${paid} paid leave days**, **${sick} sick leave days**, and **${unpaid} unpaid leave days** remaining for this year. Let me know if you would like me to draft a leave application for you.`;
      sources.push({ type: 'db', ref: `Leave Balances (Entity: ${actUser.id})` });
    } 
    else if (cleanMsg.includes('wfh') || cleanMsg.includes('work from home') || cleanMsg.includes('remote work') || cleanMsg.includes('office policy')) {
      reply = `Our Work-From-Home policy states: "Employees may work remotely up to 3 days per week with manager approval. Geofencing or desktop desk QR scans must be recorded on the mobile check-in dashboard to maintain present status if working within office range."`;
      sources.push({ type: 'policy', ref: `${POLICY_REF} — Section 4.2: Hybrid Setup` });
    }
    else if (cleanMsg.includes('anomaly') || cleanMsg.includes('anomalies')) {
      if (actUser.role === Role.HR || actUser.role === Role.ADMIN || actUser.role === Role.MANAGER) {
        const count = attendance.filter(a => a.anomalyFlag).length;
        reply = `I scanned the active logs. There are currently **${count} attendance anomalies** pending review in the HR audit queue. Major issues revolve around repeated minute-before checks from Taylor Smith and late arrivals from Alex Rivera.`;
        sources.push({ type: 'db', ref: 'Attendance Table (Role Audit View)' });
      } else {
        const count = attendance.filter(a => a.employeeId === actUser.id && a.anomalyFlag).length;
        reply = `You have **${count} flagged attendance entries** in your records. Checked logs indicate punctuality alerts. You can view detailed reasons on the Attendance tab.`;
        sources.push({ type: 'db', ref: `Attendance Logs (Entity: ${actUser.id})` });
      }
    }
    else if (cleanMsg.includes('salary') || cleanMsg.includes('pay') || cleanMsg.includes('payslip')) {
      const userPayroll = payroll.find(p => p.employeeId === actUser.id);
      if (userPayroll) {
        const net = userPayroll.baseSalary + userPayroll.allowances.reduce((acc, curr) => acc + curr.amount, 0) - userPayroll.deductions.reduce((acc, curr) => acc + curr.amount, 0);
        reply = `Your base structure details list a base of **$${userPayroll.baseSalary.toLocaleString()}/mo**, HRA & special allowances totaling **$${userPayroll.allowances.reduce((a,c) => a + c.amount, 0)}**, yielding a Net Payout of **$${net.toLocaleString()}/mo**. Monthly Payslips are ready to download in PDF format under the Payroll section.`;
        sources.push({ type: 'db', ref: `Payroll Schema (Entity: ${actUser.id})` });
      }
    }
    else if (cleanMsg.includes('kudos') || cleanMsg.includes('recognition')) {
      const count = kudos.filter(k => k.toEmployeeId === actUser.id).length;
      reply = `You have received **${count} Kudos** from your team members! The latest recognition states: "${kudos.find(k => k.toEmployeeId === actUser.id)?.message || 'Outstanding collaboration'}". Positive work indices boost your overall Wellness score.`;
      sources.push({ type: 'db', ref: 'Kudos Table Feed' });
    }
    else if (cleanMsg.includes('who knows') || cleanMsg.includes('skill') || cleanMsg.includes('figma') || cleanMsg.includes('react')) {
      // Skill search
      const targetSkill = cleanMsg.includes('figma') ? 'figma' : cleanMsg.includes('react') ? 'react' : 'leadership';
      const skilledPeople = employees.filter(e => e.skills.some(s => s.name.toLowerCase().includes(targetSkill)));
      if (skilledPeople.length > 0) {
        reply = `I searched the internal skills registry. Colleague(s) proficient in **${targetSkill}** include:\n` + 
                skilledPeople.map(p => `- **${p.name}** (${p.department}, Skill level: ${p.skills.find(s => s.name.toLowerCase().includes(targetSkill))?.level}/5)`).join('\n');
      } else {
        reply = `No employees are currently tagged with the skill **${targetSkill}** inside the profile index database.`;
      }
      sources.push({ type: 'db', ref: 'Employees Skill List Table' });
    }

    return { reply, sources };
  };

  const revokeSession = (sessionId: string) => {
    const list = sessions.filter(s => s.id !== sessionId);
    saveState('novahr_sessions', list, setSessions);
    addAuditLogEntry(currentUser?.name || 'User', 'Session Revocation', `Revoked device session ID: ${sessionId}`);
  };

  const toggle2FA = () => {
    const nextVal = !twoFactorEnabled;
    setTwoFactorEnabled(nextVal);
    localStorage.setItem('novahr_2fa_enabled', String(nextVal));
    addAuditLogEntry(currentUser?.name || 'User', '2FA Setup Toggle', `Two-Factor authentication ${nextVal ? 'ENABLED' : 'DISABLED'}`);
  };

  const dismissNotification = (id: string) => {
    const list = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveState('novahr_notifications', list, setNotifications);
  };

  const updatePayroll = (employeeId: string, base: number, allowances: { type: string; amount: number }[], deductions: { type: string; amount: number }[]) => {
    const records = [...payroll];
    const index = records.findIndex(p => p.employeeId === employeeId);
    if (index !== -1) {
      records[index] = {
        employeeId,
        baseSalary: base,
        allowances,
        deductions,
        effectiveMonth: new Date().toISOString().split('T')[0].slice(0, 7)
      };
      saveState('novahr_payroll', records, setPayroll);
      const emp = employees.find(e => e.id === employeeId);
      addAuditLogEntry(currentUser?.name || 'Admin', 'Update Payroll Structure', `Updated salary details for ${emp?.name || employeeId}. Base: $${base}`);
    }
  };

  // Helper utility for distance between coords
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  return (
    <AppContext.Provider
      value={{
        employees,
        leaveBalances,
        leaveRequests,
        attendance,
        kudos,
        wellness,
        risks,
        payroll,
        sessions,
        notifications,
        auditLogs,
        currentUser,
        activeRole,
        impersonatingUser,
        rememberMe,
        twoFactorEnabled,
        wfhSettings: { radiusMeter: allowedRadius, officeLat: officeCoords.lat, officeLng: officeCoords.lng },
        
        login,
        logout,
        signup,
        impersonate,
        checkIn,
        checkOut,
        applyLeave,
        approveLeave,
        rejectLeave,
        giveKudos,
        updateProfile,
        importCSV,
        chatWithCopilot,
        revokeSession,
        toggle2FA,
        dismissNotification,
        updatePayroll
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

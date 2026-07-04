'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role, LeaveType, LeaveStatus, AttendanceStatus } from '@/context/AppContext';

export default function DashboardPage() {
  const router = useRouter();
  const {
    currentUser,
    activeRole,
    impersonatingUser,
    employees,
    leaveBalances,
    leaveRequests,
    attendance,
    kudos,
    wellness,
    risks,
    notifications,
    auditLogs,
    impersonate,
    logout,
    approveLeave,
    rejectLeave,
    giveKudos,
    chatWithCopilot,
    dismissNotification
  } = useApp();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // Theme Management
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    } else {
      setTheme('light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // UI States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosTo, setKudosTo] = useState('');
  const [kudosMsg, setKudosMsg] = useState('');
  const [selectedRiskEmp, setSelectedRiskEmp] = useState<any | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);
  const [approvalComment, setApprovalComment] = useState('');

  // Copilot Chat Drawer UI State
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'bot'; text: string; sources?: any[] }[]>([
    { sender: 'bot', text: 'Hi! I am the NovaHR Copilot. Ask me about your remaining sick leaves, the company WFH policy, or lookup coworker skill tags!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  if (!currentUser) return null;

  const activeUser = impersonatingUser || currentUser;
  const unreadNotifs = notifications.filter(n => !n.read);

  // Leave Calculations
  const userBalances = leaveBalances[activeUser.id] || [];
  const paidBal = userBalances.find(b => b.leaveType === LeaveType.PAID) || { allotted: 20, used: 2, remaining: 18 };
  const sickBal = userBalances.find(b => b.leaveType === LeaveType.SICK) || { allotted: 10, used: 1, remaining: 9 };
  const unpaidBal = userBalances.find(b => b.leaveType === LeaveType.UNPAID) || { allotted: 15, used: 0, remaining: 15 };

  const totalAllotted = paidBal.allotted + sickBal.allotted + unpaidBal.allotted;
  const totalUsed = paidBal.used + sickBal.used + unpaidBal.used;
  const totalRemaining = paidBal.remaining + sickBal.remaining + unpaidBal.remaining;
  const usedPercentage = totalAllotted > 0 ? Math.round((totalUsed / totalAllotted) * 100) : 0;

  // Wellness score for active user
  const userWellness = wellness.find(w => w.employeeId === activeUser.id) || { score: 78, factors: { overtimeHours: 4, leaveUtilization: 20, daysSinceLastBreak: 14, daysSinceLastKudos: 1 } };

  // SLA Warnings for pending leave approvals (>48h SLA)
  const getSLAAging = (createdAtStr: string): { hours: number; isOverdue: boolean } => {
    const created = new Date(createdAtStr.replace(' ', 'T'));
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return {
      hours: diffHours,
      isOverdue: diffHours > 48
    };
  };

  // Actions Submissions
  const handleKudosSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosTo || !kudosMsg) return;
    giveKudos(kudosTo, kudosMsg);
    setKudosTo('');
    setKudosMsg('');
    setShowKudosModal(false);
  };

  const handleApprovalConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalTarget) return;

    if (approvalTarget.action === 'approve') {
      approveLeave(approvalTarget.id, approvalComment);
    } else {
      rejectLeave(approvalTarget.id, approvalComment);
    }

    setApprovalTarget(null);
    setApprovalComment('');
  };

  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await chatWithCopilot(userText);
      setChatMessages(prev => [...prev, { sender: 'bot', text: res.reply, sources: res.sources }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Error contacting AI Copilot. Please check system config.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen flex bg-[#F7F8FB] dark:bg-[#111520] transition-colors duration-200">

      {/* 1. Sidebar Nav (Desktop) */}
      <aside className="w-64 bg-white dark:bg-[#1E2433] border-r border-[#E4E7EE] dark:border-[#2D3748] flex flex-col justify-between flex-shrink-0 hidden lg:flex">
        <div className="p-6 space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#3B5BDB] flex items-center justify-center border border-[#3B5BDB]/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5c0-.733.08-1.448.232-2.138m8.322-.98a12.09 12.09 0 011.014 5.348c0 1.625-.26 3.19-.74 4.652m-1.846-9.171a12.003 12.003 0 01-4.849-7.986 11.963 11.963 0 00-5.32 8.986" />
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight font-display text-gray-900 dark:text-white block">NovaHR</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
                {currentUser.role === Role.HR || currentUser.role === Role.ADMIN ? 'Enterprise Admin' : 'Employee Portal'}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => router.push('/employees')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Employees
            </button>

            <button
              onClick={() => router.push('/attendance-leave')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              Attendance
            </button>

            <button
              onClick={() => router.push('/attendance-leave?tab=apply')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707" />
              </svg>
              Leave
            </button>

            <button
              onClick={() => router.push('/payroll-org')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" />
              </svg>
              Payroll
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* User Card Bottom */}
        <div className="p-6 border-t border-[#E4E7EE] dark:border-[#2D3748] space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={activeUser.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
              alt={activeUser.name}
              className="h-10 w-10 rounded-full border object-cover"
            />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{activeUser.name}</span>
              <span className="text-[10px] text-gray-500 block truncate">{activeUser.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full border border-[#E4E7EE] dark:border-[#2D3748] text-[#B91C1C] hover:bg-red-50 dark:hover:bg-red-950/20 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* 2. Main Page layout area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1E2433]/80 backdrop-blur-md border-b border-[#E4E7EE] dark:border-[#2D3748] h-16 flex items-center justify-between px-6 flex-shrink-0">
          
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">
              {activeRole === Role.HR || activeRole === Role.ADMIN ? 'HR Administration Control' 
              : activeRole === Role.MANAGER ? 'Manager Leadership Panel' : 'Employee Work Portal'}
            </h2>
            {impersonatingUser && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-[#FFFBEB] dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 text-[10px] font-bold text-[#B45309]">
                <span>Logged in as: {activeUser.name} ({activeUser.role})</span>
                <button onClick={() => impersonate(null)} className="underline hover:text-amber-800 ml-2">Exit Switch</button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 relative">
            
            {/* Search bar in header */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search employee or data..."
                className="w-64 pl-9 pr-4 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Impersonation toggle button for Admin */}
            {(currentUser.role === Role.HR || currentUser.role === Role.ADMIN) && (
              <button
                onClick={() => setShowImpersonateModal(true)}
                className="px-3.5 py-1.5 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Switch Context
              </button>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707-.707" />
                </svg>
              )}
            </button>

            {/* Alerts Bell notification */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 text-gray-600 dark:text-gray-300 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-0 right-0 h-4.5 w-4.5 rounded-full bg-[#B91C1C] border border-white text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl shadow-lg p-4 space-y-3 z-50">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E4E7EE] dark:border-[#2D3748]">
                    <span className="text-xs font-bold text-gray-700 dark:text-white uppercase tracking-wider">Alert Notifications</span>
                    <span className="text-[10px] text-gray-400">{notifications.length} logged</span>
                  </div>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-xs text-gray-400">No active alerts.</div>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                          notif.read ? 'bg-white dark:bg-transparent border-gray-100 dark:border-gray-800' : 'bg-[#EEF1FD] dark:bg-blue-950/20 border-[#E4E7EE] dark:border-[#2D3748]'
                        }`}>
                          <div className="flex justify-between font-bold text-gray-800 dark:text-white">
                            <span>{notif.title}</span>
                            {!notif.read && (
                              <button
                                onClick={() => dismissNotification(notif.id)}
                                className="text-[10px] text-[#3B5BDB] dark:text-[#5C7CFA] hover:underline"
                              >
                                Mark Read
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-[#6B7280] dark:text-gray-400 leading-normal">{notif.message}</p>
                          <span className="block text-[9px] text-gray-400 text-right">{notif.createdAt}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <img
              src={activeUser.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
              alt={activeUser.name}
              className="h-8 w-8 rounded-full border border-gray-200 object-cover"
            />
          </div>
        </header>

        {/* Scrollable Main workspace */}
        <main className="flex-1 overflow-y-auto p-6 space-y-8">

          {/* ==========================================
              SUBVIEW 1: REGULAR EMPLOYEE VIEW
              ========================================== */}
          {activeRole === Role.EMPLOYEE && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Profile Overview Banner */}
              <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl p-6 bg-white dark:bg-[#1E2433] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xs">
                <div className="flex gap-4 items-center">
                  <img
                    src={activeUser.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
                    alt={activeUser.name}
                    className="h-16 w-16 rounded-full border object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Hello, {activeUser.name}</h3>
                    <p className="text-xs text-[#6B7280] dark:text-gray-400 mt-0.5">{activeUser.role} • {activeUser.department} Team</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-4 py-2 border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-[#F7F8FB] dark:hover:bg-[#111520] transition-colors cursor-pointer"
                  >
                    View Profile Matrix
                  </button>
                  <button
                    onClick={() => router.push('/attendance-leave?tab=apply')}
                    className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Apply Time-Off
                  </button>
                </div>
              </div>

              {/* Grid Widgets (Leaves Donut, Wellness radar, Kudos feed) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
                
                {/* A. Leave Balance donut widget */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl bg-white dark:bg-[#1E2433] p-6 shadow-xs lg:col-span-4 space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Time-off Entitlements</h4>
                  <div className="relative flex items-center justify-center py-6">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="50" stroke="#F7F8FB" strokeWidth="12" fill="none" className="dark:stroke-gray-800"/>
                      <circle
                        cx="64"
                        cy="64"
                        r="50"
                        stroke="#3B5BDB"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={314.16}
                        strokeDashoffset={314.16 - (314.16 * usedPercentage) / 100}
                        className="transition-all duration-300"
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black block tracking-tight">{totalRemaining}</span>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Days left</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[#E4E7EE] dark:border-[#2D3748] pt-4 text-xs font-semibold">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#3B5BDB]"></span>
                        <span>Paid Leaves</span>
                      </div>
                      <span className="text-gray-500">{paidBal.remaining} left / {paidBal.allotted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#0EA5A4]"></span>
                        <span>Sick Leaves</span>
                      </div>
                      <span className="text-gray-500">{sickBal.remaining} left / {sickBal.allotted}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#B45309]"></span>
                        <span>Unpaid Leaves</span>
                      </div>
                      <span className="text-gray-500">{unpaidBal.remaining} left / {unpaidBal.allotted}</span>
                    </div>
                  </div>
                </div>

                {/* B. Wellness radar/breakdown index */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl bg-white dark:bg-[#1E2433] p-6 shadow-xs lg:col-span-4 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">My Wellness Index</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6FFFA] text-[#0EA5A4]">Healthy state</span>
                  </div>

                  <div className="flex flex-col justify-center items-center py-4">
                    <div className="text-4xl font-black font-display tracking-tight text-[#0EA5A4]">{userWellness.score}%</div>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">Burnout risk check</p>
                  </div>

                  <div className="space-y-3.5 border-t border-[#E4E7EE] dark:border-[#2D3748] pt-4 text-xs">
                    <div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span>Weekly Overtime Work</span>
                        <span className="font-bold text-gray-700 dark:text-white">{userWellness.factors.overtimeHours} hrs / limit 10</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#3B5BDB]" 
                          style={{ width: `${Math.min(100, (userWellness.factors.overtimeHours / 10) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span>Unused Leave Utilization</span>
                        <span className="font-bold text-gray-700 dark:text-white">{userWellness.factors.leaveUtilization}% used</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0EA5A4]" 
                          style={{ width: `${userWellness.factors.leaveUtilization}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-gray-500 mb-1">
                        <span>Time Since Last Off</span>
                        <span className="font-bold text-gray-700 dark:text-white">{userWellness.factors.daysSinceLastBreak} days worked</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#B45309]" 
                          style={{ width: `${Math.min(100, (userWellness.factors.daysSinceLastBreak / 30) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* C. Kudos Received Given wall */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl bg-white dark:bg-[#1E2433] p-6 shadow-xs lg:col-span-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Kudos Recognition Feed</h4>
                      <button
                        onClick={() => setShowKudosModal(true)}
                        className="text-xs text-[#3B5BDB] dark:text-[#5C7CFA] font-bold hover:underline cursor-pointer"
                      >
                        Give Kudos
                      </button>
                    </div>

                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {kudos.filter(k => k.toEmployeeId === activeUser.id).length === 0 ? (
                        <div className="text-center py-10 text-xs text-gray-400">No Kudos received yet. Be the first to recognize a colleague!</div>
                      ) : (
                        kudos.filter(k => k.toEmployeeId === activeUser.id).map(kud => (
                          <div key={kud.id} className="p-3 bg-[#EEF1FD] dark:bg-blue-950/20 border border-gray-100 dark:border-gray-800 rounded-lg text-xs space-y-1 animate-fade-in-up">
                            <div className="flex justify-between font-semibold text-gray-800 dark:text-white">
                              <span>From: {kud.fromName}</span>
                              <span className="text-[10px] text-gray-400">{kud.createdAt.split(' ')[0]}</span>
                            </div>
                            <p className="text-gray-500 leading-normal">"{kud.message}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Recent Leaves History list */}
              <div className="border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-2xl p-6 shadow-xs">
                <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-4">My Leave Applications History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E4E7EE] dark:border-[#2D3748] text-gray-400 font-semibold">
                        <th className="pb-3">Leave Type</th>
                        <th className="pb-3">Start Date</th>
                        <th className="pb-3">End Date</th>
                        <th className="pb-3">Remarks</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Approver Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.filter(r => r.employeeId === activeUser.id).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-6 text-gray-400">No leave requests logged.</td>
                        </tr>
                      ) : (
                        leaveRequests.filter(r => r.employeeId === activeUser.id).map(req => (
                          <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-[#F7F8FB] dark:hover:bg-[#111520] transition-colors">
                            <td className="py-3 font-semibold text-gray-700 dark:text-white">{req.leaveType}</td>
                            <td className="py-3 text-gray-500">{req.startDate}</td>
                            <td className="py-3 text-gray-500">{req.endDate}</td>
                            <td className="py-3 text-gray-500 max-w-xs truncate">{req.remarks}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                                req.status === LeaveStatus.APPROVED ? 'bg-[#E6FFFA] text-[#0EA5A4]' :
                                req.status === LeaveStatus.REJECTED ? 'bg-[#FDF2F2] text-[#B91C1C]' : 'bg-[#FFFBEB] text-[#B45309]'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                            <td className="py-3 text-gray-500">{req.approverComment || '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SUBVIEW 2: MANAGER DASHBOARD
              ========================================== */}
          {activeRole === Role.MANAGER && (
            <div className="space-y-8 animate-fade-in-up">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. SLA approvals count card */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl p-6 bg-white dark:bg-[#1E2433] space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider block">Team Leave Actions Queue</span>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black tabular-nums text-[#3B5BDB] dark:text-[#5C7CFA]">
                      {leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length} Pending
                    </span>
                    {leaveRequests.some(r => r.status === LeaveStatus.PENDING && getSLAAging(r.createdAt).isOverdue) && (
                      <span className="px-2 py-0.5 text-[9px] font-bold bg-[#FDF2F2] text-[#B91C1C] rounded-full">SLA Overdue</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 leading-normal">Ensure applications are processed within 48h to avoid team delay flags.</p>
                </div>

                {/* 2. Team attendance percentage */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl p-6 bg-white dark:bg-[#1E2433] space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider block">Today's Presence Matrix</span>
                  <span className="text-3xl font-black tabular-nums text-[#0EA5A4] dark:text-[#12C4C1]">92% Present</span>
                  <p className="text-xs text-gray-400">1 employee currently on approved leave.</p>
                </div>

                {/* 3. Team wellness alerts */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl p-6 bg-white dark:bg-[#1E2433] space-y-2 shadow-xs">
                  <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-wider block">Team Burnout Signals</span>
                  <span className="text-3xl font-black tabular-nums text-[#B45309]">1 High Overtime</span>
                  <p className="text-xs text-gray-400">Alex Rivera flagged with low Rest index.</p>
                </div>

              </div>

              {/* Pending Approvals Table */}
              <div className="border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-2xl p-6 shadow-xs space-y-4">
                <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Pending Leave Approvals Queue</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E4E7EE] dark:border-[#2D3748] text-gray-400 font-semibold">
                        <th className="pb-3">Employee Name</th>
                        <th className="pb-3">Leave Type</th>
                        <th className="pb-3">Duration</th>
                        <th className="pb-3">Applied Date</th>
                        <th className="pb-3">SLA Aging</th>
                        <th className="pb-3">Warnings</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.filter(r => r.status === LeaveStatus.PENDING).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-gray-400">All team approvals cleared! No pending requests.</td>
                        </tr>
                      ) : (
                        leaveRequests.filter(r => r.status === LeaveStatus.PENDING).map(req => {
                          const sla = getSLAAging(req.createdAt);
                          const hasOverlap = leaveRequests.some(r => 
                            r.status === LeaveStatus.APPROVED && 
                            r.employeeId !== req.employeeId &&
                            r.department === req.department &&
                            new Date(req.startDate) <= new Date(r.endDate) &&
                            new Date(r.startDate) <= new Date(req.endDate)
                          );

                          return (
                            <tr key={req.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-[#F7F8FB] dark:hover:bg-[#111520] transition-colors">
                              <td className="py-4 font-semibold text-gray-700 dark:text-white">{req.employeeName}</td>
                              <td className="py-4 text-gray-500">{req.leaveType}</td>
                              <td className="py-4 text-gray-500">{req.startDate} to {req.endDate}</td>
                              <td className="py-4 text-gray-400">{req.appliedDate}</td>
                              <td className="py-4">
                                <span className={`font-semibold ${sla.isOverdue ? 'text-[#B91C1C]' : 'text-gray-500'}`}>
                                  {sla.hours}h pending
                                </span>
                              </td>
                              <td className="py-4">
                                {hasOverlap ? (
                                  <span className="text-[10px] bg-[#FFFBEB] text-[#B45309] dark:bg-yellow-950/20 px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                                    ⚠ Overlap Conflict
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-[#E6FFFA] text-[#0EA5A4] px-2 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                                    No conflicts
                                  </span>
                                )}
                              </td>
                              <td className="py-4 flex gap-2">
                                <button
                                  onClick={() => setApprovalTarget({ id: req.id, action: 'approve' })}
                                  className="px-2.5 py-1 bg-[#15803D] hover:bg-[#166534] text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => setApprovalTarget({ id: req.id, action: 'reject' })}
                                  className="px-2.5 py-1 bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Reject
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SUBVIEW 3: ADMIN / HR VIEW (Matches Mockup!)
              ========================================== */}
          {(activeRole === Role.HR || activeRole === Role.ADMIN) && (
            <div className="space-y-8 animate-fade-in-up">
              
              {/* Header Action row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Welcome back, Admin</h3>
                  <p className="text-xs text-gray-500 mt-1">Here is what requires your attention today.</p>
                </div>
                <div className="flex gap-3">
                  <div className="px-3.5 py-2 bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 shadow-xs">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
                    </svg>
                    June 14, 2024
                  </div>
                  <button className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export Report
                  </button>
                </div>
              </div>

              {/* Analytics Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                
                <div className="premium-card p-5 space-y-3 relative overflow-hidden border-b-4 border-[#3B5BDB]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Employees</span>
                    <span className="text-[10px] font-bold text-[#15803D] bg-[#E6FFFA] px-1.5 py-0.5 rounded">+12%</span>
                  </div>
                  <div className="text-3xl font-black text-gray-800 dark:text-white">1,284</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#3B5BDB]"></span>
                    Active directory synchronised
                  </div>
                </div>

                <div className="premium-card p-5 space-y-3 relative overflow-hidden border-b-4 border-[#B91C1C]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pending Leave</span>
                    <span className="text-[10px] font-bold text-[#B91C1C] bg-[#FDF2F2] px-1.5 py-0.5 rounded">SLA Warning</span>
                  </div>
                  <div className="text-3xl font-black text-gray-800 dark:text-white">24 Requests</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#B91C1C]"></span>
                    Requires manager review
                  </div>
                </div>

                <div className="premium-card p-5 space-y-3 relative overflow-hidden border-b-4 border-[#0EA5A4]">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Attendance</span>
                    <span className="text-[10px] font-bold text-[#0EA5A4] bg-teal-50 dark:bg-teal-950/20 px-1.5 py-0.5 rounded">94.2%</span>
                  </div>
                  <div className="text-3xl font-black text-gray-800 dark:text-white">1,210</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5A4]"></span>
                    Present at office limits
                  </div>
                </div>

                <div className="premium-card p-5 space-y-3 relative overflow-hidden border-b-4 border-gray-500">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Attrition Risk</span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">Low Risk</span>
                  </div>
                  <div className="text-3xl font-black text-gray-800 dark:text-white">3.4%</div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                    Heuristics compile normal
                  </div>
                </div>

              </div>

              {/* Main Grid: Pending Approvals & Attendance Flags */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Column Left: Pending Approvals table */}
                <div className="premium-card p-6 lg:col-span-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Pending Approvals</h4>
                    <button onClick={() => router.push('/attendance-leave')} className="text-xs text-[#3B5BDB] dark:text-[#5C7CFA] font-bold hover:underline cursor-pointer">
                      View All
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4E7EE] dark:border-[#2D3748] text-gray-400 font-semibold">
                          <th className="pb-3">EMPLOYEE</th>
                          <th className="pb-3">TYPE</th>
                          <th className="pb-3">DATE APPLIED</th>
                          <th className="pb-3">STATUS</th>
                          <th className="pb-3">ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                          <td className="py-4 flex items-center gap-3">
                            <img
                              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=64"
                              alt="Sarah"
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <div>
                              <span className="font-bold text-gray-800 dark:text-white block">Sarah Jenkins</span>
                              <span className="text-[10px] text-gray-400">People Operations</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-500">Annual Leave</td>
                          <td className="py-4 text-gray-500">Oct 12, 2024</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-50 dark:bg-cyan-950/20 text-[#0EA5A4] border border-cyan-150">
                              REVIEWING
                            </span>
                          </td>
                          <td className="py-4 flex gap-2">
                            <button className="px-2.5 py-1 bg-[#15803D] hover:bg-[#166534] text-white text-[9px] font-bold rounded cursor-pointer">Approve</button>
                            <button className="px-2.5 py-1 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[9px] font-bold rounded cursor-pointer">Reject</button>
                          </td>
                        </tr>

                        <tr className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                          <td className="py-4 flex items-center gap-3">
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=64"
                              alt="Marcus"
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <div>
                              <span className="font-bold text-gray-800 dark:text-white block">Marcus Thorne</span>
                              <span className="text-[10px] text-gray-400">Product Design</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-500">Sick Leave</td>
                          <td className="py-4 text-gray-500">Oct 14, 2024</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FDF2F2] text-[#B91C1C] border border-red-150 animate-pulse">
                              URGENT
                            </span>
                          </td>
                          <td className="py-4 flex gap-2">
                            <button className="px-2.5 py-1 bg-[#15803D] hover:bg-[#166534] text-white text-[9px] font-bold rounded cursor-pointer">Approve</button>
                            <button className="px-2.5 py-1 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[9px] font-bold rounded cursor-pointer">Reject</button>
                          </td>
                        </tr>

                        <tr className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                          <td className="py-4 flex items-center gap-3">
                            <img
                              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=64"
                              alt="Alisha"
                              className="h-8 w-8 rounded-full border object-cover"
                            />
                            <div>
                              <span className="font-bold text-gray-800 dark:text-white block">Alisha Patel</span>
                              <span className="text-[10px] text-gray-400">Legal Team</span>
                            </div>
                          </td>
                          <td className="py-4 text-gray-500">Work from Home</td>
                          <td className="py-4 text-gray-500">Oct 15, 2024</td>
                          <td className="py-4">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#FFFBEB] text-[#B45309] border border-yellow-150">
                              PENDING
                            </span>
                          </td>
                          <td className="py-4 flex gap-2">
                            <button className="px-2.5 py-1 bg-[#15803D] hover:bg-[#166534] text-white text-[9px] font-bold rounded cursor-pointer">Approve</button>
                            <button className="px-2.5 py-1 bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[9px] font-bold rounded cursor-pointer">Reject</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Column Right: Attendance Flags panel */}
                <div className="premium-card p-6 lg:col-span-4 space-y-5">
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Attendance Flags</h4>
                  
                  <div className="space-y-4">
                    
                    <div className="p-3.5 border-l-4 border-red-500 bg-red-50/10 dark:bg-red-950/10 rounded-r-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          Late In - Repeated
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">John Doe has been late 4 times this week without a documented reason.</p>
                      <div className="flex gap-3 text-[10px] font-bold text-[#3B5BDB] dark:text-[#5C7CFA] pt-1">
                        <button className="hover:underline">Message John</button>
                        <button className="text-gray-400 hover:text-gray-600">Dismiss</button>
                      </div>
                    </div>

                    <div className="p-3.5 border-l-4 border-[#0EA5A4] bg-teal-50/10 dark:bg-teal-950/10 rounded-r-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#0EA5A4] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Missed Punch-out
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Elena Rossi logged 12 hours. Likely forgot to clock out at 6 PM.</p>
                      <div className="flex gap-3 text-[10px] font-bold text-[#3B5BDB] dark:text-[#5C7CFA] pt-1">
                        <button className="hover:underline">Auto-correct</button>
                        <button className="text-gray-400 hover:text-gray-600">Edit Entry</button>
                      </div>
                    </div>

                    <div className="p-3.5 border-l-4 border-[#3B5BDB] bg-blue-50/10 dark:bg-blue-950/10 rounded-r-xl space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-extrabold text-[#3B5BDB] flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Location Mismatch
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">Attendance logged from unauthorized IP range for Dave Wilson.</p>
                      <div className="flex gap-3 text-[10px] font-bold text-[#3B5BDB] dark:text-[#5C7CFA] pt-1">
                        <button className="hover:underline">Investigate</button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

              {/* Bottom Row: Headcount Trend & Leave Utilization Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left: Headcount Trend bar chart */}
                <div className="premium-card p-6 lg:col-span-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Headcount Trend</h4>
                    <select className="px-2 py-1 border border-[#E4E7EE] dark:border-[#2D3748] rounded text-[10px] font-bold dark:bg-[#111520] dark:text-white">
                      <option>Last 6 Months</option>
                    </select>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-64 flex flex-col justify-end pt-4">
                    <div className="flex-1 flex items-end justify-between px-4 pb-2 relative">
                      
                      {/* Grid background lines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 dark:opacity-10">
                        <div className="border-b w-full h-0"></div>
                        <div className="border-b w-full h-0"></div>
                        <div className="border-b w-full h-0"></div>
                        <div className="border-b w-full h-0"></div>
                      </div>

                      {/* Bar columns */}
                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">1,000</span>
                        <div className="h-32 w-8 bg-[#EEF1FD] dark:bg-blue-950/20 rounded-t-lg group-hover:bg-[#3B5BDB]/50 transition-colors"></div>
                        <span className="text-[10px] text-gray-400 font-semibold">Jan</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">1,050</span>
                        <div className="h-36 w-8 bg-[#EEF1FD] dark:bg-blue-950/20 rounded-t-lg group-hover:bg-[#3B5BDB]/50 transition-colors"></div>
                        <span className="text-[10px] text-gray-400 font-semibold">Feb</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">1,120</span>
                        <div className="h-40 w-8 bg-[#EEF1FD] dark:bg-blue-950/20 rounded-t-lg group-hover:bg-[#3B5BDB]/50 transition-colors"></div>
                        <span className="text-[10px] text-gray-400 font-semibold">Mar</span>
                      </div>

                      {/* Highlighted Apr column */}
                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 font-bold">1,200</span>
                        <div className="h-44 w-8 bg-[#3B5BDB] dark:bg-[#5C7CFA] rounded-t-lg shadow-sm"></div>
                        <span className="text-[10px] text-[#3B5BDB] dark:text-[#5C7CFA] font-bold">Apr</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">1,248</span>
                        <div className="h-48 w-8 bg-[#EEF1FD] dark:bg-blue-950/20 rounded-t-lg group-hover:bg-[#3B5BDB]/50 transition-colors"></div>
                        <span className="text-[10px] text-gray-400 font-semibold">May</span>
                      </div>

                      <div className="flex flex-col items-center gap-1 group z-10 w-12">
                        <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">1,284</span>
                        <div className="h-52 w-8 bg-[#EEF1FD] dark:bg-blue-950/20 rounded-t-lg group-hover:bg-[#3B5BDB]/50 transition-colors"></div>
                        <span className="text-[10px] text-gray-400 font-semibold">Jun</span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Right: Leave Utilization donut chart */}
                <div className="premium-card p-6 lg:col-span-4 space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Leave Utilization</h4>
                  
                  <div className="grid grid-cols-12 gap-4 items-center pt-2">
                    {/* Color legends left */}
                    <div className="col-span-6 space-y-3 text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#3B5BDB]"></span>
                        <div>
                          <span className="block text-gray-700 dark:text-gray-300">Annual Leave</span>
                          <span className="text-[10px] text-gray-400 block font-normal">62% Utilised</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#0EA5A4]"></span>
                        <div>
                          <span className="block text-gray-700 dark:text-gray-300">Sick Leave</span>
                          <span className="text-[10px] text-gray-400 block font-normal">18% Utilised</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-gray-400"></span>
                        <div>
                          <span className="block text-gray-700 dark:text-gray-300">Unpaid Leave</span>
                          <span className="text-[10px] text-gray-400 block font-normal">20% Utilised</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut chart right */}
                    <div className="col-span-6 relative flex items-center justify-center">
                      <svg className="w-28 h-28 transform -rotate-90">
                        <circle cx="56" cy="56" r="44" stroke="#F7F8FB" strokeWidth="10" fill="none" className="dark:stroke-gray-800"/>
                        <circle
                          cx="56"
                          cy="56"
                          r="44"
                          stroke="#3B5BDB"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={276.46}
                          strokeDashoffset={276.46 - (276.46 * 84) / 100}
                          className="transition-all duration-300"
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-base font-black block tracking-tight">84%</span>
                        <span className="text-[8px] text-[#0EA5A4] font-extrabold uppercase tracking-wide block">Active</span>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          )}

        </main>

      </div>

      {/* ==========================================
          AI COPILOT DOCKED CHAT SYSTEM (FAB Trigger)
          ========================================== */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowCopilot(!showCopilot)}
          className="h-14 w-14 rounded-full bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white flex items-center justify-center shadow-lg transition-all transform hover:scale-105 cursor-pointer border border-[#3B5BDB]/20"
          aria-label="HR AI Copilot"
        >
          {showCopilot ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>

        {showCopilot && (
          <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[480px] bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="p-4 bg-[#3B5BDB] dark:bg-[#111520] text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                <div>
                  <h4 className="text-xs font-bold font-display uppercase tracking-wider">NovaHR Copilot</h4>
                  <span className="text-[9px] text-white/60">Grounded in database rules & handbook</span>
                </div>
              </div>
              <button onClick={() => setShowCopilot(false)} className="text-white/60 hover:text-white text-xs">Close</button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gray-50/40 dark:bg-[#111520]/20">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-[#3B5BDB] text-white rounded-br-none' 
                      : 'bg-white dark:bg-[#1E2433] border border-gray-100 dark:border-gray-800 rounded-bl-none text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 px-1.5">
                      {msg.sources.map((src, sIdx) => (
                        <span key={sIdx} className="text-[8px] font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">
                          Source: {src.ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-1.5 p-2 text-xs text-gray-400 bg-white dark:bg-[#1E2433] border border-gray-100 dark:border-gray-800 w-24 rounded-full justify-center">
                  <span className="border-2 border-t-transparent border-gray-400 w-3 h-3 rounded-full animate-spin"></span>
                  typing...
                </div>
              )}
              <div ref={chatBottomRef}></div>
            </div>

            <div className="p-2 border-t border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] flex gap-1.5 overflow-x-auto text-[10px] font-semibold text-[#6B7280]">
              <button onClick={() => setChatInput('How many leaves do I have left?')} className="px-2 py-1 rounded bg-[#F7F8FB] dark:bg-[#111520] hover:bg-[#EEF1FD] whitespace-nowrap border">Leaves Left?</button>
              <button onClick={() => setChatInput('What is the company WFH policy?')} className="px-2 py-1 rounded bg-[#F7F8FB] dark:bg-[#111520] hover:bg-[#EEF1FD] whitespace-nowrap border">WFH Policy?</button>
              <button onClick={() => setChatInput('Who has pending leave requests?')} className="px-2 py-1 rounded bg-[#F7F8FB] dark:bg-[#111520] hover:bg-[#EEF1FD] whitespace-nowrap border">Pending Requests?</button>
            </div>

            <form onSubmit={handleChatSend} className="p-3 border-t border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask your question here..."
                className="flex-1 px-3 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              />
              <button type="submit" className="px-3 bg-[#3B5BDB] text-white text-xs font-bold rounded-xl hover:bg-[#2F4BC0] transition-colors cursor-pointer">Send</button>
            </form>
          </div>
        )}
      </div>

      {/* ==========================================
          DIALOG MODALS
          ========================================== */}

      {/* A. Impersonation switch dialog */}
      {showImpersonateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">Switch Impersonation context</h3>
              <p className="text-xs text-gray-400 mt-1">Select an employee directory entry to load their corresponding dashboard view.</p>
            </div>

            <div className="space-y-2">
              {employees.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => {
                    impersonate(emp.id === currentUser.id ? null : emp.id);
                    setShowImpersonateModal(false);
                  }}
                  className="w-full p-2.5 border border-[#E4E7EE] dark:border-[#2D3748] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] rounded-xl flex justify-between items-center text-xs text-left cursor-pointer"
                >
                  <div>
                    <span className="font-semibold block">{emp.name}</span>
                    <span className="text-[10px] text-gray-400">{emp.department} • {emp.role}</span>
                  </div>
                  <span className="text-[#3B5BDB] dark:text-[#5C7CFA] font-bold">Select &gt;</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowImpersonateModal(false)}
              className="w-full py-2 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-600 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* B. Give Kudos dialog */}
      {showKudosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleKudosSubmit} className="bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">Give Recognition Kudos</h3>
              <p className="text-xs text-gray-400 mt-1">Publicly appreciate a colleague. Highlights are posted directly to the feed.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Select Colleague *</label>
                <select
                  required
                  value={kudosTo}
                  onChange={(e) => setKudosTo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                >
                  <option value="">— Select Colleague —</option>
                  {employees.filter(e => e.id !== activeUser.id).map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Recognition Message *</label>
                <textarea
                  required
                  rows={3}
                  maxLength={200}
                  value={kudosMsg}
                  onChange={(e) => setKudosMsg(e.target.value)}
                  placeholder="Appreciate their work..."
                  className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#3B5BDB] text-white hover:bg-[#2F4BC0] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Send Kudos
              </button>
              <button
                type="button"
                onClick={() => setShowKudosModal(false)}
                className="flex-1 py-2.5 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-600 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* D. Approve/Reject Comment modal */}
      {approvalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleApprovalConfirm} className="bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">
                {approvalTarget.action === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">Provide review justifications comments below.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Review Comments *</label>
              <textarea
                required
                rows={3}
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder={approvalTarget.action === 'approve' ? 'Confirming request...' : 'Reason for rejection...'}
                className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className={`flex-1 py-2 rounded-lg text-xs font-bold text-white transition-all cursor-pointer ${
                  approvalTarget.action === 'approve' ? 'bg-[#15803D] hover:bg-[#166534]' : 'bg-[#B91C1C] hover:bg-[#991B1B]'
                }`}
              >
                Confirm {approvalTarget.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
              <button
                type="button"
                onClick={() => { setApprovalTarget(null); setApprovalComment(''); }}
                className="flex-1 py-2 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

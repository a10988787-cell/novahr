'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role } from '@/context/AppContext';

export default function EmployeesPage() {
  const router = useRouter();
  const {
    currentUser,
    activeRole,
    impersonatingUser,
    employees,
    notifications,
    impersonate,
    signup,
    logout,
    dismissNotification,
    chatWithCopilot
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Add Employee Form States
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>(Role.EMPLOYEE);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

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

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!newId || !newName || !newEmail) {
      setAddError('All fields marked with an asterisk are required.');
      return;
    }

    const res = await signup(newId, newName, newEmail, newRole);
    if (res.success) {
      setAddSuccess('Employee successfully added to the active directory!');
      setNewId('');
      setNewName('');
      setNewEmail('');
      setNewRole(Role.EMPLOYEE);
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1500);
    } else {
      setAddError(res.error || 'Failed to enroll employee.');
    }
  };

  // Filter Employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesDept = !deptFilter || emp.department === deptFilter;
    const matchesRole = !roleFilter || emp.role === roleFilter;
    const matchesStatus = !statusFilter || emp.status === statusFilter;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  // Unique departments for filtering dropdown
  const departmentsList = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Dashboard
            </button>

            <button
              onClick={() => router.push('/employees')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] cursor-pointer"
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

        {/* User profile bottom bar */}
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

      {/* 2. Main Page Layout Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1E2433]/80 backdrop-blur-md border-b border-[#E4E7EE] dark:border-[#2D3748] h-16 flex items-center justify-between px-6 flex-shrink-0">
          
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">Employee Directory</h2>
          </div>

          <div className="flex items-center gap-4 relative">
            
            {/* Search bar inside header */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search employee or data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-9 pr-4 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* AI Copilot toggle button */}
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className="px-3.5 py-1.5 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Copilot
            </button>

            {/* Theme Toggle Switcher */}
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

            {/* Notifications Alert Bell */}
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

        {/* Scrollable Main content */}
        <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-6">
          
          {/* Header Action row */}
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Employee Roster</h3>
              <p className="text-xs text-gray-500 mt-1">Manage corporate personnel records and switch user contexts.</p>
            </div>
            
            {(currentUser.role === Role.HR || currentUser.role === Role.ADMIN) && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                + Add Employee
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="premium-card p-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Search Directory</label>
              <input
                type="text"
                placeholder="Search by name, email or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter Department</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              >
                <option value="">— All Departments —</option>
                {departmentsList.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              >
                <option value="">— All Roles —</option>
                <option value={Role.EMPLOYEE}>Employee</option>
                <option value={Role.MANAGER}>Manager</option>
                <option value={Role.HR}>HR Officer</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
              >
                <option value="">— All Statuses —</option>
                <option value="active">Active Directory</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </div>

          {/* Directory Grid of Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEmployees.map(emp => {
              const isSelected = activeUser.id === emp.id;
              return (
                <div
                  key={emp.id}
                  className={`premium-card p-5 space-y-4 relative flex flex-col justify-between border ${
                    isSelected ? 'border-[#3B5BDB] dark:border-[#5C7CFA] ring-1 ring-[#3B5BDB]/10' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <img
                      src={emp.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
                      alt={emp.name}
                      className="h-14 w-14 rounded-full border object-cover shadow-xs"
                    />
                    <div className="overflow-hidden space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-gray-900 dark:text-white truncate block">{emp.name}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${
                          emp.status === 'active' ? 'bg-[#E6FFFA] text-[#0EA5A4]' : 'bg-[#FDF2F2] text-[#B91C1C]'
                        }`}>
                          {emp.status === 'active' ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">{emp.role} • {emp.department}</span>
                      <span className="text-[10px] text-gray-400 block truncate">{emp.email}</span>
                    </div>
                  </div>

                  {emp.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {emp.skills.slice(0, 3).map(skill => (
                        <span key={skill.name} className="px-2 py-0.5 rounded bg-[#EEF1FD] dark:bg-blue-950/20 text-[#3B5BDB] dark:text-[#5C7CFA] text-[8px] font-bold border border-[#3B5BDB]/5">
                          {skill.name} (Lvl {skill.level})
                        </span>
                      ))}
                      {emp.skills.length > 3 && (
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 text-[8px] font-bold">
                          +{emp.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="border-t border-[#E4E7EE] dark:border-[#2D3748] pt-3 flex gap-2">
                    <button
                      onClick={() => {
                        impersonate(emp.id === currentUser.id ? null : emp.id);
                      }}
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] border border-[#3B5BDB]/20' 
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-[#E4E7EE] dark:border-[#2D3748] hover:bg-[#F7F8FB]'
                      }`}
                    >
                      {isSelected ? 'Reset View' : 'Impersonate'}
                    </button>
                    <button
                      onClick={() => {
                        if (emp.id !== currentUser.id) {
                          impersonate(emp.id);
                        }
                        router.push('/profile');
                      }}
                      className="px-3.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 border border-[#E4E7EE] dark:border-[#2D3748] hover:bg-[#F7F8FB] rounded-lg text-xs font-semibold cursor-pointer"
                      title="Edit details"
                    >
                      View Profile Matrix
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

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
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form onSubmit={handleAddEmployeeSubmit} className="bg-white dark:bg-[#1E2433] border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold font-display text-gray-900 dark:text-white">Enroll New Employee</h3>
              <p className="text-xs text-gray-400 mt-1">Registers employee credentials and allocates their base leave configuration.</p>
            </div>

            {addError && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-100">{addError}</div>}
            {addSuccess && <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded border border-emerald-100">{addSuccess}</div>}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Employee Code / ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP006"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elena Rossi"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Corporate Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. elena@novahr.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Assigned RBAC Role *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                >
                  <option value={Role.EMPLOYEE}>Regular Employee</option>
                  <option value={Role.MANAGER}>Department Manager</option>
                  <option value={Role.HR}>HR Officer</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-[#3B5BDB] text-white rounded-xl text-xs font-bold cursor-pointer">Enroll Employee</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-600 rounded-xl text-xs font-semibold cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

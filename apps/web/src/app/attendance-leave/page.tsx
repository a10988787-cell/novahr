'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role, LeaveType, LeaveStatus, AttendanceStatus } from '@/context/AppContext';

export default function AttendanceLeavePage() {
  const router = useRouter();
  const {
    currentUser,
    activeRole,
    impersonatingUser,
    attendance,
    leaveBalances,
    leaveRequests,
    checkIn,
    checkOut,
    applyLeave,
    logout
  } = useApp();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

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

  const activeUser = impersonatingUser || currentUser;

  // Tabs states
  const [activeView, setActiveView] = useState<'tracker' | 'apply' | 'history'>('tracker');
  
  // Geolocation Simulation coordinates states
  const [useGeofence, setUseGeofence] = useState(true);
  const [simLat, setSimLat] = useState(37.3382); // Office Latitude (San Jose, CA)
  const [simLng, setSimLng] = useState(-121.8863); // Office Longitude
  const [simDistance, setSimDistance] = useState(0); // distance in meters

  // QR Check-in scanner simulation state
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  
  // Leave Form States
  const [leaveType, setLeaveType] = useState<LeaveType>(LeaveType.PAID);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [leaveError, setLeaveError] = useState('');
  const [leaveSuccess, setLeaveSuccess] = useState('');
  const [leaveWarning, setLeaveWarning] = useState('');

  // Check-in check-out check state
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = attendance.find(a => a.employeeId === activeUser.id && a.date === todayStr);

  // Delegation authority simulation state
  const [delegatedManager, setDelegatedManager] = useState('');
  const [delegationSuccess, setDelegationSuccess] = useState('');

  // Recalculate mock distance when user drags sliders
  useEffect(() => {
    // Office defaults coords: lat: 37.3382, lng: -121.8863
    const R = 6371e3; // Earth radius in meters
    const phi1 = (simLat * Math.PI) / 180;
    const phi2 = (37.3382 * Math.PI) / 180;
    const deltaPhi = ((37.3382 - simLat) * Math.PI) / 180;
    const deltaLambda = ((-121.8863 - simLng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setSimDistance(Math.round(R * c));
  }, [simLat, simLng]);

  // Sidebar link routing helper
  const handleSidebarNavigate = (tab: 'dashboard' | 'profile' | 'attendance' | 'payroll') => {
    if (tab === 'dashboard') router.push('/dashboard');
    if (tab === 'profile') router.push('/profile');
    if (tab === 'attendance') router.push('/attendance-leave');
    if (tab === 'payroll') router.push('/payroll-org');
  };

  // Check-in action execution
  const handleCheckIn = () => {
    let res;
    if (useGeofence) {
      res = checkIn(simLat, simLng, undefined);
    } else {
      res = checkIn(undefined, undefined, 'OFFICE-DESK-QR-MAIN-2026');
    }

    if (res.success) {
      window.location.reload(); // Reload context state
    }
  };

  const handleCheckOut = () => {
    checkOut();
    window.location.reload();
  };

  // QR scan mock bypass code
  const handleScanMockQR = () => {
    setScannedCode('OFFICE-DESK-QR-MAIN-2026');
    checkIn(undefined, undefined, 'OFFICE-DESK-QR-MAIN-2026');
    setShowQrScanner(false);
    setTimeout(() => window.location.reload(), 500);
  };

  // Leave Submit execution
  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveSuccess('');
    setLeaveWarning('');

    if (!startDate || !endDate || !remarks) {
      setLeaveError('Time-off calendar boundaries and comments are required.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
      setLeaveError('Start date cannot fall after the end date.');
      return;
    }

    const res = applyLeave(leaveType, startDate, endDate, remarks);
    if (res.success) {
      setLeaveSuccess('Leave request logged in database. Awaiting manager approval.');
      if (res.warning) {
        setLeaveWarning(res.warning);
      }
      // Reset form
      setStartDate('');
      setEndDate('');
      setRemarks('');
    } else {
      setLeaveError(res.error || 'Failed to submit leave request.');
    }
  };

  // Submit manager delegation settings
  const handleDelegationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatedManager) return;
    
    setDelegationSuccess(`Temporary approval authority delegated successfully to: ${delegatedManager}`);
    setTimeout(() => setDelegationSuccess(''), 4000);
  };

  // Seed days list for calendar widget
  const calendarDays = Array.from({ length: 30 }).map((_, i) => {
    const day = i + 1;
    const dateStr = `2026-07-${day < 10 ? '0' + day : day}`;
    const attRecord = attendance.find(a => a.employeeId === activeUser.id && a.date === dateStr);
    const leaveRecord = leaveRequests.find(l => l.employeeId === activeUser.id && l.status === LeaveStatus.APPROVED && dateStr >= l.startDate && dateStr <= l.endDate);
    
    return {
      day,
      dateStr,
      attRecord,
      leaveRecord
    };
  });

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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Employees
            </button>

            <button
              onClick={() => router.push('/attendance-leave')}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] cursor-pointer"
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

        {/* Sidebar user card info */}
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
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">Attendance & Time-Off</h2>
          </div>

          <div className="flex items-center gap-4">
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

            <span className="text-xs text-gray-400 font-semibold self-center">Employee ID: {activeUser.id}</span>
          </div>
        </header>

        {/* Scrollable Main content */}
        <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-8">
          
          {/* Sub navigation menus */}
          <div className="flex border-b border-[#E4E7EE] dark:border-[#2D3748] gap-6 pb-1">
            <button
              onClick={() => setActiveView('tracker')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeView === 'tracker'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Daily Attendance Shift Tracker
            </button>
            <button
              onClick={() => setActiveView('apply')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeView === 'apply'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Apply Time-Off Request
            </button>
          </div>

          {/* ==========================================
              VIEW A: DAILY TRACKER (Geofence QR scans)
              ========================================== */}
          {activeView === 'tracker' && (
            <div className="space-y-8">
              
              {/* Daily check in out buttons & Location Simulator */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* 1. Daily check actions */}
                <div className="premium-card p-6 md:col-span-5 space-y-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Attendance Clock</h4>
                    <p className="text-xs text-gray-400 mt-1">Check-in registers your active work shift. Status updates immediately.</p>
                  </div>

                  <div className="py-4 text-center space-y-1">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Logged Status</span>
                    {todayRecord ? (
                      <div className="space-y-2">
                        <span className="text-2xl font-black text-[#0EA5A4] dark:text-[#12C4C1]">SIGNED IN PRESENT</span>
                        <div className="text-xs text-gray-500 tabular-nums">
                          Check In: {todayRecord.checkInTime} • Check Out: {todayRecord.checkOutTime || 'Active Shift'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-2xl font-black text-gray-400">NOT CHECKED IN</span>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleCheckIn}
                      disabled={!!todayRecord}
                      className="flex-1 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white py-3 rounded-xl text-xs font-bold tracking-tight shadow disabled:opacity-50 transition-all cursor-pointer"
                    >
                      Clock In Shift
                    </button>
                    <button
                      onClick={handleCheckOut}
                      disabled={!todayRecord || !!todayRecord.checkOutTime}
                      className="flex-1 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-700 dark:text-gray-200 hover:bg-[#F7F8FB] dark:hover:bg-[#111520] py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Clock Out Shift
                    </button>
                  </div>
                </div>

                {/* 2. Geofence scanner simulator */}
                <div className="premium-card p-6 md:col-span-7 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Location verification Simulator</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setUseGeofence(true)}
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                          useGeofence ? 'bg-[#EEF1FD] text-[#3B5BDB] border-[#3B5BDB]/20' : 'bg-transparent text-gray-400'
                        }`}
                      >
                        GPS Coordinate
                      </button>
                      <button
                        onClick={() => setUseGeofence(false)}
                        className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                          !useGeofence ? 'bg-[#EEF1FD] text-[#3B5BDB] border-[#3B5BDB]/20' : 'bg-transparent text-gray-400'
                        }`}
                      >
                        Desk QR Scan
                      </button>
                    </div>
                  </div>

                  {useGeofence ? (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-400 leading-normal">Drag sliders to adjust device coordinates relative to office limits (Allowed limit: 200 meters).</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Simulated Lat:</span>
                            <span className="text-[#3B5BDB]">{simLat.toFixed(4)}</span>
                          </div>
                          <input
                            type="range"
                            min="37.3300"
                            max="37.3450"
                            step="0.0005"
                            value={simLat}
                            onChange={(e) => setSimLat(Number(e.target.value))}
                            className="w-full h-1 bg-[#E4E7EE] dark:bg-[#2D3748] rounded appearance-none accent-[#3B5BDB]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Simulated Lng:</span>
                            <span className="text-[#3B5BDB]">{simLng.toFixed(4)}</span>
                          </div>
                          <input
                            type="range"
                            min="-121.8950"
                            max="-121.8750"
                            step="0.0005"
                            value={simLng}
                            onChange={(e) => setSimLng(Number(e.target.value))}
                            className="w-full h-1 bg-[#E4E7EE] dark:bg-[#2D3748] rounded appearance-none accent-[#3B5BDB]"
                          />
                        </div>
                      </div>

                      <div className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                        simDistance <= 200 ? 'bg-[#E6FFFA] border-teal-100 text-[#0EA5A4]' : 'bg-[#FDF2F2] border-red-100 text-[#B91C1C]'
                      }`}>
                        <span className="font-semibold">Simulated Distance from Office center:</span>
                        <span className="font-bold">{simDistance} meters ({simDistance <= 200 ? 'Inside range' : 'Out of Geofence'})</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center py-2">
                      <p className="text-xs text-gray-400">Scan code posted at office workspace desks to check in.</p>
                      
                      {showQrScanner ? (
                        <div className="w-32 h-32 mx-auto border-2 border-dashed border-[#E4E7EE] dark:border-[#2D3748] rounded bg-gray-50 dark:bg-gray-800 flex flex-col justify-center items-center gap-2 cursor-pointer">
                          <button
                            type="button"
                            onClick={handleScanMockQR}
                            className="px-2.5 py-1.5 bg-[#3B5BDB] text-white rounded text-[10px] font-bold"
                          >
                            Simulate Scan
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowQrScanner(true)}
                          className="px-6 py-2.5 border border-[#E4E7EE] dark:border-[#2D3748] text-gray-700 dark:text-gray-200 hover:bg-[#F7F8FB] rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Trigger Desk QR Camera
                        </button>
                      )}
                    </div>
                  )}

                </div>

              </div>

              {/* Monthly calendar view */}
              <div className="premium-card p-6 space-y-4">
                <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">My Attendance Calendar Index (July 2026)</h4>
                
                <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-2 border-b border-[#E4E7EE] dark:border-[#2D3748]">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {/* Empty offsets for starting day in July 2026 (July 1st is Wednesday -> 2 empty offsets) */}
                  <span className="p-4 bg-transparent"></span>
                  <span className="p-4 bg-transparent"></span>

                  {calendarDays.map(dayObj => {
                    let bgClass = 'bg-[#F7F8FB] dark:bg-[#111520] text-gray-400';
                    let statusLabel = '';
                    
                    if (dayObj.attRecord) {
                      if (dayObj.attRecord.anomalyFlag) {
                        bgClass = 'bg-red-50 dark:bg-red-950/20 text-[#B91C1C] border border-red-100';
                        statusLabel = 'Anomaly';
                      } else {
                        bgClass = 'bg-teal-50 dark:bg-teal-950/20 text-[#0EA5A4] border border-teal-100';
                        statusLabel = 'Present';
                      }
                    } else if (dayObj.leaveRecord) {
                      bgClass = 'bg-blue-50 dark:bg-blue-950/20 text-[#3B5BDB] border border-blue-100';
                      statusLabel = 'Leave';
                    }

                    return (
                      <div 
                        key={dayObj.day} 
                        className={`p-3 rounded-lg flex flex-col justify-between items-center text-xs h-16 transition-all ${bgClass}`}
                        title={dayObj.attRecord?.anomalyReason || ''}
                      >
                        <span className="font-bold self-start">{dayObj.day}</span>
                        {statusLabel && (
                          <span className="text-[8px] font-extrabold uppercase tracking-wide block truncate max-w-full">{statusLabel}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              VIEW B: APPLY TIME-OFF (Conflict checks)
              ========================================== */}
          {activeView === 'apply' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Apply Form */}
              <form onSubmit={handleLeaveSubmit} className="premium-card p-6 lg:col-span-7 space-y-6 h-fit">
                <div>
                  <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Request Time-Off Application</h4>
                  <p className="text-xs text-gray-400 mt-1">Apply for Paid, Sick, or Unpaid leaves. System evaluates conflicts immediately.</p>
                </div>

                {leaveError && (
                  <div className="p-3 bg-[#FDF2F2] border border-[#FDE8E8] rounded-lg text-xs text-[#B91C1C]">
                    {leaveError}
                  </div>
                )}

                {leaveSuccess && (
                  <div className="p-3 bg-[#F3FAF7] border border-[#DEF7EC] rounded-lg text-xs text-[#15803D]">
                    {leaveSuccess}
                  </div>
                )}

                {leaveWarning && (
                  <div className="p-3.5 bg-[#FFFBEB] dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl space-y-1.5 text-xs text-[#B45309]">
                    <span className="font-bold block text-[13px]">Conflict Detection Alert:</span>
                    <p className="leading-relaxed">{leaveWarning}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label htmlFor="lv-type" className="block text-xs font-semibold mb-1">Time-off classification *</label>
                    <select
                      id="lv-type"
                      value={leaveType}
                      onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                    >
                      <option value={LeaveType.PAID}>Paid Leave</option>
                      <option value={LeaveType.SICK}>Sick Leave</option>
                      <option value={LeaveType.UNPAID}>Unpaid Leave</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="lv-start" className="block text-xs font-semibold mb-1">Start Calendar Date *</label>
                    <input
                      id="lv-start"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="lv-end" className="block text-xs font-semibold mb-1">End Calendar Date *</label>
                    <input
                      id="lv-end"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <span className="text-[10px] text-gray-400 font-semibold mb-2">Auto-Decrement:</span>
                    <span className="text-xs font-bold text-gray-700 dark:text-white pb-2.5">
                      {startDate && endDate 
                        ? `${Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1} Days`
                        : '0 Days'}
                    </span>
                  </div>
                </div>

                <div>
                  <label htmlFor="lv-remarks" className="block text-xs font-semibold mb-1">Audit description comments *</label>
                  <textarea
                    id="lv-remarks"
                    required
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide details for justification..."
                    className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white resize-none"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E4E7EE] dark:border-[#2D3748]">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Submit Request
                  </button>
                </div>
              </form>

              {/* Right Column: Active Balances & Delegation (Visible only to Managers/Admins) */}
              <div className="space-y-6 lg:col-span-5">
                
                {/* leave balance list */}
                <div className="premium-card p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">My Leave Entitlement Balances</h4>
                  <div className="space-y-3">
                    {(leaveBalances[activeUser.id] || []).map(bal => (
                      <div key={bal.leaveType} className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-800 dark:text-white block">{bal.leaveType}</span>
                          <span className="text-[10px] text-gray-400 block">{bal.used} days utilized</span>
                        </div>
                        <span className="text-sm font-black text-[#3B5BDB] dark:text-[#5C7CFA]">{bal.remaining} remaining</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Manager delegation tools */}
                {activeRole === Role.MANAGER && (
                  <form onSubmit={handleDelegationSubmit} className="premium-card p-6 space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Delegate approvals Authority</h4>
                      <p className="text-[10px] text-gray-400 mt-1">Temporarily assign approval duties to a peer manager while on leave.</p>
                    </div>

                    {delegationSuccess && (
                      <div className="p-2 bg-[#F3FAF7] border border-[#DEF7EC] rounded text-[10px] text-[#15803D]">
                        {delegationSuccess}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <label htmlFor="del-peer" className="block text-[10px] font-semibold mb-1">Select Peer Delegate *</label>
                        <select
                          id="del-peer"
                          required
                          value={delegatedManager}
                          onChange={(e) => setDelegatedManager(e.target.value)}
                          className="w-full px-3 py-2 text-[11px] border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                        >
                          <option value="">— Select Colleague —</option>
                          <option value="Sarah Jenkins">Sarah Jenkins (HR Admin)</option>
                          <option value="Taylor Smith">Taylor Smith (HR Associate)</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Confirm Delegation
                      </button>
                    </div>
                  </form>
                )}

              </div>

            </div>
          )}

        </main>

      </div>

    </div>
  );
}

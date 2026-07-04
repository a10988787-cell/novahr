'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role } from '@/context/AppContext';

export default function ProfilePage() {
  const router = useRouter();
  const {
    currentUser,
    activeRole,
    impersonatingUser,
    updateProfile,
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
  const [activeSection, setActiveSection] = useState<'personal' | 'job' | 'skills' | 'documents' | 'history'>('personal');
  
  // Forms States (Personal Detail editable by anyone)
  const [phone, setPhone] = useState(activeUser.phone || '');
  const [address, setAddress] = useState(activeUser.address || '');
  const [photoUrl, setPhotoUrl] = useState(activeUser.photoUrl || '');
  const [editSuccess, setEditSuccess] = useState('');

  // Admin Forms States (Job details editable only by HR/Admin)
  const [jobTitle, setJobTitle] = useState(activeUser.role);
  const [departmentName, setDepartmentName] = useState(activeUser.department);
  const [statusVal, setStatusVal] = useState(activeUser.status);
  const [adminSuccess, setAdminSuccess] = useState('');

  // Skill Editor state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState(3);
  const [skillsList, setSkillsList] = useState(activeUser.skills || []);

  // Onboarding OCR Simulator state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [ocrPreFill, setOcrPreFill] = useState<any | null>(null);
  const [ocrConfirmed, setOcrConfirmed] = useState(false);
  
  // Sync form states with activeUser context changes (especially when impersonating switches)
  useEffect(() => {
    setPhone(activeUser.phone || '');
    setAddress(activeUser.address || '');
    setPhotoUrl(activeUser.photoUrl || '');
    setSkillsList(activeUser.skills || []);
    setJobTitle(activeUser.role);
    setDepartmentName(activeUser.department);
    setStatusVal(activeUser.status);
    setOcrPreFill(null);
    setSelectedFile(null);
  }, [activeUser]);

  // Sidebar link routing helper
  const handleSidebarNavigate = (tab: 'dashboard' | 'profile' | 'attendance' | 'payroll') => {
    if (tab === 'dashboard') router.push('/dashboard');
    if (tab === 'profile') router.push('/profile');
    if (tab === 'attendance') router.push('/attendance-leave');
    if (tab === 'payroll') router.push('/payroll-org');
  };

  // Profile saving handler (Personal Details)
  const handlePersonalSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(activeUser.id, {
      phone,
      address,
      photoUrl
    });
    setEditSuccess('Personal contact details updated successfully.');
    setTimeout(() => setEditSuccess(''), 3000);
  };

  // Job details saving handler (HR Admin only)
  const handleAdminSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role !== Role.HR && currentUser.role !== Role.ADMIN) return;

    updateProfile(activeUser.id, {
      role: jobTitle,
      department: departmentName,
      status: statusVal
    });
    setAdminSuccess('Administrative job metrics updated.');
    setTimeout(() => setAdminSuccess(''), 3000);
  };

  // Add skill tag handler
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;

    // Check if skill already exists
    if (skillsList.some(s => s.name.toLowerCase() === newSkillName.toLowerCase().trim())) {
      return;
    }

    const updated = [...skillsList, { name: newSkillName.trim(), level: newSkillLevel }];
    setSkillsList(updated);
    updateProfile(activeUser.id, { skills: updated });
    setNewSkillName('');
    setNewSkillLevel(3);
  };

  // Remove skill tag handler
  const handleRemoveSkill = (name: string) => {
    const updated = skillsList.filter(s => s.name !== name);
    setSkillsList(updated);
    updateProfile(activeUser.id, { skills: updated });
  };

  // OCR Onboarding Document Upload Simulator
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setOcrPreFill(null);
      setOcrConfirmed(false);
    }
  };

  const handleStartOCRScan = () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setScanProgress(10);
    
    // Simulate OCR text extraction progress
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          
          // Generate mock pre-filled data based on file name or defaults
          const fName = selectedFile.name.toLowerCase();
          let extracted = {
            docName: selectedFile.name,
            docType: fName.includes('passport') ? 'Passport ID' : fName.includes('license') ? 'Drivers License' : 'Academic Degree',
            extractedName: activeUser.name,
            extractedId: activeUser.id,
            expiryDate: '2031-12-31',
            verifiedBy: 'NovaHR System OCR Core'
          };
          
          setOcrPreFill(extracted);
          return 100;
        }
        return prev + 30;
      });
    }, 600);
  };

  const handleConfirmOCR = () => {
    if (!ocrPreFill) return;

    // Append document to user profile
    const newDoc = {
      id: `doc-${Date.now()}`,
      name: ocrPreFill.docName,
      type: ocrPreFill.docType,
      url: '#',
      ocrData: ocrPreFill,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    const updatedDocs = [...(activeUser.documents || []), newDoc];
    updateProfile(activeUser.id, { documents: updatedDocs });
    setOcrConfirmed(true);
    setOcrPreFill(null);
    setSelectedFile(null);
  };

  const isHRAdmin = currentUser.role === Role.HR || currentUser.role === Role.ADMIN;

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
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] cursor-pointer"
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

      {/* 2. Main Page layout content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#1E2433]/80 backdrop-blur-md border-b border-[#E4E7EE] dark:border-[#2D3748] h-16 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">Profile Management</h2>
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

        {/* Scrollable workspace */}
        <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-8">
          
          {/* Top Profile Summary Badge */}
          <div className="premium-card p-6 flex flex-col sm:flex-row gap-6 items-center">
            <img
              src={activeUser.photoUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120'}
              alt={activeUser.name}
              className="h-20 w-20 rounded-full border-2 border-[#3B5BDB] object-cover shadow"
            />
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">{activeUser.name}</h3>
              <p className="text-xs text-gray-500">{activeUser.role} • {activeUser.department} Team</p>
              <div className="flex gap-1.5 pt-1.5 justify-center sm:justify-start">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                  activeUser.status === 'active' ? 'bg-[#E6FFFA] text-[#0EA5A4]' : 'bg-[#FDF2F2] text-[#B91C1C]'
                }`}>{activeUser.status === 'active' ? 'ACTIVE DIRECTORY' : 'INACTIVE'}</span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/20 dark:text-blue-400">
                  Profile Version v{activeUser.versionHistory[0]?.version || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Selector Navigation Menu */}
          <div className="flex border-b border-[#E4E7EE] dark:border-[#2D3748] gap-6 pb-1">
            <button
              onClick={() => setActiveSection('personal')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'personal'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Contact Details
            </button>
            <button
              onClick={() => setActiveSection('job')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'job'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Administrative Settings
            </button>
            <button
              onClick={() => setActiveSection('skills')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'skills'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Skills Matrix
            </button>
            <button
              onClick={() => setActiveSection('documents')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'documents'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Onboarding Docs OCR
            </button>
            <button
              onClick={() => setActiveSection('history')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeSection === 'history'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Audit Diffs History
            </button>
          </div>

          {/* ==========================================
              SECTION A: PERSONAL DETAIL FORM
              ========================================== */}
          {activeSection === 'personal' && (
            <form onSubmit={handlePersonalSave} className="premium-card p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Contact & Profile Settings</h4>
                <p className="text-xs text-gray-400 mt-1">This information is editable by the employee and synced into the org chart database.</p>
              </div>

              {editSuccess && (
                <div className="p-3 bg-[#F3FAF7] border border-[#DEF7EC] rounded-lg text-xs text-[#15803D]">
                  {editSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="prof-phone" className="block text-xs font-semibold mb-1">Corporate Phone Number *</label>
                  <input
                    id="prof-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="prof-photo" className="block text-xs font-semibold mb-1">Profile Photo Image URL *</label>
                  <input
                    id="prof-photo"
                    type="text"
                    required
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="prof-address" className="block text-xs font-semibold mb-1">Residential Street Address *</label>
                  <input
                    id="prof-address"
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E4E7EE] dark:border-[#2D3748]">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* ==========================================
              SECTION B: ADMINISTRATIVE JOB SETTINGS (RBAC lock!)
              ========================================== */}
          {activeSection === 'job' && (
            <div className="space-y-6">
              
              {/* RBAC access banner */}
              {!isHRAdmin && (
                <div className="p-4 bg-[#FFFBEB] dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl flex gap-3 text-xs text-[#B45309]">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <span className="font-bold text-[13px] block">Role-Based Protection Active</span>
                    <p className="leading-relaxed mt-0.5">Job metrics, department associations, and active directory status are read-only. Modification requires HR Lead permission credentials.</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleAdminSave} className="premium-card p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Organizational Settings</h4>
                  <p className="text-xs text-gray-400 mt-1">Configures role permission filters and manager hierarchy mappings.</p>
                </div>

                {adminSuccess && (
                  <div className="p-3 bg-[#F3FAF7] border border-[#DEF7EC] rounded-lg text-xs text-[#15803D]">
                    {adminSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="job-title" className="block text-xs font-semibold mb-1">Corporate Role Title</label>
                    <select
                      id="job-title"
                      disabled={!isHRAdmin}
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value as Role)}
                      className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white disabled:opacity-60"
                    >
                      <option value={Role.EMPLOYEE}>Regular Employee</option>
                      <option value={Role.MANAGER}>Department Manager</option>
                      <option value={Role.HR}>HR Officer</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="job-dept" className="block text-xs font-semibold mb-1">Assigned Department</label>
                    <input
                      id="job-dept"
                      type="text"
                      disabled={!isHRAdmin}
                      value={departmentName}
                      onChange={(e) => setDepartmentName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label htmlFor="job-status" className="block text-xs font-semibold mb-1">Directory status</label>
                    <select
                      id="job-status"
                      disabled={!isHRAdmin}
                      value={statusVal}
                      onChange={(e) => setStatusVal(e.target.value as 'active' | 'inactive')}
                      className="w-full px-3 py-2 text-sm border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white disabled:opacity-60"
                    >
                      <option value="active">Active Directory</option>
                      <option value="inactive">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                {isHRAdmin && (
                  <div className="flex justify-end pt-4 border-t border-[#E4E7EE] dark:border-[#2D3748]">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Update Job Details
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* ==========================================
              SECTION C: SKILL TAGS EDITOR
              ========================================== */}
          {activeSection === 'skills' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              
              {/* Left Form: Add skills */}
              <form onSubmit={handleAddSkill} className="premium-card p-6 lg:col-span-5 space-y-4 h-fit">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">Add Professional Skill Tag</h4>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="sk-name" className="block text-xs font-semibold mb-1">Skill Title *</label>
                    <input
                      id="sk-name"
                      type="text"
                      required
                      placeholder="e.g. Next.js Tailwind"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="sk-level" className="block text-xs font-semibold mb-1">Self-Declared Proficiency Level *</label>
                    <select
                      id="sk-level"
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                    >
                      <option value="1">Level 1: Novice / Fundamental</option>
                      <option value="2">Level 2: Basic Practitioner</option>
                      <option value="3">Level 3: Intermediate / Capable</option>
                      <option value="4">Level 4: Advanced Specialist</option>
                      <option value="5">Level 5: Expert / Advisor</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Save Skill Tag
                </button>
              </form>

              {/* Right List: Active skills */}
              <div className="premium-card p-6 lg:col-span-7 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">My Skill Matrix Directory</h4>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {skillsList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-gray-400">No skill tags configured. Use the form to tag capabilities.</div>
                  ) : (
                    skillsList.map(skill => (
                      <div key={skill.name} className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1">
                          <span className="font-bold text-gray-800 dark:text-white">{skill.name}</span>
                          <div className="flex gap-1">
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span 
                                key={idx} 
                                className={`h-1.5 w-4 rounded-full ${
                                  idx < skill.level ? 'bg-[#3B5BDB]' : 'bg-[#E4E7EE] dark:bg-gray-800'
                                }`}
                              ></span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="text-[10px] text-[#B91C1C] font-bold hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SECTION D: ONBOARDING DOCUMENTS & OCR SIMULATION
              ========================================== */}
          {activeSection === 'documents' && (
            <div className="space-y-6">
              
              {/* Document upload box */}
              <div className="premium-card p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Onboarding Certificate Upload & OCR Engine</h4>
                  <p className="text-xs text-gray-400 mt-1">Upload an ID card or certificate photo. The simulated OCR extracts DOB/details for confirmation before pre-filling.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left: Input Drag drop */}
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-[#E4E7EE] dark:border-[#2D3748] hover:border-[#3B5BDB] rounded-2xl p-8 text-center bg-gray-50/50 dark:bg-[#111520]/20 transition-all">
                      <input
                        type="file"
                        id="ocr-file"
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      <label htmlFor="ocr-file" className="cursor-pointer space-y-2 block">
                        <svg className="w-10 h-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="block text-xs font-bold text-gray-700 dark:text-white">Choose document file</span>
                        <span className="block text-[10px] text-gray-400">Supports PDF, JPG, PNG (Max 5MB)</span>
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="p-3 bg-[#EEF1FD] dark:bg-blue-950/20 border border-gray-100 dark:border-gray-800 rounded-xl flex justify-between items-center text-xs">
                        <span className="font-semibold text-gray-700 dark:text-white truncate max-w-[200px]">{selectedFile.name}</span>
                        <button
                          onClick={handleStartOCRScan}
                          disabled={isScanning}
                          className="px-3 py-1.5 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white rounded font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isScanning ? `Scanning ${scanProgress}%` : 'Start OCR Scan'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Simulated OCR Results review panel */}
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">OCR Text Extraction Review</span>
                    
                    {ocrPreFill ? (
                      <div className="p-4 border border-yellow-200 dark:border-yellow-900/50 bg-[#FFFBEB] dark:bg-yellow-950/20 rounded-xl space-y-4">
                        <div className="text-xs space-y-2 leading-relaxed">
                          <span className="font-bold text-[#B45309] block text-[13px]">Verify Extracted Records:</span>
                          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                            <div>
                              <span className="text-gray-400 block">Extracted Name</span>
                              <span className="font-bold text-gray-700 dark:text-white">{ocrPreFill.extractedName}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Document ID Type</span>
                              <span className="font-bold text-gray-700 dark:text-white">{ocrPreFill.docType}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Extracted Code</span>
                              <span className="font-bold text-gray-700 dark:text-white">{ocrPreFill.extractedId}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block">Calculated Expiry</span>
                              <span className="font-bold text-gray-700 dark:text-white">{ocrPreFill.expiryDate}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={handleConfirmOCR}
                            className="flex-1 py-1.5 bg-[#15803D] hover:bg-[#166534] text-white text-xs font-bold rounded cursor-pointer"
                          >
                            Confirm Pre-fill
                          </button>
                          <button
                            onClick={() => setOcrPreFill(null)}
                            className="flex-1 py-1.5 bg-white dark:bg-gray-800 text-gray-600 border rounded text-xs font-semibold cursor-pointer"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-center text-xs text-gray-400">
                        Upload and click scan to run OCR extraction simulation.
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* Uploaded Documents Grid */}
              <div className="premium-card p-6 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">My Uploaded Documents Registry</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(!activeUser.documents || activeUser.documents.length === 0) ? (
                    <div className="col-span-2 text-center py-6 text-xs text-gray-400">No documents registered. Onboard your certificates above.</div>
                  ) : (
                    activeUser.documents.map(doc => (
                      <div key={doc.id} className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-gray-800 dark:text-white block truncate max-w-[180px]">{doc.name}</span>
                          <span className="text-[10px] text-gray-400 block">{doc.type} • Uploaded {doc.uploadedAt}</span>
                        </div>
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="text-[10px] text-[#3B5BDB] dark:text-[#5C7CFA] font-bold hover:underline"
                        >
                          Download file
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SECTION E: PROFILE EDIT DIFFS AUDIT HISTORY
              ========================================== */}
          {activeSection === 'history' && (
            <div className="premium-card p-6 space-y-6">
              <div>
                <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Profile Version History Audit Trail</h4>
                <p className="text-xs text-gray-400 mt-1">Audit log of all modifications, timestamps, and authorized actors tracking profile history changes.</p>
              </div>

              <div className="relative border-l-2 border-[#E4E7EE] dark:border-[#2D3748] pl-6 ml-4 space-y-6 pt-2">
                {activeUser.versionHistory.map((ver, idx) => (
                  <div key={idx} className="relative text-xs">
                    {/* Circle timeline dot */}
                    <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#3B5BDB] bg-white dark:bg-[#1E2433]"></span>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-800 dark:text-white">Profile Version {ver.version}</span>
                        <span className="text-[10px] bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/20 px-2 py-0.5 rounded font-bold">{ver.date}</span>
                      </div>
                      <p className="text-gray-500 leading-relaxed pt-0.5">{ver.changes}</p>
                      <span className="block text-[10px] text-gray-400">Authorized Actor: {ver.updatedBy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

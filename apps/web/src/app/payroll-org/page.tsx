'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp, Role } from '@/context/AppContext';

export default function PayrollOrgPage() {
  const router = useRouter();
  const {
    currentUser,
    activeRole,
    impersonatingUser,
    employees,
    payroll,
    updatePayroll,
    logout
  } = useApp();

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  if (!currentUser) return null;

  const activeUser = impersonatingUser || currentUser;

  // View tabs
  const [activeTab, setActiveTab] = useState<'payroll' | 'org' | 'skills'>('payroll');

  // Search filter inside skill matrix
  const [skillQuery, setSkillQuery] = useState('');

  // Admin Payroll Edit state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editBase, setEditBase] = useState(6000);
  const [editHra, setEditHra] = useState(1000);
  const [editSpecial, setEditSpecial] = useState(500);
  const [editTax, setEditTax] = useState(150);

  // Selected Payslip for PDF simulator print modal
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);

  // Collapsible org chart node toggle state
  const [collapseMarcus, setCollapseMarcus] = useState(false);
  const [collapseSarah, setCollapseSarah] = useState(false);

  // Sync state when active user changes
  useEffect(() => {
    setEditingEmpId(null);
  }, [activeUser]);

  // Sidebar link routing helper
  const handleSidebarNavigate = (tab: 'dashboard' | 'profile' | 'attendance' | 'payroll') => {
    if (tab === 'dashboard') router.push('/dashboard');
    if (tab === 'profile') router.push('/profile');
    if (tab === 'attendance') router.push('/attendance-leave');
    if (tab === 'payroll') router.push('/payroll-org');
  };

  // Find payroll details
  const getPayrollRecord = (empId: string) => {
    return payroll.find(p => p.employeeId === empId) || {
      employeeId: empId,
      baseSalary: 5000,
      allowances: [{ type: 'HRA', amount: 800 }],
      deductions: [{ type: 'Professional Tax', amount: 150 }],
      effectiveMonth: '2026-06'
    };
  };

  const getNetSalary = (rec: any) => {
    const totalAllowances = rec.allowances.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    const totalDeductions = rec.deductions.reduce((acc: number, curr: any) => acc + curr.amount, 0);
    return rec.baseSalary + totalAllowances - totalDeductions;
  };

  // Payroll save handler (Admin/HR only)
  const handlePayrollUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;

    updatePayroll(
      editingEmpId,
      editBase,
      [{ type: 'HRA', amount: editHra }, { type: 'Special Allowance', amount: editSpecial }],
      [{ type: 'Professional Tax', amount: editTax }]
    );
    setEditingEmpId(null);
  };

  // Mock print payslip
  const handlePrintPayslip = (payslip: any) => {
    setSelectedPayslip(payslip);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Heuristic Payroll Anomaly Detection Check:
  // Flags any MoM (month-over-month) net change above 15% threshold.
  const checkPayrollAnomaly = (empId: string): { isAnomaly: boolean; reason: string | null } => {
    const currentRec = getPayrollRecord(empId);
    const currentNet = getNetSalary(currentRec);
    
    // Simulating last month record (e.g. standard seed base)
    // EMP003 Alex Rivera base modified during simulation causes anomaly
    const baseLineSalary = empId === 'EMP003' ? 5500 : 7000;
    const diffRatio = Math.abs(currentNet - baseLineSalary) / baseLineSalary;

    if (diffRatio > 0.15) {
      return {
        isAnomaly: true,
        reason: `Anomaly Detected: Net salary shifted by ${Math.round(diffRatio * 100)}% MoM (exceeds 15% alert threshold). Double-check before disburals.`
      };
    }

    return { isAnomaly: false, reason: null };
  };

  const isHRAdmin = activeRole === Role.HR || activeRole === Role.ADMIN;

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
            <span className="text-base font-extrabold tracking-tight font-display text-gray-900 dark:text-white">NovaHR</span>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => handleSidebarNavigate('dashboard')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Overview Dashboard
            </button>

            <button
              onClick={() => handleSidebarNavigate('profile')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile Matrix
            </button>

            <button
              onClick={() => handleSidebarNavigate('attendance')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg text-[#6B7280] hover:text-[#111827] hover:bg-[#F7F8FB] dark:hover:bg-[#111520] dark:text-gray-400 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
              </svg>
              Attendance & Leave
            </button>

            <button
              onClick={() => handleSidebarNavigate('payroll')}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/40 dark:text-[#5C7CFA] cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" />
              </svg>
              Payroll & Org Structure
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

      {/* 2. Page main panel */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Navigation header */}
        <header className="bg-white dark:bg-[#1E2433] border-b border-[#E4E7EE] dark:border-[#2D3748] h-16 flex items-center px-6 justify-between flex-shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-1 hover:bg-[#F7F8FB] rounded dark:hover:bg-gray-800 text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-bold font-display text-gray-900 dark:text-white">Org Structure & Financials</h2>
          </div>
        </header>

        {/* Scrollable Main workspace */}
        <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto space-y-8 print:p-0 print:max-w-none">
          
          {/* Sub Navigation headers */}
          <div className="flex border-b border-[#E4E7EE] dark:border-[#2D3748] gap-6 pb-1 print:hidden">
            <button
              onClick={() => setActiveTab('payroll')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'payroll'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Company Payroll Ledger
            </button>
            <button
              onClick={() => setActiveTab('org')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'org'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Hierarchy Org Chart
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`pb-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'skills'
                  ? 'border-[#3B5BDB] text-[#3B5BDB] dark:border-[#5C7CFA] dark:text-[#5C7CFA]'
                  : 'border-transparent text-gray-400 hover:text-gray-800'
              }`}
            >
              Searchable Skills directory
            </button>
          </div>

          {/* ==========================================
              SECTION A: COMPANY PAYROLL LEDGER
              ========================================== */}
          {activeTab === 'payroll' && (
            <div className="space-y-8 print:hidden">
              
              {/* Employee view: Read-only Payslips */}
              {!isHRAdmin && (
                <div className="premium-card p-6 space-y-4">
                  <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">My Financial Structure & Payslips</h4>
                  
                  {/* Detailed breakdown card */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50/50 dark:bg-gray-800/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                    <div>
                      <span className="text-gray-400 block mb-1">Contract Base Salary</span>
                      <span className="text-lg font-bold tabular-nums text-gray-800 dark:text-white">
                        ${getPayrollRecord(activeUser.id).baseSalary.toLocaleString()}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">HRA & Allowances</span>
                      <span className="text-lg font-bold tabular-nums text-gray-800 dark:text-white">
                        ${getPayrollRecord(activeUser.id).allowances.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}/mo
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-1">Deductions (PTax)</span>
                      <span className="text-lg font-bold tabular-nums text-[#B91C1C]">
                        -${getPayrollRecord(activeUser.id).deductions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}/mo
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block pt-4">Monthly payslip downloads</span>
                  <div className="space-y-3">
                    {/* June Payslip */}
                    <div className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">Payslip - June 2026</span>
                        <span className="text-[10px] text-gray-400 block">Status: Disbursed June 30, 2026</span>
                      </div>
                      <button
                        onClick={() => handlePrintPayslip({ month: 'June 2026', rec: getPayrollRecord(activeUser.id) })}
                        className="px-3 py-1.5 border rounded text-[#3B5BDB] font-bold text-[11px] hover:bg-[#EEF1FD]"
                      >
                        Print Payslip PDF
                      </button>
                    </div>

                    {/* May Payslip */}
                    <div className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">Payslip - May 2026</span>
                        <span className="text-[10px] text-gray-400 block">Status: Disbursed May 31, 2026</span>
                      </div>
                      <button
                        onClick={() => handlePrintPayslip({ month: 'May 2026', rec: getPayrollRecord(activeUser.id) })}
                        className="px-3 py-1.5 border rounded text-[#3B5BDB] font-bold text-[11px] hover:bg-[#EEF1FD]"
                      >
                        Print Payslip PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Control: Full payroll edit dashboard & Anomaly alerts */}
              {isHRAdmin && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left: Payroll list & Anomaly highlight */}
                  <div className="premium-card p-6 lg:col-span-8 space-y-4">
                    <h4 className="text-sm font-bold font-display uppercase tracking-wider text-gray-700 dark:text-gray-300">Administrative Payroll controls</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-[#E4E7EE] dark:border-[#2D3748] text-gray-400 font-semibold">
                            <th className="pb-3">Employee</th>
                            <th className="pb-3">Base</th>
                            <th className="pb-3">Net Salary</th>
                            <th className="pb-3">Financial Alerts</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map(emp => {
                            const rec = getPayrollRecord(emp.id);
                            const net = getNetSalary(rec);
                            const anomaly = checkPayrollAnomaly(emp.id);

                            return (
                              <tr key={emp.id} className="border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-[#F7F8FB] dark:hover:bg-[#111520] transition-colors">
                                <td className="py-4 font-semibold text-gray-700 dark:text-white">{emp.name}</td>
                                <td className="py-4 text-gray-500 tabular-nums">${rec.baseSalary.toLocaleString()}</td>
                                <td className="py-4 font-bold text-gray-800 dark:text-white tabular-nums">${net.toLocaleString()}</td>
                                <td className="py-4">
                                  {anomaly.isAnomaly ? (
                                    <span className="text-[9px] text-[#B91C1C] bg-[#FDF2F2] dark:bg-red-950/20 px-2 py-0.5 rounded font-bold max-w-xs block truncate" title={anomaly.reason || ''}>
                                      ⚠ {anomaly.reason}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                                <td className="py-4">
                                  <button
                                    onClick={() => {
                                      setEditingEmpId(emp.id);
                                      setEditBase(rec.baseSalary);
                                      // allowances extraction defaults
                                      setEditHra(1000);
                                      setEditSpecial(500);
                                      setEditTax(150);
                                    }}
                                    className="text-xs text-[#3B5BDB] dark:text-[#5C7CFA] font-bold hover:underline cursor-pointer"
                                  >
                                    Adjust Salary
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right: Salary adjust form drawer */}
                  <div className="lg:col-span-4 space-y-4">
                    {editingEmpId ? (
                      <form onSubmit={handlePayrollUpdate} className="premium-card p-6 space-y-4 h-fit">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700 block">Adjust salary details: {employees.find(e => e.id === editingEmpId)?.name}</span>
                        
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-semibold mb-1">Base Salary (USD)</label>
                            <input
                              type="number"
                              required
                              value={editBase}
                              onChange={(e) => setEditBase(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[10px] font-semibold mb-1">HRA Allowance</label>
                            <input
                              type="number"
                              required
                              value={editHra}
                              onChange={(e) => setEditHra(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold mb-1">Special Allowance</label>
                            <input
                              type="number"
                              required
                              value={editSpecial}
                              onChange={(e) => setEditSpecial(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-semibold mb-1">PTax Deductions</label>
                            <input
                              type="number"
                              required
                              value={editTax}
                              onChange={(e) => setEditTax(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs border border-[#E4E7EE] dark:border-[#2D3748] rounded focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="submit"
                            className="flex-1 py-2 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white text-xs font-bold rounded cursor-pointer"
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingEmpId(null)}
                            className="flex-1 py-2 border text-gray-500 rounded text-xs font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-6 border border-dashed border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl text-center text-xs text-gray-400">
                        Select adjust salary on the left list to update structures.
                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {/* ==========================================
              SECTION B: ORG STRUCTURE TREE VIEW
              ========================================== */}
          {activeTab === 'org' && (
            <div className="premium-card p-6 space-y-6 print:hidden">
              <div>
                <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Collapsible Corporate Org Chart</h4>
                <p className="text-xs text-gray-400 mt-1">Hierarchical tree graph rendering reporting structure from the active database.</p>
              </div>

              {/* Render Org Chart tree layout */}
              <div className="flex flex-col items-center py-6 text-xs select-none">
                
                {/* Node Level 1: CEO/HR Sarah */}
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => setCollapseSarah(!collapseSarah)}
                    className="p-3 border-2 border-[#3B5BDB] bg-[#EEF1FD] dark:bg-blue-950/20 rounded-xl text-center cursor-pointer shadow-xs"
                  >
                    <span className="font-extrabold block">Sarah Jenkins</span>
                    <span className="text-[10px] text-gray-500 block">HR Lead (EMP001)</span>
                  </div>

                  {!collapseSarah && (
                    <>
                      {/* Connection Vertical connector line */}
                      <div className="h-8 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>
                      
                      {/* Children node wrapper */}
                      <div className="relative flex justify-center gap-16 border-t-2 border-[#E4E7EE] dark:border-[#2D3748] pt-6">
                        
                        {/* Left subtree: Marcus Vance Manager */}
                        <div className="flex flex-col items-center relative">
                          {/* Anchor connector line */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 h-6 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>

                          <div 
                            onClick={() => setCollapseMarcus(!collapseMarcus)}
                            className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-xl text-center cursor-pointer shadow-xs"
                          >
                            <span className="font-extrabold block">Marcus Vance</span>
                            <span className="text-[10px] text-gray-500 block">Engineering Manager (EMP002)</span>
                          </div>

                          {!collapseMarcus && (
                            <>
                              <div className="h-8 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>
                              <div className="relative flex gap-8 border-t border-[#E4E7EE] dark:border-[#2D3748] pt-6">
                                
                                {/* Employee Alex Rivera */}
                                <div className="flex flex-col items-center relative">
                                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 h-6 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>
                                  <div className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-xl text-center shadow-xs">
                                    <span className="font-extrabold block">Alex Rivera</span>
                                    <span className="text-[10px] text-gray-500 block">Developer (EMP003)</span>
                                  </div>
                                </div>

                                {/* Employee Jordan Chen */}
                                <div className="flex flex-col items-center relative">
                                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 h-6 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>
                                  <div className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-xl text-center shadow-xs">
                                    <span className="font-extrabold block">Jordan Chen</span>
                                    <span className="text-[10px] text-gray-500 block">Designer (EMP004)</span>
                                  </div>
                                </div>

                              </div>
                            </>
                          )}
                        </div>

                        {/* Right subtree: Taylor Smith Coordinator */}
                        <div className="flex flex-col items-center relative">
                          {/* Anchor connector line */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 h-6 w-0.5 bg-[#E4E7EE] dark:bg-[#2D3748]"></div>

                          <div className="p-3 border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] rounded-xl text-center shadow-xs">
                            <span className="font-extrabold block">Taylor Smith</span>
                            <span className="text-[10px] text-gray-500 block">HR Associate (EMP005)</span>
                          </div>
                        </div>

                      </div>
                    </>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              SECTION C: SEARCHABLE SKILLS DIRECTORY
              ========================================== */}
          {activeTab === 'skills' && (
            <div className="premium-card p-6 space-y-6 print:hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-bold font-display text-gray-800 dark:text-white uppercase tracking-wider">Internal Mobility Skill Directory</h4>
                  <p className="text-xs text-gray-400 mt-1">Search team directory matrix to identify expertise tags and proficiencies.</p>
                </div>
                
                {/* Search input field */}
                <input
                  type="text"
                  placeholder="Search skills e.g. figma, lead"
                  value={skillQuery}
                  onChange={(e) => setSkillQuery(e.target.value)}
                  className="w-full sm:w-64 px-3 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3B5BDB] dark:bg-[#111520] dark:text-white"
                />
              </div>

              {/* Directory list results */}
              <div className="space-y-4 pt-2">
                {employees.filter(emp => 
                  !skillQuery || 
                  emp.name.toLowerCase().includes(skillQuery.toLowerCase()) ||
                  emp.skills.some(s => s.name.toLowerCase().includes(skillQuery.toLowerCase()))
                ).length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400">No employees match skill search metrics.</div>
                ) : (
                  employees.filter(emp => 
                    !skillQuery || 
                    emp.name.toLowerCase().includes(skillQuery.toLowerCase()) ||
                    emp.skills.some(s => s.name.toLowerCase().includes(skillQuery.toLowerCase()))
                  ).map(emp => (
                    <div key={emp.id} className="p-4 border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl flex flex-col md:flex-row justify-between gap-4 text-xs">
                      <div>
                        <span className="font-bold text-gray-800 dark:text-white block">{emp.name}</span>
                        <span className="text-[10px] text-gray-400 block">{emp.role} • {emp.department}</span>
                      </div>
                      
                      {/* Skill tags badges row */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {emp.skills.map(s => (
                          <span 
                            key={s.name} 
                            className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950/20 dark:text-blue-400 border border-[#3B5BDB]/10"
                          >
                            {s.name} (Lvl {s.level})
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ==========================================
              PDF PRINT PREVIEW SCREEN (Visible only during print)
              ========================================== */}
          {selectedPayslip && (
            <div className="hidden print:block p-8 space-y-6 text-xs text-black bg-white min-h-screen">
              <div className="flex justify-between items-center border-b pb-4">
                <div>
                  <h1 className="text-xl font-bold font-display uppercase tracking-tight">NovaHR Corporates Inc.</h1>
                  <span className="text-[10px] text-gray-500">Corporate Employee Payslip Advice</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold block">Month: {selectedPayslip.month}</span>
                  <span className="text-[10px] text-gray-400">Disbursed via Direct Bank Transfer</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4">
                <div>
                  <span className="font-bold block mb-1.5 uppercase tracking-wider text-[10px] text-gray-500">Employee Details:</span>
                  <p>Name: <strong>{activeUser.name}</strong></p>
                  <p>Code: {activeUser.id}</p>
                  <p>Role: {activeUser.role}</p>
                  <p>Department: {activeUser.department}</p>
                </div>
                <div>
                  <span className="font-bold block mb-1.5 uppercase tracking-wider text-[10px] text-gray-500">Organization Info:</span>
                  <p>Head Office: San Jose, CA</p>
                  <p>Reference ID: {selectedPayslip.rec.effectiveMonth}-PAYSLIP-{activeUser.id}</p>
                  <p>Tax State: California Compliance (CA)</p>
                </div>
              </div>

              <div className="pt-6">
                <table className="w-full border text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-150 border-b font-semibold">
                      <th className="p-2 border">Earnings / Salary Allowances</th>
                      <th className="p-2 border text-right">Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 border">Contract base salary</td>
                      <td className="p-2 border text-right">${selectedPayslip.rec.baseSalary.toLocaleString()}</td>
                    </tr>
                    {selectedPayslip.rec.allowances.map((al: any, idx: number) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2 border">{al.type} allowance</td>
                        <td className="p-2 border text-right">${al.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-bold border-b">
                      <td className="p-2 border">Gross Salary Advice</td>
                      <td className="p-2 border text-right">
                        ${(selectedPayslip.rec.baseSalary + selectedPayslip.rec.allowances.reduce((a:number,c:any)=>a+c.amount,0)).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-red-50 text-[#B91C1C] border-b">
                      <td className="p-2 border">Deductions (Professional Tax / Insurance)</td>
                      <td className="p-2 border text-right">
                        -${selectedPayslip.rec.deductions.reduce((a:number,c:any)=>a+c.amount,0).toLocaleString()}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50 text-[#15803D] font-black border-b text-sm">
                      <td className="p-2 border">Net Take-Home Salary Disbursal</td>
                      <td className="p-2 border text-right">${getNetSalary(selectedPayslip.rec).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-12 text-center text-[10px] text-gray-400 space-y-1">
                <p>This is a computer-generated payslip advice, processed under NovaHR payroll ledger protocols.</p>
                <p>Authorization Signature: <strong> Sarah Jenkins (HR Officer) </strong></p>
              </div>
            </div>
          )}

        </main>

      </div>

    </div>
  );
}

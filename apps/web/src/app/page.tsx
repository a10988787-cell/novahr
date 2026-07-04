'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'attrition' | 'leave' | 'geofence'>('attrition');
  
  // Interactive Calculator State
  const [overtime, setOvertime] = useState(8); // hours
  const [leaveUsed, setLeaveUsed] = useState(50); // %
  const [daysSinceBreak, setDaysSinceBreak] = useState(14);
  const [kudosCount, setKudosCount] = useState(3);

  // Compute mock wellness score
  const calculateWellnessScore = () => {
    // 100 max. Overtime deducts points: -2 per hour. Leave util adds points up to 30. Days since break deducts: -0.5 per day over 7. Kudos adds: +4 per kudos.
    let base = 100;
    base -= overtime * 2.5;
    base -= Math.max(0, daysSinceBreak - 7) * 0.8;
    base += kudosCount * 3.5;
    // leave balance contribution: 100% util is good, 0% is bad
    const leaveFactor = (leaveUsed / 100) * 15;
    base = base - (15 - leaveFactor);
    
    return Math.max(10, Math.min(100, Math.round(base)));
  };

  const wellnessScore = calculateWellnessScore();

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How does the Attrition Risk scoring actually work?",
      a: "Unlike opaque machine-learning models, NovaHR uses a transparent, explainable heuristics engine. It weights observable compliance markers such as overtime trends, consecutive days worked without breaks, unused leave balances, and kudos frequencies. The exact calculation is visible to HR administrators at all times in the risk details drawer, preventing 'black-box' decisions."
    },
    {
      q: "Can we integrate NovaHR with our Slack or Microsoft Teams channels?",
      a: "Yes! NovaHR includes outbound webhook connections. In the settings, administrators can register a channel webhook. Status changes on leave requests, new employee kudos, and verified check-in alerts are instantly pushed as formatted messages to your team chat."
    },
    {
      q: "What is the geofenced and QR-code check-in system?",
      a: "To prevent remote buddy-punching, employees checking in from the dashboard can utilize two methods: Geolocation verification (which checks if their device coordinates lie within 200m of the office center) or scanning a secure office desk QR code. If check-ins occur outside these limits, the attendance record is flagged as an anomaly with the exact reason."
    },
    {
      q: "Is there a statutory payroll engine included?",
      a: "No. Statutory tax calculations (TDS, EPF, ESI, national tax slabs) vary extensively by region and are explicitly out-of-scope. NovaHR handles base salary structures, monthly allowance/deduction listings, and generates downloadable payslip PDFs based on active attendance and approved leaves."
    },
    {
      q: "How does the Smart Leave Conflict Detection system warning fire?",
      a: "When an employee submits a leave request, our scheduler instantly scans active approvals in their department. If the overlapping period causes the department's active presence to drop below 75% or intersects with an admin-configured blackout period, a non-blocking warning is shown to both the employee and the approver before submission."
    },
    {
      q: "Who has access to view salary details and personal documents?",
      a: "NovaHR enforces strict role-based access control (RBAC). Salary details and personal onboarding documents are visible only to the owning employee and HR Administrators. Mid-level Managers can view team attendance and approve leave requests, but have zero visibility into their team members' payroll structures or private certificate uploads."
    }
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FB] dark:bg-[#111520] text-[#111827] dark:text-[#F3F4F6] font-sans selection:bg-[#3B5BDB] selection:text-white transition-colors duration-200">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#1E2433]/80 backdrop-blur-md border-b border-[#E4E7EE] dark:border-[#2D3748]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#3B5BDB] flex items-center justify-center border border-[#3B5BDB]/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 009 11.5c0-.733.08-1.448.232-2.138m8.322-.98a12.09 12.09 0 011.014 5.348c0 1.625-.26 3.19-.74 4.652m-1.846-9.171a12.003 12.003 0 01-4.849-7.986 11.963 11.963 0 00-5.32 8.986" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-tight font-display">NovaHR</span>
            <span className="text-[10px] font-semibold bg-[#EEF1FD] text-[#3B5BDB] dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.5 rounded">v3.1</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#6B7280] dark:text-gray-300">
            <a href="#features" className="hover:text-[#111827] dark:hover:text-white transition-colors">Features</a>
            <a href="#demo" className="hover:text-[#111827] dark:hover:text-white transition-colors">Interactive Demo</a>
            <a href="#pricing" className="hover:text-[#111827] dark:hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-[#111827] dark:hover:text-white transition-colors">FAQs</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold px-4 h-9 flex items-center justify-center rounded-lg text-[#3B5BDB] dark:text-[#5C7CFA] hover:bg-[#EEF1FD] dark:hover:bg-blue-950/40 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?tab=signup"
              className="text-sm font-semibold bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white px-4 h-9 flex items-center justify-center rounded-lg transition-colors border border-[#3B5BDB]/20 shadow-sm"
            >
              Register Portal
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden border-b border-[#E4E7EE] dark:border-[#2D3748]">
        
        {/* Abstract Background Grids */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#E4E7EE_1px,transparent_1px),linear-gradient(to_bottom,#E4E7EE_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1E2433_1px,transparent_1px),linear-gradient(to_bottom,#1E2433_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 dark:opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EEF1FD] dark:bg-blue-950/60 border border-[#3B5BDB]/10 text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] mb-6 animate-fade-in shadow-xs">
            <span className="h-2 w-2 rounded-full bg-[#0EA5A4] animate-pulse"></span>
            Unveiling NovaHR Enterprise Edition
          </div>

          <h1 className="text-4xl md:text-6xl font-black font-display tracking-tight leading-tight max-w-4xl mx-auto mb-6">
            Human Resources Software, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B5BDB] via-[#2F4BC0] to-[#0EA5A4] dark:from-[#5C7CFA] dark:to-[#12C4C1]">
              Now With Decision Intelligence.
            </span>
          </h1>

          <p className="text-base md:text-xl text-[#6B7280] dark:text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Most HR platforms store paperwork. NovaHR evaluates it. Intercept team burnout flags, calculate geofenced check-in anomalies, and resolve scheduling conflicts in real-time.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-sm mx-auto mb-16">
            <Link
              href="/login"
              className="w-full sm:w-auto bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white px-8 h-12 flex items-center justify-center rounded-xl font-bold transition-all shadow-md cursor-pointer"
            >
              Sign In to Portal
            </Link>
            <a
              href="#demo"
              className="w-full sm:w-auto bg-white dark:bg-[#1E2433] hover:bg-[#F7F8FB] dark:hover:bg-[#2D3748] border border-[#E4E7EE] dark:border-[#2D3748] px-8 h-12 flex items-center justify-center rounded-xl font-bold transition-all shadow-xs"
            >
              Interactive Tour
            </a>
          </div>

          {/* Hero Dashboard Preview Mockup (Full SaaS visual) */}
          <div className="max-w-5xl mx-auto border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl bg-white dark:bg-[#1E2433] p-4 shadow-xl select-none">
            <div className="flex items-center justify-between border-b border-[#E4E7EE] dark:border-[#2D3748] pb-3 mb-4">
              <div className="flex gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-[#B91C1C]"></span>
                <span className="h-3.5 w-3.5 rounded-full bg-[#B45309]"></span>
                <span className="h-3.5 w-3.5 rounded-full bg-[#15803D]"></span>
              </div>
              <div className="px-16 py-1 rounded bg-[#F7F8FB] dark:bg-[#111520] border border-[#E4E7EE] dark:border-[#2D3748] text-[10px] text-[#6B7280] font-medium font-mono">
                novahr.company.internal/dashboard
              </div>
              <div className="w-6"></div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-left">
              {/* Left sidebar mock */}
              <div className="col-span-3 border-r border-[#E4E7EE] dark:border-[#2D3748] pr-4 space-y-4 hidden md:block">
                <div className="h-8 bg-[#EEF1FD] dark:bg-blue-950/40 rounded-lg flex items-center px-3 gap-2">
                  <div className="w-4 h-4 bg-[#3B5BDB] rounded"></div>
                  <div className="h-3 w-20 bg-[#3B5BDB]/50 rounded"></div>
                </div>
                <div className="space-y-2.5 pl-3">
                  <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-2 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-2 w-28 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>

              {/* Main content area mock */}
              <div className="col-span-12 md:col-span-9 space-y-6">
                
                {/* Stats cards row */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 block uppercase">Organization Headcount</span>
                    <span className="text-xl font-bold tabular-nums">482 Employees</span>
                    <span className="text-[9px] text-[#15803D] bg-[#E6FFFA] dark:bg-emerald-950/20 px-1 py-0.5 rounded font-bold">+12 Onboarded</span>
                  </div>
                  <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 block uppercase">Wellness Index Average</span>
                    <span className="text-xl font-bold tabular-nums">74% Stable</span>
                    <span className="text-[9px] text-[#B45309] bg-[#FFFBEB] dark:bg-yellow-950/20 px-1 py-0.5 rounded font-bold">2 Teams Overtime Flag</span>
                  </div>
                  <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-4 rounded-xl space-y-2">
                    <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 block uppercase">Pending HR Action</span>
                    <span className="text-xl font-bold tabular-nums">3 Anomalies</span>
                    <span className="text-[9px] text-[#B91C1C] bg-[#FDF2F2] dark:bg-red-950/20 px-1 py-0.5 rounded font-bold">1 SLA SLA warning</span>
                  </div>
                </div>

                {/* Graph display panel mockup */}
                <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-4 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-32 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-3.5 w-16 bg-[#EEF1FD] dark:bg-blue-950/40 rounded"></div>
                  </div>
                  <div className="h-28 w-full flex items-end justify-between gap-1.5 pt-4">
                    <div className="h-[20%] w-full bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-[35%] w-full bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-[40%] w-full bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-[30%] w-full bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-[55%] w-full bg-gray-200 dark:bg-gray-700 rounded-sm"></div>
                    <div className="h-[75%] w-full bg-[#3B5BDB] rounded-sm"></div>
                    <div className="h-[90%] w-full bg-[#3B5BDB] rounded-sm"></div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Features Grid Section */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-6 border-b border-[#E4E7EE] dark:border-[#2D3748]">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block mb-2">Designed for High Performance</span>
          <h2 className="text-3xl font-bold font-display tracking-tight text-[#111827] dark:text-white">What traditional HR systems leave out</h2>
          <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-3 leading-relaxed">NovaHR handles all standard HR flows (Profiles, Leave picker, Payslips) and layers in an explainable, decision-oriented logic.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] p-6 rounded-xl space-y-4 hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-[#EEF1FD] dark:bg-blue-950/60 flex items-center justify-center text-[#3B5BDB] dark:text-[#5C7CFA] border border-[#3B5BDB]/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white">Smart Conflict Detection</h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Applying for leave triggers an instant scheduler scan. Warning alerts show if overlaps exceed 25% of the same team, avoiding coverage gaps.
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] p-6 rounded-xl space-y-4 hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-[#E6FFFA] dark:bg-teal-950/60 flex items-center justify-center text-[#0EA5A4] dark:text-[#12C4C1] border border-[#0EA5A4]/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white">Heuristic Scoring Explainability</h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              No black boxes. Attrition and wellness signals are compiled using direct, auditable metrics like overtime workload and time since last recognition.
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] p-6 rounded-xl space-y-4 hover:shadow-md transition-all">
            <div className="h-10 w-10 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-[#B91C1C] dark:text-[#EF4444] border border-[#B91C1C]/10">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h3 className="text-lg font-bold font-display text-gray-900 dark:text-white">Attendance SLA Flags</h3>
            <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Automated triggers detect late checks streaks and possible gaming alerts (checking in 1 min before thresholds), surfacing alerts directly into the HR review panel.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Tabs Demo Section */}
      <section id="demo" className="py-20 bg-white dark:bg-[#1E2433] border-b border-[#E4E7EE] dark:border-[#2D3748]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block mb-2">Interactive Dashboard Walkthrough</span>
            <h2 className="text-3xl font-bold font-display tracking-tight text-gray-900 dark:text-white">Experience NovaHR Decision Intelligence</h2>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-2 leading-relaxed">Toggle between feature views to explore how we process everyday HR actions.</p>
          </div>

          {/* Selector Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            <button
              onClick={() => setActiveTab('attrition')}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-tight border transition-all cursor-pointer ${
                activeTab === 'attrition'
                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-sm'
                  : 'bg-white dark:bg-[#1E2433] text-[#6B7280] border-[#E4E7EE] dark:border-[#2D3748] hover:text-[#111827]'
              }`}
            >
              Attrition explainability Drawer
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-tight border transition-all cursor-pointer ${
                activeTab === 'leave'
                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-sm'
                  : 'bg-white dark:bg-[#1E2433] text-[#6B7280] border-[#E4E7EE] dark:border-[#2D3748] hover:text-[#111827]'
              }`}
            >
              Leave Overlap Warning
            </button>
            <button
              onClick={() => setActiveTab('geofence')}
              className={`px-5 py-2.5 rounded-lg text-xs font-semibold tracking-tight border transition-all cursor-pointer ${
                activeTab === 'geofence'
                  ? 'bg-[#3B5BDB] text-white border-[#3B5BDB] shadow-sm'
                  : 'bg-white dark:bg-[#1E2433] text-[#6B7280] border-[#E4E7EE] dark:border-[#2D3748] hover:text-[#111827]'
              }`}
            >
              Geofenced Check-in
            </button>
          </div>

          {/* Interactive Screen Display Panel */}
          <div className="max-w-4xl mx-auto border border-[#E4E7EE] dark:border-[#2D3748] rounded-2xl bg-[#F7F8FB] dark:bg-[#111520] p-6 md:p-8 min-h-[400px]">
            
            {/* Display: Attrition Detail */}
            {activeTab === 'attrition' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FDF2F2] text-[#B91C1C]">
                    HR Officer Analytics
                  </div>
                  <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Demystifying retention risk metrics</h3>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
                    Instead of a mysterious, unexplainable 'risk percent', our drawer breaks down exact contributors. If an employee is logging heavy overtime, hasn't taken a vacation in months, and has a drop-off in kudos, the system triggers a warning.
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span>Burnout (Overtime weight: 40%)</span>
                      <span className="font-semibold text-[#B91C1C]">Critical Level</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span>Rest Interval (Last Break weight: 30%)</span>
                      <span className="font-semibold text-[#B45309]">42 days streak</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E2433] p-5 rounded-xl border border-[#E4E7EE] dark:border-[#2D3748] space-y-4 shadow-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Alex Rivera</h4>
                      <span className="text-[10px] text-gray-400">Software Engineer II</span>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold bg-red-50 dark:bg-red-950/20 text-[#B91C1C] rounded-full">
                      78% Attrition Risk
                    </span>
                  </div>
                  <div className="space-y-3 pt-2 text-xs">
                    <div className="p-2.5 bg-[#F7F8FB] dark:bg-[#111520] rounded border-l-2 border-red-500">
                      <strong>Burnout Index:</strong> Logged 20 hours overtime in past 14 days. (+0.4 contribution)
                    </div>
                    <div className="p-2.5 bg-[#F7F8FB] dark:bg-[#111520] rounded border-l-2 border-amber-500">
                      <strong>Unused Leaves:</strong> 16 days remaining. Zero breaks taken. (+0.3 contribution)
                    </div>
                    <div className="p-2.5 bg-[#F7F8FB] dark:bg-[#111520] rounded border-l-2 border-yellow-500">
                      <strong>Attendance Shift:</strong> 5 late arrivals detected. (+0.28 contribution)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Display: Leave Conflict */}
            {activeTab === 'leave' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFFBEB] text-[#B45309]">
                    Submission Safeguard
                  </div>
                  <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Smart leave scheduling conflict flags</h3>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
                    Prevent critical team shortages automatically. NovaHR detects if concurrent vacation approvals will reduce team headcount below required operation thresholds, rendering a non-blocking dialog checklist.
                  </p>
                  <div className="p-3 bg-[#EEF1FD] dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-lg text-xs leading-relaxed">
                    <strong>Blackout Check:</strong> Also checks if requested dates overlap mandatory freeze windows (such as end-of-year audit).
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E2433] p-5 rounded-xl border border-[#E4E7EE] dark:border-[#2D3748] space-y-4 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">Simulated Apply Screen</span>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="block text-[10px] font-medium text-gray-400 mb-1">Start Date</span>
                        <div className="px-3 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded">2026-07-16</div>
                      </div>
                      <div>
                        <span className="block text-[10px] font-medium text-gray-400 mb-1">End Date</span>
                        <div className="px-3 py-1.5 border border-[#E4E7EE] dark:border-[#2D3748] rounded">2026-07-20</div>
                      </div>
                    </div>

                    {/* Simulation warning box */}
                    <div className="p-3.5 bg-[#FFFBEB] dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl space-y-1.5 text-xs text-[#B45309] dark:text-yellow-400">
                      <div className="flex gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-bold">Leave Conflict Warning</span>
                      </div>
                      <p className="leading-relaxed">Alex Rivera is already approved for time off during this range. Approving this leave drops the Design/Eng team capacity by 50%.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Display: Geofence Check */}
            {activeTab === 'geofence' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E6FFFA] text-[#0EA5A4]">
                    Attendance Integrity
                  </div>
                  <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white">Desk-bound geofencing validation</h3>
                  <p className="text-xs text-[#6B7280] dark:text-gray-400 leading-relaxed">
                    Stop remote work check-in games. Employees check in using coordinates check or a static office desk QR code scan. If checked values deviate from office limits, anomalies populate instantly.
                  </p>
                  <div className="flex gap-2">
                    <span className="h-4.5 w-16 bg-[#EEF1FD] dark:bg-blue-950/40 text-[10px] font-semibold text-[#3B5BDB] flex items-center justify-center rounded">Office Range: 200m</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#1E2433] p-5 rounded-xl border border-[#E4E7EE] dark:border-[#2D3748] space-y-4 shadow-xs text-center">
                  <div className="w-24 h-24 mx-auto border-2 border-dashed border-[#E4E7EE] dark:border-[#2D3748] rounded flex items-center justify-center bg-gray-50 dark:bg-[#111520] text-gray-400">
                    {/* Simulated QR Code SVG */}
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 3h6v6H3V3zM3 15h6v6H3v-6zM15 3h6v6h-6V3zM15 15h3M18 18h3M21 15h-3M15 21h6" />
                    </svg>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-gray-700 dark:text-white block">Simulate Desk QR Scan</span>
                    <p className="text-[10px] text-gray-400 leading-relaxed">Scan registers instant office coordinates to confirm presence at work desk.</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 5. Interactive Wellness Index Sandbox Calculator */}
      <section className="py-20 max-w-7xl mx-auto px-6 border-b border-[#E4E7EE] dark:border-[#2D3748]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 space-y-5">
            <span className="text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block">Wellness Sandbox</span>
            <h2 className="text-3xl font-bold font-display tracking-tight text-[#111827] dark:text-white">Calculate your own Wellness Score</h2>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 leading-relaxed">
              Slide parameters to witness how work hours, breaks, and kudos feed into the transparent Wellness Index score model shown to employees.
            </p>
            <div className="p-4 bg-white dark:bg-[#1E2433] rounded-xl border border-[#E4E7EE] dark:border-[#2D3748] text-xs text-[#6B7280] dark:text-gray-300">
              <strong>Wellness Logic Formula:</strong> <br/>
              <code>Score = 100 - (Overtime * 2.5) - (Days worked past 7 without breaks * 0.8) + (Kudos * 3.5) - Leave utilization gap.</code>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-[#1E2433] p-8 rounded-2xl border border-[#E4E7EE] dark:border-[#2D3748] shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Sliders Area */}
            <div className="md:col-span-7 space-y-5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Weekly Overtime Work:</span>
                  <span className="text-[#3B5BDB]">{overtime} Hours</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={overtime}
                  onChange={(e) => setOvertime(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E4E7EE] dark:bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-[#3B5BDB]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Leave Utilization:</span>
                  <span className="text-[#3B5BDB]">{leaveUsed}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={leaveUsed}
                  onChange={(e) => setLeaveUsed(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E4E7EE] dark:bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-[#3B5BDB]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Days Since Last Day Off:</span>
                  <span className="text-[#3B5BDB]">{daysSinceBreak} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={daysSinceBreak}
                  onChange={(e) => setDaysSinceBreak(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E4E7EE] dark:bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-[#3B5BDB]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Kudos Recognition Received:</span>
                  <span className="text-[#3B5BDB]">{kudosCount} Kudos</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={kudosCount}
                  onChange={(e) => setKudosCount(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#E4E7EE] dark:bg-[#2D3748] rounded-lg appearance-none cursor-pointer accent-[#3B5BDB]"
                />
              </div>
            </div>

            {/* Score Output Area */}
            <div className="md:col-span-5 flex flex-col justify-center items-center border-t md:border-t-0 md:border-l border-[#E4E7EE] dark:border-[#2D3748] pt-6 md:pt-0 md:pl-6 text-center space-y-4">
              <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-widest">Composite Index Score</span>
              
              {/* Radial Badge Graphic */}
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="#E4E7EE" strokeWidth="8" fill="transparent" className="dark:stroke-gray-700"/>
                  <circle 
                    cx="56" 
                    cy="56" 
                    r="48" 
                    stroke={
                      wellnessScore < 60 ? '#B91C1C' :
                      wellnessScore < 80 ? '#B45309' : '#15803D'
                    }
                    strokeWidth="8" 
                    fill="transparent" 
                    strokeDasharray={301.6}
                    strokeDashoffset={301.6 - (301.6 * wellnessScore) / 100}
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute text-2xl font-black font-display tracking-tight">
                  {wellnessScore}%
                </div>
              </div>

              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                wellnessScore < 60 ? 'bg-[#FDF2F2] text-[#B91C1C]' :
                wellnessScore < 80 ? 'bg-[#FFFBEB] text-[#B45309]' : 'bg-[#E6FFFA] text-[#0EA5A4]'
              }`}>
                {wellnessScore < 60 ? 'Burnout Risk' : wellnessScore < 80 ? 'Moderate Strain' : 'Healthy Index'}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. Pricing Tier Grid Section */}
      <section id="pricing" className="py-20 bg-white dark:bg-[#1E2433] border-b border-[#E4E7EE] dark:border-[#2D3748]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block mb-2">Flexible Corporate Licensing</span>
            <h2 className="text-3xl font-bold font-display tracking-tight text-gray-900 dark:text-white">Fair Pricing for Teams</h2>
            <p className="text-sm text-[#6B7280] dark:text-gray-400 mt-2 leading-relaxed">
              Note: Billing and multi-tenant licensing are out-of-scope for the active hackathon model.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-6 rounded-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-widest block">Starter Tier</span>
                <h3 className="text-2xl font-black font-display tracking-tight">$4<span className="text-xs font-medium text-gray-400 font-sans"> / user / month</span></h3>
                <p className="text-xs text-[#6B7280] dark:text-gray-400">Essential digital HR tools for teams up to 50 employees.</p>
                <div className="border-t border-[#E4E7EE] dark:border-[#2D3748] pt-4 space-y-2 text-xs">
                  <div className="flex gap-2">✓ Attendance check-in/out</div>
                  <div className="flex gap-2">✓ Basic profiles directory</div>
                  <div className="flex gap-2">✓ Standard leave requests</div>
                </div>
              </div>
              <Link href="/login" className="w-full h-10 border border-[#E4E7EE] dark:border-[#2D3748] text-[#3B5BDB] hover:bg-[#EEF1FD] dark:text-[#5C7CFA] dark:hover:bg-blue-950 flex items-center justify-center rounded-lg text-xs font-bold transition-all">Get Started</Link>
            </div>

            {/* Tier 2 */}
            <div className="border-2 border-[#3B5BDB] p-6 rounded-xl space-y-6 flex flex-col justify-between relative bg-[#F7F8FB] dark:bg-[#111520]">
              <span className="absolute top-0 right-6 transform -translate-y-1/2 px-2.5 py-0.5 rounded bg-[#3B5BDB] text-white text-[9px] font-bold uppercase tracking-wider">Most Popular</span>
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block">Decision Pro</span>
                <h3 className="text-2xl font-black font-display tracking-tight">$8<span className="text-xs font-medium text-gray-400 font-sans"> / user / month</span></h3>
                <p className="text-xs text-[#6B7280] dark:text-gray-400">Advanced decision support tools and predictive analytics for mid-sized SMEs.</p>
                <div className="border-t border-[#E4E7EE] dark:border-[#2D3748] pt-4 space-y-2 text-xs">
                  <div className="flex gap-2 font-bold text-gray-900 dark:text-white">✓ Everything in Starter</div>
                  <div className="flex gap-2">✓ Attrition risk metrics</div>
                  <div className="flex gap-2">✓ Smart leave conflict checker</div>
                  <div className="flex gap-2">✓ Wellness index panel</div>
                  <div className="flex gap-2">✓ AI policy copilot widget</div>
                </div>
              </div>
              <Link href="/login" className="w-full h-10 bg-[#3B5BDB] hover:bg-[#2F4BC0] text-white flex items-center justify-center rounded-lg text-xs font-bold transition-all">Start Free Trial</Link>
            </div>

            {/* Tier 3 */}
            <div className="border border-[#E4E7EE] dark:border-[#2D3748] p-6 rounded-xl space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-[#6B7280] dark:text-gray-400 uppercase tracking-widest block">Enterprise</span>
                <h3 className="text-2xl font-black font-display tracking-tight">Custom<span className="text-xs font-medium text-gray-400 font-sans"> pricing</span></h3>
                <p className="text-xs text-[#6B7280] dark:text-gray-400">Bespoke SLA integrations, bulk importing capabilities, and custom compliance reporting.</p>
                <div className="border-t border-[#E4E7EE] dark:border-[#2D3748] pt-4 space-y-2 text-xs">
                  <div className="flex gap-2 font-bold text-gray-900 dark:text-white">✓ Everything in Pro</div>
                  <div className="flex gap-2">✓ 24/7 dedicated support</div>
                  <div className="flex gap-2">✓ Custom API integrations</div>
                  <div className="flex gap-2">✓ Audit logs trail export</div>
                </div>
              </div>
              <Link href="/login" className="w-full h-10 border border-[#E4E7EE] dark:border-[#2D3748] text-[#3B5BDB] hover:bg-[#EEF1FD] dark:text-[#5C7CFA] dark:hover:bg-blue-950 flex items-center justify-center rounded-lg text-xs font-bold transition-all">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Accordion FAQ Section */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-[#3B5BDB] dark:text-[#5C7CFA] uppercase tracking-widest block mb-2">Answering common questions</span>
          <h2 className="text-3xl font-bold font-display tracking-tight text-gray-900 dark:text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-[#E4E7EE] dark:border-[#2D3748] rounded-xl bg-white dark:bg-[#1E2433] overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-5 flex justify-between items-center text-left text-sm font-bold text-gray-800 dark:text-white hover:bg-gray-50/50 dark:hover:bg-gray-950/20 transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-[#3B5BDB] text-lg font-bold">
                  {openFaq === index ? '−' : '+'}
                </span>
              </button>
              {openFaq === index && (
                <div className="p-5 border-t border-[#E4E7EE] dark:border-[#2D3748] text-xs text-[#6B7280] dark:text-gray-300 leading-relaxed bg-[#F7F8FB] dark:bg-[#111520]/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="border-t border-[#E4E7EE] dark:border-[#2D3748] bg-white dark:bg-[#1E2433] py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Product</span>
            <div className="flex flex-col gap-2 text-xs text-[#6B7280] dark:text-gray-400">
              <a href="#features">Features</a>
              <a href="#demo">Interactive tour</a>
              <a href="#pricing">Pricing packages</a>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Resources</span>
            <div className="flex flex-col gap-2 text-xs text-[#6B7280] dark:text-gray-400">
              <a href="#">Compliance handbook</a>
              <a href="#">API specifications</a>
              <a href="#">Security policies</a>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Company</span>
            <div className="flex flex-col gap-2 text-xs text-[#6B7280] dark:text-gray-400">
              <a href="#">About Team</a>
              <a href="#">Technical blog</a>
              <a href="#">Support desk</a>
            </div>
          </div>
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Integrations</span>
            <div className="flex flex-col gap-2 text-xs text-[#6B7280] dark:text-gray-400">
              <a href="#">Slack Webhooks</a>
              <a href="#">Tesseract OCR</a>
              <a href="#">Anthropic Claude API</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-[#E4E7EE] dark:border-[#2D3748] pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-[#6B7280] dark:text-gray-400 gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 dark:text-white">NovaHR</span>
            <span>• Next-Gen HRM Portal</span>
          </div>
          <span>© 2026 NovaHR Inc. All rights reserved. Registered under MIT Hackathon licensing.</span>
        </div>
      </footer>

    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/components/ui/Toast';
import { SietLogo } from '@/components/common/SietLogo';
import {
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FolderKanban,
  Trophy,
  BriefcaseBusiness,
  CalendarCheck2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loginAsStudent, loginAsHod } = useSession();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If user is already logged in, route to appropriate dashboard
  useEffect(() => {
    if (user && role) {
      if (role === 'STUDENT') {
        router.replace('/student/dashboard');
      } else if (role === 'HOD') {
        router.replace('/hod/dashboard');
      }
    }
  }, [user, role, router]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username or register number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      const lower = username.toLowerCase();
      if (lower.includes('hod') || lower.includes('priya') || lower.includes('kumar') || lower.includes('fac')) {
        loginAsHod();
        showToast('Welcome back, Dr. Priya Kumar (HOD CSE)', 'success');
      } else {
        loginAsStudent();
        showToast('Welcome back, Meena C (CSE)', 'success');
      }
    }, 500);
  };

  const handleDemoStudent = () => {
    loginAsStudent();
    showToast('Signed in as Student (Meena C - 714023104088)', 'success');
  };

  const handleDemoHod = () => {
    loginAsHod();
    showToast('Signed in as HOD (Dr. Priya Kumar - HOD CSE)', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans">
      {/* LEFT HALF: SIET Deep Forest Green Academic Panel */}
      <div className="w-full lg:w-7/12 bg-[#064e3b] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative z-10 space-y-6 max-w-2xl">
          {/* Institution Header */}
          <div className="flex items-center gap-3">
            <SietLogo size="md" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#facc15]">
                Department of Computer Science &amp; Engineering
              </p>
              <h2 className="text-sm font-medium text-emerald-200">
                Sri Shakthi Institute of Engineering and Technology (Autonomous)
              </h2>
            </div>
          </div>

          {/* Yellow Main Heading from Reference */}
          <div className="pt-4 space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#facc15] tracking-tight font-serif drop-shadow-sm">
              Welcome to SIET-LMS
            </h1>
            <h2 className="text-base sm:text-lg font-bold text-amber-200">
              Student Hackathon, Project &amp; Internship Tracking Platform
            </h2>
          </div>

          {/* Introductory Text */}
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed text-justify">
            The <strong className="text-white font-semibold">Sri Shakthi Institute of Engineering and Technology Tracking System</strong> is your centralized department platform designed to streamline student hackathons, capstone projects, corporate internships, on-duty (OD) requests, and weekly progress discussions.
          </p>

          {/* Yellow Section Subtitle */}
          <div className="pt-2">
            <h3 className="text-base sm:text-lg font-bold text-[#facc15] tracking-wide">
              SIET - CSE Platform Provides:
            </h3>

            <ul className="mt-3 space-y-3 text-xs sm:text-sm text-emerald-50">
              <li className="flex items-start gap-2.5">
                <span className="text-[#facc15] font-bold text-base leading-tight">•</span>
                <span>
                  <strong className="text-white">Unified Activity Submission:</strong> Seamless registration and validation for Projects, National Hackathons, and Corporate Internships.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#facc15] font-bold text-base leading-tight">•</span>
                <span>
                  <strong className="text-white">HOD Administrative Automation:</strong> 1-click approvals, bulk clearances, and automated recurring weekly review scheduling without manual spreadsheets.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#facc15] font-bold text-base leading-tight">•</span>
                <span>
                  <strong className="text-white">Optional On-Duty (OD) Workflow:</strong> Independent OD requests with automated project data pre-population and attendance concession tracking.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#facc15] font-bold text-base leading-tight">•</span>
                <span>
                  <strong className="text-white">Non-Evaluative Weekly Reviews:</strong> Structured 4-question student progress logs, concise HOD meeting summaries, and QR/manual attendance.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#facc15] font-bold text-base leading-tight">•</span>
                <span>
                  <strong className="text-white">Automated Project Timelines &amp; Reminders:</strong> Digital audit trail eliminating manual WhatsApp communication and paper notices.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Left Footer Note */}
        <div className="relative z-10 pt-8 mt-auto border-t border-emerald-800/80 text-[11px] text-emerald-300/80 flex items-center justify-between">
          <span>Accredited with NAAC 'A' Grade • NBA Tier-1 • Anna University Affiliated</span>
          <span>Academic Portal 2026-27</span>
        </div>
      </div>

      {/* RIGHT HALF: SIET Rich Golden Yellow Accent Panel with Clean White Login Card */}
      <div className="w-full lg:w-5/12 bg-[#f3b72b] flex items-center justify-center p-6 sm:p-10 lg:p-12">
        {/* Card matching the rounded light card from screenshot */}
        <div className="w-full max-w-md bg-[#eefaf3] rounded-3xl p-6 sm:p-8 shadow-2xl border border-emerald-100/80 space-y-6">
          
          {/* Centered Crest Logo */}
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-20 h-20 rounded-full bg-white shadow-md p-1.5 flex items-center justify-center border-2 border-emerald-700">
              <SietLogo size="lg" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#064e3b] uppercase tracking-wide">
                SIET Portal Sign In
              </h2>
              <p className="text-[11px] font-medium text-emerald-800">
                Department of Computer Science and Engineering
              </p>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div className="space-y-1">
              <input
                type="text"
                placeholder="Username (Register No. / Faculty ID)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-xs sm:text-sm rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors shadow-2xs pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="text-right pt-1">
                <button
                  type="button"
                  onClick={() => showToast('Password reset assistance: Please contact CSE System Administrator (sysadmin@siet.ac.in)', 'info')}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>

            {/* Emerald Green Login Button from screenshot */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-[#2e9e5b] hover:bg-[#25854c] text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Login'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Demo Access (For Evaluators & Testers) */}
          <div className="pt-2 border-t border-emerald-200/80 space-y-2.5">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                Instant Demo Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDemoStudent}
                className="p-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#064e3b] mb-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Student Demo</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
                  Meena C (II Year CSE)
                </p>
              </button>

              <button
                type="button"
                onClick={handleDemoHod}
                className="p-2.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#064e3b] mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
                  <span>HOD Demo</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1 font-medium">
                  Dr. Priya Kumar (HOD)
                </p>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

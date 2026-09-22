'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/components/ui/Toast';
import { SietLogo } from '@/components/common/SietLogo';
import { Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, role, loginAsStudent, loginAsHod } = useSession();
  const { showToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
      setError('Please enter your register number or faculty ID.');
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
      if (lower.includes('hod') || lower.includes('priya') || lower.includes('faculty')) {
        loginAsHod();
        showToast('Welcome, Dr. Priya Kumar (HOD CSE)', 'success');
      } else {
        loginAsStudent();
        showToast('Welcome, Meena C (CSE)', 'success');
      }
    }, 350);
  };

  const handleDemoStudent = () => {
    loginAsStudent();
    showToast('Signed in as Student (Meena C)', 'success');
  };

  const handleDemoHod = () => {
    loginAsHod();
    showToast('Signed in as HOD (Dr. Priya Kumar)', 'success');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* ========================================================================= */}
      {/* TOP SECTION: Deep SIET Green (#064024) with Bold SIET Yellow (#fed403) Text */}
      {/* Directly adhering to the uploaded SIET-LMS Welcome banner design         */}
      {/* ========================================================================= */}
      <div className="bg-[#064024] text-[#fed403] px-6 py-10 sm:py-14 flex flex-col items-center justify-center text-center relative border-b-4 border-[#fed403]">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Main Title matching SIET-LMS banner */}
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#fed403] drop-shadow-xs">
            Welcome to SIET-LMS
          </h1>

          {/* Intro Description */}
          <p className="text-xs sm:text-sm text-[#fed403] font-medium leading-relaxed max-w-2xl mx-auto">
            The <strong className="font-bold underline decoration-[#fed403]/60">Sri Shakthi Institute of Engineering and Technology Learning Management &amp; On-Duty Portal (SIET-LMS)</strong> is your dedicated online platform designed to elevate your technical skills, hackathon tracking, and academic journey. SIET-LMS offers a comprehensive, user-friendly environment tailored to support your growth.
          </p>

          {/* Subheading */}
          <div className="pt-2">
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#fed403]">
              SIET - OD Portal Provides
            </h2>
          </div>

          {/* Bulleted Points in SIET Yellow */}
          <div className="text-left max-w-xl mx-auto">
            <ul className="space-y-2.5 text-xs sm:text-sm text-[#fed403] font-medium list-disc list-inside">
              <li>
                <span>A streamlined multi-category OD workflow for Hackathons, Internships, Projects, and Workshops.</span>
              </li>
              <li>
                <span>Real-time conflict detection and instant NAAC-compliant department attendance clearance.</span>
              </li>
              <li>
                <span>Department master records with 4-year progressive directory and automated section filtering.</span>
              </li>
              <li>
                <span>Accreditation-ready evidence locker with verified digital document submissions.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LOWER SECTION: Vibrant SIET Yellow (#fed403) Background with Mint Card    */}
      {/* Matching the bottom half of the uploaded SIET LMS website                 */}
      {/* ========================================================================= */}
      <div className="bg-[#fed403] flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-16">
        {/* Mint-Green Rounded Authentication Card (as seen in LMS screenshot) */}
        <div className="w-full max-w-[420px] bg-[#e6f8ee] rounded-3xl border border-[#c4e6ce] p-6 sm:p-8 shadow-xl space-y-6">
          {/* Official SIET Crest Badge centered at top of card */}
          <div className="flex flex-col items-center text-center space-y-2">
            <SietLogo size="xl" />
            <div>
              <div className="text-xs font-black tracking-wider text-[#064024] uppercase">
                Sri Shakthi Institute
              </div>
              <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wide">
                CSE Department · OD Portal
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-[#064024] mb-1.5"
              >
                Username / Register Number
              </label>
              <input
                id="username"
                type="text"
                placeholder="e.g. 714023104088 or hod.cse"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white rounded-xl border border-[#c4e6ce] text-xs text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#064024] focus:ring-1 focus:ring-[#064024] transition-all shadow-2xs"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#064024] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 bg-white rounded-xl border border-[#c4e6ce] text-xs text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#064024] focus:ring-1 focus:ring-[#064024] transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#586658] hover:text-[#064024]"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-[#064024] hover:bg-[#042f1a] text-[#fed403] text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Signing in...'
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Switchers */}
          <div className="pt-2 border-t border-[#c4e6ce] space-y-2.5">
            <div className="text-[11px] font-bold text-[#064024] text-center uppercase tracking-wider">
              Quick Institutional Sign In
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDemoStudent}
                className="p-2.5 bg-white hover:bg-[#f2f9f1] border border-[#c4e6ce] rounded-xl text-left transition-all shadow-2xs group flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#064024] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  <UserCheck className="w-3.5 h-3.5 text-[#fed403]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#064024] truncate">
                    Student
                  </div>
                  <div className="text-[10px] text-[#586658] truncate">
                    Meena C (II Year)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleDemoHod}
                className="p-2.5 bg-white hover:bg-[#f2f9f1] border border-[#c4e6ce] rounded-xl text-left transition-all shadow-2xs group flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-[#064024] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#fed403]" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-[#064024] truncate">
                    HOD / Faculty
                  </div>
                  <div className="text-[10px] text-[#586658] truncate">
                    Dr. Priya Kumar
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs font-semibold text-[#064024]">
          Sri Shakthi Institute of Engineering and Technology (Autonomous) · Accredited by NAAC &lsquo;A&rsquo; Grade
        </div>
      </div>
    </div>
  );
}

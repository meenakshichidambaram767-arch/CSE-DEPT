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
    }, 400);
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
    <div className="min-h-screen bg-[#f7f9f5] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle institutional ambient background */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-[#eaf7e8] to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#facc15]/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#0a5c36]/10 blur-3xl pointer-events-none" />

      {/* Main Centered Login Card */}
      <div className="w-full max-w-[420px] bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 shadow-sm space-y-6 relative z-10">
        {/* Crest Logo & Institutional Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <SietLogo size="xl" />
          
          <div className="pt-1">
            <h1 className="text-base font-bold text-[#172017] tracking-tight">
              Sri Shakthi Institute of Engineering &amp; Technology
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#eaf7e8] text-[#0a5c36] text-[11px] font-bold tracking-wider uppercase mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
              <span>OD Management System</span>
            </div>
          </div>
          <p className="text-xs text-[#586658]">
            Department of Computer Science &amp; Engineering
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleManualLogin} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold text-[#172017]">
              Username or Register No.
            </label>
            <input
              type="text"
              placeholder="e.g. 714023104088 or hod.cse"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#dfe6dc] bg-white text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#0a5c36] focus:ring-1 focus:ring-[#0a5c36] transition-colors"
              required
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#172017]">
                Password
              </label>
              <span className="text-[11px] text-[#586658] hover:text-[#0a5c36] cursor-pointer">
                Forgot password?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-[#dfe6dc] bg-white text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#0a5c36] focus:ring-1 focus:ring-[#0a5c36] transition-colors pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#889688] hover:text-[#172017]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-[#0a5c36] hover:bg-[#084c2c] text-white font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign in to SIET OD Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="pt-4 border-t border-[#dfe6dc] space-y-2">
          <div className="text-[11px] font-semibold text-[#586658] uppercase tracking-wider text-center">
            One-Click Demo Access
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDemoStudent}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[#dfe6dc] hover:border-[#0a5c36] hover:bg-[#f2f9f1] text-[#172017] flex items-center justify-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span>Student</span>
            </button>

            <button
              type="button"
              onClick={handleDemoHod}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-[#dfe6dc] hover:border-[#0a5c36] hover:bg-[#f2f9f1] text-[#172017] flex items-center justify-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span>HOD Office</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-[#889688] text-center pt-2">
          Sri Shakthi Autonomous · NAAC 'A' Grade · NBA Accredited
        </div>
      </div>
    </div>
  );
}

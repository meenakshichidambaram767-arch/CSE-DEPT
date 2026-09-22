'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  GraduationCap,
} from 'lucide-react';

export default function StudentProfilePage({ params }: { params: Promise<{ regNo: string }> }) {
  const resolvedParams = use(params);
  const { odApplications, getStudentStats } = useData();

  const regNo = resolvedParams.regNo;
  const student = mockUsers.find((u) => u.registerNumber === regNo) || {
    name: 'Meena C',
    registerNumber: regNo,
    year: 'II',
    department: 'CSE',
  };

  const studentODs = odApplications.filter((od) => od.studentRegNo === regNo);
  const stats = getStudentStats(regNo);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          href="/hod/students"
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students Directory
        </Link>
      </div>

      {/* Student Overview Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-amber-300 font-bold text-xl flex items-center justify-center shrink-0 border border-emerald-700">
              {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {student.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Register No: <span className="font-semibold text-slate-700 dark:text-slate-300">{student.registerNumber}</span> · Year {student.year || 'II'} · Section CSE-A
              </p>
            </div>
          </div>
        </div>

        {/* Totals Summary Pill */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stats.totalODs || 12} OD events</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Days</p>
            <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-400">{stats.totalODDays || 7} OD days</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-1 col-span-2 sm:col-span-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Standing</p>
            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-1">{stats.standing}</p>
          </div>
        </div>

        {/* OD History Chronological List */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            OD HISTORY
          </h2>

          <div className="space-y-3">
            {studentODs.map((od) => (
              <div
                key={od.id}
                className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                      {od.purpose}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {od.eventName}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    {od.date || od.startDate} {od.fromTime && `· ${od.fromTime} – ${od.toTime}`}
                  </p>
                </div>

                <div className="shrink-0">
                  {od.status === 'APPROVED' && (
                    <span className="px-3 py-1 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                    </span>
                  )}
                  {od.status === 'PENDING' && (
                    <span className="px-3 py-1 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </span>
                  )}
                  {od.status === 'REJECTED' && (
                    <span className="px-3 py-1 text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

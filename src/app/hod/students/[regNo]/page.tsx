'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import { ArrowLeft, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

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
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          href="/hod/students"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students Directory
        </Link>
      </div>

      {/* Student Overview Header */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 space-y-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-lg flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {student.name}
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                Register No: <span className="font-medium text-zinc-800 dark:text-zinc-200">{student.registerNumber}</span> · Year {student.year || 'II'} · Section CSE-A
              </p>
            </div>
          </div>

          <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800">
            Status: <span className="font-medium text-emerald-800 dark:text-emerald-400">{stats.standing || 'Good Standing'}</span>
          </div>
        </div>

        {/* Totals Summary - Typography First */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Total OD Events
            </span>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
              {studentODs.length || stats.totalODs || 3}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Approved OD Days
            </span>
            <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-300 mt-1 tabular-nums">
              {stats.totalODDays || 7}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Academic Attendance
            </span>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
              89.4%
            </p>
          </div>
        </div>

        {/* OD History Chronological List */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
              OD Leave History
            </span>
            <span className="text-xs text-zinc-400 tabular-nums">
              {studentODs.length} recorded applications
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
            {studentODs.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                No OD applications found for this student.
              </div>
            ) : (
              studentODs.map((od) => (
                <Link
                  key={od.id}
                  href={`/hod/requests/${od.id}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/70 dark:hover:bg-zinc-850/40 transition-colors group block"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase">
                        {od.purpose}
                      </span>
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                        {od.eventName}
                      </h2>
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 tabular-nums">
                      <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{od.date || od.startDate}</span>
                      {od.fromTime && <span>· {od.fromTime} – {od.toTime}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <StatusIndicator status={od.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-800 transition-colors hidden sm:block" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

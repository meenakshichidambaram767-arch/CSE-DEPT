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
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      <div>
        <Link
          href="/hod/students"
          className="text-xs font-semibold text-[#586658] hover:text-[#0a5c36] flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Students Directory
        </Link>
      </div>

      {/* Student Overview Card */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#dfe6dc] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0a5c36] text-white font-bold text-base flex items-center justify-center shrink-0 border border-[#064024]">
              {student.name.charAt(0)}
            </div>
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-[#172017]">
                {student.name}
              </h1>
              <p className="text-xs text-[#586658] font-mono tabular-nums">
                Roll No: <span className="font-bold text-[#172017]">{student.registerNumber}</span> · Year {student.year || 'II'} · Section CSE-A
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold bg-[#eaf7e8] text-[#0a5c36] px-3 py-1.5 rounded-md border border-[#dfe6dc]">
            Academic Standing: {stats.standing || 'Good Standing'}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-2 border-b border-[#dfe6dc]">
          <div>
            <span className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              Total OD Events
            </span>
            <p className="text-2xl font-bold text-[#172017] mt-1 tabular-nums">
              {studentODs.length || stats.totalODs || 3}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              Approved OD Days
            </span>
            <p className="text-2xl font-bold text-[#0a5c36] mt-1 tabular-nums">
              {stats.totalODDays || 7}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              Attendance Clearance
            </span>
            <p className="text-2xl font-bold text-[#172017] mt-1 tabular-nums">
              89.4%
            </p>
          </div>
        </div>

        {/* OD History List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[#172017] uppercase">
              OD Leave History
            </span>
            <span className="text-xs text-[#586658] tabular-nums font-semibold">
              {studentODs.length} applications
            </span>
          </div>

          <div className="divide-y divide-[#edf2ea] border border-[#dfe6dc] rounded-lg overflow-hidden">
            {studentODs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#889688]">
                No OD applications found for this student.
              </div>
            ) : (
              studentODs.map((od) => (
                <Link
                  key={od.id}
                  href={`/hod/requests/${od.id}`}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f2f9f1] transition-colors group block"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-[#eaf7e8] text-[#0a5c36] uppercase">
                        {od.purpose}
                      </span>
                      <h2 className="text-xs font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors">
                        {od.eventName}
                      </h2>
                    </div>

                    <p className="text-[11px] text-[#586658] flex items-center gap-2 tabular-nums">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#889688]" />
                      <span>{od.date || od.startDate}</span>
                      {od.fromTime && <span>· {od.fromTime} – {od.toTime}</span>}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusIndicator status={od.status} />
                    <ArrowRight className="w-3.5 h-3.5 text-[#889688] group-hover:text-[#0a5c36] transition-colors" />
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

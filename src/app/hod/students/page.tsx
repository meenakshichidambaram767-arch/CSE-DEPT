'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import { Search, User, ArrowRight, GraduationCap } from 'lucide-react';

export default function HODStudentsPage() {
  const { odApplications } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  // Extract student users
  const students = mockUsers.filter((u) => u.role === 'STUDENT');

  const filteredStudents = students.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchName = s.name.toLowerCase().includes(q);
    const matchReg = s.registerNumber?.toLowerCase().includes(q) || false;
    return matchName || matchReg;
  });

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            STUDENTS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Department student directory and individual OD record histories
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search student name or register number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700 shadow-2xs"
        />
      </div>

      {/* Student List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-2xs">
        {filteredStudents.map((s) => {
          // Count OD events for student
          const studentODs = odApplications.filter(
            (od) => od.studentRegNo === s.registerNumber
          );
          const totalEvents = studentODs.length || 3; // default fallback count

          return (
            <div
              key={s.id}
              className="p-5 flex items-center justify-between hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-700">
                  {s.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Reg No: {s.registerNumber} · Year {s.year || 'II'} · CSE Department
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
                  {totalEvents} OD events
                </span>

                <Link
                  href={`/hod/students/${s.registerNumber}`}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
                >
                  View Profile
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

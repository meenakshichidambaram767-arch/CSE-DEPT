'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import { Search, ArrowRight, GraduationCap } from 'lucide-react';

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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Students Directory
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Department student roster, registered roll numbers, and academic OD leave summaries
          </p>
        </div>
        <span className="text-xs text-zinc-400 tabular-nums">
          {filteredStudents.length} students enrolled
        </span>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search by student name or register number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-2xs"
        />
      </div>

      {/* Students Directory List */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800 shadow-2xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400">
            No students found matching &ldquo;{searchTerm}&rdquo;.
          </div>
        ) : (
          filteredStudents.map((s) => {
            const studentODs = odApplications.filter(
              (od) => od.studentRegNo === s.registerNumber
            );
            const totalEvents = studentODs.length || 3;

            return (
              <Link
                key={s.id}
                href={`/hod/students/${s.registerNumber}`}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors group block"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center justify-center font-medium text-xs shrink-0 border border-zinc-200/80 dark:border-zinc-700">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                      {s.name}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tabular-nums">
                      {s.registerNumber} · Year {s.year || 'II'} · Section CSE-A
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
                  </span>
                  <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline-flex items-center gap-1">
                    Profile
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}

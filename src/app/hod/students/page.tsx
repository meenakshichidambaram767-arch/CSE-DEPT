'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import { Search, ArrowRight } from 'lucide-react';

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
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Student Directory
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Students Directory
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            CSE student rolls, registration numbers, and individual OD clearance histories.
          </p>
        </div>
        <span className="text-xs font-semibold text-[#0a5c36] bg-[#eaf7e8] px-2.5 py-1 rounded-md tabular-nums border border-[#dfe6dc]">
          {filteredStudents.length} Students
        </span>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
        <input
          type="text"
          placeholder="Search student name or register number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white text-xs text-[#172017] placeholder:text-[#889688] rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] transition-colors"
        />
      </div>

      {/* Students Directory List */}
      <div className="bg-white rounded-lg border border-[#dfe6dc] divide-y divide-[#edf2ea] shadow-2xs overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#889688]">
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
                className="p-4 flex items-center justify-between hover:bg-[#f2f9f1] transition-colors group block"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#0a5c36] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate">
                      {s.name}
                    </h2>
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums">
                      {s.registerNumber} · Year {s.year || 'II'} · Section CSE-A
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-[11px] font-semibold text-[#586658] tabular-nums">
                    {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
                  </span>
                  <span className="text-xs font-semibold text-[#0a5c36] group-hover:underline inline-flex items-center gap-1">
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

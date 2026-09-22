'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function StudentCalendarPage() {
  const { odEvents } = useData();

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Student Calendar
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            My Schedule &amp; Approved Duty Leaves
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Chronological timeline of verified On-Duty activities and academic hackathons.
          </p>
        </div>

        <Link
          href="/student/apply-od"
          className="text-xs font-bold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
        >
          + Apply for OD
        </Link>
      </div>

      {/* Events Timeline */}
      <div className="space-y-3">
        {odEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-xl border border-[#dfe6dc] p-5 space-y-3 shadow-2xs hover:border-[#0a5c36] transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-wider text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded uppercase">
                  {evt.purpose}
                </span>
                <h2 className="text-base font-bold text-[#172017]">
                  {evt.title}
                </h2>
              </div>
              <StatusIndicator status="APPROVED" text="Approved Duty Leave" />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-2 border-t border-[#edf2ea]">
              <span className="flex items-center gap-1.5 tabular-nums">
                <CalendarIcon className="w-3.5 h-3.5 text-[#889688]" />
                {evt.formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#889688]" />
                {evt.venue}
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <Users className="w-3.5 h-3.5 text-[#889688]" />
                {evt.studentCount} participating students
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

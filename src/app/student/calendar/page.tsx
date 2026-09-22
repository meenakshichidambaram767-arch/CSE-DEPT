'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Calendar as CalendarIcon, MapPin, Users, ArrowRight } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function StudentCalendarPage() {
  const { odEvents } = useData();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Schedule
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Departmental timeline of approved On-Duty leaves, hackathons, and company visits
          </p>
        </div>

        <Link
          href="/student/apply-od"
          className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 inline-flex items-center gap-1"
        >
          + Apply for OD
        </Link>
      </div>

      {/* Events Timeline */}
      <div className="space-y-4">
        {odEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
                  {evt.purpose}
                </span>
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {evt.title}
                </h2>
              </div>
              <StatusIndicator status="APPROVED" text="Approved Duty Leave" />
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="flex items-center gap-1.5 tabular-nums">
                <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                {evt.formattedDate}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                {evt.venue}
              </span>
              <span className="flex items-center gap-1.5 tabular-nums">
                <Users className="w-3.5 h-3.5 text-zinc-400" />
                {evt.studentCount} participating students
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

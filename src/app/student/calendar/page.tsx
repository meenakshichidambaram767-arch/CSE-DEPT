'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Calendar as CalendarIcon, MapPin, Users } from 'lucide-react';

export default function StudentCalendarPage() {
  const { odEvents } = useData();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          MY CALENDAR
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Schedule of upcoming approved OD activities and departmental hackathons
        </p>
      </div>

      <div className="space-y-4">
        {odEvents.map((evt) => (
          <div key={evt.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                {evt.purpose}
              </span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{evt.title}</h2>
              <p className="text-xs text-slate-500 flex items-center gap-3">
                <span>{evt.formattedDate}</span>
                <span>·</span>
                <span>{evt.venue}</span>
              </p>
            </div>

            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
              Approved
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

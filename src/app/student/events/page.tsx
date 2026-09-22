'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Sparkles, Calendar as CalendarIcon, MapPin, PlusCircle } from 'lucide-react';

export default function StudentEventsPage() {
  const { odEvents } = useData();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-slate-200/80 dark:border-slate-800 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DEPARTMENT EVENTS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse upcoming hackathons, conferences, and project visits
          </p>
        </div>
        <Link href="/student/apply-od" className="px-4 py-2 bg-emerald-800 text-amber-300 text-xs font-bold rounded-xl shadow-xs">
          Apply for Event OD
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {odEvents.map((evt) => (
          <div key={evt.id} className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4">
            <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 uppercase">
              {evt.purpose}
            </span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{evt.title}</h2>
            <p className="text-xs text-slate-500">{evt.formattedDate} · {evt.venue}</p>
            <Link href="/student/apply-od" className="inline-block text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline">
              Apply for OD →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

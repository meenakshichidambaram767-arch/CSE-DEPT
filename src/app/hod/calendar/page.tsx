'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MapPin, Users, ArrowRight } from 'lucide-react';

export default function HODCalendarPage() {
  const { odEvents, odApplications } = useData();
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK'>('MONTH');

  // Hardcoded calendar matrix representation for September / October 2026
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1); // Sept 1 - Sept 30

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            OD CALENDAR
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental schedule of approved ODs and upcoming events
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('MONTH')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'MONTH'
                ? 'bg-emerald-800 text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Month View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('WEEK')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'WEEK'
                ? 'bg-emerald-800 text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Week View
          </button>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-emerald-800" />
          September 2026
        </h2>

        <div className="flex items-center gap-2">
          <button type="button" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button type="button" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month View Grid */}
      {viewMode === 'MONTH' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-2xs space-y-4">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Grid Cells */}
          <div className="grid grid-cols-7 gap-2 min-h-[420px]">
            {daysInMonth.map((dayNum) => {
              const dayStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
              const matchingEvt = odEvents.find((e) => e.date === dayStr);

              return (
                <div
                  key={dayNum}
                  className={`p-2 rounded-xl border flex flex-col justify-between transition-colors min-h-[85px] ${
                    matchingEvt
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dayNum}
                  </span>

                  {matchingEvt && (
                    <Link
                      href={`/hod/events/${matchingEvt.id}`}
                      className="p-1.5 rounded-lg bg-emerald-800 text-amber-300 text-[10px] font-bold block truncate hover:bg-emerald-900 shadow-2xs"
                    >
                      <p className="truncate">{matchingEvt.title}</p>
                      <p className="text-[9px] font-medium text-emerald-200">{matchingEvt.studentCount} students</p>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Agenda / Week List View */
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 text-xs font-bold rounded-lg">
                25 SEP
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  HackSprint 2026
                </h3>
                <p className="text-xs text-slate-500">8 students · Chennai Convention Center</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-emerald-800 text-amber-300 text-xs font-bold rounded-lg">
                27 SEP
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Project Review & Industry Visit
                </h3>
                <p className="text-xs text-slate-500">3 students · Bosch AI Research Center, Coimbatore</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

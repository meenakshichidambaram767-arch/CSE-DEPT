'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ChevronLeft, ChevronRight, MapPin, Users, ArrowRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function HODCalendarPage() {
  const { odEvents, odApplications } = useData();
  const [currentMonth, setCurrentMonth] = useState('September 2026');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Month days for September 2026 (1 to 30)
  // Sept 1, 2026 is Tuesday. So Monday is empty offset: 1 empty day.
  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  // Filter events matching selected date or all upcoming
  const eventsForSelectedDate = selectedDate
    ? odEvents.filter((e) => e.date === selectedDate)
    : odEvents;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Department Schedule
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Departmental OD calendar, verified student leaves, and academic events
          </p>
        </div>

        {/* Month Navigator Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 px-3 py-1.5 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200/80 dark:border-zinc-800 shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>{currentMonth}</span>
          </div>
          <div className="flex items-center rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-0.5 shadow-2xs">
            <button
              type="button"
              aria-label="Previous month"
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-600 dark:text-zinc-400 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Calendar Grid + Agenda Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
              Monthly Schedule
            </span>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-medium text-emerald-800 dark:text-emerald-400 hover:underline"
              >
                Clear filter (Show all)
              </button>
            )}
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[460px]">
            {/* Sept 1 2026 is Tuesday -> 1 empty cell on Monday */}
            <div className="p-2 rounded-lg bg-zinc-50/40 dark:bg-zinc-900/40 border border-transparent min-h-[92px]" />

            {daysInMonth.map((dayNum) => {
              const dayStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
              const matchingEvt = odEvents.find((e) => e.date === dayStr);
              const isSelected = selectedDate === dayStr;

              return (
                <div
                  key={dayNum}
                  onClick={() => setSelectedDate(matchingEvt ? dayStr : null)}
                  className={`p-2 rounded-lg border flex flex-col justify-between transition-all min-h-[92px] cursor-pointer text-left ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-700'
                      : matchingEvt
                      ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/10 hover:border-emerald-400'
                      : 'border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? 'text-emerald-900 dark:text-emerald-200'
                          : matchingEvt
                          ? 'text-emerald-950 dark:text-emerald-300'
                          : 'text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {matchingEvt && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                    )}
                  </div>

                  {matchingEvt && (
                    <div className="mt-2 p-1.5 rounded bg-white/90 dark:bg-zinc-850 border border-emerald-200/80 dark:border-emerald-900/60 text-[10px] space-y-0.5">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                        {matchingEvt.title}
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400 tabular-nums">
                        {matchingEvt.studentCount} students
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Agenda Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">
              {selectedDate ? `Events on ${selectedDate}` : 'Upcoming Agenda'}
            </span>
            <span className="text-[11px] text-zinc-400 tabular-nums">
              {eventsForSelectedDate.length} items
            </span>
          </div>

          <div className="space-y-3">
            {eventsForSelectedDate.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-400">
                No events scheduled for this date.
              </div>
            ) : (
              eventsForSelectedDate.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        {evt.purpose}
                      </span>
                      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                        {evt.title}
                      </h2>
                    </div>
                    <span className="shrink-0 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-semibold rounded tabular-nums">
                      {evt.formattedDate}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span className="truncate">{evt.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5 tabular-nums">
                      <Users className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                      <span>{evt.studentCount} approved students</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                    <StatusIndicator status="APPROVED" text="Approved OD" />
                    <Link
                      href={`/hod/events/${evt.id}`}
                      className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 inline-flex items-center gap-1"
                    >
                      View Details
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

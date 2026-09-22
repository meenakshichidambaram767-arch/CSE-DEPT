'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Sparkles, Calendar as CalendarIcon, MapPin, Users, ArrowRight, CheckCircle2, Clock } from 'lucide-react';

export default function HODEventsPage() {
  const { odEvents, odApplications } = useData();

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            DEPARTMENT EVENTS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Event-centric OD tracking & group management
          </p>
        </div>

        <div className="text-xs font-semibold px-3.5 py-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 w-fit">
          {odEvents.length} Active Events
        </div>
      </div>

      {/* Events List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {odEvents.map((evt) => {
          // Find matching OD applications for stats
          const eventODs = odApplications.filter(
            (od) => od.eventId === evt.id || od.eventName === evt.title
          );
          const approvedCount = eventODs.filter((od) => od.status === 'APPROVED').length;
          const pendingCount = eventODs.filter((od) => od.status === 'PENDING').length;
          const totalStudents = eventODs.length || evt.studentCount;

          return (
            <div
              key={evt.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-5 hover:border-emerald-700/50 transition-all shadow-2xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                    {evt.purpose}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {evt.status}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {evt.title}
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                    {evt.formattedDate}
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {evt.city || evt.venue}
                  </span>
                </p>
              </div>

              {/* Breakdown */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {totalStudents} Enrolled Students
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                      {approvedCount} Approved
                    </span>
                    {pendingCount > 0 && (
                      <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded">
                        {pendingCount} Pending
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/hod/events/${evt.id}`}
                  className="w-full py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-800 hover:text-amber-300 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  View Event Details
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

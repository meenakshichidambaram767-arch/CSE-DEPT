'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ArrowRight, CheckCircle2, Clock, Calendar as CalendarIcon, MapPin, Users, FileCheck } from 'lucide-react';

export default function HODDashboard() {
  const { odApplications, odEvents } = useData();

  // Filter pending requests
  const pendingRequests = odApplications.filter((r) => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;

  // Group pending requests by event / title
  const eventGroupedPending = odEvents.map((evt) => {
    const eventPendingODs = pendingRequests.filter((r) => r.eventId === evt.id || r.eventName === evt.title);
    return {
      event: evt,
      pendingCount: eventPendingODs.length,
    };
  }).filter((group) => group.pendingCount > 0);

  // If there are standalone pending ODs not attached to pre-created events
  const unassignedPending = pendingRequests.filter((r) => !r.eventId);
  
  // Upcoming approved / ongoing events
  const upcomingEvents = odEvents.filter((e) => e.status === 'UPCOMING' || e.status === 'ONGOING').slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-10 max-w-6xl mx-auto">
      {/* Header Banner - SIET CSE Brand Identity */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white rounded-2xl p-6 lg:p-8 shadow-sm border border-emerald-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-64 h-64 bg-emerald-800/30 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-800/60 pb-5 mb-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            OD Management System
          </div>
          <div className="text-xs font-semibold px-3 py-1 bg-emerald-800/90 text-amber-300 rounded-full border border-emerald-700/50 w-fit">
            CSE · HOD Office
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-1">
            Good morning, Dr. Priya Kumar
          </h1>
          <p className="text-sm text-emerald-100/90 font-medium">
            Here's what needs your attention today in the CSE Department.
          </p>
        </div>
      </div>

      {/* SECTION 1 — NEEDS APPROVAL */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                Needs Approval
              </h2>
              {pendingCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              OD requests are waiting for your review
            </p>
          </div>

          <Link
            href="/hod/requests"
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors group"
          >
            Review all
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {pendingCount === 0 ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            ✓ All OD requests have been reviewed and resolved.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Event Grouped Pending Requests */}
            {eventGroupedPending.map(({ event, pendingCount: groupPending }) => (
              <div
                key={event.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                      {event.purpose}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {event.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {groupPending} student{groupPending > 1 ? 's' : ''} waiting
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {event.formattedDate}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {event.city || event.venue}
                    </span>
                  </p>
                </div>

                <Link
                  href={`/hod/requests?event=${event.id}`}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                >
                  Review
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </Link>
              </div>
            ))}

            {/* Unassigned Individual Pending Requests */}
            {unassignedPending.length > 0 && eventGroupedPending.length === 0 && (
              <div className="space-y-3">
                {unassignedPending.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 gap-4"
                  >
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {req.eventName}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {req.studentName} ({req.studentRegNo}) · Year {req.year} · {req.date}
                      </p>
                    </div>

                    <Link
                      href={`/hod/requests/${req.id}`}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
                    >
                      Review
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {pendingCount > 3 && (
              <div className="pt-2 text-center">
                <Link
                  href="/hod/requests"
                  className="text-xs font-semibold text-slate-500 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors"
                >
                  {pendingCount} pending requests — View all →
                </Link>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2 — UPCOMING */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              Upcoming
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Next scheduled OD events
            </p>
          </div>

          <Link
            href="/hod/calendar"
            className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 flex items-center gap-1.5 transition-colors group"
          >
            Calendar
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((evt) => {
            const dateParts = evt.formattedDate.split(' '); // e.g. ["25", "Sep", "2026"]
            return (
              <div
                key={evt.id}
                className="flex items-center gap-5 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
              >
                {/* Date Visual Anchor */}
                <div className="w-16 h-16 rounded-xl bg-emerald-900 text-white flex flex-col items-center justify-center shrink-0 border border-emerald-800 shadow-xs">
                  <span className="text-lg font-extrabold leading-none text-amber-300">
                    {dateParts[0]}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100/90 mt-0.5">
                    {dateParts[1]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {evt.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {evt.studentCount} students · {evt.city || evt.venue}
                  </p>
                </div>

                <Link
                  href={`/hod/events/${evt.id}`}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-800 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100/80 transition-colors shrink-0"
                >
                  View →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3 — RECENT ACTIVITY */}
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-2xs space-y-4">
        <h2 className="text-xs font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          Recent Activity
        </h2>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>4 ODs approved today</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>2 students uploaded post-event participation certificates</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-700 dark:text-slate-300 py-1.5">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              ✓
            </span>
            <span>HackSprint 2026 event records updated</span>
          </div>
        </div>
      </section>
    </div>
  );
}

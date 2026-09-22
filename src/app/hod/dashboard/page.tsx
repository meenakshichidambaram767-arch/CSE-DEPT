'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ArrowRight, Check } from 'lucide-react';

export default function HODDashboard() {
  const { odApplications, odEvents } = useData();

  // Filter pending requests
  const pendingRequests = odApplications.filter((r) => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;

  // Group pending requests by event / title
  const eventGroupedPending = odEvents
    .map((evt) => {
      const eventPendingODs = pendingRequests.filter(
        (r) => r.eventId === evt.id || r.eventName === evt.title
      );
      return {
        event: evt,
        pendingCount: eventPendingODs.length,
      };
    })
    .filter((group) => group.pendingCount > 0);

  const unassignedPending = pendingRequests.filter((r) => !r.eventId);

  // Upcoming approved / ongoing events
  const upcomingEvents = odEvents
    .filter((e) => e.status === 'UPCOMING' || e.status === 'ONGOING')
    .slice(0, 4);

  return (
    <div className="space-y-16 py-2">
      {/* Top Editorial Header */}
      <div className="space-y-6">
        <div className="flex items-center justify-between text-[11px] font-semibold tracking-wider text-zinc-400 dark:text-zinc-500 uppercase">
          <span>OD Management</span>
          <span>CSE · HOD</span>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Good morning, Dr. Priya Kumar
          </h1>
          <p className="text-base text-zinc-500 dark:text-zinc-400 font-normal">
            Here&apos;s what needs your attention.
          </p>
        </div>
      </div>

      {/* SECTION 1 — NEEDS APPROVAL */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Needs Approval
          </div>
          <div className="text-2xl font-light text-zinc-900 dark:text-zinc-100 tabular-nums">
            {pendingCount}
          </div>
        </div>

        {pendingCount === 0 ? (
          <div className="py-10 text-center text-sm text-zinc-400">
            You&apos;re all caught up. No OD requests are waiting for approval.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {eventGroupedPending.map(({ event, pendingCount: count }) => (
              <div
                key={event.id}
                className="py-5 flex items-center justify-between gap-6 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-3 -mx-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {event.title}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {count} student{count > 1 ? 's' : ''} · {event.formattedDate} · {event.city || event.venue}
                  </p>
                </div>

                <Link
                  href={`/hod/requests?event=${event.id}`}
                  className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 inline-flex items-center gap-1 shrink-0"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}

            {/* Standalone pending items if any */}
            {unassignedPending.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="py-5 flex items-center justify-between gap-6 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-3 -mx-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {req.eventName}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {req.studentName} ({req.studentRegNo}) · Year {req.year} · {req.date}
                  </p>
                </div>

                <Link
                  href={`/hod/requests/${req.id}`}
                  className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 inline-flex items-center gap-1 shrink-0"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {pendingCount > 4 && (
          <div className="pt-2">
            <Link
              href="/hod/requests"
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              View all {pendingCount} requests →
            </Link>
          </div>
        )}
      </section>

      {/* SECTION 2 — UPCOMING */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Upcoming
          </div>
          <Link
            href="/hod/calendar"
            className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            Calendar →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-8 text-sm text-zinc-400">
            Nothing scheduled. There are no upcoming ODs.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {upcomingEvents.map((evt) => {
              const dateParts = evt.formattedDate.split(' ');
              const dayMonth = `${dateParts[0]} ${dateParts[1]?.toUpperCase() || ''}`;

              return (
                <div
                  key={evt.id}
                  className="py-4 flex items-start gap-8 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-3 -mx-3 rounded-lg transition-colors"
                >
                  <div className="w-24 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 pt-0.5 shrink-0 tabular-nums">
                    {dayMonth}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <Link
                      href={`/hod/events/${evt.id}`}
                      className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors block truncate"
                    >
                      {evt.title}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {evt.studentCount} student{evt.studentCount !== 1 ? 's' : ''} · {evt.city || evt.venue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3 — RECENT ACTIVITY */}
      <section className="space-y-4">
        <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Recent Activity
          </div>
        </div>

        <div className="space-y-3 py-1 text-xs text-zinc-600 dark:text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
            <span>4 ODs approved today</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
            <span>2 students submitted documents for HackSprint 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">✓</span>
            <span>SIET Internal AI HackFest records updated</span>
          </div>
        </div>
      </section>
    </div>
  );
}


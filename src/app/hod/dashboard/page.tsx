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
    <div className="space-y-10 py-1">
      {/* SIET Modern Welcome Hero Area */}
      <div className="relative overflow-hidden rounded-xl bg-[#eaf7e8] border border-[#dfe6dc] p-6 sm:p-8 space-y-3">
        {/* Signature Yellow Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#facc15]" />

        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#0a5c36] uppercase">
          <span>Sri Shakthi Institute of Engineering &amp; Technology</span>
          <span>HOD · CSE</span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172017]">
            Good morning, Dr. Priya Kumar
          </h1>
          <p className="text-sm text-[#586658]">
            Here&apos;s what needs your attention today in the department.
          </p>
        </div>

        <div className="pt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0a5c36] text-white text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#facc15]" />
            <span>{pendingCount} Pending Approvals</span>
          </span>
          <Link
            href="/hod/requests"
            className="text-xs font-semibold text-[#0a5c36] hover:text-[#064024] hover:underline flex items-center gap-1 ml-2 transition-colors"
          >
            <span>Review requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION 1 — PENDING REQUESTS */}
      <section className="bg-white rounded-xl border border-[#dfe6dc] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-baseline justify-between border-b border-[#dfe6dc] pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#eab308]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
              Pending Approvals
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#586658] tabular-nums">
            {pendingCount} waiting
          </span>
        </div>

        {pendingCount === 0 ? (
          <div className="py-8 text-center text-xs text-[#889688]">
            You&apos;re all caught up. No OD requests are currently pending review.
          </div>
        ) : (
          <div className="divide-y divide-[#edf2ea]">
            {eventGroupedPending.map(({ event, pendingCount: count }) => (
              <div
                key={event.id}
                className="py-4 flex items-center justify-between gap-4 group hover:bg-[#f2f9f1] px-3 -mx-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#172017] truncate">
                    {event.title}
                  </h3>
                  <p className="text-xs text-[#586658] tabular-nums">
                    {count} student{count > 1 ? 's' : ''} · {event.formattedDate} · {event.city || event.venue}
                  </p>
                </div>

                <Link
                  href={`/hod/requests?event=${event.id}`}
                  className="px-3 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-2xs inline-flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}

            {unassignedPending.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="py-4 flex items-center justify-between gap-4 group hover:bg-[#f2f9f1] px-3 -mx-3 rounded-lg transition-colors"
              >
                <div className="space-y-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#172017] truncate">
                    {req.eventName}
                  </h3>
                  <p className="text-xs text-[#586658] tabular-nums">
                    {req.studentName} ({req.studentRegNo}) · Year {req.year} · {req.date}
                  </p>
                </div>

                <Link
                  href={`/hod/requests/${req.id}`}
                  className="px-3 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-2xs inline-flex items-center gap-1 shrink-0 transition-colors"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {pendingCount > 4 && (
          <div className="pt-2 border-t border-[#edf2ea]">
            <Link
              href="/hod/requests"
              className="text-xs font-semibold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
            >
              View all {pendingCount} requests →
            </Link>
          </div>
        )}
      </section>

      {/* SECTION 2 — UPCOMING AGENDA */}
      <section className="bg-white rounded-xl border border-[#dfe6dc] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="flex items-baseline justify-between border-b border-[#dfe6dc] pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
            Upcoming OD Schedule
          </h2>
          <Link
            href="/hod/calendar"
            className="text-xs font-semibold text-[#0a5c36] hover:underline"
          >
            Calendar View →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="py-6 text-xs text-[#889688]">
            No upcoming events scheduled.
          </div>
        ) : (
          <div className="divide-y divide-[#edf2ea]">
            {upcomingEvents.map((evt) => {
              const dateParts = evt.formattedDate.split(' ');
              const dayMonth = `${dateParts[0]} ${dateParts[1]?.toUpperCase() || ''}`;

              return (
                <div
                  key={evt.id}
                  className="py-3.5 flex items-start gap-5 hover:bg-[#f2f9f1] px-3 -mx-3 rounded-lg transition-colors"
                >
                  <div className="w-20 text-xs font-bold text-[#0a5c36] bg-[#eaf7e8] px-2 py-1 rounded text-center shrink-0 tabular-nums border border-[#dfe6dc]">
                    {dayMonth}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <Link
                      href={`/hod/events/${evt.id}`}
                      className="text-xs font-semibold text-[#172017] hover:text-[#0a5c36] transition-colors block truncate"
                    >
                      {evt.title}
                    </Link>
                    <p className="text-[11px] text-[#586658] tabular-nums">
                      {evt.studentCount} students · {evt.city || evt.venue}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 3 — RECENT ACTIVITY */}
      <section className="bg-white rounded-xl border border-[#dfe6dc] p-5 sm:p-6 space-y-4 shadow-2xs">
        <div className="border-b border-[#dfe6dc] pb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
            Recent Activity
          </h2>
        </div>

        <div className="space-y-2.5 py-1 text-xs text-[#586658]">
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-[#eaf7e8] text-[#0a5c36] flex items-center justify-center font-bold text-[10px]">
              ✓
            </span>
            <span>4 ODs approved today by HOD</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-[#eaf7e8] text-[#0a5c36] flex items-center justify-center font-bold text-[10px]">
              ✓
            </span>
            <span>2 students submitted supporting documents for HackSprint 2026</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="w-4 h-4 rounded-full bg-[#eaf7e8] text-[#0a5c36] flex items-center justify-center font-bold text-[10px]">
              ✓
            </span>
            <span>SIET Internal AI HackFest duty roster updated</span>
          </div>
        </div>
      </section>
    </div>
  );
}

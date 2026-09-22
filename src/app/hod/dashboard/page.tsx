'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ArrowRight, Calendar } from 'lucide-react';

export default function HODDashboard() {
  const { odApplications, odEvents } = useData();

  // Pending requests
  const pendingRequests = odApplications.filter((r) => r.status === 'PENDING');
  const pendingCount = pendingRequests.length;
  const topPending = pendingRequests.slice(0, 3);

  // Top 2 upcoming events only (least overwhelming)
  const topUpcoming = odEvents
    .filter((e) => e.status === 'UPCOMING' || e.status === 'ONGOING')
    .slice(0, 2);

  return (
    <div className="space-y-10 max-w-3xl py-2">
      {/* 1. MINIMAL GREETING & ATTENTION AREA */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172017]">
          Good morning, Dr. Priya
        </h1>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-3">
          <p className="text-base font-semibold text-[#0a5c36]">
            {pendingCount} {pendingCount === 1 ? 'request needs' : 'requests need'} your attention
          </p>
          {pendingCount > 0 && (
            <Link
              href="/hod/requests"
              className="text-xs font-bold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
            >
              Review requests →
            </Link>
          )}
        </div>

        {/* Subtle institutional divider line */}
        <div className="mt-4 pt-3 border-t border-[#dfe6dc] flex items-center justify-between text-[11px] font-medium text-[#889688]">
          <span>SIET · CSE Department</span>
          <span>Head of Department</span>
        </div>
      </div>

      {/* 2. PENDING APPROVALS LIST (TOP 3) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#dfe6dc] pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#facc15]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
              Pending Approvals
            </h2>
          </div>
          {pendingCount > 3 && (
            <Link
              href="/hod/requests"
              className="text-xs font-semibold text-[#0a5c36] hover:underline"
            >
              View all ({pendingCount}) →
            </Link>
          )}
        </div>

        {pendingCount === 0 ? (
          <div className="py-6 text-xs text-[#586658]">
            ✓ All caught up. No pending requests waiting for your clearance.
          </div>
        ) : (
          <div className="divide-y divide-[#edf2ea]">
            {topPending.map((req) => (
              <div
                key={req.id}
                className="py-3.5 flex items-center justify-between gap-4 group hover:bg-[#f2f9f1] px-2 -mx-2 rounded-md transition-colors"
              >
                <div className="space-y-0.5 min-w-0">
                  <h3 className="text-sm font-semibold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate">
                    {req.eventName}
                  </h3>
                  <p className="text-xs text-[#586658]">
                    {req.studentName} · <span className="font-mono text-[11px]">{req.studentRegNo}</span> · {req.date || req.startDate}
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

        {pendingCount > 3 && (
          <div className="pt-1">
            <Link
              href="/hod/requests"
              className="text-xs font-semibold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
            >
              View all {pendingCount} requests →
            </Link>
          </div>
        )}
      </section>

      {/* 3. UPCOMING SCHEDULE (NEXT 2 EVENTS ONLY) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b border-[#dfe6dc] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
            Upcoming
          </h2>
          <Link
            href="/hod/calendar"
            className="text-xs font-semibold text-[#0a5c36] hover:underline"
          >
            Calendar →
          </Link>
        </div>

        {topUpcoming.length === 0 ? (
          <div className="py-4 text-xs text-[#889688]">
            No upcoming events scheduled.
          </div>
        ) : (
          <div className="divide-y divide-[#edf2ea]">
            {topUpcoming.map((evt) => {
              const dateParts = evt.formattedDate.split(' ');
              const dayMonth = `${dateParts[0]} ${dateParts[1]?.toUpperCase() || ''}`;

              return (
                <div
                  key={evt.id}
                  className="py-3 flex items-center justify-between gap-4 group hover:bg-[#f2f9f1] px-2 -mx-2 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded border border-[#dfe6dc] shrink-0 tabular-nums">
                      {dayMonth}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/hod/events/${evt.id}`}
                        className="text-xs font-semibold text-[#172017] hover:text-[#0a5c36] transition-colors truncate block"
                      >
                        {evt.title}
                      </Link>
                      <p className="text-[11px] text-[#586658] truncate">
                        {evt.studentCount} students · {evt.city || evt.venue}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/hod/events/${evt.id}`}
                    className="text-xs font-semibold text-[#0a5c36] hover:underline shrink-0"
                  >
                    Details →
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

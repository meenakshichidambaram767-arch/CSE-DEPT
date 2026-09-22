'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { getEventById, odApplications } = useData();

  const event = getEventById(resolvedParams.id);

  if (!event) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-zinc-500">Event not found.</p>
        <Link href="/hod/events" className="text-xs font-semibold text-emerald-800 underline">
          ← Back to events
        </Link>
      </div>
    );
  }

  const matchingODs = odApplications.filter(
    (od) => od.eventId === event.id || od.eventName === event.title
  );

  const approvedCount = matchingODs.filter((od) => od.status === 'APPROVED').length;
  const pendingCount = matchingODs.filter((od) => od.status === 'PENDING').length;
  const totalCount = matchingODs.length || event.studentCount;

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/hod/events"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to events</span>
        </Link>
      </div>

      {/* Event Header */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {event.title}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {event.formattedDate} · {event.city || event.venue}
          </p>
        </div>

        <div className="pt-2 text-xs space-y-0.5">
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {totalCount} students
          </p>
          <p className="text-zinc-400">
            {approvedCount} approved · {pendingCount} pending
          </p>
        </div>
      </div>

      {/* Students Section */}
      <div className="space-y-4 pt-4 border-t border-zinc-200/80 dark:border-zinc-800/80">
        <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
          Students
        </div>

        {matchingODs.length === 0 ? (
          <div className="py-6 text-xs text-zinc-400">
            No enrolled students recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
            {matchingODs.map((req) => (
              <div
                key={req.id}
                className="py-3 flex items-center justify-between gap-4 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-2 -mx-2 rounded-md transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {req.studentName}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Register No · {req.studentRegNo}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusIndicator status={req.status} />
                  <Link
                    href={`/hod/requests/${req.id}`}
                    className="text-zinc-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


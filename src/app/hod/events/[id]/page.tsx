'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { ArrowLeft, ArrowRight, Calendar, MapPin } from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { getEventById, odApplications } = useData();

  const event = getEventById(resolvedParams.id);

  if (!event) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-[#586658]">Event not found.</p>
        <Link href="/hod/events" className="text-xs font-semibold text-[#0a5c36] underline">
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
    <div className="max-w-2xl mx-auto space-y-8 py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/hod/events"
          className="text-xs font-semibold text-[#586658] hover:text-[#0a5c36] inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to events</span>
        </Link>
      </div>

      {/* Event Overview Card */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Header */}
        <div className="border-b border-[#dfe6dc] pb-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#facc15]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded">
              {event.purpose}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-[#172017]">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-1">
            <span className="flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-[#889688]" />
              {event.formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#889688]" />
              {event.venue} {event.city ? `(${event.city})` : ''}
            </span>
          </div>

          {/* Counts pill row */}
          <div className="pt-3 flex items-center gap-3 text-xs font-semibold tabular-nums">
            <span className="text-[#172017]">{totalCount} students</span>
            <span className="text-[#0a5c36]">{approvedCount} Approved</span>
            {pendingCount > 0 && (
              <span className="text-[#eab308]">{pendingCount} Pending</span>
            )}
          </div>
        </div>

        {/* Students Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#586658] uppercase tracking-wider">
            <span>Students Roster</span>
            <span>Status</span>
          </div>

          {matchingODs.length === 0 ? (
            <div className="py-6 text-xs text-[#889688] text-center bg-[#f7f9f5] rounded-md">
              No enrolled student applications found for this event.
            </div>
          ) : (
            <div className="divide-y divide-[#edf2ea] border border-[#dfe6dc] rounded-lg overflow-hidden">
              {matchingODs.map((req) => (
                <div
                  key={req.id}
                  className="p-3 flex items-center justify-between gap-4 hover:bg-[#f2f9f1] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#172017] truncate">
                      {req.studentName}
                    </p>
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums">
                      Reg: {req.studentRegNo} · Year {req.year}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <StatusIndicator status={req.status} />
                    <Link
                      href={`/hod/requests/${req.id}`}
                      className="text-[#889688] hover:text-[#0a5c36] transition-colors p-1"
                      title="Review request"
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
    </div>
  );
}

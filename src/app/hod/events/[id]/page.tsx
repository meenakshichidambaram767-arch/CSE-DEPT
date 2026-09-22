'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  FileText,
  User,
} from 'lucide-react';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { getEventById, odApplications } = useData();

  const event = getEventById(resolvedParams.id);

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-10 flex flex-col items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 mb-4">Event not found.</p>
        <Link href="/hod/events" className="text-xs font-bold text-emerald-800 underline">
          ← Return to Events
        </Link>
      </div>
    );
  }

  // Get matching OD applications
  const matchingODs = odApplications.filter(
    (od) => od.eventId === event.id || od.eventName === event.title
  );

  const approvedCount = matchingODs.filter((od) => od.status === 'APPROVED').length;
  const pendingCount = matchingODs.filter((od) => od.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
      <div>
        <Link
          href="/hod/events"
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Events
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
              {event.purpose}
            </span>
            <span className="text-xs text-slate-400">ID: {event.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {event.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              {event.formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {event.venue} {event.city && `(${event.city})`}
            </span>
          </p>
        </div>

        {/* OD Status Breakdown */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            OD STATUS BREAKDOWN
          </h3>
          <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              {approvedCount} Approved
            </div>

            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4" />
                {pendingCount} Pending Review
              </div>
            )}
          </div>
        </div>

        {/* Participating Students */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            ENROLLED STUDENTS ({matchingODs.length})
          </h3>

          <div className="space-y-2">
            {matchingODs.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Reg No: {req.studentRegNo} · Year {req.year} {req.section && `· Sec ${req.section}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    req.status === 'APPROVED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {req.status}
                  </span>

                  <Link
                    href={`/hod/requests/${req.id}`}
                    className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Event Documents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            EVENT DOCUMENTS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Registration Proof
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✓ Completed</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Post-Event Participation Certificate
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">Pending Post-Event</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

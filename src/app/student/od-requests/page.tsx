'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Plus, Calendar as CalendarIcon, MapPin, FileText, CheckCircle2, Clock } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function StudentODPortalPage() {
  const { odApplications } = useData();

  // Filter for student "Meena C" (usr-student-001 / 714023104088)
  const myODs = odApplications.filter(
    (od) => od.studentId === 'usr-student-001' || od.studentRegNo === '714023104088'
  );

  const approvedCount = myODs.filter((od) => od.status === 'APPROVED').length;
  const pendingCount = myODs.filter((od) => od.status === 'PENDING').length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            My Applications
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track On-Duty verification status, view approval letters, and submit leaves
          </p>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/student/apply-od"
          className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors inline-flex items-center gap-1.5 w-fit"
        >
          <Plus className="w-3.5 h-3.5" />
          Apply for OD
        </Link>
      </div>

      {/* Overview Stat Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Total Requests
          </span>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {myODs.length}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Approved ODs
          </span>
          <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-300 mt-1 tabular-nums">
            {approvedCount}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Under Review
          </span>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mt-1 tabular-nums">
            {pendingCount}
          </p>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {myODs.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-3">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No OD applications yet</p>
            <p className="text-xs text-zinc-500">Apply for your upcoming hackathon, internship, or conference.</p>
            <Link
              href="/student/apply-od"
              className="inline-block mt-2 px-4 py-2 bg-emerald-900 text-white text-xs font-medium rounded-lg hover:bg-emerald-950 transition-colors"
            >
              + Apply for OD
            </Link>
          </div>
        ) : (
          myODs.map((req) => (
            <div
              key={req.id}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-5 space-y-5 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              {/* Header inside item */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold tracking-wider uppercase text-zinc-500">
                      {req.purpose || 'EVENT'}
                    </span>
                    <span className="text-xs text-zinc-400 tabular-nums">· ID {req.id}</span>
                  </div>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {req.eventName}
                  </h2>
                </div>

                <StatusIndicator status={req.status} />
              </div>

              {/* Event Metadata */}
              <div className="flex flex-wrap items-center gap-5 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <CalendarIcon className="w-3.5 h-3.5 text-zinc-400" />
                  {req.date || req.startDate}
                  {req.fromTime && ` (${req.fromTime} – ${req.toTime})`}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {req.venue || 'CSE Department'}
                </span>
                {req.proofDocName && (
                  <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    {req.proofDocName}
                  </span>
                )}
              </div>

              {/* Linear-style Stepper Status Tracker */}
              <div className="pt-2">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-850/60 rounded-lg border border-zinc-200/60 dark:border-zinc-800 space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                    Lifecycle Timeline
                  </span>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                      <span>Submitted</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                      <span>Reviewed</span>
                    </div>

                    <div className="flex items-center gap-1.5 font-medium">
                      {req.status === 'APPROVED' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                          <span className="text-emerald-900 dark:text-emerald-300">Approved</span>
                        </>
                      ) : req.status === 'REJECTED' ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          <span className="text-zinc-500">Rejected</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span className="text-amber-800 dark:text-amber-400">Pending Decision</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-medium text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                      <span>NAAC Archival</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

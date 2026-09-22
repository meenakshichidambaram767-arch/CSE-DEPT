'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { PlusCircle, Calendar as CalendarIcon, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';

export default function StudentODPortalPage() {
  const { odApplications } = useData();

  // Filter for student "Meena C" (usr-student-001 / 714023104088)
  const myODs = odApplications.filter(
    (od) => od.studentId === 'usr-student-001' || od.studentRegNo === '714023104088'
  );

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            MY ON-DUTY (OD) REQUESTS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track application status, submit supporting documents, and view clearance history
          </p>
        </div>

        <Link
          href="/student/apply-od"
          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 w-fit"
        >
          <PlusCircle className="w-4 h-4 text-amber-300" />
          Apply for New OD
        </Link>
      </div>

      {/* Applications List with Lifecycle Tracker */}
      <div className="space-y-6">
        {myODs.map((req) => (
          <div
            key={req.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-6 shadow-2xs"
          >
            {/* Top Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                    {req.purpose || 'EVENT'}
                  </span>
                  <span className="text-xs text-slate-400">ID: {req.id}</span>
                </div>

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {req.eventName}
                </h2>
              </div>

              <span className={`px-3 py-1 text-xs font-bold rounded-lg w-fit ${
                req.status === 'APPROVED'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {req.status === 'APPROVED' ? 'Approved' : 'Pending Review'}
              </span>
            </div>

            {/* Event Info */}
            <p className="text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {req.date || req.startDate}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {req.venue || 'CSE Department'}
              </span>
            </p>

            {/* OD Status Lifecycle Component (Prompt Section 15) */}
            <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OD LIFECYCLE STATUS</p>
              
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
                <div className="p-2 rounded-lg bg-emerald-800 text-amber-300">
                  ✓ Submitted
                </div>
                <div className="p-2 rounded-lg bg-emerald-800 text-amber-300">
                  ✓ Under Review
                </div>
                <div className={`p-2 rounded-lg ${req.status === 'APPROVED' ? 'bg-emerald-800 text-amber-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                  {req.status === 'APPROVED' ? '✓ Approved' : '○ Pending'}
                </div>
                <div className={`p-2 rounded-lg ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>
                  Upcoming
                </div>
                <div className="p-2 rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-800">
                  Completed
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

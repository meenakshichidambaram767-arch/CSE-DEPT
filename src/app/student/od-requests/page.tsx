'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Plus, Calendar as CalendarIcon, MapPin, FileText, CheckCircle2 } from 'lucide-react';
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
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Student Welcome Card with SIET Identity */}
      <div className="relative overflow-hidden rounded-xl bg-[#eaf7e8] border border-[#dfe6dc] p-6 sm:p-8 space-y-3">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#facc15]" />

        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#0a5c36] uppercase">
          <span>SIET OD Management</span>
          <span>CSE Department · II Year</span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172017]">
            Hello, Meena C
          </h1>
          <p className="text-xs text-[#586658]">
            Roll Number: <span className="font-mono font-bold text-[#172017]">714023104088</span> · Academic Section CSE-A
          </p>
        </div>

        {/* Primary CTA + Summary Pill */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/student/apply-od"
            className="px-4 py-2 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-[#facc15]" />
            <span>Apply for New OD</span>
          </Link>

          <span className="text-xs text-[#0a5c36] bg-white px-3 py-1.5 rounded-lg border border-[#dfe6dc] font-semibold">
            {approvedCount} Approved ODs · {pendingCount} Pending
          </span>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#dfe6dc] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
            Your Upcoming &amp; Past OD Requests
          </h2>
          <span className="text-xs text-[#586658] tabular-nums font-semibold">
            {myODs.length} total
          </span>
        </div>

        {myODs.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border border-[#dfe6dc] space-y-3">
            <p className="text-sm font-bold text-[#172017]">No OD applications yet</p>
            <p className="text-xs text-[#586658]">Apply for your upcoming hackathon, internship, or conference.</p>
            <Link
              href="/student/apply-od"
              className="inline-block mt-2 px-4 py-2 bg-[#0a5c36] text-white text-xs font-bold rounded-lg hover:bg-[#084c2c] transition-colors"
            >
              + Apply for OD
            </Link>
          </div>
        ) : (
          myODs.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-[#dfe6dc] p-5 space-y-4 shadow-2xs hover:border-[#0a5c36] transition-colors"
            >
              {/* Header inside item */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#edf2ea] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded">
                      {req.purpose || 'EVENT'}
                    </span>
                    <span className="text-xs text-[#889688] font-mono tabular-nums">· ID {req.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#172017]">
                    {req.eventName}
                  </h3>
                </div>

                <StatusIndicator status={req.status} />
              </div>

              {/* Event Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658]">
                <span className="flex items-center gap-1.5 tabular-nums">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#889688]" />
                  {req.date || req.startDate}
                  {req.fromTime && ` (${req.fromTime} – ${req.toTime})`}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#889688]" />
                  {req.venue || 'CSE Department'}
                </span>
                {req.proofDocName && (
                  <span className="flex items-center gap-1.5 text-[#172017]">
                    <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
                    {req.proofDocName}
                  </span>
                )}
              </div>

              {/* Lifecycle Progress Bar */}
              <div className="p-3 bg-[#f7f9f5] rounded-lg border border-[#dfe6dc] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#586658]">
                  Clearing Lifecycle
                </span>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#0a5c36] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#0a5c36]" />
                    <span>Submitted</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#0a5c36] font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#0a5c36]" />
                    <span>Under Review</span>
                  </div>

                  <div className="flex items-center gap-1.5 font-semibold">
                    {req.status === 'APPROVED' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#0a5c36]" />
                        <span className="text-[#0a5c36]">HOD Approved</span>
                      </>
                    ) : req.status === 'REJECTED' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
                        <span className="text-[#dc2626]">Rejected</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
                        <span className="text-[#92400e]">Pending Signoff</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 font-semibold text-[#889688]">
                    <span className={`w-2 h-2 rounded-full ${req.status === 'APPROVED' ? 'bg-[#0a5c36]' : 'bg-[#dfe6dc]'}`} />
                    <span>NAAC Archived</span>
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

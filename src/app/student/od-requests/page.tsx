'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { useData } from '@/context/DataContext';
import { ODApplication, PaginationMeta } from '@/types';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { Plus, Calendar as CalendarIcon, MapPin, FileText, AlertCircle, RefreshCw } from 'lucide-react';

export default function StudentODPortalPage() {
  const { user } = useSession();
  const { odApplications: contextODs } = useData();

  const [error, setError] = useState<string | null>(null);

  // Sync with context state and filter by authenticated student via useMemo
  const odList: ODApplication[] = useMemo(() => {
    const studentRegNo = user?.registerNumber;
    const studentId = user?.id;

    return contextODs.filter((od) => {
      if (!studentRegNo && !studentId) return true;
      if (od.studentRegNo === studentRegNo || od.studentId === studentId) return true;
      // Also match if user is in teamMembers
      return (od.teamMembers || []).some((tm) => tm.regNo === studentRegNo);
    });
  }, [contextODs, user?.registerNumber, user?.id]);

  const meta: PaginationMeta = useMemo(() => ({
    page: 1,
    page_size: 20,
    total: odList.length,
  }), [odList.length]);

  const approvedCount = odList.filter((od) => od.status === 'APPROVED').length;
  const pendingCount = odList.filter((od) => od.status === 'PENDING').length;
  const revisionCount = odList.filter((od) => od.status === 'REVISION_REQUESTED').length;

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Student Welcome Card with Authenticated SIET Identity */}
      <div className="relative overflow-hidden rounded-xl bg-[#eaf7e8] border border-[#dfe6dc] p-6 sm:p-8 space-y-3">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#facc15]" />

        <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-[#0a5c36] uppercase">
          <span>SIET OD Management</span>
          <span>{user?.department ?? 'CSE'} Department{user?.year ? ` · Year ${user.year}` : ''}</span>
        </div>

        <div className="space-y-1 pt-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172017]">
            Hello, {user?.name ?? 'Student'}
          </h1>
          <p className="text-xs text-[#586658]">
            {user?.registerNumber && <>Roll Number: <span className="font-mono font-bold text-[#172017]">{user.registerNumber}</span> · </>}
            Academic Section {user?.department ?? 'CSE'}{user?.section ? `-${user.section}` : ''}
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
            {approvedCount} Approved · {pendingCount} Pending{revisionCount > 0 ? ` · ${revisionCount} Revision Requested` : ''}
          </span>
        </div>
      </div>

      {/* Error Card */}
      {error && (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="px-3 py-1 bg-white border border-rose-200 rounded font-bold hover:bg-rose-100 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Dismiss
          </button>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#dfe6dc] pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
            Your Upcoming &amp; Past OD Requests
          </h2>
          <span className="text-xs text-[#586658] tabular-nums font-semibold">
            {meta?.total ?? odList.length} total
          </span>
        </div>

        {odList.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-xl border border-[#dfe6dc] space-y-3">
            <p className="text-sm font-bold text-[#172017]">No OD applications found</p>
            <p className="text-xs text-[#586658]">Apply for your upcoming hackathon, internship, or conference.</p>
            <Link
              href="/student/apply-od"
              className="inline-block mt-2 px-4 py-2 bg-[#0a5c36] text-white text-xs font-bold rounded-lg hover:bg-[#084c2c] transition-colors"
            >
              + Apply for OD
            </Link>
          </div>
        ) : (
          odList.map((req) => (
            <Link
              key={req.id}
              href={`/student/od-requests/${req.id}`}
              className="block bg-white rounded-xl border border-[#dfe6dc] p-5 space-y-4 shadow-2xs hover:border-[#0a5c36] transition-colors group"
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
                  <h3 className="text-base font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors">
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

              {/* Revision requested action notice */}
              {req.status === 'REVISION_REQUESTED' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-semibold flex items-center justify-between">
                  <span>Action Required: HOD requested revisions. Click to update &amp; resubmit.</span>
                  <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded font-bold uppercase">
                    Resubmit Now &rarr;
                  </span>
                </div>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

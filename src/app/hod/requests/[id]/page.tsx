'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  ArrowLeft,
  Check,
  AlertTriangle,
} from 'lucide-react';

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getODById, approveOD, rejectOD, checkODConflict } = useData();

  const request = getODById(resolvedParams.id);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalToast, setApprovalToast] = useState(false);

  if (!request) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-zinc-500">Request not found.</p>
        <Link href="/hod/requests" className="text-xs font-semibold text-emerald-800 underline">
          ← Back to requests
        </Link>
      </div>
    );
  }

  const conflict = checkODConflict(request.studentRegNo, request.date);

  const handleApprove = () => {
    approveOD(request.id);
    setShowConfirmApprove(false);
    setApprovalToast(true);
    setTimeout(() => {
      router.push('/hod/requests');
    }, 1200);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    rejectOD(request.id, rejectionReason);
    setShowRejectModal(false);
    router.push('/hod/requests');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-10 py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/hod/requests"
          className="text-xs font-medium text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to requests</span>
        </Link>
      </div>

      {/* Success Toast */}
      {approvalToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>✓ OD approved</span>
        </div>
      )}

      {/* Title & Metadata */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {request.eventName}
          </h1>
          <StatusIndicator status={request.status} />
        </div>
        <p className="text-xs text-zinc-400">
          {request.date || request.startDate} · {request.venue || 'CSE Department'}
        </p>
      </div>

      {/* Conflict Warning if any */}
      {(conflict || request.conflict?.hasConflict) && (
        <div className="p-4 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
            <p className="font-semibold">Possible Schedule Conflict</p>
            <p className="text-amber-700 dark:text-amber-400">
              Approved OD already exists on {conflict?.conflictingDate || request.date} for{' '}
              {conflict?.conflictingEventName || request.conflict?.conflictingEventName}.
            </p>
          </div>
        </div>
      )}

      {/* Grouped Information Sections */}
      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border-t border-b border-zinc-200/80 dark:border-zinc-800/80">
        {/* Purpose */}
        {request.reason && (
          <div className="py-6 space-y-2">
            <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Purpose
            </h2>
            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {request.reason}
            </p>
          </div>
        )}

        {/* Students */}
        <div className="py-6 space-y-3">
          <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Students
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-baseline">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {request.studentName}
              </span>
              <span className="text-zinc-400 tabular-nums">
                Register No · {request.studentRegNo}
              </span>
            </div>

            {request.teamMembers &&
              request.teamMembers
                .filter((m) => m.regNo !== request.studentRegNo)
                .map((m, idx) => (
                  <div key={idx} className="flex justify-between items-baseline text-zinc-600 dark:text-zinc-400">
                    <span>{m.name}</span>
                    <span className="text-zinc-400 tabular-nums">Register No · {m.regNo}</span>
                  </div>
                ))}
          </div>
        </div>

        {/* OD Period */}
        <div className="py-6 space-y-2">
          <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            OD Period
          </h2>
          <div className="text-xs text-zinc-700 dark:text-zinc-300 space-y-0.5">
            <p className="font-medium">{request.date || request.startDate}</p>
            <p className="text-zinc-400">{request.fromTime || '8:00 AM'} – {request.toTime || '6:00 PM'}</p>
          </div>
        </div>

        {/* Documents */}
        <div className="py-6 space-y-3">
          <h2 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Documents
          </h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-700 dark:text-zinc-300">
                {request.proofDocName || 'Registration proof'}
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓</span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-zinc-700 dark:text-zinc-300">Invitation / Event confirmation</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {request.status === 'PENDING' && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-400 transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmApprove(true)}
            className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
          >
            Approve
          </button>
        </div>
      )}

      {/* Confirmation Dialog — Approve */}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full space-y-4 border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Approve OD?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {request.eventName} · {request.date}
              </p>
              <p className="text-xs text-zinc-400 pt-1">
                This will grant academic attendance clearance for this request.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmApprove(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded-md hover:bg-emerald-900 shadow-xs"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-sm w-full space-y-4 border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Reject OD request
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Please provide a brief reason for the student.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Reason
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-700 text-white text-xs font-medium rounded-md hover:bg-red-800 shadow-xs"
              >
                Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}


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
  FileText,
  Clock,
  Calendar,
  MapPin,
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
        <p className="text-sm text-[#586658]">Request not found.</p>
        <Link href="/hod/requests" className="text-xs font-semibold text-[#0a5c36] underline">
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
    <div className="max-w-2xl mx-auto space-y-8 py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/hod/requests"
          className="text-xs font-semibold text-[#586658] hover:text-[#0a5c36] inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to requests</span>
        </Link>
      </div>

      {/* Success Toast */}
      {approvalToast && (
        <div className="p-3 bg-[#eaf7e8] border border-[#0a5c36] text-[#0a5c36] text-xs font-semibold rounded-lg flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>✓ OD approved successfully. Attendance clearance registered.</span>
        </div>
      )}

      {/* Document Card Container */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Document Header */}
        <div className="border-b border-[#dfe6dc] pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
              Official OD Leave Application
            </span>
            <StatusIndicator status={request.status} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            {request.eventName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-1">
            <span className="flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-[#889688]" />
              {request.date || request.startDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#889688]" />
              {request.venue || 'CSE Department'}
            </span>
          </div>
        </div>

        {/* Schedule Conflict Notice */}
        {(conflict || request.conflict?.hasConflict) && (
          <div className="p-3.5 rounded-lg bg-[#fef9c3] border border-[#facc15] flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#ca8a04] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-[#854d0e]">
              <p className="font-bold">Possible Schedule Overlap</p>
              <p className="text-[11px]">
                Student already has an approved OD on {conflict?.conflictingDate || request.date} for{' '}
                {conflict?.conflictingEventName || request.conflict?.conflictingEventName}.
              </p>
            </div>
          </div>
        )}

        {/* Grouped Information Sections */}
        <div className="divide-y divide-[#edf2ea] text-xs">
          {/* Purpose & Justification */}
          {request.reason && (
            <div className="py-4 space-y-1">
              <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
                Purpose &amp; Outcome
              </h2>
              <p className="text-xs text-[#172017] leading-relaxed">
                {request.reason}
              </p>
            </div>
          )}

          {/* Students Roster */}
          <div className="py-4 space-y-2">
            <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              Participating Students
            </h2>

            <div className="space-y-2">
              <div className="flex justify-between items-baseline p-2.5 rounded bg-[#f7f9f5] border border-[#dfe6dc]">
                <div>
                  <span className="font-semibold text-[#172017] block">
                    {request.studentName}
                  </span>
                  <span className="text-[11px] text-[#586658]">Lead Applicant · Year {request.year || 'II'}</span>
                </div>
                <span className="text-[#0a5c36] font-mono text-[11px] font-bold tabular-nums">
                  {request.studentRegNo}
                </span>
              </div>

              {request.teamMembers &&
                request.teamMembers
                  .filter((m) => m.regNo !== request.studentRegNo)
                  .map((m, idx) => (
                    <div key={idx} className="flex justify-between items-baseline p-2 rounded bg-white border border-[#dfe6dc] text-xs">
                      <span className="text-[#172017]">{m.name}</span>
                      <span className="text-[#586658] font-mono text-[11px] tabular-nums">{m.regNo}</span>
                    </div>
                  ))}
            </div>
          </div>

          {/* OD Period & Timings */}
          <div className="py-4 space-y-1">
            <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              OD Period &amp; Duty Hours
            </h2>
            <div className="text-xs text-[#172017] space-y-0.5">
              <p className="font-semibold">{request.date || request.startDate}</p>
              <p className="text-[#586658] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#889688]" />
                <span>{request.fromTime || '8:00 AM'} — {request.toTime || '6:00 PM'}</span>
              </p>
            </div>
          </div>

          {/* Supporting Documents */}
          <div className="py-4 space-y-2">
            <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
              Attached Documents
            </h2>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center p-2 rounded bg-[#f7f9f5] border border-[#dfe6dc]">
                <span className="text-[#172017] font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>{request.proofDocName || 'Official Registration Proof.pdf'}</span>
                </span>
                <span className="text-[#0a5c36] font-bold text-[11px]">✓ Verified</span>
              </div>

              <div className="flex justify-between items-center p-2 rounded bg-[#f7f9f5] border border-[#dfe6dc]">
                <span className="text-[#172017] font-medium flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>Invitation &amp; Approval Recommendation</span>
                </span>
                <span className="text-[#0a5c36] font-bold text-[11px]">✓ Attached</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {request.status === 'PENDING' && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dfe6dc]">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="px-4 py-2 text-xs font-semibold text-[#dc2626] hover:bg-red-50 rounded-md border border-[#dc2626]/30 transition-colors"
            >
              Reject Application
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmApprove(true)}
              className="px-5 py-2 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Approve OD</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog — Approve */}
      {showConfirmApprove && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 border border-[#dfe6dc] shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172017]">
                Approve On-Duty Leave?
              </h3>
              <p className="text-xs text-[#586658] leading-relaxed">
                {request.eventName} · {request.date}
              </p>
              <p className="text-[11px] text-[#586658] pt-1">
                This will grant official academic attendance credit for the student in CSE records.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmApprove(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-[#586658] hover:text-[#172017]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-1.5 bg-[#0a5c36] text-white text-xs font-semibold rounded-md hover:bg-[#084c2c] shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 border border-[#dfe6dc] shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172017]">
                Reject OD Request
              </h3>
              <p className="text-xs text-[#586658]">
                Please state the reason for rejecting this leave application.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                Reason
              </label>
              <textarea
                required
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Incomplete proof / Clashing internal exams..."
                className="w-full p-2.5 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017] focus:outline-none focus:border-[#0a5c36]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#586658] hover:text-[#172017]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#dc2626] text-white text-xs font-semibold rounded-md hover:bg-red-700 shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

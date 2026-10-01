'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  ArrowLeft,
  Check,
  AlertTriangle,
  Clock,
  Calendar,
  MapPin,
  History,
  RotateCcw,
} from 'lucide-react';

export interface ODDetailRecord {
  id: string;
  code: string;
  studentId: string;
  studentName: string;
  studentRegNo: string;
  department?: string;
  year?: string;
  section?: string;
  eventId?: string | null;
  activityId?: string | null;
  purpose: string;
  eventName: string;
  organization?: string | null;
  reason: string;
  startDate: string;
  endDate: string;
  date?: string;
  fromTime?: string;
  toTime?: string;
  slotType?: string;
  totalDays?: number;
  venue?: string;
  registrationId?: string | null;
  additionalNotes?: string | null;
  status: string;
  remarks?: string | null;
  rejectionReason?: string | null;
  revisionNotes?: string | null;
  submittedDate?: string;
  approvedDate?: string | null;
  hasConflict?: boolean;
  conflictCount?: number;
  conflictingRequests?: Record<string, unknown>[];
  teamMembers?: { id?: string; name: string; regNo: string; email?: string; role?: string }[];
  documents?: { id: string; name: string; type: string; size: string; uploadDate: string; path: string }[];
  statusHistory?: { id: string; oldStatus: string; newStatus: string; note?: string | null; changedBy: string; changedAt: string }[];
}

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getODById, checkODConflict } = useData();

  const [requestData, setRequestData] = useState<ODDetailRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Decision Modal States
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState('');

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [actionError, setActionError] = useState('');
  const [approvalToast, setApprovalToast] = useState('');

  // Fetch from API
  useEffect(() => {
    async function fetchDetail() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/v1/od-requests/${resolvedParams.id}`);
        if (res.ok) {
          const body = await res.json();
          if (body.data) {
            setRequestData(body.data);
            setIsLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('API fetch error:', err);
      }

      // Context Fallback
      const contextReq = getODById(resolvedParams.id);
      if (contextReq) setRequestData(contextReq);
      setIsLoading(false);
    }

    fetchDetail();
  }, [resolvedParams.id, getODById]);

  if (isLoading) {
    return <div className="py-20 text-center text-xs text-[#586658]">Loading request details...</div>;
  }

  if (!requestData) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-sm text-[#586658]">Request not found.</p>
        <Link href="/hod/requests" className="text-xs font-semibold text-[#0a5c36] underline">
          ← Back to requests
        </Link>
      </div>
    );
  }

  const conflict = checkODConflict(requestData.studentRegNo, requestData.date || requestData.startDate);

  // Execute Decision API
  const executeDecision = async (
    decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    payload: { remarks?: string; rejection_reason?: string; revision_notes?: string }
  ) => {
    setActionError('');
    try {
      const res = await fetch(`/api/v1/od-requests/${requestData.id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          ...payload,
        }),
      });

      const body = await res.json();

      if (!res.ok) {
        setActionError(body.error?.message || 'Failed to process decision.');
        return false;
      }

      // Success
      setRequestData(body.data);
      setApprovalToast(`✓ Decision '${decision}' recorded successfully.`);
      setShowConfirmApprove(false);
      setShowRejectModal(false);
      setShowRevisionModal(false);
      setTimeout(() => {
        router.push('/hod/requests');
      }, 1200);
      return true;
    } catch (err: unknown) {
      console.error('Error executing decision:', err);
      setActionError('An unexpected network error occurred.');
      return false;
    }
  };

  const handleApprove = (e: React.FormEvent) => {
    e.preventDefault();
    executeDecision('APPROVED', { remarks: approvalRemarks });
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    executeDecision('REJECTED', { rejection_reason: rejectionReason });
  };

  const handleConfirmRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionNotes.trim()) {
      setActionError('Revision notes are required.');
      return;
    }
    executeDecision('REVISION_REQUESTED', { revision_notes: revisionNotes });
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
          <span>{approvalToast}</span>
        </div>
      )}

      {/* Error Message Banner */}
      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg">
          ⚠️ {actionError}
        </div>
      )}

      {/* Document Card Container */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Document Header */}
        <div className="border-b border-[#dfe6dc] pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
              Official OD Leave Application ({requestData.code || requestData.id})
            </span>
            <StatusIndicator status={requestData.status} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            {requestData.eventName}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-1">
            <span className="flex items-center gap-1 tabular-nums">
              <Calendar className="w-3.5 h-3.5 text-[#889688]" />
              {requestData.date || requestData.startDate}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#889688]" />
              {requestData.venue || 'CSE Department'}
            </span>
          </div>
        </div>

        {/* Schedule Conflict Notice */}
        {(conflict || requestData.conflict?.hasConflict) && (
          <div className="p-3.5 rounded-lg bg-[#fef9c3] border border-[#facc15] flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#ca8a04] shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-[#854d0e]">
              <p className="font-bold">Possible Schedule Overlap</p>
              <p className="text-[11px]">
                Student already has an approved OD on {conflict?.conflictingDate || requestData.date} for{' '}
                {conflict?.conflictingEventName || requestData.conflict?.conflictingEventName}.
              </p>
            </div>
          </div>
        )}

        {/* Grouped Information Sections */}
        <div className="divide-y divide-[#edf2ea] text-xs">
          {/* Purpose & Justification */}
          {requestData.reason && (
            <div className="py-4 space-y-1">
              <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider">
                Purpose &amp; Outcome
              </h2>
              <p className="text-xs text-[#172017] leading-relaxed">
                {requestData.reason}
              </p>
            </div>
          )}

          {/* Decision Remarks/Notes if already decided */}
          {requestData.remarks && (
            <div className="py-3 bg-[#eaf7e8] px-3 rounded-md space-y-0.5 my-2">
              <span className="text-[10px] font-bold text-[#0a5c36] uppercase tracking-wider">HOD Approval Remarks:</span>
              <p className="text-xs text-[#0a5c36]">{requestData.remarks}</p>
            </div>
          )}

          {requestData.rejectionReason && (
            <div className="py-3 bg-red-50 px-3 rounded-md space-y-0.5 my-2">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Rejection Reason:</span>
              <p className="text-xs text-red-700">{requestData.rejectionReason}</p>
            </div>
          )}

          {requestData.revisionNotes && (
            <div className="py-3 bg-amber-50 px-3 rounded-md space-y-0.5 my-2 border border-amber-200">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Revision Requested Notes:</span>
              <p className="text-xs text-amber-900">{requestData.revisionNotes}</p>
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
                    {requestData.studentName}
                  </span>
                  <span className="text-[11px] text-[#586658]">Lead Applicant · Year {requestData.year || 'II'}</span>
                </div>
                <span className="text-[#0a5c36] font-mono text-[11px] font-bold tabular-nums">
                  {requestData.studentRegNo}
                </span>
              </div>

              {requestData.teamMembers &&
                (requestData.teamMembers as Record<string, unknown>[])
                  .filter((m: Record<string, unknown>) => m.regNo !== requestData.studentRegNo)
                  .map((m: Record<string, unknown>, idx: number) => (
                    <div key={idx} className="flex justify-between items-baseline p-2 rounded bg-white border border-[#dfe6dc] text-xs">
                      <span className="text-[#172017]">{m.name as string}</span>
                      <span className="text-[#586658] font-mono text-[11px] tabular-nums">{m.regNo as string}</span>
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
              <p className="font-semibold">{(requestData.date || requestData.startDate) as string}</p>
              <p className="text-[#586658] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#889688]" />
                <span>{(requestData.fromTime || '09:00 AM') as string} — {(requestData.toTime || '05:00 PM') as string}</span>
              </p>
            </div>
          </div>

          {/* Status Timeline History */}
          {requestData.statusHistory && Array.isArray(requestData.statusHistory) && requestData.statusHistory.length > 0 && (
            <div className="py-4 space-y-2">
              <h2 className="text-[11px] font-bold text-[#586658] uppercase tracking-wider flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-[#0a5c36]" />
                <span>Status History &amp; Decision Audit</span>
              </h2>

              <div className="space-y-2 pt-1">
                {(requestData.statusHistory as Record<string, unknown>[]).map((h: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="p-2.5 rounded bg-[#f7f9f5] border border-[#dfe6dc] text-xs space-y-0.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#172017]">
                        {h.oldStatus as string} → <span className="text-[#0a5c36]">{h.newStatus as string}</span>
                      </span>
                      <span className="text-[#889688]">{new Date(h.changedAt as string).toLocaleString()}</span>
                    </div>
                    {Boolean(h.note) && <p className="text-[#586658] text-[11px] italic">&ldquo;{h.note as string}&rdquo;</p>}
                    <p className="text-[10px] text-[#889688]">Actor: {h.changedBy as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {requestData.status === 'PENDING' && (
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-[#dfe6dc]">
            <button
              type="button"
              onClick={() => { setActionError(''); setShowRevisionModal(true); }}
              className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-md border border-amber-300 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Request Revision</span>
            </button>
            <button
              type="button"
              onClick={() => { setActionError(''); setShowRejectModal(true); }}
              className="px-4 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-300 transition-colors"
            >
              Reject Application
            </button>
            <button
              type="button"
              onClick={() => { setActionError(''); setShowConfirmApprove(true); }}
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
          <form onSubmit={handleApprove} className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 border border-[#dfe6dc] shadow-xl animate-in fade-in zoom-in-95 duration-100">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172017]">
                Approve On-Duty Leave?
              </h3>
              <p className="text-xs text-[#586658] leading-relaxed">
                {requestData.eventName} · {requestData.date || requestData.startDate}
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                Remarks (Optional)
              </label>
              <input
                type="text"
                value={approvalRemarks}
                onChange={(e) => setApprovalRemarks(e.target.value)}
                placeholder="e.g. Approved. Academic attendance granted."
                className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017]"
              />
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
                type="submit"
                className="px-4 py-1.5 bg-[#0a5c36] text-white text-xs font-semibold rounded-md hover:bg-[#084c2c] shadow-xs"
              >
                Confirm Approval
              </button>
            </div>
          </form>
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
                Please state the mandatory reason for rejecting this leave application.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                Reason *
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

      {/* Revision Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmRevision}
            className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4 border border-[#dfe6dc] shadow-xl animate-in fade-in zoom-in-95 duration-100"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172017]">
                Request Revision
              </h3>
              <p className="text-xs text-[#586658]">
                Please state the required updates for the student to resubmit.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                Revision Notes *
              </label>
              <textarea
                required
                rows={3}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. Please upload registration confirmation PDF signed by faculty guide."
                className="w-full p-2.5 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017] focus:outline-none focus:border-[#0a5c36]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRevisionModal(false)}
                className="px-3.5 py-1.5 text-xs text-[#586658] hover:text-[#172017]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-md hover:bg-amber-700 shadow-xs"
              >
                Send Directive
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

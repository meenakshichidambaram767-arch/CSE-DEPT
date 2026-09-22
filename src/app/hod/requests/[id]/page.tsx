'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  User,
  ShieldAlert,
} from 'lucide-react';

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { getODById, approveOD, rejectOD, checkODConflict } = useData();

  const request = getODById(resolvedParams.id);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!request) {
    return (
      <div className="min-h-screen bg-slate-50/60 p-10 flex flex-col items-center justify-center">
        <p className="text-sm font-semibold text-slate-500 mb-4">Request not found.</p>
        <Link href="/hod/requests" className="text-xs font-bold text-emerald-800 underline">
          ← Return to Requests
        </Link>
      </div>
    );
  }

  // Conflict check
  const conflict = checkODConflict(request.studentRegNo, request.date);

  const handleApprove = () => {
    approveOD(request.id, 'Approved by HOD Office. Department attendance granted.');
    router.push('/hod/requests');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;
    rejectOD(request.id, rejectionReason);
    setShowRejectModal(false);
    router.push('/hod/requests');
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-4xl mx-auto">
      {/* Top Back Link */}
      <div>
        <Link
          href="/hod/requests"
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Requests
        </Link>
      </div>

      {/* Main Request Detail Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Title Header */}
        <div className="border-b border-slate-100 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                {request.purpose || 'EVENT'}
              </span>
              <span className="text-xs text-slate-400">ID: {request.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {request.eventName}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                {request.date || request.startDate}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {request.venue || 'CSE Dept'} {request.location && `(${request.location})`}
              </span>
            </p>
          </div>

          <div className="shrink-0">
            {request.status === 'APPROVED' && (
              <span className="px-3.5 py-1.5 text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Approved
              </span>
            )}
            {request.status === 'REJECTED' && (
              <span className="px-3.5 py-1.5 text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 rounded-lg flex items-center gap-1.5">
                <XCircle className="w-4 h-4" />
                Rejected
              </span>
            )}
            {request.status === 'PENDING' && (
              <span className="px-3.5 py-1.5 text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded-lg">
                Pending Review
              </span>
            )}
          </div>
        </div>

        {/* Schedule Conflict Warning Banner if triggered */}
        {(conflict || request.conflict?.hasConflict) && (
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
                ⚠ Possible Schedule Conflict
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-400">
                This student already has an approved OD on {conflict?.conflictingDate || request.date} for{' '}
                <span className="font-semibold">{conflict?.conflictingEventName || request.conflict?.conflictingEventName}</span> ({conflict?.conflictingTime || '09:00 AM - 04:00 PM'}).
              </p>
            </div>
          </div>
        )}

        {/* Purpose Details */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            PURPOSE
          </h3>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {request.reason}
          </p>
        </div>

        {/* Participating Students */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            STUDENTS
          </h3>

          <div className="space-y-2">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-slate-400" />
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {request.studentName}
                  </p>
                  <p className="text-xs text-slate-500">
                    Register No: {request.studentRegNo} · Year {request.year} {request.section && `· Sec ${request.section}`}
                  </p>
                </div>
              </div>
            </div>

            {request.teamMembers && request.teamMembers.length > 1 && (
              <div className="space-y-2 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-500">Team Members ({request.teamMembers.length - 1}):</p>
                {request.teamMembers.filter((m) => m.regNo !== request.studentRegNo).map((member, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>{member.name}</span>
                    <span className="text-slate-400">Reg No: {member.regNo}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            DOCUMENTS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  {request.proofDocName || 'Registration Proof'}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✓</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-800" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Invitation / Event Letter
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">✓</span>
            </div>
          </div>
        </div>

        {/* OD Period */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-6">
          <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
            OD PERIOD
          </h3>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {request.date || request.startDate} · {request.fromTime || '08:00 AM'} – {request.toTime || '06:00 PM'}
          </p>
        </div>

        {/* Action Buttons */}
        {request.status === 'PENDING' && (
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="px-6 py-2.5 text-xs font-bold text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
            >
              Reject
            </button>
            <button
              type="button"
              onClick={handleApprove}
              className="px-6 py-2.5 text-xs font-bold bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-xl shadow-xs transition-colors"
            >
              Approve
            </button>
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 border border-slate-200 dark:border-slate-800 shadow-xl"
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reason for rejection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please state the rationale for rejecting this OD request.
              </p>
            </div>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection (e.g., conflicts with mid-term examination)..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Reject request
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  FolderKanban,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  FileText,
  RotateCcw,
  Download,
  History,
} from 'lucide-react';
import { GithubIcon } from '@/components/common/GithubIcon';

export default function DedicatedHodApprovalScreen() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const {
    getActivityById,
    getODById,
    approveActivity,
    rejectActivity,
    requestRevisionActivity,
    approveOD,
    rejectOD,
    requestRevisionOD,
    getStudentStats,
  } = useData();
  const { showToast } = useToast();

  const activity = getActivityById(id);
  const odItem = getODById(id);

  const [approvalRemarks, setApprovalRemarks] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  // Clarification state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  // Rejection state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!activity && !odItem) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto font-sans">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Submission Record Not Found</h2>
        <p className="text-xs text-slate-500">Record {id} could not be located.</p>
        <Button variant="primary" size="sm" onClick={() => router.push('/hod/approvals')}>
          Back to Approvals
        </Button>
      </div>
    );
  }

  const isActivity = !!activity;
  const data = isActivity ? activity! : odItem!;
  const title = isActivity ? activity!.title : odItem!.eventName;
  const status = data.status;
  const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'PENDING';
  const stats = getStudentStats(data.studentRegNo);

  const handleConfirmApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      if (isActivity) {
        approveActivity(activity!.id, approvalRemarks || 'Approved by HOD.');
        showToast(`Approved ${activity!.title}`, 'Status updated to ACTIVE.', 'success');
      } else {
        approveOD(odItem!.id, approvalRemarks || 'Approved by HOD.');
        showToast(`Approved OD for ${odItem!.studentName}`, 'Attendance granted.', 'success');
      }
      setIsApproving(false);
      router.push('/hod/approvals');
    }, 400);
  };

  const handleConfirmRevision = () => {
    if (!revisionNotes.trim()) {
      showToast('Revision instructions required.', 'warning');
      return;
    }
    setIsRequestingRevision(true);
    setTimeout(() => {
      if (isActivity) {
        requestRevisionActivity(activity!.id, revisionNotes);
      } else {
        requestRevisionOD(odItem!.id, revisionNotes);
      }
      showToast(`Revision Requested for ${data.id}`, 'Student notified.', 'info');
      setIsRequestingRevision(false);
      setIsRevisionModalOpen(false);
      router.push('/hod/approvals');
    }, 400);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason required.', 'warning');
      return;
    }
    setIsRejecting(true);
    setTimeout(() => {
      if (isActivity) {
        rejectActivity(activity!.id, rejectionReason);
      } else {
        rejectOD(odItem!.id, rejectionReason);
      }
      showToast(`Rejected ${data.id}`, 'Decision recorded.', 'info');
      setIsRejecting(false);
      setIsRejectOpen(false);
      router.push('/hod/approvals');
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-16">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/hod/approvals')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          className="text-xs font-semibold"
        >
          Back to Approvals
        </Button>

        <span
          className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            status === 'ACTIVE' || status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              : status === 'REJECTED'
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {status}
        </span>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 rounded-2xl bg-[#064e3b] text-white space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono font-bold text-amber-300 bg-emerald-900/80 px-2 py-0.5 rounded">
                {data.id}
              </span>
              <span className="font-bold px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                {isActivity ? activity!.type : 'ON-DUTY CLEARANCE'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 font-medium">
              <span>Student: <strong className="text-white">{data.studentName}</strong></span>
              <span>•</span>
              <span>Reg No: <strong className="font-mono text-amber-200">{data.studentRegNo}</strong></span>
              <span>•</span>
              <span>Dept: CSE (Year {data.year || 'II'})</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-800/60 text-right shrink-0 border border-emerald-700">
            <span className="text-[10px] font-bold text-amber-300 uppercase block">Guide</span>
            <strong className="text-xs font-bold text-white">
              {isActivity ? activity!.guideName || 'Dr. Priya Kumar' : 'Dept Office'}
            </strong>
          </div>
        </div>
      </div>

      {/* 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details & Attachments */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Scope & Synopsis */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Project Synopsis</span>
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-normal">
              {isActivity ? activity!.description : odItem!.reason}
            </p>

            {isActivity && activity!.technologies && activity!.technologies.length > 0 && (
              <div className="pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Technologies
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activity!.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Document Attachment & Repository */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-700" />
              <span>Attached Document &amp; Links</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 gap-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <div>
                  <strong className="text-xs font-bold text-slate-900 block">
                    {data.proofDocName || 'Proposal_Document_Signed.pdf'}
                  </strong>
                  <span className="text-[11px] text-slate-400">PDF Document • Verified Upload</span>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => showToast('Document Downloaded', 'Copy saved to downloads.', 'success')}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Download PDF
              </Button>
            </div>

            {isActivity && activity!.githubUrl && (
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <GithubIcon className="w-5 h-5 text-slate-800" />
                  <span className="text-xs font-bold text-slate-900">{activity!.githubUrl}</span>
                </div>
                <a
                  href={activity!.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Open GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Team Roster */}
          {isActivity && activity!.teamMembers && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Team Roster ({activity!.teamMembers.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activity!.teamMembers.map((m, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900">{m.name}</strong>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {m.role || 'Member'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 block">{m.regNo}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Track Record */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>Student Academic Standing</span>
              </h3>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {stats.standing}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Approved Projects</span>
                <strong className="text-slate-900 font-bold">{stats.approvedActivities}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">OD Clearances</span>
                <strong className="text-purple-800 font-bold">{stats.approvedODs}</strong>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block font-semibold">Attendance Rate</span>
                <strong className="text-emerald-700 font-bold">{stats.attendanceRate}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: HOD Action Gateway */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4 sticky top-20">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              HOD Decision Gateway
            </h3>

            {!isPending ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 block font-bold">Status: {status}</strong>
                <p className="text-slate-600">Decision has been recorded for this submission.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    HOD Remarks (Optional)
                  </label>
                  <textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    rows={3}
                    placeholder="Enter approval notes or recommendations..."
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmApprove}
                  isLoading={isApproving}
                  className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 font-bold text-xs"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve Proposal
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="w-full justify-center border-blue-300 text-blue-900 hover:bg-blue-50 font-bold text-xs"
                  leftIcon={<RotateCcw className="w-4 h-4 text-blue-700" />}
                >
                  Request Clarification
                </Button>

                <Button
                  variant="danger"
                  size="md"
                  onClick={() => setIsRejectOpen(true)}
                  className="w-full justify-center font-bold text-xs"
                  leftIcon={<XCircle className="w-4 h-4" />}
                >
                  Reject Proposal
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clarification Modal */}
      <Dialog
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="Request Proposal Clarification"
        variant="information"
        confirmLabel={isRequestingRevision ? 'Sending...' : 'Send Request'}
        onConfirm={handleConfirmRevision}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">Specify instructions for the student to update their proposal.</p>
          <Textarea
            label="Clarification Notes"
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={3}
            isRequired
          />
        </div>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Rejection Reason"
        variant="danger"
        confirmLabel={isRejecting ? 'Recording...' : 'Confirm Rejection'}
        onConfirm={handleConfirmReject}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">State the reason for rejecting this proposal.</p>
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

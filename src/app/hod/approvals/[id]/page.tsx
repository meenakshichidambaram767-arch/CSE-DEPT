'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  FolderKanban,
  Trophy,
  BriefcaseBusiness,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  FileText,
  Check,
  Share2,
  History,
  Info,
  CalendarPlus,
  RotateCcw,
  Bell,
  Eye,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckSquare,
  Building,
  GraduationCap,
  MessageSquare,
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
    scheduleRecurringReviews,
    getStudentStats,
  } = useData();
  const { showToast } = useToast();

  const activity = getActivityById(id);
  const odItem = getODById(id);

  // Approval with optional remarks state
  const [approvalRemarks, setApprovalRemarks] = useState(
    'Endorsed by HOD. Verified project scope, faculty guide alignment, and departmental lab resources.'
  );
  const [isApproving, setIsApproving] = useState(false);

  // Clarification / Revision state
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState(
    'Please refine the system architecture diagram and clarify the third-party API integration specifications.'
  );
  const [isRequestingRevision, setIsRequestingRevision] = useState(false);

  // Rejection with mandatory reason state
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState(
    'Project scope duplicates previous batch submissions and does not demonstrate sufficient technical complexity.'
  );
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve & Schedule Review Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<'8_WEEK' | '4_WEEK' | 'BI_WEEKLY' | 'CUSTOM'>('8_WEEK');
  const [reviewDay, setReviewDay] = useState('Friday');
  const [reviewTime, setReviewTime] = useState('02:00 PM');
  const [startDate, setStartDate] = useState('2026-09-25');
  const [venue, setVenue] = useState('CSE Lab 2 (AI Center)');
  const [numberOfReviews, setNumberOfReviews] = useState('8');
  const [intervalWeeks, setIntervalWeeks] = useState(1);
  const [isScheduling, setIsScheduling] = useState(false);

  // Inline Document Viewer State
  const [docPage, setDocPage] = useState(1);
  const [docZoom, setDocZoom] = useState(100);

  if (!activity && !odItem) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Submission Record Not Located</h2>
        <p className="text-xs text-slate-500">
          The requested record <strong>{id}</strong> could not be found in the department database.
        </p>
        <Button variant="primary" size="sm" onClick={() => router.push('/hod/approvals')}>
          Back to Approvals Inbox
        </Button>
      </div>
    );
  }

  const isActivity = !!activity;
  const data = isActivity ? activity! : odItem!;
  const title = isActivity ? activity!.title : odItem!.eventName;
  const status = data.status;
  const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'PENDING';
  const isRevisionRequested = status === 'REVISION_REQUESTED';

  const stats = getStudentStats(data.studentRegNo);

  // Preset switch handler
  const handleSelectPreset = (preset: '8_WEEK' | '4_WEEK' | 'BI_WEEKLY' | 'CUSTOM') => {
    setActivePreset(preset);
    if (preset === '8_WEEK') {
      setNumberOfReviews('8');
      setIntervalWeeks(1);
    } else if (preset === '4_WEEK') {
      setNumberOfReviews('4');
      setIntervalWeeks(1);
    } else if (preset === 'BI_WEEKLY') {
      setNumberOfReviews('4');
      setIntervalWeeks(2);
    }
  };

  // 1-Click Template Suggestions
  const rejectionTemplates = [
    'Incomplete project scope & architecture diagram.',
    'Missing faculty mentor endorsement and guide assignment.',
    'Date conflict with mid-semester academic assessment schedules.',
    'Insufficient team member role definitions and workload breakdown.',
    'Proposal duplicates existing department repository without innovation.',
  ];

  const revisionTemplates = [
    'Please refine the system architecture diagram and clarify API specifications.',
    'Please attach mentor signature or supervisor recommendation letter.',
    'Please provide milestone deliverables for the 8-week timeline.',
    'Please confirm laboratory hardware and GPU workstation requirements.',
    'Please attach official event brochure with organizer seal.',
  ];

  // Action: Confirm Approve
  const handleConfirmApprove = () => {
    setIsApproving(true);
    setTimeout(() => {
      if (isActivity) {
        approveActivity(activity!.id, approvalRemarks);
        showToast(`Approved ${activity!.title}`, 'Status transitioned to ACTIVE.', 'success');
      } else {
        approveOD(odItem!.id, approvalRemarks);
        showToast(`Approved OD for ${odItem!.studentName}`, 'Academic attendance concession granted.', 'success');
      }
      setIsApproving(false);
    }, 400);
  };

  // Action: Confirm Clarification / Revision
  const handleConfirmRevision = () => {
    if (!revisionNotes.trim()) {
      showToast('Revision notes cannot be empty.', 'warning');
      return;
    }

    setIsRequestingRevision(true);
    setTimeout(() => {
      if (isActivity) {
        requestRevisionActivity(activity!.id, revisionNotes);
        showToast(`Revision Requested for ${activity!.title}`, 'Student notified with directive.', 'info');
      } else {
        requestRevisionOD(odItem!.id, revisionNotes);
        showToast(`Revision Requested for OD ${odItem!.studentName}`, 'Applicant notified.', 'info');
      }
      setIsRequestingRevision(false);
      setIsRevisionModalOpen(false);
    }, 400);
  };

  // Action: Approve & Auto-Schedule Reviews
  const handleApproveAndSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;

    setIsScheduling(true);
    setTimeout(() => {
      // 1. Approve project
      approveActivity(activity.id, approvalRemarks);

      // 2. Generate recurring reviews with interval
      const count = parseInt(numberOfReviews, 10) || 8;
      scheduleRecurringReviews({
        projectId: activity.id,
        dayOfWeek: reviewDay,
        time: reviewTime,
        startDate,
        venue,
        count,
        intervalWeeks,
      });

      setIsScheduling(false);
      setIsScheduleModalOpen(false);
      showToast(
        `Approved & Scheduled ${count} Reviews!`,
        `Project ACTIVE • ${reviewDay} at ${reviewTime} in ${venue}.`,
        'success'
      );
      router.push('/hod/reviews');
    }, 500);
  };

  // Action: Reject with Mandatory Reason
  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is mandatory.', 'warning');
      return;
    }

    setIsRejecting(true);
    setTimeout(() => {
      if (isActivity) {
        rejectActivity(activity!.id, rejectionReason);
        showToast(`Rejected ${activity!.title}`, 'Student notified with audit reason.', 'info');
      } else {
        rejectOD(odItem!.id, rejectionReason);
        showToast(`Rejected OD for ${odItem!.studentName}`, 'Notification dispatched to applicant.', 'info');
      }
      setIsRejecting(false);
      setIsRejectOpen(false);
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-16">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/hod/approvals')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            className="font-bold text-slate-700 hover:bg-slate-100"
          >
            Back to Approvals Inbox
          </Button>
          <span className="text-xs text-slate-400 font-mono">
            Approvals &gt; {data.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider ${
              status === 'ACTIVE' || status === 'APPROVED'
                ? 'bg-emerald-100 text-emerald-950 border border-emerald-300'
                : status === 'REJECTED'
                ? 'bg-red-100 text-red-950 border border-red-300'
                : status === 'REVISION_REQUESTED'
                ? 'bg-blue-100 text-blue-950 border border-blue-300'
                : 'bg-amber-100 text-amber-950 border border-amber-300 animate-pulse'
            }`}
          >
            ● {status === 'REVISION_REQUESTED' ? 'REVISION REQUESTED' : status}
          </span>
        </div>
      </div>

      {/* Main Student Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-[#064e3b] to-emerald-900 text-white shadow-xl space-y-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 opacity-10 bg-[radial-gradient(#f3b72b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-emerald-950 font-black text-2xl flex items-center justify-center shadow-lg shrink-0 border-2 border-amber-200">
              {data.studentName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 bg-emerald-900/80 px-2 py-0.5 rounded border border-amber-400/30">
                  {data.id}
                </span>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-800 text-emerald-100 border border-emerald-700">
                  {isActivity ? activity!.type : 'ON-DUTY CLEARANCE'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100/90 pt-0.5 font-medium">
                <span>Applicant: <strong className="text-white">{data.studentName}</strong></span>
                <span>•</span>
                <span>Reg No: <strong className="font-mono text-amber-200">{data.studentRegNo}</strong></span>
                <span>•</span>
                <span>Dept: <strong className="text-white">{data.department}</strong></span>
                <span>•</span>
                <span>Year: <strong className="text-white">{data.year || 'II'} Year</strong></span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-800/70 border border-emerald-700/80 text-left md:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block">
              Department &amp; Guide Oversight
            </span>
            <strong className="text-sm font-bold text-white block">
              {isActivity ? activity!.guideName || 'Dr. Priya Kumar (HOD)' : 'Department Office'}
            </strong>
            <span className="text-xs text-emerald-200">SIET Autonomous CSE</span>
          </div>
        </div>
      </div>

      {/* 2-Column Main Evaluation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Scope, Embedded Document Viewer, Team, History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Problem Statement & Scope */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>1. Scope &amp; Technical Synopsis</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {isActivity
                  ? `${activity!.startDate} to ${activity!.endDate}`
                  : `${odItem!.date || odItem!.startDate} (${odItem!.fromTime} - ${odItem!.toTime})`}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                <strong className="text-xs font-bold text-slate-900 block uppercase tracking-wide text-[10px] text-slate-500">
                  {isActivity ? 'Problem Statement & Proposed Solution' : 'Purpose of On-Duty Clearance'}
                </strong>
                <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                  {isActivity ? activity!.description : odItem!.reason}
                </p>
              </div>

              {isActivity && activity!.additionalNotes && (
                <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-amber-900 space-y-0.5">
                  <strong className="text-[10px] font-bold uppercase text-amber-800 block">
                    Student Submission Notes:
                  </strong>
                  <p className="text-xs font-medium">{activity!.additionalNotes}</p>
                </div>
              )}
            </div>

            {/* Verified Tech Stack */}
            {isActivity && activity!.technologies && activity!.technologies.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Verified Technology Stack
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {activity!.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Embedded Inline PDF / Document Viewer */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>2. Embedded Supporting Document Viewer</span>
              </h3>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                Verified Upload (PDF)
              </span>
            </div>

            {/* Document Controls & Embedded Frame */}
            <div className="rounded-2xl border border-slate-300 bg-slate-900 overflow-hidden shadow-inner">
              {/* Document toolbar */}
              <div className="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex flex-wrap items-center justify-between gap-3 text-white text-xs">
                <div className="flex items-center gap-2 truncate">
                  <FileCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-mono font-bold truncate">
                    {data.proofDocName || 'Proposal_Document_Signed.pdf'}
                  </span>
                  <span className="text-[10px] text-slate-400">(1.4 MB • SHA256 Verified)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-700 rounded-lg px-2 py-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setDocPage((p) => Math.max(1, p - 1))}
                      disabled={docPage <= 1}
                      className="px-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ‹
                    </button>
                    <span className="px-2 font-mono text-[11px]">
                      Page {docPage} of 3
                    </span>
                    <button
                      type="button"
                      onClick={() => setDocPage((p) => Math.min(3, p + 1))}
                      disabled={docPage >= 3}
                      className="px-1.5 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer font-bold"
                    >
                      ›
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.max(80, z - 10))}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono px-1">{docZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setDocZoom((z) => Math.min(150, z + 10))}
                      className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast('Document Downloaded', `${data.proofDocName || 'Proposal.pdf'} downloaded successfully.`, 'success')}
                    className="p-1 rounded bg-slate-700 hover:bg-emerald-700 text-slate-300 hover:text-white cursor-pointer"
                    title="Download Copy"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Document Canvas Content Area */}
              <div className="p-6 bg-slate-100 flex items-center justify-center min-h-[300px]">
                <div
                  className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-slate-300 text-slate-800 w-full max-w-xl space-y-4 font-serif transition-all"
                  style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Institutional Header inside document */}
                  <div className="text-center pb-3 border-b border-slate-300 space-y-1">
                    <div className="text-[10px] tracking-widest uppercase font-sans font-black text-emerald-900">
                      Sri Shakthi Institute of Engineering &amp; Technology (Autonomous)
                    </div>
                    <div className="text-xs font-bold text-slate-900 font-sans">
                      DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      Academic Project Proposal &amp; Clearance Endorsement
                    </div>
                  </div>

                  {/* Document Body */}
                  <div className="text-[11px] leading-relaxed space-y-2.5 font-sans">
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Record ID:</span>
                      <strong className="font-mono">{data.id}</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Lead Applicant:</span>
                      <strong>{data.studentName} ({data.studentRegNo})</strong>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-1">
                      <span className="text-slate-500">Project / Activity Title:</span>
                      <strong className="text-slate-900">{title}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Abstract &amp; Problem Statement:</span>
                      <p className="bg-slate-50 p-2.5 rounded text-[11px] text-slate-700 italic border border-slate-200">
                        &quot;{isActivity ? activity!.description : odItem!.reason}&quot;
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-[10px] text-slate-500">
                      <div>
                        <span>Faculty Guide Signature: </span>
                        <strong className="text-emerald-800">Verified ✓</strong>
                      </div>
                      <div className="text-right">
                        <span>HOD Seal Clearance: </span>
                        <strong className="text-amber-800">Pending Decision</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* External repository link */}
            {isActivity && activity!.githubUrl && (
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <GithubIcon className="w-5 h-5 text-slate-800 shrink-0" />
                  <div className="truncate">
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      {activity!.githubUrl}
                    </strong>
                    <span className="text-[10px] text-slate-500">Source Code Repository</span>
                  </div>
                </div>

                <a
                  href={activity!.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline shrink-0 bg-white px-3 py-1.5 rounded-xl border border-slate-200"
                >
                  <span>Open GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* 3. Team Roster */}
          {isActivity && (
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>3. Team Roster ({activity!.teamMembers.length} Students)</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activity!.teamMembers.map((member, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1 hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-slate-900">{member.name}</strong>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {member.role || (idx === 0 ? 'Team Lead' : 'Developer')}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">{member.regNo}</div>
                    <div className="text-[11px] text-slate-400 truncate">{member.email}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Student Track Record */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <span>4. Department History &amp; Standing for {data.studentName}</span>
              </h3>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {stats.standing}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Approved Projects</span>
                <strong className="text-slate-900 text-base font-black">{stats.approvedActivities} Projects</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">OD Concessions</span>
                <strong className="text-purple-800 text-base font-black">{stats.approvedODs} Granted</strong>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Review Attendance</span>
                <strong className="text-emerald-700 text-base font-black">{stats.attendanceRate} Attended</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Decision Command Center & Live Alert Preview */}
        <div className="space-y-6">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-white border-2 border-slate-200 shadow-md space-y-6 sticky top-20">
            <div className="pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                HOD Decision Gateway
              </span>
              <h3 className="text-base font-black text-slate-900 mt-0.5">
                Executive Department Actions
              </h3>
            </div>

            {/* If not pending */}
            {!isPending && !isRevisionRequested ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-2xl border ${
                    status === 'ACTIVE' || status === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  <strong className="text-xs font-bold block">
                    Decision Recorded: {status}
                  </strong>
                  <p className="text-xs mt-1 leading-relaxed">
                    {status === 'ACTIVE' || status === 'APPROVED'
                      ? 'This proposal is approved and active in the departmental lifecycle.'
                      : `Rejection Audit Feedback: "${data.rejectionReason || 'Deficiencies identified.'}"`}
                  </p>
                </div>

                {isActivity && (status === 'ACTIVE' || status === 'APPROVED') && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="w-full justify-center bg-purple-700 hover:bg-purple-800"
                    leftIcon={<CalendarPlus className="w-4 h-4" />}
                  >
                    Adjust Weekly Review Schedule
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* 1. Optional Endorsement Remarks */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Faculty Endorsement Remarks (Optional)
                  </label>
                  <textarea
                    value={approvalRemarks}
                    onChange={(e) => setApprovalRemarks(e.target.value)}
                    rows={3}
                    placeholder="Enter positive recommendations or laboratory directives for the team..."
                    className="w-full p-3 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Will be recorded on the project timeline and delivered to the student team.
                  </p>
                </div>

                {/* Primary Approve Button */}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirmApprove}
                  isLoading={isApproving}
                  className="w-full justify-center bg-emerald-700 hover:bg-emerald-800 text-sm font-bold shadow-md"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve Proposal
                </Button>

                {/* 1-Click Approve & Auto-Schedule Shortcut */}
                {isActivity && activity!.type === 'PROJECT' && (
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="w-full justify-center border-purple-300 text-purple-950 hover:bg-purple-50 text-xs font-bold"
                    leftIcon={<CalendarPlus className="w-4 h-4 text-purple-700" />}
                  >
                    Approve &amp; Auto-Schedule Reviews
                  </Button>
                )}

                {/* Request Clarification / Revision (Non-punitive) */}
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="w-full justify-center border-blue-300 text-blue-950 hover:bg-blue-50 text-xs font-bold"
                  leftIcon={<RotateCcw className="w-4 h-4 text-blue-700" />}
                >
                  Request Clarification / Revision
                </Button>

                {/* Reject Button */}
                <div className="pt-2 border-t border-slate-200">
                  <Button
                    variant="danger"
                    size="md"
                    onClick={() => setIsRejectOpen(true)}
                    className="w-full justify-center text-xs font-bold"
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject with Feedback
                  </Button>
                </div>

                {/* Live Student Notification Preview Card */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800">
                  <div className="flex items-center justify-between text-amber-400 text-xs font-bold pb-1 border-b border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      <span>Live Student Alert Preview</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">PUSH / EMAIL</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    <strong>To:</strong> {data.studentName} ({data.studentRegNo})<br />
                    <strong>Subject:</strong> Department Decision on &quot;{title}&quot;<br />
                    <span className="text-emerald-300 block mt-1">
                      &quot;{approvalRemarks || 'Proposal under evaluation by Head of Department.'}&quot;
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clarification & Revision Modal */}
      <Dialog
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="Request Proposal Revision / Clarification"
        variant="information"
        confirmLabel={isRequestingRevision ? 'Sending Directive...' : 'Send Revision Request'}
        onConfirm={handleConfirmRevision}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
            <strong className="block text-xs font-bold text-blue-900">
              Revision Request for: {title}
            </strong>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              This will set the status to <strong>REVISION REQUESTED</strong> without penalty. The student will be prompted to adjust and resubmit.
            </p>
          </div>

          {/* Quick 1-Click Templates */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quick Suggestion Templates:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {revisionTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRevisionNotes(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-medium border border-blue-200 text-left transition-colors cursor-pointer"
                >
                  + {tpl}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Revision Guidance for Student (Required)"
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={4}
            isRequired
            placeholder="e.g. Please refine the system architecture diagram and clarify the third-party API integration specifications..."
          />
        </div>
      </Dialog>

      {/* Mandatory Rejection Reason Modal */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Department Rejection &amp; Audit Directive"
        variant="danger"
        confirmLabel={isRejecting ? 'Recording Rejection...' : 'Confirm Rejection'}
        onConfirm={handleConfirmReject}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1">
            <strong className="block text-xs font-bold">
              Rejecting: {title}
            </strong>
            <p className="text-[11px] text-red-700 leading-relaxed">
              State the exact deficiencies or required corrections. This reason is logged in departmental records.
            </p>
          </div>

          {/* Quick 1-Click Rejection Templates */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Rejection Reasons:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {rejectionTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRejectionReason(tpl)}
                  className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 text-[11px] font-medium border border-red-200 text-left transition-colors cursor-pointer"
                >
                  + {tpl}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="Mandatory Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            isRequired
            placeholder="e.g. Project scope duplicates existing department work and lacks verifiable technical depth..."
          />
        </div>
      </Dialog>

      {/* Approve & Auto-Schedule Reviews Modal with Presets */}
      <Dialog
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Approve &amp; Auto-Schedule Review Pipeline"
        variant="information"
        confirmLabel={isScheduling ? 'Scheduling...' : `Confirm & Generate ${numberOfReviews} Reviews`}
        onConfirm={() => handleApproveAndSchedule({ preventDefault: () => {} } as any)}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-950 space-y-1">
            <strong className="block text-xs font-bold text-purple-900">
              Review Pipeline Scheduler
            </strong>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Approves <strong>{title}</strong> and automatically generates recurring non-evaluative review milestones starting on your selected date.
            </p>
          </div>

          {/* Schedule Presets Selection */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Choose Schedule Preset:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleSelectPreset('8_WEEK')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activePreset === '8_WEEK'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                8-Week Semester (Weekly)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('4_WEEK')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activePreset === '4_WEEK'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                4-Week Sprint (Weekly)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('BI_WEEKLY')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activePreset === 'BI_WEEKLY'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Bi-Weekly (4 Sessions)
              </button>
              <button
                type="button"
                onClick={() => handleSelectPreset('CUSTOM')}
                className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                  activePreset === 'CUSTOM'
                    ? 'bg-purple-900 text-white border-purple-900 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Custom Setup
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Review Day of Week"
              options={[
                { value: 'Monday', label: 'Monday' },
                { value: 'Tuesday', label: 'Tuesday' },
                { value: 'Wednesday', label: 'Wednesday' },
                { value: 'Thursday', label: 'Thursday' },
                { value: 'Friday', label: 'Friday' },
                { value: 'Saturday', label: 'Saturday' },
              ]}
              value={reviewDay}
              onChange={(e) => setReviewDay(e.target.value)}
              isRequired
            />

            <Input
              label="Meeting Time"
              value={reviewTime}
              onChange={(e) => setReviewTime(e.target.value)}
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Start Date (Review #1)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              isRequired
            />

            <Input
              label="Number of Review Sessions"
              value={numberOfReviews}
              onChange={(e) => setNumberOfReviews(e.target.value)}
              isRequired
            />
          </div>

          <Input
            label="Venue / Lab Location"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

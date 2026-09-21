'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  BadgeCheck,
  FolderKanban,
  Trophy,
  BriefcaseBusiness,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  CheckSquare,
  Square,
  Users,
  Calendar,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  ArrowRight,
  Filter,
  GraduationCap,
  RotateCcw,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { GithubIcon } from '@/components/common/GithubIcon';
import { Activity, ODApplication, ActivityType, ActivityStatus, ODStatus } from '@/types';

type UnifiedApprovalItem =
  | { itemType: 'ACTIVITY'; data: Activity }
  | { itemType: 'OD'; data: ODApplication };

export default function HodApprovalsInboxPage() {
  const router = useRouter();
  const {
    activities,
    odApplications,
    approveActivity,
    rejectActivity,
    requestRevisionActivity,
    bulkApproveActivities,
    approveOD,
    rejectOD,
    requestRevisionOD,
    bulkApproveOD,
    getStudentStats,
  } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'REVISION_REQUESTED' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [yearFilter, setYearFilter] = useState<'ALL' | 'II' | 'III' | 'IV'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Rejection Reason Modal State
  const [rejectingItem, setRejectingItem] = useState<UnifiedApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Clarification / Revision Modal State
  const [revisingItem, setRevisingItem] = useState<UnifiedApprovalItem | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isProcessingRevision, setIsProcessingRevision] = useState(false);

  // Counters for Inbox
  const pendingProjectsCount = activities.filter(
    (a) => a.type === 'PROJECT' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  ).length;
  const pendingHackathonsCount = activities.filter(
    (a) => a.type === 'HACKATHON' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  ).length;
  const pendingInternshipsCount = activities.filter(
    (a) => a.type === 'INTERNSHIP' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  ).length;
  const pendingODCount = odApplications.filter((o) => o.status === 'PENDING').length;
  const totalPending = pendingProjectsCount + pendingHackathonsCount + pendingInternshipsCount + pendingODCount;

  const revisionCount =
    activities.filter((a) => a.status === 'REVISION_REQUESTED').length +
    odApplications.filter((o) => o.status === 'REVISION_REQUESTED').length;

  const approvedCount =
    activities.filter((a) => a.status === 'APPROVED' || a.status === 'ACTIVE').length +
    odApplications.filter((o) => o.status === 'APPROVED').length;

  // Build unified items list
  const allItems: UnifiedApprovalItem[] = [
    ...activities.map((a) => ({ itemType: 'ACTIVITY' as const, data: a })),
    ...odApplications.map((o) => ({ itemType: 'OD' as const, data: o })),
  ];

  // Filtering
  const filteredItems = allItems.filter((item) => {
    // Tab filter by category
    if (activeTab === 'PROJECTS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'PROJECT')) return false;
    if (activeTab === 'HACKATHONS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'HACKATHON')) return false;
    if (activeTab === 'INTERNSHIPS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'INTERNSHIP')) return false;
    if (activeTab === 'OD' && item.itemType !== 'OD') return false;

    // Academic Year filter
    if (yearFilter !== 'ALL') {
      const yr = item.data.year || 'II';
      if (yr !== yearFilter) return false;
    }

    // Status filter
    const status = item.data.status;
    if (statusFilter === 'PENDING') {
      if (item.itemType === 'ACTIVITY' && status !== 'SUBMITTED' && status !== 'UNDER_REVIEW') return false;
      if (item.itemType === 'OD' && status !== 'PENDING') return false;
    } else if (statusFilter === 'REVISION_REQUESTED') {
      if (status !== 'REVISION_REQUESTED') return false;
    } else if (statusFilter === 'APPROVED') {
      if (item.itemType === 'ACTIVITY' && status !== 'APPROVED' && status !== 'ACTIVE') return false;
      if (item.itemType === 'OD' && status !== 'APPROVED') return false;
    } else if (statusFilter === 'REJECTED') {
      if (status !== 'REJECTED') return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (item.itemType === 'ACTIVITY') {
        const a = item.data;
        return (
          a.title.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q) ||
          a.studentRegNo.toLowerCase().includes(q) ||
          a.type.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.technologies && a.technologies.some((t) => t.toLowerCase().includes(q)))
        );
      } else {
        const o = item.data;
        return (
          o.eventName.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.studentRegNo.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q) ||
          (o.activityTitle && o.activityTitle.toLowerCase().includes(q))
        );
      }
    }

    return true;
  });

  // Bulk Selection handling
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllVisible = () => {
    const visiblePending = filteredItems
      .filter((i) => i.data.status === 'SUBMITTED' || i.data.status === 'UNDER_REVIEW' || i.data.status === 'PENDING')
      .map((i) => i.data.id);

    if (selectedIds.length === visiblePending.length && visiblePending.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visiblePending);
    }
  };

  // Bulk Approval
  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    const actIds: string[] = [];
    const odIds: string[] = [];

    selectedIds.forEach((id) => {
      if (id.startsWith('OD-')) {
        odIds.push(id);
      } else {
        actIds.push(id);
      }
    });

    if (actIds.length > 0) bulkApproveActivities(actIds);
    if (odIds.length > 0) bulkApproveOD(odIds);

    showToast(`Bulk Approved ${selectedIds.length} Requests`, 'Clearance notifications dispatched.', 'success');
    setSelectedIds([]);
  };

  // Quick Approve
  const handleQuickApprove = (item: UnifiedApprovalItem) => {
    if (item.itemType === 'ACTIVITY') {
      approveActivity(item.data.id, 'Quick approved by HOD from Approvals Inbox.');
      showToast(`Approved ${item.data.title}`, `Status transitioned to ACTIVE.`, 'success');
    } else {
      approveOD(item.data.id, 'Quick approved by HOD from Approvals Inbox.');
      showToast(`Approved OD for ${item.data.studentName}`, 'Attendance clearance granted.', 'success');
    }
  };

  // Clarification Trigger
  const handleOpenRevision = (item: UnifiedApprovalItem) => {
    setRevisingItem(item);
    setRevisionNotes(
      item.itemType === 'ACTIVITY'
        ? 'Please refine the project methodology, attach mentor signature, and specify system requirements.'
        : 'Please attach official conference invitation brochure and confirm faculty advisor NOC.'
    );
  };

  // Confirm Clarification
  const handleConfirmRevision = () => {
    if (!revisingItem) return;
    if (!revisionNotes.trim()) {
      showToast('Please specify the revision instructions.', 'warning');
      return;
    }

    setIsProcessingRevision(true);
    setTimeout(() => {
      if (revisingItem.itemType === 'ACTIVITY') {
        requestRevisionActivity(revisingItem.data.id, revisionNotes);
        showToast(`Revision Requested for ${revisingItem.data.id}`, 'Student notified to revise proposal.', 'info');
      } else {
        requestRevisionOD(revisingItem.data.id, revisionNotes);
        showToast(`Revision Requested for OD ${revisingItem.data.id}`, 'Applicant notified.', 'info');
      }
      setIsProcessingRevision(false);
      setRevisingItem(null);
    }, 400);
  };

  // Reject Trigger
  const handleOpenReject = (item: UnifiedApprovalItem) => {
    setRejectingItem(item);
    setRejectionReason(
      item.itemType === 'ACTIVITY'
        ? 'Project scope duplicates existing department work and lacks verifiable technical depth.'
        : 'Event schedule conflicts with mid-semester examinations.'
    );
  };

  // Confirm Reject
  const handleConfirmRejection = () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is mandatory.', 'warning');
      return;
    }

    setIsProcessingReject(true);
    setTimeout(() => {
      if (rejectingItem.itemType === 'ACTIVITY') {
        rejectActivity(rejectingItem.data.id, rejectionReason);
        showToast(`Rejected ${rejectingItem.data.id}`, 'Student notified with rejection directive.', 'info');
      } else {
        rejectOD(rejectingItem.data.id, rejectionReason);
        showToast(`Rejected OD for ${rejectingItem.data.studentName}`, 'Decision recorded.', 'info');
      }
      setIsProcessingReject(false);
      setRejectingItem(null);
    }, 400);
  };

  const tabItems = [
    { id: 'ALL', label: `All Inquiries (${allItems.length})` },
    { id: 'PROJECTS', label: `Projects (${activities.filter((a) => a.type === 'PROJECT').length})` },
    { id: 'HACKATHONS', label: `Hackathons (${activities.filter((a) => a.type === 'HACKATHON').length})` },
    { id: 'INTERNSHIPS', label: `Internships (${activities.filter((a) => a.type === 'INTERNSHIP').length})` },
    { id: 'OD', label: `OD Requests (${odApplications.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      <PageHeader
        title="Centralized HOD Approval Inbox"
        description="Departmental evaluation gateway to review student proposals, verify academic track records, request revisions, and schedule weekly reviews."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Approvals Inbox', current: true },
        ]}
        badge={
          <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>{totalPending} Action Items Awaiting HOD Decision</span>
          </span>
        }
      />

      {/* Redesigned Summary Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Project Card */}
        <button
          type="button"
          onClick={() => { setActiveTab('PROJECTS'); setStatusFilter('PENDING'); }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'PROJECTS' && statusFilter === 'PENDING'
              ? 'bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
              Capstones &amp; Projects
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingProjectsCount} <span className="text-xs font-semibold text-slate-400">pending</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-emerald-700 font-bold">
            <span>Filter Proposals</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Hackathons Card */}
        <button
          type="button"
          onClick={() => { setActiveTab('HACKATHONS'); setStatusFilter('PENDING'); }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'HACKATHONS' && statusFilter === 'PENDING'
              ? 'bg-gradient-to-br from-amber-50 via-amber-100/50 to-amber-50 border-amber-500 shadow-md ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
              Hackathon Sprints
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingHackathonsCount} <span className="text-xs font-semibold text-slate-400">pending</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-amber-700 font-bold">
            <span>National Entries</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* Internships Card */}
        <button
          type="button"
          onClick={() => { setActiveTab('INTERNSHIPS'); setStatusFilter('PENDING'); }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'INTERNSHIPS' && statusFilter === 'PENDING'
              ? 'bg-gradient-to-br from-indigo-50 via-indigo-100/50 to-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
              Internship NOCs
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-800">
              <BriefcaseBusiness className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingInternshipsCount} <span className="text-xs font-semibold text-slate-400">pending</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-indigo-700 font-bold">
            <span>Industry Offers</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        {/* OD Requests Card */}
        <button
          type="button"
          onClick={() => { setActiveTab('OD'); setStatusFilter('PENDING'); }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
            activeTab === 'OD' && statusFilter === 'PENDING'
              ? 'bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-50 border-purple-500 shadow-md ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2.5 py-0.5 rounded-full">
              On-Duty (OD)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-800">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {pendingODCount} <span className="text-xs font-semibold text-slate-400">pending</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-purple-700 font-bold">
            <span>Attendance Grants</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Redesigned Search & Multi-Attribute Filter Strip */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        {/* Category Tabs & Status Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

          {/* Status Sub-Filters with Revision Requested Badge */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl shrink-0">
            {[
              { key: 'PENDING', label: `Pending (${totalPending})` },
              { key: 'REVISION_REQUESTED', label: `Needs Revision (${revisionCount})` },
              { key: 'APPROVED', label: `Approved (${approvedCount})` },
              { key: 'REJECTED', label: 'Rejected' },
              { key: 'ALL', label: 'All Records' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st.key
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Academic Year Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Search box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, register number, title, tech stack..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 shadow-2xs"
            />
          </div>

          {/* Year Filter Pills */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Year:</span>
            </span>
            {(['ALL', 'II', 'III', 'IV'] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setYearFilter(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  yearFilter === yr
                    ? 'bg-amber-400 text-emerald-950 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yr === 'ALL' ? 'All Years' : `Year ${yr}`}
              </button>
            ))}
          </div>

          {/* Bulk Selection Bar */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAllVisible}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200"
            >
              {selectedIds.length > 0 &&
              selectedIds.length ===
                filteredItems.filter(
                  (i) => i.data.status === 'SUBMITTED' || i.data.status === 'UNDER_REVIEW' || i.data.status === 'PENDING'
                ).length ? (
                <CheckSquare className="w-4 h-4 text-emerald-700" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select Pending ({filteredItems.filter((i) => i.data.status === 'SUBMITTED' || i.data.status === 'UNDER_REVIEW' || i.data.status === 'PENDING').length})</span>
            </button>

            {selectedIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkApprove}
                leftIcon={<BadgeCheck className="w-4 h-4" />}
                className="bg-emerald-700 hover:bg-emerald-800"
              >
                Approve ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Approvals Items List with Student Track Record Preview */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No approval inquiries match the selected criteria"
            description="Try changing the category tab, year filter, or resetting the search query."
            icon={<CheckCircle2 className="w-10 h-10 text-emerald-500" />}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isActivity = item.itemType === 'ACTIVITY';
            const id = item.data.id;
            const isSelected = selectedIds.includes(id);

            const title = isActivity ? item.data.title : item.data.eventName;
            const studentName = item.data.studentName;
            const studentRegNo = item.data.studentRegNo;
            const status = item.data.status;
            const typeLabel = isActivity ? item.data.type : 'ON-DUTY (OD)';
            const dateStr = isActivity
              ? `${item.data.startDate} to ${item.data.endDate}`
              : `${item.data.date} (${item.data.fromTime} - ${item.data.toTime})`;

            const isPending = status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'PENDING';
            const isRevision = status === 'REVISION_REQUESTED';

            // Get Student Track Record info
            const stats = getStudentStats(studentRegNo);

            return (
              <div
                key={id}
                className={`p-6 rounded-3xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5 ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 shadow-md ring-1 ring-emerald-400'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Selection Checkbox */}
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(id)}
                      className="mt-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                      aria-label="Select item"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-700" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>
                  )}

                  <div className="space-y-2 flex-1">
                    {/* ID & Type Header Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {id}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          typeLabel === 'PROJECT'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                            : typeLabel === 'HACKATHON'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : typeLabel === 'INTERNSHIP'
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                            : 'bg-purple-100 text-purple-900 border border-purple-200'
                        }`}
                      >
                        {typeLabel}
                      </span>

                      {/* Status badge */}
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          status === 'ACTIVE' || status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : status === 'REJECTED'
                            ? 'bg-red-100 text-red-900 border border-red-300'
                            : status === 'REVISION_REQUESTED'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        ● {status === 'REVISION_REQUESTED' ? 'Revision Requested' : status}
                      </span>

                      {/* Guide badge */}
                      {isActivity && item.data.guideName && (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                          Guide: <strong>{item.data.guideName}</strong>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      <Link
                        href={`/hod/approvals/${id}`}
                        className="hover:text-emerald-700 transition-colors"
                      >
                        {title}
                      </Link>
                    </h3>

                    {/* Student Identity Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                      <span className="font-bold text-slate-800">
                        {studentName} ({studentRegNo})
                      </span>
                      <span>•</span>
                      <span>Department: CSE • Year {item.data.year || 'II'}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-slate-500">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {dateStr}
                      </span>
                    </div>

                    {/* Student OD Attendance Track Record Pill */}
                    <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Student Track Record:
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-emerald-600" />
                        <span>{stats.approvedActivities} Approved Projects</span>
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 text-[11px] font-semibold flex items-center gap-1">
                        <FileCheck className="w-3 h-3 text-purple-600" />
                        <span>{stats.approvedODs} OD Clearances ({stats.attendanceRate} Attendance)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium">
                        Standing: <strong className="text-emerald-800">{stats.standing}</strong>
                      </span>
                    </div>

                    {/* Tech Stack Pills if activity */}
                    {isActivity && item.data.technologies && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.data.technologies.slice(0, 4).map((tech, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-mono font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Revision feedback snippet if revision requested */}
                    {status === 'REVISION_REQUESTED' && item.data.revisionNotes && (
                      <div className="text-xs text-blue-800 bg-blue-50 p-2.5 rounded-xl border border-blue-200 space-y-0.5">
                        <strong className="block text-[10px] uppercase font-bold text-blue-900">
                          HOD Clarification Directive:
                        </strong>
                        <p className="font-normal">{item.data.revisionNotes}</p>
                      </div>
                    )}

                    {/* Rejection snippet if rejected */}
                    {status === 'REJECTED' && item.data.rejectionReason && (
                      <div className="text-xs text-red-800 bg-red-50 p-2.5 rounded-xl border border-red-200 space-y-0.5">
                        <strong className="block text-[10px] uppercase font-bold text-red-900">
                          Rejection Reason:
                        </strong>
                        <p className="font-normal">{item.data.rejectionReason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Command Strip */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0 self-end lg:self-center">
                  {/* Full Review Screen Primary CTA */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/hod/approvals/${id}`)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    className="font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300"
                  >
                    Open Review Screen
                  </Button>

                  {/* Inline Quick Action Buttons for Pending Items */}
                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleQuickApprove(item)}
                        leftIcon={<CheckCircle2 className="w-4 h-4" />}
                        className="bg-emerald-700 hover:bg-emerald-800 font-bold"
                      >
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRevision(item)}
                        leftIcon={<RotateCcw className="w-3.5 h-3.5 text-blue-700" />}
                        className="border-blue-300 text-blue-900 hover:bg-blue-50 text-xs font-bold"
                      >
                        Clarify
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenReject(item)}
                        leftIcon={<XCircle className="w-4 h-4" />}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Clarification & Revision Request Modal */}
      <Dialog
        isOpen={!!revisingItem}
        onClose={() => setRevisingItem(null)}
        title="Request Proposal Revision / Clarification"
        variant="information"
        confirmLabel={isProcessingRevision ? 'Notifying Student...' : 'Send Revision Directive'}
        onConfirm={handleConfirmRevision}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
            <strong className="block text-xs font-bold text-blue-900">
              Clarification for: {revisingItem?.itemType === 'ACTIVITY' ? revisingItem.data.title : revisingItem?.data.eventName}
            </strong>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              This will set the status to <strong>REVISION REQUESTED</strong> without penalizing or rejecting the student. The applicant will receive an urgent notification to amend details and resubmit.
            </p>
          </div>

          <Textarea
            label="Revision Guidance & Instructions for Student"
            placeholder="e.g. Please update the architecture diagram, confirm faculty mentor endorsement, and verify lab workstation requirements..."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={4}
            isRequired
          />
        </div>
      </Dialog>

      {/* Mandatory Rejection Reason Modal */}
      <Dialog
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Department Rejection &amp; Audit Notice"
        variant="danger"
        confirmLabel={isProcessingReject ? 'Recording...' : 'Confirm Rejection'}
        onConfirm={handleConfirmRejection}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-1">
            <strong className="block text-xs font-bold">
              Rejecting: {rejectingItem?.itemType === 'ACTIVITY' ? rejectingItem.data.title : rejectingItem?.data.eventName}
            </strong>
            <p className="text-[11px] text-red-700 leading-relaxed">
              State the exact deficiencies or reasons. The rejection reason is recorded in the permanent audit logs.
            </p>
          </div>

          <Textarea
            label="Mandatory Rejection Reason"
            placeholder="e.g. Project scope duplicates prior batch work and does not meet minimum technical depth..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

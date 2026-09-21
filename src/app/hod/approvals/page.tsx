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
  Search,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';

type UnifiedApprovalItem =
  | { itemType: 'ACTIVITY'; data: any }
  | { itemType: 'OD'; data: any };

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

  // Rejection Modal
  const [rejectingItem, setRejectingItem] = useState<UnifiedApprovalItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingReject, setIsProcessingReject] = useState(false);

  // Clarification Modal
  const [revisingItem, setRevisingItem] = useState<UnifiedApprovalItem | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isProcessingRevision, setIsProcessingRevision] = useState(false);

  // Counts
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

  // Unified items
  const allItems: UnifiedApprovalItem[] = [
    ...activities.map((a) => ({ itemType: 'ACTIVITY' as const, data: a })),
    ...odApplications.map((o) => ({ itemType: 'OD' as const, data: o })),
  ];

  // Filtering
  const filteredItems = allItems.filter((item) => {
    if (activeTab === 'PROJECTS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'PROJECT')) return false;
    if (activeTab === 'HACKATHONS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'HACKATHON')) return false;
    if (activeTab === 'INTERNSHIPS' && (item.itemType !== 'ACTIVITY' || item.data.type !== 'INTERNSHIP')) return false;
    if (activeTab === 'OD' && item.itemType !== 'OD') return false;

    if (yearFilter !== 'ALL') {
      const yr = item.data.year || 'II';
      if (yr !== yearFilter) return false;
    }

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

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (item.itemType === 'ACTIVITY') {
        const a = item.data;
        return (
          a.title.toLowerCase().includes(q) ||
          a.studentName.toLowerCase().includes(q) ||
          a.studentRegNo.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
        );
      } else {
        const o = item.data;
        return (
          o.eventName.toLowerCase().includes(q) ||
          o.studentName.toLowerCase().includes(q) ||
          o.studentRegNo.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
        );
      }
    }

    return true;
  });

  // Bulk Select & Approve
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

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    const actIds: string[] = [];
    const odIds: string[] = [];

    selectedIds.forEach((id) => {
      if (id.startsWith('OD-')) odIds.push(id);
      else actIds.push(id);
    });

    if (actIds.length > 0) bulkApproveActivities(actIds);
    if (odIds.length > 0) bulkApproveOD(odIds);

    showToast(`Approved ${selectedIds.length} items`, 'Clearances updated.', 'success');
    setSelectedIds([]);
  };

  const handleQuickApprove = (item: UnifiedApprovalItem) => {
    if (item.itemType === 'ACTIVITY') {
      approveActivity(item.data.id, 'Approved by HOD.');
      showToast(`Approved ${item.data.title}`, 'Status updated to ACTIVE.', 'success');
    } else {
      approveOD(item.data.id, 'Approved by HOD.');
      showToast(`Approved OD for ${item.data.studentName}`, 'Attendance granted.', 'success');
    }
  };

  const handleOpenRevision = (item: UnifiedApprovalItem) => {
    setRevisingItem(item);
    setRevisionNotes(
      item.itemType === 'ACTIVITY'
        ? 'Please clarify system requirements and update project methodology.'
        : 'Please attach official event invitation.'
    );
  };

  const handleConfirmRevision = () => {
    if (!revisingItem) return;
    if (!revisionNotes.trim()) {
      showToast('Please specify revision instructions.', 'warning');
      return;
    }

    setIsProcessingRevision(true);
    setTimeout(() => {
      if (revisingItem.itemType === 'ACTIVITY') {
        requestRevisionActivity(revisingItem.data.id, revisionNotes);
      } else {
        requestRevisionOD(revisingItem.data.id, revisionNotes);
      }
      showToast(`Revision Requested for ${revisingItem.data.id}`, 'Student notified.', 'info');
      setIsProcessingRevision(false);
      setRevisingItem(null);
    }, 400);
  };

  const handleOpenReject = (item: UnifiedApprovalItem) => {
    setRejectingItem(item);
    setRejectionReason('Project scope duplicates prior work or lacks technical depth.');
  };

  const handleConfirmRejection = () => {
    if (!rejectingItem) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason is required.', 'warning');
      return;
    }

    setIsProcessingReject(true);
    setTimeout(() => {
      if (rejectingItem.itemType === 'ACTIVITY') {
        rejectActivity(rejectingItem.data.id, rejectionReason);
      } else {
        rejectOD(rejectingItem.data.id, rejectionReason);
      }
      showToast(`Rejected ${rejectingItem.data.id}`, 'Decision recorded.', 'info');
      setIsProcessingReject(false);
      setRejectingItem(null);
    }, 400);
  };

  const tabItems = [
    { id: 'ALL', label: `All (${allItems.length})` },
    { id: 'PROJECTS', label: `Projects (${activities.filter((a) => a.type === 'PROJECT').length})` },
    { id: 'HACKATHONS', label: `Hackathons (${activities.filter((a) => a.type === 'HACKATHON').length})` },
    { id: 'INTERNSHIPS', label: `Internships (${activities.filter((a) => a.type === 'INTERNSHIP').length})` },
    { id: 'OD', label: `OD Requests (${odApplications.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="HOD Approvals Inbox"
        description="Review student submissions, issue clearances, or request revisions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Approvals', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{totalPending} Pending Approvals</span>
          </span>
        }
      />

      {/* 2. Category Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => { setActiveTab('PROJECTS'); setStatusFilter('PENDING'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
            activeTab === 'PROJECTS' && statusFilter === 'PENDING'
              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Projects</span>
            <FolderKanban className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingProjectsCount} <span className="text-xs text-slate-400 font-normal">pending</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('HACKATHONS'); setStatusFilter('PENDING'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
            activeTab === 'HACKATHONS' && statusFilter === 'PENDING'
              ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Hackathons</span>
            <Trophy className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingHackathonsCount} <span className="text-xs text-slate-400 font-normal">pending</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('INTERNSHIPS'); setStatusFilter('PENDING'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
            activeTab === 'INTERNSHIPS' && statusFilter === 'PENDING'
              ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Internships</span>
            <BriefcaseBusiness className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingInternshipsCount} <span className="text-xs text-slate-400 font-normal">pending</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('OD'); setStatusFilter('PENDING'); }}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer group ${
            activeTab === 'OD' && statusFilter === 'PENDING'
              ? 'bg-purple-50 border-purple-500 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-purple-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">OD Requests</span>
            <FileCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {pendingODCount} <span className="text-xs text-slate-400 font-normal">pending</span>
          </div>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
            {[
              { key: 'PENDING', label: `Pending (${totalPending})` },
              { key: 'REVISION_REQUESTED', label: `Clarify (${revisionCount})` },
              { key: 'APPROVED', label: `Approved (${approvedCount})` },
              { key: 'REJECTED', label: 'Rejected' },
              { key: 'ALL', label: 'All' },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setStatusFilter(st.key as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  statusFilter === st.key
                    ? 'bg-[#064e3b] text-white font-bold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, reg no, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Year:</span>
            {(['ALL', 'II', 'III', 'IV'] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setYearFilter(yr)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  yearFilter === yr
                    ? 'bg-amber-400 text-emerald-950 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yr === 'ALL' ? 'All' : yr}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllVisible}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 cursor-pointer"
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
              <span>Select Pending</span>
            </button>

            {selectedIds.length > 0 && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleBulkApprove}
                leftIcon={<BadgeCheck className="w-4 h-4" />}
                className="bg-emerald-700 hover:bg-emerald-800 text-xs"
              >
                Approve ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Inquiry Cards List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No items match your filter"
            description="Try adjusting your tab, status filter, or search query."
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          />
        </div>
      ) : (
        <div className="space-y-3">
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
            const stats = getStudentStats(studentRegNo);

            return (
              <div
                key={id}
                className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3 flex-1">
                  {isPending && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(id)}
                      className="mt-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </button>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {typeLabel}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-900">
                        {status}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      <Link href={`/hod/approvals/${id}`} className="hover:text-emerald-700">
                        {title}
                      </Link>
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <strong className="text-slate-800">{studentName} ({studentRegNo})</strong>
                      <span>•</span>
                      <span>Year {item.data.year || 'II'}</span>
                      <span>•</span>
                      <span>{dateStr}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                      <span>Approved: <strong>{stats.approvedActivities} projects</strong></span>
                      <span>•</span>
                      <span>ODs: <strong>{stats.approvedODs}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push(`/hod/approvals/${id}`)}
                    className="text-xs font-semibold"
                  >
                    Review
                  </Button>

                  {isPending && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleQuickApprove(item)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
                      >
                        Approve
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRevision(item)}
                        className="border-blue-300 text-blue-900 hover:bg-blue-50 text-xs font-bold"
                      >
                        Clarify
                      </Button>

                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleOpenReject(item)}
                        className="text-xs font-bold"
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

      {/* Clarification Modal */}
      <Dialog
        isOpen={!!revisingItem}
        onClose={() => setRevisingItem(null)}
        title="Request Proposal Clarification"
        variant="information"
        confirmLabel={isProcessingRevision ? 'Sending...' : 'Send Guidance'}
        onConfirm={handleConfirmRevision}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Specify the changes required. The student will be asked to update their submission.
          </p>
          <Textarea
            label="Revision Notes"
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            rows={3}
            isRequired
          />
        </div>
      </Dialog>

      {/* Rejection Modal */}
      <Dialog
        isOpen={!!rejectingItem}
        onClose={() => setRejectingItem(null)}
        title="Rejection Reason"
        variant="danger"
        confirmLabel={isProcessingReject ? 'Recording...' : 'Confirm Rejection'}
        onConfirm={handleConfirmRejection}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Enter the reason for rejecting this submission.
          </p>
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

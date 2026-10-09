'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import { formatApiErrorMessage } from '@/lib/api';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Users,
  QrCode,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { ReviewSession, ReviewType } from '@/types';

function getReviewTypeLabel(type?: ReviewType | string): string {
  switch (type) {
    case 'HACKATHON_POST':
      return 'Post-Hackathon Review';
    case 'INTERNSHIP_MID':
      return 'Internship Mid Review';
    case 'INTERNSHIP_FINAL':
      return 'Internship Final Review';
    case 'PROJECT_WEEKLY':
    default:
      return 'Weekly Project Review';
  }
}

export default function StudentReviewsPage() {
  const { reviews, submitWeeklyProgress, checkInReviewQR } = useData();
  const { user } = useSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');

  // Submit progress state
  const [selectedReview, setSelectedReview] = useState<ReviewSession | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState('');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState('');
  const [nextWeekGoal, setNextWeekGoal] = useState('');
  const [blockers, setBlockers] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // View progress state
  const [viewingProgress, setViewingProgress] = useState<ReviewSession | null>(null);

  // QR Check-in state
  const [checkInReview, setCheckInReview] = useState<ReviewSession | null>(null);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return r.status === 'CANCELLED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

  const handleOpenSubmit = (rev: ReviewSession) => {
    setSelectedReview(rev);
    setSubmitError(null);
    if (rev.progress) {
      setCompletedThisWeek(rev.progress.completedThisWeek);
      setCurrentlyWorkingOn(rev.progress.currentlyWorkingOn);
      setNextWeekGoal(rev.progress.nextWeekGoal);
      setBlockers(rev.progress.blockers);
      setGithubUrl(rev.progress.githubUrl || '');
    } else {
      setCompletedThisWeek('');
      setCurrentlyWorkingOn('');
      setNextWeekGoal('');
      setBlockers('');
      setGithubUrl('');
    }
  };

  const handleConfirmSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedReview) return;
    setSubmitError(null);

    if (!completedThisWeek.trim() || !currentlyWorkingOn.trim() || !nextWeekGoal.trim()) {
      setSubmitError('Please complete all 3 required progress quadrants (minimum 5 characters each).');
      showToast('Validation Error', 'Please complete all required fields.', 'warning');
      return;
    }

    if (githubUrl.trim() && !githubUrl.trim().startsWith('http://') && !githubUrl.trim().startsWith('https://')) {
      setSubmitError('GitHub URL must be a valid HTTP or HTTPS address.');
      showToast('Validation Error', 'Invalid GitHub URL format.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitWeeklyProgress(selectedReview.id, {
        studentId: user?.id || 'usr-student-001',
        studentName: user?.name || 'Meena C',
        completedThisWeek: completedThisWeek.trim(),
        currentlyWorkingOn: currentlyWorkingOn.trim(),
        nextWeekGoal: nextWeekGoal.trim(),
        blockers: blockers.trim() || 'None',
        githubUrl: githubUrl.trim() || undefined,
      });

      setIsSubmitting(false);
      setSelectedReview(null);
      showToast('Weekly Progress Logged!', 'Meeting progress updated in state/API layer.', 'success');
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = formatApiErrorMessage(err);
      setSubmitError(msg);
      showToast('Submission Failed', msg, 'error');
    }
  };

  const handleOpenCheckIn = (rev: ReviewSession) => {
    setCheckInReview(rev);
    setQrTokenInput(rev.qrCodeToken || '');
    setCheckInError(null);
  };

  const handleConfirmCheckIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!checkInReview) return;
    setCheckInError(null);

    if (!qrTokenInput.trim()) {
      setCheckInError('Please provide a valid session QR token.');
      return;
    }

    setIsCheckingIn(true);
    try {
      await checkInReviewQR(
        checkInReview.id,
        qrTokenInput.trim(),
        user?.id || 'usr-student-001',
        user?.registerNumber || '714023104088'
      );
      setIsCheckingIn(false);
      setCheckInReview(null);
      showToast('Check-in Verified!', 'Attendance recorded for this review session.', 'success');
    } catch (err: unknown) {
      setIsCheckingIn(false);
      const msg = formatApiErrorMessage(err);
      setCheckInError(msg);
      showToast('Check-in Rejected', msg, 'error');
    }
  };

  const tabItems = [
    { id: 'ALL', label: `All (${reviews.length})` },
    { id: 'SCHEDULED', label: `Upcoming (${reviews.filter((r) => r.status === 'SCHEDULED').length})` },
    { id: 'WITH_PROGRESS', label: `Progress Logged (${reviews.filter((r) => !!r.progress).length})` },
    { id: 'COMPLETED', label: `Completed (${reviews.filter((r) => r.status === 'COMPLETED').length})` },
    { id: 'CANCELLED', label: `Cancelled (${reviews.filter((r) => r.status === 'CANCELLED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Reviews & Progress Logs"
        description="Submit milestone progress logs, view scheduled sessions, and check in via attendance QR."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Reviews', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Non-Evaluative Progress Tracking</span>
          </span>
        }
      />

      {/* 2. Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* 3. Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No review sessions in this category"
            description="Scheduled review sessions will appear here once generated by HOD."
            icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const hasProgress = !!rev.progress;
            const myAttendance = rev.attendance.find(
              (a) =>
                a.studentId === user?.id ||
                a.regNo === user?.registerNumber ||
                a.name.toLowerCase().includes('meena')
            );
            const isCompleted = rev.status === 'COMPLETED';
            const isCancelled = rev.status === 'CANCELLED';

            return (
              <div
                key={rev.id}
                className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-purple-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{rev.id}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {getReviewTypeLabel(rev.reviewType)} #{rev.reviewNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasProgress && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          ✓ Logged
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {rev.activityTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.studentTeam.map((m) => m.name.split(' ')[0]).join(', ')}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.venue}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">My Attendance:</span>
                    {myAttendance?.attended ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Present {myAttendance.checkInTime ? `(${myAttendance.checkInTime})` : ''}
                      </span>
                    ) : isCompleted ? (
                      <span className="text-slate-500 font-medium">Session Concluded</span>
                    ) : isCancelled ? (
                      <span className="text-slate-400 font-medium">Session Cancelled</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-amber-700 font-medium">Pending Check-in</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenCheckIn(rev)}
                          leftIcon={<QrCode className="w-3 h-3 text-purple-600" />}
                          className="text-[11px] h-6 px-2 text-purple-700 border-purple-300 hover:bg-purple-50"
                        >
                          Check In
                        </Button>
                      </div>
                    )}
                  </div>

                  {rev.meetingNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                      <strong className="text-[10px] font-bold uppercase text-emerald-800 block">
                        HOD Notes:
                      </strong>
                      <p className="italic text-xs">&ldquo;{rev.meetingNotes}&rdquo;</p>
                      {rev.nextWeekGoal && (
                        <p className="text-[11px] text-emerald-900 mt-1">
                          <span className="font-semibold">Goal:</span> {rev.nextWeekGoal}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  {hasProgress ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingProgress(rev)}
                      className="text-xs font-semibold"
                    >
                      View Submission
                    </Button>
                  ) : (
                    <span className="text-xs text-amber-700 font-medium">
                      {isCancelled ? 'No progress required' : 'Submit progress log'}
                    </span>
                  )}

                  {!isCancelled && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenSubmit(rev)}
                      className="bg-purple-700 hover:bg-purple-800 text-xs font-bold"
                    >
                      {hasProgress ? 'Update Progress' : 'Submit Progress'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progress Submission Modal */}
      <Dialog
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={`Log Progress: ${getReviewTypeLabel(selectedReview?.reviewType)} #${selectedReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isSubmitting ? 'Submitting...' : 'Submit Progress'}
        onConfirm={() => handleConfirmSubmit()}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          {submitError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <Textarea
            label="1. Completed This Week (completed_this_week)"
            placeholder="e.g. Completed baseline model training and dataset ingestion..."
            value={completedThisWeek}
            onChange={(e) => setCompletedThisWeek(e.target.value)}
            rows={2}
            isRequired
            disabled={isSubmitting}
          />

          <Textarea
            label="2. Currently Working On (currently_working_on)"
            placeholder="e.g. Integrating API endpoints and optimizing inference..."
            value={currentlyWorkingOn}
            onChange={(e) => setCurrentlyWorkingOn(e.target.value)}
            rows={2}
            isRequired
            disabled={isSubmitting}
          />

          <Textarea
            label="3. Next Week Goal (next_week_goal)"
            placeholder="e.g. Optimize inference speed and run field test in lab..."
            value={nextWeekGoal}
            onChange={(e) => setNextWeekGoal(e.target.value)}
            rows={2}
            isRequired
            disabled={isSubmitting}
          />

          <Textarea
            label="4. Blockers & Problems (blockers)"
            placeholder="e.g. Hardware GPU access, hardware latency (or 'None')..."
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            disabled={isSubmitting}
          />

          <Input
            label="GitHub / Demo URL (github_url - Optional)"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </Dialog>

      {/* View Progress Modal */}
      <Dialog
        isOpen={!!viewingProgress}
        onClose={() => setViewingProgress(null)}
        title={`${getReviewTypeLabel(viewingProgress?.reviewType)} #${viewingProgress?.reviewNumber} Progress Record`}
        variant="information"
        confirmLabel="Close"
        onConfirm={() => setViewingProgress(null)}
      >
        {viewingProgress?.progress && (
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Completed This Week</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.completedThisWeek}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Currently Working On</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.currentlyWorkingOn}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase text-purple-800 block">Next Week Goal</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.nextWeekGoal}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Blockers</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.blockers}</p>
            </div>

            {viewingProgress.progress.githubUrl && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-slate-500">Repository Link</span>
                <a
                  href={viewingProgress.progress.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>{viewingProgress.progress.githubUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* QR Check-in Modal */}
      <Dialog
        isOpen={!!checkInReview}
        onClose={() => setCheckInReview(null)}
        title={`QR Attendance Check-in: Session #${checkInReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isCheckingIn ? 'Verifying...' : 'Verify & Check In'}
        onConfirm={() => handleConfirmCheckIn()}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Enter the active session QR token displayed by HOD to register your attendance.
          </p>

          {checkInError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          <Input
            label="QR Token"
            placeholder="QR-REV-..."
            value={qrTokenInput}
            onChange={(e) => setQrTokenInput(e.target.value)}
            isRequired
            disabled={isCheckingIn}
          />

          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <div>
              <span className="font-semibold text-slate-700">Student: </span>
              {user?.name || 'Meena C'} ({user?.registerNumber || '714023104088'})
            </div>
            <div>
              <span className="font-semibold text-slate-700">Session ID: </span>
              {checkInReview?.id}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

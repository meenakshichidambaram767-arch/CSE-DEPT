'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useSession } from '@/context/SessionContext';
import { reviewsApi } from '@/lib/api/reviewsApi';
import { ApiError } from '@/lib/api/odApi';
import { ReviewSession } from '@/types';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Users,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Loader2,
  QrCode,
  Send,
  ExternalLink,
} from 'lucide-react';
import { GithubIcon } from '@/components/common/GithubIcon';

export default function StudentReviewsPage() {
  const { user } = useSession();
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ReviewSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');

  // Submit progress state
  const [selectedReview, setSelectedReview] = useState<ReviewSession | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState('');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState('');
  const [nextWeekGoal, setNextWeekGoal] = useState('');
  const [blockers, setBlockers] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);
  const [progressSubmitError, setProgressSubmitError] = useState<string | null>(null);

  // View progress state
  const [viewingProgressReview, setViewingProgressReview] = useState<ReviewSession | null>(null);

  // QR Check-in State
  const [checkInReview, setCheckInReview] = useState<ReviewSession | null>(null);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const fetchReviews = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMsg(null);
    setBackendNotice(null);

    try {
      const res = await reviewsApi.getReviewSessions();
      if (res.data) {
        setReviews(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        setBackendNotice(
          'Backend endpoint GET /api/v1/reviews/sessions returned HTTP 404 (Endpoint not deployed). Displaying static reference review sessions (LOCAL / UNPERSISTED PROTOTYPE DATA).'
        );
        setReviews(reviewsApi.getFallbackReviewSessions());
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to load review sessions from server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    reviewsApi
      .getReviewSessions()
      .then((res) => {
        if (isMounted && res.data) setReviews(res.data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
            setBackendNotice(
              'Backend endpoint GET /api/v1/reviews/sessions returned HTTP 404 (Endpoint not deployed). Displaying static reference review sessions (LOCAL / UNPERSISTED PROTOTYPE DATA).'
            );
            setReviews(reviewsApi.getFallbackReviewSessions());
          } else {
            setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load review sessions from server.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

  const handleOpenSubmitProgress = (rev: ReviewSession) => {
    setSelectedReview(rev);
    setProgressSubmitError(null);
    if (rev.progress) {
      setCompletedThisWeek(rev.progress.completedThisWeek || '');
      setCurrentlyWorkingOn(rev.progress.currentlyWorkingOn || '');
      setNextWeekGoal(rev.progress.nextWeekGoal || '');
      setBlockers(rev.progress.blockers || '');
      setGithubUrl(rev.progress.githubUrl || '');
    } else {
      setCompletedThisWeek('');
      setCurrentlyWorkingOn('');
      setNextWeekGoal('');
      setBlockers('');
      setGithubUrl('');
    }
  };

  const handleConfirmSubmitProgress = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedReview) return;
    setProgressSubmitError(null);

    if (!completedThisWeek.trim() || !currentlyWorkingOn.trim() || !nextWeekGoal.trim()) {
      showToast('Please answer completed work, current work, and next week goals.', 'warning');
      return;
    }

    setIsSubmittingProgress(true);

    const payload = {
      completed_this_week: completedThisWeek.trim(),
      currently_working_on: currentlyWorkingOn.trim(),
      next_week_goal: nextWeekGoal.trim(),
      blockers: blockers.trim() || 'No active blockers reported',
      github_url: githubUrl.trim() || undefined,
    };

    try {
      await reviewsApi.submitWeeklyProgress(selectedReview.id, payload);
      showToast('Weekly Progress Logged!', `Progress saved to server for Review #${selectedReview.reviewNumber}`, 'success');
      setSelectedReview(null);
      fetchReviews();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE') {
          setProgressSubmitError(
            `Backend endpoint POST /api/v1/reviews/sessions/${selectedReview.id}/progress returned 404. Weekly progress log was NOT saved to server database.`
          );
          showToast(
            'Backend Unavailable',
            'Progress endpoint returned 404. Log was NOT saved to server.',
            'warning'
          );
        } else {
          setProgressSubmitError(err.message);
        }
      } else {
        setProgressSubmitError('Failed to submit weekly progress log. Please check connection.');
      }
    } finally {
      setIsSubmittingProgress(false);
    }
  };

  const handleOpenCheckIn = (rev: ReviewSession) => {
    setCheckInReview(rev);
    setQrTokenInput('');
    setCheckInError(null);
  };

  const handleConfirmQrCheckIn = async () => {
    if (!checkInReview || !qrTokenInput.trim()) {
      showToast('Please enter or scan a valid dynamic QR token.', 'warning');
      return;
    }

    setCheckInError(null);
    setIsCheckingIn(true);

    try {
      const result = await reviewsApi.checkInWithQR(checkInReview.id, qrTokenInput.trim());
      showToast('Attendance Verified!', result.data?.message || 'Check-in recorded for review session.', 'success');
      setCheckInReview(null);
      setQrTokenInput('');
      fetchReviews();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE') {
          setCheckInError(
            `Backend endpoint POST /api/v1/reviews/sessions/${checkInReview.id}/check-in returned HTTP 404. Attendance check-in was NOT recorded on server.`
          );
          showToast('Check-in Failed', 'Backend endpoint unavailable (HTTP 404). Attendance was NOT recorded.', 'warning');
        } else {
          setCheckInError(err.message);
        }
      } else {
        setCheckInError('Failed to verify QR token check-in. Please try again.');
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  const tabItems = [
    { id: 'ALL', label: `All Sessions (${reviews.length})` },
    { id: 'SCHEDULED', label: `Upcoming (${reviews.filter((r) => r.status === 'SCHEDULED').length})` },
    { id: 'WITH_PROGRESS', label: `Progress Logged (${reviews.filter((r) => !!r.progress).length})` },
    { id: 'COMPLETED', label: `Completed (${reviews.filter((r) => r.status === 'COMPLETED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* Page Header */}
      <PageHeader
        title="Weekly Reviews & Progress"
        description="Track review meeting schedules, log weekly milestones, and check in via dynamic HOD QR code."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Weekly Reviews', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Progress Tracking (Non-Evaluative • No Grading)</span>
          </span>
        }
        primaryAction={
          <button
            type="button"
            onClick={() => fetchReviews(true)}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            title="Refresh review sessions"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-700 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        }
      />

      {/* Backend Notice Banner */}
      {backendNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{backendNotice}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
            Nattu Client Mode
          </span>
        </div>
      )}

      {/* General Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchReviews()}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* Reviews Grid */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <Loader2 className="w-6 h-6 text-purple-700 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Loading review sessions from server...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No review sessions found"
            description="Scheduled weekly review sessions will appear here once generated by HOD."
            icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => {
            const hasProgress = !!rev.progress;
            const myAttendance = (rev.attendance || []).find(
              (a: { studentId?: string; student_id?: string }) => a.studentId === user?.id || a.student_id === user?.id
            );

            return (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-purple-300 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Status Strip */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{rev.code || rev.id}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Review #{rev.reviewNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasProgress && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          ✓ Progress Filed
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          rev.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {rev.status}
                      </span>
                    </div>
                  </div>

                  {/* Title & Activity */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {rev.activityTitle || `Capstone Review #${rev.reviewNumber}`}
                    </h3>
                    {rev.studentTeam && rev.studentTeam.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Team: {rev.studentTeam.map((m) => m.name.split(' ')[0]).join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Date, Time, Venue Box */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-purple-600" />
                      <span>{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-600" />
                      <span>{rev.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>{rev.venue}</span>
                    </div>
                  </div>

                  {/* Attendance Box */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Lab Attendance:</span>
                    {myAttendance?.attended ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Verified Present ({myAttendance.checkInTime || 'Checked-in'})
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-amber-600" />
                        Pending QR Check-in
                      </span>
                    )}
                  </div>

                  {/* Meeting Discussion Notes (No Marks) */}
                  {rev.meetingNotes && (
                    <div className="p-3 rounded-2xl bg-purple-50/60 border border-purple-200 text-xs text-purple-950 space-y-0.5">
                      <strong className="text-[10px] font-bold uppercase text-purple-800 block">
                        HOD Guidance Notes:
                      </strong>
                      <p className="italic text-xs">&ldquo;{rev.meetingNotes}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {hasProgress ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewingProgressReview(rev)}
                      className="text-xs font-semibold"
                    >
                      View Submitted Progress
                    </Button>
                  ) : (
                    <span className="text-[11px] text-amber-700 font-medium">
                      Submit 4-quadrant progress report
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenCheckIn(rev)}
                      leftIcon={<QrCode className="w-3.5 h-3.5 text-purple-700" />}
                      className="text-xs font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      QR Check-in
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenSubmitProgress(rev)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                      className="bg-purple-700 hover:bg-purple-800 text-xs font-bold"
                    >
                      {hasProgress ? 'Update Log' : 'Submit Progress'}
                    </Button>
                  </div>
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
        title={`Weekly Progress Log: Review #${selectedReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isSubmittingProgress ? 'Submitting...' : 'Submit Progress Log'}
        onConfirm={() => handleConfirmSubmitProgress()}
        cancelLabel="Cancel"
      >
        <form onSubmit={handleConfirmSubmitProgress} className="space-y-4 text-xs">
          {progressSubmitError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{progressSubmitError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
            <strong className="text-purple-900 block text-xs">
              {selectedReview?.activityTitle || 'Capstone Project'}
            </strong>
            <span className="text-[11px] text-purple-700 font-medium">
              Meeting Schedule: {selectedReview?.date} at {selectedReview?.time} ({selectedReview?.venue})
            </span>
          </div>

          <Textarea
            label="1. Completed work this week (completed_this_week)"
            placeholder="Describe completed modules, algorithms implemented, dataset benchmarks..."
            value={completedThisWeek}
            onChange={(e) => setCompletedThisWeek(e.target.value)}
            rows={3}
            isRequired
          />

          <Textarea
            label="2. Currently working on (currently_working_on)"
            placeholder="Describe active tasks, pipeline integrations, or ongoing testing..."
            value={currentlyWorkingOn}
            onChange={(e) => setCurrentlyWorkingOn(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="3. Next week goal (next_week_goal)"
            placeholder="State target deliverables for the upcoming review session..."
            value={nextWeekGoal}
            onChange={(e) => setNextWeekGoal(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="4. Blockers / Problems (blockers)"
            placeholder="List any hardware bottlenecks, access issues, or technical blockers..."
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            isRequired
          />

          <Input
            label="GitHub Repository Link (github_url)"
            placeholder="https://github.com/student/project-repo"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </form>
      </Dialog>

      {/* View Submitted Progress Modal */}
      <Dialog
        isOpen={!!viewingProgressReview}
        onClose={() => setViewingProgressReview(null)}
        title={`Submitted Progress Summary: Review #${viewingProgressReview?.reviewNumber}`}
        variant="information"
        confirmLabel="Close"
        onConfirm={() => setViewingProgressReview(null)}
      >
        {viewingProgressReview?.progress && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                1. Completed Work This Week
              </span>
              <p className="text-xs text-slate-900 whitespace-pre-line font-medium">
                {viewingProgressReview.progress.completedThisWeek}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                2. Currently Working On
              </span>
              <p className="text-xs text-slate-900 whitespace-pre-line font-medium">
                {viewingProgressReview.progress.currentlyWorkingOn}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">
                3. Next Week&apos;s Goal
              </span>
              <p className="text-xs text-slate-900 whitespace-pre-line font-medium">
                {viewingProgressReview.progress.nextWeekGoal}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                4. Blockers &amp; Problems
              </span>
              <p className="text-xs text-slate-900 whitespace-pre-line font-medium">
                {viewingProgressReview.progress.blockers}
              </p>
            </div>

            {viewingProgressReview.progress.githubUrl && (
              <div className="pt-2">
                <a
                  href={viewingProgressReview.progress.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:underline"
                >
                  <GithubIcon className="w-4 h-4" />
                  <span>View Submitted Code Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Dynamic QR Check-in Modal */}
      <Dialog
        isOpen={!!checkInReview}
        onClose={() => setCheckInReview(null)}
        title={`Dynamic QR Attendance Check-In: Review #${checkInReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isCheckingIn ? 'Verifying QR Token...' : 'Submit Check-In'}
        onConfirm={handleConfirmQrCheckIn}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          {checkInError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{checkInError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <strong className="text-slate-900 text-xs block">
              {checkInReview?.activityTitle || `Review Session ${checkInReview?.code}`}
            </strong>
            <span className="text-[11px] text-slate-500">
              Venue: {checkInReview?.venue} • Time: {checkInReview?.time}
            </span>
          </div>

          <p className="text-slate-600 leading-relaxed">
            Enter or scan the dynamic QR check-in token provided by the HOD during the laboratory session. Attendance verification relies on server validation.
          </p>

          <Input
            label="Dynamic QR Token (qr_token)"
            placeholder="e.g. QR-PRJ-2026-001-REV1-20261015"
            value={qrTokenInput}
            onChange={(e) => setQrTokenInput(e.target.value)}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

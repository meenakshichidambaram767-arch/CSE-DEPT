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
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { ReviewSession } from '@/types';

export default function StudentReviewsPage() {
  const { reviews, submitWeeklyProgress } = useData();
  const { user } = useSession();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [apiReviews, setApiReviews] = useState<any[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(true);

  // Submit progress state
  const [selectedReview, setSelectedReview] = useState<any | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState('');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState('');
  const [nextWeekGoal, setNextWeekGoal] = useState('');
  const [blockers, setBlockers] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // View progress state
  const [viewingProgress, setViewingProgress] = useState<any | null>(null);

  // QR Check-in State
  const [checkInReview, setCheckInReview] = useState<any | null>(null);
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const fetchStudentReviews = React.useCallback(async () => {
    try {
      const res = await fetch('/api/v1/reviews/sessions');
      if (res.ok) {
        const body = await res.json();
        if (body.data) {
          setApiReviews(body.data);
        }
      }
    } catch (err) {
      console.error('Error fetching student review sessions API:', err);
    } finally {
      setIsLoadingApi(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStudentReviews();
  }, [fetchStudentReviews]);

  const combinedReviews = React.useMemo(() => {
    if (apiReviews.length === 0) return reviews;
    const apiMapped = apiReviews.map((ar) => ({
      id: ar.id,
      code: ar.code,
      reviewNumber: ar.reviewNumber,
      reviewType: ar.reviewType,
      activityId: ar.activityId,
      activityTitle: ar.activityTitle,
      activityType: ar.activityType,
      date: ar.date,
      time: ar.time,
      venue: ar.venue,
      status: ar.status,
      meetingNotes: ar.meetingNotes,
      nextWeekGoal: ar.nextWeekGoal,
      studentTeam: [],
      attendance: ar.attendance || [],
      progress: ar.progressReports && ar.progressReports.length > 0 ? {
        completedThisWeek: ar.progressReports[0].completedWork,
        currentlyWorkingOn: ar.progressReports[0].currentWork,
        nextWeekGoal: ar.progressReports[0].nextSteps,
        blockers: ar.progressReports[0].blockers,
        githubUrl: ar.progressReports[0].githubUrl,
      } : undefined,
    }));
    const apiIds = new Set(apiMapped.map((r) => r.id));
    const localOnly = reviews.filter((r) => !apiIds.has(r.id));
    return [...apiMapped, ...localOnly];
  }, [apiReviews, reviews]);

  const filteredReviews = combinedReviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

  const handleOpenSubmit = (rev: any) => {
    setSelectedReview(rev);
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
    e?.preventDefault();
    if (!selectedReview) return;

    if (!completedThisWeek.trim() || !currentlyWorkingOn.trim() || !nextWeekGoal.trim()) {
      showToast('Please complete all 3 progress fields.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/v1/reviews/sessions/${selectedReview.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed_this_week: completedThisWeek,
          currently_working_on: currentlyWorkingOn,
          next_week_goal: nextWeekGoal,
          blockers: blockers.trim() || 'None',
          github_url: githubUrl.trim() || null,
        }),
      });

      if (res.ok) {
        fetchStudentReviews();
      }
      submitWeeklyProgress(selectedReview.id, {
        studentId: user?.id || 'usr-1',
        studentName: user?.name || 'Student',
        completedThisWeek,
        currentlyWorkingOn,
        nextWeekGoal,
        blockers: blockers.trim() || 'None',
        githubUrl: githubUrl.trim() || undefined,
      });
      showToast('Weekly Progress Logged!', 'Meeting progress updated.', 'success');
    } catch (err) {
      console.error('Error submitting progress API:', err);
    } finally {
      setIsSubmitting(false);
      setSelectedReview(null);
    }
  };

  const handleConfirmQrCheckIn = async () => {
    if (!checkInReview || !qrTokenInput.trim()) {
      showToast('Please enter or scan a valid QR token.', 'warning');
      return;
    }
    setIsCheckingIn(true);
    try {
      const res = await fetch(`/api/v1/reviews/sessions/${checkInReview.id}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_token: qrTokenInput.trim() }),
      });

      if (res.ok) {
        showToast('Check-in Verified!', 'Attendance recorded for review session.', 'success');
        fetchStudentReviews();
        setCheckInReview(null);
        setQrTokenInput('');
      } else {
        const err = await res.json();
        showToast('Check-in Failed', err.error?.message || 'Invalid or expired QR token.', 'error');
      }
    } catch (err) {
      console.error('Error during QR check-in:', err);
      showToast('Check-in Error', 'Failed to submit check-in.', 'error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  const tabItems = [
    { id: 'ALL', label: `All (${combinedReviews.length})` },
    { id: 'SCHEDULED', label: `Upcoming (${combinedReviews.filter((r) => r.status === 'SCHEDULED').length})` },
    { id: 'WITH_PROGRESS', label: `Progress Logged (${combinedReviews.filter((r) => !!r.progress).length})` },
    { id: 'COMPLETED', label: `Completed (${combinedReviews.filter((r) => r.status === 'COMPLETED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Weekly Reviews & Progress"
        description="Submit your weekly progress logs and check meeting schedules."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Weekly Reviews', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Progress Discussions (No Marks / Grading)</span>
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
              (a: any) => a.studentId === user?.id || a.student_id === user?.id
            );

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
                        Review #{rev.reviewNumber}
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
                          rev.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
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
                        Present
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium">Pending Check-in</span>
                    )}
                  </div>

                  {rev.meetingNotes && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-0.5">
                      <strong className="text-[10px] font-bold uppercase text-emerald-800 block">
                        HOD Notes:
                      </strong>
                      <p className="italic text-xs">&ldquo;{rev.meetingNotes}&rdquo;</p>
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
                      Submit progress log
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCheckInReview(rev)}
                      className="text-xs font-semibold border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      QR Check-in
                    </Button>

                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenSubmit(rev)}
                      className="bg-purple-700 hover:bg-purple-800 text-xs font-bold"
                    >
                      {hasProgress ? 'Update Progress' : 'Submit Progress'}
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
        title={`Log Weekly Progress: Review #${selectedReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isSubmitting ? 'Submitting...' : 'Submit Progress'}
        onConfirm={() => handleConfirmSubmit()}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <Textarea
            label="1. What did you complete this week?"
            placeholder="e.g. Completed baseline model training..."
            value={completedThisWeek}
            onChange={(e) => setCompletedThisWeek(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="2. What are you currently working on?"
            placeholder="e.g. Integrating API endpoints..."
            value={currentlyWorkingOn}
            onChange={(e) => setCurrentlyWorkingOn(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="3. Next week goal?"
            placeholder="e.g. Optimize inference speed..."
            value={nextWeekGoal}
            onChange={(e) => setNextWeekGoal(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="4. Any blockers / problems?"
            placeholder="e.g. Hardware GPU access..."
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
          />

          <Input
            label="GitHub / Demo Link (Optional)"
            placeholder="https://github.com/..."
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
      </Dialog>

      {/* View Progress Modal */}
      <Dialog
        isOpen={!!viewingProgress}
        onClose={() => setViewingProgress(null)}
        title={`Review #${viewingProgress?.reviewNumber} Progress Record`}
        variant="information"
        confirmLabel="Close"
        onConfirm={() => setViewingProgress(null)}
      >
        {viewingProgress?.progress && (
          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">Completed</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.completedThisWeek}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] font-bold uppercase text-blue-800 block">Working On</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.currentlyWorkingOn}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] font-bold uppercase text-purple-800 block">Next Goal</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.nextWeekGoal}</p>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] font-bold uppercase text-amber-800 block">Blockers</span>
              <p className="text-xs text-slate-900 font-medium">{viewingProgress.progress.blockers}</p>
            </div>
          </div>
        )}
      </Dialog>

      {/* QR Check-in Modal */}
      <Dialog
        isOpen={!!checkInReview}
        onClose={() => setCheckInReview(null)}
        title={`QR Attendance Check-in: ${checkInReview?.code || `Review #${checkInReview?.reviewNumber}`}`}
        variant="information"
        confirmLabel={isCheckingIn ? 'Verifying...' : 'Submit Check-in'}
        onConfirm={handleConfirmQrCheckIn}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            Enter or scan the 32-character dynamic QR token displayed by the HOD for laboratory attendance:
          </p>
          <Input
            label="Dynamic QR Token"
            placeholder="e.g. 7f8a9b0c1d2e3f4a..."
            value={qrTokenInput}
            onChange={(e) => setQrTokenInput(e.target.value)}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

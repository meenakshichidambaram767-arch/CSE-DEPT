'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import {
  FolderKanban,
  FileCheck,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
  Sparkles,
  Send,
  Plus,
  QrCode,
  ShieldCheck,
  History,
} from 'lucide-react';
import { GithubIcon } from '@/components/common/GithubIcon';
import { ReviewSession } from '@/types';

export default function StudentProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useSession();
  const { getActivityById, getReviewsForProject, submitWeeklyProgress } = useData();
  const { showToast } = useToast();

  const id = params.id as string;
  const activity = getActivityById(id);
  const reviews = getReviewsForProject(id);

  // Weekly Progress Submission Modal state
  const [selectedReview, setSelectedReview] = useState<ReviewSession | null>(null);
  const [completedThisWeek, setCompletedThisWeek] = useState('');
  const [currentlyWorkingOn, setCurrentlyWorkingOn] = useState('');
  const [nextWeekGoal, setNextWeekGoal] = useState('');
  const [blockers, setBlockers] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false);

  // View Submitted Progress Modal state
  const [viewingProgressReview, setViewingProgressReview] = useState<ReviewSession | null>(null);

  if (!activity) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Project Record Not Found</h2>
        <p className="text-xs text-slate-500">The requested activity identifier {id} does not exist.</p>
        <Button variant="primary" size="sm" onClick={() => router.push('/student/activities')}>
          Back to Activities
        </Button>
      </div>
    );
  }

  const upcomingReviews = reviews.filter((r) => r.status === 'SCHEDULED');
  const nextReview = upcomingReviews[0];

  const handleOpenSubmitProgress = (rev: ReviewSession) => {
    setSelectedReview(rev);
    // If progress already exists, prefill
    if (rev.progress) {
      setCompletedThisWeek(rev.progress.completedThisWeek);
      setCurrentlyWorkingOn(rev.progress.currentlyWorkingOn);
      setNextWeekGoal(rev.progress.nextWeekGoal);
      setBlockers(rev.progress.blockers);
      setGithubUrl(rev.progress.githubUrl || activity.githubUrl || '');
    } else {
      setCompletedThisWeek('');
      setCurrentlyWorkingOn('');
      setNextWeekGoal('');
      setBlockers('');
      setGithubUrl(activity.githubUrl || '');
    }
  };

  const handleConfirmProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    if (!completedThisWeek.trim() || !currentlyWorkingOn.trim() || !nextWeekGoal.trim()) {
      showToast('Please answer all core progress questions.', 'warning');
      return;
    }

    setIsSubmittingProgress(true);

    setTimeout(() => {
      submitWeeklyProgress(selectedReview.id, {
        studentId: user?.id || 'usr-student-001',
        studentName: user?.name || 'Meena C',
        completedThisWeek,
        currentlyWorkingOn,
        nextWeekGoal,
        blockers: blockers.trim() || 'No active blocking issues',
        githubUrl: githubUrl.trim() || undefined,
      });

      setIsSubmittingProgress(false);
      setSelectedReview(null);
      showToast(
        `Progress Logged for Review #${selectedReview.reviewNumber}!`,
        'HOD summary updated for meeting discussion.',
        'success'
      );
    }, 400);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumbs & Back */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/student/activities')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back to Activities
        </Button>

        <div className="flex items-center gap-2">
          <Link href={`/student/od-requests/new?activityId=${activity.id}`}>
            <Button variant="outline" size="sm" leftIcon={<FileCheck className="w-4 h-4 text-indigo-600" />}>
              Apply for OD
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Project Header Card (Section 20) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono font-bold text-slate-400">{activity.id}</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {activity.type}
              </span>
              <span
                className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                  activity.status === 'ACTIVE' || activity.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : activity.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {activity.status}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {activity.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              {activity.description}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center sm:text-right shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Department Clearance
            </span>
            <strong className="text-sm font-bold text-emerald-950 block">
              {activity.guideName || 'Dr. Priya Kumar (HOD)'}
            </strong>
            <span className="text-xs text-emerald-700 font-medium">SIET Autonomous CSE</span>
          </div>
        </div>

        {/* Team Members Roster (Section 20) */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Project Team Roster</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activity.teamMembers.map((m, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-slate-900">{m.name}</strong>
                  <span className="text-[10px] font-mono font-bold text-emerald-700">
                    {m.role || 'Member'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">{m.regNo}</div>
                <div className="text-[11px] text-slate-400 truncate">{m.email}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Technologies & Links */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium mr-1">Stack:</span>
            {activity.technologies.map((t, idx) => (
              <span
                key={idx}
                className="text-xs font-semibold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg"
              >
                {t}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {activity.githubUrl && (
              <a
                href={activity.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <GithubIcon className="w-3.5 h-3.5" />
                <span>GitHub Repo</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            {activity.proofDocName && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <FileCheck className="w-3.5 h-3.5" />
                <span>{activity.proofDocName}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Grid: Weekly Reviews & Progress + Automatic Project Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Weekly Reviews & Progress Submissions (Sections 10, 11, 12, 20) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Spotlight Next Upcoming Review */}
          {nextReview && (
            <div className="p-5 sm:p-6 rounded-3xl border-2 border-emerald-600/40 bg-emerald-50/30 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Next Upcoming Review
                  </h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white">
                  Review #{nextReview.reviewNumber}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-emerald-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">Date</span>
                  <strong className="text-slate-900">{nextReview.date}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">Time</span>
                  <strong className="text-slate-900">{nextReview.time}</strong>
                </div>
                <div className="p-3 rounded-xl bg-white border border-emerald-200/80">
                  <span className="text-[10px] text-slate-400 block font-semibold">Venue</span>
                  <strong className="text-slate-900">{nextReview.venue}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-emerald-800">
                  {nextReview.progress
                    ? '✓ Weekly progress has been submitted for this review.'
                    : '⚠ Please submit what you completed, current work, and blockers before the meeting.'}
                </p>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenSubmitProgress(nextReview)}
                >
                  {nextReview.progress ? 'Update Progress' : 'Submit Weekly Progress'}
                </Button>
              </div>
            </div>
          )}

          {/* Full Weekly Review Sessions List (Section 20) */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Weekly Review Sessions ({reviews.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Recurring Friday progress meetings (strictly non-evaluative / no grading).
                </p>
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Review schedule has not been generated by HOD yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Review #{rev.reviewNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rev.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rev.status}
                        </span>
                        {rev.progress && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Progress Filed
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {rev.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {rev.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {rev.venue}
                        </span>
                      </div>

                      {rev.meetingNotes && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 italic">
                          <strong>HOD Discussion Notes:</strong> &ldquo;{rev.meetingNotes}&rdquo;
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {rev.progress ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingProgressReview(rev)}
                        >
                          View Submission
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenSubmitProgress(rev)}
                        >
                          Submit Progress
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Automatic Project Timeline / History (Section 17) */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <History className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Project History Timeline
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Automatic record of project submissions, approvals, reviews, and milestones.
            </p>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {activity.timeline.map((step, idx) => (
                <div key={step.id || idx} className="relative space-y-1">
                  {/* Timeline Dot */}
                  <span
                    className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${
                      step.status === 'COMPLETED'
                        ? 'bg-emerald-600'
                        : step.status === 'CURRENT'
                        ? 'bg-amber-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-bold text-slate-900">{step.title}</strong>
                    <span className="text-[10px] font-mono text-slate-400">{step.date}</span>
                  </div>
                  {step.description && (
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Progress Submission Modal (Section 12) */}
      <Dialog
        isOpen={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        title={`Weekly Progress Submission: Review #${selectedReview?.reviewNumber}`}
        variant="information"
        confirmLabel={isSubmittingProgress ? 'Submitting...' : 'Submit Progress'}
        onConfirm={() => handleConfirmProgressSubmit({ preventDefault: () => {} } as any)}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
            <strong className="text-emerald-900 block text-xs">
              {selectedReview?.activityTitle}
            </strong>
            <span className="text-[11px] text-emerald-700">
              Scheduled: {selectedReview?.date} at {selectedReview?.time} ({selectedReview?.venue})
            </span>
          </div>

          <Textarea
            label="1. What did you complete this week?"
            placeholder="e.g. Dataset collection (12,000 images), baseline YOLO model training, initial inference testing..."
            value={completedThisWeek}
            onChange={(e) => setCompletedThisWeek(e.target.value)}
            rows={3}
            isRequired
          />

          <Textarea
            label="2. What are you currently working on?"
            placeholder="e.g. Multi-head gaze detection and head pose estimation pipeline..."
            value={currentlyWorkingOn}
            onChange={(e) => setCurrentlyWorkingOn(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="3. What will you complete next week?"
            placeholder="e.g. Integrate tracking across 4 classroom camera streams and optimize FPS..."
            value={nextWeekGoal}
            onChange={(e) => setNextWeekGoal(e.target.value)}
            rows={2}
            isRequired
          />

          <Textarea
            label="4. Any blockers / problems?"
            placeholder="e.g. False positive detections during occlusion when students lean forward..."
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            rows={2}
            helperText="State any technical hurdles or equipment needs"
          />

          <Input
            label="GitHub / Demo / Documentation Link (Optional)"
            placeholder="https://github.com/meena-c/ai-exam-monitor"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
          />
        </div>
      </Dialog>

      {/* View Submitted Progress Modal */}
      <Dialog
        isOpen={!!viewingProgressReview}
        onClose={() => setViewingProgressReview(null)}
        title={`Weekly Progress Summary: Review #${viewingProgressReview?.reviewNumber}`}
        variant="information"
        confirmLabel="Close"
        onConfirm={() => setViewingProgressReview(null)}
      >
        {viewingProgressReview?.progress && (
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Submitted By</span>
              <strong className="text-slate-900 text-xs">
                {viewingProgressReview.progress.studentName}
              </strong>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-800">
                  Completed This Week
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium">
                  {viewingProgressReview.progress.completedThisWeek}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-blue-800">
                  Currently Working On
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium">
                  {viewingProgressReview.progress.currentlyWorkingOn}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-800">
                  Next Week's Goal
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium">
                  {viewingProgressReview.progress.nextWeekGoal}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase text-amber-800">
                  Blockers &amp; Problems
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-line font-medium">
                  {viewingProgressReview.progress.blockers}
                </p>
              </div>

              {viewingProgressReview.progress.githubUrl && (
                <div className="pt-1">
                  <a
                    href={viewingProgressReview.progress.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                  >
                    <GithubIcon className="w-4 h-4" />
                    <span>View Submitted Repository Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

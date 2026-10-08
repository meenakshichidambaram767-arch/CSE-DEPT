'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { formatApiErrorMessage } from '@/lib/api';
import {
  ClipboardCheck,
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Sparkles,
  AlertTriangle,
  Send,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { ReviewSession, AttendanceItem, ReviewType } from '@/types';

function getReviewTypeLabel(type?: ReviewType): string {
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

export default function HodReviewsPage() {
  const {
    reviews,
    activities,
    scheduleRecurringReviews,
    recordReviewAttendance,
    saveMeetingNotes,
    finalizeReviewSession,
    generateReviewQR,
    broadcastReminder,
  } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');

  // Scheduler Modal state
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const eligibleActivities = activities.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'APPROVED' || a.status === 'SUBMITTED'
  );
  const [selectedActivityId, setSelectedActivityId] = useState(
    eligibleActivities[0]?.id || ''
  );
  const selectedActivity = activities.find((a) => a.id === selectedActivityId);

  const [reviewDay, setReviewDay] = useState('Friday');
  const [reviewTime, setReviewTime] = useState('2:00 PM');
  const [startDate, setStartDate] = useState('2026-09-25');
  const [venue, setVenue] = useState('CSE Lab 2');
  const [numberOfReviews, setNumberOfReviews] = useState('8');
  const [isScheduling, setIsScheduling] = useState(false);
  const [schedulerError, setSchedulerError] = useState<string | null>(null);

  // Conduct Review Modal state
  const [meetingReview, setMeetingReview] = useState<ReviewSession | null>(null);
  const [attendanceState, setAttendanceState] = useState<AttendanceItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [nextWeekDirective, setNextWeekDirective] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isConfirmFinalizeOpen, setIsConfirmFinalizeOpen] = useState(false);
  const [conductError, setConductError] = useState<string | null>(null);

  // QR Modal state
  const [qrReview, setQrReview] = useState<ReviewSession | null>(null);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [qrValidSeconds, setQrValidSeconds] = useState<number>(1800);

  // Broadcast Modal state
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Project Review Tomorrow');
  const [reminderMessage, setReminderMessage] = useState(
    'Your project review is scheduled tomorrow. Please submit your milestone progress log before the review session.'
  );

  const handleOpenMeeting = (rev: ReviewSession) => {
    setMeetingReview(rev);
    setConductError(null);
    setAttendanceState(
      rev.attendance.length > 0
        ? rev.attendance
        : rev.studentTeam.map((m, idx) => ({
            studentId: `usr-team-${idx + 1}`,
            name: m.name,
            regNo: m.regNo,
            attended: true,
          }))
    );
    setMeetingNotes(rev.meetingNotes || 'Progress verified against milestone goals.');
    setNextWeekDirective(rev.nextWeekGoal || 'Continue scheduled milestone deliverables.');
  };

  const toggleAttendance = (studentId: string) => {
    setAttendanceState((prev) =>
      prev.map((a) =>
        a.studentId === studentId || a.name === studentId
          ? { ...a, attended: !a.attended }
          : a
      )
    );
  };

  const handleSaveMeetingRecords = async () => {
    if (!meetingReview) return;
    setIsSavingNotes(true);
    setConductError(null);
    try {
      await recordReviewAttendance(meetingReview.id, attendanceState);
      await saveMeetingNotes(meetingReview.id, meetingNotes, nextWeekDirective);
      setIsSavingNotes(false);
      setMeetingReview(null);
      showToast(`Review #${meetingReview.reviewNumber} Saved`, 'Attendance and notes recorded.', 'success');
    } catch (err: unknown) {
      setIsSavingNotes(false);
      const msg = formatApiErrorMessage(err);
      setConductError(msg);
      showToast('Save Failed', msg, 'error');
    }
  };

  const handleExecuteFinalize = async () => {
    if (!meetingReview) return;
    setIsFinalizing(true);
    setConductError(null);
    try {
      await recordReviewAttendance(meetingReview.id, attendanceState);
      await finalizeReviewSession(meetingReview.id, {
        meetingNotes,
        nextWeekGoal: nextWeekDirective,
      });
      setIsFinalizing(false);
      setIsConfirmFinalizeOpen(false);
      setMeetingReview(null);
      showToast(`Review #${meetingReview.reviewNumber} Finalized`, 'Session marked as COMPLETED.', 'success');
    } catch (err: unknown) {
      setIsFinalizing(false);
      setIsConfirmFinalizeOpen(false);
      const msg = formatApiErrorMessage(err);
      setConductError(msg);
      showToast('Finalization Failed', msg, 'error');
    }
  };

  const handleOpenQRModal = async (rev: ReviewSession) => {
    setQrReview(rev);
    if (rev.qrCodeToken && rev.qrExpiresAt && new Date(rev.qrExpiresAt).getTime() > Date.now()) {
      setQrToken(rev.qrCodeToken);
      setQrExpiresAt(rev.qrExpiresAt);
      setQrValidSeconds(rev.qrValidSeconds || 1800);
    } else {
      await handleGenerateQR(rev.id);
    }
  };

  const handleGenerateQR = async (sessionId: string) => {
    setIsGeneratingQR(true);
    try {
      const res = await generateReviewQR(sessionId);
      setQrToken(res.token);
      setQrExpiresAt(res.expires_at);
      setQrValidSeconds(res.valid_seconds);
      setIsGeneratingQR(false);
      showToast('QR Token Generated', `Valid for ${Math.round(res.valid_seconds / 60)} minutes.`, 'success');
    } catch (err: unknown) {
      setIsGeneratingQR(false);
      const msg = formatApiErrorMessage(err);
      showToast('QR Generation Failed', msg, 'error');
    }
  };

  const handleActivitySelection = (id: string) => {
    setSelectedActivityId(id);
    const act = activities.find((a) => a.id === id);
    if (act?.type === 'HACKATHON') {
      setNumberOfReviews('1');
    } else if (act?.type === 'INTERNSHIP') {
      setNumberOfReviews('2');
    } else {
      setNumberOfReviews('8');
    }
  };

  const handleConfirmRecurringSchedule = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedActivityId) {
      showToast('Select an eligible activity.', 'warning');
      return;
    }
    setSchedulerError(null);
    setIsScheduling(true);

    try {
      const count = parseInt(numberOfReviews, 10) || 1;
      const act = activities.find((a) => a.id === selectedActivityId);
      const revType: ReviewType =
        act?.type === 'HACKATHON'
          ? 'HACKATHON_POST'
          : act?.type === 'INTERNSHIP'
          ? 'INTERNSHIP_MID'
          : 'PROJECT_WEEKLY';

      await scheduleRecurringReviews({
        projectId: selectedActivityId,
        dayOfWeek: reviewDay,
        time: reviewTime,
        startDate,
        venue,
        count,
        reviewType: revType,
      });

      setIsScheduling(false);
      setIsSchedulerOpen(false);
      showToast(
        `Scheduled ${count} Review(s)!`,
        `${getReviewTypeLabel(revType)} generated starting ${startDate}.`,
        'success'
      );
    } catch (err: unknown) {
      setIsScheduling(false);
      const msg = formatApiErrorMessage(err);
      setSchedulerError(msg);
      showToast('Scheduling Failed', msg, 'error');
    }
  };

  const handleBroadcastReminder = () => {
    broadcastReminder(reminderTitle, reminderMessage, 'STUDENT');
    setIsReminderOpen(false);
    showToast('Reminder Dispatched', 'Sent to student team.', 'success');
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'CANCELLED') return r.status === 'CANCELLED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

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
        title="Department Reviews & Sessions"
        description="Schedule reviews, review student progress logs, issue attendance QR codes, and finalize sessions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Reviews', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Non-Evaluative Progress Discussions</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReminderOpen(true)}
              leftIcon={<Send className="w-3.5 h-3.5 text-amber-600" />}
            >
              Broadcast Reminder
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSchedulerOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Schedule Reviews
            </Button>
          </div>
        }
      />

      {/* 2. Notice Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Reviews are structured progress checkpoints for tracking milestones and documentation without manual grading.</span>
      </div>

      {/* 3. Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* 4. Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No review sessions found"
            description="Use 'Schedule Reviews' to generate milestone slots for projects, hackathons, or internships."
            icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const hasProgress = !!rev.progress;
            const isCompleted = rev.status === 'COMPLETED';
            const isCancelled = rev.status === 'CANCELLED';

            return (
              <div
                key={rev.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-3 shadow-2xs ${
                  hasProgress && !isCompleted
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{rev.id}</span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        {getReviewTypeLabel(rev.reviewType)} #{rev.reviewNumber}
                      </span>
                    </div>

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

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {rev.activityTitle}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Team ({rev.studentTeam.length} members)</span>
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

                  {rev.progress && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                        Student Progress Log:
                      </span>
                      <p className="text-slate-800 font-medium whitespace-pre-line text-xs">
                        {rev.progress.completedThisWeek}
                      </p>
                      {rev.progress.blockers && rev.progress.blockers !== 'None' && (
                        <div className="text-[11px] text-amber-800 pt-0.5 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                          <span>Blocker: {rev.progress.blockers}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {rev.meetingNotes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">
                        Recorded Discussion Notes:
                      </span>
                      <p className="italic text-xs mt-0.5">&ldquo;{rev.meetingNotes}&rdquo;</p>
                      {rev.finalizedAt && (
                        <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Finalized on {new Date(rev.finalizedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {rev.attendance.filter((a) => a.attended).length} / {rev.studentTeam.length} Attended
                    </span>
                    {!isCancelled && !isCompleted && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenQRModal(rev)}
                        leftIcon={<QrCode className="w-3.5 h-3.5 text-purple-600" />}
                        className="text-xs h-7 px-2"
                      >
                        QR Code
                      </Button>
                    )}
                  </div>

                  {!isCancelled && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenMeeting(rev)}
                      leftIcon={<ClipboardCheck className="w-4 h-4" />}
                      className="bg-purple-700 hover:bg-purple-800 text-xs font-bold"
                    >
                      {isCompleted ? 'View Records' : 'Conduct Review'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-Scheduler Modal (Contract Compliant) */}
      <Dialog
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        title="Schedule Reviews (API Contract v2.0)"
        variant="information"
        confirmLabel={isScheduling ? 'Scheduling...' : 'Generate Schedule'}
        onConfirm={() => handleConfirmRecurringSchedule()}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          {schedulerError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{schedulerError}</span>
            </div>
          )}

          <Select
            label="Approved Activity / Milestone"
            options={eligibleActivities.map((p) => ({
              value: p.id,
              label: `${p.type} [${p.id}] — ${p.title} (${p.studentName})`,
            }))}
            value={selectedActivityId}
            onChange={(e) => handleActivitySelection(e.target.value)}
            isRequired
          />

          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-800">Business Rule Applied:</span>
            <p className="text-[11px]">
              {selectedActivity?.type === 'HACKATHON'
                ? 'Hackathons receive exactly 1 post-event review (HACKATHON_POST).'
                : selectedActivity?.type === 'INTERNSHIP'
                ? 'Internships receive exactly 2 reviews (INTERNSHIP_MID and INTERNSHIP_FINAL).'
                : 'Projects receive recurring weekly reviews (PROJECT_WEEKLY).'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Review Day"
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
              placeholder="e.g. 2:00 PM"
              value={reviewTime}
              onChange={(e) => setReviewTime(e.target.value)}
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              isRequired
            />

            <Input
              label="Number of Reviews"
              placeholder="8"
              value={numberOfReviews}
              onChange={(e) => setNumberOfReviews(e.target.value)}
              isRequired
              disabled={selectedActivity?.type === 'HACKATHON' || selectedActivity?.type === 'INTERNSHIP'}
            />
          </div>

          <Input
            label="Venue / Lab"
            placeholder="e.g. CSE Lab 2"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            isRequired
          />
        </div>
      </Dialog>

      {/* Conduct Review & Finalization Modal */}
      <Dialog
        isOpen={!!meetingReview}
        onClose={() => setMeetingReview(null)}
        title={`${getReviewTypeLabel(meetingReview?.reviewType)} #${meetingReview?.reviewNumber}: ${meetingReview?.activityTitle}`}
        variant="information"
        confirmLabel={isSavingNotes ? 'Saving...' : meetingReview?.status === 'COMPLETED' ? 'Close' : 'Save Records'}
        onConfirm={meetingReview?.status === 'COMPLETED' ? () => setMeetingReview(null) : handleSaveMeetingRecords}
        cancelLabel={meetingReview?.status === 'COMPLETED' ? undefined : 'Cancel'}
      >
        {meetingReview && (
          <div className="space-y-4 text-xs">
            {conductError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{conductError}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">Attendance Roster</label>
                <span className="text-[11px] text-slate-500">Click student to toggle attendance</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attendanceState.map((att) => (
                  <div
                    key={att.studentId || att.name}
                    onClick={() => meetingReview.status !== 'COMPLETED' && toggleAttendance(att.studentId)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between ${
                      meetingReview.status !== 'COMPLETED' ? 'cursor-pointer hover:border-slate-400' : ''
                    } ${
                      att.attended
                        ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{att.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white shadow-2xs">
                      {att.attended ? 'Present ✓' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Textarea
              label="Discussion Notes"
              placeholder="Record summary of discussion..."
              value={meetingNotes}
              onChange={(e) => setMeetingNotes(e.target.value)}
              rows={3}
              disabled={meetingReview.status === 'COMPLETED'}
            />

            <Input
              label="Next Week Directive"
              placeholder="Next milestone goal for the team..."
              value={nextWeekDirective}
              onChange={(e) => setNextWeekDirective(e.target.value)}
              disabled={meetingReview.status === 'COMPLETED'}
            />

            {/* Finalization Action */}
            {meetingReview.status !== 'COMPLETED' && (
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Review Finalization</span>
                  <span className="text-[11px] text-slate-500">Locks review records and transitions status to COMPLETED.</span>
                </div>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsConfirmFinalizeOpen(true)}
                  disabled={isFinalizing || isSavingNotes}
                  className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  Finalize Review
                </Button>
              </div>
            )}
          </div>
        )}
      </Dialog>

      {/* Finalize Confirmation Dialog */}
      <Dialog
        isOpen={isConfirmFinalizeOpen}
        onClose={() => setIsConfirmFinalizeOpen(false)}
        title="Confirm Review Finalization"
        variant="warning"
        confirmLabel={isFinalizing ? 'Finalizing...' : 'Confirm Finalization'}
        onConfirm={handleExecuteFinalize}
        cancelLabel="Cancel"
      >
        <div className="space-y-2 text-xs text-slate-600">
          <p>
            Are you sure you want to finalize <strong>{getReviewTypeLabel(meetingReview?.reviewType)} #{meetingReview?.reviewNumber}</strong>?
          </p>
          <p className="text-[11px] text-slate-500">
            This will record the discussion notes, complete the review session as <strong>COMPLETED</strong>, and conclude the milestone progress checkpoint.
          </p>
        </div>
      </Dialog>

      {/* QR Generation Modal */}
      <Dialog
        isOpen={!!qrReview}
        onClose={() => setQrReview(null)}
        title={`Session Attendance QR: Review #${qrReview?.reviewNumber}`}
        variant="information"
        confirmLabel="Done"
        onConfirm={() => setQrReview(null)}
      >
        {qrReview && (
          <div className="space-y-4 text-xs text-center">
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-white rounded-xl border border-purple-200 shadow-xs">
                <QrCode className="w-24 h-24 text-purple-700" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-800">
                  Active Cryptographic Token
                </span>
                <div className="p-2 rounded-lg bg-white border border-purple-300 font-mono text-xs font-bold text-slate-900 select-all">
                  {qrToken || 'Generating token...'}
                </div>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center justify-center gap-2">
                <span>Validity: ~{Math.round(qrValidSeconds / 60)} minutes</span>
                {qrExpiresAt && (
                  <span className="text-slate-400">
                    (Expires: {new Date(qrExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleGenerateQR(qrReview.id)}
                disabled={isGeneratingQR}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isGeneratingQR ? 'animate-spin' : ''}`} />}
                className="text-xs"
              >
                Regenerate QR Token
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Broadcast Modal */}
      <Dialog
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title="Send Broadcast Reminder"
        variant="information"
        confirmLabel="Send"
        onConfirm={handleBroadcastReminder}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <Input
            label="Reminder Title"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            isRequired
          />

          <Textarea
            label="Message"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            rows={3}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

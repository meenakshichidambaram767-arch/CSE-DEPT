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
  CheckCircle2,
} from 'lucide-react';
import { ReviewSession, AttendanceItem } from '@/types';

export default function HodReviewsPage() {
  const {
    reviews,
    projects,
    activities,
    scheduleRecurringReviews,
    recordReviewAttendance,
    saveMeetingNotes,
    broadcastReminder,
  } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');

  // Scheduler Modal
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(
    projects.find((p) => p.status === 'ACTIVE' || p.status === 'APPROVED')?.id || projects[0]?.id || ''
  );
  const [reviewDay, setReviewDay] = useState('Friday');
  const [reviewTime, setReviewTime] = useState('2:00 PM');
  const [startDate, setStartDate] = useState('2026-09-25');
  const [venue, setVenue] = useState('CSE Lab 2');
  const [numberOfReviews, setNumberOfReviews] = useState('8');
  const [isGenerating, setIsGenerating] = useState(false);

  // Conduct Review Modal
  const [meetingReview, setMeetingReview] = useState<ReviewSession | null>(null);
  const [attendanceState, setAttendanceState] = useState<AttendanceItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [nextWeekDirective, setNextWeekDirective] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Broadcast Modal
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Project Review Tomorrow');
  const [reminderMessage, setReminderMessage] = useState(
    'Your project review is tomorrow at 2:00 PM. Please submit your weekly progress log before the review.'
  );

  const approvedProjects = activities.filter(
    (a) => a.type === 'PROJECT' && (a.status === 'ACTIVE' || a.status === 'APPROVED')
  );

  const handleOpenMeeting = (rev: ReviewSession) => {
    setMeetingReview(rev);
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
    setMeetingNotes(rev.meetingNotes || 'Progress verified.');
    setNextWeekDirective(rev.nextWeekGoal || 'Continue milestone deliverables.');
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

  const handleSaveMeetingSession = () => {
    if (!meetingReview) return;
    setIsSavingNotes(true);
    setTimeout(() => {
      recordReviewAttendance(meetingReview.id, attendanceState);
      saveMeetingNotes(meetingReview.id, meetingNotes, nextWeekDirective);
      setIsSavingNotes(false);
      setMeetingReview(null);
      showToast(`Review #${meetingReview.reviewNumber} Saved`, 'Records updated.', 'success');
    }, 400);
  };

  const handleConfirmRecurringSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      showToast('Select an active project.', 'warning');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const count = parseInt(numberOfReviews, 10) || 8;
      scheduleRecurringReviews({
        projectId: selectedProjectId,
        dayOfWeek: reviewDay,
        time: reviewTime,
        startDate,
        venue,
        count,
      });
      setIsGenerating(false);
      setIsSchedulerOpen(false);
      showToast(`Scheduled ${count} Reviews!`, `Every ${reviewDay} at ${reviewTime}.`, 'success');
    }, 500);
  };

  const handleBroadcastReminder = () => {
    broadcastReminder(reminderTitle, reminderMessage, 'STUDENT');
    setIsReminderOpen(false);
    showToast('Reminder Sent', 'Dispatched to students.', 'success');
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

  const tabItems = [
    { id: 'ALL', label: `All (${reviews.length})` },
    { id: 'SCHEDULED', label: `Upcoming (${reviews.filter((r) => r.status === 'SCHEDULED').length})` },
    { id: 'WITH_PROGRESS', label: `Progress Logged (${reviews.filter((r) => !!r.progress).length})` },
    { id: 'COMPLETED', label: `Completed (${reviews.filter((r) => r.status === 'COMPLETED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Weekly Project Reviews"
        description="Schedule review sessions, check student progress logs, and mark attendance."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Weekly Reviews', current: true },
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
        <span>Weekly reviews are structured progress discussions requiring zero manual grading.</span>
      </div>

      {/* 3. Filter Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* 4. Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No review sessions found"
            description="Use 'Schedule Reviews' to generate recurring weekly review slots for active projects."
            icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReviews.map((rev) => {
            const hasProgress = !!rev.progress;
            const isCompleted = rev.status === 'COMPLETED';

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
                        Review #{rev.reviewNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
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
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {rev.attendance.filter((a) => a.attended).length} / {rev.studentTeam.length} Attended
                  </span>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenMeeting(rev)}
                    leftIcon={<ClipboardCheck className="w-4 h-4" />}
                    className="bg-purple-700 hover:bg-purple-800 text-xs font-bold"
                  >
                    {isCompleted ? 'Edit Notes' : 'Conduct Review'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Auto-Scheduler Modal */}
      <Dialog
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        title="Schedule Recurring Weekly Reviews"
        variant="information"
        confirmLabel={isGenerating ? 'Scheduling...' : 'Generate Schedule'}
        onConfirm={() => handleConfirmRecurringSchedule({ preventDefault: () => {} } as any)}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <Select
            label="Approved Project"
            options={approvedProjects.map((p) => ({
              value: p.id,
              label: `${p.id} — ${p.title} (${p.studentName})`,
            }))}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            isRequired
          />

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

      {/* Conduct Review Modal */}
      <Dialog
        isOpen={!!meetingReview}
        onClose={() => setMeetingReview(null)}
        title={`Review #${meetingReview?.reviewNumber}: ${meetingReview?.activityTitle}`}
        variant="information"
        confirmLabel={isSavingNotes ? 'Saving...' : 'Save Records'}
        onConfirm={handleSaveMeetingSession}
        cancelLabel="Cancel"
      >
        {meetingReview && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">Attendance Checklist</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attendanceState.map((att) => (
                  <div
                    key={att.studentId || att.name}
                    onClick={() => toggleAttendance(att.studentId)}
                    className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer ${
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
            />

            <Input
              label="Next Week Directive"
              placeholder="Next milestone goal for the team..."
              value={nextWeekDirective}
              onChange={(e) => setNextWeekDirective(e.target.value)}
            />
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

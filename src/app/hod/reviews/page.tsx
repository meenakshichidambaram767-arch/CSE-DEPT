'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  XCircle,
  FileText,
  UserCheck,
} from 'lucide-react';
import { GithubIcon } from '@/components/common/GithubIcon';
import { ReviewSession, AttendanceItem } from '@/types';

export default function HodReviewsPage() {
  const {
    reviews,
    projects,
    activities,
    scheduleRecurringReviews,
    recordReviewAttendance,
    saveMeetingNotes,
    cancelReviewSession,
    broadcastReminder,
  } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');

  // Automatic Recurring Review Scheduler Modal (Section 10)
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

  // Review Meeting & Attendance Modal (Sections 13, 14, 15)
  const [meetingReview, setMeetingReview] = useState<ReviewSession | null>(null);
  const [attendanceState, setAttendanceState] = useState<AttendanceItem[]>([]);
  const [meetingNotes, setMeetingNotes] = useState('');
  const [nextWeekDirective, setNextWeekDirective] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Broadcast Reminder Modal (Section 16)
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Project Review Tomorrow');
  const [reminderMessage, setReminderMessage] = useState(
    'Your project review is tomorrow at 2:00 PM. Please submit your weekly progress before the review.'
  );

  // Filter approved projects eligible for recurring review scheduling
  const approvedProjects = activities.filter(
    (a) => a.type === 'PROJECT' && (a.status === 'ACTIVE' || a.status === 'APPROVED')
  );

  // Handle opening review meeting session
  const handleOpenMeeting = (rev: ReviewSession) => {
    setMeetingReview(rev);
    setAttendanceState(
      rev.attendance.length > 0
        ? rev.attendance
        : rev.studentTeam.map((m, idx) => ({
            studentId: `usr-team-${idx + 1}`,
            name: m.name,
            regNo: m.regNo,
            attended: idx === 0, // default lead checked
          }))
    );
    setMeetingNotes(rev.meetingNotes || 'Team demonstrated working pipeline. Progress verified.');
    setNextWeekDirective(rev.nextWeekGoal || 'Integrate telemetry logging and optimize latency.');
  };

  // Toggle manual attendance
  const toggleAttendance = (studentId: string) => {
    setAttendanceState((prev) =>
      prev.map((a) =>
        a.studentId === studentId || a.name === studentId
          ? { ...a, attended: !a.attended, checkInTime: !a.attended ? '2:00 PM' : undefined }
          : a
      )
    );
  };

  // Save Attendance & Meeting Notes
  const handleSaveMeetingSession = () => {
    if (!meetingReview) return;
    setIsSavingNotes(true);

    setTimeout(() => {
      recordReviewAttendance(meetingReview.id, attendanceState);
      saveMeetingNotes(meetingReview.id, meetingNotes, nextWeekDirective);
      setIsSavingNotes(false);
      setMeetingReview(null);
      showToast(
        `Meeting Records Saved for Review #${meetingReview.reviewNumber}`,
        'Attendance and discussion notes documented.',
        'success'
      );
    }, 400);
  };

  // Confirm Automatic Recurring Scheduling (Section 10)
  const handleConfirmRecurringSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      showToast('Please select an active capstone project.', 'warning');
      return;
    }

    setIsGenerating(true);

    setTimeout(() => {
      const count = parseInt(numberOfReviews, 10) || 8;
      const generated = scheduleRecurringReviews({
        projectId: selectedProjectId,
        dayOfWeek: reviewDay,
        time: reviewTime,
        startDate,
        venue,
        count,
      });

      setIsGenerating(false);
      setIsSchedulerOpen(false);
      showToast(
        `Automatically Generated ${generated.length} Weekly Review Sessions!`,
        `Scheduled for ${reviewDay}s at ${reviewTime} in ${venue}.`,
        'success'
      );
    }, 500);
  };

  // Broadcast reminder trigger (Section 16)
  const handleBroadcastReminder = () => {
    broadcastReminder(reminderTitle, reminderMessage, 'STUDENT');
    setIsReminderOpen(false);
    showToast('Department Reminder Dispatched!', 'Sent to all active project teams.', 'success');
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeTab === 'SCHEDULED') return r.status === 'SCHEDULED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    if (activeTab === 'WITH_PROGRESS') return !!r.progress;
    return true;
  });

  const tabItems = [
    { id: 'ALL', label: `All Reviews (${reviews.length})` },
    { id: 'SCHEDULED', label: `Upcoming (${reviews.filter((r) => r.status === 'SCHEDULED').length})` },
    { id: 'WITH_PROGRESS', label: `Progress Submitted (${reviews.filter((r) => !!r.progress).length})` },
    { id: 'COMPLETED', label: `Completed (${reviews.filter((r) => r.status === 'COMPLETED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Weekly Project Reviews &amp; Progress Discussions"
        description="Eliminate manual spreadsheets: automatically schedule recurring reviews, view student progress summaries, record attendance, and document meeting notes."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Weekly Reviews', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Strictly Non-Evaluative / Progress Centric</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReminderOpen(true)}
            >
              Broadcast Reminder
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSchedulerOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Auto-Schedule Recurring Reviews
            </Button>
          </div>
        }
      />

      {/* Overview Notice (Section 2 Principle) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-start gap-3 shadow-2xs">
        <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <strong>Non-Evaluative Progress Philosophy:</strong> Weekly reviews are discussions, NOT grading or marking sessions. The HOD conducts progress discussions to understand blockers and goals, requiring zero manual marks entry.
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No review sessions found"
            description="Use 'Auto-Schedule Recurring Reviews' to automatically generate recurring weekly review slots for approved projects."
            icon={<ClipboardCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReviews.map((rev) => {
            const hasProgress = !!rev.progress;
            const isCompleted = rev.status === 'COMPLETED';

            return (
              <div
                key={rev.id}
                className={`p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-2xs ${
                  hasProgress && !isCompleted
                    ? 'bg-gradient-to-br from-emerald-50/50 via-white to-white border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{rev.id}</span>
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800">
                        Review #{rev.reviewNumber}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : rev.status === 'CANCELLED'
                          ? 'bg-slate-100 text-slate-500'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rev.status}
                    </span>
                  </div>

                  {/* Project Title */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {rev.activityTitle}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Team: {rev.studentTeam.map((m) => m.name.split(' ')[0]).join(', ')} ({rev.studentTeam.length} Members)
                      </span>
                    </div>
                  </div>

                  {/* Date, Time & Venue */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.time}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rev.venue}</span>
                    </div>
                  </div>

                  {/* Concise Review Summary Spotlight (Section 13) */}
                  {rev.progress ? (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">
                          Student Weekly Progress Summary
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold font-mono">
                          Submitted by {rev.progress.studentName}
                        </span>
                      </div>

                      {/* Completed Items */}
                      <div className="space-y-0.5 text-xs text-slate-800">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                          Completed:
                        </span>
                        <p className="text-xs whitespace-pre-line font-medium text-emerald-950 pl-1">
                          {rev.progress.completedThisWeek}
                        </p>
                      </div>

                      {/* Current & Next */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-blue-800 block">
                            Currently working on:
                          </span>
                          <p className="text-xs font-medium text-blue-950 truncate">
                            {rev.progress.currentlyWorkingOn}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-purple-800 block">
                            Next:
                          </span>
                          <p className="text-xs font-medium text-purple-950 truncate">
                            {rev.progress.nextWeekGoal}
                          </p>
                        </div>
                      </div>

                      {/* Blocker alert if present */}
                      {rev.progress.blockers && rev.progress.blockers !== 'None' && (
                        <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-[10px] uppercase font-bold block text-amber-800">
                              Blocker:
                            </strong>
                            <span>{rev.progress.blockers}</span>
                          </div>
                        </div>
                      )}

                      {rev.progress.githubUrl && (
                        <a
                          href={rev.progress.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:underline pt-1"
                        >
                          <GithubIcon className="w-3.5 h-3.5" />
                          <span>View Repository</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                      Progress submission pending from student team.
                    </div>
                  )}

                  {/* Documented Notes if already completed */}
                  {rev.meetingNotes && (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                      <strong className="text-[10px] uppercase font-bold text-slate-500 block">
                        Meeting Notes (Documentation Only):
                      </strong>
                      <p className="italic leading-relaxed">&ldquo;{rev.meetingNotes}&rdquo;</p>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">
                    {rev.attendance.filter((a) => a.attended).length} / {rev.studentTeam.length} Attended
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenMeeting(rev)}
                      leftIcon={<ClipboardCheck className="w-4 h-4" />}
                      className="bg-purple-700 hover:bg-purple-800"
                    >
                      {isCompleted ? 'Edit Meeting Records' : 'Conduct Meeting & Attendance'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Automatic Recurring Review Scheduler Modal (Section 10) */}
      <Dialog
        isOpen={isSchedulerOpen}
        onClose={() => setIsSchedulerOpen(false)}
        title="Auto-Schedule Recurring Weekly Reviews"
        variant="information"
        confirmLabel={isGenerating ? 'Generating Schedule...' : 'Generate 8 Weekly Reviews'}
        onConfirm={() => handleConfirmRecurringSchedule({ preventDefault: () => {} } as any)}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <strong className="block text-xs font-bold text-emerald-900">
              Zero Manual Spreadsheets
            </strong>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Select an approved project, recurring day, and time. The system will automatically generate all weekly review sessions with exact calendar dates!
            </p>
          </div>

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
              placeholder="e.g. 2:00 PM"
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
              label="Number of Reviews"
              placeholder="8"
              value={numberOfReviews}
              onChange={(e) => setNumberOfReviews(e.target.value)}
              isRequired
            />
          </div>

          <Input
            label="Venue / Lab"
            placeholder="e.g. CSE Lab 2 / Seminar Hall"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            isRequired
          />
        </div>
      </Dialog>

      {/* Conduct Meeting, Attendance & Notes Modal (Sections 11, 14, 15) */}
      <Dialog
        isOpen={!!meetingReview}
        onClose={() => setMeetingReview(null)}
        title={`Review #${meetingReview?.reviewNumber}: ${meetingReview?.activityTitle}`}
        variant="information"
        confirmLabel={isSavingNotes ? 'Saving...' : 'Save Meeting & Attendance Records'}
        onConfirm={handleSaveMeetingSession}
        cancelLabel="Cancel"
      >
        {meetingReview && (
          <div className="space-y-5 text-xs">
            {/* Student Progress Review Summary on Top (Section 13) */}
            {meetingReview.progress ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-900 block">
                  Quick Review Summary (Student Submission)
                </span>
                <div className="text-xs text-slate-800 space-y-1">
                  <div>
                    <span className="font-bold text-emerald-800">✓ Completed: </span>
                    <span className="whitespace-pre-line">{meetingReview.progress.completedThisWeek}</span>
                  </div>
                  <div>
                    <span className="font-bold text-blue-800">→ Currently working on: </span>
                    <span>{meetingReview.progress.currentlyWorkingOn}</span>
                  </div>
                  <div>
                    <span className="font-bold text-purple-800">→ Next: </span>
                    <span>{meetingReview.progress.nextWeekGoal}</span>
                  </div>
                  {meetingReview.progress.blockers && (
                    <div>
                      <span className="font-bold text-amber-800">⚠ Blocker: </span>
                      <span>{meetingReview.progress.blockers}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No pre-meeting progress report was logged for this session.
              </div>
            )}

            {/* Attendance Marking Section (Section 14) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Review Attendance (Option 1: Manual Checklist)
                  </h4>
                  <p className="text-[11px] text-slate-500">Toggle presence for each team member.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setShowQrModal(true)}
                  leftIcon={<QrCode className="w-3.5 h-3.5 text-purple-600" />}
                >
                  Generate QR Code
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {attendanceState.map((att) => (
                  <div
                    key={att.studentId || att.name}
                    onClick={() => toggleAttendance(att.studentId)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      att.attended
                        ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-white text-xs ${
                          att.attended ? 'bg-emerald-600' : 'border border-slate-300 bg-white'
                        }`}
                      >
                        {att.attended && '✓'}
                      </div>
                      <div>
                        <strong className="block text-xs">{att.name}</strong>
                        <span className="text-[10px] font-mono text-slate-400 font-normal">
                          {att.regNo}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        att.attended
                          ? 'bg-emerald-200 text-emerald-900'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {att.attended ? 'Present' : 'Absent'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meeting Notes (Section 15 - Documentation Only / No Grading) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Meeting Notes (Documentation Only)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Record qualitative summary of discussion and next milestone directive.
                </p>
              </div>

              <Textarea
                label="HOD Discussion Notes"
                placeholder="e.g. Team demonstrated the initial YOLO detection pipeline and completed dataset collection..."
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                rows={3}
              />

              <Input
                label="Next Week's Goal Directive"
                placeholder="e.g. Integrate tracking and test on classroom footage."
                value={nextWeekDirective}
                onChange={(e) => setNextWeekDirective(e.target.value)}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* QR Code Attendance Modal (Section 14 Option 2) */}
      <Dialog
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title="Review Session Attendance QR Code"
        variant="information"
        confirmLabel="Done"
        onConfirm={() => setShowQrModal(false)}
      >
        <div className="space-y-4 text-center py-2">
          <p className="text-xs text-slate-600">
            Students can scan this encrypted token from their mobile dashboard to instantly log presence for <strong>Review #{meetingReview?.reviewNumber}</strong>.
          </p>

          <div className="w-48 h-48 mx-auto bg-white p-3 rounded-2xl border-2 border-emerald-600 flex flex-col items-center justify-center shadow-lg">
            {/* SVG QR Code Simulation */}
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
              <rect x="10" y="10" width="24" height="24" rx="2" />
              <rect x="14" y="14" width="16" height="16" fill="white" />
              <rect x="18" y="18" width="8" height="8" />

              <rect x="66" y="10" width="24" height="24" rx="2" />
              <rect x="70" y="14" width="16" height="16" fill="white" />
              <rect x="74" y="18" width="8" height="8" />

              <rect x="10" y="66" width="24" height="24" rx="2" />
              <rect x="14" y="70" width="16" height="16" fill="white" />
              <rect x="18" y="74" width="8" height="8" />

              {/* Data modules */}
              <rect x="42" y="12" width="6" height="6" />
              <rect x="52" y="12" width="6" height="6" />
              <rect x="42" y="24" width="8" height="8" />
              <rect x="48" y="42" width="12" height="12" fill="#047857" />
              <rect x="20" y="44" width="6" height="6" />
              <rect x="72" y="44" width="8" height="6" />
              <rect x="42" y="66" width="10" height="8" />
              <rect x="66" y="66" width="8" height="8" />
              <rect x="78" y="78" width="8" height="8" />
            </svg>
          </div>

          <div className="font-mono text-[11px] text-slate-400">
            Token: {meetingReview?.qrCodeToken || 'QR-REV-2026-CSE-ACTIVE'}
          </div>

          <div className="pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAttendanceState((prev) =>
                  prev.map((a) => ({ ...a, attended: true, checkInTime: '2:00 PM' }))
                );
                showToast('All Team Members Checked In via QR Code!', 'Attendance synced.', 'success');
                setShowQrModal(false);
              }}
            >
              Simulate Student QR Scan Check-In
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Broadcast Reminder Modal (Section 16) */}
      <Dialog
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title="Broadcast System Reminder"
        variant="information"
        confirmLabel="Send Reminder"
        onConfirm={handleBroadcastReminder}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Send an automated notification to all students with upcoming reviews, pending progress submissions, or required documents.
          </p>

          <Input
            label="Reminder Title"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            isRequired
          />

          <Textarea
            label="Reminder Message"
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

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useSession } from '@/context/SessionContext';
import { useData } from '@/context/DataContext';
import { useToast } from '@/components/ui/Toast';
import {
  BadgeCheck,
  FileCheck,
  ClipboardCheck,
  FolderKanban,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  Users,
  AlertTriangle,
  Send,
  Trophy,
  BriefcaseBusiness,
} from 'lucide-react';

export default function HodDashboardPage() {
  const { user } = useSession();
  const {
    activities,
    reviews,
    odApplications,
    approveActivity,
    rejectActivity,
    broadcastReminder,
  } = useData();
  const { showToast } = useToast();

  const hodName = user?.name || 'Dr. Priya Kumar';

  // Action counts (Section 19)
  const pendingProjects = activities.filter(
    (a) => a.type === 'PROJECT' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  );
  const pendingHackathons = activities.filter(
    (a) => a.type === 'HACKATHON' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  );
  const pendingInternships = activities.filter(
    (a) => a.type === 'INTERNSHIP' && (a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW')
  );
  const pendingODs = odApplications.filter((o) => o.status === 'PENDING');

  const scheduledReviews = reviews.filter((r) => r.status === 'SCHEDULED');
  const reviewsMissingProgress = scheduledReviews.filter((r) => !r.progress);

  // Quick Action Modal states
  const [selectedActivity, setSelectedActivity] = useState<typeof activities[0] | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Missing Weekly Progress Submission');
  const [reminderMessage, setReminderMessage] = useState(
    'Your project review is scheduled for tomorrow at 2:00 PM in CSE Lab 2. Please submit your weekly progress before the review.'
  );

  const handleBroadcast = () => {
    broadcastReminder(reminderTitle, reminderMessage, 'STUDENT');
    setIsReminderOpen(false);
    showToast('Reminder Broadcasted Successfully', 'Students notified via push alert.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <PageHeader
        title={`Good Morning, ${hodName}`}
        description="Department Command Overview • Zero Administrative Overhead"
        breadcrumbs={[{ label: 'Dashboard', current: true }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#064e3b] text-white border border-emerald-700 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Head of Department • CSE</span>
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
              Send Reminder
            </Button>
            <Link href="/hod/approvals">
              <Button variant="primary" size="sm" leftIcon={<BadgeCheck className="w-4 h-4" />}>
                Review Pending Actions ({pendingProjects.length + pendingHackathons.length + pendingInternships.length + pendingODs.length})
              </Button>
            </Link>
          </div>
        }
      />

      {/* Pending Actions Counters Grid (Section 19) */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
          Pending Actions Overview
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/hod/approvals?tab=PROJECTS"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Project Approvals</span>
              <FolderKanban className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-emerald-800">
              {pendingProjects.length} Projects
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
              Clear proposals →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=HACKATHONS"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/40 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Hackathon Approvals</span>
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-amber-800">
              {pendingHackathons.length} Hackathons
            </div>
            <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
              Clear participation →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=INTERNSHIPS"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">Internship Approvals</span>
              <BriefcaseBusiness className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-indigo-800">
              {pendingInternships.length} Internships
            </div>
            <span className="text-[11px] text-indigo-700 font-semibold mt-1 block">
              Issue NOC clearances →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=OD"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50/40 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider">OD Requests</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 group-hover:text-purple-800">
              {pendingODs.length} OD Requests
            </div>
            <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
              Grant concessions →
            </span>
          </Link>
        </div>
      </div>

      {/* Main Action Hub: Today's Reviews + Missing Progress Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Today & Upcoming Reviews (Section 19) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Today's Scheduled Reviews
                </h3>
                <p className="text-xs text-slate-500">
                  Conduct discussions, review pre-meeting progress summaries, and record attendance.
                </p>
              </div>

              <Link href="/hod/reviews">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  All Reviews ({scheduledReviews.length})
                </Button>
              </Link>
            </div>

            {scheduledReviews.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                No review meetings scheduled for today.
              </div>
            ) : (
              <div className="space-y-3">
                {scheduledReviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                          {rev.time}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {rev.activityTitle}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ({rev.studentTeam.length} Students)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {rev.venue}
                        </span>
                        <span>•</span>
                        <span>
                          Team: {rev.studentTeam.map((m) => m.name.split(' ')[0]).join(', ')}
                        </span>
                      </div>

                      {rev.progress && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-1">
                          ✓ Weekly Progress Filed Ahead of Meeting
                        </span>
                      )}
                    </div>

                    <Link href="/hod/reviews">
                      <Button size="sm" variant="primary" className="bg-purple-700 hover:bg-purple-800">
                        Open Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Approvals Action List */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recent Submissions Requiring Clearance
                </h3>
                <p className="text-xs text-slate-500">1-click approve or open detailed review screen</p>
              </div>

              <Link href="/hod/approvals">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Approval Inbox
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {pendingProjects.concat(pendingHackathons).slice(0, 3).map((act) => (
                <div
                  key={act.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{act.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {act.type}
                      </span>
                    </div>
                    <strong className="text-sm font-bold text-slate-900 block">{act.title}</strong>
                    <span className="text-xs text-slate-500">
                      {act.studentName} ({act.studentRegNo}) • {act.department}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.location.href = '/hod/approvals';
                      }}
                    >
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        approveActivity(act.id);
                        showToast(`Approved ${act.title}`, 'Status transitioned to ACTIVE.', 'success');
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Attention & Reminders Hub */}
        <div className="space-y-4">
          
          {/* Missing Progress Alert Widget */}
          <div className="p-5 rounded-3xl border border-amber-200 bg-amber-50/50 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Missing Weekly Progress</span>
            </div>

            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>{reviewsMissingProgress.length} student teams</strong> have scheduled reviews this week but have not yet logged what they completed.
            </p>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                broadcastReminder(
                  'Urgent: Submit Weekly Progress',
                  'Please submit what you completed, current work, and blockers before your scheduled review session.',
                  'STUDENT'
                );
                showToast('Automatic Reminder Dispatched', 'All teams notified.', 'success');
              }}
              className="w-full justify-center bg-amber-700 hover:bg-amber-800 text-white"
            >
              Remind Missing Teams
            </Button>
          </div>

          {/* Quick Department Schedule Hub */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Department Fast Actions
            </h4>

            <div className="space-y-2">
              <Link
                href="/hod/reviews"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" />
                  <span>Auto-Schedule Recurring Reviews</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/hod/approvals?tab=OD"
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Clear On-Duty Permissions</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Reminder Modal */}
      <Dialog
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        title="Broadcast Department Reminder"
        variant="information"
        confirmLabel="Send Reminder"
        onConfirm={handleBroadcast}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Reminder Title"
            value={reminderTitle}
            onChange={(e) => setReminderTitle(e.target.value)}
            isRequired
          />

          <Textarea
            label="Message Content"
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

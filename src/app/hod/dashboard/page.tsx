'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
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
  FileText,
  ClipboardCheck,
  FolderKanban,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MapPin,
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
    broadcastReminder,
  } = useData();
  const { showToast } = useToast();

  const hodName = user?.name || 'Dr. Priya Kumar';

  // Pending counts
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
  const totalPending = pendingProjects.length + pendingHackathons.length + pendingInternships.length + pendingODs.length;

  const scheduledReviews = reviews.filter((r) => r.status === 'SCHEDULED');
  const reviewsMissingProgress = scheduledReviews.filter((r) => !r.progress);

  // Quick Action Modal states
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('Missing Weekly Progress');
  const [reminderMessage, setReminderMessage] = useState(
    'Please submit your weekly progress before your scheduled review session.'
  );

  const handleBroadcast = () => {
    broadcastReminder(reminderTitle, reminderMessage, 'STUDENT');
    setIsReminderOpen(false);
    showToast('Reminder Sent', 'Students have been notified.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header Greeting & Action Bar */}
      <PageHeader
        title={`Welcome, ${hodName}`}
        description="CSE Department Overview & Pending Approvals"
        breadcrumbs={[{ label: 'Dashboard', current: true }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#064e3b] text-white border border-emerald-700 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>HOD • CSE</span>
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
                Review Pending ({totalPending})
              </Button>
            </Link>
          </div>
        }
      />

      {/* 2. Pending Actions Summary Cards */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Pending Approvals
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            href="/hod/approvals?tab=PROJECTS"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Projects</span>
              <FolderKanban className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 group-hover:text-emerald-800">
              {pendingProjects.length}
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-emerald-700 mt-0.5 block font-medium">
              View pending →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=HACKATHONS"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Hackathons</span>
              <Trophy className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 group-hover:text-amber-800">
              {pendingHackathons.length}
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-amber-700 mt-0.5 block font-medium">
              View pending →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=INTERNSHIPS"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">Internships</span>
              <BriefcaseBusiness className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 group-hover:text-indigo-800">
              {pendingInternships.length}
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-indigo-700 mt-0.5 block font-medium">
              View pending →
            </span>
          </Link>

          <Link
            href="/hod/approvals?tab=OD"
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-500 hover:bg-purple-50/30 transition-all shadow-2xs group"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-semibold">OD Requests</span>
              <FileCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 group-hover:text-purple-800">
              {pendingODs.length}
            </div>
            <span className="text-[11px] text-slate-400 group-hover:text-purple-700 mt-0.5 block font-medium">
              View pending →
            </span>
          </Link>
        </div>
      </div>

      {/* 3 & 4. Main Section: Today's Reviews & Pending Approvals List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 space-y-4">
          {/* Today's Scheduled Reviews */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Today's Reviews</h3>
                <p className="text-xs text-slate-500">Scheduled progress review sessions</p>
              </div>

              <Link href="/hod/reviews">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All ({scheduledReviews.length})
                </Button>
              </Link>
            </div>

            {scheduledReviews.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                No reviews scheduled for today.
              </div>
            ) : (
              <div className="space-y-2.5">
                {scheduledReviews.slice(0, 3).map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                          {rev.time}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {rev.activityTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {rev.venue}
                        </span>
                        <span>•</span>
                        <span>Team ({rev.studentTeam.length})</span>
                      </div>
                    </div>

                    <Link href="/hod/reviews">
                      <Button size="sm" variant="primary" className="bg-purple-700 hover:bg-purple-800 text-xs">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions Requiring Clearance */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pending Clearances</h3>
                <p className="text-xs text-slate-500">Submissions awaiting HOD approval</p>
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
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {act.type}
                      </span>
                      <strong className="text-xs font-bold text-slate-900">{act.title}</strong>
                    </div>
                    <span className="text-xs text-slate-500 block">
                      {act.studentName} ({act.studentRegNo})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        approveActivity(act.id);
                        showToast(`Approved ${act.title}`, 'Status updated to ACTIVE.', 'success');
                      }}
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs"
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Right Sidebar: Reminders & Fast Actions */}
        <div className="space-y-4">
          
          {/* Missing Progress Alert Widget */}
          <div className="p-4.5 rounded-2xl border border-amber-200 bg-amber-50/60 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Missing Progress</span>
            </div>

            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>{reviewsMissingProgress.length} team(s)</strong> have not submitted their weekly progress log yet.
            </p>

            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                broadcastReminder(
                  'Urgent: Submit Weekly Progress',
                  'Please submit your weekly progress log before your review.',
                  'STUDENT'
                );
                showToast('Reminder Sent', 'All teams notified.', 'success');
              }}
              className="w-full justify-center bg-amber-700 hover:bg-amber-800 text-white text-xs"
            >
              Remind Missing Teams
            </Button>
          </div>

          {/* Quick Department Schedule Hub */}
          <div className="p-4.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick Actions
            </h4>

            <div className="space-y-2">
              <Link
                href="/hod/reviews"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="w-4 h-4 text-purple-600" />
                  <span>Schedule Reviews</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/hod/approvals?tab=OD"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-600" />
                  <span>Clear OD Requests</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/hod/reports"
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 transition-all text-xs font-medium text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>NAAC / NBA Audit Reports</span>
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
        title="Send Reminder to Students"
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

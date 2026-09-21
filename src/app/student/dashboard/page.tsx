'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { Button } from '@/components/ui/Button';
import { useSession } from '@/context/SessionContext';
import { useData } from '@/context/DataContext';
import {
  FolderKanban,
  BriefcaseBusiness,
  Trophy,
  ClipboardCheck,
  Sparkles,
  Clock,
  ArrowRight,
  Plus,
  Calendar,
  MapPin,
  FileCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user } = useSession();
  const { activities, reviews, odApplications } = useData();

  const studentName = user?.name || 'Meena C';
  const department = user?.department || 'CSE';
  const year = user?.year || 'II';

  // Metrics
  const activeProjectsCount = activities.filter(
    (a) => a.type === 'PROJECT' && (a.status === 'ACTIVE' || a.status === 'APPROVED')
  ).length;

  const pendingRequestsCount = activities.filter(
    (a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW'
  ).length;

  const upcomingReviews = reviews.filter((r) => r.status === 'SCHEDULED');
  const pendingODCount = odApplications.filter((o) => o.status === 'PENDING').length;

  // Recent 3 submissions across all types
  const recentActivities = activities.slice(0, 3);

  // Next Upcoming Review
  const nextReview = upcomingReviews[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Page Header */}
      <PageHeader
        title={`Good morning, ${studentName.split(' ')[0]}`}
        description="SIET Computer Science & Engineering • Department Activity Dashboard"
        breadcrumbs={[{ label: 'Dashboard', current: true }]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{department} • Year {year} (Batch 2024-2028)</span>
          </span>
        }
        primaryAction={
          <Link href="/student/activities/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Submit Activity
            </Button>
          </Link>
        }
      />

      {/* Primary Metrics Grid (Matching Section 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Projects"
          value={activeProjectsCount}
          description="Approved Capstone Projects"
          icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
          variant="highlight"
        />
        <MetricCard
          label="Pending Requests"
          value={pendingRequestsCount}
          description="Submissions under HOD review"
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          variant={pendingRequestsCount > 0 ? 'highlight' : 'default'}
        />
        <MetricCard
          label="Upcoming Reviews"
          value={upcomingReviews.length}
          description="Scheduled Weekly Progress Vivas"
          icon={<ClipboardCheck className="w-5 h-5 text-purple-600" />}
        />
        <MetricCard
          label="Pending OD Requests"
          value={pendingODCount}
          description="On-Duty Permissions Awaiting HOD"
          icon={<FileCheck className="w-5 h-5 text-indigo-600" />}
        />
      </div>

      {/* Main Grid: Recent Activity + Upcoming Review Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Recent Activity
                </h3>
                <p className="text-xs text-slate-500">Live project, hackathon, and internship statuses</p>
              </div>
              <Link href="/student/activities">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">{act.id}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {act.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          act.status === 'ACTIVE' || act.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {act.title}
                    </h4>

                    {act.rejectionReason && (
                      <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
                        <strong>Reason:</strong> {act.rejectionReason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {act.technologies.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="text-[10px] font-medium bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/student/projects/${act.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional OD Quick Banner */}
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs sm:text-sm">
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>Need On-Duty (OD) Permission?</span>
              </div>
              <p className="text-xs text-indigo-700/90 leading-relaxed">
                OD applications are optional and independently approved from your projects. Known project details are automatically populated!
              </p>
            </div>
            <Link href="/student/od-requests/new" className="shrink-0">
              <Button variant="primary" size="sm" className="bg-indigo-700 hover:bg-indigo-800 text-white">
                Apply for OD
              </Button>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Spotlight Upcoming Review */}
        <div className="space-y-4">
          
          {/* Spotlight Card matching Section 3 */}
          <div className="p-5 sm:p-6 rounded-2xl border-2 border-emerald-600/30 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Upcoming Review Spotlight
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                Review #{nextReview?.reviewNumber || 1}
              </span>
            </div>

            {nextReview ? (
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Project
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    {nextReview.activityTitle}
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                      <Calendar className="w-3 h-3 text-emerald-600" />
                      <span>Date</span>
                    </div>
                    <strong className="text-slate-900 block">{nextReview.date}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-semibold">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Time</span>
                    </div>
                    <strong className="text-slate-900 block">{nextReview.time}</strong>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 flex items-center gap-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Venue</span>
                    <strong className="text-slate-900">{nextReview.venue}</strong>
                  </div>
                </div>

                <div className="pt-2">
                  <Link href={`/student/projects/${nextReview.activityId}`}>
                    <Button variant="primary" size="sm" className="w-full justify-center">
                      Submit / View Weekly Progress
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No upcoming review scheduled.</p>
            )}
          </div>

          {/* Quick Submission Shortcut Links */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Submit New Activity
            </h4>
            <div className="space-y-2">
              <Link
                href="/student/activities/new?type=PROJECT"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-600" />
                  <span>Capstone Project</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/student/activities/new?type=HACKATHON"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>Hackathon Entry</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>

              <Link
                href="/student/activities/new?type=INTERNSHIP"
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all text-xs font-semibold text-slate-800 group"
              >
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness className="w-4 h-4 text-indigo-600" />
                  <span>Corporate Internship</span>
                </div>
                <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

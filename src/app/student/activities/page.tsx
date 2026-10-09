'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { activitiesApi } from '@/lib/api/activitiesApi';
import { ApiError } from '@/lib/api/odApi';
import { Activity } from '@/types';
import {
  FolderKanban,
  Plus,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';

export default function StudentActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchActivitiesData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMsg(null);
    setBackendNotice(null);

    try {
      const res = await activitiesApi.getActivities();
      if (res.data) {
        setActivities(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        setBackendNotice('Backend endpoint GET /api/v1/activities returned HTTP 404 (Endpoint not deployed). Displaying static reference records (LOCAL / UNPERSISTED PROTOTYPE DATA).');
        setActivities(activitiesApi.getFallbackActivities());
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to load activity records from server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    activitiesApi
      .getActivities()
      .then((res) => {
        if (isMounted && res.data) {
          setActivities(res.data);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
            setBackendNotice('Backend endpoint GET /api/v1/activities returned HTTP 404 (Endpoint not deployed). Displaying static reference records (LOCAL / UNPERSISTED PROTOTYPE DATA).');
            setActivities(activitiesApi.getFallbackActivities());
          } else {
            setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load activities.');
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = activities.filter((a) => {
    if (activeTab === 'PROJECT' && a.type !== 'PROJECT') return false;
    if (activeTab === 'HACKATHON' && a.type !== 'HACKATHON') return false;
    if (activeTab === 'INTERNSHIP' && a.type !== 'INTERNSHIP') return false;
    if (activeTab === 'PENDING' && a.status !== 'SUBMITTED' && a.status !== 'UNDER_REVIEW') return false;
    if (activeTab === 'APPROVED' && a.status !== 'APPROVED' && a.status !== 'ACTIVE') return false;
    if (activeTab === 'REJECTED' && a.status !== 'REJECTED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.technologies || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const tabItems = [
    { id: 'ALL', label: `All (${activities.length})` },
    { id: 'PROJECT', label: `Projects (${activities.filter((a) => a.type === 'PROJECT').length})` },
    { id: 'HACKATHON', label: `Hackathons (${activities.filter((a) => a.type === 'HACKATHON').length})` },
    { id: 'INTERNSHIP', label: `Internships (${activities.filter((a) => a.type === 'INTERNSHIP').length})` },
    { id: 'PENDING', label: `Under Review (${activities.filter((a) => a.status === 'SUBMITTED' || a.status === 'UNDER_REVIEW').length})` },
    { id: 'APPROVED', label: `Approved (${activities.filter((a) => a.status === 'APPROVED' || a.status === 'ACTIVE').length})` },
    { id: 'REJECTED', label: `Rejected (${activities.filter((a) => a.status === 'REJECTED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="My Activities &amp; Submissions"
        description="Track the real-time status of your capstone projects, hackathon entries, and corporate internships."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'My Activities', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{activities.length} Recorded Submissions</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchActivitiesData(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
              title="Refresh activities list"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link href="/student/activities/new">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Submit New Activity
              </Button>
            </Link>
          </div>
        }
      />

      {/* Backend Notice Banner */}
      {backendNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{backendNotice}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
            Nattu Client Mode
          </span>
        </div>
      )}

      {/* Error Card */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchActivitiesData()}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Loading server-driven activities list...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No activities found"
            description="Try changing your search filter or submit a new project/hackathon."
            icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((act) => (
            <div
              key={act.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Badge Strip */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{act.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {act.type}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
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

                {/* Title & Organization */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {act.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {act.organization || act.eventName || 'CSE Department'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {act.description}
                </p>

                {/* Explicit Rejection Reason */}
                {act.status === 'REJECTED' && act.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>HOD Rejection Reason:</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      {act.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Metadata details */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Team Roster:</span>
                    <strong className="text-slate-800">
                      {(act.teamMembers || []).map((m) => m.name.split(' ')[0]).join(', ')} ({(act.teamMembers || []).length} Members)
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Timeline:</span>
                    <span>{act.startDate} to {act.endDate}</span>
                  </div>
                  {act.guideName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Guide:</span>
                      <strong className="text-emerald-800">{act.guideName}</strong>
                    </div>
                  )}
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {(act.technologies || []).map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {act.reviewCount ? `${act.reviewCount} Reviews Scheduled` : 'Milestone Track'}
                </span>

                <div className="flex items-center gap-2">
                  {act.status === 'ACTIVE' && (
                    <Link href={`/student/od-requests/new?activityId=${act.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Apply for OD
                      </Button>
                    </Link>
                  )}

                  <Link href={`/student/projects/${act.id}`}>
                    <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                      View Activity Detail
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { activitiesApi } from '@/lib/api/activitiesApi';
import { ApiError } from '@/lib/api/odApi';
import { Activity } from '@/types';
import { Plus, Trophy, Sparkles, Calendar, Users, ArrowRight, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';

export default function StudentHackathonsPage() {
  const [hackathons, setHackathons] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  const fetchHackathons = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setBackendNotice(null);

    try {
      const res = await activitiesApi.getActivities({ type: 'HACKATHON' });
      if (res.data) setHackathons(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        setBackendNotice('Backend endpoint returned HTTP 404 (Endpoint not deployed). Displaying static reference records (LOCAL / UNPERSISTED PROTOTYPE DATA).');
        setHackathons(activitiesApi.getFallbackActivities('HACKATHON'));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    activitiesApi
      .getActivities({ type: 'HACKATHON' })
      .then((res) => {
        if (isMounted && res.data) setHackathons(res.data);
      })
      .catch((err: unknown) => {
        if (isMounted && err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
          setBackendNotice('Backend endpoint returned HTTP 404 (Endpoint not deployed). Displaying static reference records (LOCAL / UNPERSISTED PROTOTYPE DATA).');
          setHackathons(activitiesApi.getFallbackActivities('HACKATHON'));
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = hackathons.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.eventName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.organization || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Hackathons &amp; Coding Competitions"
        description="Submit hackathon registrations, team rosters, and track HOD participation clearance."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Hackathons', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc] inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#0a5c36]" />
            <span>{hackathons.length} Recorded Hackathons</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fetchHackathons(true)}
              disabled={isRefreshing || isLoading}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link href="/student/activities/new?type=HACKATHON">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Register Hackathon Entry
              </Button>
            </Link>
          </div>
        }
      />

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

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search hackathons by title, host..."
          className="w-full sm:w-96"
        />
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
          <Loader2 className="w-6 h-6 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Loading hackathons...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No hackathon entries found"
            description="Register a new national coding hackathon or competition for HOD signoff."
            icon={<Trophy className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((h) => (
            <div
              key={h.id}
              className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{h.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      h.status === 'APPROVED' || h.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : h.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{h.title}</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {h.organization || h.eventName || 'External Hackathon'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {h.description}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{h.startDate} to {h.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: {(h.teamMembers || []).map((m) => m.name.split(' ')[0]).join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/student/od-requests/new?activityId=${h.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Apply for OD
                  </Button>
                </Link>

                <Link href={`/student/projects/${h.id}`}>
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    View Detail
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

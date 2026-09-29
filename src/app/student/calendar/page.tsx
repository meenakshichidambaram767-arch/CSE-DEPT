'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { eventsApi } from '@/lib/api/eventsApi';
import { odApi, ApiError } from '@/lib/api/odApi';
import { ODEvent, ODApplication } from '@/types';
import StatusIndicator from '@/components/ui/StatusIndicator';
import {
  Calendar as CalendarIcon,
  MapPin,
  Users,
  RefreshCw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function StudentCalendarPage() {
  const [events, setEvents] = useState<ODEvent[]>([]);
  const [approvedODs, setApprovedODs] = useState<ODApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setErrorMsg(null);
    setBackendNotice(null);

    let hasBackend404 = false;

    try {
      const eventsRes = await eventsApi.getEvents();
      if (eventsRes.data) {
        setEvents(eventsRes.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        hasBackend404 = true;
        setEvents(eventsApi.getFallbackEvents());
      } else if (err instanceof ApiError) {
        setErrorMsg(err.message);
      }
    }

    try {
      const odsRes = await odApi.getODRequests({ status: 'APPROVED' });
      if (odsRes.data) {
        setApprovedODs(odsRes.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        hasBackend404 = true;
        setApprovedODs(odApi.getFallbackODs().filter((od) => od.status === 'APPROVED'));
      }
    }

    if (hasBackend404) {
      setBackendNotice('Backend endpoint returned 404. Displaying cached schedule and duty leave timeline.');
    }

    setIsRefreshing(false);
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      eventsApi.getEvents().catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
          return { data: eventsApi.getFallbackEvents(), is404: true };
        }
        throw err;
      }),
      odApi.getODRequests({ status: 'APPROVED' }).catch((err) => {
        if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
          return { data: odApi.getFallbackODs().filter((od) => od.status === 'APPROVED'), is404: true };
        }
        throw err;
      }),
    ])
      .then(([eventsResult, odsResult]) => {
        if (isMounted) {
          if (eventsResult?.data) setEvents(eventsResult.data);
          if (odsResult?.data) setApprovedODs(odsResult.data);
          if ((eventsResult as any)?.is404 || (odsResult as any)?.is404) {
            setBackendNotice('Backend endpoint returned 404. Displaying cached schedule and duty leave timeline.');
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setErrorMsg(err instanceof ApiError ? err.message : 'Failed to load calendar schedule.');
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

  return (
    <div className="space-y-6 max-w-3xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Student Calendar
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            My Schedule &amp; Approved Duty Leaves
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Chronological timeline of verified On-Duty activities and academic hackathons.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#dfe6dc] hover:bg-[#f2f9f1] text-[#172017] font-semibold text-xs rounded-md shadow-2xs transition-colors disabled:opacity-50"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0a5c36] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/student/apply-od"
            className="text-xs font-bold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
          >
            + Apply for OD
          </Link>
        </div>
      </div>

      {/* Backend Notice Banner */}
      {backendNotice && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{backendNotice}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
            Nattu Client Mode
          </span>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-[#dfe6dc] p-12 text-center space-y-3 shadow-2xs">
          <Loader2 className="w-6 h-6 text-[#0a5c36] animate-spin mx-auto" />
          <p className="text-xs text-[#586658] font-semibold">Loading student schedule &amp; approved duty leaves...</p>
        </div>
      ) : events.length === 0 && approvedODs.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-[#dfe6dc] p-12 text-center space-y-3 shadow-2xs">
          <CalendarIcon className="w-8 h-8 text-[#889688] mx-auto" />
          <h2 className="text-sm font-bold text-[#172017]">No Scheduled Events or Active OD Clearances</h2>
          <p className="text-xs text-[#586658] max-w-sm mx-auto">
            Your schedule timeline is currently clear. Check back later or apply for an On-Duty clearance.
          </p>
        </div>
      ) : (
        /* Events Timeline & Approved ODs */
        <div className="space-y-4">
          {/* Approved Duty Leaves Section */}
          {approvedODs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0a5c36]">
                <CheckCircle2 className="w-4 h-4 text-[#0a5c36]" />
                <span>My Verified Duty Leaves ({approvedODs.length})</span>
              </div>
              {approvedODs.map((od) => (
                <div
                  key={od.id}
                  className="bg-emerald-50/50 rounded-xl border border-emerald-200 p-4 space-y-2 shadow-2xs hover:border-[#0a5c36] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#0a5c36] bg-emerald-100 px-2 py-0.5 rounded uppercase border border-emerald-300">
                        {od.purpose} · {od.eventName}
                      </span>
                      <h2 className="text-sm font-bold text-[#172017]">
                        {od.reason}
                      </h2>
                    </div>
                    <StatusIndicator status="APPROVED" text="Approved Duty Leave" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-2 border-t border-emerald-200">
                    <span className="flex items-center gap-1.5 tabular-nums font-semibold text-[#172017]">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#0a5c36]" />
                      {od.date || od.startDate}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0a5c36]" />
                      {od.venue || 'CSE Department'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Department Events Schedule Timeline */}
          {events.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#172017]">
                <CalendarIcon className="w-4 h-4 text-[#0a5c36]" />
                <span>Department Academic Calendar ({events.length})</span>
              </div>
              {events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-xl border border-[#dfe6dc] p-5 space-y-3 shadow-2xs hover:border-[#0a5c36] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded uppercase">
                        {evt.purpose}
                      </span>
                      <h2 className="text-base font-bold text-[#172017]">
                        {evt.title}
                      </h2>
                    </div>
                    <StatusIndicator status={evt.status === 'CLOSED' ? 'REJECTED' : 'APPROVED'} text={evt.status || 'Upcoming'} />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#586658] pt-2 border-t border-[#edf2ea]">
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <CalendarIcon className="w-3.5 h-3.5 text-[#889688]" />
                      {evt.formattedDate || evt.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#889688]" />
                      {evt.venue}
                    </span>
                    <span className="flex items-center gap-1.5 tabular-nums">
                      <Users className="w-3.5 h-3.5 text-[#889688]" />
                      {evt.studentCount || 0} participating students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

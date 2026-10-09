'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { reportsApi, StudentReportSummary } from '@/lib/api/reportsApi';
import { documentsApi } from '@/lib/api/documentsApi';
import { ApiError } from '@/lib/api/odApi';
import {
  FileSpreadsheet,
  Download,
  Printer,
  FolderKanban,
  FileCheck,
  Calendar,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

export default function StudentReportsPage() {
  const [reportData, setReportData] = useState<StudentReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [backendNotice, setBackendNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('ALL');
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const fetchReportSummary = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMsg(null);
    setBackendNotice(null);

    try {
      const res = await reportsApi.getStudentReportSummary();
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
        setBackendNotice(
          'Backend endpoint GET /api/v1/me returned HTTP 404 (Endpoint not deployed). Displaying static reference report (LOCAL / UNPERSISTED PROTOTYPE DATA).'
        );
        setReportData(reportsApi.getFallbackStudentReport());
      } else if (err instanceof ApiError) {
        if (err.status === 403) {
          setErrorMsg('HTTP 403 Forbidden: You are not authorized to view this student report.');
        } else {
          setErrorMsg(err.message);
        }
      } else {
        setErrorMsg('Failed to load student report summary from server.');
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    reportsApi
      .getStudentReportSummary()
      .then((res) => {
        if (isMounted && res.data) setReportData(res.data);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
            setBackendNotice(
              'Backend endpoint GET /api/v1/me returned HTTP 404 (Endpoint not deployed). Displaying static reference report (LOCAL / UNPERSISTED PROTOTYPE DATA).'
            );
            setReportData(reportsApi.getFallbackStudentReport());
          } else if (err instanceof ApiError) {
            setErrorMsg(err.status === 403 ? 'HTTP 403: Authorization failure.' : err.message);
          } else {
            setErrorMsg('Failed to load student report.');
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadSecureDoc = async (docId: string) => {
    setDownloadingDocId(docId);
    try {
      const res = await documentsApi.getSignedUrl(docId);
      if (res?.signedUrl) {
        window.open(res.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to get signed document URL:', err);
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handlePrintTranscript = () => {
    window.print();
  };

  const student = reportData?.student;
  const metrics = reportData?.metrics;
  const activities = reportData?.activities || [];
  const odRequests = reportData?.odRequests || [];
  const reviews = reportData?.reviews || [];

  const tabItems = [
    { id: 'ALL', label: 'All Records' },
    { id: 'ACTIVITIES', label: `Activities (${activities.length})` },
    { id: 'OD_REQUESTS', label: `OD Requests (${odRequests.length})` },
    { id: 'REVIEWS', label: `Weekly Reviews (${reviews.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12 print:p-0 print:m-0 print:max-w-none">
      {/* Page Header */}
      <div className="print:hidden">
        <PageHeader
          title="My Academic & Activity Report"
          description="Isolated transcript report summarizing capstone projects, corporate internships, hackathons, OD history, and review attendance."
          breadcrumbs={[
            { label: 'Dashboard', href: '/student/dashboard' },
            { label: 'Academic Report', current: true },
          ]}
          badge={
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Session Authenticated Record</span>
            </span>
          }
          primaryAction={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchReportSummary(true)}
                disabled={isRefreshing || isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-2xs transition-colors disabled:opacity-50"
                title="Refresh report data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintTranscript}
                leftIcon={<Printer className="w-4 h-4 text-slate-700" />}
              >
                Print Transcript
              </Button>
            </div>
          }
        />
      </div>

      {/* Backend Notice Banner */}
      {backendNotice && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs print:hidden">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{backendNotice}</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
            Nattu Client Mode
          </span>
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-center justify-between gap-2 shadow-2xs print:hidden">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchReportSummary()}
            className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold rounded"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center shadow-2xs space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-800 animate-spin mx-auto" />
          <p className="text-xs text-slate-600 font-semibold">Loading student record transcript...</p>
        </div>
      ) : !reportData ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="Student Report Unavailable"
            description="Unable to retrieve authenticated student report details."
            icon={<FileSpreadsheet className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Profile Card (Factual Record Header) */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#064024] text-white font-black text-xl flex items-center justify-center shadow-sm">
                  {student?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900">{student?.name}</h1>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {student?.registerNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Department of {student?.department || 'Computer Science & Engineering'} • Year {student?.year || 'II'} (Sec {student?.section || 'A'})
                  </p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{student?.email}</p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Autonomous Institution
                </span>
                <strong className="text-xs text-slate-800 font-bold block">
                  Sri Shakthi Institute of Engineering &amp; Technology
                </strong>
                <span className="text-[11px] text-emerald-800 font-semibold">Academic Year 2026-2027</span>
              </div>
            </div>

            {/* 4 Summary Metrics (Factual Data Cards) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Total Activities
                </span>
                <strong className="text-xl font-black text-slate-900 block">
                  {metrics?.totalActivities || 0}
                </strong>
                <span className="text-[11px] text-emerald-700 font-medium">
                  {metrics?.completedProjects || 0} Capstones • {metrics?.approvedInternships || 0} Internships
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Hackathon Entries
                </span>
                <strong className="text-xl font-black text-slate-900 block">
                  {metrics?.hackathonEntries || 0}
                </strong>
                <span className="text-[11px] text-purple-700 font-medium">National / State events</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  On-Duty (OD) Days
                </span>
                <strong className="text-xl font-black text-emerald-800 block">
                  {metrics?.approvedODDays || 0} Days
                </strong>
                <span className="text-[11px] text-slate-500 font-medium">
                  Across {metrics?.totalODRequests || 0} requests
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Reviews Attended
                </span>
                <strong className="text-xl font-black text-slate-900 block">
                  {metrics?.reviewsAttended || 0}
                </strong>
                <span className="text-[11px] text-emerald-700 font-medium">Verified attendance</span>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="print:hidden">
            <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />
          </div>

          {/* Section 1: Activities Record */}
          {(activeTab === 'ALL' || activeTab === 'ACTIVITIES') && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-emerald-800" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Registered Activity Proposals ({activities.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Capstones • Hackathons • Internships</span>
              </div>

              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No registered activities found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {activities.map((act) => (
                    <div key={act.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">{act.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {act.type}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            act.status === 'APPROVED' || act.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : act.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {act.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                        <p className="text-[11px] text-slate-500">{act.organization || act.eventName || 'CSE Department'}</p>
                      </div>

                      {act.proofDocName && (
                        <div className="shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            isLoading={downloadingDocId === act.id}
                            onClick={() => handleDownloadSecureDoc(act.id)}
                            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-700" />}
                            className="text-xs"
                          >
                            {act.proofDocName}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2: OD Requests History */}
          {(activeTab === 'ALL' || activeTab === 'OD_REQUESTS') && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-indigo-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    On-Duty (OD) Application Records ({odRequests.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400 font-medium">Official Attendance Relief</span>
              </div>

              {odRequests.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No OD requests found.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {odRequests.map((od) => (
                    <div key={od.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">{od.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {od.purpose}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            od.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : od.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {od.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{od.eventName}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Date: {od.date || `${od.startDate} to ${od.endDate}`} • Venue: {od.venue || 'External'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 block">{od.totalDays || 1} Day(s)</span>
                        <span className="text-[10px] text-slate-400 font-mono">Submitted: {od.submittedDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 3: Weekly Review Attendance & Progress Records */}
          {(activeTab === 'ALL' || activeTab === 'REVIEWS') && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-700" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Weekly Review Attendance &amp; Milestone Logs ({reviews.length})
                  </h3>
                </div>
                <span className="text-xs text-purple-700 font-medium">Non-Evaluative Progress Log</span>
              </div>

              {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No review sessions recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">{rev.code || rev.id}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                            Review #{rev.reviewNumber}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            rev.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {rev.status}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{rev.activityTitle || `Capstone Review #${rev.reviewNumber}`}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {rev.date} at {rev.time} ({rev.venue})
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {rev.progress ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Progress Logged
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700">Pending Progress</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

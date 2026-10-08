'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SearchBar } from '@/components/common/SearchBar';
import { MetricCard } from '@/components/common/MetricCard';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  AccreditationReportContract,
  ReportsSummaryContract,
  formatApiErrorMessage,
} from '@/lib/api';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  FolderKanban,
  Trophy,
  BriefcaseBusiness,
  FileCheck,
  CheckCircle2,
  Calendar,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export default function HodReportsPage() {
  const { fetchAccreditationReport, fetchReportsSummary, exportAccreditationReportCSV } = useData();
  const { showToast } = useToast();

  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [report, setReport] = useState<AccreditationReportContract | null>(null);
  const [summary, setSummary] = useState<ReportsSummaryContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch contract-compliant report and summary
  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setReportError(null);
    try {
      const [accReport, repSummary] = await Promise.all([
        fetchAccreditationReport(academicYear),
        fetchReportsSummary(academicYear),
      ]);
      setReport(accReport);
      setSummary(repSummary);
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      setReportError(msg);
      setReport(null);
      setSummary(null);
      showToast('Report Query Failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [academicYear, fetchAccreditationReport, fetchReportsSummary, showToast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Handle Export CSV Action
  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const csvString = await exportAccreditationReportCSV(academicYear);
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const filename = `SIET_CSE_NAAC_Accreditation_${academicYear}_${Date.now()}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Report Exported', `Generated ${filename}`, 'success');
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      showToast('Export Failed', msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="NAAC / NBA Accreditation Reports"
        description="Standardized department accreditation metrics and audit verification records."
        breadcrumbs={[
          { label: 'HOD', href: '/hod/dashboard' },
          { label: 'NAAC / NBA Reports', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic Year {academicYear}</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isExporting || isLoading || !report}
              leftIcon={
                isExporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-emerald-700" />
                )
              }
              className="text-xs font-semibold"
            >
              {isExporting ? 'Exporting...' : 'Export Audit CSV'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPdfModalOpen(true)}
              disabled={isLoading || !report}
              leftIcon={<Printer className="w-4 h-4" />}
              className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
            >
              Generate NAAC Report (PDF)
            </Button>
          </div>
        }
      />

      {/* 2. Academic Year Selector Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Select Academic Cycle:
          </span>
          <div className="flex items-center gap-1.5">
            {['2026-2027', '2025-2026', '2024-2025'].map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setAcademicYear(yr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  academicYear === yr
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {report && (
          <span className="text-xs text-slate-500 font-medium">
            Department: <strong>{report.department}</strong>
          </span>
        )}
      </div>

      {/* 3. Loading, Error, or Metrics Presentation */}
      {isLoading ? (
        <div className="p-16 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Compiling department accreditation metrics...
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Querying criteria 1.3.2, 5.3.1, 1.3.3 and OD clearance data
          </p>
        </div>
      ) : reportError ? (
        <div className="p-12 text-center max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Accreditation Report Unavailable
          </h3>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-4">{reportError}</p>
          <Button variant="outline" size="sm" onClick={loadReports} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Retry Request
          </Button>
        </div>
      ) : report ? (
        <>
          {/* NAAC / NBA Criteria Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <MetricCard
              label="Criterion 1.3.2"
              value={report.metrics.criteria_1_3_2.count}
              description={`${report.metrics.criteria_1_3_2.label} (${report.metrics.criteria_1_3_2.active_capstones || 0} active)`}
              icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
              variant="highlight"
            />
            <MetricCard
              label="Criterion 5.3.1"
              value={report.metrics.criteria_5_3_1.count}
              description={`${report.metrics.criteria_5_3_1.label} (${report.metrics.criteria_5_3_1.unique_students || 0} students)`}
              icon={<Trophy className="w-5 h-5 text-amber-600" />}
            />
            <MetricCard
              label="Criterion 1.3.3"
              value={report.metrics.criteria_1_3_3.count}
              description={`${report.metrics.criteria_1_3_3.label} (${report.metrics.criteria_1_3_3.verified || 0} verified)`}
              icon={<BriefcaseBusiness className="w-5 h-5 text-indigo-600" />}
            />
            <MetricCard
              label="Criterion 5.3.3"
              value={report.metrics.total_approved_od_clearances}
              description="Total Approved OD Clearances"
              icon={<FileCheck className="w-5 h-5 text-purple-600" />}
            />
          </div>

          {/* Department Audit Breakdown Table */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Accreditation Metrics Verification Breakdown
                </h3>
                <p className="text-xs text-slate-400">
                  Cycle: {report.academic_year} • Department of {report.department}
                </p>
              </div>

              <div className="max-w-xs">
                <SearchBar
                  value={searchQuery}
                  onChange={(v) => setSearchQuery(v)}
                  placeholder="Filter criteria descriptions..."
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">NAAC / NBA Code</th>
                    <th className="py-3 px-4">Criteria Description</th>
                    <th className="py-3 px-4 text-center">Verified Count</th>
                    <th className="py-3 px-4">Sub-Metric Verification</th>
                    <th className="py-3 px-4 text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-800 dark:text-emerald-400">
                      Criterion 1.3.2
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {report.metrics.criteria_1_3_2.label}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                      {report.metrics.criteria_1_3_2.count}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {report.metrics.criteria_1_3_2.active_capstones} Active Capstones
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Endorsed
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-800 dark:text-amber-400">
                      Criterion 5.3.1
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {report.metrics.criteria_5_3_1.label}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                      {report.metrics.criteria_5_3_1.count}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {report.metrics.criteria_5_3_1.unique_students} Unique Participating Students
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Endorsed
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-800 dark:text-indigo-400">
                      Criterion 1.3.3
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {report.metrics.criteria_1_3_3.label}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                      {report.metrics.criteria_1_3_3.count}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {report.metrics.criteria_1_3_3.verified} Verified Industry NOCs Issued
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Endorsed
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-800 dark:text-purple-400">
                      Criterion 5.3.3
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      Total Approved OD Clearances
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-sm text-slate-900 dark:text-slate-100">
                      {report.metrics.total_approved_od_clearances}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      Department-wide On-Duty Attendance Endorsements
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Endorsed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {summary && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
                <span>
                  Total Department Activities: <strong>{summary.total_activities}</strong>
                </span>
                <span>
                  Completed Reviews: <strong>{summary.total_completed_reviews}</strong>
                </span>
                <span>
                  Total OD Clearances: <strong>{summary.total_approved_ods}</strong>
                </span>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* 4. PDF Preview Modal */}
      <Dialog
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Department NAAC / NBA Accreditation Dossier"
        variant="information"
        confirmLabel="Print / Save PDF"
        onConfirm={() => {
          setIsPdfModalOpen(false);
          window.print();
        }}
        cancelLabel="Close"
      >
        <div className="space-y-4 text-xs font-sans">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
            <h4 className="font-bold text-sm">Sri Shakthi Institute of Engineering and Technology</h4>
            <p className="text-[11px] text-emerald-800 font-semibold">
              Department of Computer Science and Engineering • Accreditation Audit {academicYear}
            </p>
          </div>

          <div className="space-y-2 border-y border-slate-200 py-3">
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-600">NAAC Criterion 1.3.2 (Capstone Projects):</span>
              <strong className="text-slate-900">{report?.metrics.criteria_1_3_2.count || 0}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-600">NAAC Criterion 5.3.1 (Hackathon Entries):</span>
              <strong className="text-slate-900">{report?.metrics.criteria_5_3_1.count || 0}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-600">NAAC Criterion 1.3.3 (Internship Clearances):</span>
              <strong className="text-slate-900">{report?.metrics.criteria_1_3_3.count || 0}</strong>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-medium text-slate-600">Approved OD Attendance Clearances:</span>
              <strong className="text-slate-900">{report?.metrics.total_approved_od_clearances || 0}</strong>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Certified by Head of the Department (CSE) for submission to Institutional Quality Assurance Cell (IQAC).
          </p>
        </div>
      </Dialog>
    </div>
  );
}

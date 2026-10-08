'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { SearchBar } from '@/components/common/SearchBar';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  StudentRecordContract,
  StudentSummaryResponse,
  AcademicYearContract,
  SectionContract,
  formatApiErrorMessage,
} from '@/lib/api';
import {
  GraduationCap,
  Download,
  Filter,
  FileCheck,
  FolderKanban,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Building,
  User,
  Calendar,
  AlertCircle,
  RefreshCw,
  X,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function HodRecordsPage() {
  const { fetchStudentRecords, fetchStudentSummary, exportStudentRecords } = useData();
  const { showToast } = useToast();

  // Filters & Pagination State
  const [yearFilter, setYearFilter] = useState<'ALL' | AcademicYearContract>('ALL');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | SectionContract>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Data Loading States
  const [students, setStudents] = useState<StudentRecordContract[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Export State
  const [isExporting, setIsExporting] = useState(false);

  // Slide-over / Detail Drawer State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<StudentSummaryResponse | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Fetch paginated student records
  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await fetchStudentRecords({
        year: yearFilter !== 'ALL' ? yearFilter : undefined,
        section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
        search: searchQuery.trim().length > 0 ? searchQuery : undefined,
        page: currentPage,
        page_size: pageSize,
      });
      setStudents(res.students);
      setTotalRecords(res.total);
      setTotalPages(res.total_pages);
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      setLoadError(msg);
      showToast('Error Loading Records', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchStudentRecords, yearFilter, sectionFilter, searchQuery, currentPage, pageSize, showToast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Handle Year Change
  const handleYearChange = (year: 'ALL' | AcademicYearContract) => {
    setYearFilter(year);
    setCurrentPage(1);
  };

  // Handle Section Change
  const handleSectionChange = (sec: 'ALL' | SectionContract) => {
    setSectionFilter(sec);
    setCurrentPage(1);
  };

  // Open Student Detail Slide-Over
  const handleOpenSummary = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setIsSummaryLoading(true);
    setSummaryError(null);
    setSummaryData(null);
    try {
      const summary = await fetchStudentSummary(studentId);
      setSummaryData(summary);
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      setSummaryError(msg);
      showToast('Summary Load Failed', msg, 'error');
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Close Summary Drawer
  const handleCloseSummary = () => {
    setSelectedStudentId(null);
    setSummaryData(null);
    setSummaryError(null);
  };

  // CSV Export Action
  const handleExportCSV = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const csvString = await exportStudentRecords({
        year: yearFilter !== 'ALL' ? yearFilter : undefined,
        section: sectionFilter !== 'ALL' ? sectionFilter : undefined,
        search: searchQuery.trim().length > 0 ? searchQuery : undefined,
      });

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const filename = `siet_cse_student_records_${yearFilter}_${sectionFilter}_${Date.now()}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Export Successful', `Exported ${totalRecords} records to ${filename}`, 'success');
    } catch (err: unknown) {
      const msg = formatApiErrorMessage(err);
      showToast('Export Failed', msg, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Header & Actions */}
      <PageHeader
        title="Student Records Directory"
        description="Comprehensive Department Student Roster, Clearances & Activity Profiles"
        breadcrumbs={[
          { label: 'HOD', href: '/hod/dashboard' },
          { label: 'Student Records', current: true },
        ]}
        badge={
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic Database</span>
          </span>
        }
        primaryAction={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || totalRecords === 0}
            leftIcon={
              isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-700" />
              )
            }
          >
            {isExporting ? 'Exporting...' : 'Export Directory (CSV)'}
          </Button>
        }
      />

      {/* 2. Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by student name, register number, or email..."
            />
          </div>

          {/* Academic Year Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Year:
            </span>
            {(['ALL', 'I', 'II', 'III', 'IV'] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => handleYearChange(yr)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  yearFilter === yr
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {yr === 'ALL' ? 'All Years' : `Year ${yr}`}
              </button>
            ))}
          </div>

          {/* Section Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">Sec:</span>
            {(['ALL', 'A', 'B', 'C', 'D', 'E'] as const).map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleSectionChange(sec)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  sectionFilter === sec
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {sec === 'ALL' ? 'All' : `Sec ${sec}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Records Table & State Presentation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Retrieving student records from registry...
            </p>
            <p className="text-xs text-slate-400 mt-1">Applying filters and pagination parameters</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Failed to Load Records</h3>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 mb-4">{loadError}</p>
            <Button variant="outline" size="sm" onClick={loadRecords} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
              Retry Query
            </Button>
          </div>
        ) : students.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No Student Records Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              No registered students match the selected year, section, or search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Register Number</th>
                  <th className="py-3 px-4">Class</th>
                  <th className="py-3 px-4 text-center">Approved ODs</th>
                  <th className="py-3 px-4 text-center">Activities</th>
                  <th className="py-3 px-4 text-center">Reviews</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {student.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{student.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      {student.register_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        Year {student.year} • Sec {student.section}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60">
                        <FileCheck className="w-3 h-3" />
                        {student.approved_od_count}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200/60">
                        <FolderKanban className="w-3 h-3" />
                        {student.activity_count}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200/60">
                        <ClipboardCheck className="w-3 h-3" />
                        {student.review_count}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenSummary(student.id)}
                        leftIcon={<Eye className="w-3.5 h-3.5 text-emerald-700" />}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination Bar */}
        {!isLoading && totalRecords > 0 && (
          <div className="py-3 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500">
              Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalRecords}</span> students
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Student Summary Slide-Over Drawer */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={handleCloseSummary}
          />

          {/* Slide-over Panel */}
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Student Department Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseSummary}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer"
                aria-label="Close Profile"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {isSummaryLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading student summary &amp; clearance history...</p>
                </div>
              ) : summaryError ? (
                <div className="p-6 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <span>Summary Query Failed</span>
                  </div>
                  <p>{summaryError}</p>
                </div>
              ) : summaryData ? (
                <>
                  {/* Profile Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          {summaryData.student.name}
                        </h4>
                        <p className="text-xs font-mono font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {summaryData.student.register_number}
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        Year {summaryData.student.year} • Sec {summaryData.student.section}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{summaryData.student.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Department of {summaryData.student.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section A: Approved On-Duty Clearances */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                        <span>Approved OD Clearances ({summaryData.od_clearances.length})</span>
                      </h4>
                    </div>

                    {summaryData.od_clearances.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No approved OD clearances on file.</p>
                    ) : (
                      <div className="space-y-2">
                        {summaryData.od_clearances.map((od) => (
                          <div
                            key={od.id}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{od.event_name}</p>
                              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" /> Date: {od.date}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {od.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section B: Activity Participation */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <FolderKanban className="w-3.5 h-3.5 text-blue-600" />
                        <span>Activity Participation ({summaryData.activities.length})</span>
                      </h4>
                    </div>

                    {summaryData.activities.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No activity submissions logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {summaryData.activities.map((act) => (
                          <div
                            key={act.id}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">{act.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {act.type} • {act.role || 'Member'}
                              </p>
                            </div>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              {act.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Section C: Review History */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <ClipboardCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span>Milestone Reviews ({summaryData.reviews.length})</span>
                      </h4>
                    </div>

                    {summaryData.reviews.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No review sessions logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {summaryData.reviews.map((rev) => (
                          <div
                            key={rev.id}
                            className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/70 text-xs flex items-center justify-between"
                          >
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100">
                                {rev.review_type.replace('_', ' ')}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">{rev.date}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {rev.attended ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5" /> Present
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                  {rev.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex justify-end">
              <Button variant="outline" size="sm" onClick={handleCloseSummary}>
                Close Profile
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

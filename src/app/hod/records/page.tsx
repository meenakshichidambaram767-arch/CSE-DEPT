'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { mockUsers } from '@/data/mock';
import {
  Search,
  Download,
  X,
  ArrowRight,
  GraduationCap,
  Sparkles,
  Calendar,
  FileText,
  Building2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FolderGit2,
} from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { ODApplication, User } from '@/types';

// Normalized Year Type
type YearKey = 'I' | 'II' | 'III' | 'IV';

interface YearConfig {
  key: YearKey;
  label: string;
  subLabel: string;
}

const YEARS: YearConfig[] = [
  { key: 'I', label: '1st Year', subLabel: 'B.E CSE · Year I' },
  { key: 'II', label: '2nd Year', subLabel: 'B.E CSE · Year II' },
  { key: 'III', label: '3rd Year', subLabel: 'B.E CSE · Year III' },
  { key: 'IV', label: '4th Year', subLabel: 'B.E CSE · Year IV' },
];

export default function HODRecordsPage() {
  const { odApplications, getStudentStats } = useData();

  // Progressive Drill-down State
  const [selectedYear, setSelectedYear] = useState<YearKey>('II');
  const [selectedSection, setSelectedSection] = useState<string>('ALL'); // 'ALL' | 'A' | 'B'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedStudent) {
        setSelectedStudent(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStudent]);

  // Lock body scroll when drawer open
  useEffect(() => {
    if (selectedStudent) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedStudent]);

  // Filter students by Year & Section & Search
  const students = useMemo(() => {
    return mockUsers.filter((u) => u.role === 'STUDENT');
  }, []);

  // Compute summary stats per year for Level 1 cards
  const yearStats = useMemo(() => {
    const map: Record<YearKey, { totalStudents: number; activeODs: number }> = {
      I: { totalStudents: 0, activeODs: 0 },
      II: { totalStudents: 0, activeODs: 0 },
      III: { totalStudents: 0, activeODs: 0 },
      IV: { totalStudents: 0, activeODs: 0 },
    };

    students.forEach((s) => {
      const yr = (s.year as YearKey) || 'II';
      if (map[yr]) {
        map[yr].totalStudents += 1;
      }
    });

    odApplications.forEach((od) => {
      const yr = (od.year as YearKey) || 'II';
      if (map[yr]) {
        map[yr].activeODs += 1;
      }
    });

    return map;
  }, [students, odApplications]);

  // Filter students for the currently selected Year & Section & Search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      // Year match
      if (s.year !== selectedYear) return false;

      // Section match
      if (selectedSection !== 'ALL' && s.section && s.section !== selectedSection) {
        return false;
      }

      // Search match (name, register number, or associated project/event)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(q);
        const matchReg = s.registerNumber?.toLowerCase().includes(q) || false;

        // Also check if any of their OD events match search
        const hasMatchingOD = odApplications.some(
          (od) =>
            od.studentRegNo === s.registerNumber &&
            (od.eventName.toLowerCase().includes(q) ||
              od.projectName?.toLowerCase().includes(q) ||
              od.purpose?.toLowerCase().includes(q))
        );

        return matchName || matchReg || hasMatchingOD;
      }

      return true;
    });
  }, [students, selectedYear, selectedSection, searchTerm, odApplications]);

  // Helper to get active category and ODs for a student
  const getStudentCategoryData = (regNo?: string) => {
    if (!regNo) return { ods: [], primaryOD: null, category: 'ACADEMIC', title: 'Curriculum & Lab' };
    const ods = odApplications.filter((od) => od.studentRegNo === regNo);
    const primaryOD = ods[0] || null;

    let category = 'PROJECT';
    let title = 'General Academic Track';

    if (primaryOD) {
      category = primaryOD.purpose || 'EVENT';
      title =
        primaryOD.projectName ||
        primaryOD.hackathonName ||
        primaryOD.companyName ||
        primaryOD.eventName ||
        'Active Technical OD';
    }

    return { ods, primaryOD, category, title };
  };

  // Export CSV for currently filtered Year & Section
  const handleExportCSV = () => {
    const headers = [
      'Student Name',
      'Register No',
      'Year',
      'Section',
      'Active Category',
      'Key Project / Event',
      'OD Status',
      'Total ODs',
      'Attendance %',
    ];

    const rows = filteredStudents.map((s) => {
      const { category, title, primaryOD, ods } = getStudentCategoryData(s.registerNumber);
      const stats = s.registerNumber ? getStudentStats(s.registerNumber) : null;
      return [
        `"${s.name}"`,
        `"${s.registerNumber || ''}"`,
        `"${s.year || ''}"`,
        `"${s.section || 'A'}"`,
        `"${category}"`,
        `"${title}"`,
        `"${primaryOD?.status || 'CLEARED'}"`,
        `"${ods.length}"`,
        `"${stats?.attendanceRate || '89.4%'}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `SIET_CSE_Records_Year_${selectedYear}_Sec_${selectedSection}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute counts for section tabs
  const sectionCounts = useMemo(() => {
    const yrStudents = students.filter((s) => s.year === selectedYear);
    const countA = yrStudents.filter((s) => s.section === 'A').length;
    const countB = yrStudents.filter((s) => s.section === 'B').length;
    return {
      all: yrStudents.length,
      a: countA,
      b: countB,
    };
  }, [students, selectedYear]);

  // Selected student's full data for Slide-over drawer
  const studentDrawerData = useMemo(() => {
    if (!selectedStudent) return null;
    const regNo = selectedStudent.registerNumber;
    const { ods, primaryOD, category, title } = getStudentCategoryData(regNo);
    const stats = regNo ? getStudentStats(regNo) : null;
    return {
      student: selectedStudent,
      ods,
      primaryOD,
      category,
      title,
      stats,
    };
  }, [selectedStudent]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Autonomous · Department Directory
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Records &amp; Student Directory
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Progressive directory of all 4 years, sections, active category assignments, and OD records.
          </p>
        </div>

        {/* Quiet Export Action */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-[#f2f9f1] text-[#172017] text-xs font-semibold rounded-md border border-[#dfe6dc] shadow-2xs transition-colors flex items-center gap-1.5"
            title="Download CSV for current Year and Section"
          >
            <Download className="w-3.5 h-3.5 text-[#0a5c36]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* LEVEL 1: All 4 Years Displayed as Clean, Non-Overwhelming Cards */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#586658]">
          Step 1: Select Academic Year
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {YEARS.map((yr) => {
            const isSelected = selectedYear === yr.key;
            const stats = yearStats[yr.key];

            return (
              <button
                key={yr.key}
                type="button"
                onClick={() => {
                  setSelectedYear(yr.key);
                  setSelectedSection('ALL'); // Reset section on year switch
                }}
                className={`relative p-3.5 sm:p-4 rounded-xl text-left border transition-all ${
                  isSelected
                    ? 'bg-[#eaf7e8] border-[#0a5c36] shadow-xs'
                    : 'bg-white border-[#dfe6dc] hover:border-[#b4c7b2] hover:bg-[#fafdf9]'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#0a5c36]" />
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-[#172017]">
                  <GraduationCap
                    className={`w-4 h-4 ${isSelected ? 'text-[#0a5c36]' : 'text-[#889688]'}`}
                  />
                  <span>{yr.label}</span>
                </div>
                <div className="text-[11px] text-[#586658] mt-0.5">{yr.subLabel}</div>

                <div className="mt-3 pt-2.5 border-t border-[#dfe6dc]/60 flex items-center justify-between text-[10px] text-[#586658]">
                  <span>
                    <strong className="text-[#172017] font-semibold">{stats.totalStudents}</strong>{' '}
                    Students
                  </span>
                  <span className="font-semibold text-[#0a5c36] bg-white/80 px-1.5 py-0.5 rounded border border-[#dfe6dc]">
                    {stats.activeODs} ODs
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* LEVEL 2: Section Tabs (All Sections, CSE-A, CSE-B) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-1.5 bg-[#edf2ea] p-1 rounded-lg border border-[#dfe6dc] w-fit">
          <button
            type="button"
            onClick={() => setSelectedSection('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedSection === 'ALL'
                ? 'bg-white text-[#0a5c36] shadow-2xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            All Sections ({sectionCounts.all})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSection('A')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedSection === 'A'
                ? 'bg-white text-[#0a5c36] shadow-2xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            Section CSE-A ({sectionCounts.a})
          </button>
          <button
            type="button"
            onClick={() => setSelectedSection('B')}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              selectedSection === 'B'
                ? 'bg-white text-[#0a5c36] shadow-2xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            Section CSE-B ({sectionCounts.b})
          </button>
        </div>

        {/* Quick Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
          <input
            type="text"
            placeholder="Search student or project..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white text-xs text-[#172017] placeholder:text-[#889688] rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] transition-colors"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#889688] hover:text-[#172017]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* LEVEL 3: Students Roster with Active Category & OD Status */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] shadow-2xs overflow-hidden">
        <div className="px-4 py-3 bg-[#fafdf9] border-b border-[#dfe6dc] flex items-center justify-between">
          <div className="text-xs font-bold text-[#172017]">
            {YEARS.find((y) => y.key === selectedYear)?.label} Students
            {selectedSection !== 'ALL' && ` · Section CSE-${selectedSection}`}
            <span className="ml-2 font-normal text-[#586658]">
              ({filteredStudents.length} matching)
            </span>
          </div>
          <div className="text-[11px] text-[#586658]">Click any student to view full details</div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="p-10 text-center text-xs text-[#889688]">
            No students found in {YEARS.find((y) => y.key === selectedYear)?.label}
            {selectedSection !== 'ALL' ? ` (Section ${selectedSection})` : ''} matching &ldquo;
            {searchTerm}&rdquo;.
          </div>
        ) : (
          <div className="divide-y divide-[#edf2ea]">
            {filteredStudents.map((s) => {
              const { category, title, primaryOD, ods } = getStudentCategoryData(s.registerNumber);
              const stats = s.registerNumber ? getStudentStats(s.registerNumber) : null;
              const hasConflict = primaryOD?.conflict?.hasConflict;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#f2f9f1] transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar + Student Info */}
                  <div className="flex items-center gap-3 min-w-0 sm:w-1/3">
                    <div className="w-9 h-9 rounded-full bg-[#0a5c36] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-[#064024]">
                      {s.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-[#586658] font-mono tabular-nums">
                        {s.registerNumber} · Sec {s.section || 'A'}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Active Category & Key Project/Event */}
                  <div className="min-w-0 sm:flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#edf2ea] text-[#0a5c36] border border-[#dfe6dc]">
                        {category}
                      </span>
                      {hasConflict && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 inline-flex items-center gap-0.5">
                          <AlertCircle className="w-2.5 h-2.5" /> Conflict
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-[#172017] truncate mt-0.5">
                      {title}
                    </div>
                  </div>

                  {/* Right: OD Status & Details Button */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-[#edf2ea]">
                    <div className="text-right">
                      {primaryOD ? (
                        <StatusIndicator status={primaryOD.status} />
                      ) : (
                        <span className="text-[11px] font-medium text-[#586658]">No active OD</span>
                      )}
                      <div className="text-[10px] text-[#889688] mt-0.5 tabular-nums">
                        {ods.length} {ods.length === 1 ? 'record' : 'records'} ·{' '}
                        {stats?.attendanceRate || '89.4%'} attnd
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudent(s);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-[#0a5c36] bg-[#eaf7e8] hover:bg-[#d8edd6] rounded border border-[#c4dec1] transition-colors inline-flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* LEVEL 4: Slide-over Detail Drawer (Sheet Style) */}
      {selectedStudent && studentDrawerData && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity animate-in fade-in duration-150"
            onClick={() => setSelectedStudent(null)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-[#dfe6dc] z-10 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-[#dfe6dc] bg-[#fafdf9] flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#0a5c36] text-white font-bold text-sm flex items-center justify-center shrink-0 border border-[#064024]">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#172017]">{selectedStudent.name}</h2>
                  <div className="text-xs text-[#586658] font-mono tabular-nums">
                    {selectedStudent.registerNumber} · Year {selectedStudent.year} · Section{' '}
                    {selectedStudent.section || 'A'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                aria-label="Close details"
                className="p-1 rounded-md text-[#586658] hover:text-[#172017] hover:bg-[#edf2ea] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Academic Standing & Attendance Bar */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#f7f9f5] rounded-lg border border-[#dfe6dc]">
                <div>
                  <div className="text-[10px] font-bold text-[#586658] uppercase">
                    Academic Standing
                  </div>
                  <div className="text-xs font-bold text-[#0a5c36] mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {studentDrawerData.stats?.standing || 'Good Standing'}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#586658] uppercase">
                    Portal Attendance
                  </div>
                  <div className="text-xs font-bold text-[#172017] mt-0.5 tabular-nums">
                    {studentDrawerData.stats?.attendanceRate || '89.4%'} (Eligible)
                  </div>
                </div>
              </div>

              {/* Active Category & Work */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#586658] flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-[#0a5c36]" />
                  Active Category &amp; Project Work
                </div>
                <div className="p-4 rounded-xl border border-[#dfe6dc] bg-white space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
                      {studentDrawerData.category}
                    </span>
                    <span className="text-[11px] text-[#586658]">
                      {studentDrawerData.primaryOD?.location || 'Coimbatore'}
                    </span>
                  </div>

                  <div className="text-sm font-bold text-[#172017]">
                    {studentDrawerData.title}
                  </div>

                  {studentDrawerData.primaryOD?.reason && (
                    <p className="text-xs text-[#586658] leading-relaxed">
                      {studentDrawerData.primaryOD.reason}
                    </p>
                  )}

                  {studentDrawerData.primaryOD?.venue && (
                    <div className="text-[11px] text-[#586658] flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#889688]" />
                      <span>{studentDrawerData.primaryOD.venue}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* OD Clearance Records History */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#586658] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0a5c36]" />
                  OD Clearance History ({studentDrawerData.ods.length})
                </div>

                {studentDrawerData.ods.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-[#dfe6dc] text-xs text-[#889688] text-center">
                    No On-Duty applications logged yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentDrawerData.ods.map((od: ODApplication) => (
                      <div
                        key={od.id}
                        className="p-3.5 rounded-xl border border-[#dfe6dc] bg-white space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#172017] truncate">
                            {od.eventName}
                          </span>
                          <StatusIndicator status={od.status} />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#586658]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {od.date || od.startDate}
                          </span>
                          <span className="font-mono text-[10px]">{od.id}</span>
                        </div>

                        {od.remarks && (
                          <div className="text-[11px] text-[#0a5c36] bg-[#f2f9f1] px-2.5 py-1 rounded border border-[#dfe6dc]">
                            HOD Note: {od.remarks}
                          </div>
                        )}

                        {od.conflict?.hasConflict && (
                          <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Assessment Conflict:</strong> {od.conflict.conflictingEventName} on{' '}
                            {od.conflict.conflictingDate}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Attached Documents & Proofs */}
              {studentDrawerData.primaryOD?.proofDocName && (
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#586658] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
                    Verified Proof &amp; Attachments
                  </div>
                  <div className="p-3 rounded-lg border border-[#dfe6dc] bg-[#fafdf9] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#0a5c36] shrink-0" />
                      <span className="font-mono text-[#172017] truncate">
                        {studentDrawerData.primaryOD.proofDocName}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-[#0a5c36] bg-white px-2 py-0.5 rounded border border-[#dfe6dc]">
                      Verified
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#dfe6dc] bg-[#fafdf9] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="px-3.5 py-2 text-xs font-semibold text-[#586658] hover:text-[#172017] bg-white rounded-md border border-[#dfe6dc] transition-colors"
              >
                Close
              </button>

              <Link
                href={`/hod/students/${selectedStudent.registerNumber}`}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0a5c36] hover:bg-[#084c2c] rounded-md shadow-xs transition-colors flex items-center gap-1.5"
              >
                Open Full Dossier
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

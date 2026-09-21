'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Tabs } from '@/components/ui/Tabs';
import { Table, Column } from '@/components/ui/Table';
import { SearchBar } from '@/components/common/SearchBar';
import { MetricCard } from '@/components/common/MetricCard';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
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
  Filter,
  GraduationCap,
} from 'lucide-react';

export default function HodReportsPage() {
  const { activities, odApplications, projects, hackathons, internships } = useData();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [yearFilter, setYearFilter] = useState<'ALL' | 'II' | 'III' | 'IV'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Compute counts
  const approvedProjects = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED');
  const approvedHackathons = hackathons.filter((h) => h.status === 'ACTIVE' || h.status === 'APPROVED');
  const approvedInternships = internships.filter((i) => i.status === 'ACTIVE' || i.status === 'APPROVED');
  const approvedODs = odApplications.filter((o) => o.status === 'APPROVED');

  // Combined audit items
  const auditItems = [
    ...activities.map((a) => ({
      id: a.id,
      studentName: a.studentName,
      studentRegNo: a.studentRegNo,
      year: a.year || 'II',
      title: a.title,
      category: a.type,
      guideName: a.guideName || 'Dr. Priya Kumar',
      status: a.status,
      date: `${a.startDate} to ${a.endDate}`,
      naacCode: a.type === 'PROJECT' ? 'NAAC 1.3.2 (Capstone)' : a.type === 'HACKATHON' ? 'NAAC 5.3.1 (Sprint)' : 'NAAC 1.3.3 (Internship)',
    })),
    ...odApplications.map((o) => ({
      id: o.id,
      studentName: o.studentName,
      studentRegNo: o.studentRegNo,
      year: o.year || 'II',
      title: o.eventName,
      category: 'ON-DUTY (OD)',
      guideName: 'Dept Office',
      status: o.status,
      date: o.date,
      naacCode: 'NAAC 5.3.3 (OD Concession)',
    })),
  ];

  // Filter items
  const filteredItems = auditItems.filter((item) => {
    if (activeCategory === 'PROJECTS' && item.category !== 'PROJECT') return false;
    if (activeCategory === 'HACKATHONS' && item.category !== 'HACKATHON') return false;
    if (activeCategory === 'INTERNSHIPS' && item.category !== 'INTERNSHIP') return false;
    if (activeCategory === 'OD' && item.category !== 'ON-DUTY (OD)') return false;

    if (yearFilter !== 'ALL' && item.year !== yearFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.studentName.toLowerCase().includes(q) ||
        item.studentRegNo.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    }

    return true;
  });

  // Export CSV Action
  const handleExportCSV = () => {
    const headers = ['Record ID', 'Student Name', 'Reg No', 'Year', 'Category', 'Title', 'Guide', 'NAAC Criteria Code', 'Status', 'Date'];
    const rows = filteredItems.map((i) => [
      i.id,
      `"${i.studentName}"`,
      i.studentRegNo,
      i.year,
      i.category,
      `"${i.title}"`,
      `"${i.guideName}"`,
      i.naacCode,
      i.status,
      i.date,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIET_CSE_NAAC_Audit_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Audit Data Exported (CSV)', `${filteredItems.length} records exported successfully.`, 'success');
  };

  const columns: Column<(typeof auditItems)[0]>[] = [
    {
      key: 'id',
      header: 'ID',
      className: 'font-mono text-slate-500 w-24 text-xs',
      render: (row) => <span className="font-bold text-slate-700">{row.id}</span>,
    },
    {
      key: 'studentName',
      header: 'Student & Reg No',
      render: (row) => (
        <div>
          <strong className="text-slate-900 text-xs block font-bold">{row.studentName}</strong>
          <span className="text-[11px] text-slate-400 font-mono">{row.studentRegNo} • Yr {row.year}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Activity Title',
      render: (row) => (
        <div className="max-w-md">
          <span className="font-bold text-xs text-slate-900 block line-clamp-1">{row.title}</span>
          <span className="text-[10px] text-slate-500 font-mono">{row.naacCode}</span>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            row.category === 'PROJECT'
              ? 'bg-emerald-100 text-emerald-800'
              : row.category === 'HACKATHON'
              ? 'bg-amber-100 text-amber-800'
              : row.category === 'INTERNSHIP'
              ? 'bg-indigo-100 text-indigo-800'
              : 'bg-purple-100 text-purple-800'
          }`}
        >
          {row.category}
        </span>
      ),
    },
    {
      key: 'guideName',
      header: 'Guide',
      render: (row) => <span className="text-xs text-slate-700 font-medium">{row.guideName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
            row.status === 'ACTIVE' || row.status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800'
              : row.status === 'REJECTED'
              ? 'bg-red-100 text-red-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {row.status}
        </span>
      ),
    },
  ];

  const categoryTabs = [
    { id: 'ALL', label: `All (${auditItems.length})` },
    { id: 'PROJECTS', label: `Projects (${projects.length})` },
    { id: 'HACKATHONS', label: `Hackathons (${hackathons.length})` },
    { id: 'INTERNSHIPS', label: `Internships (${internships.length})` },
    { id: 'OD', label: `OD Concessions (${odApplications.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="NAAC / NBA Audit Report Generator"
        description="Generate standardized department accreditation metrics and 1-click audit reports."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'NAAC / NBA Reports', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic Audit 2026-27</span>
          </span>
        }
        primaryAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-3.5 h-3.5" />}
              className="text-xs font-semibold"
            >
              Export CSV Data
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPdfModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4" />}
              className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
            >
              Generate NAAC Report (PDF)
            </Button>
          </div>
        }
      />

      {/* 2. NAAC / NBA Criteria Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Criterion 1.3.2"
          value={approvedProjects.length}
          description="Approved Capstone Projects"
          icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
          variant="highlight"
        />
        <MetricCard
          label="Criterion 5.3.1"
          value={approvedHackathons.length}
          description="National Hackathon Entries"
          icon={<Trophy className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Criterion 1.3.3"
          value={approvedInternships.length}
          description="Corporate Internship NOCs"
          icon={<BriefcaseBusiness className="w-5 h-5 text-indigo-600" />}
        />
        <MetricCard
          label="Criterion 5.3.3"
          value={approvedODs.length}
          description="OD Attendance Clearances"
          icon={<FileCheck className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* 3. Filter Controls & Audit Data Table */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs tabs={categoryTabs} activeTab={activeCategory} onChange={(id) => setActiveCategory(id)} />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <span>Year:</span>
            </span>
            {(['ALL', 'II', 'III', 'IV'] as const).map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setYearFilter(yr)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                  yearFilter === yr
                    ? 'bg-amber-400 text-emerald-950 font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {yr === 'ALL' ? 'All' : `Yr ${yr}`}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <SearchBar
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder="Search audit records by student, reg no, or title..."
            className="flex-1 max-w-md"
          />

          <span className="text-xs font-mono text-slate-400">
            Showing {filteredItems.length} verified records
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={filteredItems}
            emptyState={
              <div className="p-8 text-center text-xs text-slate-400">
                No audit records match the selected filter.
              </div>
            }
          />
        </div>
      </div>

      {/* Printable NAAC Summary PDF Modal */}
      <Dialog
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="NAAC / NBA Accreditation Summary Report"
        variant="information"
        confirmLabel="Print / Download PDF"
        onConfirm={() => {
          showToast('Printing NAAC Audit Summary...', 'Document sent to printer/PDF exporter.', 'success');
          setIsPdfModalOpen(false);
        }}
        cancelLabel="Close"
      >
        <div className="space-y-4 text-xs font-serif p-2 bg-white text-slate-900 border border-slate-200 rounded-xl">
          {/* Institutional Letterhead */}
          <div className="text-center pb-3 border-b border-slate-300 space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-950 font-sans">
              Sri Shakthi Institute of Engineering and Technology (Autonomous)
            </h2>
            <h3 className="text-sm font-black text-slate-900 font-sans">
              DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
            </h3>
            <p className="text-[10px] text-slate-500 font-sans">
              Accredited with NAAC 'A' Grade • NBA Tier-1 • Anna University Affiliated
            </p>
          </div>

          <div className="space-y-2 font-sans text-xs">
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Report Type:</span>
              <strong className="text-slate-900">NAAC / NBA Department Audit Report</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Academic Year:</span>
              <strong>2026-2027</strong>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">HOD Endorsement:</span>
              <strong>Dr. Priya Kumar (Head of Department • CSE)</strong>
            </div>
          </div>

          {/* Criteria Breakdown Grid */}
          <div className="space-y-2 pt-2 font-sans">
            <h4 className="text-xs font-bold uppercase text-slate-700">Accreditation Summary Matrix</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">NAAC 1.3.2 (Capstone Projects)</span>
                <strong className="text-emerald-900 font-bold text-sm">{approvedProjects.length} Approved</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">NAAC 5.3.1 (Hackathons & Sprints)</span>
                <strong className="text-amber-900 font-bold text-sm">{approvedHackathons.length} Tracked</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">NAAC 1.3.3 (Corporate Internships)</span>
                <strong className="text-indigo-900 font-bold text-sm">{approvedInternships.length} NOC Issued</strong>
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-500 block">NAAC 5.3.3 (OD Concessions)</span>
                <strong className="text-purple-900 font-bold text-sm">{approvedODs.length} Granted</strong>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

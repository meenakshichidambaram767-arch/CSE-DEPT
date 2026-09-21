'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { SearchBar } from '@/components/common/SearchBar';
import { FilterDropdown, FilterGroup } from '@/components/common/FilterDropdown';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { FolderKanban, ExternalLink, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Activity } from '@/types';

export default function HodProjectsPage() {
  const { projects, approveActivity } = useData();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.studentRegNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.guideName && project.guideName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Activity>[] = [
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
          <span className="text-[11px] text-slate-400 font-mono">{row.studentRegNo}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Project Title',
      render: (row) => (
        <div className="max-w-md">
          <span className="font-bold text-xs text-slate-900 block line-clamp-1">
            {row.title}
          </span>
          <span className="text-[10px] text-emerald-700 font-medium">{row.category || 'CSE Project'}</span>
        </div>
      ),
    },
    {
      key: 'guideName',
      header: 'Faculty Guide',
      render: (row) => (
        <span className="text-xs text-slate-700 font-medium">
          {row.guideName || 'Dr. Priya Kumar'}
        </span>
      ),
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
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'SUBMITTED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                approveActivity(row.id);
                showToast(`Approved ${row.title}`, 'Status updated to ACTIVE.', 'success');
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-xs"
            >
              Approve
            </Button>
          )}
          <Link href={`/student/projects/${row.id}`}>
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />} className="text-xs">
              Details
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  const activeCount = projects.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
  const pendingCount = projects.filter((p) => p.status === 'SUBMITTED' || p.status === 'UNDER_REVIEW').length;
  const rejectedCount = projects.filter((p) => p.status === 'REJECTED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* 1. Page Header */}
      <PageHeader
        title="Department Projects"
        description="Monitor student capstone projects, guide assignments, and status clearances."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Projects', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{projects.length} Total Projects</span>
          </span>
        }
      />

      {/* 2. Metrics Overview Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Projects"
          value={projects.length}
          description="Registered capstones"
          icon={<FolderKanban className="w-5 h-5 text-emerald-600" />}
        />
        <MetricCard
          label="Active Projects"
          value={activeCount}
          description="Approved & ongoing"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
          variant="highlight"
        />
        <MetricCard
          label="Pending Review"
          value={pendingCount}
          description="Awaiting HOD approval"
          icon={<FolderKanban className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Revision Required"
          value={rejectedCount}
          description="Awaiting student update"
          icon={<FolderKanban className="w-5 h-5 text-red-600" />}
        />
      </div>

      {/* 3. Filter & Table Section */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <SearchBar
            value={searchQuery}
            onChange={(val) => setSearchQuery(val)}
            placeholder="Search by student name, title, or ID..."
            className="flex-1 w-full"
          />

          <FilterGroup className="w-full sm:w-auto">
            <FilterDropdown
              label="Status"
              selectedValue={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active / Approved' },
                { value: 'SUBMITTED', label: 'Pending Review' },
                { value: 'REJECTED', label: 'Revision Required' },
              ]}
            />
          </FilterGroup>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={filteredProjects}
            emptyState={
              <div className="p-8 text-center text-xs text-slate-400">
                No matching projects found.
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

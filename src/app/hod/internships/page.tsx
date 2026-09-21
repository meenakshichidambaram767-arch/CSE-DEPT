'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { MetricCard } from '@/components/common/MetricCard';
import { SearchBar } from '@/components/common/SearchBar';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { BriefcaseBusiness, Sparkles, ExternalLink } from 'lucide-react';
import { Activity } from '@/types';

export default function HodInternshipsPage() {
  const { internships, approveActivity } = useData();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.organization && i.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns: Column<Activity>[] = [
    {
      key: 'id',
      header: 'ID',
      className: 'font-mono text-slate-500 w-28 text-xs',
      render: (row) => <span className="font-semibold text-slate-700">{row.id}</span>,
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
      header: 'Company & Role',
      render: (row) => (
        <div className="max-w-md">
          <span className="font-bold text-xs text-slate-900 block line-clamp-1">
            {row.title}
          </span>
          <span className="text-[10px] text-indigo-700 font-medium">{row.organization}</span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Duration',
      render: (row) => (
        <span className="text-xs text-slate-600 font-mono">
          {row.startDate} to {row.endDate}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <span
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            row.status === 'APPROVED' || row.status === 'ACTIVE'
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
                showToast(`Approved ${row.title}`, 'Internship NOC clearance issued.', 'success');
              }}
              className="bg-emerald-700 hover:bg-emerald-800"
            >
              Issue NOC
            </Button>
          )}
          <Link href={`/student/projects/${row.id}`}>
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3 h-3" />}>
              Details
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Corporate Internships &amp; NOC Clearances"
        description="Verify industry offer letters, track company placement NOCs, and monitor corporate internships."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Internships', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{internships.length} Corporate Tracks</span>
          </span>
        }
      />

      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search internships by company or student..."
          className="w-full sm:w-96"
        />

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <Table
            columns={columns}
            data={filtered}
            emptyState={<div className="p-8 text-center text-xs text-slate-400">No corporate internships found.</div>}
          />
        </div>
      </div>
    </div>
  );
}

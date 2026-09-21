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
import { Trophy, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { Activity } from '@/types';

export default function HodHackathonsPage() {
  const { hackathons, approveActivity } = useData();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = hackathons.filter(
    (h) =>
      h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (h.organization && h.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const activeCount = hackathons.filter((h) => h.status === 'ACTIVE' || h.status === 'APPROVED').length;
  const pendingCount = hackathons.filter((h) => h.status === 'SUBMITTED' || h.status === 'UNDER_REVIEW').length;

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
      header: 'Hackathon & Organizer',
      render: (row) => (
        <div className="max-w-md">
          <span className="font-bold text-xs text-slate-900 block line-clamp-1">
            {row.title}
          </span>
          <span className="text-[10px] text-amber-700 font-medium">{row.organization || 'External Sprint'}</span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Timeline',
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
          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
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
                showToast(`Approved ${row.title}`, 'Participation approved.', 'success');
              }}
              className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
            >
              Approve
            </Button>
          )}
          <Link href={`/student/projects/${row.id}`}>
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />} className="text-xs font-semibold">
              Details
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="Department Hackathons"
        description="Monitor student hackathon registrations and participation clearances."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'Hackathons', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{hackathons.length} Total Hackathons</span>
          </span>
        }
      />

      {/* 2. Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <MetricCard
          label="Total Tracked"
          value={hackathons.length}
          description="Registered hackathons"
          icon={<Trophy className="w-5 h-5 text-amber-600" />}
        />
        <MetricCard
          label="Approved Entries"
          value={activeCount}
          description="Clearance granted"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-700" />}
          variant="highlight"
        />
        <MetricCard
          label="Pending Clearance"
          value={pendingCount}
          description="Awaiting HOD approval"
          icon={<Trophy className="w-5 h-5 text-amber-700" />}
        />
      </div>

      {/* 3. Table & Search */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-2xs">
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search by student, event, or organizer..."
          className="w-full sm:w-96"
        />

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={filtered}
            emptyState={<div className="p-8 text-center text-xs text-slate-400">No matching hackathons found.</div>}
          />
        </div>
      </div>
    </div>
  );
}

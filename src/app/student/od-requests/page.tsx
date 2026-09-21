'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useData } from '@/context/DataContext';
import {
  FileCheck,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function StudentODRequestsPage() {
  const { odApplications } = useData();
  const [activeTab, setActiveTab] = useState('ALL');

  const filtered = odApplications.filter((o) => {
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'APPROVED') return o.status === 'APPROVED';
    if (activeTab === 'REJECTED') return o.status === 'REJECTED';
    return true;
  });

  const tabItems = [
    { id: 'ALL', label: `All Requests (${odApplications.length})` },
    { id: 'PENDING', label: `Pending (${odApplications.filter((o) => o.status === 'PENDING').length})` },
    { id: 'APPROVED', label: `Approved (${odApplications.filter((o) => o.status === 'APPROVED').length})` },
    { id: 'REJECTED', label: `Rejected (${odApplications.filter((o) => o.status === 'REJECTED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="On-Duty (OD) Permissions"
        description="Track academic attendance concessions for approved project testing, lab deployments, and hackathons."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'OD Requests', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Independent Academic Concessions</span>
          </span>
        }
        primaryAction={
          <Link href="/student/od-requests/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Apply for OD
            </Button>
          </Link>
        }
      />

      {/* Tabs */}
      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {/* OD List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No OD applications found"
            description="You have not submitted any On-Duty requests in this status category."
            icon={<FileCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((od) => (
            <div
              key={od.id}
              className="p-5 sm:p-6 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-indigo-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{od.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      od.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : od.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {od.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {od.eventName}
                  </h3>
                  {od.activityTitle && (
                    <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                      Connected: {od.activityTitle}
                    </p>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {od.reason}
                </p>

                {/* Date, Time & Venue */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{od.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{od.fromTime} to {od.toTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{od.venue}</span>
                  </div>
                </div>

                {/* Explicit Rejection Reason (Section 9) */}
                {od.status === 'REJECTED' && od.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>HOD Rejection Reason:</span>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      {od.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Remarks if Approved */}
                {od.status === 'APPROVED' && od.remarks && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{od.remarks}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>Submitted: {od.submittedDate}</span>
                {od.proofDocName && <span className="text-indigo-600 font-medium">Proof Attached ✓</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

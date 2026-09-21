'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { Tabs } from '@/components/ui/Tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import {
  FileCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { ODApplication } from '@/types';

export default function HodODSubmissionsPage() {
  const { odApplications, approveOD, rejectOD } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectingOD, setRejectingOD] = useState<ODApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingCount = odApplications.filter((o) => o.status === 'PENDING').length;
  const approvedCount = odApplications.filter((o) => o.status === 'APPROVED').length;
  const rejectedCount = odApplications.filter((o) => o.status === 'REJECTED').length;

  const filtered = odApplications.filter((o) => {
    if (activeTab === 'PENDING' && o.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && o.status !== 'APPROVED') return false;
    if (activeTab === 'REJECTED' && o.status !== 'REJECTED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        o.studentName.toLowerCase().includes(q) ||
        o.studentRegNo.toLowerCase().includes(q) ||
        o.eventName.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleApprove = (od: ODApplication) => {
    approveOD(od.id);
    showToast(`Approved OD for ${od.studentName}`, 'Attendance clearance granted.', 'success');
  };

  const handleOpenReject = (od: ODApplication) => {
    setRejectingOD(od);
    setRejectionReason('Schedule conflicts with departmental academic activities.');
  };

  const handleConfirmReject = () => {
    if (!rejectingOD) return;
    if (!rejectionReason.trim()) {
      showToast('Rejection reason required.', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      rejectOD(rejectingOD.id, rejectionReason);
      setIsProcessing(false);
      setRejectingOD(null);
      showToast(`Rejected OD for ${rejectingOD.studentName}`, 'Decision recorded.', 'info');
    }, 400);
  };

  const tabItems = [
    { id: 'PENDING', label: `Pending Clearances (${pendingCount})` },
    { id: 'APPROVED', label: `Approved (${approvedCount})` },
    { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
    { id: 'ALL', label: `All Requests (${odApplications.length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-12">
      {/* 1. Page Header */}
      <PageHeader
        title="OD Clearances & Approvals"
        description="Review student on-duty (OD) applications and grant or deny attendance clearances."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'OD Clearances', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{pendingCount} Pending OD Clearances</span>
          </span>
        }
      />

      {/* 2. Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student, reg no, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* 3. OD Clearances List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <EmptyState
            title="No OD applications found"
            description="All student on-duty applications in this category have been processed."
            icon={<FileCheck className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((od) => {
            const isPending = od.status === 'PENDING';

            return (
              <div
                key={od.id}
                className={`p-5 rounded-2xl border bg-white flex flex-col justify-between space-y-3 transition-all shadow-2xs ${
                  isPending ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{od.id}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
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
                    <h3 className="text-sm font-bold text-slate-900 truncate">
                      {od.eventName}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Student: <strong className="text-slate-900">{od.studentName}</strong> ({od.studentRegNo})
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Reason for OD:</span>
                    <p className="text-slate-800 font-normal">{od.reason}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{od.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{od.fromTime} - {od.toTime}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{od.venue}</span>
                    </div>
                  </div>

                  {od.status === 'REJECTED' && od.rejectionReason && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-0.5">
                      <strong className="text-[10px] font-bold uppercase text-red-900 block">
                        Rejection Reason:
                      </strong>
                      <p className="font-medium">{od.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {isPending ? (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleOpenReject(od)}
                      leftIcon={<XCircle className="w-4 h-4" />}
                      className="text-xs font-bold"
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleApprove(od)}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                      className="bg-emerald-700 hover:bg-emerald-800 text-xs font-bold"
                    >
                      Approve OD
                    </Button>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 font-medium">
                    {od.status === 'APPROVED' ? '✓ Attendance clearance granted' : '✕ Request denied'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      <Dialog
        isOpen={!!rejectingOD}
        onClose={() => setRejectingOD(null)}
        title="Reject On-Duty Request"
        variant="danger"
        confirmLabel={isProcessing ? 'Processing...' : 'Confirm Rejection'}
        onConfirm={handleConfirmReject}
        cancelLabel="Cancel"
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            State the reason for rejecting the OD request for <strong>{rejectingOD?.studentName}</strong>.
          </p>
          <Textarea
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            isRequired
          />
        </div>
      </Dialog>
    </div>
  );
}

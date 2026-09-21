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
  Sparkles,
} from 'lucide-react';
import { ODApplication } from '@/types';

export default function HodODSubmissionsPage() {
  const { odApplications, approveOD, rejectOD } = useData();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ALL');
  const [rejectingOD, setRejectingOD] = useState<ODApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = odApplications.filter((o) => {
    if (activeTab === 'PENDING') return o.status === 'PENDING';
    if (activeTab === 'APPROVED') return o.status === 'APPROVED';
    if (activeTab === 'REJECTED') return o.status === 'REJECTED';
    return true;
  });

  const handleApprove = (od: ODApplication) => {
    approveOD(od.id);
    showToast(`Approved OD for ${od.studentName}`, 'Academic attendance concession recorded.', 'success');
  };

  const handleOpenReject = (od: ODApplication) => {
    setRejectingOD(od);
    setRejectionReason('Event schedule conflicts with departmental academic assessments.');
  };

  const handleConfirmReject = () => {
    if (!rejectingOD) return;
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason.', 'warning');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      rejectOD(rejectingOD.id, rejectionReason);
      setIsProcessing(false);
      setRejectingOD(null);
      showToast(`Rejected OD for ${rejectingOD.studentName}`, 'Notification dispatched to student.', 'info');
    }, 400);
  };

  const tabItems = [
    { id: 'ALL', label: `All Requests (${odApplications.length})` },
    { id: 'PENDING', label: `Pending (${odApplications.filter((o) => o.status === 'PENDING').length})` },
    { id: 'APPROVED', label: `Approved (${odApplications.filter((o) => o.status === 'APPROVED').length})` },
    { id: 'REJECTED', label: `Rejected (${odApplications.filter((o) => o.status === 'REJECTED').length})` },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="On-Duty (OD) Permissions Clearance"
        description="Review student academic attendance concessions for verified hackathons, lab testing, and conferences."
        breadcrumbs={[
          { label: 'Dashboard', href: '/hod/dashboard' },
          { label: 'OD Submissions', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Independent Academic Clearances</span>
          </span>
        }
      />

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={(id) => setActiveTab(id)} />

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No OD requests found"
            description="All student on-duty applications in this category have been processed."
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
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Student: <strong>{od.studentName}</strong> ({od.studentRegNo}) • {od.department}
                  </p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {od.reason}
                </p>

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

                {od.status === 'REJECTED' && od.rejectionReason && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>HOD Rejection Reason:</span>
                    </div>
                    <p className="text-xs text-red-700 font-medium leading-relaxed">
                      {od.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {od.status === 'PENDING' ? (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleOpenReject(od)}
                    leftIcon={<XCircle className="w-4 h-4" />}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleApprove(od)}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    Approve OD
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 font-mono">
                  {od.status === 'APPROVED' ? '✓ Endorsed by HOD' : '✕ Revision Requested'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Dialog
        isOpen={!!rejectingOD}
        onClose={() => setRejectingOD(null)}
        title="Reject On-Duty Application"
        variant="danger"
        confirmLabel={isProcessing ? 'Processing...' : 'Confirm Rejection'}
        onConfirm={handleConfirmReject}
        cancelLabel="Cancel"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
            <strong>Rejecting OD for {rejectingOD?.studentName}</strong>
            <p className="text-[11px] text-red-700 mt-1">
              Please state why this on-duty request cannot be granted.
            </p>
          </div>

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

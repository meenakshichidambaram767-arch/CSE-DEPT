'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import { odApi, ApiError } from '@/lib/api/odApi';
import { ODApplication, DocumentItem } from '@/types';
import {
  FileCheck,
  ArrowLeft,
  Send,
  Info,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

function NewODRequestForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activities, addODApplication } = useData();
  const { user } = useSession();
  const { showToast } = useToast();

  const preselectedActivityId = searchParams.get('activityId') || '';

  const [selectedActivityId, setSelectedActivityId] = useState(preselectedActivityId);
  const [reason, setReason] = useState(() => {
    if (preselectedActivityId) {
      const act = activities.find((a) => a.id === preselectedActivityId);
      if (act) return `Classroom camera setup, benchmark testing, and HOD progress presentation for ${act.title}.`;
    }
    return '';
  });
  const [eventName, setEventName] = useState(() => {
    if (preselectedActivityId) {
      const act = activities.find((a) => a.id === preselectedActivityId);
      if (act) return act.title;
    }
    return '';
  });
  const [date, setDate] = useState(() => {
    if (preselectedActivityId) {
      const act = activities.find((a) => a.id === preselectedActivityId);
      if (act) return act.startDate;
    }
    return '2026-09-25';
  });
  const [fromTime, setFromTime] = useState('01:30 PM');
  const [toTime, setToTime] = useState('05:00 PM');
  const [venue, setVenue] = useState(() => {
    if (preselectedActivityId) {
      const act = activities.find((a) => a.id === preselectedActivityId);
      if (act) return act.type === 'HACKATHON' ? act.organization || 'External Venue' : 'CSE Lab 2 (AI Center)';
    }
    return 'CSE Lab 2 / Tech Center';
  });
  const [proofDocName, setProofDocName] = useState('OD_Permission_Slip.pdf');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleActivityChange = (actId: string) => {
    setSelectedActivityId(actId);
    if (actId) {
      const act = activities.find((a) => a.id === actId);
      if (act) {
        setEventName(act.title);
        setDate(act.startDate);
        setReason(`Classroom camera setup, benchmark testing, and HOD progress presentation for ${act.title}.`);
        setVenue(act.type === 'HACKATHON' ? act.organization || 'External Venue' : 'CSE Lab 2 (AI Center)');
      }
    }
  };

  const approvedActivities = activities.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'APPROVED' || a.status === 'SUBMITTED'
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim() || !reason.trim() || !date) {
      showToast('Please fill in all mandatory OD fields', 'warning');
      return;
    }

    if (!user) {
      showToast('Authenticated student session required.', 'error');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const act = activities.find((a) => a.id === selectedActivityId);

    const payload: Partial<ODApplication> = {
      activityId: selectedActivityId || undefined,
      activityTitle: act?.title || eventName,
      activityType: act?.type || 'PROJECT',
      reason,
      eventName,
      date,
      fromTime,
      toTime,
      venue,
      proofDocName,
      additionalNotes: additionalNotes || undefined,
      status: 'PENDING',
    };

    try {
      await odApi.createODRequest(payload);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE') {
          addODApplication({
            ...payload,
            studentId: user.id,
            studentName: user.name,
            studentRegNo: user.registerNumber || '',
            department: user.department,
            year: user.year || '',
            status: 'PENDING',
          });
        } else {
          setErrorMessage(err.message);
          setIsSubmitting(false);
          return;
        }
      }
    }

    setIsSubmitting(false);
    showToast('On-Duty (OD) Application Submitted!', 'Status set to PENDING for HOD clearance.', 'success');
    router.push('/student/od-requests');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/student/od-requests')}
          className="gap-1.5 text-xs text-slate-600 hover:text-emerald-950 hover:bg-emerald-50 border-slate-200"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-700" />
          <span>Back to OD Applications</span>
        </Button>

        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
          SIET CSE · OD Permit Gateway
        </span>
      </div>

      <PageHeader
        title="Apply for On-Duty (OD) Clearance"
        description="Submit timetable attendance concession for approved hackathons, industrial visits, or capstone presentation milestones."
        breadcrumbs={[
          { label: 'OD Portal', href: '/student/od-requests' },
          { label: 'New Application', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            HOD Signoff Required
          </span>
        }
      />

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-800" />
              1. Event &amp; Purpose Particulars
            </h3>

            {approvedActivities.length > 0 && (
              <Select
                label="Link Approved Activity (Optional)"
                options={[
                  { value: '', label: '-- None (Standalone OD Request) --' },
                  ...approvedActivities.map((a) => ({
                    value: a.id,
                    label: `[${a.type}] ${a.title}`,
                  })),
                ]}
                value={selectedActivityId}
                onChange={(e) => handleActivityChange(e.target.value)}
              />
            )}

            <Input
              label="Event / Purpose Title"
              placeholder="e.g. SIET Autonomous AI Hackathon 2026 / Project Defense"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              isRequired
            />

            <Textarea
              label="Academic Justification & Objective"
              placeholder="Detail the academic relevance, period breakdown, and expected outcome for this attendance clearance..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              isRequired
            />
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-800" />
              2. Timetable Slot &amp; Venue
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DatePicker
                label="OD Date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                isRequired
              />

              <Input
                label="Venue / Location"
                placeholder="e.g. CSE Lab 2 / Tech Center"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                isRequired
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="From Time"
                value={fromTime}
                onChange={(e) => setFromTime(e.target.value)}
                placeholder="e.g. 01:30 PM"
              />

              <Input
                label="To Time"
                value={toTime}
                onChange={(e) => setToTime(e.target.value)}
                placeholder="e.g. 05:00 PM"
              />
            </div>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-800" />
              3. Proof Document Attachment
            </h3>

            <FileUpload
              label="Invitation / Event Brochure / Registration Copy"
              accept=".pdf,.png,.jpg,.jpeg"
              maxSizeMB={5}
              onFilesChange={(docs: DocumentItem[]) => {
                if (docs[0]) setProofDocName(docs[0].name);
              }}
            />
            {proofDocName && (
              <p className="text-xs text-emerald-800 font-medium">Selected file: {proofDocName}</p>
            )}

            <Textarea
              label="Additional Notes for HOD (Optional)"
              placeholder="Any supplementary remarks or period substitution notes..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-emerald-950 text-white space-y-4 shadow-md border border-emerald-900">
            <div className="flex items-center gap-2 border-b border-emerald-800/80 pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold tracking-tight">Applicant Verification</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-baseline py-1 border-b border-emerald-900">
                <span className="text-emerald-300">Lead Student</span>
                <span className="font-bold text-white">{user?.name || 'Student'}</span>
              </div>

              <div className="flex justify-between items-baseline py-1 border-b border-emerald-900">
                <span className="text-emerald-300">Roll Number</span>
                <span className="font-mono text-amber-400 font-bold">{user?.registerNumber || '—'}</span>
              </div>

              <div className="flex justify-between items-baseline py-1 border-b border-emerald-900">
                <span className="text-emerald-300">Department</span>
                <span className="font-semibold text-white">{user?.department || 'CSE'}</span>
              </div>

              <div className="flex justify-between items-baseline py-1">
                <span className="text-emerald-300">Academic Scope</span>
                <span className="font-semibold text-emerald-200">Year {user?.year || 'II'} · Sec {user?.section || 'A'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-900/80 border border-emerald-800 text-[11px] text-emerald-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-400">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Status Notice</span>
              </div>
              <p className="leading-normal">
                Submitted applications enter state <strong className="text-white">PENDING</strong>. HOD signoff will update state to <strong className="text-emerald-400">APPROVED</strong> or <strong className="text-amber-300">REVISION_REQUESTED</strong>.
              </p>
            </div>

            <Button
              type="submit"
              variant="secondary"
              className="w-full justify-center bg-amber-400 text-emerald-950 font-bold hover:bg-amber-300 text-xs py-2.5"
              disabled={isSubmitting}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting OD Application...' : 'Submit to HOD Portal'}</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function NewODRequestPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-xs text-[#0a5c36]">Loading form...</div>
    }>
      <NewODRequestForm />
    </Suspense>
  );
}

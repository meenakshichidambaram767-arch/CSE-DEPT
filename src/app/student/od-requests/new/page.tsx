'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DatePicker, TimePicker } from '@/components/ui/DatePicker';
import { FileUpload } from '@/components/ui/FileUpload';
import { useToast } from '@/components/ui/Toast';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import {
  FileCheck,
  Sparkles,
  ArrowLeft,
  Send,
  Info,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

export default function NewODRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activities, addODApplication } = useData();
  const { user } = useSession();
  const { showToast } = useToast();

  const preselectedActivityId = searchParams.get('activityId') || '';

  const [selectedActivityId, setSelectedActivityId] = useState(preselectedActivityId);
  const [reason, setReason] = useState('');
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState('2026-09-25');
  const [fromTime, setFromTime] = useState('01:30 PM');
  const [toTime, setToTime] = useState('05:00 PM');
  const [venue, setVenue] = useState('CSE Lab 2 / Tech Center');
  const [proofDocName, setProofDocName] = useState('OD_Permission_Slip.pdf');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-populate when an approved activity is selected (Section 8)
  useEffect(() => {
    if (selectedActivityId) {
      const act = activities.find((a) => a.id === selectedActivityId);
      if (act) {
        setEventName(act.title);
        setDate(act.startDate);
        setReason(`Classroom camera setup, benchmark testing, and HOD progress presentation for ${act.title}.`);
        setVenue(act.type === 'HACKATHON' ? act.organization || 'External Venue' : 'CSE Lab 2 (AI Center)');
      }
    }
  }, [selectedActivityId, activities]);

  const approvedActivities = activities.filter(
    (a) => a.status === 'ACTIVE' || a.status === 'APPROVED' || a.status === 'SUBMITTED'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim() || !reason.trim() || !date) {
      showToast('Please fill in all mandatory OD fields', 'warning');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const act = activities.find((a) => a.id === selectedActivityId);

      addODApplication({
        studentId: user?.id || 'usr-student-001',
        studentName: user?.name || 'Meena C',
        studentRegNo: user?.registerNumber || '714023104088',
        department: user?.department || 'CSE',
        year: user?.year || 'II',
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
      });

      setIsSubmitting(false);
      showToast('On-Duty (OD) Application Submitted!', 'Sent to HOD for clearance.', 'success');
      router.push('/student/od-requests');
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/student/od-requests')}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <span className="text-xs text-slate-400">Back to On-Duty Records</span>
      </div>

      <PageHeader
        title="Apply for On-Duty (OD)"
        description="Request academic attendance concession for approved capstone lab milestones, hackathons, or competitions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'OD Requests', href: '/student/od-requests' },
          { label: 'New Application', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Independent OD Permission</span>
          </span>
        }
      />

      {/* Auto-population hint callout (Section 8) */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Smart Auto-Population:</strong> Select an approved activity below to automatically fill in known project details, dates, and venue. You only need to enter OD-specific times and reasons!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Step 1: Link to Project or Standalone */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              1. Related Activity (Optional Auto-Fill)
            </h3>
            <p className="text-xs text-slate-500">
              Connect this OD request to an existing project/hackathon or enter a standalone event.
            </p>
          </div>

          <Select
            label="Connect to Approved Activity"
            options={[
              { value: '', label: '— Standalone OD Application (Manual Entry) —' },
              ...approvedActivities.map((a) => ({
                value: a.id,
                label: `${a.id} — ${a.title} (${a.type})`,
              })),
            ]}
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
          />

          {selectedActivityId && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Auto-populated project details for <strong>{activities.find((a) => a.id === selectedActivityId)?.title}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Step 2: OD Specific Information */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              2. On-Duty Event &amp; Timing
            </h3>
            <p className="text-xs text-slate-500">
              Specify the exact date, slot, and reason for academic attendance concession.
            </p>
          </div>

          <Input
            label="Event / Activity Name"
            placeholder="e.g. AI Exam Monitoring Milestone Lab Session"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            isRequired
          />

          <Textarea
            label="Reason for OD Application"
            placeholder="Describe the academic objective, lab calibration, or competition session requiring on-duty leave..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            isRequired
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <DatePicker
              label="Date of Event"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              isRequired
            />

            <Input
              label="From Time"
              placeholder="e.g. 01:30 PM"
              value={fromTime}
              onChange={(e) => setFromTime(e.target.value)}
              isRequired
            />

            <Input
              label="To Time"
              placeholder="e.g. 05:00 PM"
              value={toTime}
              onChange={(e) => setToTime(e.target.value)}
              isRequired
            />
          </div>

          <Input
            label="Venue / Lab Location"
            placeholder="e.g. CSE Lab 2 / Seminar Hall 3 / External Campus"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            isRequired
          />
        </div>

        {/* Step 3: Supporting Document */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              3. Supporting Document / Proof
            </h3>
            <p className="text-xs text-slate-500">
              Upload event invitation, lab permission slip, or entry receipt.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileCheck className="w-5 h-5 text-indigo-700" />
              <div>
                <strong className="text-xs text-slate-900 block">{proofDocName}</strong>
                <span className="text-[11px] text-indigo-700">Ready for HOD verification • PDF</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200 text-indigo-900">
              Attached
            </span>
          </div>

          <Textarea
            label="Additional Notes (Optional)"
            placeholder="Any additional remarks or team member register numbers included in this request..."
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/student/od-requests')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            Submit OD Request
          </Button>
        </div>
      </form>
    </div>
  );
}

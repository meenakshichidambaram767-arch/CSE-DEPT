'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useSession } from '@/context/SessionContext';
import { odApi, ApiError } from '@/lib/api/odApi';
import { calculateTotalDays } from '@/lib/api/mappers';
import { ODPurpose, ODApplication, DocumentItem } from '@/types';
import { ApiTimeSlotType, ODConflictResponse } from '@/types/contract';
import { FileUpload } from '@/components/ui/FileUpload';
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Check,
  Calendar,
  Clock,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Purpose', desc: 'Category' },
  { id: 2, label: 'Details', desc: 'Schedule' },
  { id: 3, label: 'Students', desc: 'Team' },
  { id: 4, label: 'Documents', desc: 'Proof' },
  { id: 5, label: 'Review', desc: 'Submit' },
];

function ApplyODContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addODApplication, activities } = useData();
  const { user } = useSession();

  const preselectedActivityId = searchParams.get('activityId') || '';
  const preselectedActivity = preselectedActivityId
    ? activities.find((a) => a.id === preselectedActivityId)
    : undefined;

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [purpose, setPurpose] = useState<ODPurpose>(() => {
    if (preselectedActivity?.type === 'HACKATHON') return 'HACKATHON';
    if (preselectedActivity?.type === 'INTERNSHIP') return 'INTERNSHIP';
    if (preselectedActivity?.type === 'PROJECT') return 'PROJECT';
    return 'HACKATHON';
  });
  const [activityId] = useState(preselectedActivityId);
  const [eventName, setEventName] = useState(() => preselectedActivity?.title || '');
  const [organization, setOrganization] = useState(() => preselectedActivity?.organization || '');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState(() => preselectedActivity?.startDate || '2026-10-15');
  const [endDate, setEndDate] = useState(() => preselectedActivity?.endDate || '2026-10-15');

  // Time Handling: Presets & Custom
  const [timePreset, setTimePreset] = useState<ApiTimeSlotType>('FULL_DAY');
  const [fromTime, setFromTime] = useState('09:00 AM');
  const [toTime, setToTime] = useState('05:00 PM');

  const [registrationId, setRegistrationId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState('Registration_Proof_SIET.pdf');
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([
    {
      id: 'doc-fixture-001',
      name: 'Registration_Proof_SIET.pdf',
      type: 'application/pdf',
      size: '1.2 MB',
      uploadDate: '2026-10-05',
    },
  ]);

  // Teammates
  const [teammates, setTeammates] = useState<Array<{ name: string; regNo: string; role?: string }>>([]);
  const [newTeammateName, setNewTeammateName] = useState('');
  const [newTeammateReg, setNewTeammateReg] = useState('');

  // Conflict state
  const [conflictResult, setConflictResult] = useState<ODConflictResponse | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update time values based on preset
  const handlePresetChange = (preset: ApiTimeSlotType) => {
    setTimePreset(preset);
    if (preset === 'FULL_DAY') {
      setFromTime('09:00 AM');
      setToTime('05:00 PM');
    } else if (preset === 'FORENOON') {
      setFromTime('09:00 AM');
      setToTime('01:00 PM');
    } else if (preset === 'AFTERNOON') {
      setFromTime('01:00 PM');
      setToTime('05:00 PM');
    }
  };

  const totalDays = calculateTotalDays(startDate, endDate);

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (purpose === 'INTERNSHIP') {
      if (!companyName.trim()) errs.companyName = 'Company name is required';
      if (!companyRole.trim()) errs.companyRole = 'Role/designation is required';
      if (!startDate) errs.startDate = 'Start date is required';
      if (!endDate) errs.endDate = 'End date is required';
    } else {
      if (!eventName.trim()) errs.eventName = 'Event name is required';
      if (!venue.trim()) errs.venue = 'Venue/city is required';
      if (!startDate) errs.startDate = 'Start date is required';
    }
    if (!reason.trim()) errs.reason = 'Please state purpose & expected outcome';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      if (!validateStep2()) return;
    }
    if (currentStep === 4) {
      // Check schedule conflicts before review step
      setCheckingConflict(true);
      try {
        const res = await odApi.getODConflicts('draft');
        setConflictResult(res.data);
      } catch {
        // Mock fallback handles errors
      } finally {
        setCheckingConflict(false);
      }
    }
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleAddTeammate = () => {
    if (newTeammateName.trim() && newTeammateReg.trim()) {
      setTeammates([
        ...teammates,
        { name: newTeammateName.trim(), regNo: newTeammateReg.trim(), role: 'MEMBER' },
      ]);
      setNewTeammateName('');
      setNewTeammateReg('');
    }
  };

  const handleRemoveTeammate = (index: number) => {
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrors({ identity: 'A signed-in student session is required to submit an OD request.' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    // Construct contract-shaped team members
    const teamMembersList = [
      {
        name: user.name || 'Lead Applicant',
        regNo: user.registerNumber || '714022104001',
        email: user.email || 'student@siet.ac.in',
        role: 'LEAD',
      },
      ...teammates.map((t) => ({
        name: t.name,
        regNo: t.regNo,
        email: '',
        role: t.role || 'MEMBER',
      })),
    ];

    const documentIds = attachedDocs.map((d) => d.id).filter(Boolean);
    if (documentIds.length === 0) {
      documentIds.push('doc-fixture-001');
    }

    const payload: Partial<ODApplication> = {
      purpose,
      activityId: activityId || undefined,
      eventName:
        eventName ||
        (purpose === 'HACKATHON'
          ? 'Smart India Hackathon 2026'
          : purpose === 'INTERNSHIP'
          ? `${companyName} Internship`
          : 'CSE Academic Milestone OD'),
      organization,
      venue: venue || (purpose === 'INTERNSHIP' ? companyName : 'SIET CSE Department'),
      date: startDate,
      startDate,
      endDate: endDate || startDate,
      fromTime,
      toTime,
      slotType: timePreset,
      totalDays,
      registrationId: registrationId || undefined,
      companyName: purpose === 'INTERNSHIP' ? companyName : undefined,
      role: purpose === 'INTERNSHIP' ? companyRole : undefined,
      reason: reason || `Attending approved ${purpose.toLowerCase()} event representing SIET CSE.`,
      proofDocName: docName,
      documents: attachedDocs,
      documentIds,
      teamMembers: teamMembersList,
      studentId: user.id,
      studentName: user.name,
      studentRegNo: user.registerNumber ?? '714022104001',
      department: user.department || 'CSE',
      year: user.year ?? 'III',
      section: user.section || 'A',
      status: 'PENDING',
    };

    try {
      addODApplication(payload);
      setIsSubmitting(false);
      router.push('/student/od-requests');
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof ApiError) {
        setErrors({ submit: `${err.code}: ${err.message}` });
      } else {
        setErrors({ submit: 'Failed to submit OD application. Please verify details.' });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/student/od-requests"
          className="text-xs font-semibold text-[#586658] hover:text-[#0a5c36] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Applications
        </Link>
      </div>

      {errors.submit && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errors.submit}</span>
        </div>
      )}

      {/* Main Centered Form Surface */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Form Header */}
        <div className="border-b border-[#dfe6dc] pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
              SIET CSE · Canonical OD Application
            </span>
            <span className="text-xs font-bold text-[#586658]">
              Step {currentStep} of 5
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Apply for On-Duty (OD) Leave
          </h1>

          {/* Stepper */}
          <div className="pt-2">
            <div className="flex items-center justify-between relative">
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#dfe6dc] z-0" />
              <div
                className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-[#facc15] transition-all duration-300 z-0"
                style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 92}%` }}
              />

              {STEPS.map((s) => {
                const isActive = s.id === currentStep;
                const isPast = s.id < currentStep;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (s.id < currentStep) setCurrentStep(s.id);
                    }}
                    className={`relative z-10 flex flex-col items-center group ${
                      s.id <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#0a5c36] text-white ring-4 ring-[#facc15]/30'
                          : isPast
                          ? 'bg-[#facc15] text-[#172017]'
                          : 'bg-[#f7f9f5] text-[#889688] border border-[#dfe6dc]'
                      }`}
                    >
                      {s.id}
                    </div>
                    <span className="text-[10px] font-semibold text-[#586658] mt-1 hidden sm:block">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 1: PURPOSE */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">Select OD Purpose Category</h2>
              <p className="text-xs text-[#586658]">
                Choose the primary classification for your academic leave request.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['HACKATHON', 'INTERNSHIP', 'PROJECT', 'WORKSHOP', 'COMPETITION', 'CONFERENCE', 'OTHER'] as ODPurpose[]).map((p) => {
                const isSelected = purpose === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`p-3.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-[#0a5c36] bg-[#eaf7e8] ring-1 ring-[#0a5c36]'
                        : 'border-[#dfe6dc] bg-white hover:border-[#889688]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'border-[#0a5c36] bg-[#0a5c36] text-white'
                            : 'border-[#889688]'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />}
                      </span>
                      <span className="text-xs font-bold text-[#172017]">
                        {p}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: EVENT DETAILS & TIME HANDLING */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                {purpose === 'INTERNSHIP' ? 'Internship & Company Details' : 'Event & Schedule Details'}
              </h2>
              <p className="text-xs text-[#586658]">
                Provide official schedule matching your invitation or acceptance letter.
              </p>
            </div>

            {purpose === 'INTERNSHIP' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zoho Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                  {errors.companyName && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.companyName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Internship Role</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Engineering Intern"
                    value={companyRole}
                    onChange={(e) => setCompanyRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Event Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart India Hackathon 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                  {errors.eventName && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.eventName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Host Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Madras / IEEE"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Venue &amp; City</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai Trade Centre"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                  {errors.venue && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {errors.venue}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Registration ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SIH-2026-9921"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
              </div>
            )}

            {/* Date Range & Total Days */}
            <div className="p-3.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172017] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#0a5c36]" /> Date Range
                </span>
                <span className="text-[11px] font-bold bg-[#eaf7e8] text-[#0a5c36] px-2 py-0.5 rounded border border-[#dfe6dc]">
                  Total Days: {totalDays}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#586658]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#586658]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Time Slot Presets & Custom Time */}
            <div className="p-3.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172017] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0a5c36]" /> Time Slot Presets &amp; Schedule
                </span>
                <span className="text-[10px] text-[#586658] font-mono">
                  {fromTime} – {toTime}
                </span>
              </div>

              {/* Preset buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'FULL_DAY' as ApiTimeSlotType, label: 'Full Day', times: '09:00 - 17:00' },
                  { id: 'FORENOON' as ApiTimeSlotType, label: 'Forenoon', times: '09:00 - 13:00' },
                  { id: 'AFTERNOON' as ApiTimeSlotType, label: 'Afternoon', times: '13:00 - 17:00' },
                  { id: 'PERIOD_CUSTOM' as ApiTimeSlotType, label: 'Custom Period', times: 'Pick Times' },
                ].map((slot) => {
                  const isSelected = timePreset === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handlePresetChange(slot.id)}
                      className={`p-2 rounded-md border text-center transition-all ${
                        isSelected
                          ? 'bg-[#0a5c36] text-white border-[#0a5c36]'
                          : 'bg-white text-[#172017] border-[#dfe6dc] hover:border-[#889688]'
                      }`}
                    >
                      <div className="text-xs font-bold">{slot.label}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-[#facc15]' : 'text-[#586658]'}`}>
                        {slot.times}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Period Input Controls */}
              {timePreset === 'PERIOD_CUSTOM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#dfe6dc]">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#586658]">From Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 09:30 AM"
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#586658]">To Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 04:30 PM"
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-xs font-semibold text-[#172017]">
                Purpose &amp; Academic Justification
              </label>
              <textarea
                rows={3}
                placeholder="State your objective, expected project deliverable, or learning outcome..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
              />
            </div>
          </div>
        )}

        {/* STEP 3: STUDENTS & TEAM MEMBERS */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                Applicant &amp; Group Teammates
              </h2>
              <p className="text-xs text-[#586658]">
                Add any CSE classmates attending this event together with you.
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[#eaf7e8] border border-[#dfe6dc] flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#172017]">
                  {user?.name ?? 'Student'} (Lead Applicant)
                </p>
                <p className="text-[11px] text-[#586658] font-mono tabular-nums">
                  Roll No: {user?.registerNumber || '714022104001'} · Year {user?.year || 'III'} · {user?.department ?? 'CSE'}{user?.section ? `-${user.section}` : ''}
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#0a5c36] bg-white px-2 py-0.5 rounded border border-[#dfe6dc]">
                Primary Lead
              </span>
            </div>

            {/* Teammates List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#586658]">
                Additional Team Members ({teammates.length})
              </span>

              {teammates.map((tm, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border border-[#dfe6dc] flex items-center justify-between text-xs bg-white"
                >
                  <div>
                    <p className="font-semibold text-[#172017]">{tm.name}</p>
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums">
                      Roll No: {tm.regNo} · Role: {tm.role || 'MEMBER'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeammate(idx)}
                    className="p-1 text-[#889688] hover:text-[#dc2626]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Teammate Full Name"
                  value={newTeammateName}
                  onChange={(e) => setNewTeammateName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                />
                <input
                  type="text"
                  placeholder="Roll No (e.g. 714022104002)"
                  value={newTeammateReg}
                  onChange={(e) => setNewTeammateReg(e.target.value)}
                  className="w-full sm:w-44 px-3 py-1.5 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36] font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTeammate}
                  className="px-3 py-1.5 bg-[#eaf7e8] hover:bg-[#d8edd6] text-[#0a5c36] text-xs font-bold rounded-md transition-colors flex items-center justify-center gap-1 border border-[#dfe6dc]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                Supporting Verification Documents
              </h2>
              <p className="text-xs text-[#586658]">
                Upload invitation, registration receipt, or acceptance email required for HOD signoff.
              </p>
            </div>

            <FileUpload
              label="Invitation / Event Brochure / Registration Proof"
              accept=".pdf,.png,.jpg,.jpeg"
              maxSizeMB={5}
              owner="od_request"
              ownerId="draft"
              onFilesChange={(docs: DocumentItem[]) => {
                setAttachedDocs(docs);
                if (docs[0]) {
                  setDocName(docs[0].name);
                }
              }}
            />

            {docName && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-[#0a5c36] flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="w-4 h-4" />
                  <span>{docName}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-[#0a5c36] px-2 py-0.5 rounded border border-emerald-300">
                  Document ID: {attachedDocs[0]?.id || 'doc-fixture-001'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: REVIEW & CONFLICTS */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                Review Application Details
              </h2>
              <p className="text-xs text-[#586658]">
                Confirm all particulars before submitting to HOD office.
              </p>
            </div>

            {/* Conflict Detection Banner */}
            {checkingConflict ? (
              <div className="p-3 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] text-xs text-[#586658] flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#0a5c36] border-t-transparent animate-spin" />
                <span>Checking departmental schedule conflicts...</span>
              </div>
            ) : conflictResult?.has_conflict ? (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  Potential OD Schedule Conflict Detected
                </div>
                <p className="text-amber-800">
                  {conflictResult.conflicts?.length || 1} overlapping event registered for your schedule. HOD will review conflict clearance.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>No schedule conflicts detected on your departmental calendar.</span>
              </div>
            )}

            <div className="divide-y divide-[#edf2ea] border border-[#dfe6dc] rounded-lg p-4 space-y-3 text-xs bg-white">
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-[#586658] font-medium">Purpose</span>
                <span className="font-bold text-[#0a5c36] uppercase">{purpose}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Activity / Event</span>
                <span className="font-bold text-[#172017]">
                  {purpose === 'INTERNSHIP' ? `${companyName} (${companyRole})` : eventName || 'Department Hackathon'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Dates &amp; Duration</span>
                <span className="font-semibold text-[#172017] tabular-nums">
                  {startDate} {endDate && endDate !== startDate ? `to ${endDate}` : ''} ({totalDays} {totalDays === 1 ? 'day' : 'days'})
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Time Slot</span>
                <span className="font-semibold text-[#172017] tabular-nums">
                  {timePreset} ({fromTime} – {toTime})
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Venue</span>
                <span className="font-semibold text-[#172017]">{venue || companyName || 'SIET'}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Lead Applicant</span>
                <span className="font-bold text-[#172017] font-mono">
                  {user ? `${user.name} (${user.registerNumber || '714022104001'})` : 'Student'}
                </span>
              </div>

              {teammates.length > 0 && (
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-[#586658] font-medium">Additional Teammates</span>
                  <span className="font-semibold text-[#172017]">
                    {teammates.map((t) => t.name).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Proof Document</span>
                <span className="font-semibold text-[#0a5c36]">{docName}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#dfe6dc]">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-[#586658] hover:text-[#172017] transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-bold rounded-md shadow-xs transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{isSubmitting ? 'Submitting...' : 'Submit OD Application'}</span>
              <Check className="w-3.5 h-3.5 text-[#facc15]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ApplyODPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-[#586658]">Loading OD application...</div>}>
      <ApplyODContent />
    </Suspense>
  );
}

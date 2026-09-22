'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { ODPurpose } from '@/types';
import {
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  Building,
  Check
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Purpose', desc: 'Select category' },
  { id: 2, label: 'Details', desc: 'Event information' },
  { id: 3, label: 'Students', desc: 'Applicant & team' },
  { id: 4, label: 'Documents', desc: 'Supporting proof' },
  { id: 5, label: 'Review', desc: 'Confirm submission' },
];

export default function ApplyODPage() {
  const router = useRouter();
  const { addODApplication } = useData();

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [purpose, setPurpose] = useState<ODPurpose>('HACKATHON');
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('2026-09-28');
  const [startDate, setStartDate] = useState('2026-09-28');
  const [endDate, setEndDate] = useState('2026-09-29');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [registrationId, setRegistrationId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState('Hackathon_Invitation_2026.pdf');
  const [uploadedFile, setUploadedFile] = useState<boolean>(true);

  // Additional teammates
  const [teammates, setTeammates] = useState<Array<{ name: string; regNo: string }>>([]);
  const [newTeammateName, setNewTeammateName] = useState('');
  const [newTeammateReg, setNewTeammateReg] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (purpose === 'INTERNSHIP') {
      if (!companyName.trim()) errs.companyName = 'Company name is required';
      if (!companyRole.trim()) errs.companyRole = 'Role/designation is required';
      if (!startDate) errs.startDate = 'Start date is required';
      if (!endDate) errs.endDate = 'End date is required';
    } else {
      if (!eventName.trim()) errs.eventName = 'Event name is required';
      if (!venue.trim()) errs.venue = 'Venue/location is required';
      if (!eventDate) errs.eventDate = 'Event date is required';
    }
    if (!reason.trim()) errs.reason = 'Please state purpose & expected outcome';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 2) {
      if (!validateStep2()) return;
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
      setTeammates([...teammates, { name: newTeammateName.trim(), regNo: newTeammateReg.trim() }]);
      setNewTeammateName('');
      setNewTeammateReg('');
    }
  };

  const handleRemoveTeammate = (index: number) => {
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addODApplication({
      studentId: 'usr-student-001',
      studentName: 'Meena C',
      studentRegNo: '714023104088',
      department: 'CSE',
      year: 'II',
      section: 'A',
      purpose: purpose,
      eventName: eventName || (purpose === 'HACKATHON' ? 'Hackathon OD' : purpose === 'INTERNSHIP' ? `${companyName} Internship` : 'Academic Event'),
      organization: organization,
      venue: venue || (purpose === 'INTERNSHIP' ? companyName : 'CSE Department'),
      date: eventDate || startDate || new Date().toISOString().split('T')[0],
      startDate: startDate || eventDate,
      endDate: endDate || eventDate,
      fromTime: startTime,
      toTime: endTime,
      registrationId: registrationId,
      companyName: companyName,
      role: companyRole,
      location: location,
      reason: reason || `Attending approved ${purpose.toLowerCase()} event.`,
      proofDocName: docName,
      status: 'PENDING',
    });

    router.push('/student/od-requests');
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      {/* Back Link */}
      <div>
        <Link
          href="/student/od-requests"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Applications
        </Link>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 space-y-8 shadow-2xs">
        {/* Step Header */}
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-6 space-y-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Apply for On-Duty (OD)
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Step {currentStep} of 5 · {STEPS[currentStep - 1].desc}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="grid grid-cols-5 gap-2 pt-2">
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
                  className={`text-left pb-2 border-b-2 transition-colors ${
                    isActive
                      ? 'border-emerald-800 text-zinc-900 dark:text-zinc-100'
                      : isPast
                      ? 'border-emerald-600 text-zinc-600 dark:text-zinc-400 cursor-pointer'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <span className="text-[10px] font-semibold block uppercase tracking-wider">
                    0{s.id} {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: PURPOSE SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Select OD Purpose
              </h2>
              <p className="text-xs text-zinc-500">
                Choose the academic or industry category that fits your leave request.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(
                [
                  'HACKATHON',
                  'PROJECT',
                  'INTERNSHIP',
                  'WORKSHOP',
                  'COMPETITION',
                  'CONFERENCE',
                  'OTHER',
                ] as ODPurpose[]
              ).map((p) => {
                const isSelected = purpose === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPurpose(p)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-800'
                        : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {p}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: EVENT DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {purpose === 'INTERNSHIP' ? 'Internship & Company Details' : 'Event & Schedule Details'}
              </h2>
              <p className="text-xs text-zinc-500">
                Provide accurate details matching your official invitation or acceptance email.
              </p>
            </div>

            {purpose === 'INTERNSHIP' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zoho Corporation / Robert Bosch"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.companyName && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.companyName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Role / Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. AI Research Intern"
                    value={companyRole}
                    onChange={(e) => setCompanyRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.companyRole && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.companyRole}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.startDate && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.startDate}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.endDate && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.endDate}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Event Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Smart India Hackathon 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.eventName && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.eventName}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Host / Organization</label>
                  <input
                    type="text"
                    placeholder="e.g. IIT Madras / CSI Chapter"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Venue & City</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai Trade Centre"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.venue && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.venue}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Registration ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. SIH-2026-TEAM-894"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
                  />
                  {errors.eventDate && (
                    <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {errors.eventDate}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Start Time</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">End Time</label>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Justification Textarea */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Purpose & Academic Justification
              </label>
              <textarea
                rows={3}
                placeholder="Briefly describe the purpose of attending and expected deliverables / outcomes..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-3 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 shadow-2xs"
              />
              {errors.reason && (
                <p className="text-[11px] text-rose-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle className="w-3 h-3" /> {errors.reason}
                </p>
              )}
            </div>
          </div>
        )}

        {/* STEP 3: STUDENTS */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Applicant & Teammates
              </h2>
              <p className="text-xs text-zinc-500">
                Primary applicant and any CSE classmates participating with you.
              </p>
            </div>

            {/* Primary Applicant Pill */}
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-850/60 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-900 text-emerald-100 text-xs font-semibold flex items-center justify-center">
                  MC
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Meena C (Primary Applicant)
                  </h3>
                  <p className="text-[11px] text-zinc-500 tabular-nums">
                    Register No: 714023104088 · Year II · CSE-A
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                Lead
              </span>
            </div>

            {/* Additional Teammates List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block">
                Additional Teammates ({teammates.length})
              </span>

              {teammates.map((tm, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{tm.name}</p>
                    <p className="text-zinc-500 tabular-nums">Reg: {tm.regNo}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTeammate(idx)}
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-rose-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Add Teammate Inline Row */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Teammate Full Name"
                  value={newTeammateName}
                  onChange={(e) => setNewTeammateName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Register No (e.g. 714023104090)"
                  value={newTeammateReg}
                  onChange={(e) => setNewTeammateReg(e.target.value)}
                  className="w-full sm:w-48 px-3 py-1.5 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleAddTeammate}
                  className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: DOCUMENTS */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Supporting Verification Documents
              </h2>
              <p className="text-xs text-zinc-500">
                Attach acceptance letter, registration ticket, or event invitation required for HOD signoff.
              </p>
            </div>

            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {uploadedFile ? docName : 'Click or drag verification file here'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  PDF, PNG, JPG up to 10MB (Official department format)
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-850 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="font-mono text-[11px]">{docName}</span>
                  <span className="text-[10px] text-emerald-700 font-medium ml-1">✓ Ready</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Review Application Details
              </h2>
              <p className="text-xs text-zinc-500">
                Verify all information before submitting for departmental verification.
              </p>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 space-y-4 text-xs">
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-zinc-500 font-medium">Purpose</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                  {purpose}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3">
                <span className="text-zinc-500 font-medium">Activity / Event</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {purpose === 'INTERNSHIP' ? `${companyName} (${companyRole})` : eventName || 'Departmental Hackathon'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3">
                <span className="text-zinc-500 font-medium">Schedule</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {purpose === 'INTERNSHIP' ? `${startDate} to ${endDate}` : `${eventDate} (${startTime} – ${endTime})`}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3">
                <span className="text-zinc-500 font-medium">Venue / Organization</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {venue || companyName || 'CSE Department'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3">
                <span className="text-zinc-500 font-medium">Applicant</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                  Meena C (714023104088)
                </span>
              </div>

              {teammates.length > 0 && (
                <div className="flex justify-between items-baseline pt-3">
                  <span className="text-zinc-500 font-medium">Teammates</span>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {teammates.map((t) => t.name).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3">
                <span className="text-zinc-500 font-medium">Document Proof</span>
                <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                  {docName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
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
              className="px-5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-medium rounded-lg shadow-2xs transition-colors"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

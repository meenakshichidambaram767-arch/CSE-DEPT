'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { ODPurpose } from '@/types';
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  FileText,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Purpose', desc: 'Category' },
  { id: 2, label: 'Details', desc: 'Schedule' },
  { id: 3, label: 'Students', desc: 'Team' },
  { id: 4, label: 'Documents', desc: 'Proof' },
  { id: 5, label: 'Review', desc: 'Submit' },
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
  const [docName, setDocName] = useState('Registration_Proof_SIET.pdf');
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
      if (!venue.trim()) errs.venue = 'Venue/city is required';
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
      eventName: eventName || (purpose === 'HACKATHON' ? 'SIET Hackathon OD' : purpose === 'INTERNSHIP' ? `${companyName} Internship` : 'Academic OD Event'),
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
      reason: reason || `Attending approved ${purpose.toLowerCase()} event representing SIET.`,
      proofDocName: docName,
      status: 'PENDING',
    });

    router.push('/student/od-requests');
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

      {/* Main Centered Form Surface */}
      <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Form Header */}
        <div className="border-b border-[#dfe6dc] pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
              SIET CSE · OD Application
            </span>
            <span className="text-xs font-bold text-[#586658]">
              Step {currentStep} of 5
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Apply for On-Duty (OD) Leave
          </h1>

          {/* Yellow Progress Stepper (01 ─── 02 ─── 03 ─── 04 ─── 05) */}
          <div className="pt-2">
            <div className="flex items-center justify-between relative">
              {/* Background track */}
              <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#dfe6dc] z-0" />
              {/* Active track */}
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
                          : 'bg-[#f7f9f5] border border-[#dfe6dc] text-[#889688]'
                      }`}
                    >
                      0{s.id}
                    </div>
                    <span className="text-[10px] font-bold text-[#586658] mt-1 hidden sm:block">
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* STEP 1: PURPOSE SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                What are you attending?
              </h2>
              <p className="text-xs text-[#586658]">
                Select the academic, competition, or corporate purpose for this OD leave.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
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
                    className={`p-3.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#0a5c36] bg-[#eaf7e8] ring-1 ring-[#0a5c36]'
                        : 'border-[#dfe6dc] hover:border-[#0a5c36] bg-white'
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

        {/* STEP 2: EVENT DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-bold text-[#172017]">
                {purpose === 'INTERNSHIP' ? 'Internship & Company Details' : 'Event & Schedule Details'}
              </h2>
              <p className="text-xs text-[#586658]">
                Provide official information matching your invitation or acceptance letter.
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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#172017]">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
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
                    placeholder="e.g. IIT Madras / IEEE Chapter"
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
                  <label className="text-xs font-semibold text-[#172017]">Event Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
                  />
                </div>
              </div>
            )}

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

        {/* STEP 3: STUDENTS */}
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
                  Meena C (Lead Applicant)
                </p>
                <p className="text-[11px] text-[#586658] font-mono tabular-nums">
                  Roll No: 714023104088 · Year II · CSE-A
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#0a5c36] bg-white px-2 py-0.5 rounded border border-[#dfe6dc]">
                Primary
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
                  className="p-2.5 rounded-md border border-[#dfe6dc] flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#172017]">{tm.name}</p>
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums">{tm.regNo}</p>
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
                  placeholder="Roll No (e.g. 714023104090)"
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

            <div className="border-2 border-dashed border-[#dfe6dc] rounded-xl p-8 text-center bg-[#f7f9f5] flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-[#eaf7e8] text-[#0a5c36] flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#172017]">
                  {uploadedFile ? docName : 'Click to select document'}
                </p>
                <p className="text-[11px] text-[#586658]">
                  PDF, JPG, or PNG up to 10MB (Official SIET format)
                </p>
              </div>

              {uploadedFile && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-[#dfe6dc] text-xs text-[#0a5c36] font-semibold">
                  <FileText className="w-3.5 h-3.5 text-[#0a5c36]" />
                  <span>{docName}</span>
                  <span className="text-[10px] text-[#0a5c36] ml-1">✓ Attached</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW */}
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

            <div className="divide-y divide-[#edf2ea] border border-[#dfe6dc] rounded-lg p-4 space-y-3 text-xs">
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-[#586658] font-medium">Purpose</span>
                <span className="font-bold text-[#0a5c36] uppercase">{purpose}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Activity Name</span>
                <span className="font-bold text-[#172017]">
                  {purpose === 'INTERNSHIP' ? `${companyName} (${companyRole})` : eventName || 'Department Hackathon'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Schedule</span>
                <span className="font-semibold text-[#172017] tabular-nums">
                  {purpose === 'INTERNSHIP' ? `${startDate} to ${endDate}` : eventDate}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Venue</span>
                <span className="font-semibold text-[#172017]">{venue || companyName || 'SIET'}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-[#586658] font-medium">Lead Applicant</span>
                <span className="font-bold text-[#172017] font-mono">Meena C (714023104088)</span>
              </div>

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
              className="px-6 py-2 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-bold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Submit OD Application</span>
              <Check className="w-3.5 h-3.5 text-[#facc15]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

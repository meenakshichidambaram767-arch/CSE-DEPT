'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { ODPurpose } from '@/types';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ApplyODPage() {
  const router = useRouter();
  const { addODApplication } = useData();

  const [purpose, setPurpose] = useState<ODPurpose>('HACKATHON');

  // Form State
  const [eventName, setEventName] = useState('');
  const [organization, setOrganization] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('05:00 PM');
  const [registrationId, setRegistrationId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [projectType, setProjectType] = useState('Academic Lab Prototype');
  const [reason, setReason] = useState('');
  const [docName, setDocName] = useState('Registration_Proof.pdf');

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
      venue: venue || 'CSE Department',
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
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-3xl mx-auto">
      <div>
        <Link
          href="/student/od-requests"
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-800 dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to OD Portal
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-8 shadow-2xs">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-5 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Apply for On-Duty (OD)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Submit activity details and supporting documents for HOD approval
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* STEP 1: PURPOSE SELECTION */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              What is the purpose?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(['HACKATHON', 'PROJECT', 'INTERNSHIP', 'WORKSHOP', 'COMPETITION', 'CONFERENCE', 'OTHER'] as ODPurpose[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left ${
                    purpose === p
                      ? 'bg-emerald-900 text-amber-300 border-emerald-800 shadow-2xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* DYNAMIC FIELDS PER PURPOSE */}
          {/* HACKATHON FIELDS */}
          {purpose === 'HACKATHON' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Hackathon Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Hackathon Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HackSprint 2026"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Organization / Host</label>
                  <input
                    type="text"
                    placeholder="e.g. Anna University Tech Club"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue / City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai Convention Center"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Registration ID</label>
                  <input
                    type="text"
                    placeholder="e.g. HACK-2026-7842"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Time</label>
                    <input
                      type="text"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Time</label>
                    <input
                      type="text"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PROJECT FIELDS */}
          {purpose === 'PROJECT' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Project Activity Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Vision Benchmark"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue / Lab</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bosch AI Lab / CSE Lab 2"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* INTERNSHIP FIELDS */}
          {purpose === 'INTERNSHIP' && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Internship Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Zoho Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Role / Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineering Intern"
                    value={companyRole}
                    onChange={(e) => setCompanyRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* OTHER PURPOSES FALLBACK */}
          {(purpose === 'WORKSHOP' || purpose === 'COMPETITION' || purpose === 'CONFERENCE' || purpose === 'OTHER') && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Event Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IEEE National Conference"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PSG Tech Campus"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* REASON DESCRIPTION */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Purpose & Justification
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the reason for attending and expected academic outcome..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
            />
          </div>

          {/* SUPPORTING DOCUMENT UPLOAD */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Upload Supporting Document
            </label>
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center space-y-2">
              <Upload className="w-5 h-5 text-emerald-800" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {purpose === 'INTERNSHIP' ? 'Upload Internship Letter / NOC' : 'Upload Registration Proof or Invitation'}
              </p>
              <p className="text-[11px] text-slate-400">PDF, PNG, JPG up to 5MB</p>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              Submit OD Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

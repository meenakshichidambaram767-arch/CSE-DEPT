'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useData } from '@/context/DataContext';
import { odApi, ApiError } from '@/lib/api/odApi';
import { documentsApi } from '@/lib/api/documentsApi';
import { ODApplication } from '@/types';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  FileText,
  AlertCircle,
  Send,
  UserCheck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ExternalLink,
  Loader2,
  Users,
} from 'lucide-react';

export default function StudentODDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user } = useSession();
  const { getODById, resubmitOD } = useData();

  const contextOD = getODById(id);
  const [od, setOd] = useState<ODApplication | null>(() => contextOD || null);
  const [isLoading, setIsLoading] = useState(() => !contextOD);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreviewId, setLoadingPreviewId] = useState<string | null>(null);

  const handleFetchSignedUrl = async (documentId: string) => {
    setLoadingPreviewId(documentId);
    try {
      const res = await documentsApi.getSignedUrl(documentId);
      if (res.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      alert('Temporary 15-min signed URL generated from contract fixture.');
    } finally {
      setLoadingPreviewId(null);
    }
  };

  // Resubmit Form State (for REVISION_REQUESTED state)
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [reason, setReason] = useState(() => contextOD?.reason || '');
  const [eventName, setEventName] = useState(() => contextOD?.eventName || '');
  const [venue, setVenue] = useState(() => contextOD?.venue || '');
  const [date, setDate] = useState(() => contextOD?.date || contextOD?.startDate || '');
  const [fromTime, setFromTime] = useState(() => contextOD?.fromTime || '09:00 AM');
  const [toTime, setToTime] = useState(() => contextOD?.toTime || '05:00 PM');
  const [proofDocName, setProofDocName] = useState(() => contextOD?.proofDocName || '');
  const [revisionClarifications, setRevisionClarifications] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contextOD) return;
    let isMounted = true;

    // Fetch through odApi abstraction if not present in context
    odApi
      .getODRequestById(id)
      .then((res) => {
        if (isMounted) {
          setOd(res.data);
          setReason(res.data.reason || '');
          setEventName(res.data.eventName || '');
          setVenue(res.data.venue || '');
          setDate(res.data.date || res.data.startDate || '');
          setFromTime(res.data.fromTime || '09:00 AM');
          setToTime(res.data.toTime || '05:00 PM');
          setProofDocName(res.data.proofDocName || '');
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading OD details.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, contextOD]);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!od || od.status !== 'REVISION_REQUESTED') return;

    if (!revisionClarifications.trim()) {
      setFormErrors({ revision_notes: 'Please provide revision notes explaining the adjustments made.' });
      return;
    }

    setIsResubmitting(true);
    setError(null);
    setFormErrors({});

    try {
      // Dispatch through Phase 2 DataContext state action / odApi abstraction
      const updated = resubmitOD(id, revisionClarifications);
      if (updated) {
        setOd(updated);
      } else {
        const res = await odApi.resubmitODRequest(id, {
          eventName,
          reason,
          venue,
          date,
          fromTime,
          toTime,
          proofDocName,
          additionalNotes: revisionClarifications,
        });
        setOd(res.data);
      }
      setIsResubmitting(false);
    } catch (err: unknown) {
      setIsResubmitting(false);
      if (err instanceof ApiError) {
        setError(`${err.code}: ${err.message}`);
        if (err.field) {
          setFormErrors({ [err.field]: err.message });
        }
      } else {
        setError('Failed to resubmit OD application.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-6">
        <div className="flex items-center justify-center p-16 bg-white rounded-xl border border-[#dfe6dc]">
          <div className="flex items-center gap-3 text-sm text-[#0a5c36] font-semibold">
            <div className="w-5 h-5 rounded-full border-2 border-[#0a5c36] border-t-transparent animate-spin" />
            Loading OD Request Details...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Back Link */}
      <div>
        <Link
          href="/student/od-requests"
          className="text-xs font-semibold text-[#586658] hover:text-[#0a5c36] flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to OD Requests
        </Link>
      </div>

      {/* Error Card */}
      {error && !od && (
        <div className="p-8 text-center bg-white rounded-xl border border-[#dfe6dc] space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-[#172017]">Unable to Load OD Request</h2>
          <p className="text-xs text-[#586658] max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/student/od-requests')}>
            Return to List
          </Button>
        </div>
      )}

      {od && (
        <div className="space-y-6">
          {/* Main Detail Header Card */}
          <div className="bg-white rounded-xl border border-[#dfe6dc] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#facc15]" />

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#dfe6dc] pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#0a5c36] bg-[#eaf7e8] px-2.5 py-0.5 rounded">
                    {od.purpose || 'ACADEMIC OD'}
                  </span>
                  <span className="text-xs text-[#889688] font-mono">ID: {od.id}</span>
                  {od.registrationId && (
                    <span className="text-xs text-[#586658] font-mono">Reg: {od.registrationId}</span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
                  {od.eventName}
                </h1>

                <p className="text-xs text-[#586658]">
                  Submitted on <span className="font-semibold text-[#172017]">{od.submittedDate || 'Recent'}</span>
                </p>
              </div>

              <StatusIndicator status={od.status} />
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] space-y-1">
                <span className="text-[10px] font-bold text-[#586658] uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#0a5c36]" /> Date &amp; Schedule
                </span>
                <p className="font-semibold text-[#172017]">
                  {od.date || od.startDate || 'Date not specified'}
                </p>
                {od.fromTime && (
                  <p className="text-[11px] text-[#586658]">
                    {od.fromTime} – {od.toTime} ({od.totalDays || 1} {od.totalDays === 1 ? 'day' : 'days'})
                  </p>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] space-y-1">
                <span className="text-[10px] font-bold text-[#586658] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0a5c36]" /> Venue &amp; Location
                </span>
                <p className="font-semibold text-[#172017]">
                  {od.venue || 'SIET CSE Department'}
                </p>
                {od.organization && (
                  <p className="text-[11px] text-[#586658]">{od.organization}</p>
                )}
              </div>

              <div className="p-3.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc] space-y-1">
                <span className="text-[10px] font-bold text-[#586658] uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#0a5c36]" /> Lead Applicant
                </span>
                <p className="font-semibold text-[#172017]">
                  {od.studentName || user?.name}
                </p>
                <p className="text-[11px] text-[#586658]">
                  {od.studentRegNo || user?.registerNumber} · {od.department || 'CSE'} {od.section ? `-${od.section}` : ''}
                </p>
              </div>
            </div>

            {/* Team Members List */}
            {od.teamMembers && od.teamMembers.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-[#dfe6dc]">
                <span className="text-xs font-bold text-[#172017] flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#0a5c36]" /> Group Team Members ({od.teamMembers.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {od.teamMembers.map((member, idx) => (
                    <div key={idx} className="p-2.5 rounded-md bg-[#f7f9f5] border border-[#dfe6dc] flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#172017]">{member.name}</span>
                        <span className="text-[11px] text-[#586658] ml-2 font-mono">{member.regNo}</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase text-[#0a5c36] bg-white px-1.5 py-0.5 rounded border border-[#dfe6dc]">
                        {member.role || 'MEMBER'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purpose & Reason */}
            <div className="space-y-2 pt-2 border-t border-[#dfe6dc]">
              <span className="text-xs font-bold text-[#172017]">Purpose &amp; Objective</span>
              <p className="text-xs text-[#586658] bg-[#f7f9f5] p-3.5 rounded-lg border border-[#dfe6dc] whitespace-pre-line leading-relaxed">
                {od.reason}
              </p>
            </div>

            {/* Proof Attachment */}
            {od.proofDocName && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 bg-[#eaf7e8] border border-[#dfe6dc] rounded-lg text-xs">
                <div className="flex items-center gap-2 text-[#0a5c36] font-semibold">
                  <FileText className="w-4 h-4 text-[#0a5c36] shrink-0" />
                  <span>{od.proofDocName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFetchSignedUrl(od.id)}
                    disabled={loadingPreviewId === od.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-100 text-[#0a5c36] font-bold text-[11px] rounded border border-emerald-300 shadow-2xs transition-colors"
                  >
                    {loadingPreviewId === od.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>Preview (Signed URL)</span>
                  </button>
                  <span className="text-[10px] font-bold bg-white text-[#0a5c36] px-2 py-1 rounded border border-[#dfe6dc]">
                    Private Storage
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Decision / Revision / Rejection Remarks Panel */}
          {(od.revisionNotes || od.rejectionReason || od.remarks) && (
            <div className={`p-6 rounded-xl border space-y-2 ${
              od.status === 'REVISION_REQUESTED'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : od.status === 'REJECTED'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {od.status === 'REVISION_REQUESTED' && <HelpCircle className="w-4 h-4 text-amber-600" />}
                {od.status === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-600" />}
                {od.status === 'APPROVED' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                <span>
                  {od.status === 'REVISION_REQUESTED'
                    ? 'HOD Revision Directive'
                    : od.status === 'REJECTED'
                    ? 'Rejection Remarks'
                    : 'HOD Clearance Remarks'}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {od.revisionNotes || od.rejectionReason || od.remarks}
              </p>
            </div>
          )}

          {/* Resubmission Form for REVISION_REQUESTED State */}
          {od.status === 'REVISION_REQUESTED' && (
            <div className="bg-white rounded-xl border border-amber-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-amber-200 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Resubmit OD Request</span>
                </div>
                <p className="text-xs text-[#586658]">
                  Update your application details according to the HOD directives above. Submitting this form routes through <strong className="text-amber-800">PUT /api/v1/od-requests/{'{id}'}/resubmit</strong> and transitions status back to <strong className="text-[#0a5c36]">PENDING</strong>.
                </p>
              </div>

              {formErrors.revision_notes && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{formErrors.revision_notes}</span>
                </div>
              )}

              <form onSubmit={handleResubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172017]">Event Name</label>
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172017]">Reason &amp; Objective</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172017]">Venue / Location</label>
                    <Input
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172017]">Event Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172017]">From Time</label>
                    <Input
                      value={fromTime}
                      onChange={(e) => setFromTime(e.target.value)}
                      placeholder="e.g. 09:00 AM"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#172017]">To Time</label>
                    <Input
                      value={toTime}
                      onChange={(e) => setToTime(e.target.value)}
                      placeholder="e.g. 05:00 PM"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172017]">Updated Proof Document Name</label>
                  <Input
                    value={proofDocName}
                    onChange={(e) => setProofDocName(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#172017]">
                    Revision Clarifications for HOD <span className="text-rose-600">*</span>
                  </label>
                  <Textarea
                    value={revisionClarifications}
                    onChange={(e) => setRevisionClarifications(e.target.value)}
                    rows={2}
                    placeholder="Explain the changes made based on the revision instructions..."
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isResubmitting}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>{isResubmitting ? 'Resubmitting...' : 'Resubmit for PENDING Status'}</span>
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

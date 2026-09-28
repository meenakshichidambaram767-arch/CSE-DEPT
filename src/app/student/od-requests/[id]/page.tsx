'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { odApi, ApiError } from '@/lib/api/odApi';
import { ODApplication, ODStatus } from '@/types';
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
} from 'lucide-react';

export default function StudentODDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const { user } = useSession();

  const [od, setOd] = useState<ODApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBackendBlocked, setIsBackendBlocked] = useState(false);

  // Resubmit Form State (for REVISION_REQUESTED state)
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [reason, setReason] = useState('');
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [proofDocName, setProofDocName] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const populateResubmitForm = (data: ODApplication) => {
    setReason(data.reason || '');
    setEventName(data.eventName || '');
    setVenue(data.venue || '');
    setDate(data.date || data.startDate || '');
    setFromTime(data.fromTime || '');
    setToTime(data.toTime || '');
    setProofDocName(data.proofDocName || '');
    setAdditionalNotes(data.additionalNotes || '');
  };

  useEffect(() => {
    let isMounted = true;

    odApi
      .getODRequestById(id)
      .then((res) => {
        if (isMounted) {
          setOd(res.data);
          populateResubmitForm(res.data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          if (err instanceof ApiError && (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE')) {
            setIsBackendBlocked(true);
            const fallback = odApi.getFallbackById(id);
            if (fallback) {
              setOd(fallback);
              populateResubmitForm(fallback);
            } else {
              setError(`Backend endpoint GET /api/v1/od-requests/${id} is not yet available (HTTP 404).`);
            }
          } else {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred while loading OD details.');
          }
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!od || od.status !== 'REVISION_REQUESTED') return;

    setIsResubmitting(true);
    setError(null);

    const payload: Partial<ODApplication> = {
      eventName,
      reason,
      venue,
      date,
      fromTime,
      toTime,
      proofDocName,
      additionalNotes,
    };

    try {
      const res = await odApi.resubmitODRequest(id, payload);
      setOd(res.data);
      setIsResubmitting(false);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE') {
          const updated: ODApplication = {
            ...od,
            ...payload,
            status: 'PENDING' as ODStatus,
            timeline: [
              ...(od.timeline || []),
              {
                id: `tl-${Date.now()}`,
                title: 'Resubmitted for HOD Clearance',
                description: 'Updated based on revision remarks',
                date: new Date().toISOString().split('T')[0],
                status: 'CURRENT',
              },
            ],
          };
          setOd(updated);
          setIsBackendBlocked(true);
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to resubmit OD application.');
      }
    } finally {
      setIsResubmitting(false);
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

      {/* Backend Dependency Banner */}
      {isBackendBlocked && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            Backend Dependency Notice: `/api/v1/od-requests/${id}` Endpoint Offline
          </div>
          <p className="text-amber-800">
            The server-side endpoint for OD request details and resubmission is currently being implemented by the backend team. Displaying client integration state and contract structures.
          </p>
        </div>
      )}

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
                    {od.fromTime} – {od.toTime}
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
                  {user?.name || od.studentName}
                </p>
                <p className="text-[11px] text-[#586658]">
                  {user?.registerNumber || od.studentRegNo} · {user?.department || od.department} {user?.section ? `-${user.section}` : ''}
                </p>
              </div>
            </div>

            {/* Purpose & Reason */}
            <div className="space-y-2 pt-2 border-t border-[#dfe6dc]">
              <span className="text-xs font-bold text-[#172017]">Purpose &amp; Objective</span>
              <p className="text-xs text-[#586658] bg-[#f7f9f5] p-3.5 rounded-lg border border-[#dfe6dc] whitespace-pre-line leading-relaxed">
                {od.reason}
              </p>
            </div>

            {/* Additional Notes */}
            {od.additionalNotes && (
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#172017]">Additional Notes</span>
                <p className="text-xs text-[#586658]">{od.additionalNotes}</p>
              </div>
            )}

            {/* Proof Attachment */}
            {od.proofDocName && (
              <div className="flex items-center justify-between p-3 bg-[#eaf7e8] border border-[#dfe6dc] rounded-lg text-xs">
                <div className="flex items-center gap-2 text-[#0a5c36] font-medium">
                  <FileText className="w-4 h-4" />
                  <span>{od.proofDocName}</span>
                </div>
                <span className="text-[10px] font-bold bg-white text-[#0a5c36] px-2 py-0.5 rounded border border-[#dfe6dc]">
                  Attached Document
                </span>
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

          {/* Section 6: Resubmission Form for REVISION_REQUESTED State */}
          {od.status === 'REVISION_REQUESTED' && (
            <div className="bg-white rounded-xl border border-amber-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="border-b border-amber-200 pb-4 space-y-1">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Resubmit OD Request</span>
                </div>
                <p className="text-xs text-[#586658]">
                  Update your application details according to the HOD directives above. Submitting this form will transition status from <strong className="text-amber-800">REVISION_REQUESTED</strong> to <strong className="text-[#0a5c36]">PENDING</strong>.
                </p>
              </div>

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
                  <label className="text-xs font-bold text-[#172017]">Additional Clarifications for HOD</label>
                  <Textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={2}
                    placeholder="Provide additional details regarding the requested changes..."
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

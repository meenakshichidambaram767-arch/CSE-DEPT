'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ODStatus, ODPurpose } from '@/types';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileCheck,
  Calendar as CalendarIcon,
  MapPin,
  Users,
} from 'lucide-react';

export default function HODRequestsPage() {
  const { odApplications, odEvents, bulkApproveOD } = useData();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Filter applications
  const filtered = odApplications.filter((app) => {
    // Tab filter
    if (activeTab === 'PENDING' && app.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && app.status !== 'APPROVED') return false;
    if (activeTab === 'REJECTED' && app.status !== 'REJECTED') return false;

    // Purpose filter
    if (selectedPurpose !== 'ALL' && app.purpose !== selectedPurpose) return false;

    // Year filter
    if (selectedYear !== 'ALL' && app.year !== selectedYear) return false;

    // Search filter
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      const matchName = app.studentName.toLowerCase().includes(q);
      const matchReg = app.studentRegNo.toLowerCase().includes(q);
      const matchEvent = app.eventName.toLowerCase().includes(q);
      const matchVenue = app.venue?.toLowerCase().includes(q) || false;
      return matchName || matchReg || matchEvent || matchVenue;
    }

    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(filtered.map((r) => r.id));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedRequests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedRequests.length === 0) return;
    bulkApproveOD(selectedRequests);
    setSelectedRequests([]);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            REQUESTS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review and clear student On-Duty applications
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('PENDING')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'PENDING'
                ? 'bg-emerald-900 text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pending ({odApplications.filter((r) => r.status === 'PENDING').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('APPROVED')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'APPROVED'
                ? 'bg-emerald-900 text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Approved ({odApplications.filter((r) => r.status === 'APPROVED').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REJECTED')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'REJECTED'
                ? 'bg-emerald-900 text-amber-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rejected ({odApplications.filter((r) => r.status === 'REJECTED').length})
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, register no, event, or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
            >
              <option value="ALL">All Purposes</option>
              <option value="HACKATHON">Hackathon</option>
              <option value="PROJECT">Project</option>
              <option value="INTERNSHIP">Internship</option>
              <option value="WORKSHOP">Workshop</option>
              <option value="COMPETITION">Competition</option>
              <option value="CONFERENCE">Conference</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">All Years</option>
            <option value="I">I Year</option>
            <option value="II">II Year</option>
            <option value="III">III Year</option>
            <option value="IV">IV Year</option>
          </select>

          {activeTab === 'PENDING' && selectedRequests.length > 0 && (
            <button
              type="button"
              onClick={handleBulkApprove}
              className="px-4 py-2 bg-emerald-800 text-amber-300 text-xs font-bold rounded-lg shadow-xs hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
              Approve selected ({selectedRequests.length})
            </button>
          )}
        </div>
      </div>

      {/* Requests List View */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No OD requests match the selected filters.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
          {/* Header Row */}
          {activeTab === 'PENDING' && (
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRequests.length === filtered.length && filtered.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                />
                <span>Select all visible ({filtered.length})</span>
              </label>
            </div>
          )}

          {filtered.map((req) => (
            <div
              key={req.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
            >
              <div className="flex items-start gap-4">
                {activeTab === 'PENDING' && (
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(req.id)}
                    onChange={() => handleSelectOne(req.id)}
                    className="mt-1 rounded border-slate-300 text-emerald-800 focus:ring-emerald-700"
                  />
                )}

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 uppercase">
                      {req.purpose || 'EVENT'}
                    </span>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {req.eventName}
                    </h3>

                    {req.conflict?.hasConflict && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                        Possible Conflict
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {req.studentName} <span className="text-slate-400 font-normal">({req.studentRegNo})</span> · Year {req.year} {req.section && `· Sec ${req.section}`}
                  </p>

                  <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {req.date || req.startDate}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {req.venue || 'CSE Dept'}
                    </span>
                    {req.fromTime && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {req.fromTime} – {req.toTime}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {req.status === 'APPROVED' && (
                  <span className="px-3 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approved
                  </span>
                )}

                {req.status === 'REJECTED' && (
                  <span className="px-3 py-1 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 rounded-lg flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Rejected
                  </span>
                )}

                <Link
                  href={`/hod/requests/${req.id}`}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                >
                  Review
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

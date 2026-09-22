'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import {
  Search,
  Filter as FilterIcon,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';

export default function HODRequestsPage() {
  const { odApplications, bulkApproveOD } = useData();
  const router = useRouter();

  const [activeStatus, setActiveStatus] = useState<string>('PENDING');
  const [selectedPurpose, setSelectedPurpose] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = odApplications.filter((app) => {
    if (activeStatus !== 'ALL' && app.status !== activeStatus) return false;
    if (selectedPurpose !== 'ALL' && app.purpose !== selectedPurpose) return false;
    if (selectedYear !== 'ALL' && app.year !== selectedYear) return false;

    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase();
      return (
        app.studentName.toLowerCase().includes(q) ||
        app.studentRegNo.toLowerCase().includes(q) ||
        app.eventName.toLowerCase().includes(q) ||
        (app.venue && app.venue.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    if (selectedIds.length === 0) return;
    bulkApproveOD(selectedIds);
    setSelectedIds([]);
  };

  const activeFiltersCount =
    (activeStatus !== 'ALL' ? 1 : 0) +
    (selectedPurpose !== 'ALL' ? 1 : 0) +
    (selectedYear !== 'ALL' ? 1 : 0);

  return (
    <div className="space-y-10 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Requests
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Review and clear student On-Duty applications.
          </p>
        </div>

        {selectedIds.length > 0 && activeStatus === 'PENDING' && (
          <button
            type="button"
            onClick={handleBulkApprove}
            className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Approve selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {/* Global Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search students, events, register numbers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
          </div>

          {/* Filter Popover Trigger */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2 rounded-lg border text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                isFilterOpen || activeFiltersCount > 0
                  ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100'
                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-40 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Purpose
                  </label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ALL">All Purposes</option>
                    <option value="HACKATHON">Hackathon</option>
                    <option value="PROJECT">Project</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="COMPETITION">Competition</option>
                    <option value="CONFERENCE">Conference</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="ALL">All Years</option>
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStatus('ALL');
                      setSelectedPurpose('ALL');
                      setSelectedYear('ALL');
                    }}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 text-[11px]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[11px] font-medium rounded"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Removable Active Filter Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {activeStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              Status: {activeStatus.toLowerCase()}
              <button
                type="button"
                onClick={() => setActiveStatus('ALL')}
                className="hover:text-zinc-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedPurpose !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              Purpose: {selectedPurpose.toLowerCase()}
              <button
                type="button"
                onClick={() => setSelectedPurpose('ALL')}
                className="hover:text-zinc-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedYear !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              Year: {selectedYear}
              <button
                type="button"
                onClick={() => setSelectedYear('ALL')}
                className="hover:text-zinc-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400">
          No OD requests found matching your filters.
        </div>
      ) : (
        <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 border-t border-b border-zinc-200/80 dark:border-zinc-800/80">
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => router.push(`/hod/requests/${req.id}`)}
              className="py-5 flex items-center justify-between gap-6 group hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 px-3 -mx-3 rounded-lg transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-4 min-w-0">
                {activeStatus === 'PENDING' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(req.id)}
                    onClick={(e) => handleSelectOne(e, req.id)}
                    className="mt-1 rounded border-zinc-300 dark:border-zinc-700 text-emerald-800 focus:ring-emerald-700 shrink-0"
                  />
                )}

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {req.eventName}
                    </h2>
                    <StatusIndicator status={req.status} />
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    {req.studentName} · {req.studentRegNo} · Year {req.year}
                  </p>

                  <p className="text-xs text-zinc-400">
                    {req.date || req.startDate} · {req.venue || 'CSE Department'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 inline-flex items-center gap-1 transition-colors">
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


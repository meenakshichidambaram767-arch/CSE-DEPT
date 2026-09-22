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
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET OD Review
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            OD Requests Inbox
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Review, verify supporting documents, and grant official attendance clearance.
          </p>
        </div>

        {selectedIds.length > 0 && activeStatus === 'PENDING' && (
          <button
            type="button"
            onClick={handleBulkApprove}
            className="px-3.5 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            Approve selected ({selectedIds.length})
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          {/* Global Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
            <input
              type="text"
              placeholder="Search student, event, register number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#dfe6dc] rounded-md text-xs text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#0a5c36] focus:ring-1 focus:ring-[#0a5c36]"
            />
          </div>

          {/* Filter Popover Trigger */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-3 py-2 rounded-md border text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                isFilterOpen || activeFiltersCount > 0
                  ? 'bg-[#eaf7e8] border-[#0a5c36] text-[#0a5c36]'
                  : 'bg-white border-[#dfe6dc] text-[#586658] hover:text-[#172017]'
              }`}
            >
              <FilterIcon className="w-3.5 h-3.5" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#0a5c36] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white border border-[#dfe6dc] shadow-lg z-40 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={activeStatus}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                    Purpose
                  </label>
                  <select
                    value={selectedPurpose}
                    onChange={(e) => setSelectedPurpose(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017]"
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
                  <label className="block text-[11px] font-bold text-[#586658] uppercase tracking-wider mb-1">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-xs text-[#172017]"
                  >
                    <option value="ALL">All Years</option>
                    <option value="I">I Year</option>
                    <option value="II">II Year</option>
                    <option value="III">III Year</option>
                    <option value="IV">IV Year</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-[#dfe6dc] flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStatus('ALL');
                      setSelectedPurpose('ALL');
                      setSelectedYear('ALL');
                    }}
                    className="text-[#889688] hover:text-[#172017] text-[11px]"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="px-2.5 py-1 bg-[#0a5c36] text-white text-[11px] font-medium rounded"
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
              Status: {activeStatus.toLowerCase()}
              <button
                type="button"
                onClick={() => setActiveStatus('ALL')}
                className="hover:text-[#172017]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedPurpose !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
              Purpose: {selectedPurpose.toLowerCase()}
              <button
                type="button"
                onClick={() => setSelectedPurpose('ALL')}
                className="hover:text-[#172017]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {selectedYear !== 'ALL' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
              Year: {selectedYear}
              <button
                type="button"
                onClick={() => setSelectedYear('ALL')}
                className="hover:text-[#172017]"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Requests List */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#889688] bg-white rounded-lg border border-[#dfe6dc]">
          No OD requests found matching your parameters.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#dfe6dc] divide-y divide-[#edf2ea] shadow-2xs overflow-hidden">
          {filtered.map((req) => (
            <div
              key={req.id}
              onClick={() => router.push(`/hod/requests/${req.id}`)}
              className="p-4 flex items-center justify-between gap-4 hover:bg-[#f2f9f1] transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-3 min-w-0">
                {activeStatus === 'PENDING' && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(req.id)}
                    onClick={(e) => handleSelectOne(e, req.id)}
                    className="mt-1 rounded border-[#dfe6dc] text-[#0a5c36] focus:ring-[#0a5c36] shrink-0"
                  />
                )}

                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-sm font-semibold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate">
                      {req.eventName}
                    </h2>
                    <StatusIndicator status={req.status} />
                  </div>

                  <p className="text-xs text-[#586658]">
                    {req.studentName} · <span className="tabular-nums font-mono text-[11px]">{req.studentRegNo}</span> · Year {req.year}
                  </p>

                  <p className="text-[11px] text-[#889688] tabular-nums">
                    {req.date || req.startDate} · {req.venue || 'CSE Department'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-[#0a5c36] inline-flex items-center gap-1 group-hover:underline">
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

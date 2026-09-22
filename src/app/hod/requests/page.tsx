'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Search, ArrowRight, Check, X } from 'lucide-react';

export default function HODRequestsPage() {
  const { odApplications, bulkApproveOD } = useData();
  const router = useRouter();

  // Simple 3-Tab switcher: 'PENDING' | 'APPROVED' | 'ALL'
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // Quiet Select Mode for Bulk Actions (hidden by default)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingCount = odApplications.filter((r) => r.status === 'PENDING').length;
  const approvedCount = odApplications.filter((r) => r.status === 'APPROVED').length;

  const filtered = odApplications.filter((app) => {
    if (activeTab === 'PENDING' && app.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && app.status !== 'APPROVED') return false;

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

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((r) => r.id));
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
    setIsSelectMode(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#dfe6dc] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            OD Requests
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Review and clear student On-Duty applications.
          </p>
        </div>

        {/* Quiet Select Toggle Button */}
        {activeTab === 'PENDING' && pendingCount > 0 && (
          <div className="flex items-center gap-2">
            {isSelectMode ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 text-xs font-semibold text-[#586658] hover:text-[#172017]"
                >
                  {selectedIds.length === filtered.length ? 'Deselect all' : 'Select all'}
                </button>

                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkApprove}
                    className="px-3 py-1 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve ({selectedIds.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setIsSelectMode(false);
                    setSelectedIds([]);
                  }}
                  className="p-1 text-[#889688] hover:text-[#172017] rounded"
                  title="Cancel selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSelectMode(true)}
                className="px-3 py-1 text-xs font-semibold text-[#586658] hover:text-[#0a5c36] hover:bg-[#f2f9f1] rounded-md border border-[#dfe6dc] transition-colors"
              >
                Select
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. SIMPLE 3-TAB SWITCHER & SEARCH */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* 3-Tab Switcher */}
        <div className="flex items-center gap-1 bg-[#f7f9f5] p-1 rounded-lg border border-[#dfe6dc]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('PENDING');
              setIsSelectMode(false);
              setSelectedIds([]);
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'PENDING'
                ? 'bg-white text-[#172017] shadow-xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            <span>Pending</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#facc15] text-[#172017] font-bold">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('APPROVED');
              setIsSelectMode(false);
              setSelectedIds([]);
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'APPROVED'
                ? 'bg-white text-[#172017] shadow-xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            <span>Approved</span>
            <span className="text-[10px] text-[#586658] font-normal tabular-nums">
              ({approvedCount})
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ALL');
              setIsSelectMode(false);
              setSelectedIds([]);
            }}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'ALL'
                ? 'bg-white text-[#172017] shadow-xs'
                : 'text-[#586658] hover:text-[#172017]'
            }`}
          >
            All
          </button>
        </div>

        {/* Minimal Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
          <input
            type="text"
            placeholder="Search student, roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dfe6dc] rounded-md text-xs text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#0a5c36]"
          />
        </div>
      </div>

      {/* 3. EDITORIAL 2-LINE REQUEST ROWS */}
      {filtered.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-lg border border-[#dfe6dc] space-y-1">
          <p className="text-xs font-bold text-[#172017]">
            {activeTab === 'PENDING'
              ? '✓ No pending requests.'
              : 'No requests found.'}
          </p>
          <p className="text-[11px] text-[#586658]">
            {activeTab === 'PENDING'
              ? 'All student OD applications have been reviewed.'
              : 'Try clearing your search term.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-[#dfe6dc] divide-y divide-[#edf2ea] shadow-2xs overflow-hidden">
          {filtered.map((req) => {
            const isSelected = selectedIds.includes(req.id);

            return (
              <div
                key={req.id}
                onClick={() => router.push(`/hod/requests/${req.id}`)}
                className={`p-3.5 sm:px-4 flex items-center justify-between gap-4 hover:bg-[#f2f9f1] transition-colors cursor-pointer group ${
                  isSelected ? 'bg-[#eaf7e8]/60' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Checkbox (shown only in select mode) */}
                  {isSelectMode && activeTab === 'PENDING' && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onClick={(e) => handleSelectOne(e, req.id)}
                      className="rounded border-[#dfe6dc] text-[#0a5c36] focus:ring-[#0a5c36] shrink-0"
                    />
                  )}

                  {/* 2-Line Content */}
                  <div className="space-y-0.5 min-w-0">
                    {/* Line 1: Student Name + Event Title */}
                    <div className="flex items-baseline gap-2 truncate">
                      <span className="text-xs font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate">
                        {req.studentName}
                      </span>
                      <span className="text-xs text-[#586658] truncate">
                        — {req.eventName}
                      </span>
                      {activeTab !== 'PENDING' && (
                        <StatusIndicator status={req.status} showDot={true} className="ml-1" />
                      )}
                    </div>

                    {/* Line 2: Roll No · Date · Category · Venue */}
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums truncate">
                      {req.studentRegNo} · {req.date || req.startDate} · <span className="font-sans text-[#0a5c36] font-semibold">{req.purpose}</span> · {req.venue || 'CSE'}
                    </p>
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs font-semibold text-[#0a5c36] inline-flex items-center gap-0.5 group-hover:underline">
                    <span>Review</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

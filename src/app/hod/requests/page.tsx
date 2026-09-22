'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { StatusIndicator } from '@/components/ui/StatusIndicator';
import { Search, ArrowRight, Check, X, Users, Filter, GraduationCap } from 'lucide-react';

const CATEGORY_TABS = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'HACKATHON', label: 'Hackathons' },
  { id: 'INTERNSHIP', label: 'Internships' },
  { id: 'PROJECT', label: 'Projects' },
  { id: 'WORKSHOP', label: 'Workshops' },
  { id: 'CONFERENCE', label: 'Conferences' },
];

function RequestsContent() {
  const { odApplications, bulkApproveOD } = useData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventQueryParam = searchParams.get('event');

  // Simple 3-Tab switcher: 'PENDING' | 'APPROVED' | 'ALL'
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'ALL'>('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Category Filter (Pills)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // 2. Students Filter: Academic Year & Section
  const [selectedYear, setSelectedYear] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  // Quiet Select Mode for Bulk Actions (hidden by default)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const pendingCount = odApplications.filter((r) => r.status === 'PENDING').length;
  const approvedCount = odApplications.filter((r) => r.status === 'APPROVED').length;

  const filtered = odApplications.filter((app) => {
    // Status Tab
    if (activeTab === 'PENDING' && app.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && app.status !== 'APPROVED') return false;

    // Category Filter
    if (selectedCategory !== 'ALL') {
      if (selectedCategory === 'CONFERENCE') {
        if (app.purpose !== 'CONFERENCE' && app.purpose !== 'COMPETITION') return false;
      } else if (app.purpose !== selectedCategory) {
        return false;
      }
    }

    // Students Filter: Year
    if (selectedYear !== 'ALL') {
      if (app.year !== selectedYear) return false;
    }

    // Students Filter: Section
    if (selectedSection !== 'ALL') {
      const appSec = app.section || 'A';
      if (appSec !== selectedSection) return false;
    }

    // Search Filter
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

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedSection !== 'ALL' ||
    searchTerm.trim() !== '';

  const handleClearAll = () => {
    setSelectedCategory('ALL');
    setSelectedYear('ALL');
    setSelectedSection('ALL');
    setSearchTerm('');
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

      {/* 2. 3-TAB SWITCHER & SEARCH */}
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

      {/* 3. CATEGORY PILLS & STUDENTS FILTERS BAR */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2.5 rounded-lg bg-[#f7f9f5] border border-[#dfe6dc]">
          {/* Category Horizontal Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {CATEGORY_TABS.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#0a5c36] text-white shadow-2xs'
                      : 'bg-white text-[#586658] border border-[#dfe6dc] hover:bg-[#eaf7e8] hover:text-[#0a5c36]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Students Filter: Academic Year & Section */}
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#dfe6dc]">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[#586658]">
              <GraduationCap className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span>Students:</span>
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`py-1 px-2 rounded-md border text-xs font-semibold focus:outline-none ${
                selectedYear !== 'ALL'
                  ? 'bg-[#eaf7e8] border-[#0a5c36] text-[#0a5c36]'
                  : 'bg-white border-[#dfe6dc] text-[#172017]'
              }`}
            >
              <option value="ALL">All Years</option>
              <option value="II">II Year</option>
              <option value="III">III Year</option>
              <option value="IV">IV Year</option>
              <option value="I">I Year</option>
            </select>

            {/* Section Selector */}
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={`py-1 px-2 rounded-md border text-xs font-semibold focus:outline-none ${
                selectedSection !== 'ALL'
                  ? 'bg-[#eaf7e8] border-[#0a5c36] text-[#0a5c36]'
                  : 'bg-white border-[#dfe6dc] text-[#172017]'
              }`}
            >
              <option value="ALL">All Sections</option>
              <option value="A">Section CSE-A</option>
              <option value="B">Section CSE-B</option>
            </select>
          </div>
        </div>

        {/* 4. REMOVABLE CHIP BADGES */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <span className="text-[11px] font-semibold text-[#586658] mr-1">Active filters:</span>

            {/* Category Tag */}
            {selectedCategory !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
                <span>Category: {CATEGORY_TABS.find((c) => c.id === selectedCategory)?.label}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="hover:text-red-700 ml-0.5"
                  title="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Year Tag */}
            {selectedYear !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
                <span>Year: {selectedYear} Year</span>
                <button
                  type="button"
                  onClick={() => setSelectedYear('ALL')}
                  className="hover:text-red-700 ml-0.5"
                  title="Remove year filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Section Tag */}
            {selectedSection !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
                <span>Section: CSE-{selectedSection}</span>
                <button
                  type="button"
                  onClick={() => setSelectedSection('ALL')}
                  className="hover:text-red-700 ml-0.5"
                  title="Remove section filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Search Query Tag */}
            {searchTerm.trim() !== '' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#eaf7e8] text-[#0a5c36] border border-[#dfe6dc]">
                <span>Search: &ldquo;{searchTerm}&rdquo;</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-red-700 ml-0.5"
                  title="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All Button */}
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-[#0a5c36] hover:underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* 5. EDITORIAL 2-LINE REQUEST ROWS */}
      {filtered.length === 0 ? (
        <div className="py-14 text-center bg-white rounded-lg border border-[#dfe6dc] space-y-1">
          <p className="text-xs font-bold text-[#172017]">
            {activeTab === 'PENDING' && !hasActiveFilters
              ? '✓ No pending requests.'
              : 'No matching requests found.'}
          </p>
          <p className="text-[11px] text-[#586658]">
            {hasActiveFilters
              ? 'Try removing or resetting some of your category and student filters.'
              : 'All student OD applications have been reviewed.'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAll}
              className="mt-2 text-xs font-bold text-[#0a5c36] hover:underline"
            >
              Clear all filters
            </button>
          )}
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

                    {/* Line 2: Roll No · Year · Section · Date · Category · Venue */}
                    <p className="text-[11px] text-[#586658] font-mono tabular-nums truncate">
                      {req.studentRegNo} · Year {req.year} {req.section ? `(${req.section})` : '(A)'} · {req.date || req.startDate} · <span className="font-sans text-[#0a5c36] font-semibold">{req.purpose}</span> · {req.venue || 'CSE'}
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

export default function HODRequestsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-[#889688]">Loading requests...</div>}>
      <RequestsContent />
    </Suspense>
  );
}

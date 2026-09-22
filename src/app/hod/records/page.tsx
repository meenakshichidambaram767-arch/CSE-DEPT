'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Search, Download, Printer, Filter, X } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function HODRecordsPage() {
  const { odApplications } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');

  // Filter records
  const filteredRecords = odApplications.filter((rec) => {
    if (selectedPurpose !== 'ALL' && rec.purpose !== selectedPurpose) return false;
    if (selectedStatus !== 'ALL' && rec.status !== selectedStatus) return false;
    if (selectedYear !== 'ALL' && rec.year !== selectedYear) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = rec.studentName.toLowerCase().includes(q);
      const matchReg = rec.studentRegNo.toLowerCase().includes(q);
      const matchEvent = rec.eventName.toLowerCase().includes(q);
      return matchName || matchReg || matchEvent;
    }
    return true;
  });

  // Export CSV handler
  const handleExportCSV = () => {
    const headers = ['Student Name', 'Register No', 'Year', 'Section', 'Event', 'Purpose', 'Date', 'Status'];
    const rows = filteredRecords.map((r) => [
      `"${r.studentName}"`,
      `"${r.studentRegNo}"`,
      `"${r.year}"`,
      `"${r.section || 'A'}"`,
      `"${r.eventName}"`,
      `"${r.purpose || 'EVENT'}"`,
      `"${r.date || r.startDate}"`,
      `"${r.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CSE_OD_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF / Print handler
  const handlePrintPDF = () => {
    window.print();
  };

  const hasActiveFilters = selectedPurpose !== 'ALL' || selectedStatus !== 'ALL' || selectedYear !== 'ALL';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Department Records
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Departmental master audit log and official on-duty clearance archives
          </p>
        </div>

        {/* Quiet Export Actions */}
        <div className="flex items-center gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-lg border border-zinc-200/80 dark:border-zinc-800 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-medium rounded-lg border border-zinc-200/80 dark:border-zinc-800 shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-500" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student name, register number, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            className="bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Purposes</option>
            <option value="HACKATHON">Hackathon</option>
            <option value="PROJECT">Project</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="WORKSHOP">Workshop</option>
            <option value="CONFERENCE">Conference</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white dark:bg-zinc-900 text-xs text-zinc-700 dark:text-zinc-300 py-1.5 px-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 focus:outline-none shadow-2xs"
          >
            <option value="ALL">All Years</option>
            <option value="I">Year I</option>
            <option value="II">Year II</option>
            <option value="III">Year III</option>
            <option value="IV">Year IV</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSelectedPurpose('ALL');
                setSelectedStatus('ALL');
                setSelectedYear('ALL');
              }}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 px-2 py-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Structured Master Data Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 dark:bg-zinc-850/60 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register No</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    No departmental records match current parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">
                      {rec.studentName}
                      <span className="block text-[11px] font-normal text-zinc-400 mt-0.5">
                        Year {rec.year} {rec.section && `· Sec ${rec.section}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 tabular-nums">
                      {rec.studentRegNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100 max-w-[240px] truncate">
                      {rec.eventName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                        {rec.purpose || 'EVENT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {rec.date || rec.startDate}
                    </td>
                    <td className="py-3 px-4">
                      <StatusIndicator status={rec.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

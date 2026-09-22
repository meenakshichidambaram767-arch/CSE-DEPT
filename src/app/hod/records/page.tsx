'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Search, Download, Printer, X } from 'lucide-react';
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
    link.setAttribute('download', `SIET_CSE_OD_Records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const hasActiveFilters = selectedPurpose !== 'ALL' || selectedStatus !== 'ALL' || selectedYear !== 'ALL';

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Autonomous · NAAC Clearance
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Department Master Records &amp; Archive
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Department master audit log, attendance clearances, and accreditation archive.
          </p>
        </div>

        {/* Export Actions */}
        <div className="flex items-center gap-2 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export Excel (CSV)
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-3 py-1.5 bg-white hover:bg-[#f2f9f1] text-[#172017] text-xs font-semibold rounded-md border border-[#dfe6dc] shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-[#586658]" />
            Print Report
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
          <input
            type="text"
            placeholder="Search student, register number, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white text-xs text-[#172017] placeholder:text-[#889688] rounded-md border border-[#dfe6dc] focus:outline-none focus:border-[#0a5c36]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPurpose}
            onChange={(e) => setSelectedPurpose(e.target.value)}
            className="bg-white text-xs text-[#172017] py-1.5 px-2.5 rounded-md border border-[#dfe6dc] focus:outline-none"
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
            className="bg-white text-xs text-[#172017] py-1.5 px-2.5 rounded-md border border-[#dfe6dc] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-white text-xs text-[#172017] py-1.5 px-2.5 rounded-md border border-[#dfe6dc] focus:outline-none"
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
              className="text-xs font-semibold text-[#889688] hover:text-[#172017] flex items-center gap-1 px-1.5 py-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Structured Master Data Table */}
      <div className="bg-white rounded-lg border border-[#dfe6dc] overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#eaf7e8] text-[#0a5c36] text-[11px] font-bold uppercase tracking-wider border-b border-[#dfe6dc]">
                <th className="py-2.5 px-4">Student</th>
                <th className="py-2.5 px-4">Register No</th>
                <th className="py-2.5 px-4">Event</th>
                <th className="py-2.5 px-4">Purpose</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ea] text-xs text-[#172017]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#889688]">
                    No departmental records match current parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#f2f9f1] transition-colors">
                    <td className="py-3 px-4 font-bold text-[#172017]">
                      {rec.studentName}
                      <span className="block text-[11px] font-normal text-[#586658]">
                        Year {rec.year} {rec.section && `· Sec ${rec.section}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#586658] font-mono tabular-nums">
                      {rec.studentRegNo}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#172017] max-w-[220px] truncate">
                      {rec.eventName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#f7f9f5] border border-[#dfe6dc] text-[#0a5c36] uppercase">
                        {rec.purpose || 'EVENT'}
                      </span>
                    </td>
                    <td className="py-3 px-4 tabular-nums text-[#586658]">
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

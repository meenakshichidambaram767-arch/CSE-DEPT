'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Search, Filter, Download, Printer, FileSpreadsheet, CheckCircle2, XCircle, Clock } from 'lucide-react';

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

  // Export CSV / Excel handler
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

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            OD ARCHIVE & RECORDS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Departmental master audit log and NAAC clearance archives
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-3 print:hidden">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-amber-300" />
            Export Excel (CSV)
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 border border-slate-700"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Export PDF / Print
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records by student, register number, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
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
            <option value="CONFERENCE">Conference</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

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
        </div>
      </div>

      {/* Structured Master Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-amber-300 text-xs font-bold uppercase tracking-wider">
                <th className="p-4 border-b border-emerald-800">Student</th>
                <th className="p-4 border-b border-emerald-800">Register No</th>
                <th className="p-4 border-b border-emerald-800">Event</th>
                <th className="p-4 border-b border-emerald-800">Purpose</th>
                <th className="p-4 border-b border-emerald-800">Date</th>
                <th className="p-4 border-b border-emerald-800">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No departmental records matching current parameters.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {rec.studentName}
                      <span className="block text-[10px] font-normal text-slate-400">Year {rec.year} {rec.section && `· Sec ${rec.section}`}</span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono">{rec.studentRegNo}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{rec.eventName}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase">
                        {rec.purpose || 'EVENT'}
                      </span>
                    </td>
                    <td className="p-4">{rec.date || rec.startDate}</td>
                    <td className="p-4">
                      {rec.status === 'APPROVED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 rounded-md">
                          Approved
                        </span>
                      )}
                      {rec.status === 'PENDING' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 rounded-md">
                          Pending
                        </span>
                      )}
                      {rec.status === 'REJECTED' && (
                        <span className="px-2.5 py-1 text-[11px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950 rounded-md">
                          Rejected
                        </span>
                      )}
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

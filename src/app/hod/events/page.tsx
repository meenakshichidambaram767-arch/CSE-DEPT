'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import {
  Plus,
  Search,
  ArrowRight,
  X,
  MapPin,
  Users,
} from 'lucide-react';
import { ODPurpose, ODEvent } from '@/types';
import StatusIndicator from '@/components/ui/StatusIndicator';

type EventCategoryKey = 'ALL' | 'HACKATHON' | 'INTERNSHIP' | 'PROJECT' | 'WORKSHOP' | 'COMPETITION_CONFERENCE';

interface CategoryConfig {
  key: EventCategoryKey;
  label: string;
  purposes: ODPurpose[];
}

const CATEGORIES: CategoryConfig[] = [
  { key: 'HACKATHON', label: 'Hackathons', purposes: ['HACKATHON'] },
  { key: 'INTERNSHIP', label: 'Internships', purposes: ['INTERNSHIP'] },
  { key: 'PROJECT', label: 'Projects', purposes: ['PROJECT'] },
  { key: 'WORKSHOP', label: 'Workshops', purposes: ['WORKSHOP'] },
  { key: 'COMPETITION_CONFERENCE', label: 'Conferences & Competitions', purposes: ['COMPETITION', 'CONFERENCE'] },
];

export default function HODEventsPage() {
  const { odEvents, odApplications, addODEvent } = useData();
  const [activeTab, setActiveTab] = useState<EventCategoryKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Event Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPurpose, setNewPurpose] = useState<ODPurpose>('HACKATHON');
  const [newDate, setNewDate] = useState('');
  const [newVenue, setNewVenue] = useState('');
  const [newCity, setNewCity] = useState('');

  const searchFilteredEvents = odEvents.filter((evt) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.venue.toLowerCase().includes(q) ||
      (evt.city && evt.city.toLowerCase().includes(q)) ||
      evt.purpose.toLowerCase().includes(q)
    );
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newVenue || !newDate) return;

    const createdEvent: ODEvent = {
      id: `EVT-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      purpose: newPurpose,
      date: newDate,
      formattedDate: new Date(newDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      venue: newVenue,
      city: newCity || 'Coimbatore',
      studentCount: 0,
      approvedCount: 0,
      pendingCount: 0,
      rejectedCount: 0,
      status: 'UPCOMING',
      documents: [],
      odRequestIds: [],
    };

    addODEvent(createdEvent);
    setIsCreateModalOpen(false);
    setNewTitle('');
    setNewVenue('');
    setNewCity('');
    setNewDate('');
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET CSE Catalog
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Academic Events &amp; Opportunities
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Verified department hackathons, industry internships, and student OD groups.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white text-xs font-semibold rounded-md shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-[#0a5c36] text-white shadow-2xs'
                : 'text-[#586658] hover:bg-[#f2f9f1] hover:text-[#172017]'
            }`}
          >
            All ({odEvents.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = odEvents.filter((e) => cat.purposes.includes(e.purpose)).length;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeTab === cat.key
                    ? 'bg-[#0a5c36] text-white shadow-2xs'
                    : 'text-[#586658] hover:bg-[#f2f9f1] hover:text-[#172017]'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
          <input
            type="text"
            placeholder="Search events, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dfe6dc] rounded-md text-xs text-[#172017] placeholder:text-[#889688] focus:outline-none focus:border-[#0a5c36]"
          />
        </div>
      </div>

      {/* Categorized Events Lists */}
      <div className="space-y-6">
        {CATEGORIES.filter((cat) => activeTab === 'ALL' || activeTab === cat.key).map((cat) => {
          const catEvents = searchFilteredEvents.filter((e) => cat.purposes.includes(e.purpose));
          if (catEvents.length === 0) return null;

          return (
            <section key={cat.key} className="bg-white rounded-lg border border-[#dfe6dc] p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="border-b border-[#dfe6dc] pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#facc15]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
                    {cat.label} ({catEvents.length})
                  </h2>
                </div>
              </div>

              <div className="divide-y divide-[#edf2ea]">
                {catEvents.map((evt) => {
                  const eventODs = odApplications.filter(
                    (od) => od.eventId === evt.id || od.eventName === evt.title
                  );
                  const approvedCount = eventODs.filter((od) => od.status === 'APPROVED').length || evt.approvedCount;
                  const pendingCount = eventODs.filter((od) => od.status === 'PENDING').length || evt.pendingCount;
                  const totalStudents = eventODs.length || evt.studentCount;

                  return (
                    <div
                      key={evt.id}
                      className="py-3.5 flex items-center justify-between gap-4 hover:bg-[#f2f9f1] px-2 -mx-2 rounded-md transition-colors group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#facc15]" />
                          <Link
                            href={`/hod/events/${evt.id}`}
                            className="text-sm font-semibold text-[#172017] group-hover:text-[#0a5c36] transition-colors truncate"
                          >
                            {evt.title}
                          </Link>
                        </div>

                        <p className="text-xs text-[#586658] pl-3.5">
                          {evt.formattedDate} · {evt.city || evt.venue}
                        </p>

                        <p className="text-[11px] text-[#586658] pl-3.5 tabular-nums">
                          <span className="font-semibold text-[#172017]">{totalStudents} students</span> · <span className="text-[#0a5c36] font-semibold">{approvedCount} approved</span>
                          {pendingCount > 0 && (
                            <span className="text-[#eab308] font-semibold"> · {pendingCount} pending</span>
                          )}
                        </p>
                      </div>

                      <Link
                        href={`/hod/events/${evt.id}`}
                        className="text-xs font-semibold text-[#0a5c36] inline-flex items-center gap-1 group-hover:underline shrink-0"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white rounded-xl p-6 max-w-md w-full space-y-4 border border-[#dfe6dc] shadow-xl animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-[#dfe6dc] pb-3">
              <h3 className="text-sm font-bold text-[#172017] uppercase">
                Add Department Event
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#889688] hover:text-[#172017]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#172017]">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SIET HackSprint 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-[#172017] focus:outline-none focus:border-[#0a5c36]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#172017]">Category</label>
                  <select
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value as ODPurpose)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-[#172017]"
                  >
                    <option value="HACKATHON">Hackathon</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PROJECT">Project</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="COMPETITION">Competition</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#172017]">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-[#172017]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-semibold text-[#172017]">Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Convention Center"
                    value={newVenue}
                    onChange={(e) => setNewVenue(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-[#172017]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[#172017]">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Chennai / Coimbatore"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2 bg-[#f7f9f5] rounded-md border border-[#dfe6dc] text-[#172017]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dfe6dc]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#586658] hover:text-[#172017]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0a5c36] text-white text-xs font-semibold rounded-md hover:bg-[#084c2c]"
              >
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

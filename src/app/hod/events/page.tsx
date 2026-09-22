'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import {
  Plus,
  Search,
  ArrowRight,
  X
} from 'lucide-react';
import { ODPurpose, ODEvent } from '@/types';

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
    <div className="space-y-10 py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Events
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Department events and group OD enrollment records.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-medium rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New event</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              activeTab === 'ALL'
                ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === cat.key
                    ? 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
          />
        </div>
      </div>

      {/* Categorized Events Lists */}
      <div className="space-y-12">
        {CATEGORIES.filter((cat) => activeTab === 'ALL' || activeTab === cat.key).map((cat) => {
          const catEvents = searchFilteredEvents.filter((e) => cat.purposes.includes(e.purpose));
          if (catEvents.length === 0) return null;

          return (
            <section key={cat.key} className="space-y-3">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {cat.label} ({catEvents.length})
                </h2>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
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
                      className="py-4 flex items-center justify-between gap-6 group hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 px-3 -mx-3 rounded-lg transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <Link
                          href={`/hod/events/${evt.id}`}
                          className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:text-emerald-800 dark:hover:text-emerald-400 transition-colors block truncate"
                        >
                          {evt.title}
                        </Link>
                        <p className="text-xs text-zinc-400">
                          {evt.formattedDate} · {evt.city || evt.venue}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          {totalStudents} students · {approvedCount} approved{pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
                        </p>
                      </div>

                      <Link
                        href={`/hod/events/${evt.id}`}
                        className="text-xs font-semibold text-zinc-400 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 inline-flex items-center gap-1 transition-colors shrink-0"
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
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 max-w-md w-full space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-100 text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                New Department Event
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Purpose Category
                </label>
                <select
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value as ODPurpose)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                >
                  <option value="HACKATHON">Hackathon</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PROJECT">Project Review</option>
                  <option value="WORKSHOP">Workshop</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="CONFERENCE">Conference</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coimbatore"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                  Venue / Host Institution
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IIT Madras Research Park"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-800 text-white text-xs font-medium rounded-md hover:bg-emerald-900 shadow-xs"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




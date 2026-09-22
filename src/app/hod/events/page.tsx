'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import {
  Trophy,
  BriefcaseBusiness,
  FolderKanban,
  GraduationCap,
  Award,
  Sparkles,
  Calendar as CalendarIcon,
  MapPin,
  Users,
  ArrowRight,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { ODPurpose, ODEvent } from '@/types';

type EventCategoryKey = 'ALL' | 'HACKATHON' | 'INTERNSHIP' | 'PROJECT' | 'WORKSHOP' | 'COMPETITION_CONFERENCE';

interface CategoryConfig {
  key: EventCategoryKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  badgeBg: string;
  badgeText: string;
  headerBorder: string;
  purposes: ODPurpose[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'HACKATHON',
    label: 'Hackathons & Tech Sprints',
    shortLabel: 'Hackathons',
    icon: Trophy,
    description: 'National & regional hackathons, SIH entries, and internal department sprints.',
    badgeBg: 'bg-amber-100 dark:bg-amber-950/70',
    badgeText: 'text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    headerBorder: 'border-amber-500/30',
    purposes: ['HACKATHON'],
  },
  {
    key: 'INTERNSHIP',
    label: 'Industrial Internships & Corporate Drives',
    shortLabel: 'Internships',
    icon: BriefcaseBusiness,
    description: 'Corporate internships, NOC clearances, and external industrial training.',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/70',
    badgeText: 'text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    headerBorder: 'border-blue-500/30',
    purposes: ['INTERNSHIP'],
  },
  {
    key: 'PROJECT',
    label: 'Capstone Projects & R&D Expo',
    shortLabel: 'Projects',
    icon: FolderKanban,
    description: 'Industry lab visits, capstone project reviews, and project exhibitions.',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-950/70',
    badgeText: 'text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    headerBorder: 'border-indigo-500/30',
    purposes: ['PROJECT'],
  },
  {
    key: 'WORKSHOP',
    label: 'Technical Bootcamps & Workshops',
    shortLabel: 'Workshops',
    icon: GraduationCap,
    description: 'Specialized tech workshops, Cloud, AI/ML, and hands-on bootcamps.',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/70',
    badgeText: 'text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    headerBorder: 'border-emerald-500/30',
    purposes: ['WORKSHOP'],
  },
  {
    key: 'COMPETITION_CONFERENCE',
    label: 'Conferences & ACM/IEEE Competitions',
    shortLabel: 'Conferences',
    icon: Award,
    description: 'IEEE conferences, paper presentations, and ICPC coding competitions.',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/70',
    badgeText: 'text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    headerBorder: 'border-purple-500/30',
    purposes: ['COMPETITION', 'CONFERENCE'],
  },
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

  // Carousel refs for smooth scroll
  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollCarousel = (catKey: string, direction: 'left' | 'right') => {
    const el = carouselRefs.current[catKey];
    if (el) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Filter events by search query
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

  const getCategoryCount = (cat: CategoryConfig) => {
    return odEvents.filter((e) => cat.purposes.includes(e.purpose)).length;
  };

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
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 p-6 lg:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-800 text-amber-300 font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase">
                HOD Event Clearance & Category Manager
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Organize, track, and monitor student OD enrollment by event categories
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs font-semibold px-3.5 py-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
            {odEvents.length} Active Department Events
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Department Event
          </button>
        </div>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
              activeTab === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'ALL'
                  ? 'bg-slate-700 text-slate-200 dark:bg-slate-200 dark:text-slate-800 font-bold'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {odEvents.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = getCategoryCount(cat);
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveTab(cat.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 border ${
                  isActive
                    ? 'bg-emerald-800 text-amber-300 dark:bg-emerald-700 dark:text-amber-300 border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.shortLabel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isActive
                      ? 'bg-emerald-950 text-amber-300 font-bold'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search event, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Categorized Horizontal Carousels */}
      <div className="space-y-10">
        {CATEGORIES.filter((cat) => activeTab === 'ALL' || activeTab === cat.key).map((cat) => {
          const catEvents = searchFilteredEvents.filter((e) => cat.purposes.includes(e.purpose));
          const Icon = cat.icon;

          if (activeTab !== 'ALL' && catEvents.length === 0) {
            return (
              <div
                key={cat.key}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  No {cat.shortLabel} Listed
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click "Create Department Event" above to create an event in {cat.label}.
                </p>
              </div>
            );
          }

          if (catEvents.length === 0) return null;

          return (
            <section key={cat.key} className="space-y-4">
              {/* Category Header Banner with Carousel Controls */}
              <div className={`flex items-center justify-between border-l-4 ${cat.headerBorder} pl-4 py-1`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl border text-xs ${cat.badgeBg} ${cat.badgeText}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      {cat.label}
                      <span className="text-xs font-semibold text-slate-400">
                        ({catEvents.length} {catEvents.length === 1 ? 'Event' : 'Events'})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {cat.description}
                    </p>
                  </div>
                </div>

                {/* Carousel Scroll Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => scrollCarousel(cat.key, 'left')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-800 hover:text-amber-300 transition-colors shadow-2xs"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(cat.key, 'right')}
                    className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-800 hover:text-amber-300 transition-colors shadow-2xs"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Carousel */}
              <div
                ref={(el) => { carouselRefs.current[cat.key] = el; }}
                className="flex items-stretch gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
              >
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
                      className="w-[310px] md:w-[350px] shrink-0 snap-start bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4 flex flex-col justify-between hover:shadow-md transition-all group hover:border-emerald-700/50"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md uppercase border ${cat.badgeBg} ${cat.badgeText}`}>
                            {evt.purpose}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                            {evt.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                          {evt.title}
                        </h3>

                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">{evt.formattedDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{evt.venue} {evt.city ? `(${evt.city})` : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Participant & Approval Breakdown */}
                      <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 space-y-3">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {totalStudents} Enrolled
                          </span>

                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded font-bold">
                              {approvedCount} Clear
                            </span>
                            {pendingCount > 0 && (
                              <span className="text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded font-bold">
                                {pendingCount} Pending
                              </span>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/hod/events/${evt.id}`}
                          className="w-full py-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-800 hover:text-amber-300 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                        >
                          Manage Approvals & Group
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                Create Department Event
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Smart India Hackathon 2026 Regional"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category Purpose
                </label>
                <select
                  value={newPurpose}
                  onChange={(e) => setNewPurpose(e.target.value as ODPurpose)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                >
                  <option value="HACKATHON">Hackathon</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PROJECT">Project Review / Visit</option>
                  <option value="WORKSHOP">Workshop / Bootcamp</option>
                  <option value="COMPETITION">Competition</option>
                  <option value="CONFERENCE">Conference</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Event Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Coimbatore"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Venue / Location
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PSG Tech Auditorium"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-700 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 text-amber-300 text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-900 transition-colors"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import {
  Trophy,
  Briefcase,
  FolderKanban,
  GraduationCap,
  Award,
  Calendar as CalendarIcon,
  MapPin,
  Search,
  Plus,
  ArrowRight,
  Users,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ODPurpose } from '@/types';
import StatusIndicator from '@/components/ui/StatusIndicator';

type EventCategoryKey = 'ALL' | 'HACKATHON' | 'INTERNSHIP' | 'PROJECT' | 'WORKSHOP' | 'COMPETITION_CONFERENCE';

interface CategoryConfig {
  key: EventCategoryKey;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  description: string;
  purposes: ODPurpose[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'HACKATHON',
    label: 'Hackathons & Coding Sprints',
    shortLabel: 'Hackathons',
    icon: Trophy,
    description: 'National & regional coding hackathons, Smart India Hackathon, and code sprints.',
    purposes: ['HACKATHON'],
  },
  {
    key: 'INTERNSHIP',
    label: 'Internships & Corporate Training',
    shortLabel: 'Internships',
    icon: Briefcase,
    description: 'Industrial internships, winter/summer training, and NOC clearance programs.',
    purposes: ['INTERNSHIP'],
  },
  {
    key: 'PROJECT',
    label: 'R&D Projects & Lab Reviews',
    shortLabel: 'Projects',
    icon: FolderKanban,
    description: 'Industry project evaluations, capstone showcases, and lab assessments.',
    purposes: ['PROJECT'],
  },
  {
    key: 'WORKSHOP',
    label: 'Technical Workshops & Bootcamps',
    shortLabel: 'Workshops',
    icon: GraduationCap,
    description: 'Hands-on tech workshops, Cloud architectures, AI/ML, and DevOps sessions.',
    purposes: ['WORKSHOP'],
  },
  {
    key: 'COMPETITION_CONFERENCE',
    label: 'Conferences & Competitions',
    shortLabel: 'Conferences',
    icon: Award,
    description: 'IEEE symposiums, ACM ICPC programming contests, and research papers.',
    purposes: ['COMPETITION', 'CONFERENCE'],
  },
];

export default function StudentEventsPage() {
  const { odEvents } = useData();
  const [activeTab, setActiveTab] = useState<EventCategoryKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Refs for scrolling carousels
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Events & Opportunities
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Department-approved hackathons, corporate internships, projects, and academic workshops
          </p>
        </div>

        <Link
          href="/student/apply-od"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-950 text-white font-medium text-xs rounded-lg shadow-2xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Apply for OD
        </Link>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              activeTab === 'ALL'
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs'
                : 'bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
            }`}
          >
            <span>All Categories</span>
            <span className="text-[10px] tabular-nums text-zinc-400">
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
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-transparent shadow-2xs'
                    : 'bg-white text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.shortLabel}</span>
                <span className="text-[10px] tabular-nums text-zinc-400">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search event, venue, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Category Carousels / Sections */}
      <div className="space-y-8">
        {CATEGORIES.filter((cat) => activeTab === 'ALL' || activeTab === cat.key).map((cat) => {
          const catEvents = searchFilteredEvents.filter((e) => cat.purposes.includes(e.purpose));
          const Icon = cat.icon;

          if (activeTab !== 'ALL' && catEvents.length === 0) {
            return (
              <div
                key={cat.key}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-10 text-center space-y-2"
              >
                <Icon className="w-6 h-6 text-zinc-400 mx-auto" />
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  No {cat.shortLabel} Found
                </h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  There are currently no events under {cat.label} matching your query.
                </p>
              </div>
            );
          }

          if (catEvents.length === 0) return null;

          return (
            <section key={cat.key} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-1 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-emerald-800 dark:text-emerald-400" />
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {cat.label}
                  </h2>
                  <span className="text-xs text-zinc-400 tabular-nums">
                    ({catEvents.length})
                  </span>
                </div>

                {/* Carousel Navigation Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(cat.key, 'left')}
                    className="p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors shadow-2xs"
                    aria-label="Scroll Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(cat.key, 'right')}
                    className="p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors shadow-2xs"
                    aria-label="Scroll Right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Carousel Container */}
              <div
                ref={(el) => { carouselRefs.current[cat.key] = el; }}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-none"
              >
                {catEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="w-[300px] md:w-[320px] shrink-0 snap-start bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 flex flex-col justify-between space-y-4 shadow-2xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                          {evt.purpose}
                        </span>
                        <StatusIndicator status="APPROVED" text="Open for OD" />
                      </div>

                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors leading-snug line-clamp-2">
                        {evt.title}
                      </h3>

                      <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <CalendarIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{evt.formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate">{evt.venue} {evt.city ? `(${evt.city})` : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 tabular-nums">
                        <Users className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{evt.studentCount} applied</span>
                      </div>

                      <Link
                        href={`/student/apply-od?eventId=${evt.id}&purpose=${evt.purpose}`}
                        className="text-xs font-medium text-emerald-800 dark:text-emerald-400 hover:text-emerald-950 dark:hover:text-emerald-300 inline-flex items-center gap-1"
                      >
                        Apply OD
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

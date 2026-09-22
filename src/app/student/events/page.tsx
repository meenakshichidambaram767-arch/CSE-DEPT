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
  ChevronRight,
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

  const carouselRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollCarousel = (catKey: string, direction: 'left' | 'right') => {
    const el = carouselRefs.current[catKey];
    if (el) {
      const scrollAmount = direction === 'left' ? -340 : 340;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Opportunities
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            Events &amp; OD Opportunities
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Department-approved hackathons, corporate internships, projects, and academic workshops.
          </p>
        </div>

        <Link
          href="/student/apply-od"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0a5c36] hover:bg-[#084c2c] text-white font-bold text-xs rounded-md shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5 text-[#facc15]" />
          <span>Apply for OD</span>
        </Link>
      </div>

      {/* Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
              activeTab === 'ALL'
                ? 'bg-[#0a5c36] text-white border-[#0a5c36] shadow-2xs'
                : 'bg-white text-[#586658] border-[#dfe6dc] hover:bg-[#f2f9f1]'
            }`}
          >
            <span>All</span>
            <span className="text-[10px] tabular-nums text-emerald-200">
              {odEvents.length}
            </span>
          </button>

          {CATEGORIES.map((cat) => {
            const count = getCategoryCount(cat);
            const isActive = activeTab === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveTab(cat.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isActive
                    ? 'bg-[#0a5c36] text-white border-[#0a5c36] shadow-2xs'
                    : 'bg-white text-[#586658] border-[#dfe6dc] hover:bg-[#f2f9f1]'
                }`}
              >
                <span>{cat.shortLabel}</span>
                <span className="text-[10px] tabular-nums opacity-80">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-60 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#889688]" />
          <input
            type="text"
            placeholder="Search event, venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#dfe6dc] rounded-md text-xs text-[#172017] focus:outline-none focus:border-[#0a5c36] placeholder:text-[#889688]"
          />
        </div>
      </div>

      {/* Category Carousels */}
      <div className="space-y-6">
        {CATEGORIES.filter((cat) => activeTab === 'ALL' || activeTab === cat.key).map((cat) => {
          const catEvents = searchFilteredEvents.filter((e) => cat.purposes.includes(e.purpose));
          const Icon = cat.icon;

          if (activeTab !== 'ALL' && catEvents.length === 0) {
            return (
              <div
                key={cat.key}
                className="bg-white rounded-xl border border-[#dfe6dc] p-8 text-center space-y-2"
              >
                <Icon className="w-6 h-6 text-[#889688] mx-auto" />
                <h2 className="text-sm font-bold text-[#172017]">
                  No {cat.shortLabel} Found
                </h2>
                <p className="text-xs text-[#586658] max-w-sm mx-auto">
                  There are currently no events under {cat.label} matching your query.
                </p>
              </div>
            );
          }

          if (catEvents.length === 0) return null;

          return (
            <section key={cat.key} className="bg-white rounded-xl border border-[#dfe6dc] p-4 sm:p-5 space-y-3 shadow-2xs">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#dfe6dc]">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[#0a5c36]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#172017]">
                    {cat.label}
                  </h2>
                  <span className="text-xs text-[#586658] tabular-nums font-semibold">
                    ({catEvents.length})
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(cat.key, 'left')}
                    className="p-1 rounded border border-[#dfe6dc] bg-white hover:bg-[#f2f9f1] text-[#586658] transition-colors"
                    aria-label="Scroll Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(cat.key, 'right')}
                    className="p-1 rounded border border-[#dfe6dc] bg-white hover:bg-[#f2f9f1] text-[#586658] transition-colors"
                    aria-label="Scroll Right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Container */}
              <div
                ref={(el) => { carouselRefs.current[cat.key] = el; }}
                className="flex items-stretch gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-none"
              >
                {catEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="w-[280px] md:w-[300px] shrink-0 snap-start bg-[#f7f9f5] rounded-lg border border-[#dfe6dc] p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:border-[#0a5c36] transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded border border-[#dfe6dc]">
                          {evt.purpose}
                        </span>
                        <StatusIndicator status="APPROVED" text="Open" />
                      </div>

                      <h3 className="text-xs font-bold text-[#172017] group-hover:text-[#0a5c36] transition-colors leading-snug line-clamp-2">
                        {evt.title}
                      </h3>

                      <div className="space-y-1 text-xs text-[#586658] pt-1 border-t border-[#dfe6dc]">
                        <div className="flex items-center gap-1.5 tabular-nums">
                          <CalendarIcon className="w-3.5 h-3.5 text-[#889688] shrink-0" />
                          <span>{evt.formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#889688] shrink-0" />
                          <span className="truncate">{evt.venue}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#dfe6dc] pt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-[11px] text-[#586658] tabular-nums">
                        <Users className="w-3.5 h-3.5 text-[#889688]" />
                        <span>{evt.studentCount} applied</span>
                      </div>

                      <Link
                        href={`/student/apply-od?eventId=${evt.id}&purpose=${evt.purpose}`}
                        className="text-xs font-bold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
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

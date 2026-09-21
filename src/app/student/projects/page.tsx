'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useData } from '@/context/DataContext';
import { Plus, FolderKanban, Sparkles, ExternalLink, Calendar, Users, ArrowRight } from 'lucide-react';

export default function StudentProjectsPage() {
  const { projects } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.technologies.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Capstone &amp; Innovation Projects"
        description="Track academic capstone projects, weekly review schedules, and submit milestone progress."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Projects', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{projects.length} Registered Projects</span>
          </span>
        }
        primaryAction={
          <Link href="/student/activities/new?type=PROJECT">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Submit Project Proposal
            </Button>
          </Link>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search projects by title, stack..."
          className="w-full sm:w-96"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No capstone projects found"
            description="Submit a new project proposal for HOD clearance and faculty guide allocation."
            icon={<FolderKanban className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-emerald-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{p.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      p.status === 'APPROVED' || p.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : p.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                    {p.category || 'Computer Science & AI'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.startDate} to {p.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Team: {p.teamMembers.map((m) => m.name.split(' ')[0]).join(', ')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {p.technologies.map((t, idx) => (
                    <span key={idx} className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/student/od-requests/new?activityId=${p.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Apply for OD
                  </Button>
                </Link>

                <Link href={`/student/projects/${p.id}`}>
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    Project Page
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

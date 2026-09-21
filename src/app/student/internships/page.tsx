'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { useData } from '@/context/DataContext';
import { Plus, BriefcaseBusiness, Sparkles, ExternalLink, Calendar, Users, ArrowRight } from 'lucide-react';

export default function StudentInternshipsPage() {
  const { internships } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = internships.filter(
    (i) =>
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (i.organization && i.organization.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Corporate Internships &amp; NOC Requests"
        description="Register corporate internships, request HOD NOC clearances, and track attendance permissions."
        breadcrumbs={[
          { label: 'Dashboard', href: '/student/dashboard' },
          { label: 'Internships', current: true },
        ]}
        badge={
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>{internships.length} Tracked Internships</span>
          </span>
        }
        primaryAction={
          <Link href="/student/activities/new?type=INTERNSHIP">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Submit Internship Offer
            </Button>
          </Link>
        }
      />

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={searchQuery}
          onChange={(val) => setSearchQuery(val)}
          placeholder="Search internships by company or role..."
          className="w-full sm:w-96"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-2xs">
          <EmptyState
            title="No corporate internships logged"
            description="Submit your company offer letter to obtain HOD clearance and attendance exemptions."
            icon={<BriefcaseBusiness className="w-8 h-8 text-slate-400" />}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((intern) => (
            <div
              key={intern.id}
              className="p-5 rounded-3xl border border-slate-200 bg-white shadow-2xs space-y-4 hover:border-indigo-300 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">{intern.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      intern.status === 'APPROVED' || intern.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : intern.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {intern.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{intern.title}</h3>
                  <p className="text-xs text-indigo-800 font-semibold mt-0.5">
                    {intern.organization || 'Corporate Partner'}
                  </p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {intern.description}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{intern.startDate} to {intern.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Student: {intern.studentName} ({intern.studentRegNo})</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {intern.technologies.map((t, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-800 text-[10px] px-2 py-0.5 rounded font-semibold border border-indigo-200">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link href={`/student/od-requests/new?activityId=${intern.id}`}>
                  <Button size="sm" variant="outline" className="text-xs">
                    Apply for OD
                  </Button>
                </Link>

                <Link href={`/student/projects/${intern.id}`}>
                  <Button size="sm" variant="primary" rightIcon={<ArrowRight className="w-3 h-3" />}>
                    View
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

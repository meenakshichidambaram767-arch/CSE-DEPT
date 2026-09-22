'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { ChevronLeft, ChevronRight, MapPin, Users, ArrowRight, Calendar as CalendarIcon } from 'lucide-react';
import StatusIndicator from '@/components/ui/StatusIndicator';

export default function HODCalendarPage() {
  const { odEvents } = useData();
  const [currentMonth, setCurrentMonth] = useState('September 2026');
  const [selectedDate, setSelectedDate] = useState<string | null>('2026-09-25');

  const daysInMonth = Array.from({ length: 30 }, (_, i) => i + 1);

  const eventsForSelectedDate = selectedDate
    ? odEvents.filter((e) => e.date === selectedDate)
    : odEvents;

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#dfe6dc] pb-4">
        <div>
          <div className="text-[11px] font-bold text-[#0a5c36] uppercase tracking-wider">
            SIET Academic Schedule
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172017]">
            OD Calendar &amp; Schedule
          </h1>
          <p className="text-xs text-[#586658] mt-0.5">
            Departmental timeline of approved On-Duty leaves, hackathons, and company visits.
          </p>
        </div>

        {/* Month Navigator Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#172017] px-3 py-1.5 bg-white rounded-md border border-[#dfe6dc] shadow-2xs">
            <CalendarIcon className="w-3.5 h-3.5 text-[#0a5c36]" />
            <span>{currentMonth}</span>
          </div>
          <div className="flex items-center rounded-md border border-[#dfe6dc] bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              aria-label="Previous month"
              className="p-1 hover:bg-[#f2f9f1] rounded text-[#586658] transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              className="p-1 hover:bg-[#f2f9f1] rounded text-[#586658] transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid + Upcoming Agenda */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Calendar Grid (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#dfe6dc] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[#172017] uppercase">
              September 2026
            </span>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate(null)}
                className="text-[11px] font-semibold text-[#0a5c36] hover:underline"
              >
                Show all events
              </button>
            )}
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#586658] pb-2 border-b border-[#edf2ea]">
            <span>M</span>
            <span>T</span>
            <span>W</span>
            <span>T</span>
            <span>F</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Sept 1, 2026 is Tuesday -> 1 empty cell on Monday */}
            <div className="p-2 rounded-md bg-[#f7f9f5] min-h-[56px]" />

            {daysInMonth.map((dayNum) => {
              const dayStr = `2026-09-${String(dayNum).padStart(2, '0')}`;
              const matchingEvt = odEvents.find((e) => e.date === dayStr);
              const isSelected = selectedDate === dayStr;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDate(dayStr)}
                  className={`p-2 rounded-lg border flex flex-col justify-between items-center transition-all min-h-[56px] relative cursor-pointer ${
                    isSelected
                      ? 'bg-[#0a5c36] text-white border-[#0a5c36] shadow-xs'
                      : matchingEvt
                      ? 'bg-[#eaf7e8] border-[#dfe6dc] text-[#0a5c36] font-bold hover:border-[#0a5c36]'
                      : 'border-transparent text-[#172017] hover:bg-[#f2f9f1]'
                  }`}
                >
                  <span className={`text-xs ${isSelected ? 'font-bold text-white' : 'font-semibold'}`}>
                    {dayNum}
                  </span>

                  {/* Small Yellow Event Dot */}
                  {matchingEvt && (
                    <span
                      className={`w-2 h-2 rounded-full shadow-xs ${
                        isSelected ? 'bg-[#facc15]' : 'bg-[#eab308]'
                      }`}
                      title={matchingEvt.title}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-2 border-t border-[#edf2ea] flex items-center gap-4 text-[11px] text-[#586658]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0a5c36]" />
              <span>Selected date</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#facc15]" />
              <span>OD Event scheduled</span>
            </div>
          </div>
        </div>

        {/* Upcoming Agenda (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[#172017] uppercase">
              {selectedDate ? `Events on ${selectedDate}` : 'Upcoming Agenda'}
            </span>
            <span className="text-[11px] text-[#586658] tabular-nums font-semibold">
              {eventsForSelectedDate.length} item{eventsForSelectedDate.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {eventsForSelectedDate.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-[#dfe6dc] text-xs text-[#889688]">
                No OD events scheduled on this date.
              </div>
            ) : (
              eventsForSelectedDate.map((evt) => {
                const dateParts = evt.formattedDate.split(' ');
                const dayMonth = `${dateParts[0]} ${dateParts[1]?.toUpperCase() || ''}`;

                return (
                  <div
                    key={evt.id}
                    className="bg-white rounded-xl border border-[#dfe6dc] p-4 space-y-3 shadow-2xs hover:border-[#0a5c36] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#0a5c36] bg-[#eaf7e8] px-2 py-0.5 rounded">
                          {evt.purpose}
                        </span>
                        <h3 className="text-sm font-bold text-[#172017] leading-snug">
                          {evt.title}
                        </h3>
                      </div>
                      <span className="shrink-0 px-2 py-1 bg-[#f7f9f5] border border-[#dfe6dc] text-[#0a5c36] text-[10px] font-bold rounded tabular-nums">
                        {dayMonth}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-[#586658] pt-1 border-t border-[#edf2ea]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-[#889688]" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <Users className="w-3.5 h-3.5 shrink-0 text-[#889688]" />
                        <span>{evt.studentCount} approved students</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-[#edf2ea]">
                      <StatusIndicator status="APPROVED" text="Approved Leave" />
                      <Link
                        href={`/hod/events/${evt.id}`}
                        className="text-xs font-semibold text-[#0a5c36] hover:underline inline-flex items-center gap-1"
                      >
                        View Details
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

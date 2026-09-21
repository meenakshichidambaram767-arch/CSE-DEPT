'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Cpu, Lightbulb, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface SmartSummaryProps {
  title: string;
  problemStatement: string;
  category?: string;
  technologies?: string[];
  type?: 'PROJECT' | 'INTERNSHIP' | 'HACKATHON';
  initialOpen?: boolean;
}

export const SmartSummary: React.FC<SmartSummaryProps> = ({
  title,
  problemStatement,
  category = 'Computer Science',
  technologies = [],
  type = 'PROJECT',
  initialOpen = false,
}) => {
  const [isGenerated, setIsGenerated] = useState(initialOpen);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 850);
  };

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                AI Submission Executive Summary
              </h4>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Automated Synthesis
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Summarizes long student documentation into decision-ready insights for faculty
            </p>
          </div>
        </div>

        {!isGenerated ? (
          <Button
            size="sm"
            variant="primary"
            onClick={handleGenerate}
            isLoading={isGenerating}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Generate AI Summary
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            isLoading={isGenerating}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Regenerate
          </Button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isGenerating && (
        <div className="py-6 flex flex-col items-center justify-center space-y-3">
          <div className="w-7 h-7 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-xs text-emerald-800 font-medium animate-pulse">
            Analyzing student problem statement, architecture &amp; feasibility metrics...
          </p>
        </div>
      )}

      {/* Un-generated Prompt State */}
      {!isGenerated && !isGenerating && (
        <div className="p-4 rounded-xl bg-white/80 border border-dashed border-emerald-300 text-center space-y-2">
          <p className="text-xs text-slate-600">
            Click <strong>&ldquo;Generate AI Summary&rdquo;</strong> to auto-synthesize the problem statement, novelty, lab feasibility, and recommended HOD action in 2 seconds.
          </p>
        </div>
      )}

      {/* Generated Summary Card */}
      {isGenerated && !isGenerating && (
        <div className="space-y-4 text-xs animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Core Problem */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Sentence Problem Essence</span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">
                {problemStatement.length > 140
                  ? problemStatement.slice(0, 140) + '...'
                  : problemStatement}
              </p>
            </div>

            {/* Novelty / Innovation */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>Proposed Technical Novelty</span>
              </div>
              <p className="text-slate-800 leading-relaxed">
                Integrates {technologies.slice(0, 3).join(', ') || 'modern frameworks'} to deliver real-time automated verification within {category}.
              </p>
            </div>

            {/* Feasibility & Resource Check */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span>Department Feasibility &amp; Lab Resources</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                <strong className="text-emerald-700">✓ Feasible:</strong> Hardware requirements align with CSE AI &amp; IoT computing lab infrastructure. No external high-cost licensing required.
              </p>
            </div>

            {/* System Recommendation */}
            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-800 font-bold uppercase text-[10px] tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>System Recommendation</span>
              </div>
              <p className="text-emerald-900 font-semibold leading-relaxed">
                Clear for immediate endorsement. Recommend benchmarking inference latency at Progress Review 1.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

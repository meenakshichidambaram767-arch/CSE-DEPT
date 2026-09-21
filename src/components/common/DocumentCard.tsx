'use client';

import React from 'react';
import { FileText, Download, Eye, CheckCircle2 } from 'lucide-react';
import { DocumentItem } from '@/types';
import { Button } from '../ui/Button';

export interface DocumentCardProps {
  document: DocumentItem;
  onView?: (doc: DocumentItem) => void;
  onDownload?: (doc: DocumentItem) => void;
  verified?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onView,
  onDownload,
  verified = false,
}) => {
  const handleView = () => {
    if (onView) {
      onView(document);
    } else {
      alert(`[Mock View] Opening preview for: ${document.name}`);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    } else {
      alert(`[Mock Download] Downloading: ${document.name}`);
    }
  };

  return (
    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center justify-between gap-3 text-left">
      <div className="flex items-center gap-3 truncate">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4" />
        </div>

        <div className="truncate space-y-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {document.name}
            </h5>
            {verified && (
              <span title="Verified Document" className="inline-flex">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </span>
            )}
          </div>

          <p className="text-[10px] text-slate-400 font-mono">
            {document.type.toUpperCase()} • {document.size} • Uploaded {document.uploadDate}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <Button variant="ghost" size="sm" onClick={handleView} leftIcon={<Eye className="w-3.5 h-3.5" />}>
          View
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} leftIcon={<Download className="w-3.5 h-3.5" />}>
          Download
        </Button>
      </div>
    </div>
  );
};

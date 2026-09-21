'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { DocumentItem } from '@/types';

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesChange?: (files: DocumentItem[]) => void;
  isRequired?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  helperText = 'PDF, DOCX, PNG up to 10MB',
  accept = '.pdf,.docx,.png,.jpg',
  maxSizeMB = 10,
  multiple = true,
  onFilesChange,
  isRequired,
}) => {
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: DocumentItem[] = Array.from(fileList).map((f) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: f.name,
      type: f.type || 'Document',
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadDate: new Date().toISOString().split('T')[0],
    }));

    const updated = multiple ? [...files, ...newItems] : newItems;
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
          {isRequired && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Drop area */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Click to upload or drag and drop
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded List */}
      {files.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                  {file.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
              </div>
              <button
                type="button"
                onClick={(e) => removeFile(file.id, e)}
                className="text-slate-400 hover:text-rose-600 p-1 rounded-sm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

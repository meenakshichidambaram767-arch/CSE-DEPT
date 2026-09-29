'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Loader2, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DocumentItem } from '@/types';
import { documentsApi } from '@/lib/api/documentsApi';
import { ApiError } from '@/lib/api/odApi';

export interface FileUploadProps {
  label?: string;
  helperText?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  owner?: string;
  ownerId?: string;
  onFilesChange?: (files: DocumentItem[]) => void;
  isRequired?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  helperText = 'PDF, PNG, JPG or JPEG up to 5MB (Official SIET Storage Format)',
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMB = 5,
  multiple = false,
  owner = 'od_request',
  ownerId = 'draft',
  onFilesChange,
  isRequired,
}) => {
  const [files, setFiles] = useState<DocumentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingUrlId, setLoadingUrlId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    const uploadedItems: DocumentItem[] = [];

    for (const f of Array.from(fileList)) {
      // 1. Validate file size
      if (f.size > maxSizeMB * 1024 * 1024) {
        setUploadError(`File ${f.name} exceeds the maximum allowed size of ${maxSizeMB}MB.`);
        setIsUploading(false);
        return;
      }

      // 2. Validate file type extension
      const ext = `.${f.name.split('.').pop()?.toLowerCase()}`;
      const allowedExts = accept.split(',').map((x) => x.trim().toLowerCase());
      if (!allowedExts.includes(ext)) {
        setUploadError(`File extension ${ext} is not supported. Allowed extensions: ${accept}`);
        setIsUploading(false);
        return;
      }

      try {
        // Upload file to Supabase private storage & save metadata
        const metadata = await documentsApi.uploadDocument(f, owner, ownerId);
        const item = documentsApi.toDocumentItem(metadata);
        uploadedItems.push(item);
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.status === 404 || err.code === 'BACKEND_DEPENDENCY_UNAVAILABLE') {
            // Fallback: create local DocumentItem for client prototype
            const fallbackItem: DocumentItem = {
              id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: f.name,
              type: f.type || 'PROOF_DOCUMENT',
              size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
              uploadDate: new Date().toISOString().split('T')[0],
            };
            uploadedItems.push(fallbackItem);
          } else {
            setUploadError(err.message);
          }
        } else {
          setUploadError(`Failed to upload ${f.name}. Please try again.`);
        }
      }
    }

    const updated = multiple ? [...files, ...uploadedItems] : uploadedItems;
    setFiles(updated);
    onFilesChange?.(updated);
    setIsUploading(false);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const handlePreview = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingUrlId(docId);
    try {
      const res = await documentsApi.getSignedUrl(docId);
      if (res.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      alert('Unable to generate temporary signed preview URL for this document.');
    } finally {
      setLoadingUrlId(null);
    }
  };

  return (
    <div className="w-full space-y-2 text-left">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
          {label}
          {isRequired && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Error state alert */}
      {uploadError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-600 hover:text-rose-900 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Drop area */}
      <div
        onClick={() => !isUploading && inputRef.current?.click()}
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
          isUploading
            ? 'border-emerald-400 bg-emerald-50/30 cursor-wait'
            : isDragging
            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50/50 dark:bg-slate-900/50'
        }`}
      >
        {isUploading ? (
          <div className="space-y-2 py-1">
            <Loader2 className="w-7 h-7 mx-auto text-[#0a5c36] animate-spin" />
            <p className="text-xs font-bold text-[#0a5c36]">
              Uploading file to Supabase Private Storage...
            </p>
            <p className="text-[10px] text-slate-500">Storing file metadata separately</p>
          </div>
        ) : (
          <>
            <UploadCloud className="w-7 h-7 mx-auto text-slate-400 mb-1.5" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Click to select or drag and drop document
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{helperText}</p>
          </>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Uploaded List with Signed Access Controls */}
      {files.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <CheckCircle2 className="w-4 h-4 text-[#0a5c36] shrink-0" />
                <FileText className="w-4 h-4 text-slate-600 shrink-0" />
                <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({file.size})</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!file.id.startsWith('doc-') && (
                  <button
                    type="button"
                    onClick={(e) => handlePreview(file.id, e)}
                    disabled={loadingUrlId === file.id}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0a5c36] bg-white px-2 py-0.5 rounded border border-emerald-300 hover:bg-emerald-100 transition-colors"
                  >
                    {loadingUrlId === file.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>15-Min Signed Link</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={(e) => removeFile(file.id, e)}
                  className="text-slate-400 hover:text-rose-600 p-1 rounded-sm"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { ApiError } from './odApi';
import { ApiErrorEnvelope, DocumentItem } from '@/types';

export interface DocumentUploadResponse {
  id: string;
  fileName: string;
  documentType: string;
  storagePath: string;
  size: number;
  owner: string;
  ownerId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentSignedUrlResponse {
  id: string;
  fileName: string;
  documentType: string;
  storagePath: string;
  size: number;
  signedUrl: string;
  expiresInSeconds: number;
  createdAt: string;
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const supabase = createSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {
    // Suppress token errors if unauthenticated
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorCode = res.status === 404 ? 'BACKEND_DEPENDENCY_UNAVAILABLE' : 'UNKNOWN_ERROR';
    let errorMessage =
      res.status === 404
        ? `Backend endpoint ${res.url} is not yet available (HTTP 404).`
        : `HTTP ${res.status}: ${res.statusText}`;
    let details: Record<string, unknown> | undefined;

    try {
      const body = (await res.json()) as ApiErrorEnvelope;
      if (body?.error) {
        errorCode = body.error.code || errorCode;
        errorMessage = body.error.message || errorMessage;
        details = body.error.details;
      }
    } catch {
      // Non-JSON response payload
    }

    throw new ApiError(errorCode, errorMessage, res.status, details);
  }

  return res.json();
}

export const documentsApi = {
  /**
   * Upload file to Supabase private storage ('documents' bucket) and store metadata
   * via POST /api/v1/documents/upload
   */
  uploadDocument: async (
    file: File,
    owner: string,
    ownerId: string,
    documentType = 'PROOF_DOCUMENT'
  ): Promise<DocumentUploadResponse> => {
    // 1. File validation
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit standard
    if (file.size > maxSizeBytes) {
      throw new ApiError(
        'FILE_TOO_LARGE',
        `File size ${(file.size / (1024 * 1024)).toFixed(2)}MB exceeds maximum allowed size (5MB).`,
        400
      );
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${owner}/${ownerId}/${Date.now()}_${cleanFileName}`;

    // 2. Upload raw file to Supabase private storage bucket 'documents'
    const supabase = createSupabaseClient();
    const { error: storageErr } = await supabase.storage
      .from('documents')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (storageErr) {
      throw new ApiError(
        'STORAGE_UPLOAD_FAILED',
        `Failed to upload file to storage: ${storageErr.message}`,
        400
      );
    }

    // 3. Post document metadata separately to POST /api/v1/documents/upload
    const headers = await getAuthHeaders();
    const res = await fetch('/api/v1/documents/upload', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        file_name: file.name,
        document_type: documentType,
        storage_path: storagePath,
        size: file.size,
        owner,
        owner_id: ownerId,
      }),
    });

    const metadataResult = await handleResponse<{ data: DocumentUploadResponse }>(res);
    return metadataResult.data;
  },

  /**
   * GET /api/v1/documents/[id]/url
   * Fetches a 15-minute temporary signed preview/download URL for private documents.
   * Never exposes permanent public URLs.
   */
  getSignedUrl: async (documentId: string): Promise<DocumentSignedUrlResponse> => {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/v1/documents/${encodeURIComponent(documentId)}/url`, {
      headers,
    });
    const result = await handleResponse<{ data: DocumentSignedUrlResponse }>(res);
    return result.data;
  },

  /**
   * Helper to format document item into standard DocumentItem domain object
   */
  toDocumentItem: (doc: DocumentUploadResponse, signedUrl?: string): DocumentItem => {
    return {
      id: doc.id,
      name: doc.fileName,
      type: doc.documentType,
      size: `${(doc.size / (1024 * 1024)).toFixed(2)} MB`,
      uploadDate: new Date(doc.createdAt).toISOString().split('T')[0],
      url: signedUrl,
    };
  },
};

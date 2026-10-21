/**
 * Polymorphic Document Storage API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements binary file upload metadata tracking and 15-minute expiring
 * private signed preview/download URLs.
 */

import { apiClient, ApiError } from './client';
import {
  ApiDocumentOwner,
  DocumentSignedUrlResponse,
  DocumentUploadPayload,
  DocumentUploadResponse,
} from '@/types/contract';
import { DocumentItem } from '@/types';

export { ApiError };

export interface SignedUrlResult {
  data: DocumentSignedUrlResponse;
  signedUrl: string;
  expiresInSeconds: number;
}

export const documentsApi = {
  /**
   * POST /api/v1/documents/upload
   * Registers uploaded document metadata
   */
  async registerDocumentMetadata(
    payload: DocumentUploadPayload
  ): Promise<{ data: DocumentUploadResponse }> {
    return apiClient.post<{ data: DocumentUploadResponse }>(
      '/api/v1/documents/upload',
      payload,
      {
        fallback: () => ({
          data: {
            id: `doc-${Date.now()}`,
            fileName: payload.file_name,
            documentType: payload.document_type,
            storagePath: payload.storage_path,
            size: payload.size || 1024,
            owner: payload.owner,
            ownerId: payload.owner_id,
            uploadedBy: 'usr-current',
            createdAt: new Date().toISOString(),
          },
        }),
      }
    );
  },

  /**
   * Upload file to Supabase private storage & save metadata
   */
  async uploadDocument(
    file: File,
    owner: string = 'draft',
    ownerId: string = '',
    documentType: string = 'PROOF'
  ): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    formData.append('owner', owner);
    if (ownerId && ownerId !== 'unassigned') {
      formData.append('owner_id', ownerId);
    }

    const res = await apiClient.upload<{ data: DocumentUploadResponse }>(
      '/api/v1/documents/upload',
      formData,
      {
        fallback: () => ({
          data: {
            id: `doc-${Date.now()}`,
            file_name: file.name,
            document_type: documentType,
            storage_path: `documents/${file.name}`,
            size: file.size,
            owner: (owner as ApiDocumentOwner) || 'draft',
            owner_id: ownerId || '',
            uploaded_by: 'usr-current',
            created_at: new Date().toISOString(),
          },
        }),
      }
    );
    return res.data;
  },

  /**
   * Transforms raw API DocumentUploadResponse to UI DocumentItem
   */
  toDocumentItem(doc: DocumentUploadResponse): DocumentItem {
    const fileName = doc.file_name || doc.fileName || 'Untitled';
    const docType = doc.document_type || doc.documentType || 'DOCUMENT';
    const createdAt = doc.created_at || doc.createdAt || new Date().toISOString();
    const storagePath = doc.storage_path || doc.storagePath || '';
    return {
      id: doc.id,
      name: fileName,
      type: docType,
      size: `${((doc.size || 0) / (1024 * 1024)).toFixed(2)} MB`,
      uploadDate: createdAt.split('T')[0],
      url: storagePath,
    };
  },

  /**
   * GET /api/v1/documents/{id}/url
   * Fetches 15-minute expiring private signed URL for preview or download
   */
  async getSignedUrl(id: string): Promise<SignedUrlResult> {
    const res = await apiClient.get<DocumentSignedUrlResponse>(
      `/api/v1/documents/${encodeURIComponent(id)}/url`,
      {
        fallback: () => ({
          id,
          file_name: 'Document_Preview.pdf',
          document_type: 'PROOF',
          storage_path: `documents/${id}.pdf`,
          size: 1024000,
          signed_url: '#',
          expires_in_seconds: 900,
          created_at: new Date().toISOString(),
        }),
      }
    );

    const signedUrl = res.signed_url || res.signedUrl;
    if (!signedUrl || signedUrl === '#') {
      if (process.env.NODE_ENV === 'production') {
        throw new ApiError('DOCUMENT_NOT_FOUND', 'Signed preview URL is not available.', 404);
      }
    }
    const expiresInSeconds = res.expires_in_seconds || res.expiresInSeconds || 900;

    return {
      data: res,
      signedUrl: signedUrl || '#',
      expiresInSeconds,
    };
  },

  /**
   * Upload file helper returning DocumentItem
   */
  async uploadFile(
    file: File,
    owner: ApiDocumentOwner,
    ownerId: string,
    documentType: string
  ): Promise<DocumentItem> {
    const metadata = await this.uploadDocument(file, owner, ownerId, documentType);
    return this.toDocumentItem(metadata);
  },
};

export default documentsApi;

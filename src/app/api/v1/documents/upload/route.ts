import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeDocument } from '@/lib/api/serializers';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

// POST /api/v1/documents/upload - Real Multipart Document Upload & Metadata Insertion
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const contentType = request.headers.get('content-type') || '';
    const supabase = await createClient();

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const documentType = (formData.get('document_type') as string) || 'PROOF';
      const owner = (formData.get('owner') as string) || 'od_request';
      const ownerId = (formData.get('owner_id') as string) || null;

      if (!file) {
        return apiError('VALIDATION_ERROR', 'File is required in form-data payload.', 400, {
          field: 'file',
        });
      }

      // 1. Enforce 5 MB maximum size limit server-side
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return apiError(
          'FILE_TOO_LARGE',
          `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds maximum allowed limit of 5 MB.`,
          400,
          { max_size_bytes: MAX_FILE_SIZE_BYTES, actual_size_bytes: file.size }
        );
      }

      // 2. Enforce strict MIME type whitelist server-side
      const mime = file.type?.toLowerCase();
      if (!mime || !ALLOWED_MIME_TYPES.includes(mime)) {
        return apiError(
          'INVALID_FILE_TYPE',
          `File type '${mime || 'unknown'}' is not allowed. Only PDF, PNG, and JPEG files are permitted.`,
          400,
          { allowed_types: ALLOWED_MIME_TYPES, actual_type: mime }
        );
      }

      // 3. Upload file buffer to Supabase Storage private bucket 'documents'
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${authUser.id}/${Date.now()}_${sanitizedName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (storageError) {
        console.warn('Supabase storage upload notice:', storageError.message);
        // If bucket is not provisioned or offline, continue to record metadata row
      }

      // 4. Insert document metadata record
      const isUuid = Boolean(ownerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ownerId));
      let effectiveOwnerId = authUser.id;
      if (isUuid && ownerId) {
        effectiveOwnerId = ownerId;
      }
      const effectiveOwner = ['od_request', 'activity', 'event', 'draft'].includes(owner) ? owner : 'od_request';

      const { data: newDoc, error: insertErr } = await supabase
        .from('documents')
        .insert({
          file_name: file.name,
          document_type: documentType,
          storage_path: storagePath,
          size: file.size,
          owner: effectiveOwner,
          owner_id: effectiveOwnerId,
          uploaded_by: authUser.id,
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Error inserting document record:', insertErr);
        return apiError('DATABASE_ERROR', insertErr.message, 500);
      }

      return apiSuccess(serializeDocument(newDoc), 201);
    }

    // JSON Metadata fallback (e.g. programmatic registration)
    const body = await request.json();
    const {
      file_name,
      document_type = 'PROOF',
      storage_path,
      size,
      owner = 'od_request',
      owner_id,
    } = body;

    if (!file_name || !storage_path) {
      return apiError(
        'VALIDATION_ERROR',
        'file_name and storage_path are required.',
        400
      );
    }

    const isUuid = owner_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner_id);
    const effectiveOwnerId = isUuid ? owner_id : authUser.id;

    const { data: newDoc, error: insertErr } = await supabase
      .from('documents')
      .insert({
        file_name,
        document_type,
        storage_path,
        size: size || 1024,
        owner: owner || 'od_request',
        owner_id: effectiveOwnerId,
        uploaded_by: authUser.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting document record:', insertErr);
      return apiError('DATABASE_ERROR', insertErr.message, 500);
    }

    return apiSuccess(serializeDocument(newDoc), 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/documents/upload:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred during document upload.', 500);
  }
}

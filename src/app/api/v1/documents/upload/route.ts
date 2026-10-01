import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

// POST /api/v1/documents/upload - Create Document Metadata
export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth();
    const body = await request.json();

    const {
      file_name,
      document_type,
      storage_path,
      size,
      owner,
      owner_id,
    } = body;

    if (!file_name || !document_type || !storage_path || !owner || !owner_id) {
      return apiError(
        'VALIDATION_ERROR',
        'file_name, document_type, storage_path, owner, and owner_id are required.',
        400
      );
    }

    const supabase = await createClient();

    const { data: newDoc, error: insertErr } = await supabase
      .from('documents')
      .insert({
        file_name,
        document_type,
        storage_path,
        size: size || 1024,
        owner,
        owner_id,
        uploaded_by: authUser.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Error inserting document record:', insertErr);
      return apiError('DATABASE_ERROR', insertErr.message, 500);
    }

    return apiSuccess({
      id: newDoc.id,
      fileName: newDoc.file_name,
      documentType: newDoc.document_type,
      storagePath: newDoc.storage_path,
      size: newDoc.size,
      owner: newDoc.owner,
      ownerId: newDoc.owner_id,
      uploadedBy: newDoc.uploaded_by,
      createdAt: newDoc.created_at,
    }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in POST /api/v1/documents/upload:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

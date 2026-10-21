import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';
import { serializeSignedUrl } from '@/lib/api/serializers';

// GET /api/v1/documents/[id]/url - 15-minute Private Signed Preview/Download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await requireAuth();
    const { id } = await params;
    const supabase = await createClient();

    // Query document metadata
    const { data: doc, error: fetchErr } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !doc) {
      return apiError('NOT_FOUND', 'Document not found.', 404);
    }

    // Authorization: HOD or Document Uploader/Owner
    if (authUser.role === 'STUDENT' && doc.uploaded_by !== authUser.id) {
      // Check if student owns the related OD request or activity
      if (doc.owner === 'od_request') {
        const { data: studentRecord } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        const { data: od } = await supabase
          .from('od_requests')
          .select('student_id')
          .eq('id', doc.owner_id)
          .single();

        if (!studentRecord || !od || od.student_id !== studentRecord.id) {
          return apiError('FORBIDDEN', 'Unauthorized document access.', 403);
        }
      } else {
        return apiError('FORBIDDEN', 'Unauthorized document access.', 403);
      }
    }

    // Create a signed URL from Supabase Storage bucket 'documents'
    let signedUrl: string | null = null;
    const { data: urlData, error: storageErr } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(doc.storage_path, 900); // 15 minutes (900s)

    if (urlData?.signedUrl) {
      signedUrl = urlData.signedUrl;
    } else if (doc.storage_path.startsWith('http://') || doc.storage_path.startsWith('https://')) {
      signedUrl = doc.storage_path;
    }

    if (!signedUrl) {
      console.warn('Storage signed URL failed:', storageErr);
      return apiError('NOT_FOUND', 'Document file not found in storage bucket.', 404);
    }

    return apiSuccess(serializeSignedUrl(doc, signedUrl, 900));
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') {
      return apiError('UNAUTHORIZED', 'Authentication required.', 401);
    }
    console.error('Error in GET /api/v1/documents/[id]/url:', err);
    return apiError('INTERNAL_SERVER_ERROR', 'Unexpected error occurred.', 500);
  }
}

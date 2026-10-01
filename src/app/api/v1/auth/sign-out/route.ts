import { createClient } from '@/lib/supabase/server';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return apiError('SIGN_OUT_FAILED', error.message, 400);
    }

    return apiSuccess({ message: 'Successfully signed out' });
  } catch (error) {
    console.error('Error in POST /api/v1/auth/sign-out:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred during sign out.', 500);
  }
}

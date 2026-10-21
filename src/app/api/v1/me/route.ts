import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET() {
  try {
    const authUser = await getAuthenticatedUser();

    if (!authUser) {
      return apiError(
        'UNAUTHORIZED',
        'Authentication required. Please sign in.',
        401
      );
    }

    const responsePayload = {
      id: authUser.id,
      email: authUser.email,
      name: authUser.name,
      role: authUser.role,
      profile:
        authUser.role === 'STUDENT'
          ? authUser.studentProfile || null
          : authUser.hodProfile || null,
    };

    return apiSuccess(responsePayload);
  } catch (error) {
    console.error('Error in GET /api/v1/me:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}

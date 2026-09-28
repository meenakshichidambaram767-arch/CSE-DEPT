import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/auth';
import { apiError, apiSuccess } from '@/lib/api/response';

export async function GET(request: NextRequest) {
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
          ? authUser.studentProfile || {
              register_number: '714023104088',
              department: 'CSE',
              year: 'II',
              section: 'A',
            }
          : authUser.hodProfile || {
              designation: 'Professor & Head of Department',
              department: 'CSE',
            },
    };

    return apiSuccess(responsePayload);
  } catch (error) {
    console.error('Error in GET /api/v1/me:', error);
    return apiError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred.', 500);
  }
}

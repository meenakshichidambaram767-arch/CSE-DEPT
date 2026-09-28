import { NextRequest } from 'next/server';
import { GET as getStudentSummary } from '../../records/students/[id]/summary/route';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return getStudentSummary(request, context);
}

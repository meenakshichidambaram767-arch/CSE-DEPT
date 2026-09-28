import { NextRequest } from 'next/server';
import { GET as getStudents } from '../records/students/route';

export async function GET(request: NextRequest) {
  return getStudents(request);
}

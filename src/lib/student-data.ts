import {
  unconfiguredStudentDataSource,
  type StudentDataSource,
  type StudentRecord,
} from '@/types/student';

let studentDataSource: StudentDataSource = unconfiguredStudentDataSource;

export function configureStudentDataSource(source: StudentDataSource): void {
  studentDataSource = source;
}

/** Future student views should resolve identity from the authenticated source. */
export function getCurrentStudent(): Promise<StudentRecord | null> {
  return studentDataSource.getCurrentStudent();
}

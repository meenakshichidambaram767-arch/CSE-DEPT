/** Student-side identity/data contracts independent of prototype UI state. */
export type StudentYear = 1 | 2 | 3 | 4;
export type StudentSection = 'A' | 'B' | 'C' | 'D' | 'E';
export type CseDepartment = 'CSE';

export interface StudentRecord {
  registerNumber: string;
  name: string;
  email: string;
  department: CseDepartment;
  year: StudentYear;
  section: StudentSection;
}

/** A database/auth adapter can supply this only after identity is verified. */
export interface StudentDataSource {
  getCurrentStudent(): Promise<StudentRecord | null>;
}

/**
 * Explicit Phase 0 boundary: there is no authenticated student source yet.
 * Components must not accept a manually supplied student ID as identity.
 */
export const unconfiguredStudentDataSource: StudentDataSource = {
  async getCurrentStudent() {
    return null;
  },
};

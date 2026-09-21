import { User } from '@/types';

export const mockUsers: User[] = [
  {
    id: 'usr-student-001',
    name: 'Meena C',
    email: 'meena.23cse@siet.ac.in',
    registerNumber: '714023104088',
    department: 'CSE',
    year: 'II',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    designation: 'B.E CSE Student (II Year)',
  },
  {
    id: 'usr-student-002',
    name: 'Nakshatra S V',
    email: 'nakshatra.22cse@siet.ac.in',
    registerNumber: '714022104153',
    department: 'CSE',
    year: 'IV',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    designation: 'B.E CSE Student (IV Year)',
  },
  {
    id: 'usr-student-003',
    name: 'Vishwanath M',
    email: 'vishwanath.22cse@siet.ac.in',
    registerNumber: '714022104210',
    department: 'CSE',
    year: 'IV',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    designation: 'B.E CSE Student (IV Year)',
  },
  {
    id: 'usr-student-004',
    name: 'Aswin K',
    email: 'aswin.22cse@siet.ac.in',
    registerNumber: '714022104032',
    department: 'CSE',
    year: 'IV',
    role: 'STUDENT',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    designation: 'B.E CSE Student (IV Year)',
  },
  {
    id: 'usr-hod-001',
    name: 'Dr. Priya Kumar',
    email: 'hod.cse@siet.ac.in',
    registerNumber: 'FAC-CSE-001',
    department: 'CSE',
    role: 'HOD',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    designation: 'Professor & Head of Department, CSE',
  },
];

export const studentUser: User = mockUsers[0]; // Meena C
export const hodUser: User = mockUsers[4]; // Dr. Priya Kumar

/**
 * Contract-Compatible Fixtures: Activities Domain
 * Conforms 100% to API Contract v2.0
 */

import { ApiActivity, PaginatedResponse } from '@/types/contract';

export const fixtureApiActivities: ApiActivity[] = [
  {
    id: 'act-sih-2026',
    code: 'ACT-2026-001',
    student_id: 'usr-student-001',
    student_name: 'Meena C',
    student_reg_no: '714023104088',
    department: 'CSE',
    year: 'III',
    type: 'HACKATHON',
    title: 'Smart India Hackathon 2026 - Autonomous Traffic Control',
    description: 'AI-driven computer vision traffic signal optimization for emergency vehicles.',
    technologies: ['Python', 'YOLOv8', 'FastAPI', 'PostgreSQL', 'Docker'],
    start_date: '2026-10-15',
    end_date: '2026-10-17',
    organization: 'Ministry of Education, Govt of India',
    github_url: 'https://github.com/meena-c/sih-smart-traffic',
    demo_url: 'https://smart-traffic.demo.siet.ac.in',
    guide_name: 'Dr. C. Chidambaram',
    guide_email: 'chidambaram.cse@siet.ac.in',
    team_members: [
      { register_number: '714023104088', name: 'Meena C', role: 'Team Lead', email: 'meena.23cse@siet.ac.in' },
      { register_number: '714022104002', name: 'Nattu K', role: 'Full Stack', email: 'nattu.22cse@siet.ac.in' },
    ],
    document_ids: ['f82b86c3-631d-4eb4-ba09-842f6aa4ce81'],
    status: 'ACTIVE',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: 'act-exam-monitor-01',
    code: 'ACT-2026-002',
    student_id: 'usr-student-001',
    student_name: 'Meena C',
    student_reg_no: '714023104088',
    department: 'CSE',
    year: 'III',
    type: 'PROJECT',
    title: 'AI-Based Examination Monitoring System',
    description: 'Vision-based automated head-pose and device-detection proctoring tool.',
    technologies: ['Next.js 16', 'TypeScript', 'YOLOv8', 'WebRTC', 'Supabase'],
    start_date: '2026-09-01',
    end_date: '2026-11-30',
    github_url: 'https://github.com/meena-c/ai-exam-monitor',
    guide_name: 'Dr. Priya Kumar',
    guide_email: 'priya.kumar.cse@siet.ac.in',
    team_members: [
      { register_number: '714023104088', name: 'Meena C', role: 'Lead' },
      { register_number: '714022104153', name: 'Nakshatra S V', role: 'Backend' },
    ],
    document_ids: [],
    status: 'ACTIVE',
    created_at: '2026-09-01T09:00:00Z',
  },
  {
    id: 'act-zoho-intern-01',
    code: 'ACT-2026-003',
    student_id: 'usr-student-002',
    student_name: 'Nakshatra S V',
    student_reg_no: '714022104153',
    department: 'CSE',
    year: 'IV',
    type: 'INTERNSHIP',
    title: 'Distributed Storage Systems Internship',
    description: 'Developing high-throughput blob streaming pipelines for cloud storage engines.',
    technologies: ['Go', 'gRPC', 'Distributed Systems', 'Linux Kernel'],
    start_date: '2026-11-01',
    end_date: '2027-04-30',
    company_name: 'Zoho Corporation',
    company_role: 'Software Development Intern',
    company_location: 'Chennai, Tamil Nadu',
    stipend: '₹25,000 / month',
    guide_name: 'Mr. R. Karthik (Zoho Mentor)',
    guide_email: 'karthik.r@zohocorp.com',
    team_members: [
      { register_number: '714022104153', name: 'Nakshatra S V', role: 'Intern' },
    ],
    document_ids: ['d1234567-89ab-cdef-0123-456789abcdef'],
    status: 'SUBMITTED',
    created_at: '2026-10-02T11:00:00Z',
  },
];

export const fixturePaginatedActivities: PaginatedResponse<ApiActivity> = {
  data: fixtureApiActivities,
  meta: {
    page: 1,
    page_size: 20,
    total: 3,
  },
};

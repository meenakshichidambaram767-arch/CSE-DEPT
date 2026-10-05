/**
 * Contract-Compatible Fixtures: In-App Notifications Domain
 * Conforms 100% to API Contract v2.0
 */

import { ApiNotification } from '@/types/contract';

export const fixtureApiNotifications: ApiNotification[] = [
  {
    id: 'notif-001',
    userId: 'usr-student-001',
    title: 'Upcoming Project Review Tomorrow',
    message: 'Your project review for "AI-Based Examination Monitoring" is scheduled for Friday at 2:00 PM in CSE Lab 2.',
    type: 'REVIEW_REMINDER',
    isRead: false,
    createdAt: '2026-09-24T09:00:00Z',
    linkUrl: '/student/reviews',
  },
  {
    id: 'notif-002',
    userId: 'usr-student-001',
    title: 'Weekly Progress Submitted',
    message: 'Weekly progress for Review #1 was logged successfully.',
    type: 'PROGRESS_DUE',
    isRead: false,
    createdAt: '2026-09-24T18:45:00Z',
    linkUrl: '/student/projects',
  },
  {
    id: 'notif-003',
    userId: 'usr-student-001',
    title: 'OD Application Awaiting Review',
    message: 'Your OD request for SIH 2026 has been routed to HOD inbox for clearance.',
    type: 'OD_UPDATE',
    isRead: true,
    createdAt: '2026-09-22T15:00:00Z',
    linkUrl: '/student/od-requests',
  },
];

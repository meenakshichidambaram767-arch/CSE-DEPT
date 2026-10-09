/**
 * Notifications API Module (Phase 6)
 * API Contract v2.0 compliant
 * Offline mock resolver & Central API Client support
 */

import { assertNoLiveNetwork, ApiError, apiClient } from './client';
import {
  NotificationContract,
  NotificationListResponse,
  MarkNotificationReadResponse,
} from './contractTypes';
import {
  ApiNotification,
  NotificationReadResponse,
} from '@/types/contract';
import { fixtureApiNotifications } from '@/data/fixtures/notificationsFixtures';

export { ApiError };

// Initial contract-compatible notification dataset
let notificationsStore: NotificationContract[] = [
  {
    id: 'notif-001',
    user_id: 'usr-student-001',
    title: 'Upcoming Project Review Tomorrow',
    message: 'Your project review for "AI-Based Examination Monitoring" is scheduled for Friday at 2:00 PM in CSE Lab 2.',
    type: 'REVIEW_REMINDER',
    is_read: false,
    created_at: '2026-09-24T09:00:00Z',
    link_url: '/student/reviews',
  },
  {
    id: 'notif-002',
    user_id: 'usr-student-001',
    title: 'Weekly Progress Submitted',
    message: 'Weekly progress for Review #1 was logged successfully for HOD evaluation checkpoint.',
    type: 'PROGRESS_DUE',
    is_read: false,
    created_at: '2026-09-24T18:45:00Z',
    link_url: '/student/projects',
  },
  {
    id: 'notif-003',
    user_id: 'usr-student-001',
    title: 'OD Clearance Endorsed',
    message: 'Your OD request for AI Exam Monitoring has been approved by HOD.',
    type: 'OD_UPDATE',
    is_read: true,
    created_at: '2026-09-22T15:00:00Z',
    link_url: '/student/od-requests',
  },
  {
    id: 'notif-004',
    user_id: 'usr-student-001',
    title: 'OD Revision Requested',
    message: 'Please attach the official hackathon confirmation brochure for verification.',
    type: 'OD_UPDATE',
    is_read: false,
    created_at: '2026-09-20T11:00:00Z',
    link_url: '/student/od-requests',
  },
  {
    id: 'notif-005',
    user_id: 'usr-hod-001',
    title: 'Weekly Progress Submitted by Team AI Exam',
    message: 'Meena C submitted weekly progress for AI-Based Examination Monitoring ahead of Review #1.',
    type: 'PROGRESS_DUE',
    is_read: false,
    created_at: '2026-09-24T18:45:00Z',
    link_url: '/hod/reviews',
  },
  {
    id: 'notif-006',
    user_id: 'usr-hod-001',
    title: 'New Student Submissions Awaiting Approval',
    message: 'You have pending submissions requiring departmental review in the Approvals inbox.',
    type: 'SUBMISSION_UPDATE',
    is_read: false,
    created_at: '2026-09-24T08:30:00Z',
    link_url: '/hod/approvals',
  },
];

export const notificationsApi = {
  /**
   * GET /api/v1/notifications
   */
  getAll: async (params?: {
    user_id?: string;
    unread_only?: boolean;
  }): Promise<NotificationListResponse & { data: any }> => {
    assertNoLiveNetwork();

    let filtered = [...notificationsStore];

    if (params?.user_id) {
      filtered = filtered.filter(
        (n) => n.user_id === params.user_id || n.user_id === 'all'
      );
    }

    if (params?.unread_only) {
      filtered = filtered.filter((n) => !n.is_read);
    }

    const unreadCount = filtered.filter((n) => !n.is_read).length;

    return {
      notifications: filtered,
      data: filtered,
      unread_count: unreadCount,
    };
  },

  /**
   * Alias for getAll / getNotifications
   */
  async getNotifications(): Promise<{ data: any[]; notifications: any[]; unread_count: number }> {
    return notificationsApi.getAll();
  },

  /**
   * PATCH /api/v1/notifications/{id}/read
   */
  markAsRead: async (id: string): Promise<MarkNotificationReadResponse & { data: any }> => {
    assertNoLiveNetwork();

    const notifIndex = notificationsStore.findIndex((n) => n.id === id);
    if (notifIndex === -1) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', `Notification not found with ID: ${id}`, {
        notification_id: id,
      });
    }

    notificationsStore[notifIndex] = {
      ...notificationsStore[notifIndex],
      is_read: true,
    };

    const res = {
      id,
      is_read: true,
      updated_at: new Date().toISOString(),
    };

    return {
      ...res,
      data: { success: true, id },
    };
  },

  /**
   * POST /api/v1/notifications/mark-all-read
   */
  markAllAsRead: async (userId?: string): Promise<{ data: any }> => {
    assertNoLiveNetwork();

    notificationsStore = notificationsStore.map((n) => {
      if (!userId || n.user_id === userId || n.user_id === 'all') {
        return { ...n, is_read: true };
      }
      return n;
    });

    return {
      data: { success: true, readCount: notificationsStore.length },
    };
  },

  /**
   * Internal test helper to reset notification store
   */
  _resetStore: (items?: NotificationContract[]) => {
    if (items) {
      notificationsStore = [...items];
    }
  },
};

export default notificationsApi;

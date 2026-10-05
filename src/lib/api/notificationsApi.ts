/**
 * In-App Notifications API Client
 * SIET CSE Department Platform - API Contract v2.0
 *
 * Implements active notification queries and read state updates.
 */

import { apiClient, ApiError } from './client';
import {
  ApiNotification,
  NotificationReadResponse,
} from '@/types/contract';
import { fixtureApiNotifications } from '@/data/fixtures/notificationsFixtures';

export { ApiError };

export const notificationsApi = {
  /**
   * GET /api/v1/notifications
   * Retrieves active in-app notifications (OD decisions, review reminders, progress deadlines)
   */
  async getNotifications(): Promise<{ data: ApiNotification[] }> {
    return apiClient.get<{ data: ApiNotification[] }>('/api/v1/notifications', {
      fallback: () => ({ data: fixtureApiNotifications }),
    });
  },

  /**
   * PATCH /api/v1/notifications/{id}/read
   * Marks single notification as read
   */
  async markAsRead(id: string): Promise<{ data: NotificationReadResponse }> {
    return apiClient.patch<{ data: NotificationReadResponse }>(
      `/api/v1/notifications/${encodeURIComponent(id)}/read`,
      {},
      {
        fallback: () => ({ data: { success: true, id } }),
      }
    );
  },

  /**
   * Marks all notifications as read (batch convenience)
   */
  async markAllAsRead(): Promise<{ data: NotificationReadResponse }> {
    return apiClient.patch<{ data: NotificationReadResponse }>(
      '/api/v1/notifications/all/read',
      {},
      {
        fallback: () => ({ data: { success: true, readCount: fixtureApiNotifications.length } }),
      }
    );
  },
};

export default notificationsApi;

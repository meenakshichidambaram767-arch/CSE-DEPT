import { ReviewSession } from '@/types';
import { mockReviewSessions } from '@/data/mock';

export const reviewsApi = {
  getAll: async (): Promise<ReviewSession[]> => {
    return [...mockReviewSessions];
  },
  getById: async (id: string): Promise<ReviewSession | undefined> => {
    return mockReviewSessions.find((r) => r.id === id);
  },
};

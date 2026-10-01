import { activitiesApi } from './activitiesApi';
import { Activity } from '@/types';

export const projectsApi = {
  getAll: async (): Promise<Activity[]> => {
    try {
      const res = await activitiesApi.getActivities({ type: 'PROJECT' });
      return res.data;
    } catch {
      return activitiesApi.getFallbackActivities('PROJECT');
    }
  },
  getById: async (id: string): Promise<Activity | undefined> => {
    try {
      const res = await activitiesApi.getActivityById(id);
      return res.data;
    } catch {
      return activitiesApi.getFallbackById(id);
    }
  },
};

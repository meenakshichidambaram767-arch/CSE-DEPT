import { activitiesApi } from './activitiesApi';
import { Activity } from '@/types';

export const hackathonsApi = {
  getAll: async (): Promise<Activity[]> => {
    try {
      const res = await activitiesApi.getActivities({ type: 'HACKATHON' });
      return res.data;
    } catch {
      return activitiesApi.getFallbackActivities('HACKATHON');
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

export default hackathonsApi;

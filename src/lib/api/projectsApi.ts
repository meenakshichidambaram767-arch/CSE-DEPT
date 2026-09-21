import { Activity } from '@/types';
import { mockActivities } from '@/data/mock';

export const projectsApi = {
  getAll: async (): Promise<Activity[]> => {
    return mockActivities.filter((a) => a.type === 'PROJECT');
  },
  getById: async (id: string): Promise<Activity | undefined> => {
    return mockActivities.find((a) => a.id === id);
  },
};

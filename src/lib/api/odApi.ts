import { ODApplication } from '@/types';
import { mockODApplications } from '@/data/mock';

export const odApi = {
  getAll: async (): Promise<ODApplication[]> => {
    return [...mockODApplications];
  },
  getById: async (id: string): Promise<ODApplication | undefined> => {
    return mockODApplications.find((o) => o.id === id);
  },
};

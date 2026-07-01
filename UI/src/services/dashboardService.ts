import api from './api';

export interface TreeStats {
  tree_uid: string;
  sensor_physical_id: string;
  custom_name: string;
  status: string;
}

export interface ZoneStats {
  group_uid: string;
  group_name: string;
  prediction: number;
  trees: TreeStats[];
}

export interface DashboardStats {
  total_trees: number;
  healthy_trees: number;
  warning_trees: number;
  infested_trees: number;
  zones: ZoneStats[];
}

export const dashboardService = {
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};
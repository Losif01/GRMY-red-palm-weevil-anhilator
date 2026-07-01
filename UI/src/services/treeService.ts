import api from './api';

export interface Tree {
  tree_uid: string;
  sensor_physical_id: string;
  owner_id: string;
  group_id?: string;
  display_order?: number;
  custom_name?: string;
  current_status: string;
  battery_status: string;
  next_reading_at?: string;
  latest_reading_classification?: string;
  registered_at: string;
}

export const treeService = {
  // Get all trees in a specific group
  getTreesInGroup: async (groupUid: string) => {
    const response = await api.get(`/trees/group/${groupUid}`);
    return response.data;
  },

  // Get a specific tree
  getTree: async (treeUid: string) => {
    const response = await api.get(`/trees/${treeUid}`);
    return response.data;
  },

  // Create a new tree
  createTree: async (data: {
    sensor_physical_id: string;
    group_id?: string;
    custom_name?: string;
    display_order?: number;
  }) => {
    const response = await api.post('/trees', data);
    return response.data;
  },

  // Update a tree
  updateTree: async (treeUid: string, data: {
    group_id?: string;
    custom_name?: string;
    display_order?: number;
    current_status?: string;
    battery_status?: string;
  }) => {
    const response = await api.put(`/trees/${treeUid}`, data);
    return response.data;
  },

  // Delete a tree
  deleteTree: async (treeUid: string) => {
    const response = await api.delete(`/trees/${treeUid}`);
    return response.data;
  },
};
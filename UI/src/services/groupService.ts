import api from "./api";

export interface Group {
  group_uid: string;
  group_name: string;
  owner_id: string;
  created_at: string;
  reading_interval_minutes: number;
}

export interface Tree {
  tree_uid: string;
  sensor_physical_id: string;
  owner_id: string;
  group_id?: string;
  custom_name?: string;
  current_status: string;
  battery_status: string;
  registered_at: string;
}

export interface AnalyzeResult {
  tree_id: string;
  sensor_id: string;
  custom_name?: string;
  status: string;
  prediction: string | null;
  confidence: number | null;
  error?: string;
}

export interface AnalyzeGroupResponse {
  message: string;
  group_uid: string;
  group_name: string;
  total_trees: number;
  results: AnalyzeResult[];
}

export const groupService = {
  // Get all groups for current user
  getGroups: async () => {
    const response = await api.get("/groups/");
    return response.data;
  },

  // Get trees in a specific group
  getTreesInGroup: async (groupUid: string) => {
    const response = await api.get(`/trees/group/${groupUid}`);
    return response.data;
  },

  // Create a new group
  createGroup: async (
    groupName: string,
    readingIntervalMinutes: number = 60,
  ) => {
    const response = await api.post("/groups", {
      group_name: groupName,
      reading_interval_minutes: readingIntervalMinutes,
    });
    return response.data;
  },

  // Update group
  updateGroup: async (
    groupUid: string,
    data: { group_name?: string; reading_interval_minutes?: number },
  ) => {
    const response = await api.put(`/groups/${groupUid}`, data);
    return response.data;
  },

  // Delete group
  deleteGroup: async (groupUid: string) => {
    const response = await api.delete(`/groups/${groupUid}`);
    return response.data;
  },

  // Analyze all trees in a group
  analyzeGroup: async (groupUid: string): Promise<AnalyzeGroupResponse> => {
    const response = await api.post(`/groups/${groupUid}/analyze`);
    return response.data;
  },
};

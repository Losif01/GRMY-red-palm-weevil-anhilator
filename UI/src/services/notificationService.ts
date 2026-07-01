import api from './api';

export interface Notification {
  notification_uid: string;
  owner_id: string;
  tree_id: string;
  message: string;
  notification_type?: string;
  sent_status: boolean;
  sent_at?: string;
  notification_seen: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  // Get all notifications for current user
  getNotifications: async (unseenOnly: boolean = false): Promise<Notification[]> => {
    const response = await api.get('/notifications/inbox', {
      params: { unseen_only: unseenOnly, limit: 100 }
    });
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  // Mark notification as seen
  markAsSeen: async (notificationId: string): Promise<Notification> => {
    const response = await api.put(`/notifications/${notificationId}/seen`);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId: string): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};
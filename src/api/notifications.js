import axiosInstance from './axiosInstance';

// API calls for User Notifications
export const notificationsApi = {
  // Get all notifications for the logged-in user
  getNotifications: async () => {
    const response = await axiosInstance.get('/api/notifications/');
    return response.data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await axiosInstance.get('/api/notifications/unread-count/');
    return response.data;
  },

  // Mark a notification as read
  markAsRead: async (id) => {
    const response = await axiosInstance.patch(`/api/notifications/${id}/read/`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await axiosInstance.post('/api/notifications/read-all/');
    return response.data;
  },
};

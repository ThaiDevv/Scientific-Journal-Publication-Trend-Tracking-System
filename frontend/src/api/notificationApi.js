import axiosInstance from './axiosConfig';

export const getNotifications = (page = 0, size = 20) =>
    axiosInstance.get('/notifications', { params: { page, size } });

export const getUnreadCount = () =>
    axiosInstance.get('/notifications/unread-count');

export const markAsRead = (id) =>
    axiosInstance.put(`/notifications/${id}/read`);

export const markAllAsRead = () =>
    axiosInstance.put('/notifications/read-all');

export const notificationApi = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};

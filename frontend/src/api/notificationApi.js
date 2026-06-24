import axiosInstance from "./axiosConfig";

export const getNotifications = (page = 0, size = 10) => {
    return axiosInstance.get("/notifications", {
        params: {
            page,
            size,
        },
    });
};

export const getUnreadCount = () => {
    return axiosInstance.get("/notifications/unread-count");
};

export const markAsRead = (id) => {
    return axiosInstance.put(`/notifications/${id}/read`);
};

export const markAllAsRead = () => {
    return axiosInstance.put("/notifications/read-all");
};
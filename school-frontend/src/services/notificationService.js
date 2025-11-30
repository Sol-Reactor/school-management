import api from './api';

export const notificationService = {
    async getNotifications(unreadOnly = false) {
        const response = await api.get('/notifications', {
            params: { unreadOnly },
        });
        return response.data;
    },

    async markAsRead(id) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    async deleteNotification(id) {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },
};

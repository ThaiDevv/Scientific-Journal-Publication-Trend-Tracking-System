import axiosInstance from './axiosConfig';

export const adminApi = {
    getUsers: (page = 0, size = 10, search = "", role = "") =>
        axiosInstance.get('/admin/users', { params: { page, size, search, role } }),
    
    updateUserStatus: (id, status) =>
        axiosInstance.put(`/admin/users/${id}/status`, { isActive: status }),
    
    updateUserRole: (id, role) =>
        axiosInstance.put(`/admin/users/${id}/role`, { role }),
    
    getDataSources: () =>
        axiosInstance.get('/admin/datasources'),
    
    updateDataSourceStatus: (id, active) =>
        axiosInstance.put(`/admin/datasources/${id}`, null, { params: { active } }),
    
    triggerSync: (id) =>
        axiosInstance.post(`/admin/sync/trigger`, null, { params: { sourceId: id } }),
    
    getSystemStats: () =>
        axiosInstance.get('/admin/stats')
};

import axiosInstance from './axiosConfig';

export const topicApi = {
    // JP-31: Research Topics CRUD APIs
    getAllTopics: (page = 0, size = 10) =>
        axiosInstance.get('/topics', { params: { page, size } }),
    
    getTopicById: (id) =>
        axiosInstance.get(`/topics/${id}`),
    
    createTopic: (data) =>
        axiosInstance.post('/topics', data),
    
    updateTopic: (id, data) =>
        axiosInstance.put(`/topics/${id}`, data),
    
    deleteTopic: (id) =>
        axiosInstance.delete(`/topics/${id}`),
    
    addKeywordToTopic: (id, keywordId) =>
        axiosInstance.post(`/topics/${id}/keywords/${keywordId}`),
    
    removeKeywordFromTopic: (id, keywordId) =>
        axiosInstance.delete(`/topics/${id}/keywords/${keywordId}`),

    // Compatibility methods
    getTopics: () =>
        axiosInstance.get('/topics', { params: { page: 0, size: 100 } }),
    
    getTopKeywords: (limit = 20) =>
        axiosInstance.get(`/keywords/top?limit=${limit}`),
    
    getPapersByKeyword: (name, params) =>
        axiosInstance.get(`/keywords/${encodeURIComponent(name)}/papers`, { params }),
    
    getJournalsByField: (field, params) =>
        axiosInstance.get('/journals', { params: { field, ...params } })
};
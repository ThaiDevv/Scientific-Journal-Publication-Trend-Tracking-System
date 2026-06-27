import axiosInstance from './axiosConfig';

// ── My Follows ────────────────────────────────────────────────────────────────
// GET /api/follows/me → danh sách journal/keyword đang follow (cần JWT)
export const getMyFollows = () =>
    axiosInstance.get('/follows/me');

// ── Follow Journal ────────────────────────────────────────────────────────────
// POST /api/follows  body: { followType: "JOURNAL", targetId: 1 }
export const followJournal = (journalId) =>
    axiosInstance.post('/follows', { followType: 'JOURNAL', targetId: journalId });

// ── Follow Keyword ────────────────────────────────────────────────────────────
// POST /api/follows  body: { followType: "KEYWORD", targetId: 5 }
export const followKeyword = (keywordId) =>
    axiosInstance.post('/follows', { followType: 'KEYWORD', targetId: keywordId });

// ── Follow Topic ──────────────────────────────────────────────────────────────
// POST /api/follows  body: { followType: "TOPIC", targetId: 2 }
export const followTopic = (topicId) =>
    axiosInstance.post('/follows', { followType: 'TOPIC', targetId: topicId });

// ── Unfollow ──────────────────────────────────────────────────────────────────
// DELETE /api/follows/{id}
export const unfollow = (followId) =>
    axiosInstance.delete(`/follows/${followId}`);

// ── Namespace object export (for pages using followApi.method()) ──────────────
export const followApi = {
    getFollows: getMyFollows,          // alias: Following.jsx calls followApi.getFollows()
    getMyFollows,
    followJournal,
    followKeyword,
    followTopic,
    unfollow,
};
import axiosInstance from './axiosConfig';

// ── Dashboard Stats ──────────────────────────────────────────────────────────
// GET /api/dashboard/stats → tổng số papers, journals, authors, keywords
export const getDashboardStats = () =>
    axiosInstance.get('/dashboard/stats');

// ── Top Journals ─────────────────────────────────────────────────────────────
// GET /api/dashboard/top-journals → top journals theo số paper
export const getTopJournals = () =>
    axiosInstance.get('/dashboard/top-journals');

// ── Field Distribution ────────────────────────────────────────────────────────
// GET /api/dashboard/field-distribution → phân bố số paper theo lĩnh vực
export const getFieldDistribution = () =>
    axiosInstance.get('/dashboard/field-distribution');

// ── Yearly Publication Stats ──────────────────────────────────────────────────
// GET /api/dashboard/yearly-stats → số paper theo từng năm
export const getYearlyStats = () =>
    axiosInstance.get('/dashboard/yearly-stats');

// ── Recent Papers ─────────────────────────────────────────────────────────────
// GET /api/dashboard/recent-papers?limit=10
export const getRecentPapers = (limit = 10) =>
    axiosInstance.get('/dashboard/recent-papers', {
        params: { limit },
    });

// ── Top Keywords (trending) ───────────────────────────────────────────────────
// GET /api/keywords/top?limit=10
export const getTopKeywords = (limit = 10) =>
    axiosInstance.get(`/keywords/top?limit=${limit}`);

// GET /api/dashboard/trending?limit=4
export const getTrendingTopics = (limit = 4) =>
    axiosInstance.get('/dashboard/trending', {
        params: { limit },
    });

// ── Namespace object export (for pages using dashboardApi.method()) ────────────
export const dashboardApi = {
    getStats: getDashboardStats,       // alias: Dashboard.jsx calls dashboardApi.getStats()
    getDashboardStats,
    getTopJournals,
    getFieldDistribution,
    getYearlyStats,
    getRecentPapers,
    getTopKeywords,
    getTrendingTopics,
};
import axiosInstance from './axiosConfig';

// ── Report History ────────────────────────────────────────────────────────────
// GET /api/reports/history → danh sách báo cáo đã tạo (cần JWT)
export const getReportHistory = () =>
    axiosInstance.get('/reports/history');

// ── Generate Report ───────────────────────────────────────────────────────────
// POST /api/reports/generate  body: { title, keyword, yearFrom, yearTo, ... }
export const generateReport = (data) =>
    axiosInstance.post('/reports/generate', data);

// ── Report Detail ─────────────────────────────────────────────────────────────
// GET /api/reports/{id}
export const getReportDetail = (id) =>
    axiosInstance.get(`/reports/${id}`);

// ── Download Report PDF ───────────────────────────────────────────────────────
// GET /api/reports/{id}/download
export const downloadReportPdf = (id) =>
    axiosInstance.get(`/reports/${id}/download`, { responseType: 'blob' });

// ── Namespace object export (for pages using reportApi.method()) ──────────────
export const reportApi = {
    getHistory: getReportHistory,      // alias: Reports.jsx calls reportApi.getHistory()
    getReportHistory,
    generateReport,
    getReportDetail,
    downloadPdf: downloadReportPdf,
    downloadReportPdf,
};
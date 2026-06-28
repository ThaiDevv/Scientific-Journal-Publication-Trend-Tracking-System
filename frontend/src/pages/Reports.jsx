import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { reportApi } from '../api/reportApi';
import { trendApi } from '../api/trendApi';

const transformReportResponse = (body, payload) => {
    if (!body) return null;
    // Determine title
    const title = body.title || payload?.title || "Trend Report";
    
    // Determine years from timeRange (e.g. "2024-2026")
    let fromYear = payload?.yearFrom || 2018;
    let toYear = payload?.yearTo || 2024;
    if (body.summary?.timeRange) {
        const parts = body.summary.timeRange.split('-');
        if (parts.length === 2) {
            fromYear = parseInt(parts[0]) || fromYear;
            toYear = parseInt(parts[1]) || toYear;
        }
    }

    // Extract keywords list
    const trendData = body.trendData || [];
    const keywordsList = trendData.map(t => t.keyword);

    // Transform trendData into pivoted chart data
    const chartMap = {};
    trendData.forEach(item => {
        const kw = item.keyword;
        const pts = item.dataPoints || [];
        pts.forEach(pt => {
            const yr = String(pt.year);
            if (!chartMap[yr]) {
                chartMap[yr] = { year: yr };
            }
            chartMap[yr][kw] = pt.count;
        });
    });

    const chartData = Object.values(chartMap).sort((a, b) => a.year.localeCompare(b.year));

    const topAuthors = (body.topAuthors || []).map(author => ({
        name: author.name,
        paperCount: author.paperCount,
        citations: author.citations || "N/A"
    }));

    const topJournals = (body.topJournals || []).map(journal => ({
        name: journal.name,
        paperCount: journal.paperCount,
        ratio: journal.ratio || `${journal.paperCount} papers`,
        trend: journal.trend !== undefined ? journal.trend : 0
    }));

    return {
        id: body.id || Date.now(),
        title,
        fromYear,
        toYear,
        format: body.format || payload?.format || "PDF",
        keywordsList,
        chartData,
        topAuthors,
        topJournals,
        rawJson: body
    };
};

const Reports = () => {
    // Form fields states
    const [title, setTitle] = useState('');
    const [exportFormat, setExportFormat] = useState('PDF');
    const [selectedKeywords, setSelectedKeywords] = useState(['Machine Learning', 'Natural Language Processing']);
    const [keywordInput, setKeywordInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [fromYear, setFromYear] = useState('2018');
    const [toYear, setToYear] = useState('2024');

    // UI Loading & Data states
    const [history, setHistory] = useState([]);
    const [currentReport, setCurrentReport] = useState(null);
    const [keywordOptions, setKeywordOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        fetchHistory();
        fetchKeywords();
    }, []);

    const fetchHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await reportApi.getHistory();
            const list = res.data?.body?.content || res.data?.body || [];
            
            const dbList = list.map(item => ({
                id: item.id,
                title: item.title,
                createdAt: item.generatedAt ? new Date(item.generatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
                format: item.format || 'PDF',
                keywordsCount: item.keywordsAnalyzed !== undefined ? item.keywordsAnalyzed : 0,
                isMock: false
            }));

            setHistory(dbList);
        } catch (err) {
            console.error("Failed to fetch report history:", err);
            setHistory([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchKeywords = async () => {
        try {
            const res = await trendApi.getTopKeywords(30);
            const list = res.data?.body || [];
            setKeywordOptions(list.map(k => ({ label: k.name, value: k.name })));
        } catch (err) {
            setKeywordOptions([
                { label: 'AI', value: 'AI' },
                { label: 'Machine Learning', value: 'Machine Learning' },
                { label: 'Natural Language Processing', value: 'Natural Language Processing' },
                { label: 'Blockchain', value: 'Blockchain' },
                { label: 'Quantum Computing', value: 'Quantum Computing' },
                { label: 'Deep Learning', value: 'Deep Learning' }
            ]);
        }
    };

    const handleAddKeyword = (kw) => {
        const val = (kw || keywordInput).trim();
        if (!val) return;
        if (selectedKeywords.includes(val)) {
            setKeywordInput('');
            return;
        }
        setSelectedKeywords(prev => [...prev, val]);
        setKeywordInput('');
        setShowSuggestions(false);
    };

    const handleRemoveKeyword = (kw) => {
        setSelectedKeywords(prev => prev.filter(k => k !== kw));
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Please enter a report title!");
            return;
        }
        if (selectedKeywords.length === 0) {
            alert("Please select at least one keyword!");
            return;
        }

        setLoading(true);
        const payload = {
            title: title.trim(),
            keywords: selectedKeywords,
            yearFrom: Number(fromYear),
            yearTo: Number(toYear),
            format: exportFormat
        };

        try {
            const res = await reportApi.generateReport(payload);
            const body = res.data?.body || res.data;
            setCurrentReport(transformReportResponse(body, payload));
            fetchHistory();
        } catch (err) {
            console.error("API Error generating report:", err);
            alert("Failed to generate report!");
        } finally {
            setLoading(false);
        }
    };

    const loadOldReport = async (id) => {
        setLoading(true);
        try {
            const res = await reportApi.getReportDetail(id);
            const body = res.data?.body || res.data;
            setCurrentReport(transformReportResponse(body, null));
        } catch (err) {
            console.error("API Error loading report:", err);
            alert("Failed to load report detail!");
        } finally {
            setLoading(false);
            const viewer = document.getElementById("report-viewer");
            if (viewer) {
                viewer.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleDownloadPdf = async () => {
        if (!currentReport || !currentReport.id) return;
        setLoading(true);
        try {
            const res = await reportApi.downloadPdf(currentReport.id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${currentReport.id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download PDF:", err);
            alert("Failed to download report PDF!");
        } finally {
            setLoading(false);
        }
    };

    const copyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(currentReport.rawJson || {}));
        alert("JSON data copied to clipboard!");
    };

    // Filter autocompletes suggestions for keyword input
    const filteredSuggestions = keywordOptions.filter(opt =>
        keywordInput && opt.label.toLowerCase().includes(keywordInput.toLowerCase()) && !selectedKeywords.includes(opt.value)
    );

    return (
        <div className="rep-container">
            {/* Scoped CSS Stylesheet */}
            <style>{`
                .rep-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--color-background);
                }
                
                .rep-top-row {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;
                }
                
                .rep-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }
                .rep-create-card {
                    flex: 1.4;
                    min-width: 480px;
                }
                .rep-history-card {
                    flex: 1;
                    min-width: 320px;
                }
                @media (max-width: 768px) {
                    .rep-create-card, .rep-history-card {
                        min-width: 100%;
                    }
                }
                
                .rep-section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .rep-section-title {
                    font-family: var(--font-headline);
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .rep-section-title span.material-symbols-outlined {
                    font-size: 28px;
                }
                
                /* Form fields */
                .rep-field-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 16px;
                }
                .rep-field-label {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: var(--color-on-surface-variant);
                }
                .rep-input {
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 14px;
                    font-family: var(--font-body);
                    font-size: var(--fs-body-sm);
                    outline: none;
                    transition: border-color 0.2s;
                    color: var(--color-on-surface);
                    box-sizing: border-box;
                }
                .rep-input:focus {
                    border-color: var(--color-primary);
                }
                
                /* Custom Radios */
                .rep-radio-group {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                .rep-radio-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: var(--font-body);
                    font-size: 14px;
                    cursor: pointer;
                    color: var(--color-on-surface);
                    user-select: none;
                }
                .rep-radio-dot {
                    width: 16px;
                    height: 16px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .rep-radio-dot.selected {
                    border-color: #0f766e;
                }
                .rep-radio-dot-inner {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: transparent;
                    transition: all 0.2s;
                }
                .rep-radio-dot-inner.selected {
                    background: #0f766e;
                }
                
                /* Keyword multiselect box */
                .rep-multiselect-container {
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 8px 12px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                    position: relative;
                    background: var(--color-surface-container-lowest);
                    min-height: 40px;
                    box-sizing: border-box;
                }
                .rep-keyword-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #e2f5f1;
                    border: 1px solid #cbeee6;
                    color: #0f9f90;
                    font-family: var(--font-ui);
                    font-size: 12.5px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                }
                .rep-keyword-close {
                    cursor: pointer;
                    font-size: 14px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 14px;
                    height: 14px;
                    color: #0f9f90;
                }
                .rep-multiselect-input {
                    border: none;
                    outline: none;
                    background: transparent;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    flex: 1;
                    min-width: 100px;
                    padding: 0;
                }
                .rep-suggestions {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    z-index: 10;
                    max-height: 200px;
                    overflow-y: auto;
                    margin-top: 4px;
                }
                .rep-suggest-item {
                    padding: 10px 14px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    cursor: pointer;
                }
                .rep-suggest-item:hover {
                    background: #fafafb;
                    color: var(--color-primary);
                }
                
                /* Dropdowns */
                .rep-dropdown-row {
                    display: flex;
                    gap: 16px;
                }
                .rep-dropdown-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .rep-select-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .rep-select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    width: 100%;
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 36px 0 14px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    outline: none;
                    background: #fff;
                    cursor: pointer;
                    color: var(--color-on-surface);
                    box-sizing: border-box;
                }
                .rep-select-chevron {
                    position: absolute;
                    right: 12px;
                    pointer-events: none;
                    color: var(--color-outline);
                    font-size: 20px;
                    user-select: none;
                }
                
                .rep-submit-btn {
                    height: 44px;
                    background: #111827;
                    border: none;
                    border-radius: var(--radius-lg);
                    color: #fff;
                    font-family: var(--font-ui);
                    font-size: 14px;
                    font-weight: 700;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    margin-top: 10px;
                }
                .rep-submit-btn:hover {
                    opacity: 0.9;
                }
                
                /* History sidebar list */
                .rep-history-badge {
                    background: #f1f5f9;
                    color: #475569;
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 800;
                    padding: 4px 10px;
                    border-radius: 99px;
                }
                .rep-history-list {
                    display: flex;
                    flex-direction: column;
                }
                .rep-history-item {
                    padding: 16px 0;
                    border-bottom: 1px solid var(--color-outline-variant);
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .rep-history-item:last-child {
                    border-bottom: none;
                }
                .rep-hist-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .rep-hist-title {
                    font-family: var(--font-headline);
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .rep-hist-date {
                    font-family: var(--font-data);
                    font-size: 11px;
                    color: var(--color-outline);
                }
                .rep-hist-bot {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: var(--font-body);
                    font-size: 12.5px;
                    color: var(--color-on-surface-variant);
                }
                .rep-hist-xem {
                    color: #0f766e;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    cursor: pointer;
                    text-decoration: none;
                }
                .rep-hist-xem:hover {
                    text-decoration: underline;
                }
                
                /* Report Viewer card */
                .rep-view-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                .rep-view-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding-bottom: 20px;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .rep-view-header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .rep-view-header-tag {
                    font-family: var(--font-ui);
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--color-outline);
                    letter-spacing: 0.05em;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    text-transform: uppercase;
                }
                .rep-view-header-title {
                    font-family: var(--font-headline);
                    font-size: 26px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                
                .rep-view-header-actions {
                    display: flex;
                    gap: 12px;
                }
                .rep-btn-copy {
                    height: 40px;
                    padding: 0 16px;
                    border: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    border-radius: var(--radius-lg);
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .rep-btn-copy:hover {
                    border-color: var(--color-primary);
                    background: var(--color-surface-container-low);
                }
                .rep-btn-dl {
                    height: 40px;
                    padding: 0 16px;
                    border: none;
                    background: #0f766e;
                    border-radius: var(--radius-lg);
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    box-sizing: border-box;
                }
                .rep-btn-dl:hover {
                    opacity: 0.9;
                }
                
                /* Chart Visuals */
                .rep-chart-section {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding-bottom: 24px;
                }
                .rep-chart-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .rep-green-indicator {
                    border-left: 3.5px solid #0f766e;
                    padding-left: 8px;
                    font-family: var(--font-ui);
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--color-primary);
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                }
                .rep-legend-row {
                    display: flex;
                    gap: 16px;
                    font-family: var(--font-body);
                    font-size: 12px;
                    color: var(--color-on-surface-variant);
                }
                .rep-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .rep-legend-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                
                /* Tables row */
                .rep-tables-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                }
                @media (max-width: 768px) {
                    .rep-tables-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .rep-table-col {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .rep-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .rep-table th {
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding: 12px 16px;
                    font-family: var(--font-ui);
                    font-size: 11.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--color-on-surface-variant);
                }
                .rep-table td {
                    border-bottom: 1px solid #f1f5f9;
                    padding: 14px 16px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    color: var(--color-on-surface);
                }
                .rep-table tr:last-child td {
                    border-bottom: none;
                }
                .rep-badge-trend {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: var(--font-data);
                    font-size: 11.5px;
                    font-weight: 700;
                    display: inline-block;
                }
                .rep-badge-trend.positive {
                    background: #dcfce7;
                    color: #15803d;
                }
                .rep-badge-trend.negative {
                    background: #fee2e2;
                    color: #b91c1c;
                }
                
                .rep-view-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-family: var(--font-body);
                    font-size: 12px;
                    color: var(--color-outline);
                    margin-top: 12px;
                    border-top: 1.5px solid var(--color-outline-variant);
                    padding-top: 16px;
                }
                .rep-empty-state {
                    background: #fff;
                    border: 1.5px dashed var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 60px 24px;
                    text-align: center;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    color: var(--color-on-surface-variant);
                    margin-top: 24px;
                }
                .rep-empty-icon {
                    font-size: 64px;
                    color: var(--color-outline);
                }
                .rep-empty-state h3 {
                    margin: 0;
                    font-family: var(--font-headline);
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--color-primary);
                }
                .rep-empty-state p {
                    margin: 0;
                    font-family: var(--font-body);
                    font-size: 14px;
                    max-width: 400px;
                    line-height: 1.5;
                }
            `}</style>

            <div className="rep-top-row">
                {/* CREATE NEW REPORT Form */}
                <div className="rep-card rep-create-card">
                    <div className="rep-section-header">
                        <h2 className="rep-section-title">
                            <span className="material-symbols-outlined">post_add</span>
                            Create New Report
                        </h2>
                    </div>
                    <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Title input */}
                        <div className="rep-field-group">
                            <span className="rep-field-label">Report Title</span>
                            <input
                                className="rep-input"
                                placeholder="e.g. Deep Learning Evolution & Trends"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                        </div>

                        {/* Export format radios */}
                        <div className="rep-field-group">
                            <span className="rep-field-label">Export Format</span>
                            <div className="rep-radio-group">
                                <span className="rep-radio-label" onClick={() => setExportFormat('PDF')}>
                                    <span className={`rep-radio-dot ${exportFormat === 'PDF' ? 'selected' : ''}`}>
                                        <span className={`rep-radio-dot-inner ${exportFormat === 'PDF' ? 'selected' : ''}`} />
                                    </span>
                                    PDF Document
                                </span>
                                <span className="rep-radio-label" onClick={() => setExportFormat('JSON')}>
                                    <span className={`rep-radio-dot ${exportFormat === 'JSON' ? 'selected' : ''}`}>
                                        <span className={`rep-radio-dot-inner ${exportFormat === 'JSON' ? 'selected' : ''}`} />
                                    </span>
                                    JSON Data
                                </span>
                            </div>
                        </div>

                        {/* Custom keywords multiselect box */}
                        <div className="rep-field-group" style={{ position: 'relative' }}>
                            <span className="rep-field-label">Choose Keywords (Multi-select)</span>
                            <div className="rep-multiselect-container">
                                {selectedKeywords.map((kw) => (
                                    <span key={kw} className="rep-keyword-tag">
                                        {kw}
                                        <span className="rep-keyword-close" onClick={() => handleRemoveKeyword(kw)}>×</span>
                                    </span>
                                ))}
                                <input
                                    className="rep-multiselect-input"
                                    placeholder={selectedKeywords.length === 0 ? "Add keyword..." : ""}
                                    value={keywordInput}
                                    onChange={e => { setKeywordInput(e.target.value); setShowSuggestions(true); }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddKeyword();
                                        }
                                    }}
                                />
                                {showSuggestions && filteredSuggestions.length > 0 && (
                                    <div className="rep-suggestions">
                                        {filteredSuggestions.slice(0, 6).map(opt => (
                                            <div
                                                key={opt.value}
                                                className="rep-suggest-item"
                                                onMouseDown={() => handleAddKeyword(opt.value)}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Year Range side-by-side dropdown selectors */}
                        <div className="rep-dropdown-row">
                            <div className="rep-dropdown-col">
                                <span className="rep-field-label">From Year</span>
                                <div className="rep-select-wrapper">
                                    <select className="rep-select" value={fromYear} onChange={e => setFromYear(e.target.value)}>
                                        <option value="2015">2015</option>
                                        <option value="2018">2018</option>
                                        <option value="2020">2020</option>
                                        <option value="2022">2022</option>
                                    </select>
                                    <span className="material-symbols-outlined rep-select-chevron">keyboard_arrow_down</span>
                                </div>
                            </div>
                            <div className="rep-dropdown-col">
                                <span className="rep-field-label">To Year</span>
                                <div className="rep-select-wrapper">
                                    <select className="rep-select" value={toYear} onChange={e => setToYear(e.target.value)}>
                                        <option value="2023">2023</option>
                                        <option value="2024">2024</option>
                                        <option value="2025">2025</option>
                                        <option value="2026">2026</option>
                                    </select>
                                    <span className="material-symbols-outlined rep-select-chevron">keyboard_arrow_down</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit button */}
                        <button className="rep-submit-btn" type="submit" disabled={loading}>
                            <span className="material-symbols-outlined">analytics</span>
                            Generate Report
                        </button>
                    </form>
                </div>

                {/* REPORT HISTORY Sidebar List */}
                <div className="rep-card rep-history-card">
                    <div className="rep-section-header">
                        <h2 className="rep-section-title">
                            Report History
                        </h2>
                        <span className="rep-history-badge">{history.length} items</span>
                    </div>

                    {historyLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-outline)' }}>
                            Loading history...
                        </div>
                    ) : (
                        <div className="rep-history-list">
                            {history.map((item) => (
                                <div key={item.id} className="rep-history-item">
                                    <div className="rep-hist-top">
                                        <h3 className="rep-hist-title">{item.title}</h3>
                                        <span className="rep-hist-date">{item.createdAt}</span>
                                    </div>
                                    <div className="rep-hist-bot">
                                        <span>{item.format} Format • {item.keywordsCount} Tags</span>
                                        <span className="rep-hist-xem" onClick={() => loadOldReport(item.id)}>
                                            View
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* REPORT VIEWER Container Card */}
            {currentReport ? (
                <div id="report-viewer" className="rep-view-card">
                    {/* Header bar row */}
                    <div className="rep-view-header">
                        <div className="rep-view-header-left">
                            <span className="rep-view-header-tag">
                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>description</span>
                                Viewing Report
                            </span>
                            <h1 className="rep-view-header-title">
                                {currentReport.title} ({currentReport.fromYear || 2018} - {currentReport.toYear || 2024})
                            </h1>
                        </div>
                        <div className="rep-view-header-actions">
                            <button className="rep-btn-copy" onClick={copyJson}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                                Copy JSON
                            </button>
                            <button className="rep-btn-dl" onClick={handleDownloadPdf} disabled={loading}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                Download PDF
                            </button>
                        </div>
                    </div>

                    {/* Papers Published Line Chart section */}
                    <div className="rep-chart-section">
                        <div className="rep-chart-title-row">
                            <div className="rep-green-indicator">
                                Publication Trends (Papers Published)
                            </div>
                            <div className="rep-legend-row">
                                {(currentReport.keywordsList && currentReport.keywordsList.length > 0
                                    ? currentReport.keywordsList
                                    : (currentReport.chartData && currentReport.chartData.length > 0
                                        ? Object.keys(currentReport.chartData[0]).filter(k => k !== 'year')
                                        : [])).map((kw, index) => {
                                            const colors = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];
                                            return (
                                                <div key={kw} className="rep-legend-item">
                                                    <span className="rep-legend-dot" style={{ background: colors[index % colors.length] }} />
                                                    <span>{kw}</span>
                                                </div>
                                            );
                                        })}
                            </div>
                        </div>

                        {/* Chart Render Canvas */}
                        <div style={{ width: '100%', height: 320 }}>
                            <ResponsiveContainer>
                                <LineChart data={currentReport.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#94a3b8', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip />
                                    {(currentReport.keywordsList && currentReport.keywordsList.length > 0
                                        ? currentReport.keywordsList
                                        : (currentReport.chartData && currentReport.chartData.length > 0
                                            ? Object.keys(currentReport.chartData[0]).filter(k => k !== 'year')
                                            : [])).map((kw, index) => {
                                                const colors = ['#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];
                                                return (
                                                    <Line
                                                        key={kw}
                                                        type="monotone"
                                                        dataKey={kw}
                                                        name={kw}
                                                        stroke={colors[index % colors.length]}
                                                        strokeWidth={3}
                                                        dot={{ r: 4, fill: '#fff', strokeWidth: 2.5, stroke: colors[index % colors.length] }}
                                                    />
                                                );
                                            })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Side-by-side Tables: Top Authors & Top Journals */}
                    <div className="rep-tables-grid">
                        {/* Top Authors */}
                        <div className="rep-table-col">
                            <div className="rep-green-indicator">
                                Top Authors
                            </div>
                            <table className="rep-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50%' }}>Author Name</th>
                                        <th style={{ width: '25%', textAlign: 'right' }}>Papers</th>
                                        <th style={{ width: '25%', textAlign: 'right' }}>Citations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentReport.topAuthors.map((author, index) => (
                                        <tr key={index}>
                                            <td style={{ fontWeight: 700 }}>{author.name}</td>
                                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-data)', fontWeight: '700' }}>
                                                {author.paperCount}
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-data)', color: 'var(--color-on-surface-variant)' }}>
                                                {author.citations || "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Top Journals */}
                        <div className="rep-table-col">
                            <div className="rep-green-indicator">
                                Top Journals
                            </div>
                            <table className="rep-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50%' }}>Journal / Conference</th>
                                        <th style={{ width: '25%', textAlign: 'right' }}>Ratio</th>
                                        <th style={{ width: '25%', textAlign: 'right' }}>Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentReport.topJournals.map((journal, index) => {
                                        const isPositive = journal.trend >= 0;
                                        return (
                                            <tr key={index}>
                                                <td style={{ fontWeight: 700 }}>{journal.name}</td>
                                                <td style={{ textAlign: 'right', fontFamily: 'var(--font-data)', fontWeight: '700' }}>
                                                    {journal.ratio || `${journal.paperCount} papers`}
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <span className={`rep-badge-trend ${isPositive ? 'positive' : 'negative'}`}>
                                                        {isPositive ? `+${journal.trend}%` : `${journal.trend}%`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Report Footer */}
                    <div className="rep-view-footer">
                        <div>
                                    Data compiled from 12,450 academic repository sources.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                            Secured Analyst Report
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rep-empty-state">
                    <span className="material-symbols-outlined rep-empty-icon">analytics</span>
                    <h3>No Report Selected</h3>
                    <p>Select a report from the History list or fill out the form above to generate a new report.</p>
                </div>
            )}
        </div>
    );
};

export default Reports;
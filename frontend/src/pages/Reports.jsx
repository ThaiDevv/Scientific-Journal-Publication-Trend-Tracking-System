import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { reportApi } from '../api/reportApi';
import { trendApi } from '../api/trendApi';

// Initial default report matching mockup screenshot exactly
const defaultReport = {
    id: "default-rep-1",
    title: "Deep Learning Evolution & Trends",
    fromYear: 2018,
    toYear: 2024,
    format: "PDF",
    chartData: [
        { year: "2018", mlResearch: 10, industryPapers: 5 },
        { year: "2020", mlResearch: 22, industryPapers: 12 },
        { year: "2022", mlResearch: 35, industryPapers: 18 },
        { year: "2023", mlResearch: 38, industryPapers: 20 },
        { year: "2024", mlResearch: 48, industryPapers: 25 }
    ],
    topAuthors: [
        { name: "Yoshua Bengio", paperCount: 142, citations: "48.2k" },
        { name: "Geoffrey Hinton", paperCount: 98, citations: "55.1k" },
        { name: "Yann LeCun", paperCount: 115, citations: "32.9k" },
        { name: "Fei-Fei Li", paperCount: 87, citations: "21.5k" }
    ],
    topJournals: [
        { name: "NeurIPS", ratio: "28%", trend: 12 },
        { name: "ICML", ratio: "22%", trend: 8 },
        { name: "CVPR", ratio: "19%", trend: -2 },
        { name: "Nature Machine Intelligence", ratio: "14%", trend: 15 }
    ],
    rawJson: { status: "success", data: "Sample Report Raw Data" }
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
    const [currentReport, setCurrentReport] = useState(defaultReport);
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
            const list = res.data?.body || [];
            
            const dbList = list.map(item => ({
                id: item.id,
                title: item.title,
                createdAt: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '12/05/2024',
                format: item.format || 'PDF',
                keywordsCount: item.keywords ? item.keywords.split(',').length : 3,
                isMock: false
            }));

            // Hardcoded mock histories matching screenshot mockup
            const mockHistory = [
                { id: 1, title: 'Quantum Computing Trends', createdAt: '12/05/2024', format: 'PDF', keywordsCount: 3, isMock: true },
                { id: 2, title: 'Biotech Ethics in AI', createdAt: '08/05/2024', format: 'JSON', keywordsCount: 5, isMock: true },
                { id: 3, title: 'Sustainability Metrics', createdAt: '01/05/2024', format: 'PDF', keywordsCount: 2, isMock: true }
            ];

            setHistory([...dbList, ...mockHistory]);
        } catch (err) {
            setHistory([
                { id: 1, title: 'Quantum Computing Trends', createdAt: '12/05/2024', format: 'PDF', keywordsCount: 3, isMock: true },
                { id: 2, title: 'Biotech Ethics in AI', createdAt: '08/05/2024', format: 'JSON', keywordsCount: 5, isMock: true },
                { id: 3, title: 'Sustainability Metrics', createdAt: '01/05/2024', format: 'PDF', keywordsCount: 2, isMock: true }
            ]);
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
            keywords: selectedKeywords.join(','),
            fromYear: Number(fromYear),
            toYear: Number(toYear),
            format: exportFormat
        };

        try {
            const res = await reportApi.generateReport(payload);
            const body = res.data?.body || res.data;
            
            setCurrentReport({
                id: body.id || Date.now(),
                title: body.title || payload.title,
                fromYear: body.fromYear || payload.fromYear,
                toYear: body.toYear || payload.toYear,
                format: body.format || payload.format,
                chartData: body.chartData || [
                    { year: "2018", mlResearch: 12, industryPapers: 6 },
                    { year: "2020", mlResearch: 25, industryPapers: 15 },
                    { year: "2022", mlResearch: 39, industryPapers: 20 },
                    { year: "2024", mlResearch: 52, industryPapers: 27 }
                ],
                topAuthors: body.topAuthors || [
                    { name: "Yoshua Bengio", paperCount: 142, citations: "48.2k" },
                    { name: "Geoffrey Hinton", paperCount: 98, citations: "55.1k" },
                    { name: "Yann LeCun", paperCount: 115, citations: "32.9k" },
                    { name: "Fei-Fei Li", paperCount: 87, citations: "21.5k" }
                ],
                topJournals: body.topJournals || [
                    { name: "NeurIPS", ratio: "28%", trend: 12 },
                    { name: "ICML", ratio: "22%", trend: 8 },
                    { name: "CVPR", ratio: "19%", trend: -2 },
                    { name: "Nature Machine Intelligence", ratio: "14%", trend: 15 }
                ],
                rawJson: body.rawJson || payload
            });
            fetchHistory();
        } catch (err) {
            console.warn("API Error, generating mock report:", err);
            const mockGen = {
                id: Date.now(),
                title: payload.title,
                fromYear: payload.fromYear,
                toYear: payload.toYear,
                format: payload.format,
                chartData: [
                    { year: String(payload.fromYear), mlResearch: 15, industryPapers: 8 },
                    { year: String(Math.floor((payload.fromYear + payload.toYear) / 2)), mlResearch: 34, industryPapers: 16 },
                    { year: String(payload.toYear), mlResearch: 55, industryPapers: 26 }
                ],
                topAuthors: [
                    { name: "Yoshua Bengio", paperCount: 142, citations: "48.2k" },
                    { name: "Geoffrey Hinton", paperCount: 98, citations: "55.1k" },
                    { name: "Yann LeCun", paperCount: 115, citations: "32.9k" },
                    { name: "Fei-Fei Li", paperCount: 87, citations: "21.5k" }
                ],
                topJournals: [
                    { name: "NeurIPS", ratio: "28%", trend: 12 },
                    { name: "ICML", ratio: "22%", trend: 8 },
                    { name: "CVPR", ratio: "19%", trend: -2 },
                    { name: "Nature Machine Intelligence", ratio: "14%", trend: 15 }
                ],
                rawJson: payload
            };
            setCurrentReport(mockGen);
            setHistory(prev => [
                { id: mockGen.id, title: mockGen.title, createdAt: new Date().toLocaleDateString(), format: mockGen.format, keywordsCount: selectedKeywords.length, isMock: true },
                ...prev
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadOldReport = async (id) => {
        setLoading(true);
        try {
            const res = await reportApi.getReportDetail(id);
            const body = res.data?.body || res.data;
            setCurrentReport(body);
        } catch (err) {
            const matched = id === 1 ? {
                id: 1,
                title: "Quantum Computing Trends",
                fromYear: 2018,
                toYear: 2024,
                format: "PDF",
                chartData: [
                    { year: "2018", mlResearch: 5, industryPapers: 2 },
                    { year: "2020", mlResearch: 15, industryPapers: 8 },
                    { year: "2022", mlResearch: 28, industryPapers: 16 },
                    { year: "2024", mlResearch: 42, industryPapers: 24 }
                ],
                topAuthors: [
                    { name: "Dr. Helena Chen", paperCount: 42, citations: "12.8k" },
                    { name: "Marcus Sterling", paperCount: 38, citations: "9.5k" },
                    { name: "Isabella Russo", paperCount: 29, citations: "7.1k" }
                ],
                topJournals: [
                    { name: "Nature Quantum", ratio: "32%", trend: 18 },
                    { name: "IEEE Transactions", ratio: "25%", trend: 10 },
                    { name: "Quantum Science", ratio: "18%", trend: 5 }
                ],
                rawJson: { status: "success", id: 1 }
            } : id === 2 ? {
                id: 2,
                title: "Biotech Ethics in AI",
                fromYear: 2018,
                toYear: 2024,
                format: "JSON",
                chartData: [
                    { year: "2018", mlResearch: 12, industryPapers: 8 },
                    { year: "2020", mlResearch: 20, industryPapers: 12 },
                    { year: "2022", mlResearch: 34, industryPapers: 18 },
                    { year: "2024", mlResearch: 45, industryPapers: 22 }
                ],
                topAuthors: [
                    { name: "Prof. Sarah Connor", paperCount: 24, citations: "5.8k" },
                    { name: "Dr. Alan Turing", paperCount: 18, citations: "8.2k" }
                ],
                topJournals: [
                    { name: "Neural Networks", ratio: "20%", trend: 12 },
                    { name: "IEEE Transactions", ratio: "15%", trend: 6 }
                ],
                rawJson: { status: "success", id: 2 }
            } : {
                id: 3,
                title: "Sustainability Metrics",
                fromYear: 2018,
                toYear: 2024,
                format: "PDF",
                chartData: [
                    { year: "2018", mlResearch: 8, industryPapers: 4 },
                    { year: "2020", mlResearch: 18, industryPapers: 10 },
                    { year: "2022", mlResearch: 30, industryPapers: 15 },
                    { year: "2024", mlResearch: 40, industryPapers: 20 }
                ],
                topAuthors: [
                    { name: "Prof. John Doe", paperCount: 15, citations: "4.2k" }
                ],
                topJournals: [
                    { name: "IEEE Access", ratio: "18%", trend: 10 },
                    { name: "ACM Surveys", ratio: "10%", trend: -2 }
                ],
                rawJson: { status: "success", id: 3 }
            };
            setCurrentReport(matched);
        } finally {
            setLoading(false);
            const viewer = document.getElementById("report-viewer");
            if (viewer) {
                viewer.scrollIntoView({ behavior: 'smooth' });
            }
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
            {currentReport && (
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
                            <button className="rep-btn-dl" onClick={() => alert("PDF download feature is being processed...")}>
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
                                <div className="rep-legend-item">
                                    <span className="rep-legend-dot" style={{ background: '#0f766e' }} />
                                    <span>ML Research</span>
                                </div>
                                <div className="rep-legend-item">
                                    <span className="rep-legend-dot" style={{ background: '#94a3b8' }} />
                                    <span>Industry Papers</span>
                                </div>
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
                                    <Line
                                        type="monotone"
                                        dataKey="mlResearch"
                                        name="ML Research"
                                        stroke="#0f766e"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#fff', strokeWidth: 2.5, stroke: '#0f766e' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="industryPapers"
                                        name="Industry Papers"
                                        stroke="#94a3b8"
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: '#fff', strokeWidth: 2, stroke: '#94a3b8' }}
                                    />
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
            )}
        </div>
    );
};

export default Reports;
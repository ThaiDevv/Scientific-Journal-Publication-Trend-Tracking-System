import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { trendApi } from '../api/trendApi';
import { dashboardApi } from '../api/dashboardApi';
import FieldPieChart from '../components/Charts/FieldPieChart';
import WordCloud from '../components/Charts/WordCloud';

const Dashboard = () => {
    const navigate = useNavigate();

    // Stats states
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Trend states
    const [trendData, setTrendData] = useState([]);
    const [loadingTrend, setLoadingTrend] = useState(true);

    // Journals & Fields states
    const [journalData, setJournalData] = useState([]);
    const [fieldData, setFieldData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);

    // Recent papers states
    const [recentPapers, setRecentPapers] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);

    // Keywords state for Word Cloud
    const [keywordsData, setKeywordsData] = useState([]);
    const [loadingKeywords, setLoadingKeywords] = useState(true);

    // Trending topics state
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [loadingTrending, setLoadingTrending] = useState(true);

    useEffect(() => {
        // Stats
        dashboardApi.getStats()
            .then(res => setStats(res.data?.body || res.data))
            .catch(() => setStats({ totalPapers: 12540, totalJournals: 450, totalAuthors: 8200, totalKeywords: 15000 }))
            .finally(() => setLoadingStats(false));

        // Compare Trends (AI vs Blockchain vs Quantum)
        const compareKeywords = ["AI", "Blockchain", "Quantum"];
        const mockTrend = [
            { year: 2022, AI: 18, Blockchain: 24, Quantum: 5 },
            { year: 2023, AI: 45, Blockchain: 32, Quantum: 10 },
            { year: 2024, AI: 68, Blockchain: 28, Quantum: 22 },
            { year: 2025, AI: 88, Blockchain: 45, Quantum: 30 },
            { year: 2026, AI: 98, Blockchain: 50, Quantum: 60 }
        ];
        setLoadingTrend(true);
        trendApi.getCompareTrends(compareKeywords)
            .then(res => {
                const body = res.data?.body || res.data;
                if (Array.isArray(body) && body.length > 0) {
                    setTrendData(body);
                } else {
                    setTrendData(mockTrend);
                }
            })
            .catch(() => setTrendData(mockTrend))
            .finally(() => setLoadingTrend(false));

        // Charts
        setLoadingCharts(true);
        Promise.all([
            dashboardApi.getTopJournals(),
            dashboardApi.getFieldDistribution()
        ])
            .then(([jRes, fRes]) => {
                setJournalData(jRes.data?.body || jRes.data);
                setFieldData(fRes.data?.body || fRes.data);
            })
            .catch(() => {
                setJournalData([
                    { name: 'Nature Communications', count: 2450 },
                    { name: 'IEEE Transactions',    count: 1820 },
                    { name: 'Journal of Neuroscience', count: 1400 },
                    { name: 'PLOS ONE',             count: 1120 }
                ]);
                setFieldData([
                    { field: 'Computer Science', count: 45 },
                    { field: 'Mathematics',      count: 30 },
                    { field: 'Physics',          count: 25 }
                ]);
            })
            .finally(() => setLoadingCharts(false));

        // Recent Papers
        setLoadingRecent(true);
        dashboardApi.getRecentPapers()
            .then(res => {
                const data = res.data?.body;
                setRecentPapers(Array.isArray(data) ? data : (data?.content || []));
            })
            .catch(() => setRecentPapers([
                { id: 1, title: 'Neural Architecture Search for Vision Transformers', journalName: 'AI Research Journal', publicationYear: 2024 },
                { id: 2, title: 'Blockchain-based Secure Data Sharing for Healthcare', journalName: 'Health-Tech Quarterly', publicationYear: 2024 },
                { id: 3, title: 'Quantum Supremacy in High-Performance Computing', journalName: 'Quantum Science Review', publicationYear: 2023 },
                { id: 4, title: 'Decentralized Finance: Market Efficiency Analysis', journalName: 'Economic Trends', publicationYear: 2023 }
            ]))
            .finally(() => setLoadingRecent(false));

        // Top Keywords for Word Cloud
        setLoadingKeywords(true);
        trendApi.getTopKeywords(50)
            .then(res => {
                const data = res.data?.body || res.data?.data || res.data;
                setKeywordsData(data || []);
            })
            .catch(() => setKeywordsData([]))
            .finally(() => setLoadingKeywords(false));

        // Trending Topics from API
        setLoadingTrending(true);
        dashboardApi.getTrendingTopics(4)
            .then(res => {
                setTrendingTopics(res.data?.body || res.data || []);
            })
            .catch(() => {
                setTrendingTopics([
                    { keyword: 'Large Language Models', growthRate: 48.2 },
                    { keyword: 'Sustainable Energy Systems', growthRate: 31.5 },
                    { keyword: 'Quantum Cryptography', growthRate: 22.1 },
                    { keyword: 'Bio-informatics Genomics', growthRate: 18.4 }
                ]);
            })
            .finally(() => setLoadingTrending(false));
    }, []);

    // Helper for YoY Badge
    const renderYoY = (val) => (
        <span className="db-yoy">+{val}% YoY</span>
    );

    // Max count for Top Journals progress bars
    const maxJournalCount = journalData.length
        ? Math.max(...journalData.map(j => j.paperCount || j.count || 1))
        : 100;

    return (
        <div className="db-page">
            {/* Scoped CSS styling */}
            <style>{`
                .db-page {
                    padding: var(--gutter);
                    background: var(--color-background);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                }
                /* Title */
                .db-title {
                    font-family: var(--font-headline);
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                /* Cards */
                .db-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                }
                .db-card-inner { padding: 24px; }
                /* Stats Grid */
                .db-stat-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                }
                @media (max-width: 1024px) {
                    .db-stat-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (max-width: 580px) {
                    .db-stat-grid { grid-template-columns: 1fr; }
                }
                .db-stat-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 20px 24px;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    min-height: 120px;
                }
                .db-stat-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .db-stat-icon-box {
                    width: 38px; height: 38px;
                    border-radius: 8px;
                    background: #e6f7f4;
                    color: var(--color-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .db-stat-icon-box span { font-size: 21px; }
                .db-yoy {
                    font-family: var(--font-data);
                    font-size: 11px;
                    font-weight: 700;
                    color: #0f766e;
                }
                .db-stat-bottom {
                    margin-top: 14px;
                }
                .db-stat-label {
                    font-family: var(--font-ui);
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }
                .db-stat-val {
                    font-family: var(--font-data);
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--color-primary);
                    line-height: 1;
                }
                /* Mid & Bot Grids */
                .db-grid-2 {
                    display: grid;
                    grid-template-columns: 1.7fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 960px) {
                    .db-grid-2 { grid-template-columns: 1fr; }
                }
                .db-grid-half {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                @media (max-width: 960px) {
                    .db-grid-half { grid-template-columns: 1fr; }
                }
                /* Titles */
                .db-section-title {
                    font-family: var(--font-display);
                    font-size: 19px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin: 0 0 4px 0;
                }
                .db-section-sub {
                    font-size: var(--fs-ui-label);
                    color: var(--color-on-surface-variant);
                    margin-bottom: 20px;
                    font-family: var(--font-ui);
                }
                /* Legend list */
                .db-legend {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-bottom: 12px;
                }
                .db-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    font-weight: 600;
                    font-family: var(--font-ui);
                    color: var(--color-on-surface-variant);
                }
                .db-legend-dot {
                    width: 7px; height: 7px;
                    border-radius: 50%;
                    display: inline-block;
                }
                /* Trending Box */
                .db-trending-box {
                    background: #f8fafc;
                    border: 1px solid #f1f5f9;
                    border-radius: var(--radius-lg);
                    padding: 12px 16px;
                    margin-bottom: 12px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: transform 0.15s;
                }
                .db-trending-box:hover { transform: translateY(-1.5px); }
                .db-trending-rank {
                    font-family: var(--font-data);
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    width: 18px;
                }
                .db-trending-name {
                    flex: 1;
                    font-family: var(--font-body);
                    font-weight: 700;
                    font-size: 13.5px;
                    color: var(--color-on-surface);
                }
                .db-trending-badge {
                    font-family: var(--font-data);
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                }
                .db-trending-badge.positive {
                    color: #0f766e;
                    background: #e6f7f4;
                }
                .db-trending-badge.negative {
                    color: #dc2626;
                    background: #fef2f2;
                }
                .db-trending-badge span { font-size: 13px; }
                .db-link {
                    display: block;
                    text-align: center;
                    margin-top: 14px;
                    font-size: var(--fs-ui-label);
                    font-weight: 600;
                    color: var(--color-on-surface-variant);
                    cursor: pointer;
                    padding: 8px;
                    font-family: var(--font-ui);
                    transition: color 0.15s;
                }
                .db-link:hover { color: var(--color-secondary); }
                /* Progress list */
                .db-progress-row {
                    margin-bottom: 16px;
                }
                .db-progress-row:last-child { margin-bottom: 0; }
                .db-progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin-bottom: 6px;
                    font-family: var(--font-ui);
                }
                .db-progress-bar-bg {
                    background: #f1f5f9;
                    height: 8px;
                    border-radius: 999px;
                    overflow: hidden;
                }
                .db-progress-bar-fill {
                    background: #111827;
                    height: 100%;
                    border-radius: 999px;
                }
                /* Table styling */
                .db-table-wrapper {
                    overflow-x: auto;
                }
                .db-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: var(--font-body);
                }
                .db-table th {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    color: var(--color-on-surface-variant);
                    text-transform: uppercase;
                    padding: 10px 14px;
                    text-align: left;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                }
                .db-table td {
                    padding: 14px 14px;
                    font-size: var(--fs-body-sm);
                    color: var(--color-on-surface);
                    border-bottom: 1px solid var(--color-surface-container);
                }
                .db-table tr:hover td { background: var(--color-surface-container-low); }
                .db-action-btn {
                    width: 32px; height: 32px;
                    border-radius: 50%;
                    border: 1px solid var(--color-outline-variant);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--color-on-surface-variant);
                    background: transparent;
                    transition: background 0.15s, border-color 0.15s, color 0.15s;
                }
                .db-action-btn:hover {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    color: var(--color-on-primary);
                }
                /* Footer */
                .db-footer {
                    text-align: center;
                    padding: 24px 0 12px;
                    font-size: 12px;
                    color: var(--color-outline);
                    font-family: var(--font-ui);
                    border-top: 1px solid var(--color-outline-variant);
                    margin-top: auto;
                }
                .db-chart-empty {
                    height: 280px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-on-surface-variant);
                    font-size: var(--fs-body-sm);
                    flex-direction: column;
                    gap: 10px;
                }
                /* spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .db-spinner {
                    width: 30px; height: 30px;
                    border: 3px solid var(--color-outline-variant);
                    border-top-color: var(--color-secondary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
            `}</style>

            {/* Header */}
            <div>
                <h1 className="db-title">Research Dashboard</h1>
            </div>

            {/* Row 1: Stat Cards */}
            <div className="db-stat-grid">
                {/* Papers */}
                <div className="db-stat-card">
                    <div className="db-stat-top">
                        <div className="db-stat-icon-box">
                            <span className="material-symbols-outlined">description</span>
                        </div>
                        {renderYoY(12)}
                    </div>
                    <div className="db-stat-bottom">
                        <div className="db-stat-label">TOTAL PAPERS</div>
                        <div className="db-stat-val">{(stats?.totalPapers || 12540).toLocaleString()}</div>
                    </div>
                </div>

                {/* Journals */}
                <div className="db-stat-card">
                    <div className="db-stat-top">
                        <div className="db-stat-icon-box">
                            <span className="material-symbols-outlined">menu_book</span>
                        </div>
                        {renderYoY(5)}
                    </div>
                    <div className="db-stat-bottom">
                        <div className="db-stat-label">TOTAL JOURNALS</div>
                        <div className="db-stat-val">{(stats?.totalJournals || 450).toLocaleString()}</div>
                    </div>
                </div>

                {/* Authors */}
                <div className="db-stat-card">
                    <div className="db-stat-top">
                        <div className="db-stat-icon-box">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        {renderYoY(8)}
                    </div>
                    <div className="db-stat-bottom">
                        <div className="db-stat-label">TOTAL AUTHORS</div>
                        <div className="db-stat-val">{(stats?.totalAuthors || 8200).toLocaleString()}</div>
                    </div>
                </div>

                {/* Keywords */}
                <div className="db-stat-card">
                    <div className="db-stat-top">
                        <div className="db-stat-icon-box">
                            <span className="material-symbols-outlined">tag</span>
                        </div>
                        {renderYoY(24)}
                    </div>
                    <div className="db-stat-bottom">
                        <div className="db-stat-label">TOTAL KEYWORDS</div>
                        <div className="db-stat-val">{(stats?.totalKeywords || 15000).toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Row 2: Keyword Trend + Trending Topics */}
            <div className="db-grid-2">
                {/* Keyword Trend Analysis */}
                <div className="db-card db-card-inner">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div>
                            <h2 className="db-section-title">Keyword Trend Analysis (2022-2026)</h2>
                            <p className="db-section-sub">Comparison of projected research density across emerging fields.</p>
                        </div>
                        <div className="db-legend">
                            <span className="db-legend-item">
                                <span className="db-legend-dot" style={{ background: '#111827' }} /> AI
                            </span>
                            <span className="db-legend-item">
                                <span className="db-legend-dot" style={{ background: '#0f766e' }} /> Blockchain
                            </span>
                            <span className="db-legend-item">
                                <span className="db-legend-dot" style={{ background: '#64748b' }} /> Quantum
                            </span>
                        </div>
                    </div>

                    {loadingTrend ? (
                        <div className="db-chart-empty">
                            <div className="db-spinner" />
                            <span>Loading trend data…</span>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 280 }}>
                            <ResponsiveContainer>
                                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -24, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
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
                                        tickFormatter={(v) => v + '%'}
                                        width={45}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(v, name) => [`${v}%`, name]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="AI"
                                        name="AI"
                                        stroke="#111827"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Blockchain"
                                        name="Blockchain"
                                        stroke="#0f766e"
                                        strokeWidth={2.5}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Quantum"
                                        name="Quantum"
                                        stroke="#64748b"
                                        strokeWidth={2.5}
                                        dot={false}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Trending Topics */}
                <div className="db-card db-card-inner">
                    <h2 className="db-section-title" style={{ marginBottom: 16 }}>Trending Topics</h2>
                    
                    {loadingTrending ? (
                        <div className="db-chart-empty">
                            <div className="db-spinner" />
                            <span>Loading trending topics…</span>
                        </div>
                    ) : trendingTopics.length === 0 ? (
                        <div className="db-chart-empty">No trending topics found.</div>
                    ) : (
                        trendingTopics.map((topic, index) => {
                            const rate = topic.growthRate !== undefined ? topic.growthRate : 0.0;
                            const isPositive = rate >= 0;
                            return (
                                <div key={topic.keyword || index} className="db-trending-box">
                                    <span className="db-trending-rank">{String(index + 1).padStart(2, '0')}</span>
                                    <span className="db-trending-name">{topic.keyword}</span>
                                    <span className={`db-trending-badge ${isPositive ? 'positive' : 'negative'}`}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>
                                            {isPositive ? 'trending_up' : 'trending_down'}
                                        </span>
                                        {isPositive ? `+${rate.toFixed(1)}%` : `${rate.toFixed(1)}%`}
                                    </span>
                                </div>
                            );
                        })
                    )}

                    <span className="db-link" onClick={() => navigate('/topics')}>
                        View Full Report →
                    </span>
                </div>
            </div>

            {/* Row 3: Top Journals + Research Field Distribution */}
            <div className="db-grid-half">
                {/* Top Journals */}
                <div className="db-card db-card-inner">
                    <h2 className="db-section-title" style={{ marginBottom: 20 }}>Top Journals by Publication Count</h2>
                    {loadingCharts ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="db-spinner" />
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                            {journalData.slice(0, 4).map((item) => {
                                const name = item.journalName || item.name || 'Unknown Journal';
                                const count = item.paperCount || item.count || 0;
                                const widthPct = maxJournalCount ? (count / maxJournalCount) * 100 : 0;
                                return (
                                    <div key={name} className="db-progress-row">
                                        <div className="db-progress-header">
                                            <span>{name}</span>
                                            <span style={{ fontFamily: 'var(--font-data)' }}>{count.toLocaleString()}</span>
                                        </div>
                                        <div className="db-progress-bar-bg">
                                            <div className="db-progress-bar-fill" style={{ width: `${widthPct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Research Field Distribution */}
                <div className="db-card db-card-inner">
                    <h2 className="db-section-title" style={{ marginBottom: 4 }}>Research Field Distribution</h2>
                    <p className="db-section-sub">Breakdown of active publications by scientific domain.</p>
                    <FieldPieChart data={fieldData} loading={loadingCharts} />
                </div>
            </div>

            {/* Row 4: Popular Keywords Word Cloud */}
            <div className="db-card db-card-inner">
                <h2 className="db-section-title" style={{ marginBottom: 4 }}>Popular Research Keywords (Word Cloud)</h2>
                <p className="db-section-sub">Visual representation of the most frequently referenced academic index keywords.</p>
                <WordCloud data={keywordsData} loading={loadingKeywords} />
            </div>

            {/* Row 5: Recent Papers */}
            <div className="db-card db-card-inner">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 className="db-section-title">Recent Papers</h2>
                    <span className="db-link" style={{ margin: 0, padding: '4px 12px' }} onClick={() => navigate('/papers/search')}>
                        View All Papers
                    </span>
                </div>
                <div className="db-table-wrapper">
                    {loadingRecent ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="db-spinner" />
                        </div>
                    ) : (
                        <table className="db-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Journal</th>
                                    <th>Year</th>
                                    <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPapers.slice(0, 4).map((paper) => (
                                    <tr key={paper.id}>
                                        <td style={{ fontWeight: 700 }}>{paper.title}</td>
                                        <td style={{ color: 'var(--color-on-surface-variant)' }}>{paper.journalName || paper.journal || 'Unknown Journal'}</td>
                                        <td style={{ fontFamily: 'var(--font-data)' }}>{paper.publicationYear}</td>
                                        <td style={{ display: 'flex', justifyContent: 'center' }}>
                                            <button className="db-action-btn" onClick={() => navigate(`/papers/${paper.id}`)} title="View Paper Details">
                                                <span className="material-symbols-outlined">visibility</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="db-footer">
                © 2024 Academic Forum — Empowering Intellectual Rigor and Global Research Connectivity.
            </footer>
        </div>
    );
};

export default Dashboard;
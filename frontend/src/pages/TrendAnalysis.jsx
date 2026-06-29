import React, { useState, useEffect, useRef } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { trendApi } from '../api/trendApi';
import { followApi } from '../api/followApi';

/* ─── colour palette matching design system (dark academic tones) ─── */
const DARK_COLORS = ['#111827', '#0f766e', '#b91c1c'];

/* ─── Growth Rate badge ─── */
const GrowthBadge = ({ rate }) => {
    const positive = rate >= 0;
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 10px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: 'var(--font-data)',
            background: positive ? '#dcfce7' : '#fee2e2',
            color: positive ? '#15803d' : '#b91c1c',
            letterSpacing: '0.02em',
        }}>
            {positive ? '+' : ''}{rate}%
        </span>
    );
};

/* ─── Custom recharts tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '10px 16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            minWidth: 140,
        }}>
            <p style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, fontFamily: 'var(--font-ui)' }}>{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color, fontSize: 13, margin: '2px 0', fontFamily: 'var(--font-body)' }}>
                    {p.name}: <strong>{p.value?.toLocaleString()}</strong>
                </p>
            ))}
        </div>
    );
};

const SemanticCloud = ({ data, loading }) => {
    const getColor = (val, maxVal, minVal, text) => {
        if (maxVal > minVal && val === maxVal) {
            return '#006a61'; // Darker deep teal matching design system secondary color
        }
        const colors = ['#0f172a', '#64748b', '#0f9f90'];
        let h = 0;
        for (let i = 0; i < text.length; i++) h = text.charCodeAt(i) + ((h << 5) - h);
        return colors[Math.abs(h) % colors.length];
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
            <div className="ta-spinner" />
        </div>
    );
    const sortedWords = [...data]
        .map(d => ({
            text: d.text || d.name || d.keyword || 'Unknown',
            value: d.value || d.usageCount || 1
        }))
        .sort((a, b) => b.value - a.value);

    if (!sortedWords.length) return (
        <div style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', padding: 40 }}>
            No keyword data
        </div>
    );

    const min = sortedWords[sortedWords.length - 1].value;
    const max = sortedWords[0].value;
    const fs = (v) => (max === min ? 24 : 13 + ((v - min) / (max - min)) * 38);

    // Reorder from inside out: largest in center, smaller outwards
    const arrangedWords = [];
    for (let i = 0; i < sortedWords.length; i++) {
        if (i % 2 === 0) {
            arrangedWords.push(sortedWords[i]);
        } else {
            arrangedWords.unshift(sortedWords[i]);
        }
    }

    return (
        <div style={{
            display: 'flex', flexWrap: 'wrap',
            justifyContent: 'center', alignItems: 'center',
            alignContent: 'center', gap: '24px 36px',
            padding: '24px 12px', minHeight: 240,
        }}>
            {arrangedWords.map((w, i) => (
                <span
                    key={i}
                    title={`${w.text}: ${w.value} papers`}
                    style={{
                        fontSize: fs(w.value),
                        fontWeight: 700,
                        color: getColor(w.value, max, min, w.text),
                        fontFamily: 'var(--font-body)',
                        cursor: 'default',
                        transition: 'transform 0.2s, filter 0.2s',
                        display: 'inline-block',
                        animation: `wc-fade 0.5s ease ${i * 18}ms both`,
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.15)';
                        e.currentTarget.style.filter = 'brightness(1.15)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.filter = 'none';
                    }}
                >
                    {w.text}
                </span>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
const TrendAnalysis = () => {
    const navigate = useNavigate();
    const defaultFallbackKeywords = ['AI', 'Big Data', 'Blockchain', 'Quantum Computing', 'Cybersecurity'];

    const [inputValue, setInputValue] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState(defaultFallbackKeywords);
    const [yearFrom, setYearFrom] = useState(2018);
    const [yearTo, setYearTo] = useState(2025);
    const [chartData, setChartData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [trendingKeywords, setTrendingKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCloud, setLoadingCloud] = useState(true);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const [followedKeywords, setFollowedKeywords] = useState([]);

    const loadFollowedKeywords = async () => {
        try {
            const res = await followApi.getFollows();
            const list = res.data?.body || [];
            setFollowedKeywords(list.filter(f => f.followType === 'KEYWORD'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleFollowKeywordToggle = async (e, keywordName, keywordId) => {
        e.stopPropagation(); // prevent adding keyword to analysis comparison list
        if (!keywordId) return;
        const existingFollow = followedKeywords.find(f => f.targetName === keywordName);
        try {
            if (existingFollow) {
                await followApi.unfollow(existingFollow.id);
                setFollowedKeywords(prev => prev.filter(f => f.id !== existingFollow.id));
            } else {
                const res = await followApi.followKeyword(keywordId);
                const followObj = res.data?.body;
                if (followObj) {
                    setFollowedKeywords(prev => [...prev, followObj]);
                }
            }
        } catch (err) {
            console.error("Follow keyword failed", err);
        }
    };

    /* ── fetch top keywords ── */
    useEffect(() => {
        setLoadingCloud(true);
        loadFollowedKeywords();
        trendApi.getTopKeywords(50)
            .then(res => {
                const list = res.data?.body || res.data?.data || res.data || [];
                const mapped = list.map(kw => ({ id: kw.id, text: kw.name, value: kw.usageCount }));
                setTrendingKeywords(mapped);
                setSuggestions(mapped.map(m => m.text));

                // Get top 5 keywords from API, or fallback to default list
                const apiTop5 = mapped.slice(0, 5).map(m => m.text);
                const initialKws = apiTop5.length >= 3 ? apiTop5 : defaultFallbackKeywords;
                setSelectedKeywords(initialKws);
                handleAnalyze(initialKws);
            })
            .catch(() => {
                setTrendingKeywords([]);
                setSelectedKeywords(defaultFallbackKeywords);
                handleAnalyze(defaultFallbackKeywords);
            })
            .finally(() => setLoadingCloud(false));
    }, []);

    /* ── add keyword ── */
    const addKeyword = (kw) => {
        const val = (kw || inputValue).trim();
        if (!val) return;
        if (selectedKeywords.includes(val)) { setInputValue(''); return; }
        if (selectedKeywords.length >= 5) return;
        setSelectedKeywords(prev => [...prev, val]);
        setInputValue('');
        setShowSuggest(false);
    };

    const removeKeyword = (kw) => setSelectedKeywords(prev => prev.filter(k => k !== kw));

    /* ── analyze ── */
    const handleAnalyze = (kws = selectedKeywords) => {
        if (!kws.length) return;
        setLoading(true);
        trendApi.analyzeTrends({ keywords: kws.join(','), fromYear: yearFrom, toYear: yearTo })
            .then(res => {
                const body = res.data?.body || res.data;
                setChartData(body.chartData || []);
                setTableData(body.tableData || []);
            })
            .catch(() => { setChartData([]); setTableData([]); })
            .finally(() => setLoading(false));
    };

    /* ── autocomplete suggestions ── */
    const filtered = suggestions.filter(s =>
        inputValue && s.toLowerCase().includes(inputValue.toLowerCase()) && !selectedKeywords.includes(s)
    );

    /* ── top trending (mock growth if backend not wired) ── */
    const topTrending = trendingKeywords.length
        ? trendingKeywords.slice(0, 6).map((kw, i) => ({
            id: kw.id,
            name: kw.text,
            change: [42, 28, 15, -12, 8, 33][i] ?? 5,
        }))
        : [
            { id: 1, name: 'Quantum Cryptography', change: 42 },
            { id: 2, name: 'Bioinformatics', change: 28 },
            { id: 3, name: 'Edge Computing', change: 15 },
            { id: 4, name: 'NFT Architecture', change: -12 },
        ];

    return (
        <div className="ta-page">
            {/* ── Scoped CSS ── */}
            <style>{`
                .ta-page {
                    padding: var(--gutter);
                    background: var(--color-background);
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .ta-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                }
                .ta-card-inner { padding: 24px; }
                /* filter */
                .ta-filter-row {
                    display: flex;
                    align-items: flex-end;
                    gap: 16px;
                    flex-wrap: wrap;
                    padding: 20px 24px 16px;
                }
                .ta-field-label {
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: var(--color-on-surface-variant);
                    font-family: var(--font-ui);
                    margin-bottom: 6px;
                }
                .ta-input-group {
                    display: flex;
                    flex: 1;
                    min-width: 220px;
                    position: relative;
                }
                .ta-input {
                    flex: 1;
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-right: none;
                    border-radius: var(--radius-lg) 0 0 var(--radius-lg);
                    padding: 0 14px;
                    font-family: var(--font-body);
                    font-size: var(--fs-body-sm);
                    outline: none;
                    transition: border-color 0.2s;
                    color: var(--color-on-surface);
                    background: var(--color-surface-container-lowest);
                }
                .ta-input::placeholder { color: var(--color-on-surface-variant); }
                .ta-input:focus { border-color: var(--color-primary); }
                .ta-btn-add {
                    height: 40px;
                    padding: 0 20px;
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 700;
                    border-radius: 0 var(--radius-lg) var(--radius-lg) 0;
                    cursor: pointer;
                    border: 1.5px solid var(--color-primary);
                    transition: opacity 0.2s;
                    white-space: nowrap;
                }
                .ta-btn-add:hover { opacity: 0.85; }
                .ta-suggest {
                    position: absolute;
                    top: 44px; left: 0;
                    right: 0;
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.10);
                    z-index: 200;
                    max-height: 200px;
                    overflow-y: auto;
                }
                .ta-suggest-item {
                    padding: 9px 14px;
                    font-size: var(--fs-body-sm);
                    cursor: pointer;
                    color: var(--color-on-surface);
                    transition: background 0.15s;
                }
                .ta-suggest-item:hover { background: var(--color-surface-container-low); }
                .ta-year-group {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .ta-year-input {
                    width: 72px;
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 10px;
                    font-family: var(--font-data);
                    font-size: var(--fs-body-sm);
                    text-align: center;
                    outline: none;
                    color: var(--color-on-surface);
                    background: var(--color-surface-container-lowest);
                    transition: border-color 0.2s;
                    -moz-appearance: textfield;
                }
                .ta-year-input::-webkit-inner-spin-button,
                .ta-year-input::-webkit-outer-spin-button { -webkit-appearance: none; }
                .ta-year-input:focus { border-color: var(--color-primary); }
                .ta-year-sep {
                    font-size: var(--fs-ui-label);
                    color: var(--color-on-surface-variant);
                    font-weight: 600;
                }
                .ta-btn-analyze {
                    height: 40px;
                    padding: 0 22px;
                    background: var(--color-secondary);
                    color: #fff;
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 700;
                    border-radius: var(--radius-lg);
                    cursor: pointer;
                    border: none;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: opacity 0.2s, transform 0.1s;
                    white-space: nowrap;
                }
                .ta-btn-analyze:hover:not(:disabled) { opacity: 0.88; }
                .ta-btn-analyze:active:not(:disabled) { transform: scale(0.97); }
                .ta-btn-analyze:disabled { opacity: 0.45; cursor: not-allowed; }
                /* tags */
                .ta-tags-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    padding: 0 24px 20px;
                }
                .ta-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 5px 12px;
                    border-radius: var(--radius-md);
                    font-size: 13px;
                    font-weight: 600;
                    font-family: var(--font-ui);
                    border: 1.5px solid;
                }
                .ta-tag-close {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px; height: 16px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1;
                    transition: background 0.15s;
                }
                /* mid grid */
                .ta-mid-grid {
                    display: grid;
                    grid-template-columns: 1fr 280px;
                    gap: 20px;
                    align-items: start;
                }
                @media (max-width: 920px) {
                    .ta-mid-grid { grid-template-columns: 1fr; }
                }
                /* chart */
                .ta-chart-title {
                    font-family: var(--font-display);
                    font-size: 21px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin: 0 0 4px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .ta-legend-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 12px;
                    font-weight: 600;
                    font-family: var(--font-ui);
                    color: var(--color-on-surface-variant);
                }
                .ta-legend-dot {
                    width: 8px; height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                }
                .ta-chart-sub {
                    font-size: var(--fs-ui-label);
                    color: var(--color-on-surface-variant);
                    margin-bottom: 20px;
                    font-family: var(--font-ui);
                }
                .ta-chart-empty {
                    height: 320px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-on-surface-variant);
                    font-size: var(--fs-body-sm);
                    flex-direction: column;
                    gap: 10px;
                }
                /* top trending */
                .ta-trending-title {
                    font-family: var(--font-display);
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin: 0 0 14px 0;
                }
                .ta-trending-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 6px;
                    border-bottom: 1px solid var(--color-surface-container);
                    cursor: pointer;
                    border-radius: var(--radius);
                    transition: background 0.15s, padding-left 0.15s;
                }
                .ta-trending-item:last-of-type { border-bottom: none; }
                .ta-trending-item:hover { background: var(--color-surface-container-low); padding-left: 10px; }
                .ta-trending-rank {
                    font-family: var(--font-data);
                    font-size: 11px;
                    color: var(--color-on-surface-variant);
                    width: 22px;
                    flex-shrink: 0;
                }
                .ta-trending-name {
                    flex: 1;
                    font-weight: 700;
                    font-size: 13.5px;
                    color: var(--color-on-surface);
                    font-family: var(--font-body);
                }
                .ta-view-lb {
                    display: block;
                    text-align: center;
                    margin-top: 14px;
                    font-size: var(--fs-ui-label);
                    font-weight: 600;
                    color: var(--color-on-surface-variant);
                    cursor: pointer;
                    padding: 10px;
                    border-top: 1px solid var(--color-outline-variant);
                    font-family: var(--font-ui);
                    transition: color 0.15s;
                }
                .ta-view-lb:hover { color: var(--color-secondary); }
                /* bottom grid */
                .ta-bot-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.6fr;
                    gap: 20px;
                    align-items: start;
                }
                @media (max-width: 920px) {
                    .ta-bot-grid { grid-template-columns: 1fr; }
                }
                .ta-section-title {
                    font-family: var(--font-display);
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    margin: 0 0 16px 0;
                }
                /* stats table */
                .ta-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: var(--font-body);
                }
                .ta-table thead th {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    color: var(--color-on-surface-variant);
                    text-transform: uppercase;
                    padding: 8px 12px;
                    text-align: left;
                    border-bottom: 1px solid var(--color-outline-variant);
                }
                .ta-table tbody tr { transition: background 0.15s; }
                .ta-table tbody tr:hover { background: var(--color-surface-container-low); }
                .ta-table tbody td {
                    padding: 11px 12px;
                    font-size: var(--fs-body-sm);
                    color: var(--color-on-surface);
                    border-bottom: 1px solid var(--color-surface-container);
                }
                .ta-table tbody tr:last-child td { border-bottom: none; }
                .ta-table td.num {
                    font-family: var(--font-data);
                    font-size: 13px;
                    color: var(--color-on-surface-variant);
                    text-align: right;
                }
                /* spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .ta-spinner {
                    width: 30px; height: 30px;
                    border: 3px solid var(--color-outline-variant);
                    border-top-color: var(--color-secondary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes wc-fade {
                    from { opacity: 0; transform: scale(0.72); }
                    to   { opacity: 1; transform: scale(1); }
                }
            `}</style>

            {/* ══════════════════════════
                TOP — Filter Card
            ══════════════════════════ */}
            <div className="ta-card">
                <div className="ta-filter-row">
                    {/* Keyword input */}
                    <div style={{ flex: 1, minWidth: 220 }}>
                        <p className="ta-field-label">Keywords to Analyze</p>
                        <div className="ta-input-group">
                            <input
                                className="ta-input"
                                placeholder="Enter topic (e.g. Quantum Computing)"
                                value={inputValue}
                                onChange={e => { setInputValue(e.target.value); setShowSuggest(true); }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') addKeyword();
                                    if (e.key === 'Escape') setShowSuggest(false);
                                }}
                                onFocus={() => setShowSuggest(true)}
                                onBlur={() => setTimeout(() => setShowSuggest(false), 160)}
                            />
                            <button className="ta-btn-add" onClick={() => addKeyword()}>Add</button>
                            {showSuggest && filtered.length > 0 && (
                                <div className="ta-suggest">
                                    {filtered.slice(0, 8).map(s => (
                                        <div key={s} className="ta-suggest-item" onMouseDown={() => addKeyword(s)}>{s}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Year range */}
                    <div>
                        <p className="ta-field-label">Year Range</p>
                        <div className="ta-year-group">
                            <input
                                type="number"
                                className="ta-year-input"
                                value={yearFrom}
                                min={2000} max={yearTo}
                                onChange={e => setYearFrom(+e.target.value)}
                            />
                            <span className="ta-year-sep">to</span>
                            <input
                                type="number"
                                className="ta-year-input"
                                value={yearTo}
                                min={yearFrom} max={2025}
                                onChange={e => setYearTo(+e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Analyze button */}
                    <div>
                        <button
                            className="ta-btn-analyze"
                            onClick={() => handleAnalyze()}
                            disabled={loading || selectedKeywords.length === 0}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bar_chart</span>
                            Analyze
                        </button>
                    </div>
                </div>

                {/* Keyword tag chips */}
                {selectedKeywords.length > 0 && (
                    <div className="ta-tags-row">
                        {selectedKeywords.map((kw, i) => {
                            const col = DARK_COLORS[i % DARK_COLORS.length];
                            return (
                                <span key={kw} className="ta-tag" style={{ borderColor: col, color: col, background: col + '14' }}>
                                    {kw}
                                    <span
                                        className="ta-tag-close"
                                        style={{ color: col, background: col + '22' }}
                                        onClick={() => removeKeyword(kw)}
                                        title={`Remove ${kw}`}
                                    >×</span>
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ══════════════════════════
                MIDDLE — Chart + Trending
            ══════════════════════════ */}
            <div className="ta-mid-grid">
                {/* Keyword Growth Comparison */}
                <div className="ta-card ta-card-inner">
                    <h2 className="ta-chart-title">
                        Keyword Growth Comparison
                        {selectedKeywords.map((kw, i) => (
                            <span key={kw} className="ta-legend-pill">
                                <span className="ta-legend-dot" style={{ background: DARK_COLORS[i % DARK_COLORS.length] }} />
                                {kw}
                            </span>
                        ))}
                    </h2>
                    <p className="ta-chart-sub">Publication volume across selected domains ({yearFrom}–{yearTo})</p>

                    {loading ? (
                        <div className="ta-chart-empty">
                            <div className="ta-spinner" />
                            <span>Loading chart data…</span>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="ta-chart-empty">
                            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--color-outline-variant)' }}>show_chart</span>
                            <span>Click "Analyze" to generate the chart</span>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 340 }}>
                            <ResponsiveContainer>
                                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="year"
                                        tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: '#9ca3af', fontSize: 12, fontFamily: 'JetBrains Mono, monospace' }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={42}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    {selectedKeywords.map((kw, i) => {
                                        const color = DARK_COLORS[i % DARK_COLORS.length];
                                        const isDashed = i >= DARK_COLORS.length;
                                        return (
                                            <Line
                                                key={kw}
                                                type="monotone"
                                                dataKey={kw}
                                                name={kw}
                                                stroke={color}
                                                strokeDasharray={isDashed ? "5 5" : undefined}
                                                strokeWidth={2.5}
                                                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: color }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                                animationDuration={1200}
                                            />
                                        );
                                    })}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Top Trending */}
                <div className="ta-card ta-card-inner">
                    <h2 className="ta-trending-title">Top Trending</h2>
                    {topTrending.map((item, i) => (
                        <div
                            key={item.name}
                            className="ta-trending-item"
                            onClick={() => addKeyword(item.name)}
                            title={`Add "${item.name}" to analysis`}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                                <span className="ta-trending-rank">{String(i + 1).padStart(2, "0")}</span>
                                <span className="ta-trending-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <GrowthBadge rate={item.change} />
                                {item.id && (
                                    <button
                                        onClick={(e) => handleFollowKeywordToggle(e, item.name, item.id)}
                                        style={{
                                            background: "transparent",
                                            border: "none",
                                            color: followedKeywords.some(f => f.targetName === item.name) ? "var(--color-secondary)" : "var(--color-outline)",
                                            cursor: "pointer",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            padding: "4px",
                                            borderRadius: "4px",
                                            transition: "all 0.2s"
                                        }}
                                        title={followedKeywords.some(f => f.targetName === item.name) ? "Unfollow keyword" : "Follow keyword"}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
                                            {followedKeywords.some(f => f.targetName === item.name) ? "check_circle" : "add_circle"}
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    <span className="ta-view-lb" onClick={() => navigate('/topics')}>View Full Leaderboard</span>
                </div>
            </div>

            {/* ══════════════════════════
                BOTTOM — Cloud + Stats
            ══════════════════════════ */}
            <div className="ta-bot-grid">
                {/* Semantic Cloud */}
                <div className="ta-card ta-card-inner">
                    <h2 className="ta-section-title">Semantic Cloud</h2>
                    <SemanticCloud data={trendingKeywords.slice(0, 10)} loading={loadingCloud} />
                </div>

                {/* Detailed Statistics */}
                <div className="ta-card ta-card-inner">
                    <h2 className="ta-section-title">Detailed Statistics</h2>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <div className="ta-spinner" />
                        </div>
                    ) : tableData.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-on-surface-variant)', padding: 40, fontSize: 14, fontFamily: 'var(--font-body)' }}>
                            No data — click "Analyze" to load statistics
                        </div>
                    ) : (
                        <table className="ta-table">
                            <thead>
                                <tr>
                                    <th>Keyword</th>
                                    <th style={{ textAlign: 'right' }}>Total Papers</th>
                                    <th style={{ textAlign: 'right' }}>This Year</th>
                                    <th style={{ textAlign: 'right' }}>Last Year</th>
                                    <th style={{ textAlign: 'right' }}>Growth Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.map((row) => (
                                    <tr key={row.keyword}>
                                        <td style={{ fontWeight: 700 }}>{row.keyword}</td>
                                        <td className="num">{row.totalPapers?.toLocaleString()}</td>
                                        <td className="num">{row.thisYear?.toLocaleString()}</td>
                                        <td className="num">{row.lastYear?.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right' }}><GrowthBadge rate={row.growthRate} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TrendAnalysis;
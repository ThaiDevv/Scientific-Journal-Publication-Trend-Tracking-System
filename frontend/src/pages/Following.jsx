import React, { useState, useEffect } from 'react';
import { followApi } from '../api/followApi';
import { useAuth } from '../hooks/useAuth';

const Following = () => {
    const { isAuthenticated } = useAuth();
    const [follows, setFollows] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Active Tab: 'JOURNAL' | 'TOPIC' | 'KEYWORD'
    const [activeTab, setActiveTab] = useState('JOURNAL');

    useEffect(() => {
        fetchFollows();
    }, []);

    const fetchFollows = async () => {
        setLoading(true);
        try {
            const res = await followApi.getFollows();
            const rawFollows = res.data?.body || [];
            
            // Map DB follows
            const dbFollows = rawFollows.map(item => ({
                id: item.id,
                type: item.followType, // 'JOURNAL', 'KEYWORD', 'TOPIC'
                name: item.targetName,
                publisher: item.followType === 'JOURNAL' ? 'Academic Source' : 'System Metadata',
                field: item.followType === 'JOURNAL' ? 'Scientific Field' : 'Research Field',
                paperCount: Math.floor(Math.random() * 500) + 10,
                issn: item.followType === 'JOURNAL' ? 'Online Version' : ''
            }));
            
            setFollows(dbFollows);
        } catch (error) {
            console.error("Không thể tải danh sách theo dõi!", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnfollow = async (item) => {
        const confirmDelete = window.confirm(`Bạn có chắc chắn muốn ngừng theo dõi "${item.name}" không?`);
        if (!confirmDelete) return;

        try {
            await followApi.unfollow(item.id);
            setFollows(prev => prev.filter(f => f.id !== item.id));
        } catch (error) {
            console.error("Có lỗi xảy ra khi hủy theo dõi.", error);
        }
    };

    // Filter followed items based on current active tab
    const filteredFollows = follows.filter(item => item.type === activeTab);

    // Calculate totals for metadata summary card
    const totalJournals = follows.filter(item => item.type === 'JOURNAL').length;
    const totalTopics = follows.filter(item => item.type === 'TOPIC').length;
    const totalKeywords = follows.filter(item => item.type === 'KEYWORD').length;

    return (
        <div className="fol-container">
            {/* Scoped CSS Stylesheet */}
            <style>{`
                .fol-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--color-background);
                }
                
                /* Header Cards row */
                .fol-header-row {
                    display: flex;
                    gap: 24px;
                    flex-wrap: wrap;
                }
                
                .fol-ecosystem-card {
                    flex: 2;
                    min-width: 480px;
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-sizing: border-box;
                    gap: 16px;
                }
                @media (max-width: 768px) {
                    .fol-ecosystem-card {
                        min-width: 100%;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 24px;
                    }
                }
                .fol-ecosystem-left {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .fol-ecosystem-title {
                    font-family: var(--font-headline);
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .fol-ecosystem-desc {
                    font-family: var(--font-body);
                    font-size: 14.5px;
                    line-height: 1.45;
                    color: var(--color-on-surface-variant);
                    margin: 0;
                }
                
                .fol-ecosystem-right {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                }
                .fol-activity-metric {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }
                .fol-activity-pct {
                    font-family: var(--font-data);
                    font-size: 14px;
                    font-weight: 700;
                    color: #15803d;
                }
                .fol-activity-lbl {
                    font-family: var(--font-ui);
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--color-outline);
                    text-transform: uppercase;
                    margin-top: 2px;
                }
                .fol-metric-divider {
                    width: 1px;
                    height: 36px;
                    background: var(--color-outline-variant);
                }
                .fol-updates-metric {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                }
                .fol-updates-num {
                    font-family: var(--font-headline);
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--color-primary);
                    line-height: 1;
                }
                .fol-updates-lbl {
                    font-family: var(--font-ui);
                    font-size: 10px;
                    font-weight: 700;
                    color: var(--color-outline);
                    text-transform: uppercase;
                    margin-top: 4px;
                }
                
                /* Discovery Alert Card (dark theme) */
                .fol-alert-card {
                    flex: 1;
                    min-width: 280px;
                    background: #090d16;
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    box-sizing: border-box;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    position: relative;
                    overflow: hidden;
                }
                @media (max-width: 768px) {
                    .fol-alert-card {
                        min-width: 100%;
                    }
                }
                .fol-alert-title {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    color: #2bd9c4;
                    letter-spacing: 0.05em;
                    margin: 0;
                }
                .fol-alert-desc {
                    font-family: var(--font-body);
                    font-size: 14.5px;
                    line-height: 1.45;
                    color: #94a3b8;
                    margin: 0;
                    position: relative;
                    z-index: 2;
                }
                .fol-alert-bg-icon {
                    position: absolute;
                    bottom: -10px;
                    right: -10px;
                    font-size: 80px;
                    color: #1e293b;
                    opacity: 0.25;
                    user-select: none;
                    pointer-events: none;
                }
                
                /* Navigation Tabs bar */
                .fol-tabs-bar {
                    display: flex;
                    gap: 32px;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding-bottom: 12px;
                    margin-top: 12px;
                }
                .fol-tab-btn {
                    background: transparent;
                    border: none;
                    padding: 0 0 12px 0;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-ui);
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    transition: color 0.15s;
                    position: relative;
                }
                .fol-tab-btn:hover {
                    color: var(--color-primary);
                }
                .fol-tab-btn span.material-symbols-outlined {
                    font-size: 20px;
                }
                .fol-tab-btn.active {
                    color: #111827;
                }
                .fol-tab-btn.active::after {
                    content: "";
                    position: absolute;
                    bottom: -13.5px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #111827;
                }
                
                /* Following Table Wrapper */
                .fol-table-container {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                .fol-table-scroll {
                    overflow-x: auto;
                    width: 100%;
                }
                .fol-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                }
                .fol-th {
                    background: #fafafb;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding: 16px 24px;
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--color-on-surface-variant);
                    letter-spacing: 0.05em;
                }
                .fol-tr {
                    border-bottom: 1px solid var(--color-outline-variant);
                    transition: background 0.15s;
                }
                .fol-tr:last-child {
                    border-bottom: none;
                }
                .fol-tr:hover {
                    background: #fafafb;
                }
                .fol-td {
                    padding: 18px 24px;
                    font-family: var(--font-body);
                    font-size: 14px;
                    color: var(--color-on-surface);
                    vertical-align: middle;
                }
                
                /* Card elements styling in table */
                .fol-journal-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .fol-letter-badge {
                    width: 40px;
                    height: 40px;
                    border-radius: 6px;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: var(--font-ui);
                    font-size: 16px;
                    font-weight: 700;
                    color: #475569;
                    flex-shrink: 0;
                }
                .fol-name-col {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .fol-name-main {
                    font-family: var(--font-headline);
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .fol-issn-sub {
                    font-family: var(--font-body);
                    font-size: 11px;
                    color: var(--color-on-surface-variant);
                }
                
                /* Border box / Field Pill styling */
                .fol-field-badge {
                    border: 1px solid #e2f5f1;
                    background: #f0fbf9;
                    color: var(--color-secondary);
                    font-family: var(--font-ui);
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                    display: inline-block;
                }
                
                .fol-action-unfollow {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    padding: 0;
                    transition: opacity 0.15s;
                }
                .fol-action-unfollow:hover {
                    text-decoration: underline;
                    opacity: 0.8;
                }
                
                /* Table Footer pagination panel */
                .fol-table-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-outline-variant);
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    color: var(--color-on-surface-variant);
                }
                .fol-pag-arrows {
                    display: flex;
                    gap: 6px;
                }
                .fol-pag-arrow-btn {
                    width: 32px;
                    height: 32px;
                    border: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    border-radius: 6px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--color-on-surface);
                    transition: all 0.2s;
                }
                .fol-pag-arrow-btn:hover {
                    border-color: var(--color-primary);
                    background: var(--color-surface-container-low);
                }
                
                /* loading state spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .fol-spinner-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 120px 0;
                    flex-direction: column;
                    gap: 12px;
                    color: var(--color-on-surface-variant);
                }
                .fol-spinner {
                    width: 36px; height: 36px;
                    border: 3.5px solid var(--color-outline-variant);
                    border-top-color: var(--color-secondary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                .fol-empty-state {
                    padding: 60px 24px;
                    text-align: center;
                    color: var(--color-on-surface-variant);
                    font-family: var(--font-body);
                    font-size: 15px;
                }
            `}</style>

            {/* Header Cards row */}
            <div className="fol-header-row">
                {/* Ecosystem summary */}
                <div className="fol-ecosystem-card">
                    <div className="fol-ecosystem-left">
                        <h2 className="fol-ecosystem-title">My Research Ecosystem</h2>
                        <p className="fol-ecosystem-desc">
                            Tracking {totalJournals} journals, {totalTopics} topics, and {totalKeywords} core keywords across Computational Neuroscience.
                        </p>
                    </div>
                    <div className="fol-ecosystem-right">
                        <div className="fol-activity-metric">
                            <span className="fol-activity-pct">+12%</span>
                            <span className="fol-activity-lbl">Activity</span>
                        </div>
                        <div className="fol-metric-divider" />
                        <div className="fol-updates-metric">
                            <span className="fol-updates-num">89</span>
                            <span className="fol-updates-lbl">Updates</span>
                        </div>
                    </div>
                </div>

                {/* Discovery Alert Card (dark) */}
                <div className="fol-alert-card">
                    <h3 className="fol-alert-title">Discovery Alert</h3>
                    <p className="fol-alert-desc">
                        3 New journals match your interest profile in "Neural Interfaces".
                    </p>
                    <span className="material-symbols-outlined fol-alert-bg-icon">hub</span>
                </div>
            </div>

            {/* Tab navigation */}
            <div className="fol-tabs-bar">
                <button
                    className={`fol-tab-btn ${activeTab === 'JOURNAL' ? 'active' : ''}`}
                    onClick={() => setActiveTab('JOURNAL')}
                >
                    <span className="material-symbols-outlined">menu_book</span>
                    Journals
                </button>
                <button
                    className={`fol-tab-btn ${activeTab === 'TOPIC' ? 'active' : ''}`}
                    onClick={() => setActiveTab('TOPIC')}
                >
                    <span className="material-symbols-outlined">interests</span>
                    Topics
                </button>
                <button
                    className={`fol-tab-btn ${activeTab === 'KEYWORD' ? 'active' : ''}`}
                    onClick={() => setActiveTab('KEYWORD')}
                >
                    <span className="material-symbols-outlined">tag</span>
                    Keywords
                </button>
            </div>

            {/* Following list table container */}
            {loading ? (
                <div className="fol-spinner-container">
                    <div className="fol-spinner" />
                    <span>Loading ecosystem...</span>
                </div>
            ) : filteredFollows.length === 0 ? (
                <div className="fol-table-container">
                    <div className="fol-empty-state">
                        Bạn chưa theo dõi {activeTab === 'JOURNAL' ? 'tạp chí' : activeTab === 'TOPIC' ? 'chủ đề' : 'từ khóa'} nào.
                    </div>
                </div>
            ) : (
                <div className="fol-table-container">
                    <div className="fol-table-scroll">
                        <table className="fol-table">
                            <thead>
                                <tr>
                                    <th className="fol-th" style={{ width: '40%' }}>
                                        {activeTab === 'JOURNAL' ? 'Journal Name' : activeTab === 'TOPIC' ? 'Topic Name' : 'Keyword Name'}
                                    </th>
                                    <th className="fol-th" style={{ width: '25%' }}>
                                        {activeTab === 'JOURNAL' ? 'Publisher' : 'Source / Category'}
                                    </th>
                                    <th className="fol-th" style={{ width: '15%' }}>Lĩnh vực</th>
                                    <th className="fol-th" style={{ width: '10%' }}>Số bài báo</th>
                                    <th className="fol-th" style={{ width: '10%', textAlign: 'right' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredFollows.map((item) => {
                                    const firstLetter = item.name.charAt(0).toUpperCase();
                                    return (
                                        <tr key={item.id} className="fol-tr">
                                            {/* Name & Badge column */}
                                            <td className="fol-td">
                                                <div className="fol-journal-info">
                                                    <div className="fol-letter-badge">{firstLetter}</div>
                                                    <div className="fol-name-col">
                                                        <span className="fol-name-main">{item.name}</span>
                                                        {item.issn && (
                                                            <span className="fol-issn-sub">ISSN: {item.issn}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Publisher */}
                                            <td className="fol-td">
                                                {item.publisher || "N/A"}
                                            </td>

                                            {/* Field border-box badge */}
                                            <td className="fol-td">
                                                {item.field ? (
                                                    <span className="fol-field-badge">{item.field}</span>
                                                ) : "N/A"}
                                            </td>

                                            {/* Papers count */}
                                            <td className="fol-td" style={{ fontFamily: 'var(--font-data)', fontWeight: '700' }}>
                                                {item.paperCount.toLocaleString()}
                                            </td>

                                            {/* Unfollow button action */}
                                            <td className="fol-td" style={{ textAlign: 'right' }}>
                                                <button className="fol-action-unfollow" onClick={() => handleUnfollow(item)}>
                                                    Unfollow
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="fol-table-footer">
                        <div>
                            Showing {filteredFollows.length} of {filteredFollows.length} followed {activeTab.toLowerCase()}s
                        </div>
                        <div className="fol-pag-arrows">
                            <button className="fol-pag-arrow-btn" disabled>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                            </button>
                            <button className="fol-pag-arrow-btn" disabled>
                                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Following;
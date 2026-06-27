import React, { useState, useEffect } from 'react';
import { topicApi } from '../api/topicApi';
import { useAuth } from '../hooks/useAuth';
import { followApi } from '../api/followApi';

const TopicExplorer = () => {
    const { isAuthenticated } = useAuth();
    const [topics, setTopics] = useState([]);
    const [filteredTopics, setFilteredTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isTrendingOnly, setIsTrendingOnly] = useState(false);

    // Detail Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null);

    // Follow states
    const [followMap, setFollowMap] = useState({});

    useEffect(() => {
        fetchTopics();
        if (isAuthenticated) {
            fetchFollows();
        }
    }, [isAuthenticated]);

    const fetchFollows = async () => {
        try {
            const res = await followApi.getFollows();
            const list = res.data?.body || [];
            const map = {};
            list.forEach(item => {
                if (item.followType === 'TOPIC') {
                    map[item.targetId] = item.id;
                }
            });
            setFollowMap(map);
        } catch (error) {
            console.error("Failed to load follow status:", error);
        }
    };

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const res = await topicApi.getTopics();
            const content = res.data?.content || [];

            const dbTopics = content.map(topic => {
                const isTrending = topic.isTrending !== undefined ? topic.isTrending : topic.trending;
                return {
                    id: topic.id,
                    title: topic.name,
                    description: topic.description || `Exploration of emerging trends in the field of "${topic.name}".`,
                    isTrending: !!isTrending,
                    keywords: [topic.name], // Fallback keyword is the topic name itself
                    usageCountText: isTrending ? "Active Trend" : "Standard Topic",
                    usageCount: 0,
                    isDefault: false
                };
            });

            setTopics(dbTopics);
            setFilteredTopics(dbTopics);
        } catch (error) {
            console.error("Failed to load topics list!", error);
            setTopics([]);
            setFilteredTopics([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    useEffect(() => {
        let result = topics;
        if (searchText) {
            result = result.filter(t => t.title.toLowerCase().includes(searchText.toLowerCase()) ||
                t.description.toLowerCase().includes(searchText.toLowerCase()));
        }
        if (isTrendingOnly) {
            result = result.filter(t => t.isTrending);
        }
        setFilteredTopics(result);
    }, [searchText, isTrendingOnly, topics]);

    const showDetail = async (topic) => {
        try {
            const res = await topicApi.getTopicById(topic.id);
            const detail = res.data || {};
            const isTrending = detail.isTrending !== undefined ? detail.isTrending : detail.trending;
            setSelectedTopic({
                ...topic,
                description: detail.description || topic.description,
                isTrending: !!isTrending,
                keywords: (detail.keywords || []).map(k => k.name),
                usageCount: detail.trendData ? detail.trendData.reduce((acc, t) => acc + t.paperCount, 0) : 0
            });
        } catch (error) {
            console.error("Failed to load topic details:", error);
            setSelectedTopic({
                ...topic,
                keywords: [topic.title],
                usageCount: 0
            });
        }
        setIsModalOpen(true);
    };

    const toggleFollow = async (topic) => {
        if (!isAuthenticated) {
            alert("Please login to perform this action!");
            return;
        }

        const isFollowing = !!followMap[topic.id];
        try {
            if (isFollowing) {
                const followId = followMap[topic.id];
                await followApi.unfollow(followId);
                setFollowMap(prev => {
                    const copy = { ...prev };
                    delete copy[topic.id];
                    return copy;
                });
            } else {
                const res = await followApi.followTopic(topic.id);
                const followObj = res.data?.body;
                if (followObj) {
                    setFollowMap(prev => ({
                        ...prev,
                        [topic.id]: followObj.id
                    }));
                }
            }
        } catch (error) {
            console.error("Action failed!", error);
        }
    };

    return (
        <div className="te-container">
            {/* Scoped CSS Stylesheet */}
            <style>{`
                .te-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--color-background);
                }
                
                /* Filter Bar Row */
                .te-filter-row {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                
                .te-search-wrapper {
                    flex: 1;
                    min-width: 320px;
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .te-search-icon {
                    position: absolute;
                    left: 12px;
                    color: var(--color-on-surface-variant);
                    font-size: 20px;
                }
                .te-input {
                    width: 100%;
                    height: 44px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 16px 0 44px;
                    font-family: var(--font-body);
                    font-size: var(--fs-body-sm);
                    outline: none;
                    background: #fff;
                    color: var(--color-on-surface);
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                .te-input:focus {
                    border-color: var(--color-primary);
                }
                
                .te-toggle-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 16px;
                    height: 44px;
                    background: #fff;
                    box-sizing: border-box;
                }
                .te-toggle-label {
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 600;
                    color: var(--color-on-surface);
                }
                
                /* Custom CSS Switch Toggle */
                .te-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 24px;
                    cursor: pointer;
                }
                .te-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .te-slider {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e1;
                    transition: .3s;
                    border-radius: 24px;
                }
                .te-slider:before {
                    position: absolute;
                    content: "";
                    height: 18px; width: 18px;
                    left: 3px; bottom: 3px;
                    background-color: white;
                    transition: .3s;
                    border-radius: 50%;
                }
                .te-switch input:checked + .te-slider {
                    background-color: var(--color-secondary);
                }
                .te-switch input:checked + .te-slider:before {
                    transform: translateX(20px);
                }
                
                /* Grid of Cards */
                .te-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
                    gap: 24px;
                }
                @media (max-width: 420px) {
                    .te-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                .te-card {
                    background: #fff;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    min-height: 290px;
                    box-sizing: border-box;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .te-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -10px rgba(15, 118, 110, 0.15);
                    border-color: #0f766e;
                }
                
                .te-card-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    min-height: 24px;
                }
                .te-trending-badge {
                    background: linear-gradient(135deg, #111827 0%, #0f766e 100%);
                    color: #fff;
                    font-family: var(--font-data);
                    font-size: 10px;
                    font-weight: 800;
                    padding: 3px 10px;
                    border-radius: 9999px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    box-shadow: 0 4px 10px rgba(15, 118, 110, 0.2);
                }
                .te-trending-badge span { font-size: 13px; }
                .te-papers-count {
                    font-family: var(--font-data);
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    text-transform: uppercase;
                }
                
                .te-card-title {
                    font-family: var(--font-headline);
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 14px 0 0 0;
                    line-height: 1.3;
                }
                .te-card-desc {
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    line-height: 1.45;
                    color: var(--color-on-surface-variant);
                    margin: 10px 0 0 0;
                    flex-grow: 1;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .te-card-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 14px;
                }
                .te-tag-pill {
                    background: #f0fdfa;
                    color: #0f766e;
                    border: 1.5px dashed #ccfbf1;
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 6px;
                    transition: all 0.2s;
                }
                .te-tag-pill:hover {
                    background: #ccfbf1;
                    border-color: #0f766e;
                }
                
                .te-divider {
                    height: 1px;
                    background: var(--color-outline-variant);
                    margin: 20px 0 16px 0;
                    border: none;
                }
                
                .te-card-bottom {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .te-detail-link {
                    color: #475569;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    padding: 0;
                    border-bottom: 2px solid transparent;
                    transition: all 0.2s;
                }
                .te-detail-link:hover {
                    color: #0f766e;
                    border-bottom-color: #0f766e;
                }
                
                /* Follow buttons */
                .te-btn-follow {
                    height: 34px;
                    padding: 0 16px;
                    background: transparent;
                    color: #0f766e;
                    border: 1.5px solid #0f766e;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .te-btn-follow:hover {
                    background: #f0fdfa;
                    color: #0d6059;
                    border-color: #0d6059;
                }
                .te-btn-followed {
                    height: 34px;
                    padding: 0 16px;
                    background: #0f766e;
                    color: #fff;
                    border: 1.5px solid #0f766e;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .te-btn-followed:hover {
                    background: #0d6059;
                    border-color: #0d6059;
                }
                
                /* Modal Overlay & Card Details popup */
                .te-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .te-modal-content {
                    background: #fff;
                    border-radius: var(--radius-xl);
                    width: 90%;
                    max-width: 580px;
                    padding: 24px;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    animation: teFadeIn 0.2s ease-out;
                    box-sizing: border-box;
                }
                @keyframes teFadeIn {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .te-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--color-outline-variant);
                    padding-bottom: 12px;
                    margin-bottom: 16px;
                }
                .te-modal-header h3 {
                    font-family: var(--font-headline);
                    font-size: 20px;
                    margin: 0;
                    color: var(--color-primary);
                }
                .te-modal-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--color-on-surface-variant);
                    display: flex;
                    align-items: center;
                }
                .te-modal-section {
                    margin-bottom: 16px;
                }
                .te-modal-section h4 {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: var(--color-on-surface-variant);
                    margin: 0 0 6px 0;
                    letter-spacing: 0.05em;
                }
                .te-modal-section p {
                    font-family: var(--font-body);
                    font-size: 14.5px;
                    line-height: 1.5;
                    color: var(--color-on-surface);
                    margin: 0;
                }
                .te-modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    border-top: 1px solid var(--color-outline-variant);
                    padding-top: 12px;
                    margin-top: 20px;
                }
                .te-btn-close {
                    height: 38px;
                    padding: 0 20px;
                    background: var(--color-primary);
                    color: #fff;
                    border: none;
                    border-radius: var(--radius-lg);
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 700;
                    cursor: pointer;
                }
            `}</style>

            {/* Filter Bar Row */}
            <div className="te-filter-row">
                {/* Search */}
                <div className="te-search-wrapper">
                    <span className="material-symbols-outlined te-search-icon">search</span>
                    <input
                        type="text"
                        className="te-input"
                        placeholder="Filter by research field, methodology, or specific keyword"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>

                {/* Trending only toggle switch */}
                <div className="te-toggle-card">
                    <span className="te-toggle-label">Trending only</span>
                    <label className="te-switch">
                        <input
                            type="checkbox"
                            checked={isTrendingOnly}
                            onChange={(e) => setIsTrendingOnly(e.target.checked)}
                        />
                        <span className="te-slider" />
                    </label>
                </div>


            </div>

            {/* Grid list of topics */}
            <div className="te-grid">
                {filteredTopics.map((topic) => {
                    const isFollowed = !!followMap[topic.id];

                    return (
                        <div key={topic.id} className="te-card">
                            <div className="te-card-top">
                                <div>
                                    {topic.isTrending && (
                                        <span className="te-trending-badge">
                                            <span className="material-symbols-outlined">trending_up</span>
                                            Trending
                                        </span>
                                    )}
                                </div>
                                <span className="te-papers-count">
                                    {topic.usageCountText}
                                </span>
                            </div>

                            <h3 className="te-card-title">{topic.title}</h3>
                            <p className="te-card-desc">{topic.description}</p>

                            <div className="te-card-tags">
                                {topic.keywords.map((kw) => (
                                    <span key={kw} className="te-tag-pill">
                                        {kw}
                                    </span>
                                ))}
                            </div>

                            <hr className="te-divider" />

                            <div className="te-card-bottom">
                                <button className="te-detail-link" onClick={() => showDetail(topic)}>
                                    View Details
                                </button>

                                {isFollowed ? (
                                    <button className="te-btn-followed" onClick={() => toggleFollow(topic)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check</span>
                                        Following
                                    </button>
                                ) : (
                                    <button className="te-btn-follow" onClick={() => toggleFollow(topic)}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                                        Follow
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Detail Info Box */}
            {isModalOpen && selectedTopic && (
                <div className="te-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="te-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="te-modal-header">
                            <h3>{selectedTopic.title}</h3>
                            <button className="te-modal-close" onClick={() => setIsModalOpen(false)}>
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="te-modal-body">
                            <div className="te-modal-section">
                                <h4>Topic Description</h4>
                                <p>{selectedTopic.description}</p>
                            </div>

                            <div className="te-modal-section">
                                <h4>Related Keywords</h4>
                                <div className="te-card-tags">
                                    {selectedTopic.keywords.map((kw) => (
                                        <span key={kw} className="te-tag-pill">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="te-modal-section">
                                <h4>Interest Statistics</h4>
                                <p>There are approximately <strong>{selectedTopic.usageCount.toLocaleString()}</strong> scientific research papers related to this field in the database.</p>
                            </div>
                        </div>
                        <div className="te-modal-footer">
                            <button className="te-btn-close" onClick={() => setIsModalOpen(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TopicExplorer;
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchPapers } from "../api/paperApi";
import { getJournals } from "../api/journalApi";
import {
    addBookmark,
    removeBookmark,
    getMyBookmarks,
} from "../api/bookmarkApi";
import { followApi } from "../api/followApi";

function SearchPapers() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [loading, setLoading] = useState(false);
    const [papers, setPapers] = useState([]);
    const [journals, setJournals] = useState([]);
    const [bookmarkedIds, setBookmarkedIds] = useState([]);
    const [followedJournals, setFollowedJournals] = useState([]);

    // Filters states
    const [keyword, setKeyword] = useState("");
    const [author, setAuthor] = useState("");
    const [journal, setJournal] = useState("");
    const [yearFrom, setYearFrom] = useState("");
    const [yearTo, setYearTo] = useState("");

    // Pagination states
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);
    const [bookmarkCount, setBookmarkCount] = useState(0);

    const loadBookmarkCount = async () => {
        try {
            const res = await getMyBookmarks(0, 1);
            setBookmarkCount(res.data.body.totalElements || 0);
        } catch (e) {
            console.error(e);
        }
    };

    async function loadBookmarks() {
        try {
            const res = await getMyBookmarks(0, 1000);
            const ids = (res.data.body.content || []).map(item => item.id);
            setBookmarkedIds(ids);
        } catch (e) {
            console.error(e);
        }
    }

    async function loadJournals() {
        try {
            const res = await getJournals({ page: 0, size: 100 });
            setJournals(res.data.body.content || []);
        } catch (e) {
            console.error(e);
        }
    }

    const loadFollowedJournals = async () => {
        try {
            const res = await followApi.getFollows();
            const list = res.data?.body || [];
            setFollowedJournals(list.filter(f => f.followType === 'JOURNAL'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleFollowJournalToggle = async (journalName) => {
        const foundJournal = journals.find(j => j.name === journalName);
        if (!foundJournal) return;

        const existingFollow = followedJournals.find(f => f.targetName === journalName);
        try {
            if (existingFollow) {
                await followApi.unfollow(existingFollow.id);
                setFollowedJournals(prev => prev.filter(f => f.id !== existingFollow.id));
            } else {
                const res = await followApi.followJournal(foundJournal.id);
                const followObj = res.data?.body;
                if (followObj) {
                    setFollowedJournals(prev => [...prev, followObj]);
                }
            }
        } catch (e) {
            console.error("Follow journal failed", e);
        }
    };

    async function loadPapers(currentPage = 1, searchKeyword = keyword) {
        try {
            setLoading(true);
            const res = await searchPapers({
                keyword: searchKeyword,
                author,
                journal: journal || undefined,
                yearFrom: yearFrom ? Number(yearFrom) : undefined,
                yearTo: yearTo ? Number(yearTo) : undefined,
                page: currentPage - 1,
                size: pageSize,
                sortBy: "publicationYear",
                sortDir: "desc",
            });
            const body = res.data.body;
            setPapers(body.content || []);
            setTotal(body.totalElements || 0);
        } catch (e) {
            console.error("Failed to load papers", e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const init = async () => {
            const urlKeyword = searchParams.get("keyword") || "";
            if (urlKeyword) {
                setKeyword(urlKeyword);
            }
            await loadBookmarks();
            await loadBookmarkCount();
            await loadJournals();
            await loadFollowedJournals();
            await loadPapers(1, urlKeyword);
        };
        init();
    }, [searchParams]);

    const handleBookmark = async (paperId) => {
        try {
            if (bookmarkedIds.includes(paperId)) {
                await removeBookmark(paperId);
                setBookmarkedIds(prev => prev.filter(id => id !== paperId));
                setBookmarkCount(prev => Math.max(0, prev - 1));
            } else {
                await addBookmark(paperId);
                setBookmarkedIds(prev => [...prev, paperId]);
                setBookmarkCount(prev => prev + 1);
            }
        } catch (e) {
            console.error("Bookmark failed", e);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadPapers(1);
    };

    const handleReset = () => {
        setKeyword("");
        setAuthor("");
        setJournal("");
        setYearFrom("");
        setYearTo("");
        setPage(1);
        setTimeout(() => {
            loadPapers(1, "");
        }, 0);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        loadPapers(newPage);
    };

    // Calculate total pages
    const totalPages = Math.ceil(total / pageSize) || 1;

    // Helper to generate pagination elements
    const getPaginationItems = (current, max) => {
        const items = [];
        if (max <= 5) {
            for (let i = 1; i <= max; i++) items.push(i);
        } else {
            if (current <= 3) {
                items.push(1, 2, 3, 4, '...', max);
            } else if (current >= max - 2) {
                items.push(1, '...', max - 3, max - 2, max - 1, max);
            } else {
                items.push(1, '...', current - 1, current, current + 1, '...', max);
            }
        }
        return items;
    };

    return (
        <div className="sp-container">
            {/* Scoped CSS Stylesheet */}
            <style>{`
                .sp-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                    background: var(--color-background);
                }
                /* Top Header */
                .sp-header-row {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    margin-bottom: 8px;
                }
                .sp-title {
                    font-family: var(--font-headline);
                    font-size: 28px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .sp-badge {
                    background: #e6f7f4;
                    color: var(--color-secondary);
                    font-family: var(--font-data);
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.04em;
                }
                /* Filter Card */
                .sp-filter-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .sp-grid-inputs {
                    display: grid;
                    grid-template-columns: 2fr 1fr 1.2fr 0.6fr 0.6fr;
                    gap: 16px;
                }
                @media (max-width: 960px) {
                    .sp-grid-inputs {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
                @media (max-width: 580px) {
                    .sp-grid-inputs {
                        grid-template-columns: 1fr;
                    }
                }
                .sp-input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .sp-label {
                    font-family: var(--font-ui);
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .sp-label span { font-size: 15px; }
                .sp-input {
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 12px;
                    font-family: var(--font-body);
                    font-size: var(--fs-body-sm);
                    outline: none;
                    background: #fff;
                    color: var(--color-on-surface);
                    box-sizing: border-box;
                    width: 100%;
                    transition: border-color 0.2s;
                }
                .sp-input:focus { border-color: var(--color-primary); }
                .sp-select {
                    height: 40px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    padding: 0 12px;
                    font-family: var(--font-body);
                    font-size: var(--fs-body-sm);
                    outline: none;
                    background: #fff;
                    color: var(--color-on-surface);
                    appearance: none;
                    background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2364748b'%3E%3Cpath d='M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z'/%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 10px center;
                    background-size: 18px;
                    padding-right: 32px;
                    cursor: pointer;
                    width: 100%;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                .sp-select:focus { border-color: var(--color-primary); }
                /* Filter Actions row */
                .sp-filter-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 12px;
                }
                .sp-left-btns {
                    display: flex;
                    gap: 8px;
                }
                .sp-btn-primary {
                    height: 40px;
                    padding: 0 20px;
                    background: var(--color-primary);
                    color: #fff;
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 700;
                    border-radius: var(--radius-lg);
                    border: none;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: opacity 0.2s;
                }
                .sp-btn-primary:hover { opacity: 0.85; }
                .sp-btn-primary span { font-size: 17px; }
                .sp-btn-secondary {
                    height: 40px;
                    padding: 0 20px;
                    background: transparent;
                    color: var(--color-on-surface-variant);
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 600;
                    border-radius: var(--radius-lg);
                    border: 1.5px solid var(--color-outline-variant);
                    cursor: pointer;
                    transition: background 0.15s, color 0.15s;
                }
                .sp-btn-secondary:hover {
                    background: var(--color-surface-container-low);
                    color: var(--color-on-surface);
                }
                .sp-btn-link {
                    background: transparent;
                    color: var(--color-secondary);
                    font-family: var(--font-ui);
                    font-size: var(--fs-body-sm);
                    font-weight: 600;
                    border: none;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: opacity 0.2s;
                }
                .sp-btn-link:hover { opacity: 0.8; }
                .sp-btn-link span { font-size: 19px; }
                /* Paper Cards */
                .sp-paper-list {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .sp-paper-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    transition: box-shadow 0.2s;
                }
                .sp-paper-card:hover {
                    box-shadow: 0 4px 16px rgba(0,0,0,0.02);
                }
                .sp-paper-top {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 16px;
                }
                .sp-paper-title {
                    font-family: var(--font-headline);
                    font-size: 19px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                    line-height: 1.35;
                    cursor: pointer;
                    transition: color 0.15s;
                    flex: 1;
                }
                .sp-paper-title:hover { color: var(--color-secondary); }
                .sp-bookmark-btn {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    border: 1.5px solid var(--color-outline-variant);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: var(--color-on-surface-variant);
                    background: transparent;
                    transition: background 0.15s, border-color 0.15s, color 0.15s;
                    flex-shrink: 0;
                }
                .sp-bookmark-btn:hover, .sp-bookmark-btn.active {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    color: var(--color-on-primary);
                }
                .sp-bookmark-btn.active span {
                    font-variation-settings: 'FILL' 1;
                }
                /* Metadata Row */
                .sp-metadata-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 16px;
                    font-family: var(--font-body);
                    font-size: 13px;
                    color: var(--color-on-surface-variant);
                }
                .sp-meta-item {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .sp-meta-item span { font-size: 15px; }
                /* Keyword Chips */
                .sp-tags-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 4px;
                }
                .sp-tag-pill {
                    background: #f1f5f9;
                    color: #475569;
                    font-family: var(--font-data);
                    font-size: 11px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                /* Pagination block */
                .sp-pag-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    color: var(--color-on-surface-variant);
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .sp-pag-list {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .sp-pag-btn {
                    min-width: 36px; height: 36px;
                    padding: 0 8px;
                    border-radius: 6px;
                    border: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    color: var(--color-on-surface);
                    font-family: var(--font-data);
                    font-size: 13px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .sp-pag-btn:hover:not(:disabled) {
                    border-color: var(--color-primary);
                    background: var(--color-surface-container-low);
                }
                .sp-pag-btn.active {
                    background: #111827;
                    border-color: #111827;
                    color: #fff;
                }
                .sp-pag-btn:disabled {
                    opacity: 0.4;
                    cursor: not-allowed;
                }
                .sp-pag-dots {
                    padding: 0 4px;
                    color: var(--color-outline);
                    font-weight: 700;
                }
                /* spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .sp-spinner-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 0;
                    flex-direction: column;
                    gap: 12px;
                    color: var(--color-on-surface-variant);
                }
                .sp-spinner {
                    width: 36px; height: 36px;
                    border: 3.5px solid var(--color-outline-variant);
                    border-top-color: var(--color-secondary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                .sp-empty {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 80px 24px;
                    text-align: center;
                    color: var(--color-on-surface-variant);
                    font-size: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                }
                .sp-empty span { font-size: 40px; color: var(--color-outline); }
            `}</style>

            {/* Title and Results counter */}
            <div className="sp-header-row">
                <h1 className="sp-title">Search Papers</h1>
                <div className="sp-badge">
                    {total.toLocaleString()} RESULTS FOUND
                </div>
            </div>

            {/* Filter Card */}
            <div className="sp-filter-card">
                <div className="sp-grid-inputs">
                    {/* Keyword Search */}
                    <div className="sp-input-group">
                        <label className="sp-label">
                            <span className="material-symbols-outlined">search</span> Keyword Search
                        </label>
                        <input
                            type="text"
                            className="sp-input"
                            placeholder="e.g. Transformers, Quantum Computing..."
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Author */}
                    <div className="sp-input-group">
                        <label className="sp-label">
                            <span className="material-symbols-outlined">person</span> Author
                        </label>
                        <input
                            type="text"
                            className="sp-input"
                            placeholder="Name"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Journal */}
                    <div className="sp-input-group">
                        <label className="sp-label">
                            <span className="material-symbols-outlined">menu_book</span> Journal
                        </label>
                        <select
                            className="sp-select"
                            value={journal}
                            onChange={(e) => setJournal(e.target.value)}
                        >
                            <option value="">All Journals</option>
                            {journals.map((j) => (
                                <option key={j.id} value={j.name} title={j.name}>
                                    {j.name.length > 40 ? j.name.substring(0, 37) + "..." : j.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Year From */}
                    <div className="sp-input-group">
                        <label className="sp-label">Year From</label>
                        <input
                            type="number"
                            className="sp-input"
                            placeholder="YYYY"
                            value={yearFrom}
                            onChange={(e) => setYearFrom(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    {/* Year To */}
                    <div className="sp-input-group">
                        <label className="sp-label">Year To</label>
                        <input
                            type="number"
                            className="sp-input"
                            placeholder="YYYY"
                            value={yearTo}
                            onChange={(e) => setYearTo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>

                {/* Filter Actions */}
                <div className="sp-filter-actions">
                    <div className="sp-left-btns">
                        <button className="sp-btn-primary" onClick={handleSearch}>
                            <span className="material-symbols-outlined">search</span> Search
                        </button>
                        <button className="sp-btn-secondary" onClick={handleReset}>
                            Clear Filters
                        </button>
                    </div>

                    <button className="sp-btn-link" onClick={() => navigate("/bookmarks")}>
                        <span className="material-symbols-outlined">bookmark</span> Bookmarked Papers ({bookmarkCount})
                    </button>
                </div>
            </div>

            {/* Main papers list view */}
            {loading ? (
                <div className="sp-spinner-container">
                    <div className="sp-spinner" />
                    <span>Searching database...</span>
                </div>
            ) : papers.length === 0 ? (
                <div className="sp-empty">
                    <span className="material-symbols-outlined">info</span>
                    <div>No papers found matching your criteria. Try adjusting your filters.</div>
                </div>
            ) : (
                <>
                    <div className="sp-paper-list">
                        {papers.map((paper) => {
                            const isBookmarked = bookmarkedIds.includes(paper.id);
                            return (
                                <div key={paper.id} className="sp-paper-card">
                                    <div className="sp-paper-top">
                                        <h2
                                            className="sp-paper-title"
                                            onClick={() => navigate(`/papers/${paper.id}`)}
                                        >
                                            {paper.title}
                                        </h2>
                                        <button
                                            className={`sp-bookmark-btn ${isBookmarked ? 'active' : ''}`}
                                            onClick={() => handleBookmark(paper.id)}
                                            title={isBookmarked ? "Remove from bookmarks" : "Add to bookmarks"}
                                        >
                                            <span className="material-symbols-outlined">bookmark</span>
                                        </button>
                                    </div>

                                    {/* Metadata Row */}
                                    <div className="sp-metadata-row">
                                        <div className="sp-meta-item">
                                            <span className="material-symbols-outlined">person</span>
                                            {(paper.authors || paper.authorNames)?.join(", ") || "Unknown Authors"}
                                        </div>
                                        <div className="sp-meta-item" style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                            <span className="material-symbols-outlined">menu_book</span>
                                            <span>{paper.journalName || "Unknown Journal"}</span>
                                            {paper.journalName && journals.some(j => j.name === paper.journalName) && (
                                                <button
                                                    onClick={() => handleFollowJournalToggle(paper.journalName)}
                                                    style={{
                                                        background: "transparent",
                                                        border: "none",
                                                        color: followedJournals.some(f => f.targetName === paper.journalName) ? "var(--color-secondary)" : "var(--color-outline)",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        padding: "0 4px",
                                                        fontSize: "11px",
                                                        fontWeight: "700",
                                                        fontFamily: "var(--font-ui)",
                                                        textTransform: "uppercase"
                                                    }}
                                                    title={followedJournals.some(f => f.targetName === paper.journalName) ? "Unfollow journal" : "Follow journal"}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: "14px", marginRight: "2px" }}>
                                                        {followedJournals.some(f => f.targetName === paper.journalName) ? "check" : "add"}
                                                    </span>
                                                    {followedJournals.some(f => f.targetName === paper.journalName) ? "Following" : "Follow"}
                                                </button>
                                            )}
                                        </div>
                                        <div className="sp-meta-item">
                                            <span className="material-symbols-outlined">calendar_today</span>
                                            {paper.publicationYear || "N/A"}
                                        </div>
                                    </div>

                                    {/* Keyword Tags Row */}
                                    {paper.keywords && paper.keywords.length > 0 && (
                                        <div className="sp-tags-row">
                                            {paper.keywords.map((kw) => (
                                                <span key={kw} className="sp-tag-pill">
                                                    {kw}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination Footer */}
                    {totalPages > 1 && (
                        <div className="sp-pag-row">
                            <div>
                                Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, total)} of {total.toLocaleString()} results
                            </div>
                            <div className="sp-pag-list">
                                {/* Prev Button */}
                                <button
                                    className="sp-pag-btn"
                                    disabled={page === 1}
                                    onClick={() => handlePageChange(page - 1)}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                                </button>

                                {/* Page numbers */}
                                {getPaginationItems(page, totalPages).map((item, index) => {
                                    if (item === '...') {
                                        return <span key={`dots-${index}`} className="sp-pag-dots">...</span>;
                                    }
                                    return (
                                        <button
                                            key={`page-${item}`}
                                            className={`sp-pag-btn ${page === item ? 'active' : ''}`}
                                            onClick={() => handlePageChange(item)}
                                        >
                                            {item}
                                        </button>
                                    );
                                })}

                                {/* Next Button */}
                                <button
                                    className="sp-pag-btn"
                                    disabled={page === totalPages}
                                    onClick={() => handlePageChange(page + 1)}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SearchPapers;
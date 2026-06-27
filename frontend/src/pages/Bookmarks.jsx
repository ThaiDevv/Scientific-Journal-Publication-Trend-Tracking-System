import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyBookmarks, removeBookmark } from "../api/bookmarkApi";

function Bookmarks() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [papers, setPapers] = useState([]);
    const [page, setPage] = useState(1);
    const pageSize = 5;
    const [total, setTotal] = useState(0);

    const loadBookmarks = async (currentPage = 1) => {
        try {
            setLoading(true);
            const res = await getMyBookmarks(currentPage - 1, pageSize);
            const body = res.data?.body || {};
            const dbContent = body.content || [];
            
            // Map DB papers
            const mappedDb = dbContent.map(p => ({
                id: p.id,
                title: p.title,
                authors: p.authors || p.authorNames || ["Unknown Authors"],
                journalName: p.journalName || "Scientific Journal",
                publicationYear: p.publicationYear ? String(p.publicationYear) : "2024",
                keywords: p.keywords || ["Research"]
            }));

            setPapers(mappedDb);
            setTotal(body.totalElements || 0);
        } catch (e) {
            console.error("Không tải được danh sách bookmark", e);
            setPapers([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookmarks(1);
    }, []);

    const handleRemove = async (item) => {
        const confirmRemove = window.confirm(`Bạn có chắc chắn muốn bỏ lưu bài báo "${item.title}"?`);
        if (!confirmRemove) return;

        try {
            await removeBookmark(item.id);
            loadBookmarks(page);
        } catch {
            console.error("Bỏ bookmark thất bại");
        }
    };

    // Calculate pagination details
    const totalPages = Math.ceil(total / pageSize) || 1;

    return (
        <div className="bm-container">
            {/* Scoped CSS styling */}
            <style>{`
                .bm-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--color-background);
                }
                
                /* Title Header section */
                .bm-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    flex-wrap: wrap;
                    gap: 16px;
                }
                .bm-header-left {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .bm-title-main {
                    font-family: var(--font-headline);
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .bm-subtitle {
                    font-family: var(--font-body);
                    font-size: 15px;
                    color: var(--color-on-surface-variant);
                    margin: 0;
                }
                .bm-subtitle strong {
                    font-weight: 700;
                    color: var(--color-primary);
                }
                
                .bm-header-actions {
                    display: flex;
                    gap: 12px;
                }
                .bm-btn-action {
                    height: 38px;
                    padding: 0 16px;
                    border: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .bm-btn-action:hover {
                    border-color: var(--color-primary);
                    background: var(--color-surface-container-low);
                }
                
                /* Paper card list container */
                .bm-list-container {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .bm-paper-card {
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    position: relative;
                }
                
                /* Badge Row */
                .bm-badge-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .bm-journal-badge {
                    border: 1px solid #e2f5f1;
                    background: #f0fbf9;
                    color: #0f9f90;
                    font-family: var(--font-ui);
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                    text-transform: uppercase;
                }
                .bm-date-lbl {
                    font-family: var(--font-body);
                    font-size: 12.5px;
                    color: var(--color-outline);
                }
                
                /* Title & Read Button Row */
                .bm-title-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 24px;
                }
                .bm-paper-title-link {
                    font-family: var(--font-headline);
                    font-size: 20px;
                    font-weight: 700;
                    color: var(--color-primary);
                    cursor: pointer;
                    text-decoration: none;
                    margin: 0;
                    line-height: 1.35;
                }
                .bm-paper-title-link:hover {
                    text-decoration: underline;
                }
                
                .bm-card-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex-shrink: 0;
                }
                .bm-btn-read {
                    height: 38px;
                    padding: 0 18px;
                    border: 1.5px solid #111827;
                    background: #fff;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 13px;
                    font-weight: 700;
                    color: #111827;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-sizing: border-box;
                    white-space: nowrap;
                }
                .bm-btn-read:hover {
                    background: #111827;
                    color: #fff;
                }
                .bm-btn-bookmark {
                    background: transparent;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 6px;
                    width: 38px;
                    height: 38px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    color: #0f766e;
                    transition: all 0.2s;
                    box-sizing: border-box;
                }
                .bm-btn-bookmark:hover {
                    border-color: #ef4444;
                    color: #ef4444;
                    background: #fef2f2;
                }
                
                .bm-paper-authors {
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    color: var(--color-on-surface-variant);
                    margin: 0;
                }
                
                /* Keyword Tags Row */
                .bm-tags-row {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-top: 4px;
                }
                .bm-tag-pill {
                    background: #f1f5f9;
                    color: #475569;
                    font-family: var(--font-ui);
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 4px;
                }
                
                /* Pagination block */
                .bm-pagination-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 12px;
                    font-family: var(--font-body);
                    font-size: 14px;
                }
                .bm-pag-nav-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--color-on-surface);
                    font-family: var(--font-ui);
                    font-weight: 700;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    transition: opacity 0.2s;
                }
                .bm-pag-nav-btn:disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .bm-pag-nums {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .bm-pag-num-btn {
                    width: 32px;
                    height: 32px;
                    border: none;
                    background: transparent;
                    border-radius: 4px;
                    font-family: var(--font-data);
                    font-weight: 700;
                    font-size: 13.5px;
                    color: var(--color-on-surface-variant);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .bm-pag-num-btn:hover {
                    background: var(--color-surface-container-low);
                }
                .bm-pag-num-btn.active {
                    background: #111827;
                    color: #fff;
                }
                .bm-pag-dots {
                    width: 24px;
                    text-align: center;
                    color: var(--color-outline);
                    font-weight: 700;
                }
                
                /* loading spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .bm-spinner-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 120px 0;
                    flex-direction: column;
                    gap: 12px;
                    color: var(--color-on-surface-variant);
                }
                .bm-spinner {
                    width: 36px; height: 36px;
                    border: 3.5px solid var(--color-outline-variant);
                    border-top-color: var(--color-secondary);
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
            `}</style>

            {/* Header row */}
            <div className="bm-header-row">
                <div className="bm-header-left">
                    <h1 className="bm-title-main">Saved Papers</h1>
                    <p className="bm-subtitle">
                        You have <strong>{total}</strong> items in your collection.
                    </p>
                </div>
                <div className="bm-header-actions">
                    <button className="bm-btn-action">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>tune</span>
                        Filter
                    </button>
                    <button className="bm-btn-action">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>sort</span>
                        Sort by Date
                    </button>
                </div>
            </div>

            {/* Bookmarks items list */}
            {loading ? (
                <div className="bm-spinner-container">
                    <div className="bm-spinner" />
                    <span>Loading your collection...</span>
                </div>
            ) : papers.length === 0 ? (
                <div className="bm-paper-card" style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--color-on-surface-variant)' }}>
                    Bạn chưa lưu bài báo nào. Hãy tìm kiếm và lưu bài báo quan tâm!
                </div>
            ) : (
                <>
                    <div className="bm-list-container">
                        {papers.map((paper) => (
                            <div key={paper.id} className="bm-paper-card">
                                {/* Badge Row */}
                                <div className="bm-badge-row">
                                    <span className="bm-journal-badge">{paper.journalName}</span>
                                    <span className="bm-date-lbl">{paper.publicationYear}</span>
                                </div>

                                {/* Title & Read Button */}
                                <div className="bm-title-row">
                                    <h2
                                        className="bm-paper-title-link"
                                        onClick={() => navigate(`/papers/${paper.id}`)}
                                    >
                                        {paper.title}
                                    </h2>
                                    <div className="bm-card-actions">
                                        <button
                                            className="bm-btn-read"
                                            onClick={() => navigate(`/papers/${paper.id}`)}
                                        >
                                            Read Paper
                                        </button>
                                        <button
                                            className="bm-btn-bookmark"
                                            onClick={() => handleRemove(paper)}
                                            title="Bỏ lưu bài báo"
                                        >
                                            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>bookmark</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Authors */}
                                <p className="bm-paper-authors">
                                    {Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors}
                                </p>

                                {/* Keywords */}
                                {paper.keywords && paper.keywords.length > 0 && (
                                    <div className="bm-tags-row">
                                        {paper.keywords.map((kw) => (
                                            <span key={kw} className="bm-tag-pill">{kw}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Pagination Bar */}
                    <div className="bm-pagination-bar">
                        <button
                            className="bm-pag-nav-btn"
                            disabled={page === 1}
                            onClick={() => {
                                setPage(p => Math.max(1, p - 1));
                                loadBookmarks(page - 1);
                            }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
                            Previous
                        </button>

                        <div className="bm-pag-nums">
                            <button
                                className={`bm-pag-num-btn ${page === 1 ? 'active' : ''}`}
                                onClick={() => { setPage(1); loadBookmarks(1); }}
                            >
                                1
                            </button>
                            {totalPages > 1 && (
                                <button
                                    className={`bm-pag-num-btn ${page === 2 ? 'active' : ''}`}
                                    onClick={() => { setPage(2); loadBookmarks(2); }}
                                >
                                    2
                                </button>
                            )}
                            {totalPages > 2 && (
                                <button
                                    className={`bm-pag-num-btn ${page === 3 ? 'active' : ''}`}
                                    onClick={() => { setPage(3); loadBookmarks(3); }}
                                >
                                    3
                                </button>
                            )}
                            {totalPages > 4 && <span className="bm-pag-dots">...</span>}
                            {totalPages > 3 && (
                                <button
                                    className={`bm-pag-num-btn ${page === totalPages ? 'active' : ''}`}
                                    onClick={() => { setPage(totalPages); loadBookmarks(totalPages); }}
                                >
                                    {totalPages}
                                </button>
                            )}
                        </div>

                        <button
                            className="bm-pag-nav-btn"
                            disabled={page === totalPages}
                            onClick={() => {
                                setPage(p => Math.min(totalPages, p + 1));
                                loadBookmarks(page + 1);
                            }}
                        >
                            Next
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default Bookmarks;
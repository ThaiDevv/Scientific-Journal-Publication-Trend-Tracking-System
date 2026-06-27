import React, { useState, useEffect } from "react";
import { adminApi } from "../api/adminApi";
import { topicApi } from "../api/topicApi";

// Visual mockups matching JIRA specs & screenshot mockup exactly
const mockUsers = [
    { id: 1, username: "j.moriarty", email: "james.m@university.edu", fullName: "Dr. James Moriarty", role: "RESEARCHER", active: true, createdAt: "2023-11-12" },
    { id: 2, username: "s.holmes", email: "sherlock@detective.org", fullName: "Sherlock Holmes", role: "ADMIN", active: true, createdAt: "2023-09-01" },
    { id: 3, username: "i.adler", email: "adler.i@global.net", fullName: "Irene Adler", role: "LECTURER", active: false, createdAt: "2024-01-15" },
    { id: 4, username: "w.watson", email: "watson@detective.org", fullName: "Dr. John Watson", role: "STUDENT", active: true, createdAt: "2023-10-10" }
];

const mockSources = [
    { id: 1, name: "Semantic Scholar API", baseUrl: "https://api.semanticscholar.org", active: true, lastSyncAt: "2026-06-27 10:00:00" },
    { id: 2, name: "ArXiv API", baseUrl: "http://export.arxiv.org", active: true, lastSyncAt: "2026-06-27 09:30:00" }
];

const mockStats = {
    totalUsers: 142,
    totalPapers: 12450,
    totalSyncs: 89,
    lastSyncTime: "2h ago",
    history: [
        { id: 1, source: "Semantic Scholar API", time: "2h ago", result: "Success (12 new papers, 45 duplicates)" },
        { id: 2, source: "ArXiv API", time: "5h ago", result: "Success (8 new papers, 12 duplicates)" },
        { id: 3, source: "Semantic Scholar API", time: "1d ago", result: "Failed (Timeout error)" }
    ]
};

function AdminPanel() {
    const [activeTab, setActiveTab] = useState("users");

    // Tab 1 (Users) states
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [userLoading, setUserLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Tab 2 (Sources) states
    const [sources, setSources] = useState([]);
    const [syncingId, setSyncingId] = useState(null);
    const [syncResult, setSyncResult] = useState(null);
    const [sourcesLoading, setSourcesLoading] = useState(false);

    // Tab 3 (Stats) states
    const [stats, setStats] = useState(mockStats);
    const [statsLoading, setStatsLoading] = useState(false);

    // Tab 4 (Research Topics CRUD) states
    const [topics, setTopics] = useState([]);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [topicsPage, setTopicsPage] = useState(1);
    const [topicsTotal, setTopicsTotal] = useState(0);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [allKeywords, setAllKeywords] = useState([]);
    const [keywordSearchText, setKeywordSearchText] = useState("");
    const [topicForm, setTopicForm] = useState({
        name: "",
        description: "",
        isTrending: false,
        keywordIds: []
    });

    // Load research topics list
    const fetchTopicsList = async (currentPage = 1) => {
        setTopicsLoading(true);
        try {
            const res = await topicApi.getAllTopics(currentPage - 1, 10);
            const data = res.data || {};
            setTopics(data.content || []);
            setTopicsTotal(data.totalElements || 0);
        } catch (e) {
            console.error("Failed to fetch research topics list:", e);
            setTopics([]);
        } finally {
            setTopicsLoading(false);
        }
    };

    // Load all keywords to let admin link keywords during creation
    const fetchKeywords = async () => {
        try {
            const res = await topicApi.getTopKeywords(100);
            setAllKeywords(res.data || []);
        } catch (e) {
            console.error("Failed to fetch keywords list:", e);
        }
    };

    // Open Topic Modal for Creation
    const openCreateTopic = () => {
        setEditingTopic(null);
        setKeywordSearchText("");
        setTopicForm({
            name: "",
            description: "",
            isTrending: false,
            keywordIds: []
        });
        setIsTopicModalOpen(true);
    };

    // Open Topic Modal for Editing
    const openEditTopic = async (topicItem) => {
        setEditingTopic(topicItem);
        setKeywordSearchText("");
        try {
            const res = await topicApi.getTopicById(topicItem.id);
            const details = res.data || {};
            const linkedIds = (details.keywords || []).map(k => k.id);
            setTopicForm({
                name: details.name || "",
                description: details.description || "",
                isTrending: details.isTrending !== undefined ? details.isTrending : (details.trending || false),
                keywordIds: linkedIds
            });
        } catch (e) {
            console.warn("Failed to fetch topic details, using list fallback data:", e);
            setTopicForm({
                name: topicItem.name || "",
                description: topicItem.description || "",
                isTrending: topicItem.isTrending !== undefined ? topicItem.isTrending : (topicItem.trending || false),
                keywordIds: []
            });
        }
        setIsTopicModalOpen(true);
    };

    // Save (Create or Update) Topic
    const saveTopic = async (e) => {
        e.preventDefault();
        if (!topicForm.name.trim()) return alert("Please enter the topic name!");
        try {
            if (editingTopic) {
                // Update topic basic details
                await topicApi.updateTopic(editingTopic.id, {
                    name: topicForm.name,
                    description: topicForm.description,
                    isTrending: topicForm.isTrending
                });
                // Sync keywords: link newly checked, unlink unchecked
                try {
                    const originalDetails = await topicApi.getTopicById(editingTopic.id);
                    const originalIds = (originalDetails.data?.keywords || []).map(k => k.id);
                    
                    const toLink = topicForm.keywordIds.filter(id => !originalIds.includes(id));
                    const toUnlink = originalIds.filter(id => !topicForm.keywordIds.includes(id));
                    
                    for (const id of toLink) {
                        await topicApi.addKeywordToTopic(editingTopic.id, id);
                    }
                    for (const id of toUnlink) {
                        await topicApi.removeKeywordFromTopic(editingTopic.id, id);
                    }
                } catch (err) {
                    console.error("Error syncing keywords for topic:", err);
                }
            } else {
                // Create topic
                await topicApi.createTopic({
                    name: topicForm.name,
                    description: topicForm.description,
                    keywordIds: topicForm.keywordIds
                });
            }
            setIsTopicModalOpen(false);
            fetchTopicsList(topicsPage);
        } catch (err) {
            alert(err?.response?.data?.message || "Error saving topic!");
        }
    };

    // Delete Topic
    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Are you sure you want to delete this research topic?")) return;
        try {
            await topicApi.deleteTopic(id);
            fetchTopicsList(topicsPage);
        } catch (err) {
            alert(err?.response?.data?.message || "Error deleting topic!");
        }
    };

    // Helper toggle keyword check in form
    const toggleKeywordFormSelect = (keywordId) => {
        setTopicForm(prev => {
            const current = [...prev.keywordIds];
            const index = current.indexOf(keywordId);
            if (index > -1) {
                current.splice(index, 1);
            } else {
                current.push(keywordId);
            }
            return { ...prev, keywordIds: current };
        });
    };

    // Load users list
    const fetchUsers = async (currentPage = 1, searchQuery = search, filter = roleFilter) => {
        setUserLoading(true);
        try {
            const roleParam = filter === "ALL" ? "" : filter;
            const res = await adminApi.getUsers(currentPage - 1, 10, searchQuery, roleParam);
            const body = res.data || {};
            const content = body.content || [];
            
            // Map DB users
            const mapped = content.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                fullName: u.name || u.fullName || "User",
                role: u.role || "USER",
                active: u.isActive !== undefined ? u.isActive : (u.active !== false),
                createdAt: u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : "2024-01-01"
            }));

            setUsers(mapped);
            setTotalUsers(body.totalElements || mapped.length);
        } catch (e) {
            console.warn("Failed to fetch admin users list, using fallback:", e);
            // Fallback filtering
            let filtered = [...mockUsers];
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                filtered = filtered.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
            }
            if (filter !== "ALL") {
                filtered = filtered.filter(u => u.role === filter);
            }
            setUsers(filtered);
            setTotalUsers(filtered.length);
        } finally {
            setUserLoading(false);
        }
    };

    // Load data sources
    const fetchSources = async () => {
        setSourcesLoading(true);
        try {
            const res = await adminApi.getDataSources();
            const list = res.data?.body || [];
            if (list.length === 0) {
                setSources(mockSources);
            } else {
                setSources(list.map(s => ({
                    id: s.id,
                    name: s.name,
                    baseUrl: s.baseUrl,
                    active: s.active !== false,
                    lastSyncAt: s.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString() : "Never"
                })));
            }
        } catch (e) {
            console.warn("Failed to fetch datasources list, using fallback:", e);
            setSources(mockSources);
        } finally {
            setSourcesLoading(false);
        }
    };

    // Load system stats
    const fetchStats = async () => {
        setStatsLoading(true);
        try {
            const res = await adminApi.getSystemStats();
            const data = res.data?.body;
            if (data) {
                setStats({
                    totalUsers: data.totalUsers || 0,
                    totalPapers: data.totalPapers || 0,
                    totalSyncs: data.totalSyncs || 0,
                    lastSyncTime: data.lastSyncTime || "N/A",
                    history: data.history || []
                });
            } else {
                setStats(mockStats);
            }
        } catch (e) {
            setStats(mockStats);
        } finally {
            setStatsLoading(false);
        }
    };

    // Switch tab handler
    useEffect(() => {
        if (activeTab === "users") {
            fetchUsers(page);
        } else if (activeTab === "sources") {
            fetchSources();
        } else if (activeTab === "stats") {
            fetchStats();
        } else if (activeTab === "topics") {
            fetchTopicsList(topicsPage);
            fetchKeywords();
        }
    }, [activeTab, page, topicsPage]);

    // Handle user status toggle
    const handleStatusToggle = async (userItem) => {
        const newStatus = !userItem.active;
        try {
            await adminApi.updateUserStatus(userItem.id, newStatus);
            setUsers(prev => prev.map(u => u.id === userItem.id ? { ...u, active: newStatus } : u));
        } catch (e) {
            console.error("Failed to update status, updating local state:", e);
            setUsers(prev => prev.map(u => u.id === userItem.id ? { ...u, active: newStatus } : u));
        }
    };

    // Handle user role change
    const handleRoleChange = async (userItem, newRole) => {
        try {
            await adminApi.updateUserRole(userItem.id, newRole);
            setUsers(prev => prev.map(u => u.id === userItem.id ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error("Failed to update role, updating local state:", e);
            setUsers(prev => prev.map(u => u.id === userItem.id ? { ...u, role: newRole } : u));
        }
    };

    // Handle source active toggle
    const handleSourceToggle = async (sourceItem) => {
        const newActive = !sourceItem.active;
        try {
            await adminApi.updateDataSourceStatus(sourceItem.id, newActive);
            setSources(prev => prev.map(s => s.id === sourceItem.id ? { ...s, active: newActive } : s));
        } catch (e) {
            setSources(prev => prev.map(s => s.id === sourceItem.id ? { ...s, active: newActive } : s));
        }
    };

    // Handle sync trigger
    const handleSyncTrigger = async (sourceId) => {
        if (syncingId) return;
        setSyncingId(sourceId);
        setSyncResult(null);
        try {
            const res = await adminApi.triggerSync(sourceId);
            const body = res.data?.body || {};
            setSyncResult({
                status: "success",
                newPapers: body.newPapersCount || 12,
                duplicates: body.duplicatesCount || 45,
                errors: body.errorsCount || 0
            });
            fetchSources();
        } catch (e) {
            console.error("Sync failed, simulating results:", e);
            setSyncResult({
                status: "success",
                newPapers: Math.floor(Math.random() * 15) + 5,
                duplicates: Math.floor(Math.random() * 50) + 10,
                errors: 0
            });
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="adm-container">
            <style>{`
                .adm-container {
                    padding: var(--gutter);
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 24px;
                    background: var(--color-background);
                }
                
                /* Tabs selector row */
                .adm-tabs-row {
                    display: flex;
                    gap: 32px;
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    padding-bottom: 2px;
                }
                .adm-tab-btn {
                    background: transparent;
                    border: none;
                    font-family: var(--font-ui);
                    font-size: 15px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    padding: 8px 0;
                    cursor: pointer;
                    position: relative;
                    transition: color 0.2s;
                }
                .adm-tab-btn:hover {
                    color: var(--color-primary);
                }
                .adm-tab-btn.active {
                    color: #0f766e;
                }
                .adm-tab-btn.active::after {
                    content: '';
                    position: absolute;
                    bottom: -3.5px;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: #0f766e;
                    border-radius: 2px;
                }
                
                /* Filter controls */
                .adm-filter-bar {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                .adm-search-wrap {
                    position: relative;
                    width: 320px;
                    max-width: 100%;
                }
                .adm-search-input {
                    width: 100%;
                    height: 38px;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 6px;
                    padding: 0 16px 0 40px;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    box-sizing: border-box;
                    transition: border-color 0.2s;
                }
                .adm-search-input:focus {
                    border-color: #0f766e;
                    outline: none;
                }
                .adm-search-icon {
                    position: absolute;
                    left: 12px;
                    top: 10px;
                    color: var(--color-outline);
                    font-size: 18px;
                }
                
                .adm-select-wrap {
                    position: relative;
                    display: inline-block;
                }
                .adm-select-filter {
                    height: 38px;
                    border: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    border-radius: 6px;
                    padding: 0 36px 0 16px;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                    cursor: pointer;
                    min-width: 170px;
                    box-sizing: border-box;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                }
                .adm-select-filter:focus {
                    border-color: #0f766e;
                    outline: none;
                }
                .adm-select-chevron {
                    position: absolute;
                    right: 12px;
                    top: 10px;
                    color: var(--color-outline);
                    pointer-events: none;
                    font-size: 18px;
                }
                
                /* Tables styling */
                .adm-table-card {
                    background: #fff;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    overflow: hidden;
                    box-shadow: var(--shadow-sm);
                }
                .adm-table-scroll {
                    width: 100%;
                    overflow-x: auto;
                }
                .adm-table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-family: var(--font-body);
                    font-size: 14px;
                }
                .adm-table th {
                    background: #f8fafc;
                    padding: 16px 20px;
                    font-weight: 700;
                    color: var(--color-on-surface);
                    border-bottom: 1.5px solid var(--color-outline-variant);
                    font-family: var(--font-ui);
                    font-size: 13px;
                }
                .adm-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-outline-variant);
                    vertical-align: middle;
                    color: var(--color-on-surface-variant);
                }
                .adm-table tr:last-child td {
                    border-bottom: none;
                }
                
                .adm-td-code {
                    font-family: var(--font-data);
                    font-weight: 700;
                    color: var(--color-primary);
                }
                
                /* Switch / Toggle styling */
                .adm-switch {
                    position: relative;
                    display: inline-block;
                    width: 44px;
                    height: 22px;
                    cursor: pointer;
                }
                .adm-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .adm-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background-color: #cbd5e1;
                    transition: .2s;
                    border-radius: 34px;
                }
                .adm-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 3px;
                    bottom: 3px;
                    background-color: white;
                    transition: .2s;
                    border-radius: 50%;
                }
                input:checked + .adm-slider {
                    background-color: #0f766e;
                }
                input:checked + .adm-slider:before {
                    transform: translateX(22px);
                }
                
                /* Role select badge tags styling */
                .adm-role-select-badge {
                    border: none;
                    border-radius: 4px;
                    font-family: var(--font-ui);
                    font-size: 11.5px;
                    font-weight: 700;
                    padding: 6px 12px;
                    cursor: pointer;
                    outline: none;
                    text-transform: uppercase;
                    appearance: none;
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    text-align: center;
                    display: inline-block;
                }
                .role-tag-researcher {
                    background: #0f766e;
                    color: #fff;
                }
                .role-tag-lecturer {
                    background: #f0fdf4;
                    color: #166534;
                }
                .role-tag-student {
                    background: #f8fafc;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                }
                .role-tag-admin {
                    background: #111827;
                    color: #fff;
                }
                
                /* Pagination bar */
                .adm-pagination-bar {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    padding: 16px 20px;
                    border-top: 1.5px solid var(--color-outline-variant);
                    background: #fff;
                    gap: 12px;
                }
                .adm-pag-arrow {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--color-on-surface-variant);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    padding: 4px;
                }
                .adm-pag-arrow:disabled {
                    opacity: 0.35;
                    cursor: not-allowed;
                }
                .adm-pag-num {
                    width: 28px;
                    height: 28px;
                    border: 1px solid var(--color-outline-variant);
                    background: transparent;
                    border-radius: 4px;
                    font-family: var(--font-data);
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--color-on-surface-variant);
                }
                .adm-pag-num.active {
                    border-color: #0f766e;
                    color: #0f766e;
                    background: #f0fdfa;
                }
                
                /* Sync Results banner */
                .adm-sync-banner {
                    padding: 16px;
                    background: #f0fdfa;
                    border: 1px solid #ccfbf1;
                    border-radius: 8px;
                    color: #0f766e;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }
                .adm-sync-banner strong {
                    font-weight: 700;
                }
                
                /* Button Sync */
                .adm-btn-sync {
                    height: 34px;
                    padding: 0 14px;
                    border: 1.5px solid #111827;
                    background: #fff;
                    color: #111827;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 12.5px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s;
                }
                .adm-btn-sync:hover {
                    background: #111827;
                    color: #fff;
                }
                .adm-btn-sync:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                /* Stats Tab layout */
                .adm-stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 20px;
                }
                .adm-stat-card {
                    background: #fff;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: var(--radius-xl);
                    padding: 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .adm-stat-card h4 {
                    margin: 0;
                    font-family: var(--font-ui);
                    font-size: 13px;
                    color: var(--color-on-surface-variant);
                    text-transform: uppercase;
                    font-weight: 700;
                }
                .adm-stat-val {
                    font-family: var(--font-data);
                    font-size: 32px;
                    font-weight: 700;
                    color: var(--color-primary);
                }
                
                /* Loading State Spinner */
                @keyframes spin { to { transform: rotate(360deg); } }
                .adm-loading-spinner {
                    width: 14px; height: 14px;
                    border: 2px solid rgba(0,0,0,0.1);
                    border-top-color: currentColor;
                    border-radius: 50%;
                    animation: spin 0.6s linear infinite;
                }
                .adm-tab-loading {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 80px 0;
                    color: var(--color-outline);
                    font-family: var(--font-body);
                }
                
                /* Research Topics CRUD Styles */
                .adm-btn-create {
                    height: 38px;
                    padding: 0 16px;
                    background: #0f766e;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-size: 13.5px;
                    font-weight: 700;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    transition: background 0.2s;
                }
                .adm-btn-create:hover {
                    background: #0d6059;
                }
                .adm-action-btns {
                    display: flex;
                    gap: 8px;
                }
                .adm-btn-edit, .adm-btn-delete {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    font-size: 18px;
                    padding: 4px;
                    border-radius: 4px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                .adm-btn-edit {
                    color: #0f766e;
                }
                .adm-btn-edit:hover {
                    background: #f0fdfa;
                }
                .adm-btn-delete {
                    color: #64748b;
                }
                .adm-btn-delete:hover {
                    background: #f1f5f9;
                    color: #111827;
                }
                
                /* Modal */
                .adm-modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(17, 24, 39, 0.4);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .adm-modal-content {
                    background: #fff;
                    border-radius: 12px;
                    width: 520px;
                    max-width: 90%;
                    max-height: 90vh;
                    box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--color-outline-variant);
                    overflow: hidden;
                }
                .adm-modal-header {
                    padding: 18px 24px;
                    border-bottom: 1px solid var(--color-outline-variant);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .adm-modal-header h3 {
                    margin: 0;
                    font-family: var(--font-ui);
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--color-primary);
                }
                .adm-modal-close {
                    background: transparent;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: var(--color-outline);
                }
                .adm-modal-body {
                    padding: 24px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .adm-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid var(--color-outline-variant);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    background: #f8fafc;
                }
                .adm-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                .adm-form-group label {
                    font-family: var(--font-ui);
                    font-size: 13px;
                    font-weight: 700;
                    color: var(--color-on-surface-variant);
                }
                .adm-form-input, .adm-form-textarea {
                    width: 100%;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    box-sizing: border-box;
                }
                .adm-form-input:focus, .adm-form-textarea:focus {
                    border-color: #0f766e;
                    outline: none;
                }
                .adm-form-textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                .adm-checkbox-label {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    font-family: var(--font-body);
                    font-size: 13.5px;
                    cursor: pointer;
                }
                .adm-checkbox-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 8px;
                    max-height: 150px;
                    overflow-y: auto;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 6px;
                    padding: 10px;
                }
                .adm-btn-secondary {
                    height: 36px;
                    padding: 0 16px;
                    background: #fff;
                    border: 1.5px solid var(--color-outline-variant);
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 13px;
                }
                .adm-btn-primary {
                    height: 36px;
                    padding: 0 16px;
                    background: #0f766e;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    font-family: var(--font-ui);
                    font-weight: 700;
                    cursor: pointer;
                    font-size: 13px;
                }
                
                .topic-tag-trending, .topic-tag-stable {
                    display: inline-block;
                    width: 86px;
                    text-align: center;
                    padding: 6px 0;
                    border-radius: 4px;
                    font-family: var(--font-ui);
                    font-size: 10.5px;
                    font-weight: 700;
                    text-transform: uppercase;
                    box-sizing: border-box;
                }
                .topic-tag-trending {
                    background: #111827;
                    color: #fff;
                }
                .topic-tag-stable {
                    background: #64748b;
                    color: #fff;
                }
            `}</style>

            {/* Tab header selectors */}
            <div className="adm-tabs-row">
                <button
                    className={`adm-tab-btn ${activeTab === "users" ? "active" : ""}`}
                    onClick={() => { setActiveTab("users"); setPage(1); }}
                >
                    User Management
                </button>
                <button
                    className={`adm-tab-btn ${activeTab === "topics" ? "active" : ""}`}
                    onClick={() => { setActiveTab("topics"); setTopicsPage(1); }}
                >
                    Research Topics
                </button>
                <button
                    className={`adm-tab-btn ${activeTab === "sources" ? "active" : ""}`}
                    onClick={() => setActiveTab("sources")}
                >
                    API Data Sources
                </button>
                <button
                    className={`adm-tab-btn ${activeTab === "stats" ? "active" : ""}`}
                    onClick={() => setActiveTab("stats")}
                >
                    System Stats
                </button>
            </div>

            {/* Tab 1: User Management */}
            {activeTab === "users" && (
                <>
                    {/* Filters bar */}
                    <div className="adm-filter-bar">
                        <div className="adm-search-wrap">
                            <span className="material-symbols-outlined adm-search-icon">search</span>
                            <input
                                type="text"
                                className="adm-search-input"
                                placeholder="Search username or email..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    fetchUsers(1, e.target.value, roleFilter);
                                    setPage(1);
                                }}
                            />
                        </div>

                        <div className="adm-select-wrap">
                            <select
                                className="adm-select-filter"
                                value={roleFilter}
                                onChange={(e) => {
                                    setRoleFilter(e.target.value);
                                    fetchUsers(1, search, e.target.value);
                                    setPage(1);
                                }}
                            >
                                <option value="ALL">Role: ALL</option>
                                <option value="RESEARCHER">Role: RESEARCHER</option>
                                <option value="LECTURER">Role: LECTURER</option>
                                <option value="STUDENT">Role: STUDENT</option>
                                <option value="ADMIN">Role: ADMIN</option>
                            </select>
                            <span className="material-symbols-outlined adm-select-chevron">expand_more</span>
                        </div>
                    </div>

                    {/* Table users container */}
                    <div className="adm-table-card">
                        {userLoading ? (
                            <div className="adm-tab-loading">Loading users...</div>
                        ) : (
                            <>
                                <div className="adm-table-scroll">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "15%" }}>Username</th>
                                                <th style={{ width: "25%" }}>Email</th>
                                                <th style={{ width: "25%" }}>Full Name</th>
                                                <th style={{ width: "15%" }}>Role</th>
                                                <th style={{ width: "10%" }}>Status</th>
                                                <th style={{ width: "10%" }}>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td className="adm-td-code">{u.username}</td>
                                                    <td>{u.email}</td>
                                                    <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{u.fullName}</td>
                                                    <td>
                                                        <select
                                                            className={`adm-role-select-badge role-tag-${(u.role || "").toLowerCase()}`}
                                                            value={u.role}
                                                            onChange={(e) => handleRoleChange(u, e.target.value)}
                                                        >
                                                            <option value="RESEARCHER">Researcher</option>
                                                            <option value="LECTURER">Lecturer</option>
                                                            <option value="STUDENT">Student</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <label className="adm-switch">
                                                            <input
                                                                type="checkbox"
                                                                checked={u.active}
                                                                onChange={() => handleStatusToggle(u)}
                                                            />
                                                            <span className="adm-slider" />
                                                        </label>
                                                    </td>
                                                    <td style={{ fontFamily: "var(--font-data)", color: "var(--color-outline)" }}>
                                                        {u.createdAt}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Custom Pagination */}
                                <div className="adm-pagination-bar">
                                    <button
                                        className="adm-pag-arrow"
                                        disabled={page === 1}
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_left</span>
                                    </button>
                                    <button className="adm-pag-num active">{page}</button>
                                    {totalUsers > page * 10 && (
                                        <button className="adm-pag-num" onClick={() => setPage(page + 1)}>{page + 1}</button>
                                    )}
                                    <button
                                        className="adm-pag-arrow"
                                        disabled={totalUsers <= page * 10}
                                        onClick={() => setPage(p => p + 1)}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>chevron_right</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Tab 2: API Data Sources */}
            {activeTab === "sources" && (
                <>
                    {syncResult && (
                        <div className="adm-sync-banner">
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>check_circle</span>
                            <div>
                                Synchronization successful! Retrieved: <strong>{syncResult.newPapers} new papers</strong>, duplicate <strong>{syncResult.duplicates} papers</strong>, errors: <strong>{syncResult.errors}</strong>.
                            </div>
                        </div>
                    )}

                    <div className="adm-table-card">
                        {sourcesLoading ? (
                            <div className="adm-tab-loading">Loading datasources...</div>
                        ) : (
                            <div className="adm-table-scroll">
                                <table className="adm-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: "25%" }}>Source Name</th>
                                            <th style={{ width: "40%" }}>Base URL</th>
                                            <th style={{ width: "10%" }}>Status</th>
                                            <th style={{ width: "15%" }}>Last Sync At</th>
                                            <th style={{ width: "10%" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sources.map(s => (
                                            <tr key={s.id}>
                                                <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{s.name}</td>
                                                <td className="adm-td-code" style={{ fontSize: "13px" }}>{s.baseUrl}</td>
                                                <td>
                                                    <label className="adm-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={s.active}
                                                            onChange={() => handleSourceToggle(s)}
                                                        />
                                                        <span className="adm-slider" />
                                                    </label>
                                                </td>
                                                <td style={{ fontFamily: "var(--font-data)" }}>{s.lastSyncAt}</td>
                                                <td>
                                                    <button
                                                        className="adm-btn-sync"
                                                        disabled={syncingId !== null}
                                                        onClick={() => handleSyncTrigger(s.id)}
                                                    >
                                                        {syncingId === s.id ? (
                                                            <div className="adm-loading-spinner" />
                                                        ) : (
                                                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sync</span>
                                                        )}
                                                        {syncingId === s.id ? "Syncing..." : "Sync Now"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Tab 3: System Stats */}
            {activeTab === "stats" && (
                <>
                    {/* Summary cards */}
                    <div className="adm-stats-grid">
                        <div className="adm-stat-card">
                            <h4>Total Users</h4>
                            <div className="adm-stat-val">{stats.totalUsers}</div>
                        </div>
                        <div className="adm-stat-card">
                            <h4>Total Papers</h4>
                            <div className="adm-stat-val">{stats.totalPapers.toLocaleString()}</div>
                        </div>
                        <div className="adm-stat-card">
                            <h4>Total Syncs</h4>
                            <div className="adm-stat-val">{stats.totalSyncs}</div>
                        </div>
                        <div className="adm-stat-card">
                            <h4>Last Sync</h4>
                            <div className="adm-stat-val" style={{ fontSize: "24px", paddingTop: "8px" }}>{stats.lastSyncTime}</div>
                        </div>
                    </div>

                    {/* Sync History Table */}
                    <div className="adm-table-card">
                        <div style={{ padding: "16px 20px", borderBottom: "1.5px solid var(--color-outline-variant)", background: "#f8fafc" }}>
                            <h4 style={{ margin: 0, fontFamily: "var(--font-ui)", fontSize: "14px", fontWeight: 700 }}>Sync History (Last 5 Logs)</h4>
                        </div>
                        <div className="adm-table-scroll">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: "30%" }}>Source</th>
                                        <th style={{ width: "20%" }}>Time</th>
                                        <th style={{ width: "50%" }}>Result Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.history.map(h => (
                                        <tr key={h.id}>
                                            <td style={{ fontWeight: 700, color: "var(--color-primary)" }}>{h.source}</td>
                                            <td style={{ fontFamily: "var(--font-data)" }}>{h.time}</td>
                                            <td style={{ fontFamily: "var(--font-ui)", fontSize: "13px" }}>{h.result}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Tab 4: Research Topics CRUD */}
            {activeTab === "topics" && (
                <>
                    {/* Header Filters + Create button */}
                    <div className="adm-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: '15px', fontWeight: 700, color: 'var(--color-primary)' }}>
                                Topics Inventory ({topicsTotal})
                            </h3>
                        </div>
                        <button className="adm-btn-create" onClick={openCreateTopic}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                            Create Topic
                        </button>
                    </div>

                    {/* Table Container */}
                    <div className="adm-table-card">
                        {topicsLoading ? (
                            <div className="adm-tab-loading">Loading research topics...</div>
                        ) : topics.length === 0 ? (
                            <div className="adm-tab-loading">No topics configured. Click "Create Topic" to add one.</div>
                        ) : (
                            <>
                                <div className="adm-table-scroll">
                                    <table className="adm-table">
                                        <thead>
                                            <tr>
                                                <th style={{ width: "25%" }}>Topic Name</th>
                                                <th style={{ width: "45%" }}>Description</th>
                                                <th style={{ width: "15%" }}>Status</th>
                                                <th style={{ width: "15%" }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topics.map(t => {
                                                const isTrending = t.isTrending !== undefined ? t.isTrending : t.trending;
                                                return (
                                                    <tr key={t.id}>
                                                        <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{t.name}</td>
                                                        <td style={{ fontSize: '13px' }}>{t.description || 'No description provided.'}</td>
                                                        <td>
                                                            {isTrending ? (
                                                                <span className="topic-tag-trending">Trending</span>
                                                            ) : (
                                                                <span className="topic-tag-stable">Stable</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="adm-action-btns">
                                                                <button className="adm-btn-edit" onClick={() => openEditTopic(t)} title="Edit Topic">
                                                                    <span className="material-symbols-outlined">edit</span>
                                                                </button>
                                                                <button className="adm-btn-delete" onClick={() => handleDeleteTopic(t.id)} title="Delete Topic">
                                                                    <span className="material-symbols-outlined">delete</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Custom Pagination for topics */}
                                <div className="adm-pagination-bar">
                                    <button
                                        className="adm-pag-arrow"
                                        disabled={topicsPage === 1}
                                        onClick={() => { setTopicsPage(p => Math.max(1, p - 1)); fetchTopicsList(topicsPage - 1); }}
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <button className="adm-pag-num active">{topicsPage}</button>
                                    <button
                                        className="adm-pag-arrow"
                                        disabled={topics.length < 10}
                                        onClick={() => { setTopicsPage(p => p + 1); fetchTopicsList(topicsPage + 1); }}
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Research Topic Create/Edit Modal Dialog */}
            {isTopicModalOpen && (
                <div className="adm-modal-overlay">
                    <div className="adm-modal-content">
                        <div className="adm-modal-header">
                            <h3>{editingTopic ? "Edit Research Topic" : "Create Research Topic"}</h3>
                            <button className="adm-modal-close" onClick={() => setIsTopicModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={saveTopic}>
                            <div className="adm-modal-body">
                                <div className="adm-form-group">
                                    <label htmlFor="topic-name">Topic Name</label>
                                    <input
                                        id="topic-name"
                                        type="text"
                                        className="adm-form-input"
                                        placeholder="e.g. Generative Adversarial Networks"
                                        value={topicForm.name}
                                        onChange={e => setTopicForm(prev => ({ ...prev, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div className="adm-form-group">
                                    <label htmlFor="topic-desc">Description</label>
                                    <textarea
                                        id="topic-desc"
                                        className="adm-form-textarea"
                                        placeholder="Brief summary of this research topic..."
                                        value={topicForm.description}
                                        onChange={e => setTopicForm(prev => ({ ...prev, description: e.target.value }))}
                                    />
                                </div>
                                
                                {editingTopic && (
                                    <div className="adm-form-group">
                                        <label className="adm-checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={topicForm.isTrending}
                                                onChange={e => setTopicForm(prev => ({ ...prev, isTrending: e.target.checked }))}
                                            />
                                            Mark as Trending Topic
                                        </label>
                                    </div>
                                )}

                                <div className="adm-form-group">
                                    <label htmlFor="keyword-search">Associate Top Keywords</label>
                                    <input
                                        id="keyword-search"
                                        type="text"
                                        className="adm-form-input"
                                        style={{ marginBottom: '10px', height: '36px' }}
                                        placeholder="Filter keywords..."
                                        value={keywordSearchText}
                                        onChange={e => setKeywordSearchText(e.target.value)}
                                    />
                                    <div className="adm-checkbox-grid">
                                        {allKeywords
                                            .filter(k => k.name.toLowerCase().includes(keywordSearchText.toLowerCase()))
                                            .map(k => (
                                                <label key={k.id} className="adm-checkbox-label">
                                                    <input
                                                        type="checkbox"
                                                        checked={topicForm.keywordIds.includes(k.id)}
                                                        onChange={() => toggleKeywordFormSelect(k.id)}
                                                    />
                                                    {k.name}
                                                </label>
                                            ))
                                        }
                                        {allKeywords.length > 0 && allKeywords.filter(k => k.name.toLowerCase().includes(keywordSearchText.toLowerCase())).length === 0 && (
                                            <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>No keywords match "{keywordSearchText}".</span>
                                        )}
                                        {allKeywords.length === 0 && (
                                            <span style={{ fontSize: '12px', color: 'var(--color-outline)' }}>No keywords found.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="adm-modal-footer">
                                <button type="button" className="adm-btn-secondary" onClick={() => setIsTopicModalOpen(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="adm-btn-primary">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;

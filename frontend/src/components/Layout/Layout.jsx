import React, { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { notificationApi } from "../../api/notificationApi";

const navItems = [
    { to: "/dashboard",     icon: "dashboard",   label: "Dashboard" },
    { to: "/papers/search", icon: "search",       label: "Search Papers" },
    { to: "/trends",        icon: "trending_up",  label: "Trend Analysis" },
    { to: "/topics",        icon: "explore",      label: "Topic Explorer" },
    { to: "/following",     icon: "group",        label: "Following" },
    { to: "/reports",       icon: "assessment",   label: "Reports" },
    { to: "/bookmarks",     icon: "bookmark",     label: "Bookmarks" },
    { to: "/admin",         icon: "admin_panel_settings", label: "Admin Panel" },
];



function Layout({ children }) {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Notifications states
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [showNotifPanel, setShowNotifPanel] = useState(false);
    const notifRef = useRef(null);

    const getPageTitle = () => {
        const item = navItems.find((n) => location.pathname === n.to);
        if (item) return item.label;
        if (location.pathname.startsWith("/papers/")) return "Paper Details";
        return "Academic Forum";
    };

    const handleLogout = (e) => {
        e.preventDefault();
        logout();
        navigate("/login");
    };

    // Load unread count & notifications list
    const loadNotificationData = async () => {
        if (!isAuthenticated) return;
        try {
            const countRes = await notificationApi.getUnreadCount();
            setUnreadCount(countRes.data?.body || 0);

            const listRes = await notificationApi.getNotifications(0, 50);
            const content = listRes.data?.body?.content || [];
            
            const dbNotifs = content.map(item => ({
                id: item.id,
                message: item.message,
                timeText: formatNotifTime(item.createdAt),
                isRead: item.isRead || false
            }));

            setNotifications(dbNotifs);
        } catch (e) {
            console.warn("Notifications API load failed:", e);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    const formatNotifTime = (dateStr) => {
        if (!dateStr) return "Just now";
        try {
            const diff = Date.now() - new Date(dateStr).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 60) return `${mins}m ago`;
            const hours = Math.floor(mins / 60);
            if (hours < 24) return `${hours}h ago`;
            return `${Math.floor(hours / 24)}d ago`;
        } catch (e) {
            return "1d ago";
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            loadNotificationData();
            const interval = setInterval(loadNotificationData, 30000);
            return () => clearInterval(interval);
        }
    }, [isAuthenticated]);

    // Handle click outside to close popover panel
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifPanel(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMarkAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (e) {
            console.error(e);
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }
    };

    const handleMarkSingleRead = async (item) => {
        if (item.isRead) return;
        try {
            if (!item.isMock) {
                await notificationApi.markAsRead(item.id);
            }
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
            setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    return (
        <div className="af-container">
            <style>{`
                .af-notif-popover {
                    position: absolute;
                    top: 48px;
                    right: -60px;
                    width: 320px;
                    background: #fff;
                    border: 1px solid var(--color-outline-variant);
                    border-radius: var(--radius-lg);
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
                    z-index: 1000;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    animation: notif-fade-in 0.15s ease-out;
                }
                @keyframes notif-fade-in {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .af-notif-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 14px 18px;
                    border-bottom: 1px solid var(--color-outline-variant);
                }
                .af-notif-title {
                    font-family: var(--font-headline);
                    font-size: 16px;
                    font-weight: 700;
                    color: var(--color-primary);
                    margin: 0;
                }
                .af-notif-mark-btn {
                    background: transparent;
                    border: none;
                    font-family: var(--font-ui);
                    font-size: 12px;
                    font-weight: 700;
                    color: var(--color-outline);
                    cursor: pointer;
                    padding: 0;
                }
                .af-notif-mark-btn:hover {
                    text-decoration: underline;
                    color: var(--color-primary);
                }
                .af-notif-list {
                    max-height: 320px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                }
                .af-notif-empty {
                    padding: 24px;
                    text-align: center;
                    color: var(--color-outline);
                    font-family: var(--font-body);
                    font-size: 13px;
                }
                .af-notif-item {
                    padding: 14px 18px;
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    cursor: pointer;
                    transition: background 0.15s;
                    text-align: left;
                }
                .af-notif-item:last-child {
                    border-bottom: none;
                }
                .af-notif-item:hover {
                    background: #f8fafc;
                }
                .af-notif-item.unread {
                    background: #f0fdfa;
                }
                .af-notif-item.unread:hover {
                    background: #ecfdf5;
                }
                .af-notif-msg {
                    font-family: var(--font-body);
                    font-size: 13px;
                    line-height: 1.45;
                    color: var(--color-on-surface);
                    margin: 0;
                }
                .af-notif-time {
                    font-family: var(--font-data);
                    font-size: 11px;
                    color: var(--color-outline);
                }
            `}</style>
            {/* ── Sidebar ── */}
            <aside className="af-sidebar">
                {/* Brand */}
                <div className="af-sidebar__brand">
                    <h1>Academic<br />Forum</h1>
                    <p>Journal Trend Tracking</p>
                </div>

                {/* Navigation */}
                <nav className="af-sidebar__nav">
                    {navItems
                        .filter(({ to }) => to !== "/admin" || user?.role === "ADMIN")
                        .map(({ to, icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `af-nav-item${isActive ? " active" : ""}`
                            }
                        >
                            <span
                                className="material-symbols-outlined"
                                style={{
                                    fontVariationSettings:
                                        location.pathname === to
                                            ? "'FILL' 1"
                                            : "'FILL' 0",
                                }}
                            >
                                {icon}
                            </span>
                            <span>{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom actions */}
                <div className="af-sidebar__bottom">
                    <button
                        className="af-sidebar__new-analysis"
                        onClick={() => navigate("/trends")}
                    >
                        New Analysis
                    </button>

                    <a
                        href="#profile"
                        className="af-nav-item"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate("/dashboard");
                        }}
                    >
                        <span className="material-symbols-outlined">account_circle</span>
                        <span>{user?.name || user?.username || "Profile"}</span>
                    </a>

                    <a
                        href="#logout"
                        className="af-nav-item"
                        onClick={handleLogout}
                        style={{ color: "var(--color-error)" }}
                    >
                        <span
                            className="material-symbols-outlined"
                            style={{ color: "var(--color-error)" }}
                        >
                            logout
                        </span>
                        <span>Logout</span>
                    </a>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="af-main">
                {/* Topbar */}
                <header className="af-topbar">
                    <h2 className="af-topbar__title">{getPageTitle()}</h2>

                    <div className="af-topbar__right">
                        {/* Global search (hidden on Search Papers page) */}
                        {location.pathname !== "/papers/search" && (
                            <div className="af-topbar__search">
                                <span className="material-symbols-outlined search-icon">
                                    search
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search papers, keywords…"
                                    onFocus={() => {
                                        if (location.pathname !== "/papers/search") {
                                            navigate("/papers/search");
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" &&
                                            e.target.value.trim()
                                        ) {
                                            navigate(
                                                `/papers/search?keyword=${encodeURIComponent(
                                                    e.target.value.trim()
                                                )}`
                                            );
                                            e.target.value = ""; // Clear input after search
                                        }
                                    }}
                                />
                            </div>
                        )}

                        <div className="af-topbar__actions">
                            <div style={{ position: "relative" }} ref={notifRef}>
                                <button
                                    className="af-icon-btn"
                                    title="Notifications"
                                    onClick={() => setShowNotifPanel(!showNotifPanel)}
                                    style={{ position: "relative", cursor: "pointer", border: "none", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}
                                >
                                    <span className="material-symbols-outlined">notifications</span>
                                    {unreadCount > 0 && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "2px",
                                                right: "2px",
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                background: "#ef4444",
                                                border: "1.5px solid #fff"
                                            }}
                                        />
                                    )}
                                </button>

                                {showNotifPanel && (
                                    <div className="af-notif-popover">
                                        <div className="af-notif-header">
                                            <h3 className="af-notif-title">Notifications</h3>
                                            <button className="af-notif-mark-btn" onClick={handleMarkAllAsRead}>
                                                Mark all as read
                                            </button>
                                        </div>
                                        <div className="af-notif-list">
                                            {notifications.length === 0 ? (
                                                <div className="af-notif-empty">No notifications</div>
                                            ) : (
                                                notifications.map(item => (
                                                    <div
                                                        key={item.id}
                                                        className={`af-notif-item ${item.isRead ? 'read' : 'unread'}`}
                                                        onClick={() => handleMarkSingleRead(item)}
                                                    >
                                                        <p className="af-notif-msg">{item.message}</p>
                                                        <span className="af-notif-time">{item.timeText}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="af-topbar__avatar" title={user?.username}>
                                {user?.name
                                    ? user.name.charAt(0).toUpperCase()
                                    : user?.username
                                    ? user.username.charAt(0).toUpperCase()
                                    : "A"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <div className="af-page-content">{children}</div>
            </main>
        </div>
    );
}

export default Layout;

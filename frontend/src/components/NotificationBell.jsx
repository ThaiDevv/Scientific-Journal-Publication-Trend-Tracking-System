import { useEffect, useState, useCallback } from "react";
import { Badge, Dropdown, List, Typography, Empty, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
    getNotifications,
    getUnreadCount,
    markAsRead,
} from "../api/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;

function NotificationBell() {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [countRes, notifyRes] = await Promise.all([
                getUnreadCount(),
                getNotifications(0, 5),
            ]);

            setUnreadCount(countRes.data.body ?? 0);
            setNotifications(notifyRes.data.body?.content ?? []);
        } catch (e) {
            console.error("NotificationBell fetchData error:", e);
        }
    }, []);

    useEffect(() => {

        let mounted = true;

        const safeFetch = async () => {
            if (!mounted) return;
            setLoading(true);
            await fetchData();
            if (mounted) setLoading(false);
        };

        safeFetch();

        const interval = setInterval(() => {
            if (!document.hidden) fetchData();
        }, 60000);

        const handleVisibility = () => {
            if (!document.hidden) {
                fetchData();
            }
        };

        document.addEventListener("visibilitychange", handleVisibility);

        return () => {
            mounted = false;
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibility);
        };

    }, [fetchData]);

    /**
     * Khi click vào một thông báo trong dropdown:
     * - Nếu chưa đọc thì gọi API đánh dấu đã đọc và cập nhật count
     * - Navigate đến trang /notifications
     */
    const handleItemClick = async (item) => {
        // isRead được backend serialize là "read" (Lombok Boolean + Jackson)
        const isAlreadyRead = item.read === true || item.isRead === true;
        if (!isAlreadyRead) {
            try {
                await markAsRead(item.id);
                setUnreadCount((prev) => Math.max(0, prev - 1));
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === item.id ? { ...n, read: true, isRead: true } : n
                    )
                );
            } catch (e) {
                console.error("markAsRead error:", e);
            }
        }
        navigate("/notifications");
    };

    const dropdownRender = () => (

        <div
            style={{
                width: 380,
                background: "#fff",
                borderRadius: 10,
                boxShadow: "0 6px 20px rgba(0,0,0,.12)",
                overflow: "hidden",
            }}
        >

            <div
                style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: 700,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <span>🔔 Thông báo</span>
                {unreadCount > 0 && (
                    <Badge
                        count={unreadCount}
                        style={{ backgroundColor: "#ff4d4f" }}
                    />
                )}
            </div>

            {loading ? (
                <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <Spin size="small" />
                </div>
            ) : notifications.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Chưa có thông báo"
                    style={{ padding: "24px 0" }}
                />
            ) : (
                <List
                    dataSource={notifications}
                    renderItem={(item) => {
                        // Backend có thể serialize isRead thành "read" hoặc "isRead"
                        const isRead = item.read === true || item.isRead === true;
                        return (
                            <List.Item
                                style={{
                                    cursor: "pointer",
                                    background: isRead ? "#fff" : "#e6f4ff",
                                    padding: "12px 16px",
                                    borderBottom: "1px solid #f5f5f5",
                                    transition: "background 0.2s",
                                }}
                                onClick={() => handleItemClick(item)}
                            >
                                <List.Item.Meta
                                    avatar={
                                        <div
                                            style={{
                                                width: 8,
                                                height: 8,
                                                borderRadius: "50%",
                                                background: isRead ? "transparent" : "#1677ff",
                                                marginTop: 6,
                                                flexShrink: 0,
                                            }}
                                        />
                                    }
                                    title={
                                        <Text
                                            strong={!isRead}
                                            style={{ fontSize: 13 }}
                                        >
                                            {item.title}
                                        </Text>
                                    }
                                    description={
                                        <>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    color: "#555",
                                                    marginBottom: 2,
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                    whiteSpace: "nowrap",
                                                    maxWidth: 270,
                                                }}
                                            >
                                                {item.message}
                                            </div>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 11 }}
                                            >
                                                {dayjs(item.createdAt).fromNow()}
                                            </Text>
                                        </>
                                    }
                                />
                            </List.Item>
                        );
                    }}
                />
            )}

            <div
                style={{
                    padding: "10px 16px",
                    textAlign: "center",
                    borderTop: "1px solid #f0f0f0",
                    cursor: "pointer",
                    color: "#1677ff",
                    fontWeight: 500,
                    fontSize: 13,
                }}
                onClick={() => navigate("/notifications")}
            >
                Xem tất cả thông báo →
            </div>

        </div>

    );

    return (

        <Dropdown
            trigger={["click"]}
            dropdownRender={dropdownRender}
            placement="bottomRight"
        >

            <Badge count={unreadCount} size="small" overflowCount={99}>

                <BellOutlined
                    style={{
                        fontSize: 22,
                        cursor: "pointer",
                    }}
                />

            </Badge>

        </Dropdown>

    );

}

export default NotificationBell;
import { useEffect, useState, useCallback } from "react";
import {
    Card,
    List,
    Button,
    Pagination,
    Typography,
    Empty,
    Spin,
    message,
    Tag,
} from "antd";

import {
    CheckCircleFilled,
    BellFilled,
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from "../api/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;

/**
 * Hàm helper để xác định trạng thái đã đọc của notification.
 * Backend có thể serialize "Boolean isRead" của Lombok thành "read" hoặc "isRead"
 * tùy vào phiên bản Jackson / cấu hình. Hàm này xử lý cả hai trường hợp.
 */
function isNotifRead(item) {
    return item.read === true || item.isRead === true;
}

function Notifications() {

    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [total, setTotal] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingAll, setMarkingAll] = useState(false);

    const loadNotifications = useCallback(async (currentPage = 1) => {
        try {
            setLoading(true);

            const [notifyRes, countRes] = await Promise.all([
                getNotifications(currentPage - 1, pageSize),
                getUnreadCount(),
            ]);

            setNotifications(notifyRes.data.body?.content ?? []);
            setTotal(notifyRes.data.body?.totalElements ?? 0);
            setUnreadCount(countRes.data.body ?? 0);

        } catch (e) {
            console.error("Notifications loadNotifications error:", e);
            message.error("Không thể tải thông báo");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            await loadNotifications(1);
        })();
    }, [loadNotifications]);

    const handleRead = async (notification) => {

        if (isNotifRead(notification)) return;

        try {
            await markAsRead(notification.id);

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, read: true, isRead: true }
                        : item
                )
            );

            setUnreadCount((prev) => Math.max(0, prev - 1));

        } catch (e) {
            console.error("markAsRead error:", e);
            message.error("Không thể cập nhật trạng thái thông báo");
        }

    };

    const handleReadAll = async () => {

        try {
            setMarkingAll(true);
            await markAllAsRead();

            message.success("Đã đánh dấu tất cả đã đọc");

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    read: true,
                    isRead: true,
                }))
            );
            setUnreadCount(0);

        } catch (e) {
            console.error("markAllAsRead error:", e);
            message.error("Có lỗi xảy ra, vui lòng thử lại");
        } finally {
            setMarkingAll(false);
        }

    };

    return (

        <div
            style={{
                maxWidth: 860,
                margin: "0 auto",
                padding: "32px 24px",
            }}
        >

            {/* ─── Header ──────────────────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        Thông báo
                    </Title>
                    {unreadCount > 0 && (
                        <Tag
                            color="blue"
                            style={{
                                borderRadius: 99,
                                fontWeight: 600,
                                fontSize: 12,
                                padding: "0 8px",
                            }}
                        >
                            {unreadCount} chưa đọc
                        </Tag>
                    )}
                </div>

                <Button
                    type="primary"
                    onClick={handleReadAll}
                    loading={markingAll}
                    disabled={unreadCount === 0}
                >
                    Đánh dấu tất cả đã đọc
                </Button>

            </div>

            {/* ─── Content ─────────────────────────────────────────── */}
            {loading ? (

                <div
                    style={{
                        textAlign: "center",
                        padding: "80px 0",
                    }}
                >
                    <Spin size="large" />
                </div>

            ) : notifications.length === 0 ? (

                <Empty
                    description="Chưa có thông báo nào"
                    style={{ padding: "60px 0" }}
                />

            ) : (

                <>

                    <List
                        dataSource={notifications}
                        renderItem={(item) => {
                            const read = isNotifRead(item);
                            return (
                                <Card
                                    key={item.id}
                                    style={{
                                        marginBottom: 12,
                                        cursor: read ? "default" : "pointer",
                                        background: read ? "#fff" : "#e6f4ff",
                                        borderLeft: `4px solid ${read ? "#d9d9d9" : "#1677ff"}`,
                                        borderRadius: 8,
                                        transition:
                                            "box-shadow 0.2s, background 0.2s",
                                    }}
                                    styles={{ body: { padding: "14px 18px" } }}
                                    hoverable={!read}
                                    onClick={() => handleRead(item)}
                                >

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 14,
                                        }}
                                    >

                                        {/* Icon trạng thái */}
                                        {read ? (
                                            <CheckCircleFilled
                                                style={{
                                                    color: "#52c41a",
                                                    fontSize: 20,
                                                    marginTop: 2,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <BellFilled
                                                style={{
                                                    color: "#1677ff",
                                                    fontSize: 20,
                                                    marginTop: 2,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}

                                        {/* Nội dung thông báo */}
                                        <div style={{ flex: 1, minWidth: 0 }}>

                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent: "space-between",
                                                    alignItems: "flex-start",
                                                    gap: 8,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                <Text
                                                    strong={!read}
                                                    style={{ fontSize: 14 }}
                                                >
                                                    {item.title}
                                                </Text>
                                                <Text
                                                    type="secondary"
                                                    style={{
                                                        fontSize: 11,
                                                        whiteSpace: "nowrap",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {dayjs(item.createdAt).fromNow()}
                                                </Text>
                                            </div>

                                            <Text
                                                style={{
                                                    fontSize: 13,
                                                    color: "#555",
                                                    display: "block",
                                                }}
                                            >
                                                {item.message}
                                            </Text>

                                            {!read && (
                                                <Text
                                                    style={{
                                                        fontSize: 11,
                                                        color: "#1677ff",
                                                        marginTop: 4,
                                                        display: "block",
                                                    }}
                                                >
                                                    Click để đánh dấu đã đọc
                                                </Text>
                                            )}

                                        </div>

                                    </div>

                                </Card>
                            );
                        }}
                    />

                    {/* ─── Pagination ──────────────────────────────── */}
                    {total > pageSize && (
                        <div
                            style={{
                                textAlign: "center",
                                marginTop: 24,
                            }}
                        >
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={pageSize}
                                showTotal={(t) => `Tổng ${t} thông báo`}
                                onChange={(p) => {
                                    setPage(p);
                                    loadNotifications(p);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                            />
                        </div>
                    )}

                </>

            )}

        </div>

    );

}

export default Notifications;
import { useEffect, useState } from "react";
import {
    Card,
    List,
    Button,
    Pagination,
    Typography,
    Empty,
    Spin,
    message,
} from "antd";

import {
    CheckCircleOutlined,
    BellOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
    getNotifications,
    markAsRead,
    markAllAsRead,
} from "../api/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Title, Text } = Typography;

function Notifications() {

    const [loading, setLoading] = useState(false);

    const [notifications, setNotifications] = useState([]);

    const [page, setPage] = useState(1);

    const pageSize = 10;

    const [total, setTotal] = useState(0);

    const loadNotifications = async (currentPage = page) => {

        try {

            setLoading(true);

            const res = await getNotifications(
                currentPage - 1,
                pageSize
            );

            setNotifications(res.data.body.content);

            setTotal(res.data.body.totalElements);

        } catch (e) {

            console.log(e);

            message.error("Không thể tải thông báo");

        } finally {

            setLoading(false);

        }

    };

    useEffect(() => {
        const init = async () => {
            await loadNotifications(1);
        };

        init();
    }, []);

    const handleRead = async (notification) => {

        if (notification.isRead) return;

        try {

            await markAsRead(notification.id);

            setNotifications((prev) =>
                prev.map((item) =>
                    item.id === notification.id
                        ? { ...item, isRead: true }
                        : item
                )
            );

        } catch (e) {

            console.log(e);

            message.error("Không thể cập nhật");

        }

    };

    const handleReadAll = async () => {

        try {

            await markAllAsRead();

            message.success("Đã đánh dấu tất cả đã đọc");

            setNotifications((prev) =>
                prev.map((item) => ({
                    ...item,
                    isRead: true,
                }))
            );

        } catch (e) {

            console.log(e);

            message.error("Có lỗi xảy ra");

        }

    };

    return (

        <div
            style={{
                maxWidth: 1200,
                margin: "0 auto",
                padding: 24,
            }}
        >

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}
            >

                <Title level={2} style={{ margin: 0 }}>
                    🔔 Thông báo
                </Title>

                <Button
                    type="primary"
                    onClick={handleReadAll}
                >
                    Đánh dấu tất cả đã đọc
                </Button>

            </div>

            {

                loading ?

                    <div
                        style={{
                            textAlign: "center",
                            padding: 100,
                        }}
                    >
                        <Spin size="large" />
                    </div>

                    :

                    notifications.length === 0 ?

                        <Empty
                            description="Chưa có thông báo"
                        />

                        :

                        <>

                            <List

                                dataSource={notifications}

                                renderItem={(item) => (

                                    <Card

                                        style={{
                                            marginBottom: 16,
                                            cursor: "pointer",
                                            background: item.isRead
                                                ? "#fff"
                                                : "#e6f4ff",
                                            borderLeft: item.isRead
                                                ? "4px solid #d9d9d9"
                                                : "4px solid #1677ff",
                                        }}

                                        onClick={() =>
                                            handleRead(item)
                                        }

                                    >

                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 16,
                                            }}
                                        >

                                            {

                                                item.isRead ?

                                                    <CheckCircleOutlined
                                                        style={{
                                                            color: "#52c41a",
                                                            fontSize: 20,
                                                            marginTop: 5,
                                                        }}
                                                    />

                                                    :

                                                    <BellOutlined
                                                        style={{
                                                            color: "#1677ff",
                                                            fontSize: 20,
                                                            marginTop: 5,
                                                        }}
                                                    />

                                            }

                                            <div
                                                style={{
                                                    flex: 1,
                                                }}
                                            >

                                                <Title
                                                    level={5}
                                                    style={{
                                                        marginBottom: 6,
                                                    }}
                                                >
                                                    {item.title}
                                                </Title>

                                                <Text>
                                                    {item.message}
                                                </Text>

                                                <br />

                                                <Text
                                                    type="secondary"
                                                >
                                                    {dayjs(item.createdAt).fromNow()}
                                                </Text>

                                            </div>

                                        </div>

                                    </Card>

                                )}

                            />

                            <div
                                style={{
                                    textAlign: "center",
                                    marginTop: 30,
                                }}
                            >

                                <Pagination

                                    current={page}

                                    total={total}

                                    pageSize={pageSize}

                                    onChange={(p) => {

                                        setPage(p);

                                        loadNotifications(p);

                                    }}

                                />

                            </div>

                        </>

            }

        </div>

    );

}

export default Notifications;
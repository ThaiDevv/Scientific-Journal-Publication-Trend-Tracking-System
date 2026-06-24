import { useEffect, useState } from "react";
import { Badge, Dropdown, List, Typography, Empty } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

import {
    getNotifications,
    getUnreadCount,
} from "../api/notificationApi";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const { Text } = Typography;

function NotificationBell() {

    const navigate = useNavigate();

    const [notifications, setNotifications] = useState([]);

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {

        let mounted = true;

        const fetchData = async () => {

            try {

                const [countRes, notifyRes] = await Promise.all([
                    getUnreadCount(),
                    getNotifications(0, 5),
                ]);

                if (!mounted) return;

                setUnreadCount(countRes.data.body);
                setNotifications(notifyRes.data.body.content);

            } catch (e) {

                console.log(e);

            }

        };

        fetchData();

        const interval = setInterval(fetchData, 60000);

        const handleVisibility = () => {
            if (!document.hidden) {
                fetchData();
            }
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibility
        );

        return () => {
            mounted = false;
            clearInterval(interval);
            document.removeEventListener(
                "visibilitychange",
                handleVisibility
            );
        };

    }, []);

    const dropdownRender = () => (

        <div
            style={{
                width: 360,
                background: "#fff",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0,0,0,.15)",
            }}
        >

            <div
                style={{
                    padding: 12,
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: 600,
                }}
            >
                Thông báo
            </div>

            {
                notifications.length === 0 ?

                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Chưa có thông báo"
                    />

                    :

                    <List

                        dataSource={notifications}

                        renderItem={(item) => (

                            <List.Item

                                style={{
                                    cursor: "pointer",
                                    background: item.isRead
                                        ? "#fff"
                                        : "#e6f4ff",
                                    padding: "12px 16px",
                                }}

                                onClick={() =>

                                    navigate("/notifications")

                                }

                            >

                                <List.Item.Meta

                                    title={
                                        <Text strong>
                                            {item.title}
                                        </Text>
                                    }

                                    description={
                                        <>
                                            <div>
                                                {item.message}
                                            </div>

                                            <Text
                                                type="secondary"
                                                style={{
                                                    fontSize: 12,
                                                }}
                                            >
                                                {dayjs(item.createdAt).fromNow()}
                                            </Text>
                                        </>
                                    }

                                />

                            </List.Item>

                        )}

                    />

            }

            <div
                style={{
                    padding: 12,
                    textAlign: "center",
                    borderTop: "1px solid #f0f0f0",
                    cursor: "pointer",
                    color: "#1677ff",
                }}
                onClick={() => navigate("/notifications")}
            >
                Xem tất cả
            </div>

        </div>

    );

    return (

        <Dropdown

            trigger={["click"]}

            dropdownRender={dropdownRender}

            placement="bottomRight"

        >

            <Badge
                count={unreadCount}
                size="small"
            >

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
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, List, Typography, Skeleton } from 'antd';
import {
    FileTextOutlined,
    BookOutlined,
    TeamOutlined,
    TagOutlined,
    ArrowUpOutlined,
    StarOutlined,
} from "@ant-design/icons";
import { trendApi } from '../api/trendApi';
import TrendLineChart from '../components/Charts/TrendLineChart';
import { dashboardApi } from '../api/dashboardApi';
import { useNavigate } from "react-router-dom";

import { Badge } from "antd";
import { BellOutlined } from "@ant-design/icons";

import { getUnreadCount } from "../api/notificationApi";
import { getMyBookmarks } from "../api/bookmarkApi";

// === JP-37 THÊM MỚI: Import 2 Component biểu đồ mới ===
import JournalBarChart from '../components/Charts/JournalBarChart';
import FieldPieChart from '../components/Charts/FieldPieChart';
// =======================================================

const { Title, Text } = Typography;

const Dashboard = () => {
    const navigate = useNavigate();
    // 1. Dữ liệu cho JP-35 (Các ô số liệu)
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // 2. Dữ liệu cho JP-36 (Biểu đồ đường)
    const [trendData, setTrendData] = useState([]);
    const [loadingTrend, setLoadingTrend] = useState(true);

    // === JP-37 THÊM MỚI: State cho Biểu đồ Cột và Biểu đồ Tròn ===
    const [journalData, setJournalData] = useState([]);
    const [fieldData, setFieldData] = useState([]);
    const [loadingCharts, setLoadingCharts] = useState(true);
    // ==========================================================

    // 3. Dữ liệu cho Recent Papers (Kết nối API thực tế từ backend)
    const [recentPapers, setRecentPapers] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const [bookmarkCount, setBookmarkCount] = useState(0);
    const loadUnreadCount = async () => {
        try {
            const res = await getUnreadCount();
            setUnreadCount(res.data.body);
        } catch (e) {
            console.log(e);
        }
    };
    const loadBookmarkCount = async () => {
        try {
            const res = await getMyBookmarks(0, 1);
            setBookmarkCount(res.data.body.totalElements);
        } catch (e) {
            console.log(e);
        }
    };
    useEffect(() => {
        async function init() {
            try {
                const [unreadRes, bookmarkRes] = await Promise.all([
                    getUnreadCount(),
                    getMyBookmarks(0, 1),
                ]);

                setUnreadCount(unreadRes.data.body);
                setBookmarkCount(bookmarkRes.data.body.totalElements);
            } catch (e) {
                console.log(e);
            }
        }

        init();
        // Lấy stats (JP-35) - có fallback mock data
        dashboardApi.getStats()
            .then(response => {
                setStats(response.data?.body || response.data);
                setLoading(false);
            })
            .catch(error => {
                console.warn("Lỗi kết nối Stats (chưa có API), dùng fallback mock data:", error);
                setStats({
                    totalPapers: 125,
                    totalJournals: 12,
                    totalAuthors: 48,
                    totalKeywords: 89,
                    growth: "+15 bài mới tháng này"
                });
                setLoading(false);
            });

        // Lấy Trend Data (JP-36) - có fallback mock data
        const compareKeywords = ["AI", "Blockchain", "Quantum"];
        setLoadingTrend(true);
        trendApi.getCompareTrends(compareKeywords)
            .then(response => {
                setTrendData(response.data?.body || response.data);
                setLoadingTrend(false);
            })
            .catch(error => {
                console.warn("Lỗi kết nối Trend (chưa có API), dùng fallback mock data:", error);
                setTrendData([
                    { year: '2022', AI: 30, Blockchain: 10, Quantum: 5 },
                    { year: '2023', AI: 45, Blockchain: 18, Quantum: 8 },
                    { year: '2024', AI: 75, Blockchain: 25, Quantum: 12 },
                    { year: '2025', AI: 110, Blockchain: 30, Quantum: 20 },
                    { year: '2026', AI: 150, Blockchain: 45, Quantum: 35 }
                ]);
                setLoadingTrend(false);
            });

        // === JP-37: Gọi API cho Bar và Pie Chart - có fallback mock data ===
        setLoadingCharts(true);
        Promise.all([
            dashboardApi.getTopJournals(),
            dashboardApi.getFieldDistribution()
        ])
            .then(([journalRes, fieldRes]) => {
                setJournalData(journalRes.data?.body || journalRes.data);
                setFieldData(fieldRes.data?.body || fieldRes.data);
                setLoadingCharts(false);
            })
            .catch(error => {
                console.warn("Lỗi kết nối Charts (chưa có API), dùng fallback mock data:", error);
                setJournalData([
                    { name: 'IEEE Access', paperCount: 45 },
                    { name: 'ACM Computing Surveys', paperCount: 32 },
                    { name: 'Nature', paperCount: 28 },
                    { name: 'Springer Journal', paperCount: 20 }
                ]);
                setFieldData([
                    { name: 'Computer Science', value: 65 },
                    { name: 'Mathematics', value: 20 },
                    { name: 'Physics', value: 15 }
                ]);
                setLoadingCharts(false);
            });

        // 4. Lấy Recent Papers (API thực tế từ backend)
        setLoadingRecent(true);
        dashboardApi.getRecentPapers()
            .then(response => {
                const data = response.data?.body;
                setRecentPapers(Array.isArray(data) ? data : (data?.content || []));
                setLoadingRecent(false);
            })
            .catch(error => {
                console.warn("Lỗi kết nối Recent Papers:", error);
                setRecentPapers([
                    { id: 1, title: 'Deep Learning Approaches in Image Recognition', journalName: 'IEEE Access', publicationYear: 2026 },
                    { id: 2, title: 'Blockchain Security in Smart IoT Systems', journalName: 'ACM Computing Surveys', publicationYear: 2025 }
                ]);
                setLoadingRecent(false);
            });
        const interval = setInterval(() => {
            loadUnreadCount();
            loadBookmarkCount();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 15 }} /></div>;

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            <Row
                justify="space-between"
                align="middle"
                style={{ marginBottom: 24 }}
            >
                <Col>
                    <Title level={2} style={{ margin: 0 }}>
                        Research Dashboard
                    </Title>
                </Col>

                <Col>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 24,
                        }}
                    >
                        {/* Bookmark */}
                        <Badge count={bookmarkCount} size="small">
                            <StarOutlined
                                style={{
                                    fontSize: 24,
                                    cursor: "pointer",
                                }}
                                onClick={() => navigate("/bookmarks")}
                            />
                        </Badge>

                        {/* Notification */}
                        <Badge count={unreadCount} size="small">
                            <BellOutlined
                                style={{
                                    fontSize: 24,
                                    cursor: "pointer",
                                }}
                                onClick={() => navigate("/notifications")}
                            />
                        </Badge>
                    </div>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
                <Col xs={24} md={8}>
                    <Card
                        hoverable
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate("/papers/search")}
                    >
                        <Title level={4}>🔍 Search Papers</Title>
                        <Text>
                            Tìm kiếm bài báo theo từ khóa, tác giả hoặc journal
                        </Text>
                    </Card>
                </Col>
            </Row>
            {/* Row 1: Stat Cards (JP-35) */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Tổng số bài báo" value={stats?.totalPapers || 0} prefix={<FileTextOutlined />} />
                        <Text type="success">
                            {stats?.growth || (stats?.papersThisMonth !== undefined ? `+${stats.papersThisMonth} bài mới tháng này` : "+0 tháng này")}
                        </Text>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Tổng số Journals" value={stats?.totalJournals || 0} prefix={<BookOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Tổng số Tác giả" value={stats?.totalAuthors || 0} prefix={<TeamOutlined />} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false}>
                        <Statistic title="Keywords" value={stats?.totalKeywords || 0} prefix={<TagOutlined />} />
                    </Card>
                </Col>
            </Row>

            {/* Row 2: Biểu đồ đường (JP-36) */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={16}>
                    <Card title="So sánh xu hướng nghiên cứu (AI vs Blockchain vs Quantum)" bordered={false}>
                        <TrendLineChart
                            data={trendData}
                            keywords={["AI", "Blockchain", "Quantum"]}
                            loading={loadingTrend}
                        />
                    </Card>
                </Col>
                <Col xs={24} lg={8}>
                    <Card title="Trending Topics" bordered={false}>
                        <List
                            dataSource={['AI', 'Blockchain', 'Quantum Computing']}
                            renderItem={item => (
                                <List.Item>
                                    <Text strong>{item}</Text>
                                    <Text type="success"><ArrowUpOutlined /> 15%</Text>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>

            {/* === JP-37 THÊM MỚI: Row 3 hiển thị Bar Chart và Pie Chart === */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} lg={12}>
                    <Card title="Top Journals (Số lượng bài báo)" bordered={false}>
                        <JournalBarChart data={journalData} loading={loadingCharts} />
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card title="Phân bố theo lĩnh vực nghiên cứu" bordered={false}>
                        <FieldPieChart data={fieldData} loading={loadingCharts} />
                    </Card>
                </Col>
            </Row>
            {/* ============================================================ */}

            {/* Row 4: Recent Papers */}
            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24}>
                    <Card title="Recent Papers" bordered={false}>
                        <List
                            loading={loadingRecent}
                            itemLayout="horizontal"
                            dataSource={recentPapers}
                            renderItem={item => (
                                <List.Item actions={[<a key="view" onClick={() => navigate(`/papers/${item.id}`)}>View</a>]}>
                                    <List.Item.Meta 
                                        title={<a onClick={() => navigate(`/papers/${item.id}`)}>{item.title}</a>} 
                                        description={`${item.journalName || 'Unknown Journal'} - ${item.publicationYear || 'N/A'}`} 
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default Dashboard;
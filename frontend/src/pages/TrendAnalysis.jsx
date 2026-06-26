import React, { useState, useEffect } from 'react';
import { Row, Col, Card, AutoComplete, Button, Tag, Space, Table, Typography, InputNumber, message, List, Divider } from 'antd';
import { PlusOutlined, LineChartOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import TrendLineChart from '../components/Charts/TrendLineChart'; // Component JP-36
import WordCloudChart from '../components/Charts/WordCloud';       // Component JP-39 mới thêm
import { trendApi } from '../api/trendApi';

const { Title, Text } = Typography;

const TrendAnalysis = () => {
    // 1. States cho Control Section
    const [inputValue, setInputValue] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState(['Machine Learning']);
    const [yearRange, setYearRange] = useState([2020, 2024]);

    // 2. States cho Data
    const [chartData, setChartData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [trendingKeywords, setTrendingKeywords] = useState([]);
    const [loading, setLoading] = useState(false);

    // Lấy top 50 keywords từ API khi vừa load trang
    const [loadingKeywords, setLoadingKeywords] = useState(true);

    useEffect(() => {
        setLoadingKeywords(true);
        trendApi.getTopKeywords(50) // Gọi limit=50 theo yêu cầu JP-39 để Word Cloud đẹp hơn
            .then(res => {
                const list = res.data?.body || res.data?.data || res.data || [];
                const mappedKeywords = list.map(kw => ({
                    text: kw.name,
                    value: kw.usageCount
                }));
                setTrendingKeywords(mappedKeywords);
                setLoadingKeywords(false);
            })
            .catch(err => {
                console.error("Lỗi lấy danh sách gợi ý từ backend:", err);
                setTrendingKeywords([
                    { text: 'machine learning', value: 250 },
                    { text: 'deep learning', value: 210 },
                    { text: 'artificial intelligence', value: 195 },
                    { text: 'blockchain', value: 160 },
                    { text: 'quantum computing', value: 140 },
                    { text: 'data science', value: 130 },
                    { text: 'neural networks', value: 120 },
                    { text: 'computer vision', value: 115 },
                    { text: 'natural language processing', value: 110 },
                    { text: 'cybersecurity', value: 95 },
                    { text: 'cloud computing', value: 90 },
                    { text: 'big data', value: 85 },
                    { text: 'internet of things', value: 80 },
                    { text: 'edge computing', value: 75 },
                    { text: 'robotics', value: 70 },
                    { text: 'cryptography', value: 68 },
                    { text: 'bioinformatics', value: 65 },
                    { text: 'smart contract', value: 60 },
                    { text: 'image processing', value: 58 },
                    { text: 'reinforcement learning', value: 55 },
                    { text: 'data mining', value: 52 },
                    { text: 'semantic web', value: 50 },
                    { text: 'augmented reality', value: 48 },
                    { text: 'virtual reality', value: 45 },
                    { text: 'parallel computing', value: 42 },
                    { text: 'distributed systems', value: 40 },
                    { text: 'data privacy', value: 38 },
                    { text: 'information retrieval', value: 35 },
                    { text: 'optimization algorithms', value: 32 },
                    { text: 'database systems', value: 30 },
                    { text: 'software engineering', value: 28 },
                    { text: 'network security', value: 25 }
                ]);
                setLoadingKeywords(false);
            });

        // Gọi hàm phân tích lần đầu
        handleAnalyze(['Machine Learning']);
        // eslint-disable-next-line
    }, []);

    // Logic: Thêm keyword (Giới hạn tối đa 5)
    const handleAddKeyword = (keyword) => {
        const val = keyword || inputValue;
        if (!val.trim()) return;

        if (selectedKeywords.includes(val)) return message.warning('Keyword này đã có!');
        if (selectedKeywords.length >= 5) return message.error('Tối đa 5 keywords compare!');

        setSelectedKeywords([...selectedKeywords, val]);
        setInputValue(''); // Xóa ô input sau khi thêm
    };

    // Logic: Xóa keyword
    const handleRemoveKeyword = (removedKeyword) => {
        setSelectedKeywords(selectedKeywords.filter(kw => kw !== removedKeyword));
    };

    // Logic: Bấm nút "Phân tích" -> Gọi API
    const handleAnalyze = (keywordsToAnalyze = selectedKeywords) => {
        if (keywordsToAnalyze.length === 0) return message.warning('Vui lòng chọn keyword!');

        setLoading(true);
        const params = {
            keywords: keywordsToAnalyze.join(','),
            fromYear: yearRange[0],
            toYear: yearRange[1]
        };

        trendApi.analyzeTrends(params)
            .then(res => {
                const body = res.data?.body || res.data;
                setChartData(body.chartData || []);
                setTableData(body.tableData || []);
                setLoading(false);
                message.success('Cập nhật dữ liệu thành công!');
            })
            .catch(err => {
                console.warn("Chưa có API phân tích xu hướng, sử dụng fallback mock data:", err);
                
                // Giả lập dữ liệu chart
                const mockChartData = Array.from({ length: yearRange[1] - yearRange[0] + 1 }, (_, i) => {
                    const year = yearRange[0] + i;
                    const dataPoint = { year: String(year) };
                    keywordsToAnalyze.forEach(kw => {
                        // Tạo số ngẫu nhiên ngẫu nhiên tăng dần theo năm để trông thực tế
                        dataPoint[kw] = Math.floor(Math.random() * 50) + (i * 20) + 10;
                    });
                    return dataPoint;
                });

                // Giả lập dữ liệu bảng
                const mockTableData = keywordsToAnalyze.map(kw => {
                    const thisYear = Math.floor(Math.random() * 80) + 50;
                    const lastYear = Math.floor(Math.random() * 80) + 30;
                    const growthRate = lastYear > 0 ? Math.round(((thisYear - lastYear) / lastYear) * 100) : 0;
                    return {
                        keyword: kw,
                        totalPapers: thisYear + lastYear + Math.floor(Math.random() * 200),
                        thisYear,
                        lastYear,
                        growthRate
                    };
                });

                setChartData(mockChartData);
                setTableData(mockTableData);
                setLoading(false);
                message.success('Cập nhật dữ liệu thành công (Mock Mode)!');
            });
    };

    // Cấu hình Bảng Statistics (Yêu cầu: Sắp xếp theo growth rate)
    const columns = [
        { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', render: text => <Text strong>{text}</Text> },
        { title: 'Total Papers', dataIndex: 'totalPapers', key: 'totalPapers' },
        { title: 'This Year', dataIndex: 'thisYear', key: 'thisYear' },
        { title: 'Last Year', dataIndex: 'lastYear', key: 'lastYear' },
        {
            title: 'Growth Rate',
            dataIndex: 'growthRate',
            key: 'growthRate',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.growthRate - b.growthRate,
            render: (rate) => (
                <Text type={rate >= 0 ? 'success' : 'danger'}>
                    {rate >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />} {Math.abs(rate)}%
                </Text>
            )
        }
    ];

    return (
        <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
            <Title level={2}>Trend Analysis</Title>

            {/* --- CONTROL SECTION --- */}
            <Card bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={10} lg={8}>
                        <Space.Compact style={{ width: '100%' }}>
                            <AutoComplete
                                style={{ width: '100%' }}
                                placeholder="Nhập keyword..."
                                // Hỗ trợ cả cấu trúc mảng chuỗi hoặc mảng đối tượng dữ liệu của WordCloud
                                options={trendingKeywords.map(kw => ({ value: kw.text || kw.keyword || kw }))}
                                value={inputValue}
                                onChange={setInputValue}
                                onSelect={handleAddKeyword}
                            />
                            <Button type="default" onClick={() => handleAddKeyword()}>Thêm</Button>
                        </Space.Compact>
                    </Col>

                    <Col xs={24} md={10} lg={10}>
                        <Space>
                            <Text>Từ năm:</Text>
                            <InputNumber min={2000} max={2024} value={yearRange[0]} onChange={val => setYearRange([val, yearRange[1]])} />
                            <Text>Đến:</Text>
                            <InputNumber min={2000} max={2024} value={yearRange[1]} onChange={val => setYearRange([yearRange[0], val])} />
                        </Space>
                    </Col>

                    <Col xs={24} md={4} lg={6} style={{ textAlign: 'right' }}>
                        <Button type="primary" icon={<LineChartOutlined />} onClick={() => handleAnalyze()} loading={loading}>
                            Phân tích
                        </Button>
                    </Col>
                </Row>

                <Divider style={{ margin: '16px 0' }} />

                {/* Danh sách Tags đã chọn */}
                <div style={{ minHeight: 32 }}>
                    <Text type="secondary" style={{ marginRight: 8 }}>Keywords so sánh: </Text>
                    {selectedKeywords.map(tag => (
                        <Tag key={tag} closable onClose={() => handleRemoveKeyword(tag)} color="blue" style={{ fontSize: 14 }}>
                            {tag}
                        </Tag>
                    ))}
                </div>
            </Card>

            {/* --- CHART & TRENDING SECTION --- */}
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={16}>
                    <Card title="Biểu đồ So sánh Xu hướng" bordered={false} style={{ minHeight: 400 }}>
                        <TrendLineChart data={chartData} keywords={selectedKeywords} loading={loading} />
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card title="Top Trending Keywords" bordered={false} style={{ minHeight: 400, maxHeight: 400, overflowY: 'auto' }}>
                        <List
                            size="small"
                            dataSource={trendingKeywords}
                            renderItem={(item) => {
                                const keywordText = item.text || item.keyword || item;
                                return (
                                    <List.Item style={{ cursor: 'pointer' }} onClick={() => handleAddKeyword(keywordText)}>
                                        <Text strong>{keywordText}</Text>
                                        <PlusOutlined style={{ color: '#1890ff' }} />
                                    </List.Item>
                                );
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* --- PHẦN WORD CLOUD (JP-39 MỚI BỔ SUNG) --- */}
            <Card title="Xu hướng Từ khóa trực quan (Word Cloud)" bordered={false} style={{ marginTop: 24 }}>
                <WordCloudChart data={trendingKeywords} loading={loadingKeywords} />
            </Card>

            {/* --- STATISTICS SECTION --- */}
            <Card title="Chi tiết Thông số Thống kê" bordered={false} style={{ marginTop: 24 }}>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    loading={loading}
                    pagination={false}
                    rowKey="keyword"
                />
            </Card>
        </div>
    );
};

export default TrendAnalysis;
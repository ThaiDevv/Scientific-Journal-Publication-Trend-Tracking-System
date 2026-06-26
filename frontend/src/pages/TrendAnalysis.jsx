import React, { useState, useEffect } from 'react';
import { Row, Col, Card, AutoComplete, Button, Tag, Space, Table, Typography, InputNumber, message, List, Divider } from 'antd';
import { PlusOutlined, LineChartOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import TrendLineChart from '../components/Charts/TrendLineChart';
import WordCloudChart from '../components/Charts/WordCloud';
import { trendApi } from '../api/trendApi';

const { Title, Text } = Typography;

const TrendAnalysis = () => {
    const [inputValue, setInputValue] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState(['Machine Learning']);
    const [yearRange, setYearRange] = useState([2020, 2024]);

    const [chartData, setChartData] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [trendingKeywords, setTrendingKeywords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingKeywords, setLoadingKeywords] = useState(true);

    useEffect(() => {
        setLoadingKeywords(true);
        trendApi.getTopKeywords(50)
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
                setTrendingKeywords([]);
                setLoadingKeywords(false);
            });

        handleAnalyze(['Machine Learning']);
    }, []);

    const handleAddKeyword = (keyword) => {
        const val = keyword || inputValue;
        if (!val.trim()) return;

        if (selectedKeywords.includes(val)) return message.warning('Keyword này đã có!');
        if (selectedKeywords.length >= 5) return message.error('Tối đa 5 keywords compare!');

        setSelectedKeywords([...selectedKeywords, val]);
        setInputValue('');
    };

    const handleRemoveKeyword = (removedKeyword) => {
        setSelectedKeywords(selectedKeywords.filter(kw => kw !== removedKeyword));
    };

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
                console.error("Lỗi phân tích xu hướng:", err);
                setChartData([]);
                setTableData([]);
                setLoading(false);
            });
    };

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

            <Card bordered={false} style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} md={10} lg={8}>
                        <Space.Compact style={{ width: '100%' }}>
                            <AutoComplete
                                style={{ width: '100%' }}
                                placeholder="Nhập keyword..."
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

                <div style={{ minHeight: 32 }}>
                    <Text type="secondary" style={{ marginRight: 8 }}>Keywords so sánh: </Text>
                    {selectedKeywords.map(tag => (
                        <Tag key={tag} closable onClose={() => handleRemoveKeyword(tag)} color="blue" style={{ fontSize: 14 }}>
                            {tag}
                        </Tag>
                    ))}
                </div>
            </Card>

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

            <Card title="Xu hướng Từ khóa trực quan (Word Cloud)" bordered={false} style={{ marginTop: 24 }}>
                <WordCloudChart data={trendingKeywords} loading={loadingKeywords} />
            </Card>

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
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from 'antd';

// Component tạo Tooltip theo chuẩn thiết kế: "Tên Journal: Số lượng papers"
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#333' }}>
                    {`${label}: ${payload[0].value} papers`}
                </p>
            </div>
        );
    }
    return null;
};

const JournalBarChart = ({ data, loading }) => {
    if (loading) return <Skeleton active paragraph={{ rows: 8 }} />;
    if (!data || data.length === 0) return <div>Chưa có dữ liệu Journals</div>;

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 65 }}>
                    {/* Định nghĩa dải màu Gradient (JP-37 Tech Details) */}
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1890ff" stopOpacity={1} />
                            <stop offset="95%" stopColor="#69c0ff" stopOpacity={0.3} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="journalName"
                        tick={{ fontSize: 11 }}
                        interval={0} // Ép hiển thị tất cả tên
                        angle={-35}
                        textAnchor="end"
                        height={75}
                        tickFormatter={(value) => value && value.length > 25 ? `${value.substring(0, 22)}...` : value}
                    />
                    <YAxis />

                    {/* Gắn Custom Tooltip (JP-37 Acceptance Criteria) */}
                    <Tooltip content={<CustomTooltip />} cursor={{fill: '#f5f5f5'}} />

                    {/* Sử dụng Gradient vừa định nghĩa */}
                    <Bar
                        dataKey="paperCount"
                        fill="url(#barGradient)"
                        barSize={40}
                        radius={[7, 7, 0, 0]} // Bo tròn nhẹ 2 góc trên cho đẹp
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default JournalBarChart;
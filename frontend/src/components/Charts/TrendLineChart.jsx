import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Skeleton, Empty } from 'antd';

const TrendLineChart = ({ data, keywords = [], loading }) => {
    if (loading) return <Skeleton.Button active style={{ width: '100%', height: 350 }} />;

    if (!data || data.length === 0) return <Empty description="Không có dữ liệu cho keyword này" />;

    const colors = ["#111827", "#0f766e", "#b91c1c"];

    return (
        <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="year"
                        tick={{ fill: '#8c8c8c' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        tick={{ fill: '#8c8c8c' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    {/* === CHỈNH SỬA: Tooltip hiển thị chuyên nghiệp hơn === */}
                    <Tooltip
                        contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        }}
                    />
                    <Legend iconType="circle" verticalAlign="top" height={36}/>

                    {/* === CHỈNH SỬA: Logic vẽ đường thông minh === */}
                    {keywords.length > 0 ? (
                        // Nếu có danh sách keywords (Compare Mode) -> Vẽ từng đường theo tên keyword
                        keywords.map((kw, index) => {
                            const color = colors[index % colors.length];
                            const isDashed = index >= colors.length;
                            return (
                                <Line
                                    key={kw}
                                    type="monotone"
                                    dataKey={kw}
                                    name={kw}
                                    stroke={color}
                                    strokeDasharray={isDashed ? "5 5" : undefined}
                                    strokeWidth={3}
                                    dot={{ r: 5, strokeWidth: 2, fill: '#fff', stroke: color }}
                                    activeDot={{ r: 8 }}
                                    animationDuration={1500}
                                />
                            );
                        })
                    ) : (
                        // Nếu không có keywords -> Vẽ 1 đường mặc định (Single Mode)
                        <Line
                            type="monotone"
                            dataKey="paperCount"
                            name="Số lượng bài báo"
                            stroke="#0f766e"
                            strokeWidth={3}
                            dot={{ r: 5 }}
                        />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TrendLineChart;
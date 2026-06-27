import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from 'antd';

const COLORS = ['#111827', '#0f766e', '#64748b', '#475569', '#334155'];

const FieldPieChart = ({ data, loading }) => {
    if (loading) return <Skeleton.Button active style={{ width: '100%', height: 260 }} />;
    if (!data || data.length === 0) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-on-surface-variant)' }}>No field data available</div>;

    const total = data.reduce((sum, item) => sum + (item.count || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {/* Donut Chart container */}
            <div style={{ position: 'relative', width: '100%', height: 210 }}>
                <ResponsiveContainer>
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={68}
                            outerRadius={92}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="field"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            formatter={(value, name) => [
                                `${value} (${total ? ((value / total) * 100).toFixed(0) : 0}%)`,
                                name
                            ]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* FIELDS Center Label */}
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: '#fff',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                    fontFamily: 'var(--font-ui)',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    border: '1.5px solid #e2e8f0',
                    pointerEvents: 'none',
                    textAlign: 'center'
                }}>
                    FIELDS
                </div>
            </div>

            {/* Custom Legend */}
            <div style={{ width: '100%', padding: '0 16px', marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.map((item, index) => {
                    const pct = total ? ((item.count / total) * 100).toFixed(0) : 0;
                    const col = COLORS[index % COLORS.length];
                    return (
                        <div key={item.field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', fontFamily: 'var(--font-body)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'inline-block' }} />
                                <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>{item.field}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: 'var(--color-on-surface)', fontFamily: 'var(--font-data)' }}>{pct}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FieldPieChart;
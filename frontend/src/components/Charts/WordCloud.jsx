import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, Tooltip } from 'antd';

const colors = [
    '#1890ff',
    '#2f54eb',
    '#722ed1',
    '#13c2c2',
    '#52c41a',
    '#faad14',
    '#f5222d',
    '#eb2f96',
    '#fa8c16',
    '#096dd9',
    '#389e0d',
    '#ad2102',
    '#10085a',
    '#02a8a8',
];

const getKeywordColor = (keyword) => {
    let hash = 0;
    for (let i = 0; i < keyword.length; i++) {
        hash = keyword.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const WordCloud = ({ data, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin tip="Đang tải vũ trụ từ khóa..." size="large" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '40px 0' }}>
                <Empty description="Không có dữ liệu từ khóa" />
            </div>
        );
    }

    const words = data.map((item, index) => {
        const text = item.name || item.text || item.keyword || `Keyword-${index}`;
        const value = item.usageCount !== undefined ? item.usageCount : (item.value || 0);
        return { text, value };
    });

    const minVal = Math.min(...words.map(w => w.value));
    const maxVal = Math.max(...words.map(w => w.value));

    const getFontSize = (value) => {
        if (maxVal === minVal) return 24;
        return 14 + ((value - minVal) / (maxVal - minVal)) * (60 - 14);
    };

    const styleSheet = `
        @keyframes wordCloudFadeIn {
            from {
                opacity: 0;
                transform: scale(0.7) translateY(10px);
            }
            to {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
        }
        .word-cloud-item {
            display: inline-block;
            cursor: pointer;
            font-weight: 700;
            line-height: 1.3;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            opacity: 0;
            animation: wordCloudFadeIn 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .word-cloud-item:hover {
            transform: scale(1.15) !important;
            filter: brightness(1.2);
            text-shadow: 0 4px 12px rgba(0,0,0,0.1);
            z-index: 10;
        }
    `;

    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <style>{styleSheet}</style>
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                alignItems: 'center',
                alignContent: 'center',
                gap: '12px 18px',
                padding: '24px',
                background: '#fff',
                borderRadius: '12px',
                minHeight: '320px',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {words.map((word, index) => (
                    <Tooltip key={index} title={`${word.text}: ${word.value} papers`} placement="top">
                        <span
                            className="word-cloud-item"
                            onClick={() => navigate(`/papers/search?keyword=${encodeURIComponent(word.text)}`)}
                            style={{
                                fontSize: `${getFontSize(word.value)}px`,
                                color: getKeywordColor(word.text),
                                animationDelay: `${index * 20}ms`
                            }}
                        >
                            {word.text}
                        </span>
                    </Tooltip>
                ))}
            </div>
        </div>
    );
};

export default WordCloud;
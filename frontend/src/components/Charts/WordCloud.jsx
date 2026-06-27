import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, Empty, Tooltip } from 'antd';

const WordCloud = ({ data, loading }) => {
    const navigate = useNavigate();

    const getColor = (val, maxVal, minVal, text) => {
        if (maxVal > minVal && val === maxVal) {
            return '#006a61'; // Deep teal for the largest word
        }
        const colors = ['#0f172a', '#64748b', '#0f9f90'];
        let h = 0;
        for (let i = 0; i < text.length; i++) h = text.charCodeAt(i) + ((h << 5) - h);
        return colors[Math.abs(h) % colors.length];
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                <Spin tip="Loading keyword cloud..." size="large" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Empty description="No keyword data available" />
            </div>
        );
    }

    const sortedWords = [...data]
        .map((item, index) => {
            const text = item.name || item.text || item.keyword || `Keyword-${index}`;
            const value = item.usageCount !== undefined ? item.usageCount : (item.value || 0);
            return { text, value };
        })
        .sort((a, b) => b.value - a.value);

    if (!sortedWords.length) {
        return (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <Empty description="No keyword data available" />
            </div>
        );
    }

    const min = sortedWords[sortedWords.length - 1].value;
    const max = sortedWords[0].value;
    const fs = (v) => (max === min ? 24 : 14 + ((v - min) / (max - min)) * 36);

    // Reorder from inside out: largest in center, smaller outwards
    const arrangedWords = [];
    for (let i = 0; i < sortedWords.length; i++) {
        if (i % 2 === 0) {
            arrangedWords.push(sortedWords[i]);
        } else {
            arrangedWords.unshift(sortedWords[i]);
        }
    }

    const styleSheet = `
        @keyframes wc-fade {
            from { opacity: 0; transform: scale(0.72); }
            to   { opacity: 1; transform: scale(1); }
        }
        .wc-item {
            display: inline-block;
            cursor: pointer;
            font-weight: 700;
            line-height: 1.3;
            transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
            opacity: 0;
            animation: wc-fade 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
        }
        .wc-item:hover {
            transform: scale(1.15) !important;
            filter: brightness(1.2);
            text-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
                gap: '24px 36px',
                padding: '24px 12px',
                background: '#fff',
                borderRadius: '12px',
                minHeight: '240px',
                overflow: 'hidden',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                {arrangedWords.map((word, index) => (
                    <Tooltip key={index} title={`${word.text}: ${word.value} papers`} placement="top">
                        <span
                            className="wc-item"
                            onClick={() => navigate(`/papers/search?keyword=${encodeURIComponent(word.text)}`)}
                            style={{
                                fontSize: `${fs(word.value)}px`,
                                color: getColor(word.value, max, min, word.text),
                                fontFamily: 'var(--font-body)',
                                animationDelay: `${index * 18}ms`
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
package com.journaltracker.service;

import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.TrendingTopic;

import java.util.List;

public interface TrendAnalysisService {
    List<TrendDataPoint> getTrendByKeyword(String keyword, int yearFrom, int yearTo);
    List<TrendComparison> compareTrends(List<String> keywords, int yearFrom, int yearTo);
    List<TrendingTopic> getTopTrendingTopics(int limit);
    void recalculateTrends();
}

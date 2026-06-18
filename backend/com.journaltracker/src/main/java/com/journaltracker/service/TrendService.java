package com.journaltracker.service;

import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendingTopic;

import java.util.List;

public interface TrendService {
    List<TrendDataPoint> getTrendByKeyword(String keyword, int yearFrom, int yearTo);
    List<TrendComparison> getTrendComparison(List<String> keywords, int yearFrom, int yearTo);
    List<TrendingTopic> getTrendingTopics(int limit);
}

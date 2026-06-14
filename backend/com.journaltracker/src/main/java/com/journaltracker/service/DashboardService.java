package com.journaltracker.service;

import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.dto.response.DashboardStatsResponse;
import com.journaltracker.dto.response.JournalStatsResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.dto.response.YearlyStats;

import java.util.List;

public interface DashboardService {
    DashboardStatsResponse getOverviewStats();

    List<TrendingTopic> getTrendingTopics(int limit);

    List<PaperSummaryResponse> getRecentPapers(int limit);

    List<JournalStatsResponse> getTopJournals(int limit);

    List<YearlyStats> getPublicationsByYear();
}

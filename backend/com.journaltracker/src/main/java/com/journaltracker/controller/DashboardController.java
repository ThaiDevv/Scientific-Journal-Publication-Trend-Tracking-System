package com.journaltracker.controller;

import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.DashboardStatsResponse;
import com.journaltracker.dto.response.JournalStatsResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.dto.response.YearlyStats;
import com.journaltracker.service.DashboardService;
import com.journaltracker.service.TrendAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final TrendAnalysisService trendAnalysisService;
    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ApiResponse<DashboardStatsResponse> getOverviewStats() {
        return ApiResponse.success(
                "Get dashboard stats successfully",
                dashboardService.getOverviewStats()
        );
    }

    @GetMapping("/trending")
    public ApiResponse<List<TrendingTopic>> getTrendingTopics(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(
                "Get trending topics successfully",
                trendAnalysisService.getTopTrendingTopics(limit)
        );
    }

    @GetMapping("/recent-papers")
    public ApiResponse<List<PaperSummaryResponse>> getRecentPapers(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(
                "Get recent papers successfully",
                dashboardService.getRecentPapers(limit)
        );
    }

    @GetMapping("/top-journals")
    public ApiResponse<List<JournalStatsResponse>> getTopJournals(
            @RequestParam(defaultValue = "10") int limit
    ) {
        return ApiResponse.success(
                "Get top journals successfully",
                dashboardService.getTopJournals(limit)
        );
    }

    @GetMapping("/yearly-stats")
    public ApiResponse<List<YearlyStats>> getPublicationsByYear() {
        return ApiResponse.success(
                "Get yearly publication stats successfully",
                dashboardService.getPublicationsByYear()
        );
    }
}

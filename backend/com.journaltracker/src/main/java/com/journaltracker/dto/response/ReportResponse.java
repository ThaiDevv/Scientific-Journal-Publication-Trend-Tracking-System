package com.journaltracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private Long id;
    private String title;
    private LocalDateTime generatedAt;
    private ReportSummary summary;
    private List<TrendDataItem> trendData;
    private List<AuthorItem> topAuthors;
    private List<JournalItem> topJournals;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportSummary {
        private int totalPapersAnalyzed;
        private String timeRange;
        private int keywordsAnalyzed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendDataItem {
        private String keyword;
        private List<DataPoint> dataPoints;
        private int totalPapers;
        private double growthRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DataPoint {
        private int year;
        private int count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthorItem {
        private String name;
        private int paperCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class JournalItem {
        private String name;
        private int paperCount;
    }
}

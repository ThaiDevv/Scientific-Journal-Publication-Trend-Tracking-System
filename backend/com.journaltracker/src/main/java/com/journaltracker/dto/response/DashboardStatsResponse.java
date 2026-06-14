package com.journaltracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalPapers;
    private long totalJournals;
    private long totalAuthors;
    private long totalKeywords;
    private long papersThisMonth;
    private long papersThisYear;
    private LocalDateTime lastSyncAt;
}

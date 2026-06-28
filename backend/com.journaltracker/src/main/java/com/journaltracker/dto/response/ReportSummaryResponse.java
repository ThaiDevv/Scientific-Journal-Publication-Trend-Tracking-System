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
public class ReportSummaryResponse {

    private Long id;
    private String title;
    private LocalDateTime generatedAt;
    private String format;
    private int keywordsAnalyzed;
    private String timeRange;
}

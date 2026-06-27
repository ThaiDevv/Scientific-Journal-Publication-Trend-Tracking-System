package com.journaltracker.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class DataSourceResponse {
    private Long id;
    private String name;
    private String baseUrl;
    private Boolean isActive;
    private LocalDateTime lastSyncAt;
    private LastSyncSummary lastSyncResult;

    @Data
    @Builder
    public static class LastSyncSummary {
        private int newPapers;
        private int errors;
    }
}

package com.journaltracker.dto.request;

import lombok.Data;

@Data
public class SyncTriggerRequest {
    private String sourceName;
    private String query;
    private Integer maxPages;
}

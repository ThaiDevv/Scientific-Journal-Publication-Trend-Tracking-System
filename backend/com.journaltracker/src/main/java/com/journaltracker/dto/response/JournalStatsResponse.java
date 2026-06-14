package com.journaltracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalStatsResponse {
    private String journalName;
    private int paperCount;
    private String field;
}

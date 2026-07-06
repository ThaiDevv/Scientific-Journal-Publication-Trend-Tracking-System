package com.journaltracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingTopic {
    private String keyword;
    private int currentYearCount;
    private int previousYearCount;
    private double growthRate;
}


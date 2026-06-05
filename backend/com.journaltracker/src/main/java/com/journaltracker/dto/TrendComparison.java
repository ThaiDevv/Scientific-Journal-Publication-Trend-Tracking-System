package com.journaltracker.dto;

import lombok.Builder;

import java.util.List;
@Builder
public class TrendComparison {
    String keyword;
    List<TrendDataPoint> dataPoints;
}

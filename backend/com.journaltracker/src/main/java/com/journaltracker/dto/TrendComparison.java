package com.journaltracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendComparison {
<<<<<<< HEAD
    private String keyword;
    private List<TrendDataPoint> dataPoints;
}
=======
    String keyword;
    List<TrendDataPoint> dataPoints;
}
>>>>>>> b9ab7a1 (feature/trendsAPI)

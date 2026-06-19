package com.journaltracker.controller;

import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.service.TrendAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/trends")
@RequiredArgsConstructor
public class TrendController {

    private final TrendAnalysisService trendAnalysisService;

    @GetMapping("/keyword/{keyword}")
    public ApiResponse<List<TrendDataPoint>> getKeywordTrend(
            @PathVariable String keyword,
            @RequestParam(defaultValue = "2015") int fromYear,
            @RequestParam(required = false) Integer toYear
    ) {
        int endYear = toYear != null ? toYear : LocalDate.now().getYear();
        return ApiResponse.success(
                "Get keyword trend successfully",
                trendAnalysisService.getTrendByKeyword(keyword, fromYear, endYear)
        );
    }

    @GetMapping("/compare")
    public ApiResponse<List<Map<String, Object>>> compareTrends(
            @RequestParam List<String> keywords,
            @RequestParam(defaultValue = "2015") int fromYear,
            @RequestParam(required = false) Integer toYear
    ) {
        int endYear = toYear != null ? toYear : LocalDate.now().getYear();
        List<TrendComparison> comparisons = trendAnalysisService.compareTrends(keywords, fromYear, endYear);

        // Restructure to flat format expected by TrendLineChart:
        // [{ "year": "2020", "AI": 10, "Blockchain": 5 }, ...]
        Map<Integer, Map<String, Object>> yearData = new TreeMap<>();
        for (TrendComparison comparison : comparisons) {
            String keyword = comparison.getKeyword();
            if (comparison.getDataPoints() != null) {
                for (TrendDataPoint dp : comparison.getDataPoints()) {
                    int year = dp.getYear();
                    yearData.computeIfAbsent(year, y -> {
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("year", String.valueOf(y));
                        return map;
                    }).put(keyword, dp.getPaperCount());
                }
            }
        }

        // Fill in missing years for keywords with 0 if necessary, but Recharts handles missing keys fine.
        return ApiResponse.success(
                "Compare trends successfully",
                new ArrayList<>(yearData.values())
        );
    }

    @GetMapping("/analyze")
    public ApiResponse<Map<String, Object>> analyzeTrends(
            @RequestParam List<String> keywords,
            @RequestParam(name = "fromYear", defaultValue = "2020") int fromYear,
            @RequestParam(name = "toYear", required = false) Integer toYear
    ) {
        int endYear = toYear != null ? toYear : LocalDate.now().getYear();
        List<TrendComparison> comparisons = trendAnalysisService.compareTrends(keywords, fromYear, endYear);

        // Build chartData: flat format
        Map<Integer, Map<String, Object>> yearData = new TreeMap<>();
        for (TrendComparison comparison : comparisons) {
            String keyword = comparison.getKeyword();
            if (comparison.getDataPoints() != null) {
                for (TrendDataPoint dp : comparison.getDataPoints()) {
                    int year = dp.getYear();
                    yearData.computeIfAbsent(year, y -> {
                        Map<String, Object> map = new LinkedHashMap<>();
                        map.put("year", String.valueOf(y));
                        return map;
                    }).put(keyword, dp.getPaperCount());
                }
            }
        }
        List<Map<String, Object>> chartData = new ArrayList<>(yearData.values());

        // Build tableData
        List<Map<String, Object>> tableData = new ArrayList<>();
        for (TrendComparison comparison : comparisons) {
            String keyword = comparison.getKeyword();
            int totalPapers = 0;
            int thisYear = 0;
            int lastYear = 0;

            if (comparison.getDataPoints() != null) {
                for (TrendDataPoint dp : comparison.getDataPoints()) {
                    totalPapers += dp.getPaperCount();
                    if (dp.getYear() == endYear) {
                        thisYear = dp.getPaperCount();
                    } else if (dp.getYear() == endYear - 1) {
                        lastYear = dp.getPaperCount();
                    }
                }
            }

            double growthRate = 0.0;
            if (lastYear > 0) {
                growthRate = Math.round(((double) (thisYear - lastYear) / lastYear) * 100.0);
            } else if (thisYear > 0) {
                growthRate = 100.0;
            }

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("keyword", keyword);
            row.put("totalPapers", totalPapers);
            row.put("thisYear", thisYear);
            row.put("lastYear", lastYear);
            row.put("growthRate", (int) growthRate);

            tableData.add(row);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("chartData", chartData);
        result.put("tableData", tableData);

        return ApiResponse.success(
                "Analyze trends successfully",
                result
        );
    }
}

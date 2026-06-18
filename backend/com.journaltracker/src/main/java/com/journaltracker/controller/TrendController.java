package com.journaltracker.controller;

import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.service.TrendService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/trends")
public class TrendController {

    private final TrendService trendService;

    @Autowired
    public TrendController(TrendService trendService) {
        this.trendService = trendService;
    }

    @GetMapping("/keyword/{keyword}")
    public ApiResponse<List<TrendDataPoint>> getTrendByKeyword(
            @PathVariable String keyword,
            @RequestParam(defaultValue = "2018") int yearFrom,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int yearTo) {

        List<TrendDataPoint> data = trendService.getTrendByKeyword(keyword, yearFrom, yearTo);
        return ApiResponse.success("Successfully retrieved trend data for keyword: " + keyword, data);
    }

    @GetMapping("/compare")
    public ApiResponse<List<TrendComparison>> getTrendComparison(
            @RequestParam List<String> keywords,
            @RequestParam(defaultValue = "2018") int yearFrom,
            @RequestParam(defaultValue = "#{T(java.time.LocalDate).now().getYear()}") int yearTo) {

        if (keywords == null || keywords.isEmpty()) {
            return ApiResponse.success("No keywords provided for comparison.", Collections.emptyList());
        }
        List<TrendComparison> data = trendService.getTrendComparison(keywords, yearFrom, yearTo);
        return ApiResponse.success("Successfully retrieved trend comparison data.", data);
    }

    @GetMapping("/topics/trending")
    public ApiResponse<List<TrendingTopic>> getTrendingTopics(
            @RequestParam(defaultValue = "10") int limit) {
        List<TrendingTopic> data = trendService.getTrendingTopics(limit);
        return ApiResponse.success("Successfully retrieved top " + limit + " trending topics.", data);
    }
}
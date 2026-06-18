package com.journaltracker.service.impl;

import com.journaltracker.dto.KeywordYearCount;
import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.entity.Keyword;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.TrendService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TrendServiceImpl implements TrendService {

    private final PaperRepository paperRepository;
    private final KeywordRepository keywordRepository;

    @Override
    public List<TrendDataPoint> getTrendByKeyword(String keyword, int yearFrom, int yearTo) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return paperRepository.getTrendByKeyword(keyword, yearFrom, yearTo);
    }

    @Override
    public List<TrendComparison> getTrendComparison(List<String> keywords, int yearFrom, int yearTo) {
        if (keywords == null || keywords.isEmpty()) {
            return Collections.emptyList();
        }

        return keywords.stream()
                .map(keyword -> {
                    List<TrendDataPoint> dataPoints = getTrendByKeyword(keyword, yearFrom, yearTo);
                    return new TrendComparison(keyword, dataPoints);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<TrendingTopic> getTrendingTopics(int limit) {
        int currentYear = LocalDate.now().getYear();
        int previousYear = currentYear - 1;

        List<KeywordYearCount> counts = paperRepository.getKeywordCountsForYears(currentYear, previousYear);

        Map<Long, Map<Integer, Long>> countsByKeywordId = counts.stream()
                .collect(Collectors.groupingBy(
                        KeywordYearCount::getKeywordId,
                        Collectors.toMap(KeywordYearCount::getYear, KeywordYearCount::getPaperCount)
                ));

        // Lấy danh sách các keyword ID để truy vấn tên
        List<Long> keywordIds = new java.util.ArrayList<>(countsByKeywordId.keySet());
        Map<Long, Keyword> keywordMap = keywordRepository.findAllById(keywordIds).stream()
                .collect(Collectors.toMap(Keyword::getId, Function.identity()));


        List<TrendingTopic> trendingTopics = countsByKeywordId.entrySet().stream()
                .map(entry -> {
                    Long keywordId = entry.getKey();
                    Keyword keyword = keywordMap.get(keywordId);
                    if (keyword == null) {
                        return null; // Bỏ qua nếu không tìm thấy keyword
                    }

                    Map<Integer, Long> yearCounts = entry.getValue();
                    int currentYearCount = yearCounts.getOrDefault(currentYear, 0L).intValue();
                    int previousYearCount = yearCounts.getOrDefault(previousYear, 0L).intValue();

                    if (currentYearCount == 0 && previousYearCount == 0) {
                        return null; // Bỏ qua nếu không có dữ liệu
                    }
                    
                    double growthRate = 0;
                    if (previousYearCount > 0) {
                        growthRate = ((double) (currentYearCount - previousYearCount) / previousYearCount) * 100;
                    } else if (currentYearCount > 0) {
                        growthRate = Double.POSITIVE_INFINITY; // Tăng trưởng vô hạn nếu từ 0 lên > 0
                    }

                    return new TrendingTopic(keyword.getName(), currentYearCount, previousYearCount, growthRate);
                })
                .filter(java.util.Objects::nonNull)
                .sorted(Comparator.comparingDouble(TrendingTopic::getGrowthRate).reversed())
                .limit(limit)
                .collect(Collectors.toList());

        return trendingTopics;
    }
}

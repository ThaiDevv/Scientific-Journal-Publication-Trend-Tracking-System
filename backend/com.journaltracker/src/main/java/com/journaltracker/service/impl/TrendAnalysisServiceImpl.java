package com.journaltracker.service.impl;

import com.journaltracker.dto.KeywordYearCount;
import com.journaltracker.dto.TrendComparison;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.entity.PublicationTrend;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.repository.PublicationTrendRepository;
import com.journaltracker.repository.ResearchTopicRepository;
import com.journaltracker.service.TrendAnalysisService;
import lombok.Builder;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
@Builder
public class TrendAnalysisServiceImpl implements TrendAnalysisService {
    private final PaperRepository paperRepository;
    private final KeywordRepository keywordRepository;
    private final PublicationTrendRepository publicationTrendRepository;
    private final ResearchTopicRepository researchTopicRepository;

    @Override
    public List<TrendDataPoint> getTrendByKeyword(String keyword, int yearFrom, int yearTo) {
        return paperRepository.getTrendByKeyword(keyword, yearFrom, yearTo);
    }

    @Override
    public List<TrendComparison> compareTrends(List<String> keywords, int yearFrom, int yearTo) {
        List<TrendComparison> trendComparisons = new ArrayList<>();
        keywords.forEach(keyword -> {
            TrendComparison trendComparison = TrendComparison.builder()
                    .keyword(keyword)
                    .dataPoints(getTrendByKeyword(keyword, yearFrom, yearTo))
                    .build();
            trendComparisons.add(trendComparison);
        });
        return trendComparisons;
    }

    @Override
    public List<TrendingTopic> getTopTrendingTopics(int limit) {
        Integer maxYear = publicationTrendRepository.findMaxYear();
        if (maxYear == null) {
            return List.of();
        }
        return publicationTrendRepository.findTopTrending(maxYear, PageRequest.of(0, limit));
    }

    @Override
    @Transactional
    public void recalculateTrends() {
        publicationTrendRepository.deleteAllInBatch();
        List<KeywordYearCount> rawCounts = paperRepository.getKeywordCountsGroupByYear();
        Map<Long, Map<Integer, Long>> keywordYearMap = new HashMap<>();
        for (KeywordYearCount count : rawCounts) {
            keywordYearMap.computeIfAbsent(count.getKeywordId(), k -> new HashMap<>())
                    .put(count.getYear(), count.getPaperCount());
        }
        List<PublicationTrend> trendList = new ArrayList<>();
        for (Map.Entry<Long, Map<Integer, Long>> entry : keywordYearMap.entrySet()) {
            Long keywordId = entry.getKey();
            Map<Integer, Long> yearMap = entry.getValue();

            for (Integer year : yearMap.keySet()) {
                long currentCount = yearMap.get(year);
                Long prevCount = yearMap.get(year - 1);

                double growthRate = 0.0;
                if (prevCount == null || prevCount == 0) {
                    if (currentCount > 0) {
                        growthRate = 100.0;
                    }
                } else {
                    growthRate = ((double) (currentCount - prevCount) / prevCount) * 100.0;
                }

                BigDecimal rate = BigDecimal.valueOf(growthRate).setScale(2, RoundingMode.HALF_UP);

                PublicationTrend trend = PublicationTrend.builder()
                        .keywordId(keywordId)
                        .year(year)
                        .paperCount((int) currentCount)
                        .growthRate(rate)
                        .build();
                trendList.add(trend);
            }
        }

        publicationTrendRepository.saveAll(trendList);
        Integer maxYear = publicationTrendRepository.findMaxYear();
        if (maxYear != null) {
            researchTopicRepository.resetAllTrendingTopics();
            researchTopicRepository.updateTrendingTopics(maxYear);
        }
    }
}

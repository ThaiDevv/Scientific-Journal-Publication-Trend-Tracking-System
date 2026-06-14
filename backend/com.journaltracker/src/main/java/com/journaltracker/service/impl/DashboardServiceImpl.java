package com.journaltracker.service.impl;

import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.dto.response.DashboardStatsResponse;
import com.journaltracker.dto.response.JournalStatsResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.dto.response.YearlyStats;
import com.journaltracker.mapper.PaperMapper;
import com.journaltracker.repository.ApiDataSourceRepository;
import com.journaltracker.repository.AuthorRepository;
import com.journaltracker.repository.JournalRepository;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.repository.PublicationTrendRepository;
import com.journaltracker.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 100;

    private final PaperRepository paperRepository;
    private final JournalRepository journalRepository;
    private final AuthorRepository authorRepository;
    private final KeywordRepository keywordRepository;
    private final PublicationTrendRepository publicationTrendRepository;
    private final ApiDataSourceRepository apiDataSourceRepository;
    private final PaperMapper paperMapper;

    @Override
    public DashboardStatsResponse getOverviewStats() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime startOfYear = today.withDayOfYear(1).atStartOfDay();

        return DashboardStatsResponse.builder()
                .totalPapers(paperRepository.count())
                .totalJournals(journalRepository.count())
                .totalAuthors(authorRepository.count())
                .totalKeywords(keywordRepository.count())
                .papersThisMonth(paperRepository.countByCreatedAtGreaterThanEqual(startOfMonth))
                .papersThisYear(paperRepository.countByCreatedAtGreaterThanEqual(startOfYear))
                .lastSyncAt(apiDataSourceRepository.findLatestSyncAt())
                .build();
    }

    @Override
    public List<TrendingTopic> getTrendingTopics(int limit) {
        Integer currentYear = publicationTrendRepository.findMaxYear();
        if (currentYear == null) {
            return List.of();
        }

        return publicationTrendRepository.findTopTrending(
                currentYear,
                PageRequest.of(0, normalizeLimit(limit))
        );
    }

    @Override
    public List<PaperSummaryResponse> getRecentPapers(int limit) {
        int currentYear = LocalDate.now().getYear();

        return paperRepository.findByPublicationYearLessThanEqualOrderByCreatedAtDesc(
                        currentYear,
                        PageRequest.of(0, normalizeLimit(limit))
                )
                .stream()
                .map(paperMapper::toSummaryResponse)
                .toList();
    }

    @Override
    public List<JournalStatsResponse> getTopJournals(int limit) {
        return journalRepository.findTopJournalsByPaperCount(
                PageRequest.of(0, normalizeLimit(limit))
        );
    }

    @Override
    public List<YearlyStats> getPublicationsByYear() {
        return paperRepository.countPublicationsByYear(LocalDate.now().getYear());
    }

    private int normalizeLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}

package com.journaltracker;

import com.journaltracker.repository.PublicationTrendRepository;
import com.journaltracker.service.TrendAnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
public class TrendTest {

    @Autowired
    private PublicationTrendRepository publicationTrendRepository;

    @Autowired
    private TrendAnalysisService trendAnalysisService;

    @Autowired
    private com.journaltracker.repository.KeywordRepository keywordRepository;

    @Test
    public void printTopKeywords() {
        System.out.println("=== KEYWORD LIST START ===");
        keywordRepository.findAll().forEach(k -> {
            System.out.println("KEYWORD: " + k.getName() + " (Usage: " + k.getUsageCount() + ")");
        });
        System.out.println("=== KEYWORD LIST END ===");
    }

    @Test
    public void checkTrends() {
        System.out.println("=== TREND CHECK START ===");
        long countBefore = publicationTrendRepository.count();
        System.out.println("Publication Trends count before recalculate: " + countBefore);

        System.out.println("Running recalculateTrends()...");
        trendAnalysisService.recalculateTrends();

        long countAfter = publicationTrendRepository.count();
        System.out.println("Publication Trends count after recalculate: " + countAfter);
        System.out.println("=== TREND CHECK END ===");
    }
}

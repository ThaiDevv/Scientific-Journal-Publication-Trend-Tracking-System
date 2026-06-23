package com.journaltracker.scheduler;

import com.journaltracker.client.ExternalApiClient;
import com.journaltracker.dto.SyncResult;
import com.journaltracker.entity.ApiDataSource;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.properties.SyncProperties;
import com.journaltracker.repository.ApiDataSourceRepository;
import com.journaltracker.service.DataSyncService;
import com.journaltracker.service.NotificationService;
import com.journaltracker.service.TrendAnalysisService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
@Component
public class DataSyncScheduler {

    private final List<ExternalApiClient> clientList;
    private final DataSyncService dataSyncService;
    private final SyncProperties syncProperties;
    private final TrendAnalysisService trendAnalysisService;
    private final NotificationService notificationService;
    private final ApiDataSourceRepository apiDataSourceRepository;
    @Scheduled(cron = "${sync.cron:0 0 13 * * ?}")
    public void syncData() {
        if (!syncProperties.isEnabled()) {
            log.info("Data sync scheduler is disabled.");
            return;
        }

        log.info("Starting scheduled data sync job...");

        List<ApiDataSource> activeSources = apiDataSourceRepository.findByIsActiveTrue();
        List<SyncResult> resultList = new ArrayList<>();
        List<ResearchPaper> allSyncedPapers = new ArrayList<>();

        for (ApiDataSource source : activeSources) {
            Optional<ExternalApiClient> clientOpt = clientList.stream()
                    .filter(c -> c.getSourceName().replace(" ", "").equalsIgnoreCase(source.getName().replace(" ", "")))
                    .findFirst();

            if (clientOpt.isEmpty()) {
                log.warn("No ExternalApiClient found for active source name '{}'", source.getName());
                continue;
            }

            ExternalApiClient client = clientOpt.get();
            try {
                if (client.isAvailable()) {
                    LocalDate fromDate = source.getLastSyncAt() != null 
                            ? source.getLastSyncAt().toLocalDate() 
                            : LocalDate.now().minusDays(1);

                    log.info("Syncing recent papers from '{}' since {}", source.getName(), fromDate);

                    SyncResult result = dataSyncService.syncRecentPapers(client.getSourceName(), fromDate);
                    resultList.add(result);
                    
                    if (result.getSyncedPapers() != null) {
                        allSyncedPapers.addAll(result.getSyncedPapers());
                    }
                    source.setLastSyncAt(LocalDateTime.now());
                    apiDataSourceRepository.save(source);
                    log.info("Synced from {}: {} new papers, {} duplicates, {} errors",
                            result.getSourceName(), result.getNewPapers(), result.getDuplicates(), result.getErrors());
                } else {
                    log.error("Client {} is not available", client.getSourceName());
                }
            } catch (Exception e) {
                log.error("Sync failed for source {}", source.getName(), e);
            }
        }
        try {
            trendAnalysisService.recalculateTrends();
            log.info("Research trends recalculated successfully.");
        } catch (Exception e) {
            log.error("Failed to recalculate trends", e);
        }
        try {
            if (!allSyncedPapers.isEmpty()) {
                notificationService.notifyFollowers(allSyncedPapers);
                log.info("Notified followers about {} new papers.", allSyncedPapers.size());
            }
        } catch (Exception e) {
            log.error("Failed to notify followers", e);
        }

        log.info("Scheduled data sync job completed. Results: {}", resultList);
    }
}

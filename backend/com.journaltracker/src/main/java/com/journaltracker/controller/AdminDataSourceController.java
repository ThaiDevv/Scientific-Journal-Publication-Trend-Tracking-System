package com.journaltracker.controller;

import com.journaltracker.dto.SyncResult;
import com.journaltracker.dto.request.SyncTriggerRequest;
import com.journaltracker.dto.response.DataSourceResponse;
import com.journaltracker.entity.ApiDataSource;
import com.journaltracker.repository.ApiDataSourceRepository;
import com.journaltracker.service.DataSyncService;
import com.journaltracker.service.SyncStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminDataSourceController {

    private final ApiDataSourceRepository apiDataSourceRepository;
    private final DataSyncService dataSyncService;
    private final SyncStatusService syncStatusService;
    private final com.journaltracker.service.TrendAnalysisService trendAnalysisService;

    @GetMapping("/datasources")
    public ResponseEntity<List<DataSourceResponse>> listSources() {
        List<ApiDataSource> list = apiDataSourceRepository.findAll();
        List<DataSourceResponse> resp = list.stream().map(this::map).collect(Collectors.toList());
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/datasources/{id}")
    public ResponseEntity<DataSourceResponse> updateSource(@PathVariable Long id, @RequestBody ApiDataSource update) {
        ApiDataSource src = apiDataSourceRepository.findById(id).orElseThrow();
        // only allow toggling isActive and updating apiKey/baseUrl/name
        if (update.getIsActive() != null)
            src.setIsActive(update.getIsActive());
        if (update.getApiKey() != null)
            src.setApiKey(update.getApiKey());
        if (update.getBaseUrl() != null)
            src.setBaseUrl(update.getBaseUrl());
        if (update.getName() != null)
            src.setName(update.getName());
        apiDataSourceRepository.save(src);
        return ResponseEntity.ok(map(src));
    }

    @PostMapping("/sync/trigger")
    public ResponseEntity<SyncResult> triggerSync(@RequestBody SyncTriggerRequest req) {
        SyncResult result;
        result = dataSyncService.syncFromSource(req.getSourceName(), req.getQuery());
        apiDataSourceRepository.findByNameIgnoreCase(req.getSourceName()).ifPresent(s -> {
            s.setLastSyncAt(java.time.LocalDateTime.now());
            apiDataSourceRepository.save(s);
        });
        trendAnalysisService.recalculateTrends();
        syncStatusService.setLast(result);
        return ResponseEntity.ok(result);
    }
    @GetMapping("/sync/allsource")
    public ResponseEntity<List<SyncResult>> allSources(@RequestParam(required = false) String query) {
        String activeQuery = (query == null || query.isBlank()) ? "machine learning" : query;
        List<SyncResult> list = dataSyncService.syncAllSources(activeQuery);
        List<ApiDataSource> allDbSources = apiDataSourceRepository.findAll();
        for (SyncResult res : list) {
            if (res.getSourceName() != null) {
                String cleanResName = res.getSourceName().replaceAll("\\s+", "").toLowerCase();
                allDbSources.stream()
                    .filter(s -> s.getName() != null && s.getName().replaceAll("\\s+", "").toLowerCase().equals(cleanResName))
                    .findFirst()
                    .ifPresent(s -> {
                        s.setLastSyncAt(java.time.LocalDateTime.now());
                        apiDataSourceRepository.save(s);
                    });
            }
        }
        trendAnalysisService.recalculateTrends();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/sync/status")
    public ResponseEntity<SyncResult> lastStatus() {
        SyncResult last = syncStatusService.getLast();
        return ResponseEntity.ok(last);
    }

    private DataSourceResponse map(ApiDataSource src) {
        DataSourceResponse.LastSyncSummary summary = null;
        SyncResult last = syncStatusService.getLast();
        if (last != null && last.getSourceName() != null
                && last.getSourceName().equalsIgnoreCase(src.getName())) {
            summary = DataSourceResponse.LastSyncSummary.builder()
                    .newPapers(last.getNewPapers())
                    .errors(last.getErrors())
                    .build();
        }
        return DataSourceResponse.builder()
                .id(src.getId())
                .name(src.getName())
                .baseUrl(src.getBaseUrl())
                .isActive(src.getIsActive())
                .lastSyncAt(src.getLastSyncAt())
                .lastSyncResult(summary)
                .build();
    }
}

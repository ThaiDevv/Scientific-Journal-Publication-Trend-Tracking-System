package com.journaltracker.service;

import com.journaltracker.dto.SyncResult;

import java.time.LocalDate;
import java.util.List;

public interface DataSyncService {
    SyncResult syncFromSource(String sourceName, String query);
    SyncResult syncRecentPapers(String sourceName, LocalDate fromDate);
    List<SyncResult> syncAllSources(String query);
}
package com.journaltracker.client;

import com.journaltracker.dto.RawPaperData;

import java.time.LocalDate;
import java.util.List;

public interface ExternalApiClient {
    String getSourceName(); 
    List<RawPaperData> fetchPapers(String query, int page, int pageSize);
    List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int pageSize);
    boolean isAvailable();    
    String fetchRawResponse(String query, int page, int pageSize);
}


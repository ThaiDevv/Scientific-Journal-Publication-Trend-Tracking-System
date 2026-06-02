package com.journaltracker.external;

import com.journaltracker.dto.RawPaperData;

import java.time.LocalDate;
import java.util.List;

public interface ExternalApiClient {

    List<RawPaperData> fetchPapers(String query, int page, int size);

    List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int size);

    String getSourceName();

    boolean isAvailable();
}

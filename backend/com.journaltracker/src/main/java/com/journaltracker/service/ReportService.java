package com.journaltracker.service;

import com.journaltracker.dto.request.ReportRequest;
import com.journaltracker.dto.response.ReportResponse;
import com.journaltracker.dto.response.ReportSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReportService {

    ReportResponse generateTrendReport(String username, ReportRequest request);

    Page<ReportSummaryResponse> getReportHistory(String username, Pageable pageable);

    ReportResponse getReportById(String username, Long reportId);

    byte[] generatePdf(Long reportId, String username);
}

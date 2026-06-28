package com.journaltracker.controller;

import com.journaltracker.dto.request.ReportRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.ReportResponse;
import com.journaltracker.dto.response.ReportSummaryResponse;
import com.journaltracker.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;


    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<ReportResponse>> generateReport(
            Authentication authentication,
            @Valid @RequestBody ReportRequest request
    ) {
        ReportResponse response = reportService.generateTrendReport(
                authentication.getName(), request);

        return ResponseEntity.ok(ApiResponse.success(
                "Report generated successfully", response));
    }


    @GetMapping("/history")
    public ResponseEntity<ApiResponse<Page<ReportSummaryResponse>>> getReportHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ReportSummaryResponse> history = reportService.getReportHistory(
                authentication.getName(), pageable);

        return ResponseEntity.ok(ApiResponse.success(
                "Report history retrieved successfully", history));
    }


    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportById(
            Authentication authentication,
            @PathVariable Long id
    ) {
        ReportResponse response = reportService.getReportById(
                authentication.getName(), id);

        return ResponseEntity.ok(ApiResponse.success(
                "Report retrieved successfully", response));
    }


    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadReportPdf(
            Authentication authentication,
            @PathVariable Long id
    ) {
        byte[] pdfBytes = reportService.generatePdf(id, authentication.getName());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "report_" + id + ".pdf");
        headers.setContentLength(pdfBytes.length);

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}

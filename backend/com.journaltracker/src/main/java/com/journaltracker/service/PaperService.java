package com.journaltracker.service;

import com.journaltracker.dto.request.PaperSearchRequest;
import com.journaltracker.dto.response.PaperSummaryResponse;
import org.springframework.data.domain.Page;

public interface PaperService {

    Page<PaperSummaryResponse> searchPapers(
            PaperSearchRequest request
    );
}
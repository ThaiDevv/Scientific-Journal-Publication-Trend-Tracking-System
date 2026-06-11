package com.journaltracker.service;

import com.journaltracker.dto.response.KeywordResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface KeywordService {
    List<KeywordResponse> getTopKeywords(int limit);
    Page<PaperSummaryResponse> getPapersByKeyword(String keywordName, Pageable pageable);
}
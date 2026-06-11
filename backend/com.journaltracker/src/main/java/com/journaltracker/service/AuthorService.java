package com.journaltracker.service;

import com.journaltracker.dto.response.AuthorDetailResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AuthorService {
    AuthorDetailResponse getAuthorById(Long id);
    Page<PaperSummaryResponse> getPapersByAuthor(Long authorId, Pageable pageable);
}
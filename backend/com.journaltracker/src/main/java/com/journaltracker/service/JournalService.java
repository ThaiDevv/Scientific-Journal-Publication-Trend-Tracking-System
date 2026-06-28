package com.journaltracker.service;

import com.journaltracker.dto.response.JournalDetailResponse;
import com.journaltracker.dto.response.JournalResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface JournalService {

    Page<JournalResponse> getAllJournals(Pageable pageable);

    Page<JournalResponse> getAllJournals(
            Pageable pageable,
            String currentUsername
    );

    Page<JournalResponse> searchJournals(
            String search,
            String field,
            Pageable pageable
    );

    Page<JournalResponse> searchJournals(
            String search,
            String field,
            Pageable pageable,
            String currentUsername
    );

    JournalDetailResponse getJournalById(Long id);

    JournalDetailResponse getJournalById(
            Long id,
            String currentUsername
    );

    Page<PaperSummaryResponse> getPapersByJournal(
            Long journalId,
            Pageable pageable
    );
}

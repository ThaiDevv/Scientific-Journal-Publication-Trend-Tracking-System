package com.journaltracker.controller;

import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.JournalDetailResponse;
import com.journaltracker.dto.response.JournalResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.service.JournalService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/journals")
@RequiredArgsConstructor
public class JournalController {

    private final JournalService journalService;

    @GetMapping
    public ApiResponse<Page<JournalResponse>> getJournals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String field,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            Authentication authentication
    ) {

        Pageable pageable = PageRequest.of(page, size);

        Page<JournalResponse> result =
                journalService.searchJournals(
                        search,
                        field,
                        pageable,
                        getCurrentUsername(authentication)
                );

        return new ApiResponse<>(
                true,
                "Get journals successfully",
                result
        );
    }

    @GetMapping("/{id}")
    public JournalDetailResponse getJournalById(
            @PathVariable Long id,
            Authentication authentication
    ) {

        return journalService.getJournalById(
                id,
                getCurrentUsername(authentication)
        );
    }

    @GetMapping("/{id}/papers")
    public ApiResponse<Page<PaperSummaryResponse>> getPapersByJournal(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        Page<PaperSummaryResponse> result =
                journalService.getPapersByJournal(id, pageable);

        return new ApiResponse<>(
                true,
                "Get journal papers successfully",
                result
        );
    }

    private String getCurrentUsername(
            Authentication authentication
    ) {

        if (authentication == null
                || authentication instanceof AnonymousAuthenticationToken
                || !authentication.isAuthenticated()) {
            return null;
        }

        return authentication.getName();
    }
}

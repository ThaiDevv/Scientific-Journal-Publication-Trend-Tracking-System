package com.journaltracker.controller;

import com.journaltracker.dto.request.PaperSearchRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/papers")
@RequiredArgsConstructor
public class PaperController {

    private final PaperService paperService;

    @GetMapping("/search")
    public ApiResponse<Page<PaperSummaryResponse>> searchPapers(

            @RequestParam(required = false) String keyword,

            @RequestParam(required = false) String author,

            @RequestParam(required = false) String journal,

            @RequestParam(required = false) Integer yearFrom,

            @RequestParam(required = false) Integer yearTo,

            @RequestParam(defaultValue = "0") Integer page,

            @RequestParam(defaultValue = "10") Integer size,

            @RequestParam(defaultValue = "publicationYear") String sortBy,

            @RequestParam(defaultValue = "desc") String sortDir
    ) {

        PaperSearchRequest request =
                new PaperSearchRequest();

        request.setKeyword(keyword);

        request.setAuthor(author);

        request.setJournal(journal);

        request.setYearFrom(yearFrom);

        request.setYearTo(yearTo);

        request.setPage(page);

        request.setSize(size);

        request.setSortBy(sortBy);

        request.setSortDir(sortDir);

        Page<PaperSummaryResponse> result =
                paperService.searchPapers(request);

        return new ApiResponse<>(
                true,
                "Search papers successfully",
                result
        );
    }
}
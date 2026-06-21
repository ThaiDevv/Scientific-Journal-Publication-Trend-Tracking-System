package com.journaltracker.controller;

import com.journaltracker.dto.request.BookmarkRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.BookmarkResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.service.BookmarkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bookmarks")
@RequiredArgsConstructor
public class BookmarkController {

    private final BookmarkService bookmarkService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookmarkResponse>> addBookmark(
            Authentication authentication,
            @Valid @RequestBody BookmarkRequest request
    ) {

        BookmarkResponse response = bookmarkService.addBookmark(
                authentication.getName(),
                request.getPaperId()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Bookmark created successfully",
                        response
                ));
    }

    @DeleteMapping("/{paperId}")
    public ResponseEntity<ApiResponse<Void>> removeBookmark(
            Authentication authentication,
            @PathVariable Long paperId
    ) {

        bookmarkService.removeBookmark(
                authentication.getName(),
                paperId
        );

        return ResponseEntity.ok(ApiResponse.success(
                "Bookmark removed successfully",
                null
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Page<PaperSummaryResponse>>> getMyBookmarks(
            Authentication authentication,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "10") Integer size
    ) {

        Pageable pageable = PageRequest.of(page, size);

        Page<PaperSummaryResponse> response =
                bookmarkService.getMyBookmarks(
                        authentication.getName(),
                        pageable
                );

        return ResponseEntity.ok(ApiResponse.success(
                "Get bookmarks successfully",
                response
        ));
    }
}

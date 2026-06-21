package com.journaltracker.service;

import com.journaltracker.dto.response.BookmarkResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BookmarkService {

    BookmarkResponse addBookmark(
            String username,
            Long paperId
    );

    void removeBookmark(
            String username,
            Long paperId
    );

    Page<PaperSummaryResponse> getMyBookmarks(
            String username,
            Pageable pageable
    );

    boolean isBookmarked(
            String username,
            Long paperId
    );
}

package com.journaltracker.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BookmarkResponse {

    private Long id;

    private Long userId;

    private Long paperId;

    private String paperTitle;

    private LocalDateTime createdAt;
}

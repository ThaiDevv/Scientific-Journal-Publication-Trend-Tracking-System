package com.journaltracker.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookmarkRequest {

    @NotNull(message = "paperId is required")
    private Long paperId;
}

package com.journaltracker.dto;

import lombok.Data;

@Data
public class PaperSummaryResponse {
    Long id;
    String doi;
    String title;
    Integer publicationYear;
}

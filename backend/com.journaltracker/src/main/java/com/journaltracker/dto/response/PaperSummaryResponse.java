package com.journaltracker.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class PaperSummaryResponse {

    private Long id;

    private String title;

    private Integer publicationYear;

    private String journalName;

    private List<String> authors;

    private List<String> keywords;
}
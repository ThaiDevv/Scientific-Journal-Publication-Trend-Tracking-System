package com.journaltracker.dto.response;

import lombok.Data;

import java.util.Set;

@Data
public class PaperResponse {

    private Long id;

    private String doi;

    private String title;

    private String abstractText;

    private Integer publicationYear;

    private String sourceUrl;

    private String sourceApi;

    private JournalResponse journal;

    private Set<AuthorResponse> authors;

    private Set<KeywordResponse> keywords;
}
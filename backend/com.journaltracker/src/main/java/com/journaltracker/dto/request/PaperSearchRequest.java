package com.journaltracker.dto.request;

import lombok.Data;

@Data
public class PaperSearchRequest {

    private String keyword;

    private String author;

    private String journal;

    private Integer yearFrom;

    private Integer yearTo;

    private Integer page = 0;

    private Integer size = 10;

    private String sortBy = "publicationYear";

    private String sortDir = "desc";
}
package com.journaltracker.dto.response;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PaperDetailResponse {

    private Long id;

    private String doi;

    private String title;

    private String abstractText;

    private Integer publicationYear;

    private String sourceUrl;

    private String sourceApi;

    private JournalDetail journal;

    private List<AuthorDetail> authors;

    private List<KeywordDetail> keywords;

    private Boolean isBookmarked;

    private LocalDateTime fetchedAt;

    private LocalDateTime createdAt;

    @Data
    public static class JournalDetail {
        private Long id;
        private String name;
        private String issn;
        private String publisher;
        private String field;
    }

    @Data
    public static class AuthorDetail {
        private Long id;
        private String name;
        private String affiliation;
    }

    @Data
    public static class KeywordDetail {
        private Long id;
        private String name;
    }
}

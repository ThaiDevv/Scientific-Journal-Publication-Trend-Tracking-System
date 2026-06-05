package com.journaltracker.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import lombok.NoArgsConstructor;

import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RawPaperData {
    private String externalId;
    private String doi;
    @NotBlank(message = "Title is required")
    private String title;
    private String abstractText;
    private Integer publicationYear;
    private String sourceUrl;
    private String journalName;
    private String journalIssn;
    private List<String> authorNames;
    private List<String> keywords;
}

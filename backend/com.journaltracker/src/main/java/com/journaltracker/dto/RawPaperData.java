package com.journaltracker.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RawPaperData {

    private String doi;

    private String title;

    private String abstractText;

    private Integer publicationYear;

    private String journalName;

    private List<String> authorNames;

    private List<String> keywords;
}

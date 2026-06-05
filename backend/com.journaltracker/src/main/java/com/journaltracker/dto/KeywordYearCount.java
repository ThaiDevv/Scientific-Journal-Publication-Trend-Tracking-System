package com.journaltracker.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class KeywordYearCount {
    private Long keywordId;
    private Integer year;
    private Long paperCount;
}


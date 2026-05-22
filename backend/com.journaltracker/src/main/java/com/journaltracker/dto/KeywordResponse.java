package com.journaltracker.dto;

import lombok.Data;

@Data
public class KeywordResponse {

    private Long id;

    private String name;

    private Integer usageCount;
}
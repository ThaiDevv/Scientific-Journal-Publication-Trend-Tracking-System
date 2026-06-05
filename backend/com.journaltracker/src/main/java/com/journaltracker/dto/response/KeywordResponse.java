package com.journaltracker.dto.response;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
public class KeywordResponse {
    private Long id;
    private String name;
    private Integer usageCount;
}
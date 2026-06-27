package com.journaltracker.dto.response;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class TopicResponse {
    private Long id;
    private String name;
    private String description;
    private boolean isTrending;

    private List<String> keywords;
    private int paperCount;
}
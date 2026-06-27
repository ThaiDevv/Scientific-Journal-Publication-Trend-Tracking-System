package com.journaltracker.dto.response;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TopicResponse {
    private Long id;
    private String name;
    private String description;
    private boolean isTrending;
}
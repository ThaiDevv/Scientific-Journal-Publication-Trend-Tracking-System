package com.journaltracker.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class UpdateTopicRequest {
    private String name;
    private String description;
    
    @JsonProperty("isTrending")
    private boolean isTrending;
}
package com.journaltracker.dto.request;
import lombok.Data;
import java.util.List;

@Data
public class CreateTopicRequest {
    private String name;
    private String description;
    private List<Long> keywordIds;
}
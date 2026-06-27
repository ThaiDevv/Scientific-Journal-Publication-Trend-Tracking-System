package com.journaltracker.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopicDetailResponse {

    private Long id;
    private String name;
    private String description;
    private boolean isTrending;

    private List<KeywordDto> keywords;

    private List<TrendData> trendData;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class KeywordDto {
        private Long id;
        private String name;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TrendData {
        private int year;
        private int paperCount;
    }
}
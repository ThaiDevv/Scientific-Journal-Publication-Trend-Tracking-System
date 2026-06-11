package com.journaltracker.dto.response;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthorDetailResponse {
    private Long id;
    private String name;
    private String affiliation;
    private int paperCount;

}



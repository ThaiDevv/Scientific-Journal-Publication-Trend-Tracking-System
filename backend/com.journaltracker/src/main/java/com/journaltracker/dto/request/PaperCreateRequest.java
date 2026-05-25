package com.journaltracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaperCreateRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "DOI is required")
    private String doi;

    private String abstractText;

    @NotNull(message = "Publication year is required")
    private Integer publicationYear;

    private String sourceUrl;
    private String sourceApi;
}

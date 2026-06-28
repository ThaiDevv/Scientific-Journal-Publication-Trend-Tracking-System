package com.journaltracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotEmpty(message = "At least one keyword is required")
    private List<String> keywords;

    @NotNull(message = "yearFrom is required")
    private Integer yearFrom;

    @NotNull(message = "yearTo is required")
    private Integer yearTo;

    @Builder.Default
    private String format = "JSON";
}

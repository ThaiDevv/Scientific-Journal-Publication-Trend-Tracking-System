package com.journaltracker.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.journaltracker.entity.ResearchPaper;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
public class SyncResult {
    private String sourceName;
    private int totalFetched;
    private int newPapers;
    private int duplicates;
    private int errors;
    private LocalDate syncedAt;

    @JsonIgnore
    private List<ResearchPaper> syncedPapers = new ArrayList<>();

   
}
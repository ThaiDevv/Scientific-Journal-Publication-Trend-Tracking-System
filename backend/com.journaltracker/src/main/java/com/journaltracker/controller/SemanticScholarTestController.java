package com.journaltracker.controller;

import com.journaltracker.client.SemanticScholarClient;
import com.journaltracker.dto.RawPaperData;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SemanticScholarTestController {

    private final SemanticScholarClient semanticScholarClient;

    @GetMapping("/api/test/semantic")
    public List<RawPaperData> testSemantic(
            @RequestParam String query,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return semanticScholarClient.fetchPapers(query, page, size);
    }
}
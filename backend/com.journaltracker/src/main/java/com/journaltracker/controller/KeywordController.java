package com.journaltracker.controller;

import com.journaltracker.dto.response.KeywordResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.service.KeywordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/keywords")
@RequiredArgsConstructor
public class KeywordController {

    private final KeywordService keywordService;

    @GetMapping("/top")
    public ResponseEntity<List<KeywordResponse>> getTopKeywords(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(keywordService.getTopKeywords(limit));
    }

    @GetMapping("/{name}/papers")
    public ResponseEntity<Page<PaperSummaryResponse>> getPapersByKeyword(
            @PathVariable String name,
            Pageable pageable) {
        return ResponseEntity.ok(keywordService.getPapersByKeyword(name, pageable));
    }
}
package com.journaltracker.controller;

import com.journaltracker.dto.response.AuthorDetailResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {

    private final AuthorService authorService;

    @GetMapping("/{id}")
    public ResponseEntity<AuthorDetailResponse> getAuthorById(@PathVariable Long id) {
        return ResponseEntity.ok(authorService.getAuthorById(id));
    }

    @GetMapping("/{id}/papers")
    public ResponseEntity<Page<PaperSummaryResponse>> getPapersByAuthor(
            @PathVariable Long id,
            Pageable pageable) {
        return ResponseEntity.ok(authorService.getPapersByAuthor(id, pageable));
    }
}
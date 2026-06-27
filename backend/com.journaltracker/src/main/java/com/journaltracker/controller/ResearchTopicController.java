package com.journaltracker.controller;

import com.journaltracker.dto.request.CreateTopicRequest;
import com.journaltracker.dto.request.UpdateTopicRequest;
import com.journaltracker.dto.response.TopicDetailResponse;
import com.journaltracker.dto.response.TopicResponse;
import com.journaltracker.service.ResearchTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/topics")
@RequiredArgsConstructor
public class ResearchTopicController {

    private final ResearchTopicService topicService;

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TopicResponse> createTopic(@RequestBody CreateTopicRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(topicService.createTopic(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<TopicResponse> updateTopic(
            @PathVariable Long id,
            @RequestBody UpdateTopicRequest request) {
        return ResponseEntity.ok(topicService.updateTopic(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteTopic(@PathVariable Long id) {
        topicService.deleteTopic(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/keywords/{keywordId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> addKeywordToTopic(
            @PathVariable Long id,
            @PathVariable Long keywordId) {
        topicService.addKeywordToTopic(id, keywordId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/keywords/{keywordId}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> removeKeywordFromTopic(
            @PathVariable Long id,
            @PathVariable Long keywordId) {
        topicService.removeKeywordFromTopic(id, keywordId);
        return ResponseEntity.noContent().build();
    }


    @GetMapping
    public ResponseEntity<Page<TopicResponse>> getAllTopics(Pageable pageable) {
        return ResponseEntity.ok(topicService.getAllTopics(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TopicDetailResponse> getTopicById(@PathVariable Long id) {
        return ResponseEntity.ok(topicService.getTopicById(id));
    }
}
package com.journaltracker.service;

import com.journaltracker.dto.request.CreateTopicRequest;
import com.journaltracker.dto.request.UpdateTopicRequest;
import com.journaltracker.dto.response.TopicDetailResponse;
import com.journaltracker.dto.response.TopicResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ResearchTopicService {
    TopicResponse createTopic(CreateTopicRequest request);
    TopicResponse updateTopic(Long id, UpdateTopicRequest request);
    void deleteTopic(Long id);
    Page<TopicResponse> getAllTopics(Pageable pageable);
    TopicDetailResponse getTopicById(Long id);
    void addKeywordToTopic(Long topicId, Long keywordId);
    void removeKeywordFromTopic(Long topicId, Long keywordId);
}
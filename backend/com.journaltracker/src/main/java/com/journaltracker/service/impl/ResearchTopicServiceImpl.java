package com.journaltracker.service.impl;

import com.journaltracker.dto.request.CreateTopicRequest;
import com.journaltracker.dto.request.UpdateTopicRequest;
import com.journaltracker.dto.response.TopicResponse;
import com.journaltracker.dto.response.TopicDetailResponse;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.ResearchTopic;
import com.journaltracker.exception.BadRequestException;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.ResearchTopicRepository;
import com.journaltracker.service.ResearchTopicService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ResearchTopicServiceImpl implements ResearchTopicService {

    private final ResearchTopicRepository topicRepository;
    private final KeywordRepository keywordRepository;

    @Override
    @Transactional
    public TopicResponse createTopic(CreateTopicRequest request) {
        ResearchTopic topic = ResearchTopic.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isTrending(false)
                .build();

        if (request.getKeywordIds() != null && !request.getKeywordIds().isEmpty()) {
            List<Keyword> keywords = keywordRepository.findAllById(request.getKeywordIds());
            topic.setKeywords(new HashSet<>(keywords));
        }

        topic = topicRepository.save(topic);
        return mapToResponse(topic);
    }

    @Override
    @Transactional
    public TopicResponse updateTopic(Long id, UpdateTopicRequest request) {
        ResearchTopic topic = topicRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Topic không tồn tại"));

        topic.setName(request.getName());
        topic.setDescription(request.getDescription());
        topic.setTrending(request.isTrending()); // Lombok generate setTrending cho primitive boolean

        return mapToResponse(topicRepository.save(topic));
    }

    @Override
    @Transactional
    public void deleteTopic(Long id) {
        ResearchTopic topic = topicRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Topic không tồn tại"));

        topic.getKeywords().clear();
        topicRepository.save(topic);
        topicRepository.delete(topic);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TopicResponse> getAllTopics(Pageable pageable) {
        return topicRepository.findAll(pageable).map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public TopicDetailResponse getTopicById(Long id) {
        ResearchTopic topic = topicRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Topic không tồn tại"));

        return TopicDetailResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .description(topic.getDescription())
                .isTrending(topic.isTrending())
                .build();
    }

    @Override
    @Transactional
    public void addKeywordToTopic(Long topicId, Long keywordId) {
        ResearchTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new BadRequestException("Topic không tồn tại"));
        Keyword keyword = keywordRepository.findById(keywordId)
                .orElseThrow(() -> new BadRequestException("Keyword không tồn tại"));

        topic.getKeywords().add(keyword);
        topicRepository.save(topic);
    }

    @Override
    @Transactional
    public void removeKeywordFromTopic(Long topicId, Long keywordId) {
        ResearchTopic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new BadRequestException("Topic không tồn tại"));
        Keyword keyword = keywordRepository.findById(keywordId)
                .orElseThrow(() -> new BadRequestException("Keyword không tồn tại"));

        topic.getKeywords().remove(keyword);
        topicRepository.save(topic);
    }

    private TopicResponse mapToResponse(ResearchTopic topic) {
        return TopicResponse.builder()
                .id(topic.getId())
                .name(topic.getName())
                .description(topic.getDescription())
                .isTrending(topic.isTrending())
                .build();
    }
}
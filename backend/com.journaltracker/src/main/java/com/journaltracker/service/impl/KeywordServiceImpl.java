package com.journaltracker.service.impl;

import com.journaltracker.dto.response.KeywordResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.KeywordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KeywordServiceImpl implements KeywordService {

    private final KeywordRepository keywordRepository;
    private final PaperRepository paperRepository;

    @Override
    @Transactional(readOnly = true)
    public List<KeywordResponse> getTopKeywords(int limit) {
        Pageable pageable = PageRequest.of(0, limit);
        return keywordRepository.findAllByOrderByUsageCountDesc(pageable)
                .getContent()
                .stream()
                .map(k -> KeywordResponse.builder()
                        .id(k.getId())
                        .name(k.getName())
                        .usageCount(k.getUsageCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaperSummaryResponse> getPapersByKeyword(String keywordName, Pageable pageable) {
        return paperRepository.findByKeywords_NameIgnoreCase(keywordName, pageable)
                .map(paper -> PaperSummaryResponse.builder()
                        .id(paper.getId())
                        .title(paper.getTitle())
                        .build());
    }
}
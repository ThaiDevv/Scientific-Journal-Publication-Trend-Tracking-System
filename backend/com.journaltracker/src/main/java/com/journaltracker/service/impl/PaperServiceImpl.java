package com.journaltracker.service.impl;

import com.journaltracker.dto.request.PaperSearchRequest;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.PaperService;
import com.journaltracker.specification.PaperSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaperServiceImpl implements PaperService {

    private final PaperRepository paperRepository;

    @Override
    public Page<PaperSummaryResponse> searchPapers(
            PaperSearchRequest request
    ) {

        Sort sort = request.getSortDir().equalsIgnoreCase("asc")
                ? Sort.by(request.getSortBy()).ascending()
                : Sort.by(request.getSortBy()).descending();

        Pageable pageable = PageRequest.of(
                request.getPage(),
                request.getSize(),
                sort
        );

        Specification<ResearchPaper> specification =
                Specification
                        .where(PaperSpecification.hasKeyword(request.getKeyword()))
                        .and(PaperSpecification.hasAuthor(request.getAuthor()))
                        .and(PaperSpecification.hasJournal(request.getJournal()))
                        .and(PaperSpecification.yearGreaterThanOrEqual(request.getYearFrom()))
                        .and(PaperSpecification.yearLessThanOrEqual(request.getYearTo()));

        Page<ResearchPaper> paperPage =
                paperRepository.findAll(specification, pageable);

        return paperPage.map(this::mapToSummaryResponse);
    }

    private PaperSummaryResponse mapToSummaryResponse(
            ResearchPaper paper
    ) {

        PaperSummaryResponse response =
                new PaperSummaryResponse();

        response.setId(paper.getId());

        response.setTitle(paper.getTitle());

        response.setPublicationYear(
                paper.getPublicationYear()
        );

        if (paper.getJournal() != null) {
            response.setJournalName(
                    paper.getJournal().getName()
            );
        }

        response.setAuthors(
                paper.getAuthors()
                        .stream()
                        .map(author -> author.getName())
                        .collect(Collectors.toList())
        );

        response.setKeywords(
                paper.getKeywords()
                        .stream()
                        .map(keyword -> keyword.getName())
                        .collect(Collectors.toList())
        );

        return response;
    }
}
package com.journaltracker.service.impl;

import com.journaltracker.dto.request.PaperSearchRequest;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.mapper.PaperMapper;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.PaperService;
import com.journaltracker.specification.PaperSpecification;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaperServiceImpl implements PaperService {

    private final PaperRepository paperRepository;
    private final PaperMapper paperMapper;

    @Override
    @Transactional(readOnly = true)
    public Page<PaperSummaryResponse> searchPapers(
            PaperSearchRequest request
    ) {

        // Default sort values
        String sortBy = request.getSortBy() != null
                ? request.getSortBy()
                : "publicationYear";

        String sortDir = request.getSortDir() != null
                ? request.getSortDir()
                : "desc";

        Sort sort = sortDir.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(
                request.getPage() != null ? request.getPage() : 0,
                request.getSize() != null ? request.getSize() : 10,
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

        return paperPage.map(paperMapper::toSummaryResponse);
    }
}

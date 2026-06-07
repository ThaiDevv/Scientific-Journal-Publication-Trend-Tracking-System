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

import java.util.Set;

@Service
@RequiredArgsConstructor
public class PaperServiceImpl implements PaperService {

    private final PaperRepository paperRepository;
    private final PaperMapper paperMapper;
    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "publicationYear", "title", "createdAt", "id"
    );

    @Override
    public Page<PaperSummaryResponse> searchPapers(
            PaperSearchRequest request
    ) {
        String sortBy = request.getSortBy() != null
                && ALLOWED_SORT_FIELDS.contains(request.getSortBy())
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
package com.journaltracker.service.impl;

import com.journaltracker.dto.response.AuthorDetailResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.Author;
import com.journaltracker.repository.AuthorRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.AuthorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthorServiceImpl implements AuthorService {

    private final AuthorRepository authorRepository;
    private final PaperRepository paperRepository;

    @Override
    @Transactional(readOnly = true)
    public AuthorDetailResponse getAuthorById(Long id) {
        Author author = authorRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found"));

        return AuthorDetailResponse.builder()
                .id(author.getId())
                .name(author.getName())
                .affiliation(author.getAffiliation())
                .paperCount(author.getPaperCount() != null ? author.getPaperCount() : 0)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaperSummaryResponse> getPapersByAuthor(Long authorId, Pageable pageable) {
        if (!authorRepository.existsById(authorId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Author not found");
        }

        return paperRepository.findByAuthors_Id(authorId, pageable)
                .map(paper -> PaperSummaryResponse.builder()
                        .id(paper.getId())
                        .title(paper.getTitle())
                        .build());
    }
}
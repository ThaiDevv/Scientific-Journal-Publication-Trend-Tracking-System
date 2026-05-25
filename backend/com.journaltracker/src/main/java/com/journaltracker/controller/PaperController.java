package com.journaltracker.controller;

import com.journaltracker.dto.request.PaperCreateRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.exception.AccessDeniedException;
import com.journaltracker.exception.BadRequestException;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.ResourceNotFoundException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.ResearchPaperRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/papers")
@RequiredArgsConstructor
public class PaperController {

    private final ResearchPaperRepository paperRepository;

    @GetMapping
    public ApiResponse<List<ResearchPaper>> getAllPapers() {
        List<ResearchPaper> papers = paperRepository.findAll();
        return ApiResponse.success("Fetched all papers successfully", papers);
    }

    @GetMapping("/{id}")
    public ApiResponse<ResearchPaper> getPaperById(@PathVariable Long id) {
        ResearchPaper paper = paperRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paper not found with id: " + id));
        return ApiResponse.success("Fetched paper successfully", paper);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ResearchPaper> createPaper(@Valid @RequestBody PaperCreateRequest request) {
        if (paperRepository.findByDoi(request.getDoi()).isPresent()) {
            throw new DuplicateResourceException("Paper not created: DOI " + request.getDoi() + " already exists");
        }

        ResearchPaper paper = ResearchPaper.builder()
                .title(request.getTitle())
                .doi(request.getDoi())
                .abstractText(request.getAbstractText())
                .publicationYear(request.getPublicationYear())
                .sourceUrl(request.getSourceUrl())
                .sourceApi(request.getSourceApi())
                .build();

        ResearchPaper savedPaper = paperRepository.save(paper);
        return ApiResponse.success("Paper created successfully", savedPaper);
    }

    @GetMapping("/test-bad-request")
    public ApiResponse<Void> testBadRequest() {
        throw new BadRequestException("Invalid request data. Please check parameters.");
    }

    @GetMapping("/test-unauthorized")
    public ApiResponse<Void> testUnauthorized() {
        throw new UnauthorizedException("Authentication token is missing or expired.");
    }

    @GetMapping("/test-forbidden")
    public ApiResponse<Void> testForbidden() {
        throw new AccessDeniedException("You do not have the required role to access this resource.");
    }

    @GetMapping("/test-error")
    public ApiResponse<Void> testUnexpectedError() {
        throw new RuntimeException("An internal database error or calculation error occurred.");
    }
}

package com.journaltracker.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.journaltracker.dto.request.PaperCreateRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.exception.AccessDeniedException;
import com.journaltracker.exception.BadRequestException;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.GlobalExceptionHandler;
import com.journaltracker.exception.ResourceNotFoundException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.ResearchPaperRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;

class PaperControllerTest {

    private PaperController paperController;

    @Mock
    private ResearchPaperRepository paperRepository;

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        paperController = new PaperController(paperRepository);
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    void getPaperById_WhenFound_ReturnsSuccessApiResponse() {
        ResearchPaper paper = ResearchPaper.builder()
                .id(1L)
                .title("Scientific discovery")
                .doi("10.1000/xyz")
                .publicationYear(2026)
                .build();
        when(paperRepository.findById(1L)).thenReturn(Optional.of(paper));

        ApiResponse<ResearchPaper> response = paperController.getPaperById(1L);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isEqualTo("Fetched paper successfully");
        assertThat(response.getData()).isEqualTo(paper);
        assertThat(response.getTimestamp()).isNotNull();
    }

    @Test
    void getPaperById_WhenNotFound_ThrowsResourceNotFoundException() {
        when(paperRepository.findById(999L)).thenReturn(Optional.empty());

        try {
            paperController.getPaperById(999L);
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(ResourceNotFoundException.class);
            assertThat(ex.getMessage()).isEqualTo("Paper not found with id: 999");

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleResourceNotFoundException((ResourceNotFoundException) ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("Paper not found with id: 999");
            assertThat(body.getTimestamp()).isNotNull();
        }
    }

    @Test
    void createPaper_WhenDoiExists_ThrowsDuplicateResourceException() {
        ResearchPaper existing = ResearchPaper.builder().id(1L).doi("10.1000/xyz").build();
        when(paperRepository.findByDoi("10.1000/xyz")).thenReturn(Optional.of(existing));

        PaperCreateRequest request = PaperCreateRequest.builder().doi("10.1000/xyz").build();

        try {
            paperController.createPaper(request);
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(DuplicateResourceException.class);
            assertThat(ex.getMessage()).isEqualTo("Paper not created: DOI 10.1000/xyz already exists");

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleDuplicateResourceException((DuplicateResourceException) ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("Paper not created: DOI 10.1000/xyz already exists");
            assertThat(body.getTimestamp()).isNotNull();
        }
    }

    @Test
    void testBadRequest_ThrowsBadRequestException() {
        try {
            paperController.testBadRequest();
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(BadRequestException.class);
            assertThat(ex.getMessage()).isEqualTo("Invalid request data. Please check parameters.");

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleBadRequestException((BadRequestException) ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("Invalid request data. Please check parameters.");
        }
    }

    @Test
    void testUnauthorized_ThrowsUnauthorizedException() {
        try {
            paperController.testUnauthorized();
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(UnauthorizedException.class);
            assertThat(ex.getMessage()).isEqualTo("Authentication token is missing or expired.");

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleUnauthorizedException((UnauthorizedException) ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("Authentication token is missing or expired.");
        }
    }

    @Test
    void testForbidden_ThrowsAccessDeniedException() {
        try {
            paperController.testForbidden();
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(AccessDeniedException.class);
            assertThat(ex.getMessage()).isEqualTo("You do not have the required role to access this resource.");

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleAccessDeniedException(ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("You do not have the required role to access this resource.");
        }
    }

    @Test
    void testUnexpectedError_ThrowsRuntimeException() {
        try {
            paperController.testUnexpectedError();
        } catch (Exception ex) {
            assertThat(ex).isInstanceOf(RuntimeException.class);

            ResponseEntity<ApiResponse<Void>> responseEntity = exceptionHandler.handleGlobalException(ex);
            assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
            ApiResponse<Void> body = responseEntity.getBody();
            assertThat(body).isNotNull();
            assertThat(body.isSuccess()).isFalse();
            assertThat(body.getMessage()).isEqualTo("An unexpected error occurred. Please contact the administrator.");
        }
    }

    @Test
    void testValidationExceptionHandling() {
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        BindingResult bindingResult = mock(BindingResult.class);
        FieldError fieldError = new FieldError("PaperCreateRequest", "title", "Title is required");
        when(ex.getBindingResult()).thenReturn(bindingResult);
        when(bindingResult.getAllErrors()).thenReturn(Collections.singletonList(fieldError));

        ResponseEntity<ApiResponse<Map<String, String>>> responseEntity = exceptionHandler.handleValidationException(ex);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        ApiResponse<Map<String, String>> body = responseEntity.getBody();
        assertThat(body).isNotNull();
        assertThat(body.isSuccess()).isFalse();
        assertThat(body.getMessage()).isEqualTo("Validation failed");
        assertThat(body.getData().get("title")).isEqualTo("Title is required");
    }
}

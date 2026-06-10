package com.journaltracker.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaltracker.client.ExternalApiClient;
import com.journaltracker.config.CrossrefProperties;
import com.journaltracker.dto.RawPaperData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeoutException;
import java.util.regex.Pattern;

@Slf4j
@Component
public class CrossrefClient implements ExternalApiClient {

    private static final String SOURCE_NAME = "Crossref";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final Pattern XML_TAG_PATTERN = Pattern.compile("<[^>]+>");

    private final WebClient webClient;
    private final CrossrefProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public CrossrefClient(WebClient.Builder webClientBuilder, CrossrefProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.getUserAgent())
                .build();
    }

    CrossrefClient(WebClient webClient, CrossrefProperties properties) {
        this.webClient = webClient;
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public String getSourceName() {
        return SOURCE_NAME;
    }

    @Override
    public List<RawPaperData> fetchPapers(String query, int page, int pageSize) {
        int requestedSize = normalizeSize(pageSize);
        int offset = offsetFor(page, requestedSize);

        return executeWorksRequest(webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/works")
                        .queryParam("query", query)
                        .queryParam("rows", requestedSize)
                        .queryParam("offset", offset)
                        .build()), requestedSize);
    }

    @Override
    public List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int pageSize) {
        int requestedSize = normalizeSize(pageSize);
        int offset = offsetFor(page, requestedSize);

        return executeWorksRequest(webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/works")
                        .queryParam("filter", "from-pub-date:" + fromDate)
                        .queryParam("rows", requestedSize)
                        .queryParam("offset", offset)
                        .build()), requestedSize);
    }

    @Override
    public boolean isAvailable() {
        try {
            webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/works")
                            .queryParam("rows", 1)
                            .build())
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(REQUEST_TIMEOUT)
                    .retryWhen(rateLimitRetry())
                    .block();
            return true;
        } catch (Exception exception) {
            log.warn("Crossref health check failed: {}", exception.getMessage());
            return false;
        }
    }

    private List<RawPaperData> executeWorksRequest(WebClient.RequestHeadersSpec<?> requestSpec, int limit) {
        try {
            String body = requestSpec
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(REQUEST_TIMEOUT)
                    .retryWhen(rateLimitRetry())
                    .block();

            JsonNode items = objectMapper.readTree(body).path("message").path("items");
            if (!items.isArray()) {
                return List.of();
            }

            List<RawPaperData> papers = new ArrayList<>();
            items.forEach(item -> {
                RawPaperData paper = toRawPaperData(item);
                if (isCompletePaper(paper) && papers.size() < limit) {
                    papers.add(paper);
                }
            });
            return papers;
        } catch (Exception exception) {
            if (isTimeout(exception)) {
                log.warn("Crossref request timed out. Skipping current batch.");
            } else {
                log.warn("Crossref request failed. Skipping current batch: {}", exception.getMessage());
            }
            return List.of();
        }
    }

    private Retry rateLimitRetry() {
        return Retry.fixedDelay(1, Duration.ofSeconds(1))
                .filter(this::isRateLimitException)
                .doBeforeRetry(retrySignal -> log.warn("Crossref rate limit hit. Retrying after 1 second."));
    }

    private boolean isRateLimitException(Throwable throwable) {
        return throwable instanceof WebClientResponseException.TooManyRequests
                || (throwable instanceof WebClientResponseException responseException
                && responseException.getStatusCode().value() == 429);
    }

    private boolean isTimeout(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof TimeoutException) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private RawPaperData toRawPaperData(JsonNode item) {
        return RawPaperData.builder()
                .externalId(textOrNull(item, "DOI"))
                .doi(textOrNull(item, "DOI"))
                .title(firstText(item.get("title")))
                .abstractText(cleanAbstract(textOrNull(item, "abstract")))
                .publicationYear(publicationYear(item))
                .sourceUrl(textOrNull(item, "URL"))
                .journalName(firstText(item.get("container-title")))
                .journalIssn(firstText(item.get("ISSN")))
                .authorNames(authorNames(item.get("author")))
                .authorAffiliations(List.of())
                .keywords(subjects(item.get("subject")))
                .build();
    }

    private Integer publicationYear(JsonNode item) {
        JsonNode year = item.path("published").path("date-parts").path(0).path(0);
        return year.canConvertToInt() ? year.asInt() : null;
    }

    private List<String> authorNames(JsonNode authors) {
        if (authors == null || !authors.isArray()) {
            return List.of();
        }

        List<String> names = new ArrayList<>();
        authors.forEach(author -> {
            String given = textOrNull(author, "given");
            String family = textOrNull(author, "family");
            String name = joinName(given, family);
            if (name != null) {
                names.add(name);
            }
        });
        return names;
    }

    private List<String> subjects(JsonNode subjectNode) {
        if (subjectNode == null || !subjectNode.isArray()) {
            return List.of();
        }

        List<String> subjects = new ArrayList<>();
        subjectNode.forEach(subject -> {
            if (subject.isTextual() && !subject.asText().isBlank()) {
                subjects.add(subject.asText());
            }
        });
        return subjects;
    }

    private String firstText(JsonNode node) {
        if (node == null || !node.isArray() || node.isEmpty() || !node.get(0).isTextual()) {
            return null;
        }
        String value = node.get(0).asText();
        return value.isBlank() ? null : value;
    }

    private String textOrNull(JsonNode node, String fieldName) {
        if (node == null || node.path(fieldName).isMissingNode() || node.path(fieldName).isNull()) {
            return null;
        }
        String value = node.path(fieldName).asText();
        return value.isBlank() ? null : value;
    }

    private String cleanAbstract(String value) {
        if (value == null) {
            return null;
        }
        String cleaned = XML_TAG_PATTERN.matcher(value)
                .replaceAll(" ")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&amp;", "&")
                .replaceAll("\\s+", " ")
                .trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private String joinName(String given, String family) {
        if (given == null) {
            return family;
        }
        if (family == null) {
            return given;
        }
        return given + " " + family;
    }

    private boolean isCompletePaper(RawPaperData paper) {
        return hasText(paper.getTitle())
                && hasText(paper.getDoi())
                && paper.getPublicationYear() != null
                && paper.getAuthorNames() != null
                && !paper.getAuthorNames().isEmpty();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private int offsetFor(int page, int size) {
        return (Math.max(page, 1) - 1) * size;
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return properties.getRows();
        }
        return size;
    }
}

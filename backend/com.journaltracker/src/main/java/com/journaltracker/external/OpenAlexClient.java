package com.journaltracker.external;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.journaltracker.client.ExternalApiClient;
import com.journaltracker.config.OpenAlexProperties;
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
import java.util.Comparator;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Slf4j
@Component
public class OpenAlexClient implements ExternalApiClient {

    private static final String SOURCE_NAME = "OpenAlex";
    private static final String COMPUTER_SCIENCE_CONCEPT_ID = "C41008148";
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);
    private static final int MAX_PAGE_ATTEMPTS = 5;

    private final WebClient webClient;
    private final OpenAlexProperties properties;
    private final ObjectMapper objectMapper;

    @Autowired
    public OpenAlexClient(WebClient.Builder webClientBuilder, OpenAlexProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.webClient = webClientBuilder
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, "mailto:" + properties.getEmail())
                .build();
    }

    OpenAlexClient(WebClient webClient, OpenAlexProperties properties) {
        this.webClient = webClient;
        this.properties = properties;
        this.objectMapper = new ObjectMapper();
    }

    @Override
    public List<RawPaperData> fetchPapers(String query, int page, int size) {
        int requestedSize = normalizeSize(size);
        int startPage = normalizePage(page);
        List<RawPaperData> papers = new ArrayList<>();

        for (int currentPage = startPage; papers.size() < requestedSize && currentPage < startPage + MAX_PAGE_ATTEMPTS; currentPage++) {
            int pageForRequest = currentPage;
            List<RawPaperData> batch = executeWorksRequest(webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/works")
                            .queryParam("search", query)
                            .queryParam("filter", "concepts.id:" + COMPUTER_SCIENCE_CONCEPT_ID)
                            .queryParam("per_page", requestedSize)
                            .queryParam("page", pageForRequest)
                            .build()), requestedSize - papers.size());
            if (batch.isEmpty()) {
                break;
            }
            papers.addAll(batch);
        }

        return papers;
    }

    @Override
    public List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int size) {
        int requestedSize = normalizeSize(size);
        String filter = "from_publication_date:" + fromDate + ",concepts.id:" + COMPUTER_SCIENCE_CONCEPT_ID;

        int startPage = normalizePage(page);
        List<RawPaperData> papers = new ArrayList<>();

        for (int currentPage = startPage; papers.size() < requestedSize && currentPage < startPage + MAX_PAGE_ATTEMPTS; currentPage++) {
            int pageForRequest = currentPage;
            List<RawPaperData> batch = executeWorksRequest(webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/works")
                            .queryParam("filter", filter)
                            .queryParam("per_page", requestedSize)
                            .queryParam("page", pageForRequest)
                            .build()), requestedSize - papers.size());
            if (batch.isEmpty()) {
                break;
            }
            papers.addAll(batch);
        }

        return papers;
    }

    @Override
    public String getSourceName() {
        return SOURCE_NAME;
    }

    @Override
    public boolean isAvailable() {
        try {
            webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/works")
                            .queryParam("per_page", 1)
                            .build())
                    .retrieve()
                    .toBodilessEntity()
                    .timeout(REQUEST_TIMEOUT)
                    .retryWhen(rateLimitRetry())
                    .block();
            return true;
        } catch (Exception exception) {
            log.warn("OpenAlex health check failed: {}", exception.getMessage());
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

            JsonNode response = objectMapper.readTree(body);
            if (response == null || !response.has("results")) {
                return List.of();
            }

            List<RawPaperData> papers = new ArrayList<>();
            response.get("results").forEach(result -> {
                RawPaperData paper = toRawPaperData(result);
                if (isCompletePaper(paper) && papers.size() < limit) {
                    papers.add(paper);
                }
            });
            return papers;
        } catch (Exception exception) {
            if (isTimeout(exception)) {
                log.warn("OpenAlex request timed out. Skipping current batch.");
            } else {
                log.warn("OpenAlex request failed. Skipping current batch: {}", exception.getMessage());
            }
            return List.of();
        }
    }

    private Retry rateLimitRetry() {
        return Retry.fixedDelay(1, Duration.ofSeconds(1))
                .filter(this::isRateLimitException)
                .doBeforeRetry(retrySignal -> log.warn("OpenAlex rate limit hit. Retrying after 1 second."));
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

    private RawPaperData toRawPaperData(JsonNode result) {
        return RawPaperData.builder()
                .doi(textOrNull(result, "doi"))
                .title(textOrNull(result, "title"))
                .abstractText(convertAbstractInvertedIndex(result.get("abstract_inverted_index")))
                .publicationYear(integerOrNull(result, "publication_year"))
                .journalName(journalName(result))
                .authorNames(authorNames(result.get("authorships")))
                .keywords(keywords(result.get("concepts")))
                .build();
    }

    String convertAbstractInvertedIndex(JsonNode invertedIndex) {
        if (invertedIndex == null || invertedIndex.isNull() || !invertedIndex.isObject()) {
            return null;
        }

        List<WordPosition> positions = new ArrayList<>();
        Iterator<Map.Entry<String, JsonNode>> fields = invertedIndex.fields();
        while (fields.hasNext()) {
            Map.Entry<String, JsonNode> field = fields.next();
            if (!field.getValue().isArray()) {
                continue;
            }
            field.getValue().forEach(position -> {
                if (position.canConvertToInt()) {
                    positions.add(new WordPosition(field.getKey(), position.asInt()));
                }
            });
        }

        positions.sort(Comparator.comparingInt(WordPosition::position));
        List<String> words = positions.stream()
                .map(WordPosition::word)
                .toList();
        return words.isEmpty() ? null : String.join(" ", words);
    }

    private String journalName(JsonNode result) {
        JsonNode source = result.path("primary_location").path("source");
        return textOrNull(source, "display_name");
    }

    private List<String> authorNames(JsonNode authorships) {
        if (authorships == null || !authorships.isArray()) {
            return List.of();
        }

        List<String> names = new ArrayList<>();
        authorships.forEach(authorship -> {
            String name = textOrNull(authorship.path("author"), "display_name");
            if (name != null) {
                names.add(name);
            }
        });
        return names;
    }

    private List<String> keywords(JsonNode concepts) {
        if (concepts == null || !concepts.isArray()) {
            return List.of();
        }

        List<String> keywords = new ArrayList<>();
        concepts.forEach(concept -> {
            if (keywords.size() < 5) {
                String keyword = textOrNull(concept, "display_name");
                if (keyword != null) {
                    keywords.add(keyword);
                }
            }
        });
        return keywords;
    }

    private String textOrNull(JsonNode node, String fieldName) {
        if (node == null || node.path(fieldName).isMissingNode() || node.path(fieldName).isNull()) {
            return null;
        }
        return node.path(fieldName).asText();
    }

    private Integer integerOrNull(JsonNode node, String fieldName) {
        if (node == null || node.path(fieldName).isMissingNode() || node.path(fieldName).isNull()) {
            return null;
        }
        return node.path(fieldName).asInt();
    }

    private boolean isCompletePaper(RawPaperData paper) {
        return hasText(paper.getTitle())
                && hasText(paper.getDoi())
                && paper.getPublicationYear() != null
                && paper.getAuthorNames() != null
                && !paper.getAuthorNames().isEmpty()
                && paper.getKeywords() != null
                && !paper.getKeywords().isEmpty();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private int normalizePage(int page) {
        return Math.max(page, 1);
    }

    private int normalizeSize(int size) {
        if (size <= 0) {
            return properties.getPerPage();
        }
        return size;
    }

    private record WordPosition(String word, int position) {
    }
}

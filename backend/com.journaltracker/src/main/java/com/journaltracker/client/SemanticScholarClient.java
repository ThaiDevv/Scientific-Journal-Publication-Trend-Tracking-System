package com.journaltracker.client;

import com.journaltracker.dto.RawPaperData;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.databind.JsonNode;

import java.util.ArrayList;

import com.google.common.util.concurrent.RateLimiter;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SemanticScholarClient implements ExternalApiClient {

    private final RestTemplate restTemplate;

    private final ObjectMapper objectMapper;

    private static final RateLimiter RATE_LIMITER =
            RateLimiter.create(100.0 / (5 * 60));
    @Value("${external-api.semanticscholar.base-url}")
    private String baseUrl;

    @Value("${external-api.semanticscholar.api-key:}")
    private String apiKey;

    @Override
    public String getSourceName() {
        return "SemanticScholar";
    }

    @Override
    public List<RawPaperData> fetchPapers(String query, int page, int pageSize) {

        RATE_LIMITER.acquire();
        int offset = (page - 1) * pageSize;

        String url = UriComponentsBuilder
                .fromUriString(baseUrl + "/graph/v1/paper/search")
                .queryParam("query", query)
                .queryParam("limit", pageSize)
                .queryParam("offset", offset)
                .queryParam(
                        "fields",
                        "title,abstract,year,authors,journal,externalIds"
                )
                .toUriString();

        System.out.println(url);
        HttpHeaders headers = new HttpHeaders();

        if (apiKey != null && !apiKey.isBlank()) {
            headers.set("x-api-key", apiKey);
        }

        HttpEntity<String> entity = new HttpEntity<>(headers);

        ResponseEntity<String> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                String.class
        );

        try {

            JsonNode root = objectMapper.readTree(response.getBody());

            JsonNode papers = root.path("data");

            List<RawPaperData> results = new ArrayList<>();

            for (JsonNode paper : papers) {

                List<String> authors = new ArrayList<>();

                JsonNode authorNodes = paper.path("authors");

                if (authorNodes.isArray()) {
                    for (JsonNode author : authorNodes) {
                        authors.add(author.path("name").asText(""));
                    }
                }

                RawPaperData rawPaper = RawPaperData.builder()
                        .doi(paper.path("externalIds").path("DOI").asText(""))
                        .title(paper.path("title").asText(""))
                        .abstractText(paper.path("abstract").asText(""))
                        .publicationYear(
                                paper.path("year").isMissingNode()
                                        ? null
                                        : paper.path("year").asInt()
                        )
                        .journalName(
                                paper.path("journal").path("name").asText("")
                        )
                        .authorNames(authors)
                        .build();

                results.add(rawPaper);
            }

            return results;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Semantic Scholar response", e);
        }
    }
    @Override
    public List<RawPaperData> fetchRecentPapers(LocalDate fromDate, int page, int pageSize) {

        String query = "year:" + fromDate.getYear();

        return fetchPapers(query, page, pageSize);
    }

    @Override
    public boolean isAvailable() {

        try {

            String url = baseUrl + "/graph/v1/paper/search?query=AI&limit=1";

            restTemplate.getForObject(url, String.class);

            return true;

        } catch (Exception e) {

            return false;

        }
    }
}
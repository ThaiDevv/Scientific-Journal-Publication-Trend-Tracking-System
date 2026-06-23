package com.journaltracker.external;

import com.journaltracker.client.ExternalApiClient;
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
            RateLimiter.create(1.0);
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
                        "title,abstract,year,authors,journal,publicationVenue,externalIds,url,s2FieldsOfStudy"
                )
                .toUriString();

        System.out.println(url);
        HttpHeaders headers = new HttpHeaders();;
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

                String externalId = paper.path("paperId").isMissingNode() || paper.path("paperId").isNull()
                        ? null
                        : paper.path("paperId").asText();

                String doiValue = paper.path("externalIds").path("DOI").asText("");

                String sourceUrlValue = paper.path("url").isMissingNode() || paper.path("url").isNull()
                        ? null
                        : paper.path("url").asText();

                String journalIssnValue = paper.path("publicationVenue").path("issn").isMissingNode() || paper.path("publicationVenue").path("issn").isNull()
                        ? null
                        : paper.path("publicationVenue").path("issn").asText();

                String journalNameValue = paper.path("journal").path("name").asText("");
                if (journalNameValue.isEmpty()) {
                    journalNameValue = paper.path("publicationVenue").path("name").asText("");
                }

                List<String> keywords = new ArrayList<>();
                JsonNode s2Fields = paper.path("s2FieldsOfStudy");
                if (s2Fields.isArray()) {
                    for (JsonNode field : s2Fields) {
                        String category = field.path("category").asText("");
                        if (!category.isEmpty()) {
                            keywords.add(category);
                        }
                    }
                }

                RawPaperData rawPaper = RawPaperData.builder()
                        .externalId(externalId)
                        .doi(doiValue)
                        .title(paper.path("title").asText(""))
                        .abstractText(paper.path("abstract").asText(""))
                        .publicationYear(
                                paper.path("year").isMissingNode()
                                        ? null
                                        : paper.path("year").asInt()
                        )
                        .sourceUrl(sourceUrlValue)
                        .journalName(journalNameValue)
                        .journalIssn(journalIssnValue)
                        .authorNames(authors)
                        .keywords(keywords)
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

            HttpHeaders headers = new HttpHeaders();
            if (apiKey != null && !apiKey.isBlank()) {
                headers.set("x-api-key", apiKey);
            }
            HttpEntity<String> entity = new HttpEntity<>(headers);

            restTemplate.exchange(url, HttpMethod.GET, entity, String.class);

            return true;

        } catch (Exception e) {

            return false;

        }
    }
}
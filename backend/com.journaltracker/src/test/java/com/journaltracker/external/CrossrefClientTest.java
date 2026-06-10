package com.journaltracker.external;

import com.journaltracker.config.CrossrefProperties;
import com.journaltracker.dto.RawPaperData;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.TimeoutException;

import static org.assertj.core.api.Assertions.assertThat;

class CrossrefClientTest {

    @Test
    void fetchPapersMapsCrossrefResponseAndStripsXmlTags() {
        CrossrefClient client = newClient(request -> Mono.just(jsonResponse("""
                {
                  "message": {
                    "items": [
                      {
                        "DOI": "10.1000/crossref-test",
                        "title": ["Artificial Intelligence Paper"],
                        "abstract": "<jats:p>Artificial <jats:italic>intelligence</jats:italic> works.</jats:p>",
                        "published": {
                          "date-parts": [[2025, 6, 1]]
                        },
                        "container-title": ["Journal of AI"],
                        "author": [
                          {"given": "Ada", "family": "Lovelace"},
                          {"family": "Turing"}
                        ],
                        "subject": ["Artificial Intelligence", "Computer Science"],
                        "URL": "https://doi.org/10.1000/crossref-test",
                        "ISSN": ["1234-5678"]
                      }
                    ]
                  }
                }
                """)));

        List<RawPaperData> papers = client.fetchPapers("artificial intelligence", 1, 10);

        assertThat(papers).hasSize(1);
        RawPaperData paper = papers.get(0);
        assertThat(paper.getDoi()).isEqualTo("10.1000/crossref-test");
        assertThat(paper.getTitle()).isEqualTo("Artificial Intelligence Paper");
        assertThat(paper.getAbstractText()).isEqualTo("Artificial intelligence works.");
        assertThat(paper.getPublicationYear()).isEqualTo(2025);
        assertThat(paper.getJournalName()).isEqualTo("Journal of AI");
        assertThat(paper.getAuthorNames()).containsExactly("Ada Lovelace", "Turing");
        assertThat(paper.getKeywords()).containsExactly("Artificial Intelligence", "Computer Science");
    }

    @Test
    void fetchPapersUsesQueryRowsOffsetAndPoliteUserAgent() {
        AtomicReference<ClientRequest> capturedRequest = new AtomicReference<>();
        CrossrefClient client = newClient(request -> {
            capturedRequest.set(request);
            return Mono.just(jsonResponse("{\"message\":{\"items\":[]}}"));
        });

        client.fetchPapers("artificial intelligence", 2, 10);

        assertThat(capturedRequest.get().url().toString()).contains("/works");
        assertThat(capturedRequest.get().url().toString()).contains("query=artificial%20intelligence");
        assertThat(capturedRequest.get().url().toString()).contains("rows=10");
        assertThat(capturedRequest.get().url().toString()).contains("offset=10");
        assertThat(capturedRequest.get().headers().getFirst(HttpHeaders.USER_AGENT))
                .isEqualTo("JournalTracker/1.0 (mailto:test@example.com)");
    }

    @Test
    void fetchRecentPapersUsesCrossrefRecentFilter() {
        AtomicReference<String> url = new AtomicReference<>();
        CrossrefClient client = newClient(request -> {
            url.set(request.url().toString());
            return Mono.just(jsonResponse("{\"message\":{\"items\":[]}}"));
        });

        client.fetchRecentPapers(LocalDate.of(2026, 5, 25), 1, 10);

        assertThat(url.get()).contains("/works");
        assertThat(url.get()).contains("from-pub-date:2026-05-25");
        assertThat(url.get()).contains("rows=10");
        assertThat(url.get()).contains("offset=0");
    }

    @Test
    void retriesOnceWhenRateLimited() {
        AtomicInteger calls = new AtomicInteger();
        CrossrefClient client = newClient(request -> {
            if (calls.incrementAndGet() == 1) {
                return Mono.just(ClientResponse.create(HttpStatus.TOO_MANY_REQUESTS).build());
            }
            return Mono.just(jsonResponse("{\"message\":{\"items\":[]}}"));
        });

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
        assertThat(calls).hasValue(2);
    }

    @Test
    void returnsEmptyListWhenRequestFails() {
        CrossrefClient client = newClient(request -> Mono.error(new RuntimeException("network down")));

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
    }

    @Test
    void returnsEmptyListWhenRequestTimesOut() {
        CrossrefClient client = newClient(request -> Mono.error(new TimeoutException("request timed out")));

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
    }

    @Test
    void isAvailableReturnsTrueWhenCrossrefIsReachable() {
        CrossrefClient client = newClient(request -> Mono.just(ClientResponse.create(HttpStatus.OK).build()));

        assertThat(client.isAvailable()).isTrue();
        assertThat(client.getSourceName()).isEqualTo("Crossref");
    }

    private CrossrefClient newClient(ExchangeFunction exchangeFunction) {
        CrossrefProperties properties = new CrossrefProperties();
        properties.setBaseUrl("https://api.crossref.org");
        properties.setUserAgent("JournalTracker/1.0 (mailto:test@example.com)");
        properties.setRows(25);
        WebClient webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.USER_AGENT, properties.getUserAgent())
                .exchangeFunction(exchangeFunction)
                .build();
        return new CrossrefClient(webClient, properties);
    }

    private ClientResponse jsonResponse(String body) {
        return ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(body)
                .build();
    }
}

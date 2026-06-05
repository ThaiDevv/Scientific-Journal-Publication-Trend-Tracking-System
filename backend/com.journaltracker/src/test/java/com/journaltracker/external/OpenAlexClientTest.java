package com.journaltracker.external;

import com.journaltracker.config.OpenAlexProperties;
import com.journaltracker.dto.RawPaperData;
import org.junit.jupiter.api.Test;
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

class OpenAlexClientTest {

    @Test
    void fetchPapersMapsOpenAlexResponse() {
        OpenAlexClient client = newClient(request -> Mono.just(jsonResponse("""
                {
                  "results": [
                    {
                      "doi": "https://doi.org/10.1000/test",
                      "title": "Machine Learning Paper",
                      "abstract_inverted_index": {
                        "Machine": [0],
                        "learning": [1],
                        "works": [2]
                      },
                      "publication_year": 2025,
                      "primary_location": {
                        "source": {
                          "display_name": "Journal of AI"
                        }
                      },
                      "authorships": [
                        {
                          "author": {
                            "display_name": "Ada Lovelace"
                          }
                        }
                      ],
                      "concepts": [
                        {"display_name": "Artificial Intelligence"},
                        {"display_name": "Machine Learning"},
                        {"display_name": "Computer Science"},
                        {"display_name": "Deep Learning"},
                        {"display_name": "Data Mining"},
                        {"display_name": "Extra Keyword"}
                      ]
                    }
                  ]
                }
                """)));

        List<RawPaperData> papers = client.fetchPapers("machine learning", 1, 1);

        assertThat(papers).hasSize(1);
        RawPaperData paper = papers.get(0);
        assertThat(paper.getDoi()).isEqualTo("https://doi.org/10.1000/test");
        assertThat(paper.getTitle()).isEqualTo("Machine Learning Paper");
        assertThat(paper.getAbstractText()).isEqualTo("Machine learning works");
        assertThat(paper.getPublicationYear()).isEqualTo(2025);
        assertThat(paper.getJournalName()).isEqualTo("Journal of AI");
        assertThat(paper.getAuthorNames()).containsExactly("Ada Lovelace");
        assertThat(paper.getKeywords()).containsExactly(
                "Artificial Intelligence",
                "Machine Learning",
                "Computer Science",
                "Deep Learning",
                "Data Mining"
        );
    }

    @Test
    void fetchPapersReturnsRequestedPaperCountWhenApiReturnsEnoughResults() {
        OpenAlexClient client = newClient(request -> Mono.just(jsonResponse("""
                {
                  "results": [
                    {"doi": "doi-1", "title": "Paper 1", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 1"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-2", "title": "Paper 2", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 2"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-3", "title": "Paper 3", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 3"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-4", "title": "Paper 4", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 4"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-5", "title": "Paper 5", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 5"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-6", "title": "Paper 6", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 6"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-7", "title": "Paper 7", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 7"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-8", "title": "Paper 8", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 8"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-9", "title": "Paper 9", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 9"}}], "concepts": [{"display_name": "AI"}]},
                    {"doi": "doi-10", "title": "Paper 10", "publication_year": 2025, "authorships": [{"author": {"display_name": "Author 10"}}], "concepts": [{"display_name": "AI"}]}
                  ]
                }
                """)));

        List<RawPaperData> papers = client.fetchPapers("machine learning", 1, 10);

        assertThat(papers).hasSize(10);
        assertThat(papers)
                .allSatisfy(paper -> {
                    assertThat(paper.getTitle()).isNotBlank();
                    assertThat(paper.getDoi()).isNotBlank();
                    assertThat(paper.getPublicationYear()).isNotNull();
                    assertThat(paper.getAuthorNames()).isNotEmpty();
                    assertThat(paper.getKeywords()).isNotEmpty();
                });
    }

    @Test
    void fetchRecentPapersUsesRecentComputerScienceFilter() {
        AtomicReference<String> url = new AtomicReference<>();
        OpenAlexClient client = newClient(request -> {
            url.set(request.url().toString());
            return Mono.just(jsonResponse("{\"results\":[]}"));
        });

        client.fetchRecentPapers(LocalDate.of(2026, 5, 25), 1, 10);

        assertThat(url.get()).contains("/works");
        assertThat(url.get()).contains("from_publication_date:2026-05-25");
        assertThat(url.get()).contains("concepts.id:C41008148");
        assertThat(url.get()).contains("per_page=10");
        assertThat(url.get()).contains("page=1");
    }

    @Test
    void retriesOnceWhenRateLimited() {
        AtomicInteger calls = new AtomicInteger();
        OpenAlexClient client = newClient(request -> {
            if (calls.incrementAndGet() == 1) {
                return Mono.just(ClientResponse.create(HttpStatus.TOO_MANY_REQUESTS).build());
            }
            return Mono.just(jsonResponse("{\"results\":[]}"));
        });

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
        assertThat(calls).hasValue(2);
    }

    @Test
    void returnsEmptyListWhenRequestFails() {
        OpenAlexClient client = newClient(request -> Mono.error(new RuntimeException("network down")));

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
    }

    @Test
    void returnsEmptyListWhenRequestTimesOut() {
        OpenAlexClient client = newClient(request -> Mono.error(new TimeoutException("request timed out")));

        List<RawPaperData> papers = client.fetchPapers("ai", 1, 10);

        assertThat(papers).isEmpty();
    }

    @Test
    void isAvailableReturnsTrueWhenOpenAlexIsReachable() {
        OpenAlexClient client = newClient(request -> Mono.just(ClientResponse.create(HttpStatus.OK).build()));

        assertThat(client.isAvailable()).isTrue();
        assertThat(client.getSourceName()).isEqualTo("OpenAlex");
    }

    private OpenAlexClient newClient(ExchangeFunction exchangeFunction) {
        OpenAlexProperties properties = new OpenAlexProperties();
        properties.setBaseUrl("https://api.openalex.org");
        properties.setEmail("team@example.com");
        properties.setPerPage(25);
        WebClient webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .exchangeFunction(exchangeFunction)
                .build();
        return new OpenAlexClient(webClient, properties);
    }

    private ClientResponse jsonResponse(String body) {
        return ClientResponse.create(HttpStatus.OK)
                .header("Content-Type", "application/json")
                .body(body)
                .build();
    }
}

package com.journaltracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "research_papers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResearchPaper {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String doi;

    @Column(nullable = false, length = 1000)
    private String title;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    private String abstractText;

    @Column(name = "publication_year")
    private Integer publicationYear;

    @Column(name = "source_url", length = 2000)
    private String sourceUrl;

    @Column(name = "source_api", length = 50)
    private String sourceApi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id")
    private Journal journal;

    @Transient
    private Long journalId;

    @ManyToMany
    @JoinTable(
        name = "paper_authors",
        joinColumns = @JoinColumn(name = "paper_id"),
        inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    @Builder.Default
    private Set<Author> authors = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "paper_keywords",
        joinColumns = @JoinColumn(name = "paper_id"),
        inverseJoinColumns = @JoinColumn(name = "keyword_id")
    )
    @Builder.Default
    private Set<Keyword> keywords = new HashSet<>();

    @Column(name = "fetched_at")
    private LocalDateTime fetchedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (fetchedAt == null) {
            fetchedAt = LocalDateTime.now();
        }
    }
}

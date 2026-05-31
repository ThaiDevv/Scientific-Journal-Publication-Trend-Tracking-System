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
    Long id;

    @Column(nullable = false, unique = true)
    String doi;

    @Column(nullable = false)
    String title;

    @Column(name = "abstract_text", columnDefinition = "TEXT")
    String abstractText;

    @Column(name = "publication_year")
    Integer publicationYear;

    @Column(name = "source_url")
    String sourceUrl;

    @Column(name = "source_api")
    String sourceApi;

    @Column(name = "fetched_at")
    LocalDateTime fetchedAt;

    @Column(name = "created_at")
    LocalDateTime createdAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "journal_id")
    Journal journal;


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "paper_authors",
            joinColumns = @JoinColumn(name = "paper_id"),
            inverseJoinColumns = @JoinColumn(name = "author_id")
    )
    @Builder.Default
    Set<Author> authors = new HashSet<>();


    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "paper_keywords",
            joinColumns = @JoinColumn(name = "paper_id"),
            inverseJoinColumns = @JoinColumn(name = "keyword_id")
    )
    @Builder.Default
    Set<Keyword> keywords = new HashSet<>();

}
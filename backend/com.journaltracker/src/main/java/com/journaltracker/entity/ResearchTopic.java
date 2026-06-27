package com.journaltracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "research_topics")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResearchTopic {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "is_trending", nullable = false)
    private boolean isTrending;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "topic_keywords",
        joinColumns = @JoinColumn(name = "topic_id"),
        inverseJoinColumns = @JoinColumn(name = "keyword_id")
    )
    @Builder.Default
    private Set<Keyword> keywords = new HashSet<>();
    @OneToMany(mappedBy = "topic", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<ResearchPaper> papers = new HashSet<>();
}

package com.journaltracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "keywords")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Keyword {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true)
    String name;

    @Column(name = "usage_count")
    Integer usageCount;

    @ManyToMany(mappedBy = "keywords")
    @Builder.Default
    Set<ResearchPaper> papers = new HashSet<>();
}

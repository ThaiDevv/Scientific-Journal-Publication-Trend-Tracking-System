package com.journaltracker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "journals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder

public class Journal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    String issn;

    String publisher;

    String field;

    @Column(name = "paper_count")
    Integer paperCount;

    @OneToMany(mappedBy = "journal", fetch = FetchType.LAZY)
    @Builder.Default
    Set<ResearchPaper> papers = new HashSet<>();
}
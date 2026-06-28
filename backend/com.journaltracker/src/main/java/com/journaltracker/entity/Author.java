package com.journaltracker.entity;

import com.fasterxml.jackson.annotation.JsonProperty; // Thêm cái này để đổi tên cho Postman
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "authors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false)
    String name;

    @Column(name = "affiliation")
    String affiliation;

    @ManyToMany(mappedBy = "authors")
    @Builder.Default
    Set<ResearchPaper> papers = new HashSet<>();

    @Column(name = "paper_count")
    private Integer paperCount;
}
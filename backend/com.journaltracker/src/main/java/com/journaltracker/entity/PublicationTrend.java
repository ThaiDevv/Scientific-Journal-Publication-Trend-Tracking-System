package com.journaltracker.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "publication_trends")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PublicationTrend {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "keyword_id", nullable = false)
    private Long keywordId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "keyword_id", insertable = false, updatable = false)
    private Keyword keyword;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "paper_count", nullable = false)
    private Integer paperCount;

    @Column(precision = 5, scale = 2)
    private BigDecimal growthRate;
}

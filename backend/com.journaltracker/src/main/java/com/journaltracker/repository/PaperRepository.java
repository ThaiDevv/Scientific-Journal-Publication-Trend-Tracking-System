package com.journaltracker.repository;

import com.journaltracker.dto.KeywordYearCount;
import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.response.YearlyStats;
import com.journaltracker.entity.ResearchPaper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaperRepository extends JpaRepository<ResearchPaper, Long>,
        JpaSpecificationExecutor<ResearchPaper> {
    Page<ResearchPaper> findByTitleContainingIgnoreCase(String keyword, Pageable pageable);

    Optional<ResearchPaper> findByDoi(String doi);

    @EntityGraph(attributePaths = {"journal", "authors", "keywords"})
    @Query("SELECT p FROM ResearchPaper p WHERE p.id = :id")
    Optional<ResearchPaper> findDetailById(@Param("id") Long id);

    @EntityGraph(attributePaths = {"journal", "authors", "keywords"})
    Page<ResearchPaper> findByJournalId(Long journalId, Pageable pageable);

    boolean existsByDoi(String doi);

    boolean existsByTitle(String title);
    @Query("SELECT new com.journaltracker.dto.TrendDataPoint(p.publicationYear, CAST(COUNT(p) AS int)) " +
            "FROM ResearchPaper p JOIN p.keywords k " +
            "WHERE LOWER(k.name) = LOWER(:keyword) " +
            "AND p.publicationYear BETWEEN :yearFrom AND :yearTo " +
            "GROUP BY p.publicationYear " +
            "ORDER BY p.publicationYear")
    List<TrendDataPoint> getTrendByKeyword(@Param("keyword") String keyword, @Param("yearFrom") int yearFrom, @Param("yearTo") int yearTo);

    @Query("SELECT new com.journaltracker.dto.KeywordYearCount(k.id, p.publicationYear, COUNT(p)) " +
           "FROM ResearchPaper p JOIN p.keywords k " +
           "GROUP BY k.id, p.publicationYear")

    List<KeywordYearCount> getKeywordCountsGroupByYear();

    Optional<ResearchPaper> findByTitleIgnoreCase(String trim);


    int countByAuthors_Id(Long authorId);

    Page<ResearchPaper> findByAuthors_Id(Long authorId, Pageable pageable);

    Page<ResearchPaper> findByKeywords_NameIgnoreCase(String keywordName, Pageable pageable);

    long countByCreatedAtGreaterThanEqual(LocalDateTime createdAt);

    @EntityGraph(attributePaths = {"journal", "authors", "keywords"})
    List<ResearchPaper> findByPublicationYearLessThanEqualOrderByCreatedAtDesc(
            Integer publicationYear,
            Pageable pageable
    );

    @Query("SELECT new com.journaltracker.dto.response.YearlyStats(p.publicationYear, CAST(COUNT(p) AS int)) " +
           "FROM ResearchPaper p " +
           "WHERE p.publicationYear IS NOT NULL " +
           "AND p.publicationYear <= :currentYear " +
           "GROUP BY p.publicationYear " +
           "ORDER BY p.publicationYear")
    List<YearlyStats> countPublicationsByYear(@Param("currentYear") int currentYear);


    @Query("SELECT COUNT(DISTINCT p) FROM ResearchPaper p JOIN p.keywords k " +
           "WHERE LOWER(k.name) IN :keywords " +
           "AND p.publicationYear BETWEEN :yearFrom AND :yearTo")
    long countByKeywordsAndYearRange(
            @Param("keywords") List<String> keywords,
            @Param("yearFrom") int yearFrom,
            @Param("yearTo") int yearTo);

    @Query("SELECT a.name, CAST(COUNT(DISTINCT p) AS int) " +
           "FROM ResearchPaper p JOIN p.authors a JOIN p.keywords k " +
           "WHERE LOWER(k.name) IN :keywords " +
           "AND p.publicationYear BETWEEN :yearFrom AND :yearTo " +
           "GROUP BY a.id, a.name " +
           "ORDER BY COUNT(DISTINCT p) DESC")
    List<Object[]> findTopAuthorsByKeywordsAndYear(
            @Param("keywords") List<String> keywords,
            @Param("yearFrom") int yearFrom,
            @Param("yearTo") int yearTo,
            Pageable pageable);

    @Query("SELECT j.name, CAST(COUNT(DISTINCT p) AS int) " +
           "FROM ResearchPaper p JOIN p.journal j JOIN p.keywords k " +
           "WHERE LOWER(k.name) IN :keywords " +
           "AND p.publicationYear BETWEEN :yearFrom AND :yearTo " +
           "AND j IS NOT NULL " +
           "GROUP BY j.id, j.name " +
           "ORDER BY COUNT(DISTINCT p) DESC")
    List<Object[]> findTopJournalsByKeywordsAndYear(
            @Param("keywords") List<String> keywords,
            @Param("yearFrom") int yearFrom,
            @Param("yearTo") int yearTo,
            Pageable pageable);
}

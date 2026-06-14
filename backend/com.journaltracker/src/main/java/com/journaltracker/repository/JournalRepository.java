package com.journaltracker.repository;

import com.journaltracker.dto.response.JournalStatsResponse;
import com.journaltracker.entity.Journal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, Long> {
    Optional<Journal> findByName(String name);

    @Query("""
            SELECT j
            FROM Journal j
            WHERE (:search IS NULL OR LOWER(j.name) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:field IS NULL OR LOWER(j.field) = LOWER(:field))
            """)
    Page<Journal> searchJournals(
            @Param("search") String search,
            @Param("field") String field,
            Pageable pageable
    );

    @Query("""
            SELECT new com.journaltracker.dto.response.JournalStatsResponse(
                j.name,
                CAST(COUNT(p) AS int),
                j.field
            )
            FROM Journal j
            JOIN ResearchPaper p ON p.journalId = j.id
            GROUP BY j.id, j.name, j.field
            ORDER BY COUNT(p) DESC
            """)
    List<JournalStatsResponse> findTopJournalsByPaperCount(Pageable pageable);
}

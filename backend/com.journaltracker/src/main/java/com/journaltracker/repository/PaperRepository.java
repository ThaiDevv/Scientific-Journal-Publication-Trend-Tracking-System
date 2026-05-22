package com.journaltracker.repository;

import com.journaltracker.entity.ResearchPaper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaperRepository extends JpaRepository<ResearchPaper, Long> {
    Page<ResearchPaper>
    findByTitleContainingIgnoreCase(
            String keyword,
            Pageable pageable
    );

    Optional<ResearchPaper> findByDoi(String doi);

    boolean existsByDoi(String doi);
}

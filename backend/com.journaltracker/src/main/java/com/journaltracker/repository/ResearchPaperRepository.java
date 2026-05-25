package com.journaltracker.repository;

import com.journaltracker.entity.ResearchPaper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResearchPaperRepository extends JpaRepository<ResearchPaper, Long> {
    Optional<ResearchPaper> findByDoi(String doi);
}

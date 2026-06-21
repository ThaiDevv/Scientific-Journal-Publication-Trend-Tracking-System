package com.journaltracker.repository;

import com.journaltracker.entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUserUsernameAndPaperId(String username, Long paperId);

    Optional<Bookmark> findByUserIdAndPaperId(Long userId, Long paperId);

    @EntityGraph(attributePaths = {
            "paper",
            "paper.journal",
            "paper.authors",
            "paper.keywords"
    })
    Page<Bookmark> findByUserId(Long userId, Pageable pageable);

    boolean existsByUserIdAndPaperId(Long userId, Long paperId);
}

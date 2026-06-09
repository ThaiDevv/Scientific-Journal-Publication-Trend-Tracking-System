package com.journaltracker.repository;

import com.journaltracker.entity.Bookmark;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {

    boolean existsByUserUsernameAndPaperId(String username, Long paperId);
}

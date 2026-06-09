package com.journaltracker.repository;

import com.journaltracker.entity.Journal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface JournalRepository extends JpaRepository<Journal, Long> {
    @Query("SELECT j FROM Journal j WHERE LOWER(j.name) = LOWER(:name)")
    Optional<Journal> findByName(@Param("name") String name);
}

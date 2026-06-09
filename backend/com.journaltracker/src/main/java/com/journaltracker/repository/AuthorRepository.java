package com.journaltracker.repository;

import com.journaltracker.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AuthorRepository extends JpaRepository<Author, Long> {
    Optional<Author> findByExternalId(String externalId);

    @Query("SELECT a FROM Author a WHERE LOWER(a.name) = LOWER(:name)")
    Optional<Author> findByName(@Param("name") String name);
}

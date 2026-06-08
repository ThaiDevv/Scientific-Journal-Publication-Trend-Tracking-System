package com.journaltracker.repository;

import com.journaltracker.entity.Author;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface AuthorRepository extends JpaRepository<Author, Long>{
    Optional<Author> findByName(String Name);
}

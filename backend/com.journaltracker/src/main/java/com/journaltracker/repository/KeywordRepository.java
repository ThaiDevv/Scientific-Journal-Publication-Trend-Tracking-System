package com.journaltracker.repository;

import com.journaltracker.entity.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
public interface KeywordRepository extends JpaRepository<Keyword, Long>{
    Optional<Keyword> findByNameIgnoreCase(String name);
    List<Keyword> findTop20ByOrderByUsageCountDesc();

    Page<Keyword> findAllByOrderByUsageCountDesc(Pageable pageable);
}

package com.journaltracker.repository;

import com.journaltracker.entity.ApiDataSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApiDataSourceRepository extends JpaRepository<ApiDataSource, Long> {
    List<ApiDataSource> findByIsActiveTrue();
    Optional<ApiDataSource> findByNameIgnoreCase(String name);

    @Query("SELECT MAX(a.lastSyncAt) FROM ApiDataSource a")
    LocalDateTime findLatestSyncAt();
}

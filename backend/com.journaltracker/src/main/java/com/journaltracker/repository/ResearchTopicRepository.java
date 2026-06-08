package com.journaltracker.repository;

import com.journaltracker.entity.ResearchTopic;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface ResearchTopicRepository extends JpaRepository<ResearchTopic, Long> {

    @Modifying
    @Transactional
    @Query("UPDATE ResearchTopic rt SET rt.isTrending = false")
    void resetAllTrendingTopics();

    @Modifying
    @Transactional
    @Query(value = "UPDATE research_topics SET is_trending = true WHERE id IN (" +
           "  SELECT DISTINCT tk.topic_id FROM topic_keywords tk " +
           "  JOIN publication_trends pt ON tk.keyword_id = pt.keyword_id " +
           "  WHERE pt.year = :maxYear AND pt.growth_rate > 50.0" +
           ")", nativeQuery = true)
    void updateTrendingTopics(@Param("maxYear") int maxYear);
}

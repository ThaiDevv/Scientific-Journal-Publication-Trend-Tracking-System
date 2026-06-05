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
    @Query("UPDATE ResearchTopic rt SET rt.isTrending = true WHERE rt.id IN (" +
           "  SELECT DISTINCT r.id FROM ResearchTopic r JOIN r.keywords k, PublicationTrend pt " +
           "  WHERE k.id = pt.keywordId AND pt.year = :maxYear AND pt.growthRate > 50.0" +
           ")")
    void updateTrendingTopics(@Param("maxYear") int maxYear);
}

package com.journaltracker.repository;

import com.journaltracker.dto.TrendingTopic;
import com.journaltracker.entity.PublicationTrend;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface PublicationTrendRepository extends JpaRepository<PublicationTrend, Long> {
    @Query("SELECT COALESCE(SUM(pt.paperCount), 0) FROM PublicationTrend pt WHERE pt.keyword.id IN :keywordIds")
    Long sumPaperCountByKeywordIds(@Param("keywordIds") List<Long> keywordIds);

    @Query("SELECT MAX(t.year) FROM PublicationTrend t")
    Integer findMaxYear();

    @Query("SELECT new com.journaltracker.dto.TrendingTopic(t.keyword.name, t.paperCount, COALESCE(t2.paperCount, 0), CAST(t.growthRate AS double)) " +
           "FROM PublicationTrend t " +
           "LEFT JOIN PublicationTrend t2 ON t.keywordId = t2.keywordId AND t2.year = t.year - 1 " +
           "WHERE t.year = :currentYear " +
           "ORDER BY t.growthRate DESC")
    List<TrendingTopic> findTopTrending(@Param("currentYear") int currentYear, Pageable pageable);
}

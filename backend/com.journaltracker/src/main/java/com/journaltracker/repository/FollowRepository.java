package com.journaltracker.repository;

import com.journaltracker.dto.response.FollowResponse;
import com.journaltracker.entity.Follow;
import com.journaltracker.entity.FollowType;
import com.journaltracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByUserUsernameAndFollowTypeAndTargetId(
            String username,
            String followType,
            Long targetId
    );

    boolean existsByUserAndFollowTypeAndTargetId(User user, FollowType followType, long targetId);
    Follow findByUserAndTargetId(User user, long targetId);

    List<Follow> findByUser(User user);

    List<Follow> findByUserAndFollowType(User user, FollowType type);

    List<Follow> findByFollowTypeAndTargetId(FollowType followType, Long targetId);

    List<Follow> findByFollowTypeAndTargetIdIn(FollowType followType, List<Long> targetIds);

    @Query(value = """
            SELECT DISTINCT f.*
            FROM follows f
            JOIN topic_keywords tk ON tk.topic_id = f.target_id
            WHERE f.follow_type = 'TOPIC'
              AND tk.keyword_id IN (:keywordIds)
            """, nativeQuery = true)
    List<Follow> findTopicFollowsByKeywordIds(@Param("keywordIds") List<Long> keywordIds);
}

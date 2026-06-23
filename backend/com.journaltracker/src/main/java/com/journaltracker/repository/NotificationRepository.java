package com.journaltracker.repository;

import com.journaltracker.entity.Notification;
import com.journaltracker.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    boolean existsByUserAndMessage(User user, String message);

    Page<Notification> findByUserUsernameOrderByCreatedAtDesc(String username, Pageable pageable);

    Optional<Notification> findByIdAndUserUsername(Long id, String username);

    long countByUserUsernameAndIsReadFalse(String username);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.username = :username AND n.isRead = false")
    void markAllAsRead(@Param("username") String username);
}

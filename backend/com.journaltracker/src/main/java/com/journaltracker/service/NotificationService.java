package com.journaltracker.service;

import com.journaltracker.dto.response.NotificationResponse;
import com.journaltracker.entity.ResearchPaper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface NotificationService {
    void notifyFollowers(List<ResearchPaper> newPapers);

    Page<NotificationResponse> getNotifications(String username, Pageable pageable);

    void markAsRead(String username, Long notificationId);

    void markAllAsRead(String username);

    long getUnreadCount(String username);
}

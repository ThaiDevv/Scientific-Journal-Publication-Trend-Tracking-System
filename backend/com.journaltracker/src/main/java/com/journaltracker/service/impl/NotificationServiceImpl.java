package com.journaltracker.service.impl;

import com.journaltracker.dto.response.NotificationResponse;
import com.journaltracker.entity.Author;
import com.journaltracker.entity.Follow;
import com.journaltracker.entity.FollowType;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.Notification;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.entity.User;
import com.journaltracker.exception.ResourceNotFoundException;
import com.journaltracker.repository.FollowRepository;
import com.journaltracker.repository.NotificationRepository;
import com.journaltracker.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final FollowRepository followRepository;

    @Override
    public void notifyFollowers(List<ResearchPaper> newPapers) {
        if (newPapers == null || newPapers.isEmpty()) {
            return;
        }

        for (ResearchPaper paper : newPapers) {
            Set<Follow> matchingFollows = new LinkedHashSet<>();
            if (paper.getJournalId() != null) {
                matchingFollows
                        .addAll(followRepository.findByFollowTypeAndTargetId(FollowType.JOURNAL, paper.getJournalId()));
            }

            List<Long> keywordIds = paper.getKeywords().stream()
                    .map(Keyword::getId)
                    .filter(Objects::nonNull)
                    .toList();
            if (!keywordIds.isEmpty()) {
                matchingFollows.addAll(followRepository.findByFollowTypeAndTargetIdIn(FollowType.KEYWORD, keywordIds));
                matchingFollows.addAll(followRepository.findTopicFollowsByKeywordIds(keywordIds));
            }

            matchingFollows.stream()
                    .filter(follow -> follow.getUser() != null)
                    .collect(Collectors.groupingBy(Follow::getUser))
                    .forEach((user, follows) -> createNotificationIfAbsent(user, paper, follows));
        }
    }

    @Override
    public Page<NotificationResponse> getNotifications(String username, Pageable pageable) {
        return notificationRepository.findByUserUsernameOrderByCreatedAtDesc(username, pageable)
                .map(this::toResponse);
    }

    @Override
    public void markAsRead(String username, Long notificationId) {
        Notification notification = notificationRepository.findByIdAndUserUsername(notificationId, username)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(String username) {
        notificationRepository.markAllAsRead(username);
    }

    @Override
    public long getUnreadCount(String username) {
        return notificationRepository.countByUserUsernameAndIsReadFalse(username);
    }

    private void createNotificationIfAbsent(User user, ResearchPaper paper, List<Follow> follows) {
        String message = buildMessage(paper);
        if (notificationRepository.existsByUserAndMessage(user, message)) {
            return;
        }

        Follow primaryFollow = follows.stream()
                .min(Comparator.comparing(follow -> follow.getFollowType() == FollowType.KEYWORD ? 0 : 1))
                .orElse(null);

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(buildTitle(paper, primaryFollow));
        notification.setMessage(message);
        notificationRepository.save(notification);
    }

    private String buildTitle(ResearchPaper paper, Follow follow) {
        if (follow != null && follow.getFollowType() == FollowType.KEYWORD) {
            String keyword = paper.getKeywords().stream()
                    .filter(k -> Objects.equals(k.getId(), follow.getTargetId()))
                    .map(Keyword::getName)
                    .findFirst()
                    .orElse("keyword");
            return "Bài báo mới về " + keyword;
        }
        String journalName = paper.getJournal() != null ? paper.getJournal().getName() : "journal";
        return "Bài báo mới trên " + journalName;
    }

    private String buildMessage(ResearchPaper paper) {
        String authors = paper.getAuthors().stream()
                .map(Author::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
        if (authors.isBlank()) {
            authors = "Unknown authors";
        }
        String year = paper.getPublicationYear() != null ? paper.getPublicationYear().toString() : "N/A";
        return paper.getTitle() + " - " + authors + " (" + year + ")";
    }

    private NotificationResponse toResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

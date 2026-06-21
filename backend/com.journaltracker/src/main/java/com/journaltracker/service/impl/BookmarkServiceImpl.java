package com.journaltracker.service.impl;

import com.journaltracker.dto.response.BookmarkResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.Bookmark;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.entity.User;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.ResourceNotFoundException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.mapper.PaperMapper;
import com.journaltracker.repository.BookmarkRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.service.BookmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookmarkServiceImpl implements BookmarkService {

    private final BookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final PaperRepository paperRepository;
    private final PaperMapper paperMapper;

    @Override
    @Transactional
    public BookmarkResponse addBookmark(
            String username,
            Long paperId
    ) {

        User user = getUser(username);
        ResearchPaper paper = getPaper(paperId);

        if (bookmarkRepository.existsByUserIdAndPaperId(
                user.getId(),
                paperId
        )) {
            throw new DuplicateResourceException(
                    "Paper already bookmarked"
            );
        }

        Bookmark bookmark = new Bookmark();
        bookmark.setUser(user);
        bookmark.setPaper(paper);

        Bookmark savedBookmark = bookmarkRepository.save(bookmark);

        return toResponse(savedBookmark);
    }

    @Override
    @Transactional
    public void removeBookmark(
            String username,
            Long paperId
    ) {

        User user = getUser(username);

        Bookmark bookmark = bookmarkRepository
                .findByUserIdAndPaperId(user.getId(), paperId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Bookmark not found with paper id: " + paperId
                ));

        bookmarkRepository.delete(bookmark);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PaperSummaryResponse> getMyBookmarks(
            String username,
            Pageable pageable
    ) {

        User user = getUser(username);

        return bookmarkRepository.findByUserId(user.getId(), pageable)
                .map(bookmark -> paperMapper.toSummaryResponse(
                        bookmark.getPaper()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isBookmarked(
            String username,
            Long paperId
    ) {

        User user = getUser(username);

        return bookmarkRepository.existsByUserIdAndPaperId(
                user.getId(),
                paperId
        );
    }

    private User getUser(
            String username
    ) {

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException(
                        "Invalid username or password"
                ));
    }

    private ResearchPaper getPaper(
            Long paperId
    ) {

        return paperRepository.findDetailById(paperId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paper not found with id: " + paperId
                ));
    }

    private BookmarkResponse toResponse(
            Bookmark bookmark
    ) {

        return BookmarkResponse.builder()
                .id(bookmark.getId())
                .userId(bookmark.getUser().getId())
                .paperId(bookmark.getPaper().getId())
                .paperTitle(bookmark.getPaper().getTitle())
                .createdAt(bookmark.getCreatedAt())
                .build();
    }
}

package com.journaltracker.mapper;

import com.journaltracker.dto.response.JournalDetailResponse;
import com.journaltracker.dto.response.JournalResponse;
import com.journaltracker.entity.Journal;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface JournalMapper {

    JournalResponse toResponse(Journal journal);

    default JournalResponse toResponse(
            Journal journal,
            boolean isFollowed
    ) {

        JournalResponse response = toResponse(journal);
        response.setIsFollowed(isFollowed);
        return response;
    }

    default JournalDetailResponse toDetailResponse(
            Journal journal,
            boolean isFollowed) {

        JournalDetailResponse response = new JournalDetailResponse();
        response.setId(journal.getId());
        response.setName(journal.getName());
        response.setIssn(journal.getIssn());
        response.setPublisher(journal.getPublisher());
        response.setField(journal.getField());
        response.setPaperCount(journal.getPaperCount());
        response.setIsFollowed(isFollowed);
        return response;
    }
}

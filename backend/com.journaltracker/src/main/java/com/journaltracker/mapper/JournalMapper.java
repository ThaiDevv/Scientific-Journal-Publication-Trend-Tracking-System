package com.journaltracker.mapper;

import com.journaltracker.dto.JournalResponse;
import com.journaltracker.entity.Journal;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface JournalMapper {

    JournalResponse toResponse(Journal journal);
}
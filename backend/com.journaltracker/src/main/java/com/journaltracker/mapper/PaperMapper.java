package com.journaltracker.mapper;

import com.journaltracker.dto.PaperResponse;
import com.journaltracker.dto.PaperSummaryResponse;
import com.journaltracker.entity.ResearchPaper;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface PaperMapper {

    PaperResponse toResponse(ResearchPaper paper);

    PaperSummaryResponse toSummary(ResearchPaper paper);
}
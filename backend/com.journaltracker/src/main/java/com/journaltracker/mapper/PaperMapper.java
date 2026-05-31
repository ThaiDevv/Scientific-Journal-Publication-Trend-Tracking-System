package com.journaltracker.mapper;

import com.journaltracker.dto.response.PaperResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.Author;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.ResearchPaper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;

@Mapper(componentModel = "spring")
public interface PaperMapper {

    PaperResponse toResponse(ResearchPaper paper);

    @Mapping(target = "journalName",
            source = "journal.name")

    @Mapping(target = "authors",
            source = "authors")

    @Mapping(target = "keywords",
            source = "keywords")
    PaperSummaryResponse toSummary(
            ResearchPaper paper
    );

    default List<String> mapAuthors(
            Set<Author> authors
    ) {
        return authors.stream()
                .map(Author::getName)
                .toList();
    }

    default List<String> mapKeywords(
            Set<Keyword> keywords
    ) {
        return keywords.stream()
                .map(Keyword::getName)
                .toList();
    }
}
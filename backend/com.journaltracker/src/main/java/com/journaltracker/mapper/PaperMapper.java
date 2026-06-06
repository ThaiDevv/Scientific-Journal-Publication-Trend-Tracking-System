package com.journaltracker.mapper;

import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.Author;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.ResearchPaper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface PaperMapper {

    @Mapping(
            target = "journalName",
            source = "journal.name"
    )
    @Mapping(
            target = "authors",
            expression = "java(mapAuthors(paper.getAuthors()))"
    )
    @Mapping(
            target = "keywords",
            expression = "java(mapKeywords(paper.getKeywords()))"
    )
    PaperSummaryResponse toSummaryResponse(
            ResearchPaper paper
    );

    default List<String> mapAuthors(
            Set<Author> authors
    ) {

        if (authors == null) {
            return List.of();
        }

        return authors.stream()
                .map(Author::getName)
                .collect(Collectors.toList());
    }

    default List<String> mapKeywords(
            Set<Keyword> keywords
    ) {

        if (keywords == null) {
            return List.of();
        }

        return keywords.stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
    }
}
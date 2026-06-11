package com.journaltracker.mapper;

import com.journaltracker.dto.response.PaperDetailResponse;
import com.journaltracker.dto.response.PaperSummaryResponse;
import com.journaltracker.entity.Author;
import com.journaltracker.entity.Journal;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.ResearchPaper;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface PaperMapper {

    @Mapping(target = "journalName", source = "journal.name")
    @Mapping(target = "authors", expression = "java(mapAuthors(paper.getAuthors()))")
    @Mapping(target = "keywords", expression = "java(mapKeywords(paper.getKeywords()))")
    PaperSummaryResponse toSummaryResponse(
            ResearchPaper paper);

    default PaperDetailResponse toDetailResponse(
            ResearchPaper paper,
            boolean isBookmarked) {

        PaperDetailResponse response = new PaperDetailResponse();
        response.setId(paper.getId());
        response.setDoi(paper.getDoi());
        response.setTitle(paper.getTitle());
        response.setAbstractText(paper.getAbstractText());
        response.setPublicationYear(paper.getPublicationYear());
        response.setSourceUrl(paper.getSourceUrl());
        response.setSourceApi(paper.getSourceApi());
        response.setJournal(mapJournalDetail(paper.getJournal()));
        response.setAuthors(mapAuthorDetails(paper.getAuthors()));
        response.setKeywords(mapKeywordDetails(paper.getKeywords()));
        response.setIsBookmarked(isBookmarked);
        response.setFetchedAt(paper.getFetchedAt());
        response.setCreatedAt(paper.getCreatedAt());
        return response;
    }

    default List<String> mapAuthors(
            Set<Author> authors) {

        if (authors == null) {
            return List.of();
        }

        return authors.stream()
                .map(Author::getName)
                .collect(Collectors.toList());
    }

    default List<String> mapKeywords(
            Set<Keyword> keywords) {

        if (keywords == null) {
            return List.of();
        }

        return keywords.stream()
                .map(Keyword::getName)
                .collect(Collectors.toList());
    }

    default PaperDetailResponse.JournalDetail mapJournalDetail(
            Journal journal) {

        if (journal == null) {
            return null;
        }

        PaperDetailResponse.JournalDetail detail = new PaperDetailResponse.JournalDetail();
        detail.setId(journal.getId());
        detail.setName(journal.getName());
        detail.setIssn(journal.getIssn());
        detail.setPublisher(journal.getPublisher());
        detail.setField(journal.getField());
        return detail;
    }

    default List<PaperDetailResponse.AuthorDetail> mapAuthorDetails(
            Set<Author> authors) {

        if (authors == null) {
            return List.of();
        }

        return authors.stream()
                .map(author -> {
                    PaperDetailResponse.AuthorDetail detail = new PaperDetailResponse.AuthorDetail();
                    detail.setId(author.getId());
                    detail.setName(author.getName());
                    detail.setAffiliation(author.getAffiliation());
                    return detail;
                })
                .collect(Collectors.toList());
    }

    default List<PaperDetailResponse.KeywordDetail> mapKeywordDetails(
            Set<Keyword> keywords) {

        if (keywords == null) {
            return List.of();
        }

        return keywords.stream()
                .map(keyword -> {
                    PaperDetailResponse.KeywordDetail detail = new PaperDetailResponse.KeywordDetail();
                    detail.setId(keyword.getId());
                    detail.setName(keyword.getName());
                    return detail;
                })
                .collect(Collectors.toList());
    }
}

package com.journaltracker.specification;

import com.journaltracker.entity.Author;
import com.journaltracker.entity.Journal;
import com.journaltracker.entity.ResearchPaper;
import jakarta.persistence.criteria.Join;
import org.springframework.data.jpa.domain.Specification;

public class PaperSpecification {

    public static Specification<ResearchPaper> hasKeyword(String keyword) {

        return (root, query, cb) -> {

            if (keyword == null || keyword.isBlank()) {
                return null;
            }

            String pattern = "%" + keyword.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("title")), pattern),
                    cb.like(cb.lower(root.get("abstractText")), pattern)
            );
        };
    }

    public static Specification<ResearchPaper> hasAuthor(String author) {

        return (root, query, cb) -> {

            if (author == null || author.isBlank()) {
                return null;
            }

            query.distinct(true);

            Join<ResearchPaper, Author> authorJoin =
                    root.join("authors");

            return cb.like(
                    cb.lower(authorJoin.get("name")),
                    "%" + author.toLowerCase() + "%"
            );
        };
    }

    public static Specification<ResearchPaper> hasJournal(String journal) {

        return (root, query, cb) -> {

            if (journal == null || journal.isBlank()) {
                return null;
            }

            query.distinct(true);

            Join<ResearchPaper, Journal> journalJoin =
                    root.join("journal");

            return cb.like(
                    cb.lower(journalJoin.get("name")),
                    "%" + journal.toLowerCase() + "%"
            );
        };
    }

    public static Specification<ResearchPaper> yearGreaterThanOrEqual(Integer yearFrom) {

        return (root, query, cb) -> {

            if (yearFrom == null) {
                return null;
            }

            return cb.greaterThanOrEqualTo(
                    root.get("publicationYear"),
                    yearFrom
            );
        };
    }

    public static Specification<ResearchPaper> yearLessThanOrEqual(Integer yearTo) {

        return (root, query, cb) -> {

            if (yearTo == null) {
                return null;
            }

            return cb.lessThanOrEqualTo(
                    root.get("publicationYear"),
                    yearTo
            );
        };
    }
}

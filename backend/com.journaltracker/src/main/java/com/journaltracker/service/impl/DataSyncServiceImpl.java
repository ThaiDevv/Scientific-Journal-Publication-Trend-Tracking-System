package com.journaltracker.service.impl;

import com.journaltracker.client.ExternalApiClient;
import com.journaltracker.dto.RawPaperData;
import com.journaltracker.dto.SyncResult;
import com.journaltracker.entity.Author;
import com.journaltracker.entity.Journal;
import com.journaltracker.entity.Keyword;
import com.journaltracker.entity.ResearchPaper;
import com.journaltracker.repository.AuthorRepository;
import com.journaltracker.repository.JournalRepository;
import com.journaltracker.repository.KeywordRepository;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.service.DataSyncService;
import com.journaltracker.service.DeduplicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataSyncServiceImpl implements DataSyncService {
    private final List<ExternalApiClient> clientList;
    private final PaperRepository paperRepository;
    private final JournalRepository journalRepository;
    private final AuthorRepository authorRepository;
    private final KeywordRepository keywordRepository;
    private final DeduplicationService deduplicationService;

    @Autowired
    @Lazy
    private DataSyncServiceImpl self;

    public void processSinglePapper(RawPaperData paperData, SyncResult result, String sourceName) {
        try {
            self.savePaperTransactional(paperData, result, sourceName);
        } catch (Exception e) {
            log.error("[Error] Lỗi khi xử lý bài báo title='{}': {}", paperData.getTitle(), e.getMessage(), e);
            result.setErrors(result.getErrors() + 1);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void savePaperTransactional(RawPaperData paperData, SyncResult result, String sourceName) {
        boolean isDuplicate = deduplicationService.deduplicateAndMerge(paperData, sourceName);
        if (isDuplicate) {
            result.setDuplicates(result.getDuplicates() + 1);
            return;
        }
        Journal journal = findJournal(paperData);
        Set<Author> authors = findAuthors(paperData);
        Set<Keyword> keywords = findKeywords(paperData);

        String sanitizedDoi = (paperData.getDoi() == null || paperData.getDoi().isBlank())
                ? null
                : paperData.getDoi().trim();

        ResearchPaper newPaper = ResearchPaper.builder()
                .title(paperData.getTitle())
                .authors(authors)
                .keywords(keywords)
                .journal(journal)
                .doi(sanitizedDoi)
                .sourceApi(sourceName)
                .journalId(journal != null ? journal.getId() : null)
                .abstractText(paperData.getAbstractText())
                .publicationYear(paperData.getPublicationYear())
                .sourceUrl(paperData.getSourceUrl())
                .build();

        ResearchPaper savedPaper = paperRepository.save(newPaper);
        if (journal != null) {
            journal.setPaperCount((journal.getPaperCount() == null ? 0 : journal.getPaperCount()) + 1);
            journalRepository.save(journal);
        }
        result.setNewPapers(result.getNewPapers() + 1);
        result.getSyncedPapers().add(savedPaper);
        log.debug("[Save] Đã lưu bài báo: doi='{}', title='{}'", sanitizedDoi, paperData.getTitle());
    }

    public Set<Keyword> findKeywords(RawPaperData paperData) {
        Set<Keyword> keywords = new HashSet<>();
        if (paperData.getKeywords() == null) {
            return keywords;
        }
        paperData.getKeywords().forEach(keyword -> {
            if (keyword == null || keyword.isBlank())
                return;
            Optional<Keyword> findKeyword = keywordRepository.findByNameIgnoreCase(keyword.trim());
            if (findKeyword.isPresent()) {
                Keyword kw = findKeyword.get();
                kw.setUsageCount((kw.getUsageCount() == null ? 0 : kw.getUsageCount()) + 1);
                keywordRepository.save(kw);
                keywords.add(kw);
            } else {
                Keyword newKeyword = new Keyword();
                newKeyword.setUsageCount(1);
                newKeyword.setName(keyword.trim());
                keywordRepository.save(newKeyword);
                keywords.add(newKeyword);
            }
        });
        return keywords;
    }

    public Set<Author> findAuthors(RawPaperData paperData) {
        Set<Author> authors = new HashSet<>();
        if (paperData.getAuthorNames() == null) {
            return authors;
        }
        List<String> affiliations = paperData.getAuthorAffiliations();
        List<String> authorNames = paperData.getAuthorNames();
        for (int i = 0; i < authorNames.size(); i++) {
            String authorName = authorNames.get(i);
            if (authorName == null || authorName.isBlank())
                continue;
            String affiliation = (affiliations != null && i < affiliations.size()) ? affiliations.get(i) : null;
            Author author = authorRepository.findByName(authorName.trim())
                    .orElseGet(() -> {
                        Author newAuthor = new Author();
                        newAuthor.setName(authorName.trim());
                        newAuthor.setAffiliation(affiliation);
                        authorRepository.save(newAuthor);
                        return newAuthor;
                    });
            authors.add(author);
        }
        return authors;
    }

    public Journal findJournal(RawPaperData paperData) {
        if (paperData.getJournalName() == null || paperData.getJournalName().isBlank()) {
            return null;
        }
        return journalRepository.findByName(paperData.getJournalName().trim())
                .orElseGet(() -> {
                    Journal newJournal = Journal.builder()
                            .name(paperData.getJournalName().trim())
                            .issn(paperData.getJournalIssn())
                            .paperCount(0)
                            .build();
                    log.debug("[Journal] Tạo mới journal: '{}'", paperData.getJournalName());
                    return journalRepository.save(newJournal);
                });
    }

    public ExternalApiClient findExternalApiClient(String nameClient) {
        return clientList.stream()
                .filter(name -> name.getSourceName().equalsIgnoreCase(nameClient))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Source not found"));
    }

    @Override
    public SyncResult syncFromSource(String sourceName, String query) {
        ExternalApiClient client = findExternalApiClient(sourceName);
        SyncResult result = new SyncResult();
        int page = 1;
        int pageSize = 10;
        int totalFetched = 0;
        result.setSourceName(sourceName);
        while (true) {
            List<RawPaperData> batch = client.fetchPapers(query, page, pageSize);
            if (batch == null || batch.isEmpty()) {
                break;
            }
            for (RawPaperData paper : batch) {
                processSinglePapper(paper, result, sourceName);
            }
            totalFetched += batch.size();
            if (batch.size() < pageSize) {
                break;
            }
            page++;
        }
        result.setTotalFetched(totalFetched);
        result.setSyncedAt(LocalDate.now());
        return result;
    }

    @Override
    public SyncResult syncRecentPapers(String sourceName, LocalDate fromDate) {
        ExternalApiClient client = findExternalApiClient(sourceName);
        SyncResult result = new SyncResult();
        int page = 1;
        int pageSize = 10;
        int totalFetched = 0;
        result.setSourceName(sourceName);
        while (true) {
            List<RawPaperData> batch = client.fetchRecentPapers(fromDate, page, pageSize);
            if (batch == null || batch.isEmpty()) {
                break;
            }
            for (RawPaperData paper : batch) {
                processSinglePapper(paper, result, sourceName);
            }
            totalFetched += batch.size();
            if (batch.size() < pageSize) {
                break;
            }
            page++;
        }
        result.setTotalFetched(totalFetched);
        result.setSyncedAt(LocalDate.now());
        return result;
    }

    @Override
    public SyncResult syncAllSources(String query) {
        List<SyncResult> results = new ArrayList<>();
        SyncResult result = new SyncResult();
        result.setSourceName("ALL");
        for (ExternalApiClient client : clientList) {
            if (!client.isAvailable()) {
                log.warn("[Sync] Nguồn '{}' không khả dụng, bỏ qua.", client.getSourceName());
                continue;
            }
            try {
                SyncResult r = syncFromSource(client.getSourceName(), query);
                results.add(r);
            } catch (Exception e) {
                log.error("[Sync] Lỗi khi đồng bộ nguồn '{}': {}", client.getSourceName(), e.getMessage(), e);
            }
        }
        for (SyncResult r : results) {
            result.setTotalFetched(result.getTotalFetched() + r.getTotalFetched());
            result.setNewPapers(result.getNewPapers() + r.getNewPapers());
            result.setDuplicates(result.getDuplicates() + r.getDuplicates());
            result.setErrors(result.getErrors() + r.getErrors());
            result.getSyncedPapers().addAll(r.getSyncedPapers());
        }
        result.setSyncedAt(LocalDate.now());
        log.info("[Sync] Tổng hợp ALL: tổng={}, mới={}, trùng={}, lỗi={}",
                result.getTotalFetched(), result.getNewPapers(), result.getDuplicates(), result.getErrors());
        return result;
    }
}

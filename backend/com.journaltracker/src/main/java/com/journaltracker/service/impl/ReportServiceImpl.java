package com.journaltracker.service.impl;

import com.journaltracker.dto.TrendDataPoint;
import com.journaltracker.dto.request.ReportRequest;
import com.journaltracker.dto.response.ReportResponse;
import com.journaltracker.dto.response.ReportResponse.AuthorItem;
import com.journaltracker.dto.response.ReportResponse.DataPoint;
import com.journaltracker.dto.response.ReportResponse.JournalItem;
import com.journaltracker.dto.response.ReportResponse.ReportSummary;
import com.journaltracker.dto.response.ReportResponse.TrendDataItem;
import com.journaltracker.dto.response.ReportSummaryResponse;
import com.journaltracker.entity.User;
import com.journaltracker.repository.PaperRepository;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.service.ReportService;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final PaperRepository paperRepository;
    private final UserRepository userRepository;


    private final Map<Long, List<ReportResponse>> reportCache = new ConcurrentHashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(1);

    @Override
    public ReportResponse generateTrendReport(String username, ReportRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<String> lowerKeywords = request.getKeywords().stream()
                .map(String::toLowerCase)
                .collect(Collectors.toList());


        List<TrendDataItem> trendDataItems = new ArrayList<>();
        int grandTotalPapers = 0;

        for (String keyword : request.getKeywords()) {
            List<TrendDataPoint> rawPoints = paperRepository.getTrendByKeyword(
                    keyword, request.getYearFrom(), request.getYearTo());

            List<DataPoint> dataPoints = rawPoints.stream()
                    .map(dp -> DataPoint.builder()
                            .year(dp.getYear())
                            .count(dp.getPaperCount())
                            .build())
                    .collect(Collectors.toList());

            int totalForKeyword = dataPoints.stream()
                    .mapToInt(DataPoint::getCount)
                    .sum();


            double growthRate = 0.0;
            if (dataPoints.size() >= 2) {
                int firstYearCount = dataPoints.get(0).getCount();
                int lastYearCount = dataPoints.get(dataPoints.size() - 1).getCount();
                if (firstYearCount > 0) {
                    growthRate = Math.round(((double) (lastYearCount - firstYearCount) / firstYearCount) * 100.0 * 10.0) / 10.0;
                } else if (lastYearCount > 0) {
                    growthRate = 100.0;
                }
            }

            trendDataItems.add(TrendDataItem.builder()
                    .keyword(keyword)
                    .dataPoints(dataPoints)
                    .totalPapers(totalForKeyword)
                    .growthRate(growthRate)
                    .build());

            grandTotalPapers += totalForKeyword;
        }


        List<Object[]> topAuthorsRaw = paperRepository.findTopAuthorsByKeywordsAndYear(
                lowerKeywords, request.getYearFrom(), request.getYearTo(), PageRequest.of(0, 10));

        List<AuthorItem> topAuthors = topAuthorsRaw.stream()
                .map(row -> AuthorItem.builder()
                        .name((String) row[0])
                        .paperCount((Integer) row[1])
                        .build())
                .collect(Collectors.toList());


        List<Object[]> topJournalsRaw = paperRepository.findTopJournalsByKeywordsAndYear(
                lowerKeywords, request.getYearFrom(), request.getYearTo(), PageRequest.of(0, 10));

        List<JournalItem> topJournals = topJournalsRaw.stream()
                .map(row -> JournalItem.builder()
                        .name((String) row[0])
                        .paperCount((Integer) row[1])
                        .build())
                .collect(Collectors.toList());


        ReportSummary summary = ReportSummary.builder()
                .totalPapersAnalyzed(grandTotalPapers)
                .timeRange(request.getYearFrom() + "-" + request.getYearTo())
                .keywordsAnalyzed(request.getKeywords().size())
                .build();


        ReportResponse response = ReportResponse.builder()
                .id(idGenerator.getAndIncrement())
                .title(request.getTitle())
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .trendData(trendDataItems)
                .topAuthors(topAuthors)
                .topJournals(topJournals)
                .build();


        reportCache.computeIfAbsent(user.getId(), k -> new ArrayList<>()).add(response);

        return response;
    }

    @Override
    public Page<ReportSummaryResponse> getReportHistory(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<ReportResponse> userReports = reportCache.getOrDefault(user.getId(), List.of());

        // Sort by generatedAt descending
        List<ReportSummaryResponse> summaries = userReports.stream()
                .sorted(Comparator.comparing(ReportResponse::getGeneratedAt).reversed())
                .map(report -> ReportSummaryResponse.builder()
                        .id(report.getId())
                        .title(report.getTitle())
                        .generatedAt(report.getGeneratedAt())
                        .format("JSON")
                        .keywordsAnalyzed(report.getSummary().getKeywordsAnalyzed())
                        .timeRange(report.getSummary().getTimeRange())
                        .build())
                .collect(Collectors.toList());

        // Manual pagination
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), summaries.size());
        List<ReportSummaryResponse> pageContent = start < summaries.size()
                ? summaries.subList(start, end)
                : List.of();

        return new PageImpl<>(pageContent, pageable, summaries.size());
    }

    @Override
    public ReportResponse getReportById(String username, Long reportId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        List<ReportResponse> userReports = reportCache.getOrDefault(user.getId(), List.of());

        return userReports.stream()
                .filter(r -> r.getId().equals(reportId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
    }

    @Override
    public byte[] generatePdf(Long reportId, String username) {
        ReportResponse report = getReportById(username, reportId);

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 54, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // Fonts
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, new Color(33, 37, 41));
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, new Color(0, 123, 255));
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.BLACK);
            Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 9, Color.GRAY);

            // Title
            Paragraph title = new Paragraph(report.getTitle(), titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(8);
            document.add(title);

            // Generated date
            Paragraph dateP = new Paragraph(
                    "Generated: " + report.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    smallFont);
            dateP.setAlignment(Element.ALIGN_CENTER);
            dateP.setSpacingAfter(20);
            document.add(dateP);

            // Summary section
            document.add(new Paragraph("Summary", headerFont));
            document.add(new Paragraph(" "));

            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(100);
            summaryTable.setWidths(new float[]{1, 2});
            addSummaryRow(summaryTable, "Total Papers Analyzed",
                    String.valueOf(report.getSummary().getTotalPapersAnalyzed()), normalFont);
            addSummaryRow(summaryTable, "Time Range",
                    report.getSummary().getTimeRange(), normalFont);
            addSummaryRow(summaryTable, "Keywords Analyzed",
                    String.valueOf(report.getSummary().getKeywordsAnalyzed()), normalFont);
            summaryTable.setSpacingAfter(20);
            document.add(summaryTable);

            // Trend Data section
            if (report.getTrendData() != null && !report.getTrendData().isEmpty()) {
                document.add(new Paragraph("Trend Data", headerFont));
                document.add(new Paragraph(" "));

                for (TrendDataItem item : report.getTrendData()) {
                    document.add(new Paragraph("Keyword: " + item.getKeyword(), normalFont));
                    document.add(new Paragraph(
                            "Total Papers: " + item.getTotalPapers() + " | Growth Rate: " + item.getGrowthRate() + "%",
                            normalFont));

                    if (item.getDataPoints() != null && !item.getDataPoints().isEmpty()) {
                        PdfPTable trendTable = new PdfPTable(2);
                        trendTable.setWidthPercentage(60);
                        trendTable.setHorizontalAlignment(Element.ALIGN_LEFT);
                        addTableHeader(trendTable, new String[]{"Year", "Count"}, tableHeaderFont);

                        for (DataPoint dp : item.getDataPoints()) {
                            trendTable.addCell(createCell(String.valueOf(dp.getYear()), normalFont));
                            trendTable.addCell(createCell(String.valueOf(dp.getCount()), normalFont));
                        }

                        trendTable.setSpacingAfter(12);
                        document.add(trendTable);
                    }
                }
                document.add(new Paragraph(" "));
            }

            // Top Authors section
            if (report.getTopAuthors() != null && !report.getTopAuthors().isEmpty()) {
                document.add(new Paragraph("Top Authors", headerFont));
                document.add(new Paragraph(" "));

                PdfPTable authorsTable = new PdfPTable(2);
                authorsTable.setWidthPercentage(80);
                addTableHeader(authorsTable, new String[]{"Author Name", "Paper Count"}, tableHeaderFont);

                for (AuthorItem author : report.getTopAuthors()) {
                    authorsTable.addCell(createCell(author.getName(), normalFont));
                    authorsTable.addCell(createCell(String.valueOf(author.getPaperCount()), normalFont));
                }

                authorsTable.setSpacingAfter(20);
                document.add(authorsTable);
            }

            // Top Journals section
            if (report.getTopJournals() != null && !report.getTopJournals().isEmpty()) {
                document.add(new Paragraph("Top Journals", headerFont));
                document.add(new Paragraph(" "));

                PdfPTable journalsTable = new PdfPTable(2);
                journalsTable.setWidthPercentage(80);
                addTableHeader(journalsTable, new String[]{"Journal Name", "Paper Count"}, tableHeaderFont);

                for (JournalItem journal : report.getTopJournals()) {
                    journalsTable.addCell(createCell(journal.getName(), normalFont));
                    journalsTable.addCell(createCell(String.valueOf(journal.getPaperCount()), normalFont));
                }

                journalsTable.setSpacingAfter(20);
                document.add(journalsTable);
            }

            document.close();
            return baos.toByteArray();

        } catch (DocumentException e) {
            throw new RuntimeException("Failed to generate PDF", e);
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF report", e);
        }
    }


    private void addTableHeader(PdfPTable table, String[] headers, Font font) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setBackgroundColor(new Color(0, 123, 255));
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            cell.setPadding(8);
            table.addCell(cell);
        }
    }

    private PdfPCell createCell(String content, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(content, font));
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private void addSummaryRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));
        labelCell.setPadding(6);
        labelCell.setBackgroundColor(new Color(248, 249, 250));
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        valueCell.setPadding(6);
        table.addCell(valueCell);
    }
}

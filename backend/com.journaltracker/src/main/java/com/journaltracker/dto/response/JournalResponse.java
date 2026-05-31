package com.journaltracker.dto.response;
import lombok.Data;

@Data
public class JournalResponse {
    Long id;
    String name;
    String issn;
    String publisher;
    String field;
    Integer paperCount;
}
package com.journaltracker.dto;

import lombok.Data;

@Data
public class AuthorResponse {
    Long id;
    String name;
    String affilliation;
}

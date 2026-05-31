package com.journaltracker.dto.response;

import lombok.Data;

@Data
public class AuthorResponse {
    Long id;
    String name;
    String affilliation;
}
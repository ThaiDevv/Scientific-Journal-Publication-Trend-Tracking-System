package com.journaltracker.controller;

import com.journaltracker.dto.RawPaperData;
import com.journaltracker.external.OpenAlexClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final OpenAlexClient alexClient;
    public AuthController(OpenAlexClient alexClient) {
        this.alexClient = alexClient;
    }

    @PostMapping("/login")
    public String login() { return "login stub"; }

    @PostMapping("/register")
    public String register() { return "register stub"; }

    @GetMapping("/test")
    public List<RawPaperData> test() {
       return alexClient.fetchPapers("machine learning", 1, 10);
    }
}

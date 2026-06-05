package com.journaltracker.controller;

import com.journaltracker.dto.RawPaperData;
import com.journaltracker.dto.request.LoginRequest;
import com.journaltracker.dto.request.RegisterRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.AuthResponse;
import com.journaltracker.external.OpenAlexClient;
import com.journaltracker.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final OpenAlexClient alexClient;
    private final AuthService authService;

    public AuthController(OpenAlexClient alexClient, AuthService authService) {
        this.alexClient = alexClient;
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    @GetMapping("/test")
    public List<RawPaperData> test() {
       return alexClient.fetchPapers("machine learning", 1, 10);
    }
}

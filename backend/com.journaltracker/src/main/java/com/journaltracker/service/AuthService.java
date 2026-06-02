package com.journaltracker.service;

import com.journaltracker.dto.request.LoginRequest;
import com.journaltracker.dto.request.RefreshTokenRequest;
import com.journaltracker.dto.request.RegisterRequest;
import com.journaltracker.dto.response.AuthResponse;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse refreshToken(RefreshTokenRequest request);
}

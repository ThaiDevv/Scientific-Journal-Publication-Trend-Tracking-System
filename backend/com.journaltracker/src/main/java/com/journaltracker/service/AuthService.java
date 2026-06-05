package com.journaltracker.service;

import com.journaltracker.dto.request.RegisterRequest;
import com.journaltracker.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
}

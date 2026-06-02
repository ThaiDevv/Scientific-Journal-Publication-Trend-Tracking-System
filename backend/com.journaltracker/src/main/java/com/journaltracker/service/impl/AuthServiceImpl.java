package com.journaltracker.service.impl;

import com.journaltracker.dto.request.LoginRequest;
import com.journaltracker.dto.request.RefreshTokenRequest;
import com.journaltracker.dto.request.RegisterRequest;
import com.journaltracker.dto.response.AuthResponse;
import com.journaltracker.entity.User;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.security.JwtTokenProvider;
import com.journaltracker.service.AuthService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Duration REFRESH_GRACE_PERIOD = Duration.ofHours(1);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username already exists");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already exists");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(request.getRole())
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        String token = jwtTokenProvider.generateToken(savedUser);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        } catch (AuthenticationException exception) {
            throw new UnauthorizedException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        String token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        Claims claims;
        try {
            claims = jwtTokenProvider.getClaimsForRefresh(request.getToken(), REFRESH_GRACE_PERIOD);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new UnauthorizedException("Invalid or expired token");
        }

        User user = userRepository.findByUsername(claims.getSubject())
                .filter(existingUser -> Boolean.TRUE.equals(existingUser.getIsActive()))
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
        String token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }
}

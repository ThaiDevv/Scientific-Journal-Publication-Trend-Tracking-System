package com.journaltracker.service.impl;

import com.journaltracker.dto.request.LoginRequest;
import com.journaltracker.dto.request.RefreshTokenRequest;
import com.journaltracker.dto.request.RegisterRequest;
import com.journaltracker.dto.response.AuthResponse;
import com.journaltracker.entity.RefreshToken;
import com.journaltracker.entity.User;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.RefreshTokenRepository;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.security.JwtTokenProvider;
import com.journaltracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenRepository refreshTokenRepository;

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
        String accessToken = jwtTokenProvider.generateToken(toUserDetails(savedUser));
        String newrefreshToken = jwtTokenProvider.generateRefreshToken(toUserDetails(savedUser));
        RefreshToken refreshToken = RefreshToken.builder()
                .token(newrefreshToken)
                .username(user.getUsername())
                .expiryDate(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newrefreshToken)
                .tokenType("Bearer")
                .username(savedUser.getUsername())
                .role(savedUser.getRole())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()));
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
        String accessToken = jwtTokenProvider.generateToken(toUserDetails(user));
        String newrefreshToken = jwtTokenProvider.generateRefreshToken(toUserDetails(user));
        try {
            refreshTokenRepository.revokeAllTokensByUsername(user.getUsername());
            log.info("Đã quét dọn vô hiệu hóa token cũ cho user: {}", user.getUsername());
        } catch (Exception e) {
            log.warn("Không thể dọn dẹp token cũ: {}", e.getMessage());
        }
        RefreshToken refreshToken = RefreshToken.builder()
                .token(newrefreshToken)
                .username(user.getUsername())
                .expiryDate(LocalDateTime.now().plusDays(7))
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(newrefreshToken)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String username = jwtTokenProvider.getUsernameFromRefreshableToken(request.getToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
        RefreshToken dbToken = refreshTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
        if (dbToken.isRevoked()) {
            if (dbToken.getGracePeriodEnd() != null && dbToken.getGracePeriodEnd().isAfter(LocalDateTime.now())) {
                log.info("Token cũ được chấp nhận lại do nằm trong khoảng ân hạn.");
            } else {
                log.error("CẢNH BÁO: Phát hiện hành vi dùng lại Token cũ của user: {}", username);
                refreshTokenRepository.revokeAllTokensByUsername(username);
                throw new UnauthorizedException("Breach detected. All sessions revoked.");
            }
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired token"));
        String accessToken = jwtTokenProvider.generateToken(toUserDetails(user));
        String refreshToken = jwtTokenProvider.generateRefreshToken(toUserDetails(user));

        dbToken.setRevoked(true);
        dbToken.setGracePeriodEnd(LocalDateTime.now().plusMinutes(1));
        refreshTokenRepository.save(dbToken);
        RefreshToken tokenEntity = RefreshToken.builder()
                .username(username)
                .token(refreshToken)
                .revoked(false)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();
        refreshTokenRepository.save(tokenEntity);
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .username(user.getUsername())
                .role(user.getRole())
                .build();
    }

    private UserDetails toUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPasswordHash(),
                List.of(new SimpleGrantedAuthority(user.getRole().name())));
    }
}

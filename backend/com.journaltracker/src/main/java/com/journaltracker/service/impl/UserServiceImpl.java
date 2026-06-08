package com.journaltracker.service.impl;

import com.journaltracker.dto.request.ChangePasswordRequest;
import com.journaltracker.dto.request.UpdateProfileRequest;
import com.journaltracker.dto.response.UserResponse;
import com.journaltracker.entity.User;
import com.journaltracker.exception.BadRequestException;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public UserResponse getMyProfile(String username) {
        return toResponse(getUserByUsername(username));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = getUserByUsername(username);

        if (request.getEmail() != null
                && userRepository.existsByEmailAndUsernameNot(request.getEmail(), username)) {
            throw new DuplicateResourceException("Email already exists");
        }

        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());

        return toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = getUserByUsername(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}

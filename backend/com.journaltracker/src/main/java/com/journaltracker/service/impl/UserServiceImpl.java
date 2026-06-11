package com.journaltracker.service.impl;

import com.journaltracker.dto.request.ChangePasswordRequest;
import com.journaltracker.dto.request.UpdateProfileRequest;
import com.journaltracker.dto.response.UserPageResponse;
import com.journaltracker.dto.response.UserResponse;
import com.journaltracker.entity.User;
import com.journaltracker.exception.BadRequestException;
import com.journaltracker.exception.DuplicateResourceException;
import com.journaltracker.exception.UnauthorizedException;
import com.journaltracker.repository.UserRepository;
import com.journaltracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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

    // =========================================================================
    // 🔥 TRIỂN KHAI CHI TIẾT 4 HÀM MỚI CHO ADMIN QUẢN LÝ USERS (JP-13)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public UserPageResponse getAdminUsers(int page, int size, String search, String role) {
        Pageable pageable = PageRequest.of(page, size);

        // Gọi custom query từ UserRepository
        Page<User> userPage = userRepository.searchAndFilterUsers(search, role, pageable);

        // Map List<User> thành List<UserResponse> dùng hàm toResponse() có sẵn của ông
        List<UserResponse> userResponses = userPage.getContent().stream()
                .map(this::toResponse)
                .toList();

        return UserPageResponse.builder()
                .content(userResponses)
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User không tồn tại với ID: " + id));
        return toResponse(user);
    }

    @Override
    @Transactional
    public void changeUserStatus(Long id, boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User không tồn tại với ID: " + id));

        // Lấy tên của Admin đang đăng nhập hệ thống hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();

        // BẪY LOGIC: Nếu đang tự khóa tài khoản của chính mình -> Chặn luôn!
        if (user.getUsername().equals(currentUsername) && !isActive) {
            throw new BadRequestException("Bạn không thể tự vô hiệu hóa tài khoản Admin của chính mình!");
        }

        user.setIsActive(isActive); // Note: Đảm bảo field trong Entity User của ông là active (hoặc chỉnh lại theo thực tế)
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void changeUserRole(Long id, String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User không tồn tại với ID: " + id));

        user.setRole(com.journaltracker.entity.Role.valueOf(role.toUpperCase()));        userRepository.save(user);
    }

    // =========================================================================

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
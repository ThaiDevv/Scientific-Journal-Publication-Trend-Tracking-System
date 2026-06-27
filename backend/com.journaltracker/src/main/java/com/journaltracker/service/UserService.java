package com.journaltracker.service;

import com.journaltracker.dto.request.ChangePasswordRequest;
import com.journaltracker.dto.request.UpdateProfileRequest;
import com.journaltracker.dto.response.UserPageResponse;
import com.journaltracker.dto.response.UserResponse;

public interface UserService {

    UserResponse getMyProfile(String username);

    UserResponse updateProfile(String username, UpdateProfileRequest request);

    void changePassword(String username, ChangePasswordRequest request);

    UserPageResponse getAdminUsers(int page, int size, String search, String role);

    UserResponse getUserById(Long id);

    void changeUserStatus(Long id, boolean isActive);

    void changeUserRole(Long id, String role);
}
package com.journaltracker.controller;

import com.journaltracker.dto.request.ChangePasswordRequest;
import com.journaltracker.dto.request.UpdateProfileRequest;
import com.journaltracker.dto.response.ApiResponse;
import com.journaltracker.dto.response.UserResponse;
import com.journaltracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMyProfile(Authentication authentication) {
        UserResponse userResponse = userService.getMyProfile(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Get profile successfully", userResponse));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse userResponse = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Update profile successfully", userResponse));
    }

    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Authentication authentication,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Change password successfully", null));
    }
}

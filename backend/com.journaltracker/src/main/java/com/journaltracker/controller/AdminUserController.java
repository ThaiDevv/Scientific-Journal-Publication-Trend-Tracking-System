package com.journaltracker.controller;

import com.journaltracker.dto.request.UserRoleRequest;
import com.journaltracker.dto.request.UserStatusRequest;
import com.journaltracker.dto.response.UserPageResponse;
import com.journaltracker.dto.response.UserResponse;
import com.journaltracker.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor

@PreAuthorize("hasAuthority('ADMIN')")

public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<UserPageResponse> getAdminUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        UserPageResponse response = userService.getAdminUsers(page, size, search, role);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Void> changeUserStatus(
            @PathVariable Long id,
            @RequestBody UserStatusRequest request) {

        userService.changeUserStatus(id, request.isActive());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<Void> changeUserRole(
            @PathVariable Long id,
            @RequestBody UserRoleRequest request) {

        userService.changeUserRole(id, request.getRole());
        return ResponseEntity.ok().build();
    }
}
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
@PreAuthorize("hasRole('ADMIN')") // Chặn toàn bộ endpoint trong class này, chỉ ADMIN mới được vào
public class AdminUserController {

    private final UserService userService;

    // 1. GET /api/admin/users → Lấy danh sách users (có phân trang, tìm kiếm, lọc role)
    @GetMapping
    public ResponseEntity<UserPageResponse> getAdminUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        UserPageResponse response = userService.getAdminUsers(page, size, search, role);
        return ResponseEntity.ok(response);
    }

    // 2. GET /api/admin/users/{id} → Lấy chi tiết 1 user
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    // 3. PUT /api/admin/users/{id}/status → Kích hoạt / Vô hiệu hóa tài khoản
    @PutMapping("/{id}/status")
    public ResponseEntity<Void> changeUserStatus(
            @PathVariable Long id,
            @RequestBody UserStatusRequest request) {

        userService.changeUserStatus(id, request.isActive());
        return ResponseEntity.ok().build(); // Trả về 200 OK trống, không dùng ApiResponse nữa
    }

    // 4. PUT /api/admin/users/{id}/role → Thay đổi quyền (Role) của user
    @PutMapping("/{id}/role")
    public ResponseEntity<Void> changeUserRole(
            @PathVariable Long id,
            @RequestBody UserRoleRequest request) {

        userService.changeUserRole(id, request.getRole());
        return ResponseEntity.ok().build();
    }
}
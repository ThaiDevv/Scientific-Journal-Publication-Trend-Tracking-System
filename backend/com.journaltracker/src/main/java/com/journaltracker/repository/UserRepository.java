package com.journaltracker.repository;

import com.journaltracker.entity.Role;

import com.journaltracker.entity.User;

import java.util.Optional;

import org.springframework.data.domain.Page;

import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;

import org.springframework.data.repository.query.Param;

import com.journaltracker.entity.Role;

public interface UserRepository extends JpaRepository<User, Long> {

        Optional<User> findByUsername(String username);

        Optional<User> findByEmail(String email);

        boolean existsByUsername(String username);

        boolean existsByEmail(String email);

        boolean existsByEmailAndUsernameNot(String email, String username);

        @Query("SELECT u FROM User u WHERE " +
                        "(:search IS NULL OR u.username LIKE %:search% OR u.email LIKE %:search%) " +
                        "AND (:role IS NULL OR u.role = :role)")
        Page<User> searchAndFilterUsersInternal(@Param("search") String search,
                        @Param("role") Role role,
                        Pageable pageable);
        default Page<User> searchAndFilterUsers(String search, String role, Pageable pageable) {
                Role roleEnum = null;
                if (role != null && !role.trim().isEmpty()) {
                        try {
                                roleEnum = Role.valueOf(role.trim().toUpperCase());
                        } catch (IllegalArgumentException e) {
                        }
                }
                return searchAndFilterUsersInternal(search, roleEnum, pageable);
        }

}
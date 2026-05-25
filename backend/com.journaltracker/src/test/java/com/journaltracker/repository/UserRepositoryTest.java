package com.journaltracker.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.journaltracker.entity.Role;
import com.journaltracker.entity.User;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    void saveUserAndReadItBack() {
        String suffix = UUID.randomUUID().toString();
        User user = User.builder()
                .username("test_user_" + suffix)
                .email("test_user_" + suffix + "@test.com")
                .passwordHash("$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy")
                .fullName("Test User")
                .role(Role.STUDENT)
                .build();

        User savedUser = userRepository.saveAndFlush(user);

        assertThat(savedUser.getId()).isNotNull();
        assertThat(savedUser.getCreatedAt()).isNotNull();
        assertThat(savedUser.getUpdatedAt()).isNotNull();

        User foundUser = userRepository.findById(savedUser.getId()).orElseThrow();
        assertThat(foundUser.getUsername()).isEqualTo(user.getUsername());
        assertThat(foundUser.getEmail()).isEqualTo(user.getEmail());
        assertThat(foundUser.getRole()).isEqualTo(Role.STUDENT);
        assertThat(foundUser.getIsActive()).isTrue();
    }

    @Test
    void findByUsernameReturnsSeededAdmin() {
        User admin = userRepository.findByUsername("admin").orElseThrow();

        assertThat(admin.getUsername()).isEqualTo("admin");
        assertThat(admin.getRole()).isEqualTo(Role.ADMIN);
    }

    @Test
    void existsByEmailReturnsFalseForMissingEmail() {
        assertThat(userRepository.existsByEmail("email_khong_ton_tai@test.com")).isFalse();
    }
}

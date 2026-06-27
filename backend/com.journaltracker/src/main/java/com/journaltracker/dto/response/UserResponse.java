package com.journaltracker.dto.response;

import com.journaltracker.entity.Role;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Boolean isActive;
    private LocalDateTime createdAt;
}

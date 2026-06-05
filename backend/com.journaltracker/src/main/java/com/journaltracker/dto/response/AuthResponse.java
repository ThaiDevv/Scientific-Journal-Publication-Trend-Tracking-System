package com.journaltracker.dto.response;

import com.journaltracker.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;

    @Builder.Default
    private String tokenType = "Bearer";

    private String username;
    private Role role;
}

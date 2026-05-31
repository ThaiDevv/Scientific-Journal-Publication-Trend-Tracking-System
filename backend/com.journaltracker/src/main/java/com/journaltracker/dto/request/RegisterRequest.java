package com.journaltracker.dto.request;

import com.journaltracker.entity.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {

    @NotBlank
    @Size(min = 3, max = 50)
    private String username;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 6)
    private String password;

    @NotBlank
    private String fullName;

    @NotNull
    private Role role;

    @AssertTrue(message = "Role ADMIN is not allowed for registration")
    public boolean isAllowedRegistrationRole() {
        return role == null || role == Role.RESEARCHER || role == Role.LECTURER || role == Role.STUDENT;
    }
}

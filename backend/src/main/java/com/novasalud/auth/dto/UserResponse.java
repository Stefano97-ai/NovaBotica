package com.novasalud.auth.dto;

import com.novasalud.auth.SessionUser;

public record UserResponse(SessionUser user, String token) {
    public UserResponse(SessionUser user) {
        this(user, null);
    }
}

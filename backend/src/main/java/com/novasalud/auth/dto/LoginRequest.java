package com.novasalud.auth.dto;
import jakarta.validation.constraints.*;
public record LoginRequest(@NotBlank @Size(max=80) String username,@NotNull @Size(min=1,max=256) String password) {}

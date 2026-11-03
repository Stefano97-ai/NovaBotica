package com.novasalud.auth;
public record Account(SessionUser user,String passwordHash,boolean active) {}

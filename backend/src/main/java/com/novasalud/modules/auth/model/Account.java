package com.novasalud.modules.auth.model;
public record Account(SessionUser user,String passwordHash,boolean active) {}

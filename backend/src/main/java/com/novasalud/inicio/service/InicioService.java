package com.novasalud.inicio.service;

import com.novasalud.auth.SessionUser;
import com.novasalud.inicio.dto.InicioSummaryDto;
import com.novasalud.inicio.repository.InicioRepository;
import org.springframework.stereotype.Service;

@Service
public class InicioService {

    private final InicioRepository repository;

    public InicioService(InicioRepository repository) {
        this.repository = repository;
    }

    public InicioSummaryDto obtenerResumen(SessionUser user) {
        return repository.summary(user.id(), user.rol());
    }

    public InicioSummaryDto summary(String id, String role) {
        return repository.summary(id, role);
    }
}

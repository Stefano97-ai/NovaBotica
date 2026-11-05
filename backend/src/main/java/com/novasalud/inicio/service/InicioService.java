package com.novasalud.inicio.service;

import com.novasalud.auth.SessionUser;
import com.novasalud.inicio.dto.InicioSummaryDto;
import com.novasalud.inicio.repository.InicioRepository;
import com.novasalud.inicio.repository.InicioChartsRepository;
import com.novasalud.inicio.dto.InicioChartsDto;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class InicioService {

    private final InicioRepository repository;
    private final InicioChartsRepository chartsRepository;

    public InicioService(InicioRepository repository, InicioChartsRepository chartsRepository) {
        this.repository = repository;
        this.chartsRepository = chartsRepository;
    }

    public InicioChartsDto charts(SessionUser user, int days) {
        if (days != 7 && days != 30 && days != 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El período debe ser 7, 30 o 90 días");
        }
        return chartsRepository.charts(user.id(), user.rol(), days);
    }

    public InicioSummaryDto obtenerResumen(SessionUser user) {
        return repository.summary(user.id(), user.rol());
    }

    public InicioSummaryDto summary(String id, String role) {
        return repository.summary(id, role);
    }
}

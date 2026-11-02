package com.novasalud.modules.inicio.service;
import com.novasalud.modules.inicio.dto.InicioResponse;
import com.novasalud.modules.inicio.repository.InicioRepository;
import com.novasalud.modules.auth.model.SessionUser;
import org.springframework.stereotype.Service;
@Service
public class InicioService {
    private final InicioRepository repository;public InicioService(InicioRepository repository){this.repository=repository;}
    public InicioResponse summary(SessionUser user){return repository.summary(user.id(),user.rol());}
}

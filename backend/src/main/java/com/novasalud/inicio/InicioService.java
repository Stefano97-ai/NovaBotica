package com.novasalud.inicio;
import com.novasalud.inicio.dto.InicioResponse;
import com.novasalud.auth.SessionUser;
import org.springframework.stereotype.Service;
@Service
public class InicioService {
    private final InicioRepository repository;public InicioService(InicioRepository repository){this.repository=repository;}
    public InicioResponse summary(SessionUser user){return repository.summary(user.id(),user.rol());}
}

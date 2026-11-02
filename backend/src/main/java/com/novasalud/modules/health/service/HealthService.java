package com.novasalud.modules.health.service;
import com.novasalud.modules.health.repository.HealthRepository;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
@Service
public class HealthService {
    private final HealthRepository repository;public HealthService(HealthRepository repository){this.repository=repository;}
    public Map<String,String> database(){try{return Map.of("status","ok","database","connected","migration",repository.latestMigration());}catch(Exception e){throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Base de datos no disponible o pendiente de migración");}}
}

package com.novasalud.alertas.service;

import com.novasalud.alertas.dto.AlertasPageDto;
import com.novasalud.alertas.repository.AlertaRepository;
import com.novasalud.auth.SessionUser;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service
public class AlertaService {
    private final AlertaRepository repository;
    private final int window,urgent;
    public AlertaService(AlertaRepository repository,@Value("${nova.alerts.expiry-days:30}") int window,
                         @Value("${nova.alerts.urgent-days:7}") int urgent) {
        if(window<1 || urgent<0 || urgent>window) throw new IllegalArgumentException("Ventanas de alertas inválidas");
        this.repository=repository; this.window=window; this.urgent=urgent;
    }
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void reconcile() { repository.reconcile(window,urgent); }

    @Transactional(readOnly=true,isolation=Isolation.REPEATABLE_READ)
    public AlertasPageDto list(SessionUser user,String state,String type,String priority,boolean unread,int limit,int offset) {
        validateRole(user);
        if(!Set.of("ACTIVA","RESUELTA","TODAS").contains(state) ||
           !Set.of("TODAS","STOCK_BAJO","AGOTADO","POR_VENCER","VENCIMIENTO_URGENTE","VENCIDO").contains(type) ||
           !Set.of("TODAS","MEDIA","ALTA","CRITICA").contains(priority) || limit<1 || limit>100 || offset<0)
            throw new BadRequestException("Los filtros o la paginación de alertas no son válidos.");
        return repository.list(user.id(),user.rol(),state,type,priority,unread,limit,offset);
    }
    @Transactional
    public void read(SessionUser user,Long id,int version) {
        validateRole(user);
        if(version<1) throw new BadRequestException("La versión debe ser mayor a cero.");
        if(repository.read(user.id(),user.rol(),id,version)==0)
            throw new ResourceNotFoundException("La alerta o su versión no están disponibles para tu usuario.");
    }
    @Transactional
    public void readAll(SessionUser user) { validateRole(user); repository.readAll(user.id(),user.rol()); }
    private void validateRole(SessionUser user) {
        if(!Set.of("ADMINISTRADOR","ALMACENERO","VENDEDOR").contains(user.rol()))
            throw new org.springframework.security.access.AccessDeniedException("Rol no autorizado");
    }
}

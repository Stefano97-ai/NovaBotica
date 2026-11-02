package com.novasalud.modules.inicio.controller;
import com.novasalud.modules.inicio.service.InicioService;
import com.novasalud.modules.inicio.dto.InicioResponse;
import com.novasalud.modules.auth.model.SessionUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/inicio")
public class InicioController {
    private final InicioService service;public InicioController(InicioService service){this.service=service;}
    @GetMapping @PreAuthorize("hasAnyRole('ADMINISTRADOR','VENDEDOR','ALMACENERO')")
    public InicioResponse summary(@AuthenticationPrincipal SessionUser user){return service.summary(user);}
}

package com.novasalud.inicio;
import com.novasalud.inicio.dto.InicioResponse;
import com.novasalud.auth.SessionUser;
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

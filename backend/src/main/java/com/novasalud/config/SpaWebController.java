package com.novasalud.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaWebController {

    @GetMapping(value = {
        "/",
        "/login",
        "/ventas",
        "/ventas/**",
        "/comprobantes",
        "/comprobantes/**",
        "/productos",
        "/productos/**",
        "/inventario",
        "/inventario/**",
        "/compras",
        "/compras/**",
        "/proveedores",
        "/proveedores/**",
        "/reportes",
        "/reportes/**",
        "/usuarios",
        "/usuarios/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}

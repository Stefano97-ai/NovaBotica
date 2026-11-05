package com.novasalud.health;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/health")
public class HealthController {
    private final HealthService service;public HealthController(HealthService service){this.service=service;}
    @GetMapping
     public Map<String,String> check(){return Map.of("status","ok","service","nova-salud-api","scope","process-only");}
    @GetMapping("/db") 
    public Map<String,String> database(){return service.database();}
}

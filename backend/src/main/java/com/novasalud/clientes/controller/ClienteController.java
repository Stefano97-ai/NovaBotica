package com.novasalud.clientes.controller;

import com.novasalud.clientes.dto.ClienteDto;
import com.novasalud.clientes.dto.CreateClienteDto;
import com.novasalud.clientes.dto.UpdateClienteDto;
import com.novasalud.clientes.service.ClienteService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    @GetMapping
    public ResponseEntity<List<ClienteDto>> listar(@RequestParam(required = false) String query) {
        return ResponseEntity.ok(clienteService.listar(query));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ClienteDto> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.obtenerPorId(id));
    }

    @GetMapping("/buscar")
    public ResponseEntity<ClienteDto> buscar(
        @RequestParam String tipo,
        @RequestParam String numero
    ) {
        return ResponseEntity.ok(clienteService.buscarPorDocumento(tipo, numero));
    }

    @PostMapping
    public ResponseEntity<ClienteDto> crear(@Valid @RequestBody CreateClienteDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clienteService.crear(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ClienteDto> actualizar(@PathVariable Long id, @Valid @RequestBody UpdateClienteDto dto) {
        return ResponseEntity.ok(clienteService.actualizar(id, dto));
    }
}

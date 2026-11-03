package com.novasalud.clientes.service;

import com.novasalud.clientes.dto.ClienteDto;
import com.novasalud.clientes.dto.CreateClienteDto;
import com.novasalud.clientes.dto.UpdateClienteDto;
import com.novasalud.clientes.model.Cliente;
import com.novasalud.clientes.repository.ClienteRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteDto> listar(String query) {
        List<Cliente> clientes = (query != null && !query.trim().isBlank())
            ? clienteRepository.buscarPorNumeroONombre(query.trim())
            : clienteRepository.findAllByOrderByNombreAsc();
        return clientes.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ClienteDto obtenerPorId(Long id) {
        return clienteRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));
    }

    @Transactional(readOnly = true)
    public ClienteDto buscarPorDocumento(String tipo, String numero) {
        return clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipo.toUpperCase(), numero.trim())
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con documento: " + numero));
    }

    @Transactional
    public ClienteDto crear(CreateClienteDto dto) {
        String tipo = dto.tipoDocumento().trim().toUpperCase();
        String numero = dto.numeroDocumento().trim();

        if ("DNI".equals(tipo) && !numero.matches("^[0-9]{8}$")) {
            throw new BadRequestException("El DNI debe tener exactamente 8 dígitos.");
        }
        if ("RUC".equals(tipo) && !numero.matches("^[0-9]{11}$")) {
            throw new BadRequestException("El RUC debe tener exactamente 11 dígitos.");
        }

        if (clienteRepository.findByTipoDocumentoAndNumeroDocumento(tipo, numero).isPresent()) {
            throw new BadRequestException("Ya existe un cliente con " + tipo + " " + numero);
        }

        Cliente cliente = new Cliente();
        cliente.setTipoDocumento(tipo);
        cliente.setNumeroDocumento(numero);
        cliente.setNombre(dto.nombre().trim());
        cliente.setDireccion(dto.direccion() != null ? dto.direccion().trim() : null);
        cliente.setCorreo(dto.correo() != null ? dto.correo().trim() : null);
        cliente.setTelefono(dto.telefono() != null ? dto.telefono().trim() : null);

        return toDto(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteDto actualizar(Long id, UpdateClienteDto dto) {
        Cliente cliente = clienteRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con ID: " + id));

        cliente.setNombre(dto.nombre().trim());
        cliente.setDireccion(dto.direccion() != null ? dto.direccion().trim() : null);
        cliente.setCorreo(dto.correo() != null ? dto.correo().trim() : null);
        cliente.setTelefono(dto.telefono() != null ? dto.telefono().trim() : null);

        return toDto(clienteRepository.save(cliente));
    }

    private ClienteDto toDto(Cliente c) {
        return new ClienteDto(
            c.getId(),
            c.getTipoDocumento(),
            c.getNumeroDocumento(),
            c.getNombre(),
            c.getDireccion(),
            c.getCorreo(),
            c.getTelefono()
        );
    }
}

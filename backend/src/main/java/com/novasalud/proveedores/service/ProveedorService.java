package com.novasalud.proveedores.service;

import com.novasalud.proveedores.dto.CreateProveedorDto;
import com.novasalud.proveedores.dto.ProveedorDto;
import com.novasalud.proveedores.dto.UpdateProveedorDto;
import com.novasalud.proveedores.model.Proveedor;
import com.novasalud.proveedores.repository.ProveedorRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProveedorService {

    private final ProveedorRepository proveedorRepository;

    public ProveedorService(ProveedorRepository proveedorRepository) {
        this.proveedorRepository = proveedorRepository;
    }

    @Transactional(readOnly = true)
    public List<ProveedorDto> listar(boolean soloActivos, String query) {
        List<Proveedor> lista;
        if (query != null && !query.trim().isBlank()) {
            lista = proveedorRepository.buscarPorRucORazonSocial(query.trim());
        } else if (soloActivos) {
            lista = proveedorRepository.findByActivoTrueOrderByRazonSocialAsc();
        } else {
            lista = proveedorRepository.findAllByOrderByRazonSocialAsc();
        }
        return lista.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public ProveedorDto obtenerPorId(Long id) {
        return proveedorRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con ID: " + id));
    }

    @Transactional
    public ProveedorDto crear(CreateProveedorDto dto) {
        String ruc = dto.ruc().trim();
        if (proveedorRepository.existsByRuc(ruc)) {
            throw new BadRequestException("Ya existe un proveedor registrado con el RUC: " + ruc);
        }

        Proveedor p = new Proveedor();
        p.setRuc(ruc);
        p.setRazonSocial(dto.razonSocial().trim());
        p.setTelefono(dto.telefono() != null ? dto.telefono().trim() : null);
        p.setCorreo(dto.correo() != null ? dto.correo().trim() : null);
        p.setDireccion(dto.direccion() != null ? dto.direccion().trim() : null);
        p.setActivo(true);

        return toDto(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorDto actualizar(Long id, UpdateProveedorDto dto) {
        Proveedor p = proveedorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con ID: " + id));

        p.setRazonSocial(dto.razonSocial().trim());
        p.setTelefono(dto.telefono() != null ? dto.telefono().trim() : null);
        p.setCorreo(dto.correo() != null ? dto.correo().trim() : null);
        p.setDireccion(dto.direccion() != null ? dto.direccion().trim() : null);
        if (dto.activo() != null) {
            p.setActivo(dto.activo());
        }

        return toDto(proveedorRepository.save(p));
    }

    @Transactional
    public ProveedorDto cambiarEstado(Long id, boolean activo) {
        Proveedor p = proveedorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Proveedor no encontrado con ID: " + id));
        p.setActivo(activo);
        return toDto(proveedorRepository.save(p));
    }

    private ProveedorDto toDto(Proveedor p) {
        return new ProveedorDto(
            p.getId(),
            p.getRuc(),
            p.getRazonSocial(),
            p.getTelefono(),
            p.getCorreo(),
            p.getDireccion(),
            p.isActivo()
        );
    }
}

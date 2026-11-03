package com.novasalud.usuarios.service;

import com.novasalud.auth.PasswordService;
import com.novasalud.auth.model.Rol;
import com.novasalud.auth.model.Usuario;
import com.novasalud.auth.repository.RolRepository;
import com.novasalud.auth.repository.UsuarioRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import com.novasalud.usuarios.dto.CreateUsuarioDto;
import com.novasalud.usuarios.dto.RolDto;
import com.novasalud.usuarios.dto.UpdateUsuarioDto;
import com.novasalud.usuarios.dto.UsuarioResponseDto;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordService passwordService;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordService passwordService) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordService = passwordService;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponseDto> listarTodos() {
        return usuarioRepository.findAllByOrderByNombreAsc().stream()
            .map(this::toDto)
            .toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponseDto obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
    }

    @Transactional
    public UsuarioResponseDto crear(CreateUsuarioDto dto) {
        String username = dto.username().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByUsernameIgnoreCase(username)) {
            throw new BadRequestException("El nombre de usuario '" + username + "' ya está registrado.");
        }

        Rol rol = rolRepository.findByCodigoIgnoreCase(dto.rolCodigo().trim())
            .orElseThrow(() -> new BadRequestException("El rol especificado no existe: " + dto.rolCodigo()));

        Usuario usuario = new Usuario();
        usuario.setUsername(username);
        usuario.setNombre(dto.nombre().trim());
        usuario.setPasswordHash(passwordService.hash(dto.password()));
        usuario.setRol(rol);
        usuario.setActivo(true);

        Usuario guardado = usuarioRepository.save(usuario);
        return toDto(guardado);
    }

    @Transactional
    public UsuarioResponseDto actualizar(Long id, UpdateUsuarioDto dto) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));

        Rol rol = rolRepository.findByCodigoIgnoreCase(dto.rolCodigo().trim())
            .orElseThrow(() -> new BadRequestException("El rol especificado no existe: " + dto.rolCodigo()));

        usuario.setNombre(dto.nombre().trim());
        usuario.setRol(rol);
        if (dto.activo() != null) {
            usuario.setActivo(dto.activo());
        }
        if (dto.password() != null && !dto.password().isBlank()) {
            if (dto.password().trim().length() < 6) {
                throw new BadRequestException("La nueva contraseña debe tener al menos 6 caracteres.");
            }
            usuario.setPasswordHash(passwordService.hash(dto.password().trim()));
        }

        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponseDto cambiarEstado(Long id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + id));
        usuario.setActivo(activo);
        return toDto(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public List<RolDto> listarRoles() {
        return rolRepository.findAll().stream()
            .map(r -> new RolDto(r.getId(), r.getCodigo(), r.getNombre()))
            .toList();
    }

    private UsuarioResponseDto toDto(Usuario u) {
        return new UsuarioResponseDto(
            u.getId(),
            u.getUsername(),
            u.getNombre(),
            u.getRol().getCodigo(),
            u.getRol().getNombre(),
            u.isActivo(),
            u.getCreadoEn()
        );
    }
}

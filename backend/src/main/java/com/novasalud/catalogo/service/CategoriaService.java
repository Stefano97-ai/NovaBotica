package com.novasalud.catalogo.service;

import com.novasalud.catalogo.dto.CategoriaDto;
import com.novasalud.catalogo.dto.CreateCategoriaDto;
import com.novasalud.catalogo.model.Categoria;
import com.novasalud.catalogo.repository.CategoriaRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoriaDto> listar(boolean soloActivas) {
        List<Categoria> list = soloActivas
            ? categoriaRepository.findByActivoTrueOrderByNombreAsc()
            : categoriaRepository.findAllByOrderByNombreAsc();
        return list.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public CategoriaDto obtenerPorId(Long id) {
        return categoriaRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
    }

    @Transactional
    public CategoriaDto crear(CreateCategoriaDto dto) {
        String nombre = dto.nombre().trim();
        if (categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new BadRequestException("Ya existe una categoría con el nombre: " + nombre);
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        categoria.setActivo(true);
        return toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaDto actualizar(Long id, CreateCategoriaDto dto) {
        Categoria categoria = categoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        String nombre = dto.nombre().trim();
        if (!categoria.getNombre().equalsIgnoreCase(nombre) && categoriaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new BadRequestException("Ya existe otra categoría con el nombre: " + nombre);
        }
        categoria.setNombre(nombre);
        return toDto(categoriaRepository.save(categoria));
    }

    @Transactional
    public CategoriaDto cambiarEstado(Long id, boolean activo) {
        Categoria categoria = categoriaRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Categoría no encontrada con ID: " + id));
        categoria.setActivo(activo);
        return toDto(categoriaRepository.save(categoria));
    }

    private CategoriaDto toDto(Categoria c) {
        return new CategoriaDto(c.getId(), c.getNombre(), c.isActivo());
    }
}

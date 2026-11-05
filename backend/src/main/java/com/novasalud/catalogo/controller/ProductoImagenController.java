package com.novasalud.catalogo.controller;

import com.novasalud.catalogo.service.*;
import com.novasalud.catalogo.dto.ProductoDto;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController @RequestMapping("/api/productos/{id}")
public class ProductoImagenController {
    private final ProductoImagenService images;private final ProductoService products;
    private final ProductoEdicionService editing;
    public ProductoImagenController(ProductoImagenService images,ProductoService products,ProductoEdicionService editing){this.images=images;this.products=products;this.editing=editing;}
    @PostMapping(value="/imagen",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ProductoDto upload(@PathVariable Long id,@RequestParam("imagen") MultipartFile image) {
        images.upload(id,image);return products.obtenerPorId(id);
    }
    @PostMapping(value="/edicion",consumes=MediaType.MULTIPART_FORM_DATA_VALUE) @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ProductoDto edit(@PathVariable Long id,@jakarta.validation.Valid @RequestPart("datos") com.novasalud.catalogo.dto.UpdateProductoDto data,
        @RequestPart(value="imagen",required=false) MultipartFile image){return editing.edit(id,data,image);}
    @GetMapping(value="/imagen",produces=MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> get(@PathVariable Long id) {
        return ResponseEntity.ok().cacheControl(CacheControl.noCache()).header("X-Content-Type-Options","nosniff").body(images.get(id));
    }
}

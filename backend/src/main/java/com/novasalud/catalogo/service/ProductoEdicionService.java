package com.novasalud.catalogo.service;
import com.novasalud.catalogo.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
@Service
public class ProductoEdicionService {
    private final ProductoService products;private final ProductoImagenService images;
    public ProductoEdicionService(ProductoService products,ProductoImagenService images){this.products=products;this.images=images;}
    @Transactional public ProductoDto edit(Long id,UpdateProductoDto data,MultipartFile image){
        products.actualizar(id,data);if(image!=null) images.upload(id,image);return products.obtenerPorId(id);
    }
}

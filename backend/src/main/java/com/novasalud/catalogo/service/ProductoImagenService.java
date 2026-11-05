package com.novasalud.catalogo.service;

import com.novasalud.catalogo.repository.ProductoRepository;
import com.novasalud.shared.exception.BadRequestException;
import com.novasalud.shared.exception.ResourceNotFoundException;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.*;
import java.util.*;
import javax.imageio.ImageIO;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ProductoImagenService {
    private final JdbcTemplate jdbc;private final ProductoRepository products;
    public ProductoImagenService(JdbcTemplate jdbc,ProductoRepository products){this.jdbc=jdbc;this.products=products;}
    @Transactional
    public void upload(Long id,MultipartFile file) {
        if(file==null||file.isEmpty()||file.getSize()>2*1024*1024) throw new BadRequestException("Selecciona una imagen PNG o JPEG de hasta 2 MB.");
        byte[] image;
        try(var input=ImageIO.createImageInputStream(file.getInputStream())) {
            var readers=ImageIO.getImageReaders(input);
            if(!readers.hasNext()) throw new BadRequestException("El archivo no es una imagen PNG o JPEG válida.");
            var reader=readers.next();
            try {
                String format=reader.getFormatName().toLowerCase(Locale.ROOT);
                if(!Set.of("png","jpeg","jpg").contains(format)) throw new BadRequestException("Solo se admiten imágenes PNG o JPEG.");
                reader.setInput(input);int width=reader.getWidth(0),height=reader.getHeight(0);
                if(width<1||height<1||width>6000||height>6000||(long)width*height>16000000) throw new BadRequestException("La imagen supera las dimensiones permitidas (16 megapíxeles).");
                BufferedImage original=reader.read(0);
                double scale=Math.min(1.0,1200.0/Math.max(width,height));
                var resized=new BufferedImage(Math.max(1,(int)(width*scale)),Math.max(1,(int)(height*scale)),BufferedImage.TYPE_INT_ARGB);
                var graphics=resized.createGraphics();graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION,RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.drawImage(original,0,0,resized.getWidth(),resized.getHeight(),null);graphics.dispose();
                var output=new ByteArrayOutputStream();ImageIO.write(resized,"png",output);image=output.toByteArray();
            }finally{reader.dispose();}
        }catch(IOException ex){throw new BadRequestException("No se pudo leer la imagen. Selecciona otro archivo.");}
        var product=products.lockForSale(List.of(id)).stream().findFirst().orElseThrow(()->new ResourceNotFoundException("Producto no encontrado"));
        jdbc.update("INSERT INTO producto_imagen(producto_id,contenido) VALUES(?,?) ON CONFLICT(producto_id) DO UPDATE SET contenido=EXCLUDED.contenido",id,image);
        product.setImagenVersion(UUID.randomUUID());products.save(product);
    }
    @Transactional(readOnly=true)
    public byte[] get(Long id) {
        return jdbc.query("SELECT contenido FROM producto_imagen WHERE producto_id=?",(rs,n)->rs.getBytes(1),id).stream().findFirst()
            .orElseThrow(()->new ResourceNotFoundException("El producto no tiene imagen asignada"));
    }
}

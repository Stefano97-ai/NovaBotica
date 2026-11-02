package com.novasalud.inicio.dto;
import java.util.List;
public record InicioResponse(String updatedAt,int products,int lowStock,int expired,int expiringCount,List<Lot> expiring,Sales sales) {
    public record Lot(String id,String producto,String lote,String vencimiento,int unidades) {}
    public record Sales(int count,String total) {}
}

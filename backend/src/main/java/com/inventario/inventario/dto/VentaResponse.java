package com.inventario.inventario.dto;

import java.time.LocalDateTime;
import java.util.List;

public class VentaResponse {
    private Long id;
    private LocalDateTime fecha;
    private Double total;
    private List<DetalleResponse> detalles;

    // Constructor vacío
    public VentaResponse() {}

    // Constructor con parámetros
    public VentaResponse(Long id, LocalDateTime fecha, Double total, List<DetalleResponse> detalles) {
        this.id = id;
        this.fecha = fecha;
        this.total = total;
        this.detalles = detalles;
    }

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public List<DetalleResponse> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleResponse> detalles) { this.detalles = detalles; }
}


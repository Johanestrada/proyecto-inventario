package com.inventario.inventario.dto;

public class DetalleResponse {
    private Long id;
    private Integer cantidad;
    private Double precioUnitario;
    private Double subtotal;
    private ProductoResponse producto;

    // Constructor vacío
    public DetalleResponse() {}

    // Constructor con parámetros
    public DetalleResponse(Long id, Integer cantidad, Double precioUnitario, Double subtotal, ProductoResponse producto) {
        this.id = id;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
        this.producto = producto;
    }

    // Getters y setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Double getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(Double precioUnitario) { this.precioUnitario = precioUnitario; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public ProductoResponse getProducto() { return producto; }
    public void setProducto(ProductoResponse producto) { this.producto = producto; }
}


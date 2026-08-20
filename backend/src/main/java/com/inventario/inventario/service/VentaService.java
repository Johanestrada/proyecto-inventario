package com.inventario.inventario.service;

import com.inventario.inventario.dto.DetalleRequest;
import com.inventario.inventario.dto.VentaRequest;
import com.inventario.inventario.model.DetalleVenta;
import com.inventario.inventario.model.Producto;
import com.inventario.inventario.model.Venta;
import com.inventario.inventario.repository.ProductoRepository;
import com.inventario.inventario.repository.VentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class VentaService {

    private final VentaRepository ventaRepository;
    private final ProductoRepository productoRepository;

    public VentaService(VentaRepository ventaRepository, ProductoRepository productoRepository) {
        this.ventaRepository = ventaRepository;
        this.productoRepository = productoRepository;
    }

    @Transactional
    public Venta crearVenta(VentaRequest request) {
        if (request == null || request.getDetalles() == null || request.getDetalles().isEmpty()) {
            throw new IllegalArgumentException("La venta debe incluir al menos un producto.");
        }

        Venta venta = new Venta();
        venta.setFecha(LocalDateTime.now());

        double total = 0;
        List<DetalleVenta> detalles = new ArrayList<>();
        Set<Long> productosIncluidos = new HashSet<>();

        for (DetalleRequest d : request.getDetalles()) {
            if (d == null || d.getProductoId() == null) {
                throw new IllegalArgumentException("Cada detalle debe indicar un producto.");
            }
            if (d.getCantidad() == null || d.getCantidad() <= 0) {
                throw new IllegalArgumentException("La cantidad de cada producto debe ser mayor que 0.");
            }
            if (!productosIncluidos.add(d.getProductoId())) {
                throw new IllegalArgumentException("Un producto no puede repetirse dentro de la misma venta.");
            }

            Producto producto = productoRepository.findByIdForUpdate(d.getProductoId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + d.getProductoId()));

            if (producto.getStock() < d.getCantidad()) {
                throw new IllegalArgumentException("Stock insuficiente para: " + producto.getNombre());
            }

            DetalleVenta detalle = new DetalleVenta();
            detalle.setProducto(producto);
            detalle.setCantidad(d.getCantidad());

            double precio = producto.getPrecio();
            detalle.setPrecioUnitario(precio);

            double subtotal = precio * d.getCantidad();
            detalle.setSubtotal(subtotal);

            detalle.setVenta(venta);

            total += subtotal;
            detalles.add(detalle);

            producto.setStock(producto.getStock() - d.getCantidad());
            productoRepository.save(producto);
        }

        venta.setTotal(total);
        venta.setDetalles(detalles);

        return ventaRepository.save(venta);
    }

    public List<Venta> obtenerVentas() {
        return ventaRepository.findAll();
    }

    public Double totalVentas() {
        return ventaRepository.obtenerTotalVentas();
    }

    public Long cantidadVentas() {
        return ventaRepository.contarVentas();
    }

    public Double promedioVenta() {
        Long cantidad = cantidadVentas();
        Double total = totalVentas();

        if (cantidad == 0) return 0.0;

        return total / cantidad;
    }

    public List<Map<String, Object>> obtenerVentasPorDia() {
        List<Object[]> resultados = ventaRepository.ventasPorDia();

        return resultados.stream().map(r -> {
            Map<String, Object> data = new HashMap<>();
            data.put("fecha", r[0]);
            data.put("total", r[1]);
            return data;
        }).toList();
    }

    public List<Map<String, Object>> topProductos() {
        return ventaRepository.topProductos().stream().map(r -> {
            Map<String, Object> data = new HashMap<>();
            data.put("nombre", r[0]);
            data.put("cantidadVendida", r[1]);
            data.put("totalVendido", r[2]);
            return data;
        }).toList();
    }

    public List<Venta> filtrarPorFecha(LocalDate fecha) {
        return ventaRepository.findByFecha(fecha);
    }

    public List<Venta> filtrarPorRangoFechas(LocalDate fechaInicio, LocalDate fechaFin) {
        return ventaRepository.findByFechaBetween(fechaInicio, fechaFin);
    }

    public String exportarCSV(List<Venta> ventas) {
        StringBuilder csv = new StringBuilder();
        csv.append("ID Venta,Fecha,Producto,Cantidad,Precio Unitario,Subtotal,Total Venta\n");

        for (Venta venta : ventas) {
            for (DetalleVenta detalle : venta.getDetalles()) {
                csv.append(venta.getId()).append(",");
                csv.append(venta.getFecha()).append(",");
                csv.append(detalle.getProducto().getNombre()).append(",");
                csv.append(detalle.getCantidad()).append(",");
                csv.append(String.format("%.2f", detalle.getPrecioUnitario())).append(",");
                csv.append(String.format("%.2f", detalle.getSubtotal())).append(",");
                csv.append(String.format("%.2f", venta.getTotal())).append("\n");
            }
        }

        return csv.toString();
    }

    public String exportarCSVConFiltro(LocalDate fechaInicio, LocalDate fechaFin) {
        List<Venta> ventas = filtrarPorRangoFechas(fechaInicio, fechaFin);
        return exportarCSV(ventas);
    }
}

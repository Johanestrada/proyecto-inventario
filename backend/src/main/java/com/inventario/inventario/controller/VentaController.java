package com.inventario.inventario.controller;

import com.inventario.inventario.dto.DetalleResponse;
import com.inventario.inventario.dto.ProductoResponse;
import com.inventario.inventario.dto.VentaRequest;
import com.inventario.inventario.dto.VentaResponse;
import com.inventario.inventario.model.DetalleVenta;
import com.inventario.inventario.model.Venta;
import com.inventario.inventario.service.VentaService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ventas")
public class VentaController {

    private final VentaService ventaService;

    public VentaController(VentaService ventaService) {
        this.ventaService = ventaService;
    }

    @PostMapping
    public Venta crearVenta(@RequestBody VentaRequest request) {
        return ventaService.crearVenta(request);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Map<String, Object>> obtenerVentas() {
        List<Venta> ventas = ventaService.obtenerVentas();
        return ventas.stream().map(venta -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", venta.getId());
            map.put("fecha", venta.getFecha());
            map.put("total", venta.getTotal());
            // Asumiendo que cada venta tiene un solo detalle
            if (!venta.getDetalles().isEmpty()) {
                DetalleVenta detalle = venta.getDetalles().get(0);
                map.put("productoNombre", detalle.getProducto().getNombre());
                map.put("cantidad", detalle.getCantidad());
            }
            return map;
        }).toList();
    }

    @GetMapping("/metricas")
    public Map<String, Object> obtenerMetricas() {

        Map<String, Object> metricas = new HashMap<>();
        metricas.put("totalVentas", ventaService.totalVentas());
        metricas.put("cantidadVentas", ventaService.cantidadVentas());

        return metricas;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {

        Map<String, Object> data = new HashMap<>();

        data.put("totalVentas", ventaService.totalVentas());
        data.put("cantidadVentas", ventaService.cantidadVentas());
        data.put("promedioVenta", ventaService.promedioVenta());

        return data;
    }

    @GetMapping("/ventas-por-dia")
    public List<Map<String, Object>> ventasPorDia() {
        return ventaService.obtenerVentasPorDia();
    }


    @GetMapping("/top-productos")
    public List<Map<String, Object>> topProductos() {
        return ventaService.topProductos();
    }

    @GetMapping("/historial")
    public List<VentaResponse> obtenerHistorial() {
        return convertirARespuestas(ventaService.obtenerVentas());
    }

    @GetMapping("/historial/por-fecha")
    public List<VentaResponse> filtrarPorFecha(@RequestParam LocalDate fecha) {
        return convertirARespuestas(ventaService.filtrarPorFecha(fecha));
    }

    @GetMapping("/historial/por-rango")
    public List<VentaResponse> filtrarPorRango(@RequestParam LocalDate fechaInicio, @RequestParam LocalDate fechaFin) {
        return convertirARespuestas(ventaService.filtrarPorRangoFechas(fechaInicio, fechaFin));
    }

    @GetMapping("/exportar/csv")
    public ResponseEntity<String> exportarCSV() {
        String csv = ventaService.exportarCSV(ventaService.obtenerVentas());
        return generarRespuestaCSV(csv, "historial-ventas.csv");
    }

    @GetMapping("/exportar/csv/por-rango")
    public ResponseEntity<String> exportarCSVPorRango(@RequestParam LocalDate fechaInicio, @RequestParam LocalDate fechaFin) {
        String csv = ventaService.exportarCSVConFiltro(fechaInicio, fechaFin);
        return generarRespuestaCSV(csv, "historial-ventas-filtrado.csv");
    }

    private ResponseEntity<String> generarRespuestaCSV(String csv, String nombreArchivo) {
        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=\"" + nombreArchivo + "\"");
        headers.add("Content-Type", "text/csv; charset=utf-8");
        return new ResponseEntity<>(csv, headers, HttpStatus.OK);
    }

    private List<VentaResponse> convertirARespuestas(List<Venta> ventas) {
        return ventas.stream().map(venta -> {
            List<DetalleResponse> detalles = venta.getDetalles().stream().map(detalle -> {
                ProductoResponse producto = new ProductoResponse(
                        detalle.getProducto().getId(),
                        detalle.getProducto().getNombre(),
                        detalle.getProducto().getPrecio(),
                        detalle.getProducto().getStock()
                );
                return new DetalleResponse(
                        detalle.getId(),
                        detalle.getCantidad(),
                        detalle.getPrecioUnitario(),
                        detalle.getSubtotal(),
                        producto
                );
            }).toList();
            return new VentaResponse(venta.getId(), venta.getFecha(), venta.getTotal(), detalles);
        }).toList();
    }
}

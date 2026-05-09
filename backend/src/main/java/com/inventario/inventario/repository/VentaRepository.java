package com.inventario.inventario.repository;

import com.inventario.inventario.model.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface VentaRepository extends JpaRepository<Venta, Long> {
    @Query("SELECT SUM(v.total) FROM Venta v")
    Double obtenerTotalVentas();

    @Query("SELECT COUNT(v) FROM Venta v")
    Long contarVentas();

    @Query("SELECT CAST(v.fecha AS DATE), SUM(v.total) FROM Venta v GROUP BY CAST(v.fecha AS DATE)")
    List<Object[]> ventasPorDia();

    @Query("SELECT d.producto.nombre, SUM(d.cantidad) as totalVendido, SUM(d.subtotal) as totalVentas " +
            "FROM DetalleVenta d GROUP BY d.producto.nombre ORDER BY totalVendido DESC")
    List<Object[]> topProductos();

    @Query("SELECT v FROM Venta v WHERE CAST(v.fecha AS DATE) = :fecha")
    List<Venta> findByFecha(@Param("fecha") LocalDate fecha);

    @Query("SELECT v FROM Venta v WHERE CAST(v.fecha AS DATE) BETWEEN :fechaInicio AND :fechaFin")
    List<Venta> findByFechaBetween(@Param("fechaInicio") LocalDate fechaInicio, @Param("fechaFin") LocalDate fechaFin);
}
package com.inventario.inventario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.inventario.inventario.model.DetalleVenta;

@Repository
public interface DetalleVentaRepository extends JpaRepository<DetalleVenta, Long> {
    boolean existsByProductoId(Long productoId);

    void deleteByProductoId(Long productoId);
}

package com.inventario.inventario.repository;

import com.inventario.inventario.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByStockLessThan(Integer stock);
}

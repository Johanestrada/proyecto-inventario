package com.inventario.inventario.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.inventario.inventario.model.Producto;

public interface ProductoRepository extends JpaRepository<Producto, Long>, ProductoRepositoryCustom {
    List<Producto> findByStockLessThanEqual(Integer stock);
}

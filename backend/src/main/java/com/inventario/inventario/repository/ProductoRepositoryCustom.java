package com.inventario.inventario.repository;

import java.util.Optional;

import com.inventario.inventario.model.Producto;

public interface ProductoRepositoryCustom {
    Optional<Producto> findByIdForUpdate(Long id);
}

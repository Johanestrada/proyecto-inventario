package com.inventario.inventario.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.inventario.inventario.model.Producto;
import com.inventario.inventario.repository.DetalleVentaRepository;
import com.inventario.inventario.repository.ProductoRepository;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final DetalleVentaRepository detalleVentaRepository;

    public ProductoService(ProductoRepository productoRepository, DetalleVentaRepository detalleVentaRepository) {
        this.productoRepository = productoRepository;
        this.detalleVentaRepository = detalleVentaRepository;
    }

    public List<Producto> obtenerTodos() {
        return productoRepository.findAll();
    }

    public Producto guardar(Producto producto) {
        return productoRepository.save(producto);
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto actualizar(Long id, Producto producto) {
        Producto productoExistente = productoRepository.findById(id).orElseThrow();

        productoExistente.setNombre(producto.getNombre());
        productoExistente.setPrecio(producto.getPrecio());
        productoExistente.setStock(producto.getStock());

        return productoRepository.save(productoExistente);
    }

    @Transactional
    public void eliminar(Long id) {
        // Elimina primero los detalles de venta asociados al producto
        if (detalleVentaRepository.existsByProductoId(id)) {
            detalleVentaRepository.deleteByProductoId(id);
        }
        productoRepository.deleteById(id);
    }

    public List<Producto> stockBajo(Integer limite) {
        return productoRepository.findByStockLessThan(limite);
    }
}

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
        validarProducto(producto);
        return productoRepository.save(producto);
    }

    public Optional<Producto> obtenerPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto actualizar(Long id, Producto producto) {
        validarProducto(producto);
        Producto productoExistente = productoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado con ID: " + id));

        productoExistente.setNombre(producto.getNombre());
        productoExistente.setPrecio(producto.getPrecio());
        productoExistente.setStock(producto.getStock());

        return productoRepository.save(productoExistente);
    }

    @Transactional
    public void eliminar(Long id) {
        if (detalleVentaRepository.existsByProductoId(id)) {
            throw new IllegalArgumentException(
                    "No se puede eliminar un producto con ventas registradas. Conserva el historial y actualiza su stock a 0."
            );
        }
        if (!productoRepository.existsById(id)) {
            throw new IllegalArgumentException("Producto no encontrado con ID: " + id);
        }
        productoRepository.deleteById(id);
    }

    public List<Producto> stockBajo(Integer limite) {
        if (limite == null || limite < 0) {
            throw new IllegalArgumentException("El l\u00edmite de stock debe ser un n\u00famero mayor o igual a 0.");
        }
        return productoRepository.findByStockLessThanEqual(limite);
    }

    private void validarProducto(Producto producto) {
        if (producto == null) {
            throw new IllegalArgumentException("Los datos del producto son obligatorios.");
        }
        if (producto.getNombre() == null || producto.getNombre().trim().isEmpty()) {
            throw new IllegalArgumentException("El nombre del producto es obligatorio.");
        }
        if (producto.getPrecio() == null || producto.getPrecio() < 0) {
            throw new IllegalArgumentException("El precio debe ser mayor o igual a 0.");
        }
        if (producto.getStock() == null || producto.getStock() < 0) {
            throw new IllegalArgumentException("El stock debe ser mayor o igual a 0.");
        }
    }
}

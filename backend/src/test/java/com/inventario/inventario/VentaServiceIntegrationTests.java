package com.inventario.inventario;

import com.inventario.inventario.dto.DetalleRequest;
import com.inventario.inventario.dto.VentaRequest;
import com.inventario.inventario.model.Producto;
import com.inventario.inventario.repository.DetalleVentaRepository;
import com.inventario.inventario.repository.ProductoRepository;
import com.inventario.inventario.repository.VentaRepository;
import com.inventario.inventario.service.VentaService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class VentaServiceIntegrationTests {

    @Autowired
    private VentaService ventaService;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private VentaRepository ventaRepository;

    @Autowired
    private DetalleVentaRepository detalleVentaRepository;

    @AfterEach
    void limpiarDatos() {
        detalleVentaRepository.deleteAll();
        ventaRepository.deleteAll();
        productoRepository.deleteAll();
    }

    @Test
    void rechazaUnProductoRepetidoEnLaMismaVenta() {
        Producto producto = productoRepository.save(new Producto(null, "Producto", 1000.0, 5));
        VentaRequest ventaConDuplicado = new VentaRequest(List.of(
                new DetalleRequest(producto.getId(), 2),
                new DetalleRequest(producto.getId(), 3)
        ));

        assertThrows(IllegalArgumentException.class, () -> ventaService.crearVenta(ventaConDuplicado));

        assertEquals(5, productoRepository.findById(producto.getId()).orElseThrow().getStock());
        assertEquals(0, ventaRepository.count());
    }

    @Test
    void permiteSoloUnaVentaConcurrenteCuandoElStockNoAlcanzaParaAmbas() throws Exception {
        Producto producto = productoRepository.save(new Producto(null, "Producto", 1000.0, 5));
        CyclicBarrier inicioSimultaneo = new CyclicBarrier(2);
        ExecutorService executor = Executors.newFixedThreadPool(2);

        try {
            Callable<Boolean> intentarVenta = () -> {
                inicioSimultaneo.await(10, TimeUnit.SECONDS);
                try {
                    ventaService.crearVenta(new VentaRequest(List.of(new DetalleRequest(producto.getId(), 4))));
                    return true;
                } catch (IllegalArgumentException exception) {
                    return false;
                }
            };

            Future<Boolean> ventaA = executor.submit(intentarVenta);
            Future<Boolean> ventaB = executor.submit(intentarVenta);

            boolean resultadoA = ventaA.get(15, TimeUnit.SECONDS);
            boolean resultadoB = ventaB.get(15, TimeUnit.SECONDS);

            assertTrue(resultadoA || resultadoB);
            assertFalse(resultadoA && resultadoB);
            assertEquals(1, productoRepository.findById(producto.getId()).orElseThrow().getStock());
            assertEquals(1, ventaRepository.count());
        } finally {
            executor.shutdownNow();
        }
    }
}

import { useState } from "react";

export function useCarrito() {
  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem("carrito");
    return guardado ? JSON.parse(guardado) : [];
  });

  const agregarAlCarrito = (productoId, cantidad) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.productoId === productoId);
      if (existe) {
        return prev.map((item) =>
          item.productoId === productoId
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        );
      } else {
        return [...prev, { productoId, cantidad }];
      }
    });
  };

  const cambiarCantidad = (productoId, cantidad) => {
    setCarrito((prev) =>
      prev.map((item) =>
        item.productoId === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const eliminarDelCarrito = (productoId) => {
    setCarrito((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  // Sincronizar con localStorage
  const syncCarrito = (nuevo) => {
    setCarrito(nuevo);
    localStorage.setItem("carrito", JSON.stringify(nuevo));
  };

  return {
    carrito,
    setCarrito: syncCarrito,
    agregarAlCarrito,
    cambiarCantidad,
    eliminarDelCarrito,
  };
}

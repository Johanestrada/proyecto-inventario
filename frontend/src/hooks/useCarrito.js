import { useState } from "react";

const CARRITO_KEY = "carrito";

const carritoValido = (valor) =>
  Array.isArray(valor) &&
  valor.every(
    (item) =>
      item &&
      Number.isInteger(item.productoId) &&
      item.productoId > 0 &&
      Number.isInteger(item.cantidad) &&
      item.cantidad > 0
  );

const leerCarrito = () => {
  try {
    const guardado = localStorage.getItem(CARRITO_KEY);
    if (!guardado) return [];

    const carrito = JSON.parse(guardado);
    return carritoValido(carrito) ? carrito : [];
  } catch {
    return [];
  }
};

export function useCarrito() {
  const [carrito, setCarrito] = useState(leerCarrito);

  const actualizarCarrito = (actualizador) => {
    setCarrito((prev) => {
      const nuevo = typeof actualizador === "function" ? actualizador(prev) : actualizador;
      const carritoSeguro = carritoValido(nuevo) ? nuevo : [];

      try {
        localStorage.setItem(CARRITO_KEY, JSON.stringify(carritoSeguro));
      } catch {
        // El carrito sigue funcionando aunque el navegador no permita persistirlo.
      }

      return carritoSeguro;
    });
  };

  const agregarAlCarrito = (productoId, cantidad) => {
    if (!Number.isInteger(productoId) || productoId <= 0 || !Number.isInteger(cantidad) || cantidad <= 0) {
      return;
    }

    actualizarCarrito((prev) => {
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
    if (!Number.isInteger(cantidad) || cantidad < 1) return;

    actualizarCarrito((prev) =>
      prev.map((item) =>
        item.productoId === productoId ? { ...item, cantidad } : item
      )
    );
  };

  const eliminarDelCarrito = (productoId) => {
    actualizarCarrito((prev) => prev.filter((item) => item.productoId !== productoId));
  };

  return {
    carrito,
    setCarrito: actualizarCarrito,
    agregarAlCarrito,
    cambiarCantidad,
    eliminarDelCarrito,
  };
}

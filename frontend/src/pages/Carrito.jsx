
import React, { useEffect, useState } from "react";
import { realizarVenta, obtenerProductos } from "../services/api";
import { useCarrito } from "../hooks/useCarrito";
import "../components/Carrito.css";

function CarritoPage() {
  const { carrito, eliminarDelCarrito, cambiarCantidad, setCarrito } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'error'|'success', texto: '' }

  useEffect(() => {
    obtenerProductos().then(setProductos);
  }, []);

  const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalDinero = carrito.reduce((sum, item) => {
    const prod = productos.find((p) => p.id === item.productoId);
    return sum + (prod ? prod.precio * item.cantidad : 0);
  }, 0);

  const validar = () => {
    if (carrito.length === 0) return "El carrito está vacío.";
    for (const item of carrito) {
      if (item.cantidad < 1) return "Cantidad mínima es 1.";
      const prod = productos.find((p) => p.id === item.productoId);
      if (!prod) return "Producto no encontrado.";
      if (item.cantidad > prod.stock) return `Stock insuficiente para ${prod.nombre}.`;
    }
    return null;
  };

  const procesarPago = async () => {
    const error = validar();
    if (error) {
      setMensaje({ tipo: "error", texto: error });
      return;
    }
    setCargando(true);
    setMensaje(null);
    try {
      const venta = await realizarVenta(carrito);
      setMensaje({ tipo: "success", texto: `Venta #${venta.id} - Total $${venta.total}` });
      setCarrito([]);
    } catch (e) {
      setMensaje({ tipo: "error", texto: e.message || "Error al procesar pago" });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="carrito-container">
      <h2>🛒 Carrito de Compras</h2>
      {mensaje && (
        <div className={`mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>
      )}
      <div className="carrito-table-wrapper">
        <table className="carrito-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio</th>
              <th>Subtotal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {carrito.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center" }}>
                  Carrito vacío
                </td>
              </tr>
            ) : (
              carrito.map((item) => {
                const prod = productos.find((p) => p.id === item.productoId);
                if (!prod) return null;
                return (
                  <tr key={item.productoId}>
                    <td>{prod.nombre}</td>
                    <td>
                      <button
                        className="btn-menos"
                        onClick={() => cambiarCantidad(item.productoId, Math.max(1, item.cantidad - 1))}
                        disabled={item.cantidad <= 1 || cargando}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={prod.stock}
                        value={item.cantidad}
                        onChange={e => {
                          let val = parseInt(e.target.value, 10);
                          if (isNaN(val)) val = 1;
                          cambiarCantidad(item.productoId, Math.max(1, Math.min(prod.stock, val)));
                        }}
                        style={{ width: 50, textAlign: "center" }}
                        disabled={cargando}
                      />
                      <button
                        className="btn-mas"
                        onClick={() => cambiarCantidad(item.productoId, Math.min(prod.stock, item.cantidad + 1))}
                        disabled={item.cantidad >= prod.stock || cargando}
                      >
                        +
                      </button>
                    </td>
                    <td>${prod.precio.toLocaleString()}</td>
                    <td>${(prod.precio * item.cantidad).toLocaleString()}</td>
                    <td>
                      <button
                        className="btn-eliminar"
                        onClick={() => eliminarDelCarrito(item.productoId)}
                        disabled={cargando}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="carrito-resumen">
        <div>Total items: <b>{totalItems}</b></div>
        <div>Total: <b>${totalDinero.toLocaleString()}</b></div>
      </div>
      <button
        className="btn-pago"
        onClick={procesarPago}
        disabled={cargando || carrito.length === 0}
        style={{ marginTop: 16, width: "100%" }}
      >
        {cargando ? "Procesando..." : "Procesar Pago"}
      </button>
    </div>
  );
}

export default CarritoPage;

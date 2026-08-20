import { useCallback, useEffect, useMemo, useState } from "react";
import { obtenerProductos, realizarVenta } from "../services/api";
import { useCarrito } from "../hooks/useCarrito";

function PuntoVenta() {
  const { carrito, agregarAlCarrito, cambiarCantidad, eliminarDelCarrito, setCarrito } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const cargarProductos = useCallback(async () => {
    try {
      const data = await obtenerProductos();
      setProductos(data);
    } catch (e) {
      console.error("Error cargando productos", e);
      setMensaje({ tipo: "error", texto: "No fue posible cargar los productos." });
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const productosPorId = useMemo(
    () => new Map(productos.map((producto) => [producto.id, producto])),
    [productos]
  );

  const productosFiltrados = productos.filter((producto) =>
    producto.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const itemsVenta = carrito.map((item) => ({
    ...item,
    producto: productosPorId.get(item.productoId),
  }));

  const totalItems = carrito.reduce((total, item) => total + item.cantidad, 0);
  const totalVenta = itemsVenta.reduce(
    (total, item) => total + (item.producto ? item.producto.precio * item.cantidad : 0),
    0
  );

  const cantidadEnCarrito = (productoId) =>
    carrito.find((item) => item.productoId === productoId)?.cantidad || 0;

  const agregarProducto = (producto) => {
    if (producto.stock <= cantidadEnCarrito(producto.id)) {
      setMensaje({ tipo: "error", texto: `No hay más stock disponible de ${producto.nombre}.` });
      return;
    }

    agregarAlCarrito(producto.id, 1);
    setMensaje(null);
  };

  const actualizarCantidad = (item, cantidad) => {
    if (!item.producto) return;
    cambiarCantidad(item.productoId, Math.max(1, Math.min(item.producto.stock, cantidad)));
  };

  const validarVenta = () => {
    if (carrito.length === 0) return "Agrega al menos un producto a la venta.";

    for (const item of itemsVenta) {
      if (!item.producto) return "Uno de los productos ya no está disponible.";
      if (item.cantidad < 1) return "La cantidad mínima por producto es 1.";
      if (item.cantidad > item.producto.stock) {
        return `Stock insuficiente para ${item.producto.nombre}.`;
      }
    }

    return null;
  };

  const cobrar = async () => {
    const error = validarVenta();
    if (error) {
      setMensaje({ tipo: "error", texto: error });
      return;
    }

    setProcesandoPago(true);
    setMensaje(null);
    try {
      const venta = await realizarVenta(carrito);
      setCarrito([]);
      await cargarProductos();
      setMensaje({
        tipo: "success",
        texto: `Venta #${venta.id} registrada por $${venta.total.toLocaleString()}.`,
      });
    } catch (e) {
      const texto = e.response?.data?.message || e.response?.data || "No fue posible registrar la venta.";
      setMensaje({ tipo: "error", texto: String(texto) });
    } finally {
      setProcesandoPago(false);
    }
  };

  return (
    <div className="pos-page">
      <div className="page-header pos-page-header">
        <div>
          <h1>🛒 Punto de Venta</h1>
          <p>Selecciona productos, revisa la venta y cobra desde un solo lugar.</p>
        </div>
        <div className="pos-cart-indicator" aria-label={`${totalItems} productos en la venta`}>
          <span>Venta actual</span>
          <strong>{totalItems} {totalItems === 1 ? "producto" : "productos"}</strong>
        </div>
      </div>

      {mensaje && (
        <div className={`pos-message ${mensaje.tipo}`} role="status">
          <span>{mensaje.tipo === "success" ? "✓" : "!"}</span>
          {mensaje.texto}
        </div>
      )}

      <div className="pos-layout">
        <section className="pos-catalogo" aria-label="Catálogo de productos">
          <div className="pos-panel-header">
            <div>
              <h2>Productos</h2>
              <p>{productos.length} disponibles en el inventario</p>
            </div>
            <label className="pos-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto..."
                aria-label="Buscar producto"
              />
            </label>
          </div>

          {cargando ? (
            <div className="spinner" />
          ) : productosFiltrados.length === 0 ? (
            <div className="pos-empty-catalogo">
              <span>📦</span>
              <h3>{busqueda ? "No encontramos productos" : "No hay productos disponibles"}</h3>
              <p>
                {busqueda
                  ? `No hay coincidencias para “${busqueda}”.`
                  : "Crea productos desde Inventario para comenzar a vender."}
              </p>
            </div>
          ) : (
            <div className="pos-product-grid">
              {productosFiltrados.map((producto) => {
                const enCarrito = cantidadEnCarrito(producto.id);
                const sinStock = producto.stock === 0;
                const stockAgotadoEnVenta = enCarrito >= producto.stock;

                return (
                  <article
                    key={producto.id}
                    className={`pos-product-card ${sinStock ? "sold-out" : ""}`}
                  >
                    <div className="pos-product-card-top">
                      <span className={`pos-stock ${sinStock ? "empty" : producto.stock <= 5 ? "low" : ""}`}>
                        {sinStock ? "Sin stock" : `${producto.stock} uds`}
                      </span>
                      {enCarrito > 0 && <span className="pos-in-cart">{enCarrito} en venta</span>}
                    </div>
                    <h3>{producto.nombre}</h3>
                    <strong>${producto.precio.toLocaleString()}</strong>
                    <button
                      type="button"
                      className="pos-add-button"
                      onClick={() => agregarProducto(producto)}
                      disabled={sinStock || stockAgotadoEnVenta || procesandoPago}
                    >
                      {sinStock ? "Sin stock" : stockAgotadoEnVenta ? "Stock añadido" : "+ Agregar"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="pos-cart-panel" aria-label="Resumen de venta">
          <div className="pos-cart-header">
            <div>
              <span className="pos-eyebrow">Resumen</span>
              <h2>Venta actual</h2>
            </div>
            {carrito.length > 0 && (
              <button
                type="button"
                className="pos-clear-button"
                onClick={() => setCarrito([])}
                disabled={procesandoPago}
              >
                Vaciar
              </button>
            )}
          </div>

          <div className="pos-cart-items">
            {itemsVenta.length === 0 ? (
              <div className="pos-empty-cart">
                <div>🧾</div>
                <h3>Aún no hay productos</h3>
                <p>Agrega artículos desde el catálogo para iniciar una venta.</p>
              </div>
            ) : (
              itemsVenta.map((item) => {
                if (!item.producto) {
                  return (
                    <div className="pos-cart-item unavailable" key={item.productoId}>
                      <div>
                        <strong>Producto no disponible</strong>
                        <span>Elimínalo para continuar.</span>
                      </div>
                      <button type="button" onClick={() => eliminarDelCarrito(item.productoId)}>Quitar</button>
                    </div>
                  );
                }

                return (
                  <div className="pos-cart-item" key={item.productoId}>
                    <div className="pos-cart-item-main">
                      <div>
                        <h3>{item.producto.nombre}</h3>
                        <span>${item.producto.precio.toLocaleString()} c/u</span>
                      </div>
                      <strong>${(item.producto.precio * item.cantidad).toLocaleString()}</strong>
                    </div>
                    <div className="pos-cart-item-actions">
                      <div className="pos-quantity-control">
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item, item.cantidad - 1)}
                          disabled={item.cantidad <= 1 || procesandoPago}
                          aria-label={`Restar una unidad de ${item.producto.nombre}`}
                        >
                          −
                        </button>
                        <span>{item.cantidad}</span>
                        <button
                          type="button"
                          onClick={() => actualizarCantidad(item, item.cantidad + 1)}
                          disabled={item.cantidad >= item.producto.stock || procesandoPago}
                          aria-label={`Sumar una unidad de ${item.producto.nombre}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="pos-remove-button"
                        onClick={() => eliminarDelCarrito(item.productoId)}
                        disabled={procesandoPago}
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pos-total-section">
            <div className="pos-total-row">
              <span>Productos</span>
              <span>{totalItems}</span>
            </div>
            <div className="pos-total-row grand-total">
              <span>Total</span>
              <strong>${totalVenta.toLocaleString()}</strong>
            </div>
            <button
              type="button"
              className="pos-charge-button"
              onClick={cobrar}
              disabled={carrito.length === 0 || procesandoPago}
            >
              {procesandoPago ? "Procesando venta..." : `Cobrar $${totalVenta.toLocaleString()}`}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default PuntoVenta;

import { useState, useEffect, useCallback } from "react";
import API from "../services/api";

function Ventas() {
  const [productos, setProductos] = useState([]);
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await API.get("/productos");
        setProductos(res.data);
      } catch (e) {
        console.error("Error cargando productos", e);
      }
    };
    fetchProductos();
  }, []);

  const realizarVenta = async (e) => {
    e.preventDefault();
    if (!productoId || !cantidad) {
      addToast("Selecciona un producto y cantidad", "error");
      return;
    }

    setLoading(true);
    try {
      await API.post("/ventas", {
        detalles: [
          {
            productoId: parseInt(productoId),
            cantidad: parseInt(cantidad)
          }
        ]
      });
      addToast("Venta realizada exitosamente");
      setProductoId("");
      setCantidad("");
      // Refresh productos list to update stock
      const res = await API.get("/productos");
      setProductos(res.data);
    } catch (e) {
      console.error("Error realizando venta", e);
      const msg = e.response?.data?.message || e.response?.data || "Error al realizar la venta";
      addToast(String(msg), "error");
    }
    setLoading(false);
  };


  const selectedProduct = productos.find((p) => String(p.id) === String(productoId));

  return (
    <div>
      <div className="page-header">
        <h1>💰 Registrar Venta</h1>
        <p>Registra una nueva venta seleccionando un producto</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Form */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "var(--text-primary)" }}>
            Nueva Venta
          </h3>
          <form onSubmit={realizarVenta}>
            <div className="form-group">
              <label className="form-label">Producto</label>
              <select
                className="form-input"
                value={productoId}
                onChange={(e) => setProductoId(e.target.value)}
              >
                <option value="">Seleccionar producto...</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — Stock: {p.stock} — ${p.precio?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej: 2"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                min="1"
                max={selectedProduct?.stock || 999}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            >
              {loading ? "Procesando..." : "💳 Registrar Venta"}
            </button>
          </form>
        </div>

        {/* Preview */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "var(--text-primary)" }}>
            Resumen
          </h3>
          {selectedProduct && cantidad ? (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Producto</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{selectedProduct.nombre}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Precio unitario</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>${selectedProduct.precio?.toLocaleString()}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Cantidad</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{cantidad}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 0", borderTop: "2px solid var(--accent-soft)" }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontSize: 16 }}>Total</span>
                  <span style={{ color: "var(--accent)", fontWeight: 700, fontSize: 20 }}>
                    ${(selectedProduct.precio * Number(cantidad)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: "30px 0" }}>
              <div className="empty-state-icon">🧾</div>
              <p>Selecciona un producto y cantidad para ver el resumen</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ventas;

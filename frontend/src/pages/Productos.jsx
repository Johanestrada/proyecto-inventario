import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import { useCarrito } from "../hooks/useCarrito";

function Productos() {
  // Carrito global
  const { agregarAlCarrito } = useCarrito();
  const [cantidadAgregar, setCantidadAgregar] = useState({}); // { [productoId]: cantidad }
  const [productos, setProductos] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("crear"); // "crear" | "editar"
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ nombre: "", precio: "", stock: "" });

  // Confirm delete
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ─── Toast helper ───
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // ─── Fetch data ───
  const cargarProductos = useCallback(async () => {
    try {
      const res = await API.get("/productos");
      setProductos(res.data);
    } catch (e) {
      console.error("Error cargando productos", e);
      addToast("Error al cargar productos", "error");
    }
  }, [addToast]);

  const cargarStockBajo = useCallback(async () => {
    try {
      const res = await API.get("/productos/stock-bajo?limite=5");
      setStockBajo(res.data);
    } catch (e) {
      console.error("Error stock bajo", e);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([cargarProductos(), cargarStockBajo()]);
      setLoading(false);
    };
    init();
  }, [cargarProductos, cargarStockBajo]);

  // ─── Form handlers ───
  const openCrear = () => {
    setModalMode("crear");
    setForm({ nombre: "", precio: "", stock: "" });
    setEditId(null);
    setShowModal(true);
  };

  const openEditar = (producto) => {
    setModalMode("editar");
    setForm({
      nombre: producto.nombre,
      precio: String(producto.precio),
      stock: String(producto.stock),
    });
    setEditId(producto.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ nombre: "", precio: "", stock: "" });
    setEditId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.precio || !form.stock) {
      addToast("Completa todos los campos", "error");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      precio: Number(form.precio),
      stock: Number(form.stock),
    };

    try {
      if (modalMode === "crear") {
        await API.post("/productos", payload);
        addToast("Producto creado exitosamente");
      } else {
        await API.put(`/productos/${editId}`, payload);
        addToast("Producto actualizado exitosamente");
      }
      closeModal();
      await Promise.all([cargarProductos(), cargarStockBajo()]);
    } catch (e) {
      console.error("Error guardando producto", e);
      addToast("Error al guardar producto", "error");
    }
  };

  // ─── Delete ───
  const confirmDelete = (producto) => {
    setDeleteTarget(producto);
    setShowConfirm(true);
  };

  const executeDelete = async () => {
    try {
      await API.delete(`/productos/${deleteTarget.id}`);
      addToast("Producto eliminado");
      setShowConfirm(false);
      setDeleteTarget(null);
      await Promise.all([cargarProductos(), cargarStockBajo()]);
    } catch (e) {
      console.error("Error eliminando", e);
      addToast("Error al eliminar producto", "error");
    }
  };

  // ─── Search filter ───
  const productosFiltrados = productos.filter((p) =>
    p.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Stock badge ───
  const getStockBadge = (stock) => {
    if (stock === 0) return <span className="badge badge-danger">⚠ Sin stock</span>;
    if (stock <= 5) return <span className="badge badge-warning">⚡ Bajo</span>;
    return <span className="badge badge-success">✓ OK</span>;
  };

  // ─── Stats ───
  const totalProductos = productos.length;
  const sinStock = productos.filter((p) => p.stock === 0).length;
  const valorInventario = productos.reduce((acc, p) => acc + p.precio * p.stock, 0);

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <h1>📦 Productos</h1>
        <p>Gestiona tu inventario de productos</p>
      </div>

      {/* Stock Bajo Alert */}
      {stockBajo.length > 0 && (
        <div className={`alert-banner ${sinStock > 0 ? "danger" : "warning"}`}>
          <div className="alert-banner-icon">
            {sinStock > 0 ? "🚨" : "⚠️"}
          </div>
          <div className="alert-banner-content">
            <h4>
              {sinStock > 0
                ? `¡Atención! ${sinStock} producto(s) sin stock`
                : `${stockBajo.length} producto(s) con stock bajo`}
            </h4>
            <p>Estos productos necesitan ser reabastecidos</p>
            <div className="alert-items">
              {stockBajo.map((p) => (
                <span key={p.id} className="alert-item-chip">
                  {p.nombre} — {p.stock} uds
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Productos</span>
            <div className="stat-card-icon purple">📦</div>
          </div>
          <div className="stat-card-value">{totalProductos}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Valor Inventario</span>
            <div className="stat-card-icon green">💵</div>
          </div>
          <div className="stat-card-value">
            ${valorInventario.toLocaleString()}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Stock Bajo</span>
            <div className="stat-card-icon yellow">⚡</div>
          </div>
          <div className="stat-card-value">{stockBajo.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Sin Stock</span>
            <div className="stat-card-icon red">🚫</div>
          </div>
          <div className="stat-card-value">{sinStock}</div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header">
          <h3>Lista de Productos</h3>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div className="search-wrapper">
              <input
                type="text"
                className="search-input"
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" onClick={openCrear}>
              <span>＋</span> Nuevo Producto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : productosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>
              {search ? "Sin resultados" : "No hay productos"}
            </h3>
            <p>
              {search
                ? `No se encontraron productos para "${search}"`
                : "Comienza agregando tu primer producto"}
            </p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td style={{ color: "var(--text-muted)" }}>#{p.id}</td>
                    <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {p.nombre}
                    </td>
                    <td>${p.precio?.toLocaleString()}</td>
                    <td>{p.stock}</td>
                    <td>{getStockBadge(p.stock)}</td>
                    <td>
                      <div className="actions-cell" style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-icon btn-secondary"
                          title="Editar"
                          onClick={() => openEditar(p)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon btn-danger"
                          title="Eliminar"
                          onClick={() => confirmDelete(p)}
                        >
                          🗑
                        </button>
                        {/* Agregar al carrito */}
                        <input
                          type="number"
                          min={1}
                          max={p.stock}
                          value={cantidadAgregar[p.id] || 1}
                          onChange={e => {
                            let val = parseInt(e.target.value, 10);
                            if (isNaN(val) || val < 1) val = 1;
                            if (val > p.stock) val = p.stock;
                            setCantidadAgregar(c => ({ ...c, [p.id]: val }));
                          }}
                          style={{ width: 50, marginRight: 4 }}
                          disabled={p.stock === 0}
                        />
                        <button
                          className="btn btn-success"
                          style={{ fontSize: 14, padding: '2px 8px' }}
                          disabled={p.stock === 0}
                          onClick={() => {
                            agregarAlCarrito(p.id, cantidadAgregar[p.id] || 1);
                            setCantidadAgregar(c => ({ ...c, [p.id]: 1 }));
                            addToast(`Añadido: ${p.nombre}`, "success");
                          }}
                        >
                          ➕ Agregar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === "crear"
                  ? "➕ Nuevo Producto"
                  : "✏️ Editar Producto"}
              </h3>
              <button className="modal-close" onClick={closeModal}>
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del producto</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Coca Cola"
                    value={form.nombre}
                    onChange={(e) =>
                      setForm({ ...form, nombre: e.target.value })
                    }
                    autoFocus
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Precio</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="1000"
                      value={form.precio}
                      onChange={(e) =>
                        setForm({ ...form, precio: e.target.value })
                      }
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="10"
                      value={form.stock}
                      onChange={(e) =>
                        setForm({ ...form, stock: e.target.value })
                      }
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {modalMode === "crear" ? "Crear Producto" : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowConfirm(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-body">
              <div className="confirm-dialog">
                <div className="confirm-dialog-icon">🗑</div>
                <h4>¿Eliminar producto?</h4>
                <p>
                  Estás a punto de eliminar <strong>{deleteTarget?.nombre}</strong>.
                  <br />
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
              >
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={executeDelete}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" && "✅ "}
            {t.type === "error" && "❌ "}
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Productos;

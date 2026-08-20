import { useEffect, useState } from "react";
import {
  getHistorialCompleto,
  getHistorialPorFecha,
  getHistorialPorRango,
  descargarCSVCompleto,
  descargarCSVPorRango,
} from "../services/api";


function Historial() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [descargando, setDescargando] = useState(false);

  const filtrarPorFecha = async () => {
    if (!fecha) return;
    setLoading(true);
    try {
      const res = await getHistorialPorFecha(fecha);
      setVentas(res.data);
    } catch {
      setVentas([]);
    }
    setLoading(false);
  };

  const cargarHistorial = async () => {
    setLoading(true);
    try {
      const res = await getHistorialCompleto();
      setVentas(res.data);
    } catch {
      setVentas([]);
    }
    setLoading(false);
  };

  const filtrarPorRango = async () => {
    if (!fechaInicio || !fechaFin) return;
    setLoading(true);
    try {
      const res = await getHistorialPorRango(fechaInicio, fechaFin);
      setVentas(res.data);
    } catch (e) {
      console.error("Error filtrando por rango", e);
    }
    setLoading(false);
  };

  const descargarCSV = async () => {
    setDescargando(true);
    try {
      const res = await descargarCSVCompleto();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "historial-ventas.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDescargando(false);
    }
  };

  const descargarCSVFiltrado = async () => {
    if (!fechaInicio || !fechaFin) return;
    setDescargando(true);
    try {
      const res = await descargarCSVPorRango(fechaInicio, fechaFin);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "historial-ventas-filtrado.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setDescargando(false);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>📋 Historial de Ventas</h1>
        <p>Registro completo de todas las ventas realizadas</p>
      </div>

      {/* Stats */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Registros</span>
            <div className="stat-card-icon purple">📋</div>
          </div>
          <div className="stat-card-value">{ventas.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Ingreso Total</span>
            <div className="stat-card-icon green">💰</div>
          </div>
          <div className="stat-card-value">
            ${ventas.reduce((sum, v) => sum + (v.total || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>


      {/* Filtros y exportación */}
      <div className="table-container">
        <div className="table-header" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <h3>Todas las Ventas</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button className="btn btn-secondary" onClick={cargarHistorial} disabled={loading}>
              Ver Todo
            </button>
            <input
              type="date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{ padding: 4 }}
            />
            <button className="btn btn-primary" onClick={filtrarPorFecha} disabled={!fecha || loading}>
              Filtrar por Fecha
            </button>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              style={{ padding: 4 }}
            />
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              style={{ padding: 4 }}
            />
            <button className="btn btn-primary" onClick={filtrarPorRango} disabled={!fechaInicio || !fechaFin || loading}>
              Filtrar por Rango
            </button>
            <button className="btn btn-success" onClick={descargarCSV} disabled={descargando}>
              Descargar CSV Completo
            </button>
            <button className="btn btn-success" onClick={descargarCSVFiltrado} disabled={!fechaInicio || !fechaFin || descargando}>
              Descargar CSV Filtrado
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : ventas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>Sin registros</h3>
            <p>Aún no se han realizado ventas</p>
          </div>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {ventas.map((v) => {
                  const detalles = v.detalles || [];
                  return (
                    <tr key={v.id}>
                      <td style={{ color: "var(--text-muted)" }}>#{v.id}</td>
                      <td style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {detalles.length > 0
                          ? detalles.map((detalle) => (
                            <div key={detalle.id}>
                              {detalle.producto?.nombre || "Producto desconocido"}
                            </div>
                          ))
                          : "Sin detalles"}
                      </td>
                      <td>
                        {detalles.map((detalle) => (
                          <div key={detalle.id}>{detalle.cantidad}</div>
                        ))}
                      </td>
                      <td style={{ color: "var(--success)", fontWeight: 600 }}>
                        ${v.total?.toLocaleString()}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {v.fecha
                          ? new Date(v.fecha).toLocaleString("es-CL")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Historial;

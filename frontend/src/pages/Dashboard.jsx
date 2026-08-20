import { useEffect, useState } from "react";
import API from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      style={{
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <p style={{ color: "var(--text-primary)", fontSize: 13, fontWeight: 600, margin: 0 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: "var(--accent)", fontSize: 12, margin: "4px 0 0" }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

function Dashboard() {
  const [ventasDia, setVentasDia] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [metricas, setMetricas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const metricasRequest = API.get("/ventas/dashboard")
      .then((res) => res.data)
      .catch((e) => {
        console.error("Error metricas", e);
        return null;
      });
    const ventasDiaRequest = API.get("/ventas/ventas-por-dia")
      .then((res) => res.data)
      .catch((e) => {
        console.error("Error ventas dia", e);
        return [];
      });
    const topProductosRequest = API.get("/ventas/top-productos")
      .then((res) => res.data)
      .catch((e) => {
        console.error("Error top productos", e);
        return [];
      });

    Promise.all([metricasRequest, ventasDiaRequest, topProductosRequest]).then(
      ([metricasData, ventasDiaData, topProductosData]) => {
        if (metricasData) setMetricas(metricasData);
        setVentasDia(ventasDiaData);
        setTopProductos(topProductosData);
        setLoading(false);
      }
    );
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1>📊 Dashboard</h1>
          <p>Resumen general de ventas</p>
        </div>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>📊 Dashboard</h1>
        <p>Resumen general de ventas y métricas</p>
      </div>

      {/* Stat Cards */}
      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Total Ventas</span>
            <div className="stat-card-icon green">💰</div>
          </div>
          <div className="stat-card-value">
            ${metricas?.totalVentas?.toLocaleString() ?? 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Cantidad Ventas</span>
            <div className="stat-card-icon purple">🛒</div>
          </div>
          <div className="stat-card-value">
            {metricas?.cantidadVentas ?? 0}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-card-label">Promedio Venta</span>
            <div className="stat-card-icon blue">📈</div>
          </div>
          <div className="stat-card-value">
            ${metricas?.promedioVenta?.toLocaleString() ?? 0}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>📅 Ventas por Día</h3>
          {ventasDia.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={ventasDia}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c5cfc" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c5cfc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="fecha"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--border)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#7c5cfc"
                  strokeWidth={2}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>Sin datos de ventas por día</p>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h3>🏆 Top Productos</h3>
          {topProductos.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProductos} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="nombre"
                  type="category"
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="totalVendido"
                  fill="#7c5cfc"
                  radius={[0, 6, 6, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state">
              <p>Sin datos de productos</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

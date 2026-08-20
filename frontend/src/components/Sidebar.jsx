import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../services/api";

function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stockBajoCount, setStockBajoCount] = useState(0);
  useEffect(() => {
    const fetchStockBajo = async () => {
      try {
        const res = await API.get("/productos/stock-bajo?limite=5");
        setStockBajoCount(res.data.length);
      } catch (e) {
        console.error("Error fetching stock bajo count", e);
      }
    };
    fetchStockBajo();
    const interval = setInterval(fetchStockBajo, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      section: "Principal",
      links: [
        { to: "/", icon: "📊", label: "Dashboard" },
      ],
    },
    {
      section: "Inventario",
      links: [
        { to: "/productos", icon: "📦", label: "Productos", badge: stockBajoCount > 0 ? stockBajoCount : null },
      ],
    },
    {
      section: "Ventas",
      links: [
        { to: "/ventas", icon: "🛒", label: "Punto de Venta" },
        { to: "/historial", icon: "📋", label: "Historial" },
      ],
    },
  ];

  return (
    <>
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle sidebar"
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div>
            <h1>Johan Ventas</h1>
            <span>Panel de control</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="sidebar-link-icon">{link.icon}</span>
                  {link.label}
                  {link.badge && (
                    <span className="sidebar-link-badge">{link.badge}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;

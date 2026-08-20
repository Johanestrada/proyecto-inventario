import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import PuntoVenta from "./pages/PuntoVenta";
import Historial from "./pages/Historial";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<PuntoVenta />} />
          <Route path="/historial" element={<Historial />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

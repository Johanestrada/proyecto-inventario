import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Ventas from "./pages/Ventas";
import Historial from "./pages/Historial";
import CarritoPage from "./pages/Carrito";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/historial" element={<Historial />} />
          <Route path="/carrito" element={<CarritoPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

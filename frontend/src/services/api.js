import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});

// Crear venta (carrito)
export const realizarVenta = (detalles) => API.post("/ventas", { detalles }).then((res) => res.data);

// Obtener productos
export const obtenerProductos = () => API.get("/productos").then((res) => res.data);

// Métodos para endpoints de historial y exportación
export const getHistorialCompleto = () => API.get("/ventas/historial");
export const getHistorialPorFecha = (fecha) => API.get(`/ventas/historial/por-fecha?fecha=${fecha}`);
export const getHistorialPorRango = (fechaInicio, fechaFin) =>
  API.get(`/ventas/historial/por-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
export const descargarCSVCompleto = () => API.get("/ventas/exportar/csv", { responseType: "blob" });
export const descargarCSVPorRango = (fechaInicio, fechaFin) =>
  API.get(`/ventas/exportar/csv/por-rango?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`, {
    responseType: "blob",
  });

export default API;

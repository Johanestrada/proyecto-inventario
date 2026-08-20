# Inventario App

Sistema de gestión de inventario y ventas con **Spring Boot** y **React**. Arquitectura moderna, API RESTful y lista para producción con Docker Compose.

## ¿Qué es?

Un sistema completo para:
- **Gestión de productos** (CRUD)
- **Control de stock** y alertas
- **Registro de ventas**
- **Historial y reportes**

Ideal para pequeñas y medianas empresas que necesitan controlar su inventario y ventas de forma eficiente.

## Stack Tecnológico

- **Java 17+** — Backend
- **Spring Boot 3.x** — API REST
- **React + Vite** — Frontend
- **Axios** — Cliente HTTP
- **Maven** — Build backend
- **Docker & Docker Compose** — Contenedores
- **H2 Database** (por defecto, adaptable a MySQL u otra)

## Características Principales

✅ Gestión de productos (alta, baja, modificación, consulta)
✅ Control de stock y alertas de bajo inventario
✅ Registro y gestión de ventas
✅ Historial de ventas con filtros y exportación CSV
✅ Interfaz web moderna y responsiva
✅ API RESTful centralizada
✅ Configuración lista para Docker

## Arquitectura del Sistema

- **Frontend (React):** Interfaz de usuario que consume la API REST del backend. Todas las llamadas usan una baseURL configurable por variable de entorno.
- **Backend (Spring Boot):** Expone endpoints REST para productos, ventas e historial. Gestiona la lógica de negocio y el acceso a la base de datos.
- **Base de Datos:** Persistencia de productos, ventas y detalles de ventas. Por defecto H2, fácilmente adaptable a MySQL.
- **Docker Compose:** Orquesta los servicios frontend y backend para facilitar el despliegue y desarrollo local.

**Flujo general:**
1. El usuario interactúa con la web (React)
2. El frontend realiza peticiones HTTP al backend
3. El backend procesa la lógica y accede a la base de datos
4. Las respuestas se devuelven al frontend para visualización o interacción

## Endpoints Principales

### Productos
```
GET    /productos                      → Listar productos
GET    /productos/stock-bajo?limite=5  → Productos con stock bajo
POST   /productos                      → Crear producto
PUT    /productos/{id}                 → Actualizar producto
DELETE /productos/{id}                 → Eliminar producto
```

### Ventas
```
POST   /ventas                         → Registrar nueva venta
```

### Historial de Ventas
```
GET    /ventas/historial                       → Listar historial completo
GET    /ventas/historial/por-fecha?fecha=YYYY-MM-DD
GET    /ventas/historial/por-rango?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
GET    /ventas/exportar/csv                    → Exportar historial completo a CSV
GET    /ventas/exportar/csv/por-rango?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
```

## Instalación y Uso

### Requisitos
- Docker y Docker Compose

### Iniciar con Docker Compose
```bash
docker-compose up --build
```
Esto levantará backend y frontend en contenedores separados. El frontend se conecta automáticamente al backend usando la variable de entorno configurada.

### Ejecución manual (desarrollo)

1. **Backend**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   El backend estará en http://localhost:8080

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   El frontend estará en http://localhost:5173 (o el puerto configurado por Vite).

### Aplicación local integrada (sin Docker ni Vite)

El empaquetado Maven compila React/Vite automáticamente e incluye el resultado dentro del JAR de Spring Boot. No copies `frontend/dist` manualmente y no ejecutes Vite para este modo.

Requisitos en Windows:

- Java 17 o superior (se recomienda configurar `JAVA_HOME` al JDK que usarás).
- Node.js y npm instalados.
- MySQL ejecutándose localmente; este modo conserva MySQL, no usa SQLite.

Desde PowerShell, en la raíz del proyecto:

```powershell
cd backend
.\mvnw.cmd package
```

Configura la conexión a tu MySQL local y ejecuta el JAR. Los valores de ejemplo coinciden con la configuración actual:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "ecommerce_db"
$env:DB_USER = "admin"
$env:DB_PASSWORD = "admin123"
java -jar .\target\inventario-0.0.1-SNAPSHOT.jar
```

Abre http://localhost:8080. Las rutas `/`, `/productos`, `/ventas` y `/historial` cargan la aplicación React directamente desde Spring Boot. Las solicitudes de API siguen usando las mismas rutas y devuelven JSON; CORS permanece disponible para Vite durante el desarrollo.

## Variables de Entorno

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8080
```

### Backend
- Configuración de base de datos y otros parámetros en `backend/src/main/resources/application.properties`

## Estructura del Proyecto

```
Proyecto-inventario/
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   └── src/
│       └── main/
│           ├── java/com/inventario/inventario/
│           │   ├── controller/      # Controladores REST
│           │   ├── service/         # Lógica de negocio
│           │   ├── repository/      # Acceso a datos
│           │   ├── dto/             # Objetos de transferencia
│           │   └── config/          # Configuración (CORS, etc)
│           └── resources/
│               └── application.properties
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── pages/        # Vistas principales (Productos, Ventas, etc)
│       ├── components/   # Componentes reutilizables
│       ├── services/     # Lógica de conexión API (Axios)
│       └── hooks/        # Custom hooks
│
├── docker-compose.yml
└── README.md
```

## Próximas Mejoras

- [ ] Integración con bases de datos externas (MySQL, PostgreSQL)
- [ ] Autenticación y control de usuarios
- [ ] Reportes avanzados y dashboards
- [ ] Notificaciones automáticas de stock bajo
- [ ] Pruebas unitarias y de integración
- [ ] Despliegue en la nube (AWS, Azure, GCP)
- [ ] Internacionalización (i18n)

---

## Contacto

johan.manuel.estrada.plaza@gmail.com

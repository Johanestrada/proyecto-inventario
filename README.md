# Inventario App

Sistema local de inventario y ventas construido con Spring Boot y React. Puede ejecutarse en desarrollo con Docker, como un JAR único o como una aplicación Windows con su propio runtime de Java.

## Funcionalidades

- Gestión de productos, precios y stock.
- Punto de venta con carrito y control de stock.
- Historial de ventas, filtros y exportación CSV.
- Validación de ventas, incluido control ante stock insuficiente.

## Arquitectura

- `frontend/`: React + Vite.
- `backend/`: Spring Boot, API REST y persistencia.
- Durante `mvnw.cmd package`, Vite compila el frontend y Maven lo incorpora al JAR como recursos estáticos. Spring Boot sirve la interfaz y las rutas SPA (`/`, `/productos`, `/ventas` e `/historial`).
- En escritorio, Tauri abre una ventana nativa que carga `http://127.0.0.1:8090/`. Spring Boot sirve desde el JAR los archivos React compilados; Tauri no carga `frontend/dist` directamente.
- Los endpoints REST mantienen las mismas rutas y responden JSON cuando se solicitan como API.

Documentación técnica:

- [Arquitectura](docs/ARCHITECTURE.md)
- [Aplicación de escritorio](docs/DESKTOP.md)
- [Releases](docs/RELEASE.md)

## Persistencia por modo de ejecución

| Modo | Base de datos | Uso |
| --- | --- | --- |
| Docker / perfil predeterminado | MySQL | Desarrollo con contenedores o ejecución del JAR conectada a MySQL. |
| Perfil `cliente` / ejecutable Windows | SQLite | Uso local autónomo. El archivo se guarda en `%LOCALAPPDATA%\Inventario\data\inventario.db`. |
| Pruebas | H2 en memoria | Sólo para pruebas automatizadas. |

La base SQLite es local a cada usuario de Windows. Para respaldar los datos de la aplicación de escritorio, copia el archivo `inventario.db` con la aplicación cerrada.

## Requisitos para desarrollo

- Java 17 o superior.
- Node.js con npm.
- MySQL y Docker Desktop sólo si usarás el modo Docker/MySQL.

## Ejecutar con Docker (MySQL)

Crea `.env` en la raíz, con los valores que usará Docker Compose:

```env
MYSQL_ROOT_PASSWORD=una_clave_segura
MYSQL_DATABASE=ecommerce_db
MYSQL_USER=admin
MYSQL_PASSWORD=admin123
```

Luego ejecuta:

```powershell
docker compose up --build
```

## Desarrollo separado

En una terminal:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

En otra:

```powershell
cd frontend
npm install
npm run dev
```

Vite queda disponible normalmente en `http://localhost:5173`; CORS ya está permitido para este flujo de desarrollo.

## JAR integrado (sin Docker ni Vite)

El siguiente comando compila React/Vite, ejecuta las pruebas y genera un JAR que contiene tanto Spring Boot como la interfaz web:

```powershell
cd backend
.\mvnw.cmd package
```

El artefacto resultante es:

```text
backend\target\inventario-0.0.1-SNAPSHOT.jar
```

Para usar este JAR con MySQL local:

```powershell
$env:DB_HOST = "localhost"
$env:DB_PORT = "3306"
$env:DB_NAME = "ecommerce_db"
$env:DB_USER = "admin"
$env:DB_PASSWORD = "admin123"

java -jar .\target\inventario-0.0.1-SNAPSHOT.jar
```

Abre `http://localhost:8080`. No necesitas ejecutar Vite en este modo.

## Aplicación Windows local

La aplicación instalada se ejecuta desde el acceso directo de Inventario. En
desarrollo y empaquetado, consulta [DESKTOP.md](docs/DESKTOP.md). La primera
ejecución crea una base SQLite local vacía en
`%LOCALAPPDATA%\Inventario\data\inventario.db`.

## Endpoints REST principales

```text
GET    /productos
GET    /productos/stock-bajo?limite=5
POST   /productos
PUT    /productos/{id}
DELETE /productos/{id}

POST   /ventas
GET    /ventas/historial
GET    /ventas/historial/por-fecha?fecha=YYYY-MM-DD
GET    /ventas/historial/por-rango?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
GET    /ventas/exportar/csv
GET    /ventas/exportar/csv/por-rango?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
```

## Pruebas

Desde `backend`:

```powershell
.\mvnw.cmd test
```

Las pruebas usan H2 en memoria e incluyen casos de ventas concurrentes y productos duplicados dentro de una venta.

## Commit y publicación de Windows

Los binarios, app-images, bases SQLite, `target` y `node_modules` están
excluidos por `.gitignore`. Consulta [RELEASE.md](docs/RELEASE.md) para revisar
el staging, crear commits y publicar el instalador en GitHub Releases.

## Estructura relevante

```text
frontend/       React + Vite
backend/        Spring Boot, API REST y persistencia
desktop/        Tauri y ventana nativa Windows
docs/           Arquitectura, escritorio y releases
```

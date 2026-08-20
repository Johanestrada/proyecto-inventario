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
- Los endpoints REST mantienen las mismas rutas y responden JSON cuando se solicitan como API.

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

La distribución recomendada es:

```text
app-image\Inventario\Inventario.exe
```

Ejecuta `Inventario.exe` directamente. Incluye un runtime de Java, activa automáticamente el perfil `cliente`, usa SQLite y atiende la aplicación en `http://localhost:8090`.

La primera ejecución crea la base local en:

```text
%LOCALAPPDATA%\Inventario\data\inventario.db
```

La instalación no incluye una base SQLite ni datos iniciales. La base se crea
vacía al arrancar por primera vez y sólo contiene las tablas necesarias.

No muevas el ejecutable por separado: debe conservarse toda la carpeta `app-image\Inventario`, incluidos `app`, `runtime` y `Inventario.exe`.

`backend\Inventario` es una salida auxiliar de empaquetado. Para compartir o ejecutar la versión de escritorio, utiliza `app-image\Inventario`.

## Construir la imagen Windows

El proyecto deja preparados los artefactos necesarios para `jpackage` dentro de `backend\target\jpackage` al ejecutar `mvnw.cmd package`: un JAR plano y las dependencias de runtime. La imagen resultante debe incluir ese JAR, la carpeta `lib` y el runtime Java; no se genera automáticamente por Maven.

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
excluidos por `.gitignore`. Antes de crear un commit revisa únicamente los
archivos fuente y de configuración:

```powershell
git status --short --ignored
git diff --check
git add .gitignore README.md backend frontend desktop .github
git diff --cached --stat
git commit -m "Integra aplicacion de escritorio Tauri"
git push origin main
```

Para publicar el instalador en GitHub sin subirlo al repositorio, crea un tag:

```powershell
git tag v0.1.0
git push origin v0.1.0
```

El workflow `.github/workflows/release-windows.yml` construye todo desde cero
y adjunta `Inventario_0.1.0_x64-setup.exe` a la Release de GitHub. El instalador
no se versiona como archivo del repositorio.

## Estructura relevante

```text
proyecto-inventario/
├── frontend/                 # React + Vite
├── backend/                  # Spring Boot, perfiles MySQL/cliente y Maven
│   ├── src/main/resources/
│   │   ├── application.properties           # MySQL
│   │   └── application-cliente.properties   # SQLite local
│   └── target/               # JAR y artefactos de build (no versionados)
├── app-image/Inventario/     # Distribución Windows con Inventario.exe
├── docker-compose.yml
└── README.md
```

# Architecture

## Runtime layers

The project has three runtime layers:

```text
Tauri window
    |
    | http://127.0.0.1:8090/
    v
Spring Boot client process
    |
    | serves React static files from the packaged JAR
    v
SQLite at %LOCALAPPDATA%\Inventario\data\inventario.db
```

The React source is compiled into `frontend/dist` during the build. Maven copies that output into the Spring Boot JAR under `static/`. The desktop window does not load `frontend/dist` directly.

`desktop/src-tauri/tauri.conf.json` keeps `frontendDist` configured because Tauri requires a frontend distribution for its bundle process. Runtime navigation is created in `desktop/src-tauri/src/main.rs` and points to `http://127.0.0.1:8090/`.

## Backend modes

- Default profile: MySQL for Docker or standalone development.
- `cliente` profile: SQLite for the Windows desktop application.
- Test profile: H2 in memory.

## Desktop startup

1. Tauri checks whether port `8090` is occupied.
2. If it is free, Tauri starts the packaged `Inventario.exe` server.
3. Tauri passes a random instance token through `JAVA_TOOL_OPTIONS`.
4. Tauri waits for `/internal/desktop/health`.
5. The health response identifies the application, profile, and instance token.
6. Tauri creates the native window and loads Spring Boot.
7. A single-instance plugin focuses the existing window when needed.

The health reader handles Spring Boot HTTP chunked responses before parsing JSON.

## Shutdown

Tauri tracks the server process it started. On exit it terminates that process tree and verifies that port `8090` is released.

## Persistence

A new desktop installation does not contain a database. The client profile creates the SQLite file and schema on first startup. It does not insert products or sales automatically.

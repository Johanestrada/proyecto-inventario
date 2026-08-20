# Desktop application

## Prerequisites

- Windows.
- Java 17 or newer for local packaging.
- Node.js and npm.
- Rust, Cargo, and MSVC Build Tools for Tauri.
- WebView2 on the target Windows machine.

## Run in development

From the repository root:

```powershell
cd desktop
npm ci
npm run tauri -- dev
```

The native window loads the client server at `http://127.0.0.1:8090/`.

Do not run `app-image\Inventario\Inventario.exe` at the same time as the installed application. Both use port `8090`.

## Local packaging

Build the backend and prepare the Java app-image:

```powershell
cd backend
.\mvnw.cmd package
cd ..
Remove-Item .\app-image -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory .\app-image | Out-Null

jpackage `
  --type app-image `
  --name Inventario `
  --input backend\target\jpackage `
  --main-jar inventario-0.0.1-SNAPSHOT-plain.jar `
  --main-class com.inventario.inventario.InventarioApplication `
  --app-version 0.1.0 `
  --java-options "-Dspring.profiles.active=cliente" `
  --java-options "-Dserver.port=8090" `
  --dest app-image
```

Copy the Java app-image into Tauri resources:

```powershell
Remove-Item .\desktop\src-tauri\resources\server\Inventario -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item .\app-image\Inventario .\desktop\src-tauri\resources\server\Inventario -Recurse -Force
```

Build the installer:

```powershell
cd desktop
npm run tauri -- build
```

Output:

```text
desktop\src-tauri\target\release\bundle\nsis\Inventario_0.1.0_x64-setup.exe
```

## Fresh installation data

The installer does not include SQLite files. A first run creates:

```text
%LOCALAPPDATA%\Inventario\data\inventario.db
```

The new database contains only the required tables. Existing data remains local to the Windows user and is not removed by an update.

## Port conflict

If startup reports that port `8090` belongs to another process, inspect it before terminating anything:

```powershell
Get-NetTCPConnection -LocalPort 8090 -State Listen
```

If it is an old Inventario app-image process, close that application and start the installed application again.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{io::{Read, Write}, net::{SocketAddr, TcpStream}, path::{Path, PathBuf}, process::{Child, Command}, sync::Mutex, time::Duration};
use serde_json::Value;
use tauri::{AppHandle, Manager, RunEvent, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;
use uuid::Uuid;

const HOST: &str = "127.0.0.1";
const PORT: u16 = 8090;
const HEALTH_PATH: &str = "/internal/desktop/health";

struct StartedServer { child: Child, token: String }
#[derive(Default)] struct DesktopState { started_server: Mutex<Option<StartedServer>> }
struct Health { token: String }

fn socket_addr() -> SocketAddr { SocketAddr::from(([127, 0, 0, 1], PORT)) }
fn port_is_occupied() -> bool { TcpStream::connect_timeout(&socket_addr(), Duration::from_millis(300)).is_ok() }

fn decode_chunked_body(mut body: &[u8]) -> Result<Vec<u8>, String> {
    let mut decoded = Vec::new();
    loop {
        let line_end = body.windows(2).position(|window| window == b"\r\n").ok_or_else(|| "respuesta chunked inválida".to_owned())?;
        let size = usize::from_str_radix(
            std::str::from_utf8(&body[..line_end]).map_err(|_| "tamaño chunk inválido".to_owned())?.split(';').next().unwrap_or_default().trim(),
            16,
        ).map_err(|_| "tamaño chunk inválido".to_owned())?;
        body = &body[line_end + 2..];
        if size == 0 { return Ok(decoded); }
        if body.len() < size + 2 || &body[size..size + 2] != b"\r\n" { return Err("contenido chunked incompleto".to_owned()); }
        decoded.extend_from_slice(&body[..size]);
        body = &body[size + 2..];
    }
}

// Deliberately uses TcpStream instead of an HTTP client dependency.
fn health_check() -> Result<Health, String> {
    let mut stream = TcpStream::connect_timeout(&socket_addr(), Duration::from_millis(700)).map_err(|e| format!("no se pudo conectar a {HOST}:{PORT}: {e}"))?;
    stream.set_read_timeout(Some(Duration::from_secs(1))).map_err(|e| e.to_string())?;
    stream.set_write_timeout(Some(Duration::from_secs(1))).map_err(|e| e.to_string())?;
    stream.write_all(format!("GET {HEALTH_PATH} HTTP/1.1\r\nHost: {HOST}:{PORT}\r\nConnection: close\r\n\r\n").as_bytes()).map_err(|e| format!("no se pudo consultar health: {e}"))?;
    let mut response = Vec::new();
    stream.read_to_end(&mut response).map_err(|e| format!("no se pudo leer health: {e}"))?;
    let separator = response.windows(4).position(|window| window == b"\r\n\r\n").ok_or_else(|| "respuesta HTTP inválida en health".to_owned())?;
    let headers = String::from_utf8_lossy(&response[..separator]);
    if !headers.starts_with("HTTP/1.1 200") && !headers.starts_with("HTTP/1.0 200") { return Err("el proceso en 8090 no devolvió HTTP 200 para health".to_owned()); }
    let raw_body = &response[separator + 4..];
    let body = if headers.lines().any(|line| line.eq_ignore_ascii_case("transfer-encoding: chunked")) {
        decode_chunked_body(raw_body)?
    } else {
        raw_body.to_vec()
    };
    let json: Value = serde_json::from_slice(&body).map_err(|e| format!("health devolvió JSON inválido: {e}"))?;
    match (json.get("application").and_then(Value::as_str), json.get("profile").and_then(Value::as_str), json.get("instanceToken").and_then(Value::as_str).filter(|v| !v.is_empty())) {
        (Some("Inventario"), Some("cliente"), Some(token)) => Ok(Health { token: token.to_owned() }),
        _ => Err("el puerto 8090 pertenece a un proceso que no es Inventario cliente".to_owned()),
    }
}

fn server_executable(app: &AppHandle) -> Result<PathBuf, String> {
    let packaged = app.path().resource_dir().map_err(|e| e.to_string())?.join("server").join("Inventario").join("Inventario.exe");
    if packaged.is_file() { return Ok(packaged); }
    let development = Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("..").join("app-image").join("Inventario").join("Inventario.exe");
    if development.is_file() { return Ok(development); }
    Err("No se encontró el servidor cliente. Ejecute scripts/build-desktop.ps1.".to_owned())
}

fn start_owned_server(app: &AppHandle, token: &str) -> Result<(), String> {
    let child = Command::new(server_executable(app)?).env("JAVA_TOOL_OPTIONS", format!("-Ddesktop.instance-token={token}")).spawn().map_err(|e| format!("no se pudo iniciar Inventario: {e}"))?;
    *app.state::<DesktopState>().started_server.lock().map_err(|_| "no se pudo bloquear el estado del servidor".to_owned())? = Some(StartedServer { child, token: token.to_owned() });
    Ok(())
}

fn wait_for_owned_server(expected_token: &str) -> Result<(), String> {
    for _ in 0..120 {
        if let Ok(health) = health_check() { if health.token == expected_token { return Ok(()); } }
        std::thread::sleep(Duration::from_millis(500));
    }
    Err("Inventario no respondió correctamente en 60 segundos".to_owned())
}

fn prepare_server(app: &AppHandle) -> Result<(), String> {
    if port_is_occupied() { health_check().map(|_| ())? } else {
        let token = Uuid::new_v4().to_string();
        start_owned_server(app, &token)?;
        wait_for_owned_server(&token)?;
    }
    Ok(())
}

fn create_main_window(app: &AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") { window.show().map_err(|e| e.to_string())?; window.set_focus().map_err(|e| e.to_string())?; return Ok(()); }
    let url = format!("http://{HOST}:{PORT}/").parse().map_err(|e| format!("URL del servidor inválida: {e}"))?;
    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(url)).title("Inventario").inner_size(1280.0, 800.0).min_inner_size(1024.0, 640.0).build().map_err(|e| format!("no se pudo crear la ventana: {e}"))?;
    Ok(())
}

fn show_startup_error(app: &AppHandle, error: &str) { app.dialog().message(format!("No fue posible abrir Inventario.\n\n{error}")).title("Inventario").blocking_show(); }

fn shutdown_owned_server(app: &AppHandle) {
    let state = app.state::<DesktopState>();
    let Ok(mut guard) = state.started_server.lock() else { return; };
    let Some(server) = guard.as_mut() else { return; };
    // Child::try_wait proves the tracked PID has not exited and been reused.
    if matches!(server.child.try_wait(), Ok(None)) && health_check().map(|h| h.token == server.token).unwrap_or(false) {
        let _ = Command::new("taskkill").args(["/PID", &server.child.id().to_string(), "/T", "/F"]).status();
    }
    *guard = None;
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| { let _ = create_main_window(app); }))
        .manage(DesktopState::default())
        .setup(|app| {
            let handle = app.handle().clone();
            if let Err(error) = prepare_server(&handle).and_then(|_| create_main_window(&handle)) {
                shutdown_owned_server(&handle);
                show_startup_error(&handle, &error);
                return Err(Box::new(std::io::Error::other(error)));
            }
            Ok(())
        })
        .build(tauri::generate_context!()).expect("error al iniciar Inventario");
    app.run(|app, event| if matches!(event, RunEvent::ExitRequested { .. } | RunEvent::Exit) { shutdown_owned_server(app); });
}

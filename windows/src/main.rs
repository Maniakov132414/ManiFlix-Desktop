#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod proxy;
mod telemetry;

use std::sync::{mpsc, Arc, Mutex};
use std::time::Duration;

use tao::dpi::LogicalSize;
use tao::event::{Event, WindowEvent};
use tao::event_loop::{ControlFlow, EventLoopBuilder};
#[cfg(target_os = "linux")]
use tao::platform::unix::WindowExtUnix;
use tao::window::{Fullscreen, Window, WindowBuilder};
use wry::http::{header, Method, Request, Response, StatusCode};
use wry::WebViewBuilder;
#[cfg(target_os = "linux")]
use wry::WebViewBuilderExtUnix;
#[cfg(windows)]
use wry::WebViewBuilderExtWindows;

use crate::proxy::{json_response, proxy_api_request};
use crate::telemetry::{collect_hardware_sysinfo, WindowTelemetry};

const INDEX_HTML: &str = include_str!("../assets/index.html");
const STYLES_CSS: &str = include_str!("../assets/styles.css");
const APP_JS: &str = include_str!("../assets/app.js");
const HLS_JS: &str = include_str!("../assets/hls.min.js");
const ICON_RGBA_64: &[u8] = include_bytes!("../assets/icon_64x64.rgba");

#[cfg(windows)]
const APP_START_URL: &str = "http://maniflix.localhost/";
#[cfg(not(windows))]
const APP_START_URL: &str = "maniflix://localhost/";

#[derive(Debug)]
enum UserEvent {
    WindowOp(String, mpsc::Sender<WindowTelemetry>),
}

#[cfg(target_os = "windows")]
fn attach_parent_console_if_needed() {
    extern "system" {
        fn AttachConsole(dwProcessId: u32) -> i32;
    }
    const ATTACH_PARENT_PROCESS: u32 = 0xFFFFFFFF;
    unsafe {
        let _ = AttachConsole(ATTACH_PARENT_PROCESS);
    }
}

#[cfg(not(target_os = "windows"))]
fn attach_parent_console_if_needed() {}

fn should_start_fullscreen() -> bool {
    if std::env::args().any(|a| a == "--fullscreen" || a == "--steamdeck") {
        return true;
    }
    if std::env::var("SteamDeck")
        .map(|v| {
            let trimmed = v.trim();
            trimmed == "1" || trimmed.eq_ignore_ascii_case("true")
        })
        .unwrap_or(false)
    {
        return true;
    }
    if std::env::var_os("GAMESCOPE_WAYLAND_DISPLAY")
        .map(|v| !v.is_empty())
        .unwrap_or(false)
    {
        return true;
    }
    false
}

fn run_self_test_if_requested() -> Option<i32> {
    let args: Vec<String> = std::env::args().collect();
    let idx = args.iter().position(|a| a == "--self-test")?;

    attach_parent_console_if_needed();

    let out_path = args.get(idx + 1).filter(|s| !s.starts_with('-')).cloned();
    let info = collect_hardware_sysinfo(WindowTelemetry::default());
    let json = serde_json::to_string_pretty(&info).unwrap_or_else(|_| "{}".to_string());
    let output = format!("SELF_TEST_OK\n{}\n", json);

    if let Some(path) = out_path {
        if let Err(err) = std::fs::write(&path, &output) {
            eprintln!("SELF_TEST_ERROR: failed to write {}: {}", path, err);
            return Some(1);
        }
    }

    print!("{}", output);
    Some(0)
}

fn snapshot_window_telemetry(window: &Window) -> WindowTelemetry {
    let scale = window.scale_factor();
    let phys = window.inner_size();
    let logical = phys.to_logical::<f64>(scale);
    let width = logical.width.round().max(1.0) as u32;
    let height = logical.height.round().max(1.0) as u32;
    let maximized = window.is_maximized();
    let fullscreen = window.fullscreen().is_some();

    let (monitor_name, monitor_width, monitor_height, refresh_millihz) =
        if let Some(mon) = window.current_monitor() {
            let name = mon.name().unwrap_or_else(|| "Display".to_string());
            let msize = mon.size();
            let hz = mon
                .video_modes()
                .filter(|vm| vm.size() == msize)
                .map(|vm| vm.refresh_rate())
                .max()
                .or_else(|| mon.video_modes().map(|vm| vm.refresh_rate()).max())
                .unwrap_or(60);
            (name, msize.width, msize.height, (hz as u32) * 1000)
        } else {
            ("Primary Display".to_string(), 1920, 1080, 60000)
        };

    let layout_mode = if width > 700 || maximized || fullscreen {
        "desktop".to_string()
    } else {
        "phone".to_string()
    };

    WindowTelemetry {
        width,
        height,
        scale_factor: (scale * 100.0).round() / 100.0,
        fullscreen,
        maximized,
        layout_mode,
        monitor_name,
        monitor_width,
        monitor_height,
        refresh_rate_hz: (refresh_millihz as f64 / 1000.0 * 10.0).round() / 10.0,
        refresh_rate_millihertz: refresh_millihz,
    }
}

fn static_asset(content_type: &str, bytes: &'static [u8]) -> Response<Vec<u8>> {
    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(header::CACHE_CONTROL, "no-store")
        .body(bytes.to_vec())
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

fn parse_query_param(query: &str, key: &str) -> Option<String> {
    for pair in query.split('&') {
        let mut parts = pair.splitn(2, '=');
        if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
            if k == key {
                return Some(v.to_string());
            }
        }
    }
    None
}

fn percent_decode(input: &str) -> String {
    let bytes = input.as_bytes();
    let mut out = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(hex_str) = std::str::from_utf8(&bytes[i + 1..i + 3]) {
                if let Ok(val) = u8::from_str_radix(hex_str, 16) {
                    out.push(val);
                    i += 3;
                    continue;
                }
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

fn detect_pkg_format() -> &'static str {
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("APPIMAGE")
            .map(|v| !v.is_empty())
            .unwrap_or(false)
        {
            return "appimage";
        }
        if std::path::Path::new("/usr/lib/maniflix").exists()
            || std::path::Path::new("/var/lib/dpkg/info/maniflix.list").exists()
        {
            return "deb";
        }
        "binary"
    }
    #[cfg(windows)]
    {
        "exe"
    }
    #[cfg(target_os = "macos")]
    {
        "dmg"
    }
    #[cfg(not(any(target_os = "linux", windows, target_os = "macos")))]
    {
        "binary"
    }
}

fn is_allowlisted_external_url(url: &str) -> bool {
    if url.len() > 1024 {
        return false;
    }
    let allowed_prefix = url.starts_with("https://github.com/Maniakov132414/")
        || url.starts_with("https://phim.maniakov.bond/");
    if !allowed_prefix {
        return false;
    }
    !url.chars().any(|c| {
        c.is_control()
            || c.is_whitespace()
            || matches!(
                c,
                '"' | '\'' | '`' | '<' | '>' | '|' | '&' | ';' | '$' | '(' | ')' | '\\'
            )
    })
}

fn launch_external_url(url: &str) -> Result<(), String> {
    #[cfg(windows)]
    {
        std::process::Command::new("rundll32")
            .arg("url.dll,FileProtocolHandler")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(url)
            .spawn()
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
    #[cfg(not(any(windows, target_os = "linux", target_os = "macos")))]
    {
        let _ = url;
        Err("Unsupported OS".to_string())
    }
}

fn handle_custom_protocol(
    req: &Request<Vec<u8>>,
    shared_win: &Arc<Mutex<WindowTelemetry>>,
    proxy: &tao::event_loop::EventLoopProxy<UserEvent>,
) -> Response<Vec<u8>> {
    if req.method() == Method::OPTIONS {
        return Response::builder()
            .status(StatusCode::NO_CONTENT)
            .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
            .header(
                header::ACCESS_CONTROL_ALLOW_HEADERS,
                "Authorization, Content-Type, Accept, Range",
            )
            .header(
                header::ACCESS_CONTROL_ALLOW_METHODS,
                "GET, POST, PUT, DELETE, OPTIONS",
            )
            .body(Vec::new())
            .unwrap_or_else(|_| Response::new(Vec::new()));
    }

    let path = req.uri().path();
    let query = req.uri().query().unwrap_or("");

    if path.starts_with("/api/") {
        return proxy_api_request(req);
    }

    match path {
        "" | "/" | "/index.html" => static_asset("text/html; charset=utf-8", INDEX_HTML.as_bytes()),
        "/assets/styles.css" => static_asset("text/css; charset=utf-8", STYLES_CSS.as_bytes()),
        "/assets/app.js" => static_asset("application/javascript; charset=utf-8", APP_JS.as_bytes()),
        "/assets/hls.min.js" => {
            static_asset("application/javascript; charset=utf-8", HLS_JS.as_bytes())
        }
        "/__desktop/appinfo" => {
            let payload = serde_json::json!({
                "ok": true,
                "os": std::env::consts::OS,
                "arch": std::env::consts::ARCH,
                "pkgFormat": detect_pkg_format(),
                "version": env!("CARGO_PKG_VERSION"),
                "build": 202u32,
            });
            let body = serde_json::to_vec(&payload).unwrap_or_else(|_| b"{}".to_vec());
            json_response(StatusCode::OK, body)
        }
        "/__desktop/open-url" => {
            let raw_url = parse_query_param(query, "url").unwrap_or_default();
            let decoded = percent_decode(&raw_url).trim().to_string();
            if !is_allowlisted_external_url(&decoded) {
                return json_response(
                    StatusCode::BAD_REQUEST,
                    br#"{"ok":false,"error":"URL not allowlisted"}"#.to_vec(),
                );
            }
            match launch_external_url(&decoded) {
                Ok(()) => json_response(StatusCode::OK, br#"{"ok":true}"#.to_vec()),
                Err(_) => json_response(
                    StatusCode::INTERNAL_SERVER_ERROR,
                    br#"{"ok":false,"error":"Failed to open URL"}"#.to_vec(),
                ),
            }
        }
        "/__desktop/sysinfo" => {
            let win_snap = shared_win.lock().map(|g| g.clone()).unwrap_or_default();
            let info = collect_hardware_sysinfo(win_snap);
            let body = serde_json::to_vec(&info).unwrap_or_else(|_| b"{}".to_vec());
            json_response(StatusCode::OK, body)
        }
        "/__desktop/window" => {
            let op = parse_query_param(query, "op").unwrap_or_else(|| "status".to_string());
            if op == "status" {
                let win_snap = shared_win.lock().map(|g| g.clone()).unwrap_or_default();
                let body = serde_json::to_vec(&win_snap).unwrap_or_else(|_| b"{}".to_vec());
                return json_response(StatusCode::OK, body);
            }
            let (tx, rx) = mpsc::channel();
            if proxy.send_event(UserEvent::WindowOp(op, tx)).is_ok() {
                if let Ok(updated) = rx.recv_timeout(Duration::from_millis(500)) {
                    let body = serde_json::to_vec(&updated).unwrap_or_else(|_| b"{}".to_vec());
                    return json_response(StatusCode::OK, body);
                }
            }
            let win_snap = shared_win.lock().map(|g| g.clone()).unwrap_or_default();
            let body = serde_json::to_vec(&win_snap).unwrap_or_else(|_| b"{}".to_vec());
            json_response(StatusCode::OK, body)
        }
        _ => json_response(
            StatusCode::NOT_FOUND,
            br#"{"ok":false,"error":"Not found"}"#.to_vec(),
        ),
    }
}

fn main() {
    if let Some(code) = run_self_test_if_requested() {
        std::process::exit(code);
    }

    let start_fullscreen = should_start_fullscreen();
    let event_loop = EventLoopBuilder::<UserEvent>::with_user_event().build();
    let proxy = event_loop.create_proxy();

    let app_icon = tao::window::Icon::from_rgba(ICON_RGBA_64.to_vec(), 64, 64).ok();

    let mut win_builder = WindowBuilder::new()
        .with_title("ManiFlix")
        .with_inner_size(LogicalSize::new(1180.0, 760.0))
        .with_min_inner_size(LogicalSize::new(360.0, 640.0))
        .with_window_icon(app_icon);

    if start_fullscreen {
        win_builder = win_builder.with_fullscreen(Some(Fullscreen::Borderless(None)));
    }

    let window = win_builder
        .build(&event_loop)
        .expect("Failed to create ManiFlix window");

    let mut initial_tel = snapshot_window_telemetry(&window);
    if start_fullscreen && !initial_tel.fullscreen {
        initial_tel.fullscreen = true;
        initial_tel.layout_mode = "desktop".to_string();
    }
    let shared_win = Arc::new(Mutex::new(initial_tel));

    let shared_win_proto = Arc::clone(&shared_win);
    let proxy_proto = proxy.clone();

    let builder = WebViewBuilder::new()
        .with_asynchronous_custom_protocol("maniflix".into(), move |_webview_id, request, responder| {
            let shared_win_req = Arc::clone(&shared_win_proto);
            let proxy_req = proxy_proto.clone();
            std::thread::spawn(move || {
                let resp = handle_custom_protocol(&request, &shared_win_req, &proxy_req);
                responder.respond(resp);
            });
        })
        .with_url(APP_START_URL)
        .with_autoplay(true)
        .with_clipboard(true)
        .with_devtools(cfg!(debug_assertions));

    #[cfg(windows)]
    let builder = builder.with_additional_browser_args(
        "--disable-features=msWebOOUI,msPdfOOUI,msSmartScreenProtection --autoplay-policy=no-user-gesture-required --enable-gpu-rasterization --enable-zero-copy",
    );

    #[cfg(target_os = "linux")]
    let webview = {
        let vbox = window
            .default_vbox()
            .expect("Failed to acquire GTK default vbox from window");
        builder
            .build_gtk(vbox)
            .expect("Failed to create WebKitGTK WebView")
    };

    #[cfg(not(target_os = "linux"))]
    let webview = builder
        .build(&window)
        .expect("Failed to create WebView");

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::WindowEvent {
                event: WindowEvent::CloseRequested,
                ..
            } => {
                *control_flow = ControlFlow::Exit;
            }
            Event::WindowEvent {
                event:
                    WindowEvent::Resized(_)
                    | WindowEvent::Moved(_)
                    | WindowEvent::ScaleFactorChanged { .. },
                ..
            } => {
                let snap = snapshot_window_telemetry(&window);
                if let Ok(mut guard) = shared_win.lock() {
                    *guard = snap.clone();
                }
                if let Ok(json) = serde_json::to_string(&snap) {
                    let _ = webview.evaluate_script(&format!(
                        "window.__maniflixDesktopState && window.__maniflixDesktopState({});",
                        json
                    ));
                }
            }
            Event::UserEvent(UserEvent::WindowOp(op, reply)) => {
                match op.as_str() {
                    "phone" => {
                        window.set_fullscreen(None);
                        window.set_maximized(false);
                        window.set_inner_size(LogicalSize::new(410.0, 820.0));
                    }
                    "desktop" => {
                        window.set_fullscreen(None);
                        window.set_maximized(false);
                        window.set_inner_size(LogicalSize::new(1240.0, 800.0));
                    }
                    "fullscreen" => {
                        let next_fs = window.fullscreen().is_none();
                        if next_fs {
                            window.set_fullscreen(Some(Fullscreen::Borderless(None)));
                        } else {
                            window.set_fullscreen(None);
                        }
                    }
                    "unfullscreen" => {
                        window.set_fullscreen(None);
                    }
                    "maximize" => {
                        window.set_maximized(!window.is_maximized());
                    }
                    _ => {}
                }

                let snap = snapshot_window_telemetry(&window);
                if let Ok(mut guard) = shared_win.lock() {
                    *guard = snap.clone();
                }
                if let Ok(json) = serde_json::to_string(&snap) {
                    let _ = webview.evaluate_script(&format!(
                        "window.__maniflixDesktopState && window.__maniflixDesktopState({});",
                        json
                    ));
                }
                let _ = reply.send(snap);
            }
            _ => {}
        }
    });
}

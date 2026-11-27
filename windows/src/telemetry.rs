use serde::Serialize;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use sysinfo::{CpuRefreshKind, Disks, MemoryRefreshKind, Pid, ProcessesToUpdate, RefreshKind, System};

#[cfg(windows)]
const FALLBACK_DISK_MOUNT: &str = "C:\\";
#[cfg(not(windows))]
const FALLBACK_DISK_MOUNT: &str = "/";

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WindowTelemetry {
    pub width: u32,
    pub height: u32,
    pub scale_factor: f64,
    pub fullscreen: bool,
    pub maximized: bool,
    pub layout_mode: String,
    pub monitor_name: String,
    pub monitor_width: u32,
    pub monitor_height: u32,
    pub refresh_rate_hz: f64,
    pub refresh_rate_millihertz: u32,
}

impl Default for WindowTelemetry {
    fn default() -> Self {
        Self {
            width: 1180,
            height: 760,
            scale_factor: 1.0,
            fullscreen: false,
            maximized: false,
            layout_mode: "desktop".to_string(),
            monitor_name: "Primary Display".to_string(),
            monitor_width: 1920,
            monitor_height: 1080,
            refresh_rate_hz: 60.0,
            refresh_rate_millihertz: 60000,
        }
    }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct HardwareSysInfo {
    pub app_name: String,
    pub app_version: String,
    pub runtime: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub host_name: String,
    pub arch: String,
    pub cpu_brand: String,
    pub cpu_logical_cores: usize,
    pub cpu_physical_cores: usize,
    pub cpu_usage_pct: f32,
    pub total_ram_mb: u64,
    pub used_ram_mb: u64,
    pub free_ram_mb: u64,
    pub process_rss_mb: f64,
    pub disk_total_gb: f64,
    pub disk_free_gb: f64,
    pub disk_mount: String,
    pub window: WindowTelemetry,
}

struct SysCache {
    sys: System,
    disks: Disks,
    last_disk_refresh: Instant,
    os_name: String,
    os_version: String,
    kernel_version: String,
    host_name: String,
    cpu_brand: String,
    cpu_logical_cores: usize,
    cpu_physical_cores: usize,
    disk_total_gb: f64,
    disk_free_gb: f64,
    disk_mount: String,
}

static SYS_CACHE: OnceLock<Mutex<SysCache>> = OnceLock::new();

#[cfg(target_os = "linux")]
fn read_linux_pretty_os_name() -> Option<String> {
    for path in ["/etc/os-release", "/usr/lib/os-release"] {
        if let Ok(content) = std::fs::read_to_string(path) {
            let mut pretty_name: Option<String> = None;
            let mut fallback_name: Option<String> = None;
            for line in content.lines() {
                let line = line.trim();
                if let Some(val) = line.strip_prefix("PRETTY_NAME=") {
                    let clean = val.trim_matches('"').trim_matches('\'').trim();
                    if !clean.is_empty() {
                        pretty_name = Some(clean.to_string());
                        break;
                    }
                } else if let Some(val) = line.strip_prefix("NAME=") {
                    let clean = val.trim_matches('"').trim_matches('\'').trim();
                    if !clean.is_empty() {
                        fallback_name = Some(clean.to_string());
                    }
                }
            }
            if pretty_name.is_some() {
                return pretty_name;
            }
            if fallback_name.is_some() {
                return fallback_name;
            }
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn detect_linux_display_server() -> &'static str {
    let has_nonempty = |k: &str| std::env::var_os(k).map(|v| !v.is_empty()).unwrap_or(false);

    if has_nonempty("GAMESCOPE_WAYLAND_DISPLAY")
        || std::env::var("XDG_CURRENT_DESKTOP")
            .map(|v| v.to_ascii_lowercase().contains("gamescope"))
            .unwrap_or(false)
    {
        return "Gamescope";
    }
    if std::env::var("GDK_BACKEND")
        .map(|v| v.trim().eq_ignore_ascii_case("x11"))
        .unwrap_or(false)
    {
        return "X11";
    }
    if has_nonempty("WAYLAND_DISPLAY")
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v.trim().eq_ignore_ascii_case("wayland"))
            .unwrap_or(false)
    {
        return "Wayland";
    }
    if has_nonempty("DISPLAY")
        || std::env::var("XDG_SESSION_TYPE")
            .map(|v| v.trim().eq_ignore_ascii_case("x11"))
            .unwrap_or(false)
    {
        return "X11";
    }
    "Wayland/X11"
}

fn build_runtime_label() -> String {
    #[cfg(target_os = "linux")]
    {
        format!(
            "Rust (tao 0.30 + wry 0.47 + sysinfo 0.32 · {})",
            detect_linux_display_server()
        )
    }
    #[cfg(not(target_os = "linux"))]
    {
        "Rust (tao 0.30 + wry 0.47 + sysinfo 0.32)".to_string()
    }
}

fn detect_os_name_and_version() -> (String, String) {
    #[cfg(target_os = "linux")]
    {
        let os_name = read_linux_pretty_os_name()
            .or_else(System::name)
            .unwrap_or_else(|| "Linux".to_string());
        let raw_ver = System::os_version().unwrap_or_default();
        let os_version = if !raw_ver.is_empty() && os_name.contains(&raw_ver) {
            String::new()
        } else {
            raw_ver
        };
        (os_name, os_version)
    }
    #[cfg(not(target_os = "linux"))]
    {
        let os_name = System::name().unwrap_or_else(|| std::env::consts::OS.to_string());
        let os_version = System::os_version().unwrap_or_else(|| "Unknown".to_string());
        (os_name, os_version)
    }
}

fn format_disk_stats(disk: &sysinfo::Disk) -> (f64, f64, String) {
    let total = disk.total_space() as f64;
    let avail = disk.available_space() as f64;
    let total_gb = (total / 1_073_741_824.0 * 10.0).round() / 10.0;
    let free_gb = (avail / 1_073_741_824.0 * 10.0).round() / 10.0;
    let mount = disk.mount_point().to_string_lossy().to_string();
    (total_gb, free_gb, mount)
}

fn compute_primary_disk(disks: &Disks) -> (f64, f64, String) {
    #[cfg(target_os = "linux")]
    {
        use std::path::Path;

        let real_disks: Vec<&sysinfo::Disk> = disks
            .iter()
            .filter(|d| {
                if d.total_space() == 0 {
                    return false;
                }
                let dev = d.name().to_string_lossy();
                if dev.starts_with("/dev/loop") {
                    return false;
                }
                let mp = d.mount_point().to_string_lossy();
                !(mp.starts_with("/snap")
                    || mp.starts_with("/boot")
                    || mp.starts_with("/tmp/.mount_")
                    || mp.starts_with("/var/lib/docker")
                    || mp.starts_with("/var/lib/containers"))
            })
            .collect();

        let root_disk = real_disks
            .iter()
            .copied()
            .find(|d| d.mount_point() == Path::new("/"));
        let home_disk = real_disks
            .iter()
            .copied()
            .find(|d| d.mount_point() == Path::new("/home"));

        // On immutable distros like SteamOS, "/" is a small read-only rootfs while "/home" is user NVMe storage.
        let chosen = match (root_disk, home_disk) {
            (Some(r), Some(h))
                if (r.is_read_only() || r.total_space() < 16 * 1_073_741_824)
                    && h.total_space() > r.total_space() =>
            {
                Some(h)
            }
            (Some(r), _) => Some(r),
            (None, Some(h)) => Some(h),
            (None, None) => real_disks
                .into_iter()
                .max_by_key(|d| d.total_space())
                .or_else(|| disks.iter().max_by_key(|d| d.total_space())),
        };

        if let Some(best) = chosen {
            return format_disk_stats(best);
        }
        (0.0, 0.0, String::from(FALLBACK_DISK_MOUNT))
    }

    #[cfg(not(target_os = "linux"))]
    {
        if let Some(best) = disks.iter().max_by_key(|d| d.total_space()) {
            format_disk_stats(best)
        } else {
            (0.0, 0.0, String::from(FALLBACK_DISK_MOUNT))
        }
    }
}

fn init_sys_cache() -> Mutex<SysCache> {
    let mut sys = System::new_with_specifics(
        RefreshKind::new()
            .with_cpu(CpuRefreshKind::everything())
            .with_memory(MemoryRefreshKind::everything()),
    );
    sys.refresh_cpu_usage();
    sys.refresh_memory();

    let pid = Pid::from_u32(std::process::id());
    sys.refresh_processes(ProcessesToUpdate::Some(&[pid]), true);

    let cpu_brand = sys
        .cpus()
        .first()
        .map(|c| c.brand().trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| format!("{} CPU", std::env::consts::ARCH));
    let cpu_logical_cores = sys.cpus().len().max(1);
    let cpu_physical_cores = sys.physical_core_count().unwrap_or(cpu_logical_cores);

    let disks = Disks::new_with_refreshed_list();
    let (disk_total_gb, disk_free_gb, disk_mount) = compute_primary_disk(&disks);
    let (os_name, os_version) = detect_os_name_and_version();

    Mutex::new(SysCache {
        sys,
        disks,
        last_disk_refresh: Instant::now(),
        os_name,
        os_version,
        kernel_version: System::kernel_version().unwrap_or_default(),
        host_name: System::host_name().unwrap_or_else(|| "Desktop".to_string()),
        cpu_brand,
        cpu_logical_cores,
        cpu_physical_cores,
        disk_total_gb,
        disk_free_gb,
        disk_mount,
    })
}

pub fn collect_hardware_sysinfo(win: WindowTelemetry) -> HardwareSysInfo {
    let mutex = SYS_CACHE.get_or_init(init_sys_cache);
    let mut cache = mutex.lock().unwrap_or_else(|e| e.into_inner());

    cache.sys.refresh_cpu_usage();
    cache.sys.refresh_memory();

    let pid = Pid::from_u32(std::process::id());
    cache
        .sys
        .refresh_processes(ProcessesToUpdate::Some(&[pid]), true);

    if cache.last_disk_refresh.elapsed() >= Duration::from_secs(30) {
        cache.disks.refresh_list();
        cache.disks.refresh();
        let (total_gb, free_gb, mount) = compute_primary_disk(&cache.disks);
        cache.disk_total_gb = total_gb;
        cache.disk_free_gb = free_gb;
        cache.disk_mount = mount;
        cache.last_disk_refresh = Instant::now();
    }

    let cpu_usage_pct = cache.sys.global_cpu_usage();
    let total_ram_mb = cache.sys.total_memory() / (1024 * 1024);
    let used_ram_mb = cache.sys.used_memory() / (1024 * 1024);
    let free_ram_mb = cache.sys.available_memory() / (1024 * 1024);

    let process_rss_mb = cache
        .sys
        .process(pid)
        .map(|p| (p.memory() as f64) / (1024.0 * 1024.0))
        .unwrap_or(0.0);

    HardwareSysInfo {
        app_name: "ManiFlix Desktop".to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        runtime: build_runtime_label(),
        os_name: cache.os_name.clone(),
        os_version: cache.os_version.clone(),
        kernel_version: cache.kernel_version.clone(),
        host_name: cache.host_name.clone(),
        arch: std::env::consts::ARCH.to_string(),
        cpu_brand: cache.cpu_brand.clone(),
        cpu_logical_cores: cache.cpu_logical_cores,
        cpu_physical_cores: cache.cpu_physical_cores,
        cpu_usage_pct: (cpu_usage_pct * 10.0).round() / 10.0,
        total_ram_mb,
        used_ram_mb,
        free_ram_mb,
        process_rss_mb: (process_rss_mb * 10.0).round() / 10.0,
        disk_total_gb: cache.disk_total_gb,
        disk_free_gb: cache.disk_free_gb,
        disk_mount: cache.disk_mount.clone(),
        window: win,
    }
}

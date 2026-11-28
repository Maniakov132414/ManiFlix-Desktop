use std::collections::{HashMap, VecDeque};
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};
use wry::http::{header, Method, Request, Response, StatusCode};

const REMOTE_BASE: &str = "https://phim.maniakov.bond";
const DESKTOP_USER_AGENT: &str = "ManiFlixDesktop-Rust/2.0.2";
const MAX_CACHE_BYTES: usize = 48 * 1024 * 1024;
const MAX_ENTRY_BYTES: usize = 8 * 1024 * 1024;
const MAX_CACHE_ENTRIES: usize = 512;

static HTTP_AGENT: OnceLock<ureq::Agent> = OnceLock::new();
static RAM_CACHE: OnceLock<Mutex<ProxyRamCache>> = OnceLock::new();

#[derive(Clone)]
struct CachedProxyEntry {
    status: u16,
    content_type: String,
    cache_control: Option<String>,
    content_range: Option<String>,
    accept_ranges: Option<String>,
    body: Vec<u8>,
    expires_at: Instant,
}

#[derive(Default)]
struct ProxyRamCache {
    map: HashMap<String, CachedProxyEntry>,
    order: VecDeque<String>,
    total_bytes: usize,
}

impl ProxyRamCache {
    fn get(&mut self, key: &str) -> Option<CachedProxyEntry> {
        let now = Instant::now();
        if let Some(entry) = self.map.get(key) {
            if now < entry.expires_at {
                return Some(entry.clone());
            }
        } else {
            return None;
        }
        if let Some(removed) = self.map.remove(key) {
            self.total_bytes = self.total_bytes.saturating_sub(removed.body.len());
        }
        None
    }

    fn prune_expired(&mut self) {
        let now = Instant::now();
        let expired_keys: Vec<String> = self
            .map
            .iter()
            .filter(|(_, v)| now >= v.expires_at)
            .map(|(k, _)| k.clone())
            .collect();
        for k in expired_keys {
            if let Some(removed) = self.map.remove(&k) {
                self.total_bytes = self.total_bytes.saturating_sub(removed.body.len());
            }
        }
    }

    fn insert(&mut self, key: String, entry: CachedProxyEntry) {
        let incoming_len = entry.body.len();
        if incoming_len > MAX_ENTRY_BYTES {
            return;
        }
        if let Some(prev) = self.map.remove(&key) {
            self.total_bytes = self.total_bytes.saturating_sub(prev.body.len());
        }
        self.prune_expired();

        while (self.total_bytes + incoming_len > MAX_CACHE_BYTES || self.map.len() >= MAX_CACHE_ENTRIES)
            && !self.order.is_empty()
        {
            if let Some(old_key) = self.order.pop_front() {
                if let Some(removed) = self.map.remove(&old_key) {
                    self.total_bytes = self.total_bytes.saturating_sub(removed.body.len());
                }
            }
        }

        if self.total_bytes + incoming_len <= MAX_CACHE_BYTES {
            self.total_bytes += incoming_len;
            self.order.push_back(key.clone());
            self.map.insert(key, entry);
        }
    }
}

fn ram_cache() -> &'static Mutex<ProxyRamCache> {
    RAM_CACHE.get_or_init(|| Mutex::new(ProxyRamCache::default()))
}

fn cache_ttl_for_path(path: &str) -> Option<Duration> {
    if path.starts_with("/api/media-art/") {
        return Some(Duration::from_secs(1800));
    }
    if path == "/api/bootstrap/discover"
        || path.starts_with("/api/movies")
        || path.starts_with("/api/category")
        || path.starts_with("/api/the-loai")
        || path.starts_with("/api/search")
    {
        return Some(Duration::from_secs(60));
    }
    if path.starts_with("/api/movie/")
        || path.starts_with("/api/franchise")
        || path.starts_with("/api/ads/")
    {
        return Some(Duration::from_secs(90));
    }
    None
}

fn should_preserve_cache_control(path: &str) -> bool {
    path.starts_with("/api/media-art/") || path.ends_with(".ts") || path.ends_with(".vtt")
}

fn http_agent() -> &'static ureq::Agent {
    HTTP_AGENT.get_or_init(|| {
        ureq::AgentBuilder::new()
            .timeout_connect(Duration::from_secs(10))
            .timeout_read(Duration::from_secs(25))
            .timeout_write(Duration::from_secs(20))
            .max_idle_connections(32)
            .max_idle_connections_per_host(16)
            .build()
    })
}

pub fn proxy_api_request(req: &Request<Vec<u8>>) -> Response<Vec<u8>> {
    let uri = req.uri();
    let path = uri.path();
    let path_and_query = uri
        .path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");
    let is_get = req.method() == Method::GET;
    let has_auth = req.headers().contains_key(header::AUTHORIZATION);
    let has_range = req.headers().contains_key(header::RANGE);
    let cache_ttl = if is_get && !has_auth && !has_range {
        cache_ttl_for_path(path)
    } else {
        None
    };

    if cache_ttl.is_some() {
        if let Ok(mut guard) = ram_cache().lock() {
            if let Some(hit) = guard.get(path_and_query) {
                return build_http_response(
                    path,
                    cache_ttl.is_some(),
                    hit.status,
                    &hit.content_type,
                    hit.cache_control.as_deref(),
                    hit.content_range.as_deref(),
                    hit.accept_ranges.as_deref(),
                    hit.body,
                );
            }
        }
    }

    let target_url = format!("{}{}", REMOTE_BASE, path_and_query);
    let method = req.method().as_str();

    let agent = http_agent();

    let mut ureq_req = agent
        .request(method, &target_url)
        .set("User-Agent", DESKTOP_USER_AGENT);

    if !has_range {
        ureq_req = ureq_req.set("Accept-Encoding", "gzip");
    }

    if let Some(auth) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(val) = auth.to_str() {
            ureq_req = ureq_req.set("Authorization", val);
        }
    }
    if let Some(ct) = req.headers().get(header::CONTENT_TYPE) {
        if let Ok(val) = ct.to_str() {
            ureq_req = ureq_req.set("Content-Type", val);
        }
    }
    if let Some(accept) = req.headers().get(header::ACCEPT) {
        if let Ok(val) = accept.to_str() {
            ureq_req = ureq_req.set("Accept", val);
        }
    }
    if let Some(range) = req.headers().get(header::RANGE) {
        if let Ok(val) = range.to_str() {
            ureq_req = ureq_req.set("Range", val);
        }
    }
    if let Some(if_range) = req.headers().get(header::IF_RANGE) {
        if let Ok(val) = if_range.to_str() {
            ureq_req = ureq_req.set("If-Range", val);
        }
    }

    let body = req.body();
    let result = if method == "POST" || method == "PUT" || method == "PATCH" {
        ureq_req.send_bytes(body)
    } else {
        ureq_req.call()
    };

    match result {
        Ok(resp) => build_response_from_ureq(resp, path, path_and_query, cache_ttl),
        Err(ureq::Error::Status(_code, resp)) => {
            build_response_from_ureq(resp, path, path_and_query, None)
        }
        Err(_err) => json_response(
            StatusCode::BAD_GATEWAY,
            br#"{"ok":false,"error":"Gateway connection error"}"#.to_vec(),
        ),
    }
}

fn build_response_from_ureq(
    resp: ureq::Response,
    path: &str,
    cache_key: &str,
    cache_ttl: Option<Duration>,
) -> Response<Vec<u8>> {
    let status_u16 = resp.status();
    let content_type = resp
        .header("Content-Type")
        .unwrap_or("application/octet-stream")
        .to_string();
    let upstream_cache_control = resp.header("Cache-Control").map(|s| s.to_string());
    let content_range = resp.header("Content-Range").map(|s| s.to_string());
    let accept_ranges = resp.header("Accept-Ranges").map(|s| s.to_string());
    let cap_hint = resp
        .header("Content-Length")
        .and_then(|s| s.parse::<usize>().ok())
        .map(|n| n.min(16 * 1024 * 1024))
        .unwrap_or(0);

    let mut bytes = Vec::with_capacity(cap_hint);
    let mut reader = resp.into_reader();
    if std::io::Read::read_to_end(&mut reader, &mut bytes).is_err() {
        return json_response(
            StatusCode::BAD_GATEWAY,
            br#"{"ok":false,"error":"Failed reading upstream body"}"#.to_vec(),
        );
    }

    if let Some(ttl) = cache_ttl {
        if status_u16 == 200 && !bytes.is_empty() && bytes.len() <= MAX_ENTRY_BYTES {
            if let Ok(mut guard) = ram_cache().lock() {
                guard.insert(
                    cache_key.to_string(),
                    CachedProxyEntry {
                        status: status_u16,
                        content_type: content_type.clone(),
                        cache_control: upstream_cache_control.clone(),
                        content_range: content_range.clone(),
                        accept_ranges: accept_ranges.clone(),
                        body: bytes.clone(),
                        expires_at: Instant::now() + ttl,
                    },
                );
            }
        }
    }

    build_http_response(
        path,
        cache_ttl.is_some(),
        status_u16,
        &content_type,
        upstream_cache_control.as_deref(),
        content_range.as_deref(),
        accept_ranges.as_deref(),
        bytes,
    )
}

#[allow(clippy::too_many_arguments)]
fn build_http_response(
    path: &str,
    is_cacheable: bool,
    status_u16: u16,
    content_type: &str,
    upstream_cache_control: Option<&str>,
    content_range: Option<&str>,
    accept_ranges: Option<&str>,
    bytes: Vec<u8>,
) -> Response<Vec<u8>> {
    let status = StatusCode::from_u16(status_u16).unwrap_or(StatusCode::OK);
    let cache_control_val = if should_preserve_cache_control(path) {
        upstream_cache_control.unwrap_or("public, max-age=1800")
    } else if is_cacheable && status_u16 == 200 {
        upstream_cache_control.unwrap_or("public, max-age=45")
    } else {
        "no-store"
    };

    let mut builder = Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(
            header::ACCESS_CONTROL_ALLOW_HEADERS,
            "Authorization, Content-Type, Accept, Range",
        )
        .header(
            header::ACCESS_CONTROL_EXPOSE_HEADERS,
            "Content-Range, Accept-Ranges, Content-Length",
        )
        .header(
            header::ACCESS_CONTROL_ALLOW_METHODS,
            "GET, POST, PUT, DELETE, OPTIONS",
        )
        .header(header::CACHE_CONTROL, cache_control_val);

    if let Some(cr) = content_range {
        builder = builder.header(header::CONTENT_RANGE, cr);
    }
    if let Some(ar) = accept_ranges {
        builder = builder.header(header::ACCEPT_RANGES, ar);
    }

    builder
        .body(bytes)
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

pub fn json_response(status: StatusCode, body: Vec<u8>) -> Response<Vec<u8>> {
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "application/json; charset=utf-8")
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(header::CACHE_CONTROL, "no-store")
        .body(body)
        .unwrap_or_else(|_| Response::new(Vec::new()))
}

use std::sync::OnceLock;
use std::time::Duration;
use wry::http::{header, Request, Response, StatusCode};

const REMOTE_BASE: &str = "https://phim.maniakov.bond";
const DESKTOP_USER_AGENT: &str = "ManiFlixDesktop-Rust/2.0.1";

static HTTP_AGENT: OnceLock<ureq::Agent> = OnceLock::new();

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
    let path_and_query = uri
        .path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");
    let target_url = format!("{}{}", REMOTE_BASE, path_and_query);
    let method = req.method().as_str();

    let agent = http_agent();

    let mut ureq_req = agent
        .request(method, &target_url)
        .set("User-Agent", DESKTOP_USER_AGENT);

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
        Ok(resp) => build_response_from_ureq(resp),
        Err(ureq::Error::Status(_code, resp)) => build_response_from_ureq(resp),
        Err(_err) => json_response(
            StatusCode::BAD_GATEWAY,
            br#"{"ok":false,"error":"Gateway connection error"}"#.to_vec(),
        ),
    }
}

fn build_response_from_ureq(resp: ureq::Response) -> Response<Vec<u8>> {
    let status_u16 = resp.status();
    let status = StatusCode::from_u16(status_u16).unwrap_or(StatusCode::OK);
    let content_type = resp
        .header("Content-Type")
        .unwrap_or("application/octet-stream")
        .to_string();
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
        .header(header::CACHE_CONTROL, "no-store");

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

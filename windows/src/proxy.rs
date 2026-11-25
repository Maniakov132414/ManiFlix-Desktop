use std::sync::OnceLock;
use std::time::Duration;
use wry::http::{header, Request, Response, StatusCode};

const REMOTE_BASE: &str = "https://phim.maniakov.bond";
const DESKTOP_USER_AGENT: &str = "ManiFlixDesktop-Rust/1.1";

static HTTP_AGENT: OnceLock<ureq::Agent> = OnceLock::new();

fn http_agent() -> &'static ureq::Agent {
    HTTP_AGENT.get_or_init(|| {
        ureq::AgentBuilder::new()
            .timeout_connect(Duration::from_secs(10))
            .timeout_read(Duration::from_secs(25))
            .timeout_write(Duration::from_secs(20))
            .max_idle_connections(16)
            .max_idle_connections_per_host(8)
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

    let body = req.body();
    let result = if method == "POST" || method == "PUT" || method == "PATCH" {
        ureq_req.send_bytes(body)
    } else {
        ureq_req.call()
    };

    match result {
        Ok(resp) => build_response_from_ureq(resp),
        Err(ureq::Error::Status(_code, resp)) => build_response_from_ureq(resp),
        Err(err) => {
            let msg = serde_json::json!({
                "ok": false,
                "error": format!("Proxy request failed: {}", err)
            })
            .to_string();
            json_response(StatusCode::BAD_GATEWAY, msg.into_bytes())
        }
    }
}

fn build_response_from_ureq(resp: ureq::Response) -> Response<Vec<u8>> {
    let status_u16 = resp.status();
    let status = StatusCode::from_u16(status_u16).unwrap_or(StatusCode::OK);
    let content_type = resp
        .header("Content-Type")
        .unwrap_or("application/octet-stream")
        .to_string();

    let mut bytes = Vec::new();
    let mut reader = resp.into_reader();
    if std::io::Read::read_to_end(&mut reader, &mut bytes).is_err() {
        return json_response(
            StatusCode::BAD_GATEWAY,
            br#"{"ok":false,"error":"Failed reading upstream body"}"#.to_vec(),
        );
    }

    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(header::ACCESS_CONTROL_ALLOW_HEADERS, "Authorization, Content-Type, Accept")
        .header(header::ACCESS_CONTROL_ALLOW_METHODS, "GET, POST, PUT, DELETE, OPTIONS")
        .header(header::CACHE_CONTROL, "no-store")
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

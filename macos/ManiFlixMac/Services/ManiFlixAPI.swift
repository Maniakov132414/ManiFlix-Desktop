import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case badStatus(Int, String)
    case decodingFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "URL máy chủ không hợp lệ."
        case .badStatus(let code, let msg): return "Lỗi máy chủ HTTP \(code): \(msg)"
        case .decodingFailed(let detail): return "Lỗi giải mã dữ liệu: \(detail)"
        }
    }
}

struct SpeedtestPingResult: Sendable {
    let pingMs: Double
    let jitterMs: Double
    let source: String
}

struct SpeedtestTransferResult: Sendable {
    let mbps: Double
    let bytes: Int64
    let elapsedSec: Double
    let source: String
}

actor APIMemoryCache {
    private struct Entry {
        let data: Data
        let expiresAt: Date
    }

    private var entries: [String: Entry] = [:]
    private var order: [String] = []
    private var totalBytes = 0
    private let maxEntries = 120
    private let maxBytes = 24 * 1024 * 1024

    func get(key: String) -> Data? {
        guard let entry = entries[key] else { return nil }
        if Date() < entry.expiresAt {
            return entry.data
        }
        totalBytes = max(0, totalBytes - entry.data.count)
        entries.removeValue(forKey: key)
        order.removeAll { $0 == key }
        return nil
    }

    func set(key: String, data: Data, ttl: TimeInterval) {
        guard data.count <= 4 * 1024 * 1024 else { return }
        if let prev = entries.removeValue(forKey: key) {
            totalBytes = max(0, totalBytes - prev.data.count)
            order.removeAll { $0 == key }
        }
        let now = Date()
        let expiredKeys = entries.compactMap { k, v in now >= v.expiresAt ? k : nil }
        for k in expiredKeys {
            if let rem = entries.removeValue(forKey: k) {
                totalBytes = max(0, totalBytes - rem.data.count)
            }
            order.removeAll { $0 == k }
        }
        while (totalBytes + data.count > maxBytes || entries.count >= maxEntries), !order.isEmpty {
            let oldKey = order.removeFirst()
            if let rem = entries.removeValue(forKey: oldKey) {
                totalBytes = max(0, totalBytes - rem.data.count)
            }
        }
        entries[key] = Entry(data: data, expiresAt: now.addingTimeInterval(ttl))
        order.append(key)
        totalBytes += data.count
    }
}

final class ManiFlixAPI {
    static let shared = ManiFlixAPI()
    private let session: URLSession
    private let speedSession: URLSession
    private let decoder = JSONDecoder()
    private let memoryCache = APIMemoryCache()
    private let baseURL = "https://phim.maniakov.bond"

    private init() {
        let urlCache = URLCache(
            memoryCapacity: 64 * 1024 * 1024,
            diskCapacity: 256 * 1024 * 1024,
            diskPath: "ManiFlixAPICache"
        )
        let config = URLSessionConfiguration.default
        config.urlCache = urlCache
        config.requestCachePolicy = .useProtocolCachePolicy
        config.httpMaximumConnectionsPerHost = 12
        config.timeoutIntervalForRequest = 18
        config.timeoutIntervalForResource = 35
        self.session = URLSession(configuration: config)

        let speedConfig = URLSessionConfiguration.ephemeral
        speedConfig.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        speedConfig.urlCache = nil
        speedConfig.httpMaximumConnectionsPerHost = 8
        speedConfig.timeoutIntervalForRequest = 12
        speedConfig.timeoutIntervalForResource = 45
        self.speedSession = URLSession(configuration: speedConfig)
    }

    private func cacheTTL(for path: String) -> TimeInterval? {
        if path == "/api/bootstrap/discover"
            || path.hasPrefix("/api/movies")
            || path.hasPrefix("/api/category")
            || path.hasPrefix("/api/the-loai")
            || path.hasPrefix("/api/search") {
            return 60
        }
        if path.hasPrefix("/api/movie/")
            || path.hasPrefix("/api/franchise")
            || path.hasPrefix("/api/ads/") {
            return 90
        }
        return nil
    }

    func cleanM3U8URL(from rawM3U8: String, extraParams: [String: String] = [:]) -> URL? {
        guard var comps = URLComponents(string: "\(baseURL)/api/clean-m3u8") else { return nil }
        let defSub = UserDefaults.standard.string(forKey: "pref.defaultSubtitleLang") ?? "vi"
        var items = [
            URLQueryItem(name: "url", value: rawM3U8),
            URLQueryItem(name: "sub", value: defSub)
        ]
        for (k, v) in extraParams {
            items.append(URLQueryItem(name: k, value: v))
        }
        comps.queryItems = items
        return comps.url
    }

    private func request<T: Decodable>(
        path: String,
        method: String = "GET",
        query: [URLQueryItem] = [],
        body: [String: Any]? = nil,
        token: String? = nil
    ) async throws -> T {
        guard var comps = URLComponents(string: "\(baseURL)\(path)") else { throw APIError.invalidURL }
        if !query.isEmpty { comps.queryItems = query }
        guard let url = comps.url else { throw APIError.invalidURL }

        let ttl = (method == "GET" && (token == nil || token?.isEmpty == true)) ? cacheTTL(for: path) : nil
        let cacheKey = url.absoluteString
        if ttl != nil, let cachedData = await memoryCache.get(key: cacheKey) {
            if let decoded = try? decoder.decode(T.self, from: cachedData) {
                return decoded
            }
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("ManiFlix-macOS/2.0.3", forHTTPHeaderField: "User-Agent")

        if let token = token, !token.isEmpty {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        if let body = body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIError.badStatus(0, "Không nhận được phản hồi HTTP")
        }
        guard (200..<300).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.badStatus(http.statusCode, msg)
        }
        do {
            let decoded = try decoder.decode(T.self, from: data)
            if let ttl = ttl {
                await memoryCache.set(key: cacheKey, data: data, ttl: ttl)
            }
            return decoded
        } catch {
            throw APIError.decodingFailed(error.localizedDescription)
        }
    }

    func fetchBootstrapDiscover() async throws -> BootstrapDiscoverResponse {
        try await request(path: "/api/bootstrap/discover")
    }

    func fetchMovies(page: Int = 1) async throws -> MoviesPageResponse {
        try await request(path: "/api/movies", query: [URLQueryItem(name: "page", value: "\(page)")])
    }

    func fetchCategory(type: String, page: Int = 1) async throws -> CategoryPageResponse {
        try await request(path: "/api/category", query: [URLQueryItem(name: "type", value: type), URLQueryItem(name: "page", value: "\(page)")])
    }

    func fetchGenre(slug: String, page: Int = 1) async throws -> CategoryPageResponse {
        try await request(path: "/api/the-loai", query: [URLQueryItem(name: "slug", value: slug), URLQueryItem(name: "page", value: "\(page)")])
    }

    func searchMovies(query: String, page: Int = 1) async throws -> SearchResponse {
        try await request(path: "/api/search", query: [URLQueryItem(name: "q", value: query), URLQueryItem(name: "page", value: "\(page)")])
    }

    func fetchMovieDetail(slug: String) async throws -> MovieDetailResponse {
        let encoded = slug.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? slug
        return try await request(path: "/api/movie/\(encoded)")
    }

    func fetchFranchise(slug: String) async throws -> FranchiseResponse {
        try await request(path: "/api/franchise", query: [URLQueryItem(name: "slug", value: slug)])
    }

    func fetchAdsMarkers(slug: String, ep: String, titleHint: String = "") async throws -> AdsResponse {
        let encodedSlug = slug.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? slug
        let digitsOnly = ep.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        let cleanEp = digitsOnly.isEmpty ? (ep.isEmpty ? "1" : ep) : String(Int(digitsOnly) ?? 1)
        let encodedEp = cleanEp.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed) ?? "1"
        var query: [URLQueryItem] = []
        if !titleHint.isEmpty { query.append(URLQueryItem(name: "title", value: titleHint)) }
        return try await request(path: "/api/ads/\(encodedSlug)/\(encodedEp)", query: query)
    }

    func login(username: String, password: String) async throws -> AuthResponse {
        try await request(path: "/api/auth/login", method: "POST", body: ["username": username, "password": password])
    }

    func register(username: String, password: String, displayName: String) async throws -> AuthResponse {
        try await request(path: "/api/auth/register", method: "POST", body: ["username": username, "password": password, "displayName": displayName])
    }

    func fetchMe(token: String) async throws -> MeResponse {
        try await request(path: "/api/auth/me", token: token)
    }

    func fetchHistory(token: String) async throws -> HistoryResponse {
        try await request(path: "/api/user/history", token: token)
    }

    func saveHistory(token: String, slug: String, name: String, poster: String, episodeIndex: Int, episodeName: String, currentTime: Double, duration: Double) async {
        struct Ack: Codable { let success: Bool? }
        let body: [String: Any] = [
            "slug": slug, "name": name, "poster": poster,
            "episodeIndex": episodeIndex, "episodeName": episodeName,
            "currentTime": currentTime, "duration": duration
        ]
        _ = try? await request(path: "/api/user/history", method: "POST", body: body, token: token) as Ack
    }

    func deleteHistory(token: String, slug: String) async {
        struct Ack: Codable { let success: Bool? }
        _ = try? await request(path: "/api/user/history/delete", method: "POST", body: ["slug": slug], token: token) as Ack
    }

    func fetchFavorites(token: String) async throws -> FavoritesResponse {
        try await request(path: "/api/user/favorites", token: token)
    }

    func toggleFavorite(token: String, movie: MovieDetail) async throws -> FavoritesResponse {
        let body: [String: Any] = [
            "slug": movie.slug, "name": movie.name, "poster": movie.poster_url ?? movie.thumb_url ?? "",
            "year": movie.year?.value ?? 0, "quality": movie.quality ?? "HD", "lang": movie.lang ?? "Vietsub"
        ]
        return try await request(path: "/api/user/favorites/toggle", method: "POST", body: body, token: token)
    }

    func toggleFavoriteItem(token: String, item: MovieItem) async throws -> FavoritesResponse {
        let body: [String: Any] = [
            "slug": item.slug, "name": item.name, "poster": item.poster_url ?? item.thumb_url ?? "",
            "year": item.year?.value ?? 0, "quality": item.quality ?? "HD", "lang": item.lang ?? "Vietsub"
        ]
        return try await request(path: "/api/user/favorites/toggle", method: "POST", body: body, token: token)
    }

    func saveUserTheme(token: String, presetId: String, accent: String, bg: String, surface: String) async throws {
        struct ThemeSaveAck: Codable { let success: Bool? }
        let body: [String: Any] = ["presetId": presetId, "accent": accent, "bg": bg, "surface": surface]
        _ = try await request(path: "/api/user/theme", method: "POST", body: body, token: token) as ThemeSaveAck
    }

    func fetchNetStats() async throws -> NetStatsResponse {
        try await request(path: "/api/net-stats")
    }

    func measureWarmPingJitter() async throws -> SpeedtestPingResult {
        do {
            let (ping, jitter) = try await runWarmRTTSeries(endpoint: "https://speed.cloudflare.com/__down?bytes=0")
            return SpeedtestPingResult(pingMs: ping, jitterMs: jitter, source: "Cloudflare Edge")
        } catch {
            let (ping, jitter) = try await runWarmRTTSeries(endpoint: "\(baseURL)/api/net-probe?kb=1")
            return SpeedtestPingResult(pingMs: ping, jitterMs: jitter, source: "ManiFlix Server")
        }
    }

    private func runWarmRTTSeries(endpoint: String) async throws -> (pingMs: Double, jitterMs: Double) {
        let session = self.speedSession
        func singleRTT() async throws -> Double {
            let sep = endpoint.contains("?") ? "&" : "?"
            guard let url = URL(string: "\(endpoint)\(sep)_t=\(UUID().uuidString)") else {
                throw APIError.invalidURL
            }
            var req = URLRequest(url: url)
            req.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
            req.setValue("no-store", forHTTPHeaderField: "Cache-Control")
            req.setValue("ManiFlix-macOS/1.1", forHTTPHeaderField: "User-Agent")
            let t0 = CFAbsoluteTimeGetCurrent()
            let (_, response) = try await session.data(for: req)
            let ms = max(1.0, (CFAbsoluteTimeGetCurrent() - t0) * 1000.0)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                throw APIError.badStatus((response as? HTTPURLResponse)?.statusCode ?? 0, "Ping probe error")
            }
            return ms
        }

        // Discard 1 warm-up probe (DNS + TLS handshake) before measuring 4 sequential RTTs
        _ = try await singleRTT()
        var samples: [Double] = []
        samples.reserveCapacity(4)
        for _ in 0..<4 {
            samples.append(try await singleRTT())
        }
        let avg = samples.reduce(0, +) / Double(samples.count)
        var diffs: [Double] = []
        for i in 1..<samples.count {
            diffs.append(abs(samples[i] - samples[i - 1]))
        }
        let jitter = diffs.isEmpty ? 0.0 : diffs.reduce(0, +) / Double(diffs.count)
        return (avg, jitter)
    }

    func measureParallelDownload(streams: Int = 4, cfBytes: Int = 6_000_000, fallbackKB: Int = 2048) async throws -> SpeedtestTransferResult {
        do {
            let res = try await runParallelBytesDownload(streams: streams) {
                URL(string: "https://speed.cloudflare.com/__down?bytes=\(cfBytes)&_r=\(UUID().uuidString)")
            }
            return SpeedtestTransferResult(mbps: res.mbps, bytes: res.bytes, elapsedSec: res.elapsed, source: "Cloudflare Edge")
        } catch {
            let base = self.baseURL
            let res = try await runParallelBytesDownload(streams: streams) {
                URL(string: "\(base)/api/net-probe?kb=\(fallbackKB)&_r=\(UUID().uuidString)")
            }
            return SpeedtestTransferResult(mbps: res.mbps, bytes: res.bytes, elapsedSec: res.elapsed, source: "ManiFlix Server")
        }
    }

    func measureLightweightDownloadProbe() async throws -> SpeedtestTransferResult {
        try await measureParallelDownload(streams: 1, cfBytes: 1_000_000, fallbackKB: 1024)
    }

    private func runParallelBytesDownload(streams: Int, urlBuilder: @Sendable () -> URL?) async throws -> (mbps: Double, bytes: Int64, elapsed: Double) {
        struct StreamTiming: Sendable {
            let bytes: Int64
            let bodyStart: CFAbsoluteTime
            let bodyEnd: CFAbsoluteTime
        }

        let session = self.speedSession
        let chunks = try await withThrowingTaskGroup(of: StreamTiming.self) { group in
            for _ in 0..<streams {
                guard let url = urlBuilder() else { throw APIError.invalidURL }
                group.addTask {
                    var req = URLRequest(url: url)
                    req.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
                    req.setValue("no-store", forHTTPHeaderField: "Cache-Control")
                    req.setValue("ManiFlix-macOS/1.1", forHTTPHeaderField: "User-Agent")
                    let (asyncBytes, response) = try await session.bytes(for: req)
                    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                        throw APIError.badStatus((response as? HTTPURLResponse)?.statusCode ?? 0, "Download probe error")
                    }
                    // Start timing body transfer AFTER HTTP response headers arrive
                    let bodyStart = CFAbsoluteTimeGetCurrent()
                    var count: Int64 = 0
                    for try await _ in asyncBytes {
                        count += 1
                    }
                    let bodyEnd = CFAbsoluteTimeGetCurrent()
                    return StreamTiming(bytes: count, bodyStart: bodyStart, bodyEnd: bodyEnd)
                }
            }
            var collected: [StreamTiming] = []
            for try await item in group {
                collected.append(item)
            }
            return collected
        }

        guard let minStart = chunks.map(\.bodyStart).min(),
              let maxEnd = chunks.map(\.bodyEnd).max() else {
            throw APIError.badStatus(0, "Empty download probe")
        }
        let totalBytes = chunks.reduce(Int64(0)) { $0 + $1.bytes }
        let elapsed = max(0.01, maxEnd - minStart)
        let mbps = (Double(totalBytes) * 8.0) / (elapsed * 1_000_000.0)
        return (mbps, totalBytes, elapsed)
    }

    func measureParallelUpload(streams: Int = 2, cfBytes: Int = 1_500_000, fallbackBytes: Int = 512 * 1024) async throws -> SpeedtestTransferResult {
        do {
            let res = try await runParallelUpload(streams: streams, payloadBytes: cfBytes) {
                URL(string: "https://speed.cloudflare.com/__up?_r=\(UUID().uuidString)")
            }
            return SpeedtestTransferResult(mbps: res.mbps, bytes: res.bytes, elapsedSec: res.elapsed, source: "Cloudflare Edge")
        } catch {
            let base = self.baseURL
            let res = try await runParallelUpload(streams: streams, payloadBytes: fallbackBytes) {
                URL(string: "\(base)/api/net-up?_r=\(UUID().uuidString)")
            }
            return SpeedtestTransferResult(mbps: res.mbps, bytes: res.bytes, elapsedSec: res.elapsed, source: "ManiFlix Server")
        }
    }

    private func runParallelUpload(streams: Int, payloadBytes: Int, urlBuilder: @Sendable () -> URL?) async throws -> (mbps: Double, bytes: Int64, elapsed: Double) {
        struct UploadTiming: Sendable {
            let bytes: Int64
            let start: CFAbsoluteTime
            let end: CFAbsoluteTime
        }

        let session = self.speedSession
        let payload = Data(repeating: 0x4D, count: payloadBytes)
        let timings = try await withThrowingTaskGroup(of: UploadTiming.self) { group in
            for _ in 0..<streams {
                guard let url = urlBuilder() else { throw APIError.invalidURL }
                group.addTask {
                    var req = URLRequest(url: url)
                    req.httpMethod = "POST"
                    req.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
                    req.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
                    req.setValue("ManiFlix-macOS/1.1", forHTTPHeaderField: "User-Agent")
                    let start = CFAbsoluteTimeGetCurrent()
                    let (_, response) = try await session.upload(for: req, from: payload)
                    let end = CFAbsoluteTimeGetCurrent()
                    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                        throw APIError.badStatus((response as? HTTPURLResponse)?.statusCode ?? 0, "Upload probe error")
                    }
                    return UploadTiming(bytes: Int64(payload.count), start: start, end: end)
                }
            }
            var collected: [UploadTiming] = []
            for try await item in group {
                collected.append(item)
            }
            return collected
        }

        guard let minStart = timings.map(\.start).min(),
              let maxEnd = timings.map(\.end).max() else {
            throw APIError.badStatus(0, "Empty upload probe")
        }
        let totalBytes = timings.reduce(Int64(0)) { $0 + $1.bytes }
        let elapsed = max(0.01, maxEnd - minStart)
        let mbps = (Double(totalBytes) * 8.0) / (elapsed * 1_000_000.0)
        return (mbps, totalBytes, elapsed)
    }
}

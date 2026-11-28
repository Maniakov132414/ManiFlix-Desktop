import Foundation
import AppKit

struct DesktopVersionInfo: Codable {
    let ok: Bool?
    let latestVersion: String?
    let title: String?
    let releaseNotes: String?
    let mode: String?
    let forceUpdate: Bool?
    let minRequiredVersion: String?
    let macosDmgUrl: String?
    let macosSizeBytes: Int64?
    let releasePageUrl: String?
}

@MainActor
final class UpdateManager: ObservableObject {
    static let shared = UpdateManager()

    @Published var availableUpdate: DesktopVersionInfo?
    @Published var showUpdateSheet = false
    @Published var isForceUpdate = false
    @Published var isChecking = false
    @Published var statusMessage = ""

    private let snoozeVersionKey = "update.snoozedVersion.v1"
    private let snoozeUntilKey = "update.snoozeUntil.v1"
    private let versionEndpoint = "https://phim.maniakov.bond/api/desktop/version"

    static var currentVersionString: String {
        (Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String) ?? "2.0.2"
    }

    static var currentBuildString: String {
        (Bundle.main.infoDictionary?["CFBundleVersion"] as? String) ?? "202"
    }

    private init() {}

    func checkForUpdates(manual: Bool = false) async {
        guard !isChecking else { return }
        isChecking = true
        defer { isChecking = false }

        guard let url = URL(string: versionEndpoint) else { return }
        var req = URLRequest(url: url)
        req.cachePolicy = .reloadIgnoringLocalAndRemoteCacheData
        req.timeoutInterval = 15
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        req.setValue("ManiFlix-macOS/\(Self.currentVersionString)", forHTTPHeaderField: "User-Agent")

        do {
            let (data, response) = try await URLSession.shared.data(for: req)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                statusMessage = "Không thể kiểm tra cập nhật lúc này"
                if manual { AppState.shared.showBanner(statusMessage) }
                return
            }

            let info = try JSONDecoder().decode(DesktopVersionInfo.self, from: data)
            let currentVer = Self.currentVersionString
            let latestVer = Self.normalizedVersion(info.latestVersion ?? currentVer)
            let hasUpdate = Self.compareSemver(latestVer, currentVer) > 0

            guard hasUpdate else {
                statusMessage = "Đang ở phiên bản mới nhất (\(currentVer))"
                if manual { AppState.shared.showBanner(statusMessage) }
                return
            }

            let minReq = info.minRequiredVersion.map(Self.normalizedVersion)
            let force = (info.forceUpdate == true)
                || (info.mode?.lowercased() == "force")
                || (minReq != nil && Self.compareSemver(currentVer, minReq!) < 0)

            statusMessage = "Đã có bản mới: v\(latestVer)"
            if !manual && !force {
                let ud = UserDefaults.standard
                let snoozedVer = ud.string(forKey: snoozeVersionKey)
                let snoozeUntil = ud.double(forKey: snoozeUntilKey)
                if snoozedVer == latestVer && Date().timeIntervalSince1970 < snoozeUntil {
                    return
                }
            }

            self.availableUpdate = info
            self.isForceUpdate = force
            self.showUpdateSheet = true
        } catch {
            statusMessage = "Không thể kiểm tra cập nhật lúc này"
            if manual { AppState.shared.showBanner(statusMessage) }
        }
    }

    func snoozeFor24Hours() {
        guard !isForceUpdate else { return }
        if let latest = availableUpdate?.latestVersion {
            let ud = UserDefaults.standard
            ud.set(Self.normalizedVersion(latest), forKey: snoozeVersionKey)
            ud.set(Date().timeIntervalSince1970 + 86_400, forKey: snoozeUntilKey)
        }
        showUpdateSheet = false
    }

    func openDownload() {
        let raw = availableUpdate?.macosDmgUrl
            ?? availableUpdate?.releasePageUrl
            ?? "https://github.com/Maniakov132414/ManiFlix-Desktop/releases/latest"
        guard let url = URL(string: raw) else { return }
        NSWorkspace.shared.open(url)
    }

    static func normalizedVersion(_ raw: String) -> String {
        let trimmed = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.hasPrefix("v") || trimmed.hasPrefix("V") ? String(trimmed.dropFirst()) : trimmed
    }

    static func compareSemver(_ a: String, _ b: String) -> Int {
        let pa = normalizedVersion(a).split(separator: ".").map { Int($0) ?? 0 }
        let pb = normalizedVersion(b).split(separator: ".").map { Int($0) ?? 0 }
        let len = max(pa.count, pb.count, 3)
        for i in 0..<len {
            let va = i < pa.count ? pa[i] : 0
            let vb = i < pb.count ? pb[i] : 0
            if va > vb { return 1 }
            if va < vb { return -1 }
        }
        return 0
    }
}

import Foundation
import SwiftUI
import Combine
import AppKit

struct BlockedMovieRecord: Codable, Identifiable, Hashable {
    var id: String { slug }
    let slug: String
    let name: String
    let poster: String?
}

@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published var authToken: String {
        didSet { UserDefaults.standard.set(authToken, forKey: "auth.token") }
    }
    @Published var currentUser: UserInfo?
    @Published var favorites: [FavoriteEntry] = []
    @Published var history: [HistoryEntry] = []
    @Published var blockedMovies: [BlockedMovieRecord] = []
    @Published var showAuthSheet = false
    @Published var activeEngine: MacPlayerEngine?
    @Published var isPlayerPresented = false
    @Published var isPhoneMode = false
    @Published var isWindowPinned = false
    @Published var globalBannerMessage: String?

    private let blockedKey = "prefs.blockedMovies.v1"
    private let localHistoryKey = "prefs.localHistory.v1"

    private init() {
        self.authToken = UserDefaults.standard.string(forKey: "auth.token") ?? ""
        if let data = UserDefaults.standard.data(forKey: blockedKey),
           let decoded = try? JSONDecoder().decode([BlockedMovieRecord].self, from: data) {
            self.blockedMovies = decoded
        }
        if let hData = UserDefaults.standard.data(forKey: localHistoryKey),
           let decodedHist = try? JSONDecoder().decode([HistoryEntry].self, from: hData) {
            self.history = decodedHist
        }
    }

    var isLoggedIn: Bool { !authToken.isEmpty && currentUser != nil }

    func bootstrapSession() async {
        guard !authToken.isEmpty else { return }
        do {
            let me = try await ManiFlixAPI.shared.fetchMe(token: authToken)
            self.currentUser = me.user
            if let themeCfg = me.user?.themeConfig {
                AppPreferences.shared.applyServerTheme(themeCfg)
            }
            await refreshLibrary()
        } catch {
            if case APIError.badStatus(let code, _) = error, code == 401 { logout() }
        }
    }

    func refreshLibrary() async {
        guard !authToken.isEmpty else { return }
        async let histTask = ManiFlixAPI.shared.fetchHistory(token: authToken)
        async let favTask = ManiFlixAPI.shared.fetchFavorites(token: authToken)
        if let h = try? await histTask, let serverHist = h.history {
            self.history = serverHist
            persistLocalHistory()
        }
        if let f = try? await favTask { self.favorites = f.favorites ?? [] }
    }

    func handleAuthSuccess(token: String, user: UserInfo?) async {
        self.authToken = token
        self.currentUser = user
        if let themeCfg = user?.themeConfig { AppPreferences.shared.applyServerTheme(themeCfg) }
        self.showAuthSheet = false
        await refreshLibrary()
    }

    func syncThemeToServer() async -> Bool {
        guard !authToken.isEmpty else { return false }
        let prefs = AppPreferences.shared
        do {
            try await ManiFlixAPI.shared.saveUserTheme(
                token: authToken,
                presetId: prefs.activeThemePresetId,
                accent: prefs.customAccentHex,
                bg: prefs.effectiveBgHexForSync,
                surface: prefs.effectiveSurfaceHexForSync
            )
            showBanner("Đã đồng bộ giao diện lên tài khoản")
            return true
        } catch {
            showBanner("Không thể đồng bộ giao diện")
            return false
        }
    }

    func logout() {
        authToken = ""
        currentUser = nil
        favorites = []
    }

    func isFavorite(slug: String) -> Bool { favorites.contains(where: { $0.slug == slug }) }
    func isBlocked(slug: String) -> Bool { blockedMovies.contains(where: { $0.slug == slug }) }

    func toggleFavorite(movie: MovieDetail) async {
        guard !authToken.isEmpty else { showAuthSheet = true; return }
        if let res = try? await ManiFlixAPI.shared.toggleFavorite(token: authToken, movie: movie),
           let list = res.favorites {
            self.favorites = list
        } else {
            await refreshLibrary()
        }
    }

    func toggleFavoriteItem(_ item: MovieItem) async {
        guard !authToken.isEmpty else { showAuthSheet = true; return }
        let wasFav = isFavorite(slug: item.slug)
        if let res = try? await ManiFlixAPI.shared.toggleFavoriteItem(token: authToken, item: item),
           let list = res.favorites {
            self.favorites = list
            showBanner(wasFav ? "Đã xoá khỏi Tủ phim" : "Đã thêm vào Tủ phim")
        }
    }

    func blockMovie(_ item: MovieItem) {
        guard !isBlocked(slug: item.slug) else { return }
        blockedMovies.insert(BlockedMovieRecord(slug: item.slug, name: item.name, poster: item.poster_url ?? item.thumb_url), at: 0)
        persistBlocked()
        showBanner("Đã ẩn \"\(item.name)\"")
    }

    func unblockMovie(slug: String) {
        blockedMovies.removeAll(where: { $0.slug == slug })
        persistBlocked()
    }

    func recordProgress(movie: MovieDetail, episodeIndex: Int, episodeName: String, currentTime: Double, duration: Double) {
        let poster = movie.poster_url ?? movie.thumb_url ?? ""
        let entry = HistoryEntry(
            slug: movie.slug, name: movie.name, poster: poster,
            episodeIndex: episodeIndex, episodeName: episodeName,
            currentTime: currentTime, duration: duration, updatedAt: Date().timeIntervalSince1970
        )
        history.removeAll(where: { $0.slug == movie.slug })
        history.insert(entry, at: 0)
        if history.count > 40 { history = Array(history.prefix(40)) }
        persistLocalHistory()

        if !authToken.isEmpty {
            Task {
                await ManiFlixAPI.shared.saveHistory(
                    token: authToken, slug: movie.slug, name: movie.name, poster: poster,
                    episodeIndex: episodeIndex, episodeName: episodeName, currentTime: currentTime, duration: duration
                )
            }
        }
    }

    func deleteHistory(slug: String) async {
        history.removeAll(where: { $0.slug == slug })
        persistLocalHistory()
        if !authToken.isEmpty {
            await ManiFlixAPI.shared.deleteHistory(token: authToken, slug: slug)
        }
    }

    func startPlayback(movie: MovieDetail, servers: [EpisodeServer], serverIndex: Int, episodeIndex: Int) {
        let resume = history.first(where: { $0.slug == movie.slug && $0.episodeIndex == episodeIndex })?.currentTime ?? 0
        let engine = MacPlayerEngine(movie: movie, servers: servers, serverIndex: serverIndex, episodeIndex: episodeIndex, resumeTime: resume)
        self.activeEngine = engine
        self.isPlayerPresented = true
    }

    func stopPlayback() {
        activeEngine?.stop()
        activeEngine = nil
        isPlayerPresented = false
    }

    func showBanner(_ text: String) {
        globalBannerMessage = text
        Task {
            try? await Task.sleep(nanoseconds: 2_200_000_000)
            if self.globalBannerMessage == text { self.globalBannerMessage = nil }
        }
    }

    func toggleWindowPhoneMode() {
        isPhoneMode.toggle()
        guard let window = NSApp.windows.first(where: { $0.isVisible }) ?? NSApp.mainWindow else { return }
        let targetSize = isPhoneMode ? NSSize(width: 400, height: 800) : NSSize(width: 1200, height: 780)
        var frame = window.frame
        let contentRect = window.contentRect(forFrameRect: frame)
        let dw = targetSize.width - contentRect.width
        let dh = targetSize.height - contentRect.height
        frame.size.width += dw
        frame.size.height += dh
        frame.origin.y -= dh
        window.setFrame(frame, display: true, animate: true)
    }

    func toggleWindowPinned() {
        isWindowPinned.toggle()
        for win in NSApp.windows {
            win.level = isWindowPinned ? .floating : .normal
        }
    }

    private func persistBlocked() {
        if let data = try? JSONEncoder().encode(blockedMovies) {
            UserDefaults.standard.set(data, forKey: blockedKey)
        }
    }

    private func persistLocalHistory() {
        if let data = try? JSONEncoder().encode(history) {
            UserDefaults.standard.set(data, forKey: localHistoryKey)
        }
    }
}

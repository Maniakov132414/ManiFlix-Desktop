import Foundation
import AVFoundation
import AVKit
import CoreAudio
import Combine

enum PlayerAspectMode: String, CaseIterable, Identifiable {
    case fitSafe, ratio16x9, ratio4x3, ratio21x9, edgeFill
    var id: String { rawValue }

    var title: String {
        switch self {
        case .fitSafe: return "Gốc"
        case .ratio16x9: return "16:9"
        case .ratio4x3: return "4:3"
        case .ratio21x9: return "21:9"
        case .edgeFill: return "Tràn viền"
        }
    }

    var layerGravity: AVLayerVideoGravity {
        switch self {
        case .fitSafe: return .resizeAspect
        case .ratio16x9, .ratio4x3, .ratio21x9: return .resize
        case .edgeFill: return .resizeAspectFill
        }
    }

    var explicitRatio: CGFloat? {
        switch self {
        case .ratio16x9: return 16.0 / 9.0
        case .ratio4x3: return 4.0 / 3.0
        case .ratio21x9: return 21.0 / 9.0
        case .fitSafe, .edgeFill: return nil
        }
    }
}

@MainActor
final class MacPlayerEngine: ObservableObject {
    @Published var movie: MovieDetail
    @Published var servers: [EpisodeServer]
    @Published var serverIndex: Int
    @Published var episodeIndex: Int

    @Published var isPlaying: Bool = false
    @Published var isBuffering: Bool = true
    @Published var isFailed: Bool = false
    @Published var errorMessage: String = ""
    @Published var currentTime: Double = 0
    @Published var duration: Double = 0
    @Published var playbackRate: Float = 1.0
    @Published var currentSourceLabel: String = "Chuẩn"
    @Published var adMarkers: [AdMarker] = []
    @Published var activeSkipPrompt: AdMarker?
    @Published var activeOutroPrompt: AdMarker?
    @Published var undoSkipTime: Double?
    @Published var statusToast: String?
    @Published var aspectMode: PlayerAspectMode = .fitSafe
    @Published var outputDeviceName: String = "Loa MacBook / Hệ thống"

    let player = AVPlayer()
    private var timeObserver: Any?
    private var statusObserver: NSKeyValueObservation?
    private var bufferObserver: NSKeyValueObservation?
    private var endObserver: NSObjectProtocol?
    private var stallTimer: Task<Void, Never>?
    private var skippedIds = Set<String>()
    private var dismissedIds = Set<String>()
    private var usingCleanSource = true
    private var didFailover = false
    private var lastSavedSec: Double = -999
    private var pendingResumeSec: Double

    init(movie: MovieDetail, servers: [EpisodeServer], serverIndex: Int, episodeIndex: Int, resumeTime: Double) {
        self.movie = movie
        self.servers = servers
        self.serverIndex = serverIndex
        self.episodeIndex = episodeIndex
        self.pendingResumeSec = resumeTime
        self.outputDeviceName = Self.queryDefaultAudioOutputName()
        loadCurrentEpisode()
    }

    var currentEpisode: EpisodeItem? { servers[safe: serverIndex]?.server_data[safe: episodeIndex] }
    var hasPreviousEpisode: Bool { episodeIndex > 0 }
    var hasNextEpisode: Bool { episodeIndex + 1 < (servers[safe: serverIndex]?.server_data.count ?? 0) }

    static func queryDefaultAudioOutputName() -> String {
        var addr = AudioObjectPropertyAddress(
            mSelector: kAudioHardwarePropertyDefaultOutputDevice,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var deviceID = AudioDeviceID(0)
        var size = UInt32(MemoryLayout<AudioDeviceID>.size)
        guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &addr, 0, nil, &size, &deviceID) == noErr else {
            return "Đầu ra macOS"
        }
        var nameAddr = AudioObjectPropertyAddress(
            mSelector: kAudioObjectPropertyName,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var cfName: CFString = "" as CFString
        var nameSize = UInt32(MemoryLayout<CFString>.size)
        let status = withUnsafeMutablePointer(to: &cfName) { ptr in
            AudioObjectGetPropertyData(deviceID, &nameAddr, 0, nil, &nameSize, ptr)
        }
        if status == noErr {
            let s = cfName as String
            if !s.isEmpty { return s }
        }
        return "Đầu ra macOS"
    }

    func loadCurrentEpisode() {
        cleanupObservers()
        isFailed = false
        errorMessage = ""
        isBuffering = true
        activeSkipPrompt = nil
        activeOutroPrompt = nil
        skippedIds.removeAll()
        dismissedIds.removeAll()
        didFailover = false

        guard let ep = currentEpisode else {
            isFailed = true; isBuffering = false; errorMessage = "Không tìm thấy tập phim."; return
        }
        usingCleanSource = true
        startStream(for: ep, useClean: true)

        let epKey = ep.slug.isEmpty ? "\(episodeIndex + 1)" : ep.slug
        let titleHint = (movie.origin_name?.isEmpty == false ? movie.origin_name : movie.name) ?? movie.name
        Task {
            if let ads = try? await ManiFlixAPI.shared.fetchAdsMarkers(slug: movie.slug, ep: epKey, titleHint: titleHint) {
                self.adMarkers = ads.markers ?? []
            } else {
                self.adMarkers = []
            }
        }
    }

    private func startStream(for ep: EpisodeItem, useClean: Bool) {
        let raw = ep.link_m3u8?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard !raw.isEmpty else {
            isFailed = true; isBuffering = false; errorMessage = "Tập này chưa có luồng HLS."; return
        }
        let resolved = (useClean ? ManiFlixAPI.shared.cleanM3U8URL(from: raw) : nil) ?? URL(string: raw)
        currentSourceLabel = useClean ? "Chuẩn" : "Dự phòng"
        guard let url = resolved else {
            isFailed = true; isBuffering = false; errorMessage = "URL không hợp lệ."; return
        }

        let asset = AVURLAsset(url: url, options: [
            "AVURLAssetHTTPHeaderFieldsKey": ["User-Agent": "ManiFlix-macOS/1.0"]
        ])
        let item = AVPlayerItem(asset: asset)
        applySpatialAndBuffer(to: item)
        player.replaceCurrentItem(with: item)
        attachObservers(to: item)
        player.play()
        player.rate = playbackRate
        isPlaying = true

        stallTimer?.cancel()
        stallTimer = Task { [weak self] in
            try? await Task.sleep(nanoseconds: 8_500_000_000)
            guard !Task.isCancelled, let self = self else { return }
            if self.isBuffering && self.currentTime < 0.5 && !self.didFailover {
                self.tryFailover(for: ep, reason: "Đang chuyển sang nguồn dự phòng...")
            }
        }
    }

    private func applySpatialAndBuffer(to item: AVPlayerItem) {
        let prefs = AppPreferences.shared
        switch prefs.spatialAudioMode {
        case .off: item.allowedAudioSpatializationFormats = []
        case .fixed, .headTracked: item.allowedAudioSpatializationFormats = [.multichannel]
        case .automatic: item.allowedAudioSpatializationFormats = [.monoAndStereo, .multichannel]
        }
        item.audioTimePitchAlgorithm = prefs.pitchAlgorithm == .spectral ? .spectral : .timeDomain
        item.preferredForwardBufferDuration = prefs.forwardBufferSeconds
        player.volume = Float(min(max(prefs.comfortGain, 0.25), 1.0))
    }

    private func tryFailover(for ep: EpisodeItem, reason: String) {
        guard !didFailover else {
            isFailed = true; isBuffering = false; errorMessage = reason; return
        }
        didFailover = true
        usingCleanSource.toggle()
        showToast(usingCleanSource ? "Đổi sang nguồn lọc quảng cáo" : "Đổi sang nguồn gốc")
        startStream(for: ep, useClean: usingCleanSource)
    }

    private func attachObservers(to item: AVPlayerItem) {
        statusObserver = item.observe(\.status, options: [.new]) { [weak self] obs, _ in
            Task { @MainActor in
                guard let self = self else { return }
                switch obs.status {
                case .readyToPlay:
                    self.isBuffering = false
                    self.stallTimer?.cancel()
                    let dur = obs.duration.seconds
                    if dur.isFinite && dur > 0 { self.duration = dur }
                    if self.pendingResumeSec > 3 {
                        let target = min(self.pendingResumeSec, max(0, dur - 10))
                        self.pendingResumeSec = 0
                        self.seek(to: target)
                    }
                case .failed:
                    if let ep = self.currentEpisode {
                        self.tryFailover(for: ep, reason: obs.error?.localizedDescription ?? "Lỗi phát HLS")
                    }
                default: break
                }
            }
        }

        bufferObserver = item.observe(\.isPlaybackLikelyToKeepUp, options: [.new]) { [weak self] obs, _ in
            Task { @MainActor in
                self?.isBuffering = !obs.isPlaybackLikelyToKeepUp
            }
        }

        timeObserver = player.addPeriodicTimeObserver(forInterval: CMTime(seconds: 0.5, preferredTimescale: 600), queue: .main) { [weak self] t in
            Task { @MainActor in
                guard let self = self else { return }
                let sec = t.seconds
                guard sec.isFinite else { return }
                self.currentTime = sec
                if let dur = self.player.currentItem?.duration.seconds, dur.isFinite && dur > 0 { self.duration = dur }
                self.evaluateMarkers(at: sec)
                if sec > 5 && abs(sec - self.lastSavedSec) >= 12, let ep = self.currentEpisode {
                    self.lastSavedSec = sec
                    AppState.shared.recordProgress(movie: self.movie, episodeIndex: self.episodeIndex, episodeName: ep.name, currentTime: sec, duration: self.duration)
                }
            }
        }

        endObserver = NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { [weak self] _ in
            Task { @MainActor in
                guard let self = self else { return }
                self.isPlaying = false
                if AppPreferences.shared.autoNextEpisode && self.hasNextEpisode {
                    self.nextEpisode()
                }
            }
        }
    }

    private func evaluateMarkers(at sec: Double) {
        let prefs = AppPreferences.shared
        var introFound: AdMarker?
        var outroFound: AdMarker?
        for m in adMarkers {
            let end = (m.openEnd == true && duration > m.start) ? duration : m.end
            guard end > m.start else { continue }
            let mode = m.mode ?? (m.type == "ad" ? "cut" : "skip")
            if mode == "cut" && prefs.autoCutAds && !skippedIds.contains(m.id) && sec >= m.start && sec < end {
                skippedIds.insert(m.id)
                seek(to: end + 0.1)
                showToast("Đã bỏ qua quảng cáo")
                return
            }
            if mode == "skip" && m.type != "outro" && prefs.introSkipBehavior != .off && sec >= m.start && sec < end - 0.5 {
                if prefs.introSkipBehavior == .auto && !skippedIds.contains(m.id) {
                    skippedIds.insert(m.id)
                    undoSkipTime = sec
                    seek(to: end + 0.1)
                    return
                } else if !dismissedIds.contains(m.id) && !skippedIds.contains(m.id) {
                    introFound = m
                }
            }
            if m.type == "outro" && prefs.introSkipBehavior != .off && sec >= m.start && sec < end - 0.5 && !dismissedIds.contains(m.id) {
                outroFound = m
            }
        }
        activeSkipPrompt = introFound
        activeOutroPrompt = outroFound
    }

    func skipMarker(_ m: AdMarker) {
        let end = (m.openEnd == true && duration > m.start) ? duration : m.end
        skippedIds.insert(m.id)
        undoSkipTime = currentTime
        activeSkipPrompt = nil
        activeOutroPrompt = nil
        seek(to: end + 0.1)
        showToast("Đã bỏ qua")
    }

    func togglePlayPause() {
        if isPlaying { player.pause(); isPlaying = false }
        else { player.play(); player.rate = playbackRate; isPlaying = true }
    }

    func seek(to seconds: Double) {
        let clamped = max(0, min(seconds, duration > 0 ? duration : seconds))
        player.seek(to: CMTime(seconds: clamped, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        currentTime = clamped
    }

    func setRate(_ rate: Float) {
        playbackRate = rate
        if isPlaying { player.rate = rate }
    }

    func previousEpisode() {
        guard hasPreviousEpisode else { return }
        episodeIndex -= 1
        pendingResumeSec = 0
        loadCurrentEpisode()
    }

    func nextEpisode() {
        guard hasNextEpisode else { return }
        episodeIndex += 1
        pendingResumeSec = 0
        loadCurrentEpisode()
    }

    func switchSource() {
        guard let ep = currentEpisode else { return }
        usingCleanSource.toggle()
        pendingResumeSec = currentTime
        startStream(for: ep, useClean: usingCleanSource)
    }

    func showToast(_ msg: String) {
        statusToast = msg
        Task {
            try? await Task.sleep(nanoseconds: 2_200_000_000)
            if self.statusToast == msg { self.statusToast = nil }
        }
    }

    func stop() {
        cleanupObservers()
        player.pause()
        player.replaceCurrentItem(with: nil)
    }

    private func cleanupObservers() {
        stallTimer?.cancel()
        if let obs = timeObserver { player.removeTimeObserver(obs); timeObserver = nil }
        statusObserver?.invalidate(); statusObserver = nil
        bufferObserver?.invalidate(); bufferObserver = nil
        if let end = endObserver { NotificationCenter.default.removeObserver(end); endObserver = nil }
    }

    static func formatTime(_ sec: Double) -> String {
        guard sec.isFinite && sec >= 0 else { return "00:00" }
        let total = Int(sec)
        let h = total / 3600
        let m = (total % 3600) / 60
        let s = total % 60
        return h > 0 ? String(format: "%d:%02d:%02d", h, m, s) : String(format: "%02d:%02d", m, s)
    }
}

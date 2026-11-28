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

struct SubtitleTrackOption: Identifiable, Hashable {
    let id: String
    let name: String
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
    @Published var bufferedDuration: Double = 0
    @Published var playbackRate: Float = 1.0
    @Published var isMuted: Bool = false
    @Published var volume: Double = 1.0
    @Published var currentSourceLabel: String = "Chuẩn"
    @Published var adMarkers: [AdMarker] = []
    @Published var activeSkipPrompt: AdMarker?
    @Published var activeOutroPrompt: AdMarker?
    @Published var undoSkipTime: Double?
    @Published var statusToast: String?
    @Published var aspectMode: PlayerAspectMode = .fitSafe
    @Published var outputDeviceName: String = "Loa MacBook / Hệ thống"
    @Published var availableSubtitles: [SubtitleTrackOption] = []
    @Published var selectedSubtitleId: String = "off"
    @Published var hasEngSub: Bool = false
    private var subtitleOptionsMap: [String: AVMediaSelectionOption] = [:]

    var currentSubtitleShortLabel: String {
        if selectedSubtitleId == "off" { return "Phụ đề" }
        if let cur = availableSubtitles.first(where: { $0.id == selectedSubtitleId }) {
            if cur.name == "Tiếng Việt" { return "Sub: VI" }
            if cur.name == "English" { return "Sub: EN" }
            return cur.name
        }
        return "Phụ đề"
    }

    func selectSubtitle(id: String) {
        guard let item = player.currentItem,
              let group = item.asset.mediaSelectionGroup(forMediaCharacteristic: .legible) else {
            showToast("Tập này không có phụ đề rời")
            return
        }
        if id == "off" {
            item.select(nil, in: group)
            selectedSubtitleId = "off"
            showToast("Đã tắt phụ đề")
        } else if let avOpt = subtitleOptionsMap[id] {
            item.select(avOpt, in: group)
            selectedSubtitleId = id
            let lbl = availableSubtitles.first(where: { $0.id == id })?.name ?? "Phụ đề"
            showToast("Phụ đề: \(lbl)")
        }
    }

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
    private var triedServerIndices: Set<Int> = []
    private var lastSavedSec: Double = -999
    private var pendingResumeSec: Double

    init(movie: MovieDetail, servers: [EpisodeServer], serverIndex: Int, episodeIndex: Int, resumeTime: Double) {
        self.movie = movie
        self.servers = servers
        self.serverIndex = serverIndex
        self.episodeIndex = episodeIndex
        self.pendingResumeSec = resumeTime
        self.volume = min(max(AppPreferences.shared.comfortGain, 0.25), 1.0)
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

    func loadCurrentEpisode(resetFailover: Bool = true) {
        cleanupObservers()
        isFailed = false
        errorMessage = ""
        isBuffering = true
        activeSkipPrompt = nil
        activeOutroPrompt = nil
        skippedIds.removeAll()
        dismissedIds.removeAll()
        didFailover = false
        if resetFailover {
            triedServerIndices = [serverIndex]
        } else {
            triedServerIndices.insert(serverIndex)
        }
        availableSubtitles = []
        subtitleOptionsMap = [:]
        selectedSubtitleId = "off"
        hasEngSub = false

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
        let isVsmov = raw.contains("#vsmov.m3u8")
        let resolved: URL? = useClean
            ? ManiFlixAPI.shared.cleanM3U8URL(from: raw)
            : (isVsmov ? ManiFlixAPI.shared.cleanM3U8URL(from: raw, extraParams: ["ap": "1"]) : URL(string: raw))
        currentSourceLabel = useClean ? "Chuẩn" : (isVsmov ? "Dự phòng (Proxy)" : "Dự phòng")
        guard let url = resolved else {
            isFailed = true; isBuffering = false; errorMessage = "URL không hợp lệ."; return
        }

        let asset = AVURLAsset(url: url, options: [
            "AVURLAssetHTTPHeaderFieldsKey": ["User-Agent": "ManiFlix-macOS/2.0.3"]
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
            try? await Task.sleep(nanoseconds: 18_000_000_000)
            guard !Task.isCancelled, let self = self else { return }
            if self.isBuffering && self.currentTime < 0.5 {
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
        player.volume = Float(min(max(volume, 0.0), 1.0))
        player.isMuted = isMuted
    }

    private func nextUntriedServerIndex() -> Int? {
        guard !servers.isEmpty else { return nil }
        for offset in 1..<servers.count {
            let idx = (serverIndex + offset) % servers.count
            if !triedServerIndices.contains(idx),
               servers[idx].server_data.contains(where: { !($0.link_m3u8?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ?? true) }) {
                return idx
            }
        }
        return nil
    }

    private func tryFailover(for ep: EpisodeItem, reason: String) {
        let raw = ep.link_m3u8?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        if !didFailover && !raw.contains("/api/") {
            didFailover = true
            usingCleanSource.toggle()
            showToast(usingCleanSource ? "Đổi sang nguồn lọc quảng cáo" : "Đổi sang nguồn gốc")
            startStream(for: ep, useClean: usingCleanSource)
            return
        }

        if let nextSrvIdx = nextUntriedServerIndex() {
            triedServerIndices.insert(nextSrvIdx)
            let curEpSlug = ep.slug
            let curEpName = ep.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let nextList = servers[nextSrvIdx].server_data
            let matchedEpIdx: Int = {
                if !curEpSlug.isEmpty,
                   let idx = nextList.firstIndex(where: { $0.slug == curEpSlug && !($0.link_m3u8?.isEmpty ?? true) }) {
                    return idx
                }
                if !curEpName.isEmpty,
                   let idx = nextList.firstIndex(where: { $0.name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() == curEpName && !($0.link_m3u8?.isEmpty ?? true) }) {
                    return idx
                }
                let clamped = min(episodeIndex, max(0, nextList.count - 1))
                if !(nextList[safe: clamped]?.link_m3u8?.isEmpty ?? true) {
                    return clamped
                }
                return nextList.firstIndex(where: { !($0.link_m3u8?.isEmpty ?? true) }) ?? clamped
            }()

            if currentTime > 3 {
                pendingResumeSec = currentTime
            }
            serverIndex = nextSrvIdx
            episodeIndex = matchedEpIdx
            showToast("Đang chuyển sang \(servers[nextSrvIdx].server_name)...")
            loadCurrentEpisode(resetFailover: false)
            return
        }

        isFailed = true
        isBuffering = false
        errorMessage = reason
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
                    if let group = obs.asset.mediaSelectionGroup(forMediaCharacteristic: .legible) {
                        var opts: [SubtitleTrackOption] = []
                        var map: [String: AVMediaSelectionOption] = [:]
                        for (idx, opt) in group.options.enumerated() {
                            let code = (opt.locale?.language.languageCode?.identifier ?? opt.extendedLanguageTag ?? "").lowercased()
                            let rawTitle = opt.displayName
                            let lower = rawTitle.lowercased()
                            let isVi = code.hasPrefix("vi") || lower.contains("việt") || lower.contains("viet")
                            let isEn = code.hasPrefix("en") || lower.contains("english") || lower.contains("anh")
                            let cleanName = isVi ? "Tiếng Việt" : (isEn ? "English" : rawTitle)
                            let id = "\(idx)_\(code.isEmpty ? cleanName : code)"
                            opts.append(SubtitleTrackOption(id: id, name: cleanName))
                            map[id] = opt
                        }
                        let viEn = opts.filter { $0.name == "Tiếng Việt" || $0.name == "English" }
                        self.availableSubtitles = viEn.isEmpty ? opts : viEn
                        self.subtitleOptionsMap = map
                        let allViOnly = !opts.isEmpty && opts.allSatisfy { $0.name == "Tiếng Việt" }
                        self.hasEngSub = opts.contains(where: { $0.name == "English" }) ||
                            (!allViOnly && !opts.isEmpty && (self.movie.sub_langs ?? []).contains(where: { $0.lowercased().hasPrefix("en") }))

                        let pref = AppPreferences.shared.defaultSubtitleLang.lowercased()
                        if pref == "off" {
                            obs.select(nil, in: group)
                            self.selectedSubtitleId = "off"
                        } else {
                            let targetName = pref == "en" ? "English" : "Tiếng Việt"
                            let chosen = self.availableSubtitles.first(where: { $0.name == targetName }) ?? self.availableSubtitles.first
                            if let chosen = chosen, let avOpt = map[chosen.id] {
                                obs.select(avOpt, in: group)
                                self.selectedSubtitleId = chosen.id
                            } else {
                                obs.select(nil, in: group)
                                self.selectedSubtitleId = "off"
                            }
                        }
                    } else {
                        self.availableSubtitles = []
                        self.subtitleOptionsMap = [:]
                        self.selectedSubtitleId = "off"
                        self.hasEngSub = false
                    }
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
                if let range = self.player.currentItem?.loadedTimeRanges.first?.timeRangeValue {
                    let end = CMTimeGetSeconds(range.start) + CMTimeGetSeconds(range.duration)
                    if end.isFinite { self.bufferedDuration = end }
                }
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
                seek(to: end + 0.1, programmatic: true)
                showToast("Đã bỏ qua quảng cáo")
                return
            }
            if mode == "skip" && m.type != "outro" && prefs.introSkipBehavior != .off && sec >= m.start && sec < end {
                if prefs.introSkipBehavior == .auto && !skippedIds.contains(m.id) {
                    skippedIds.insert(m.id)
                    undoSkipTime = sec
                    seek(to: end + 0.1, programmatic: true)
                    return
                } else if !dismissedIds.contains(m.id) && !skippedIds.contains(m.id) {
                    introFound = m
                }
            }
            if m.type == "outro" && prefs.introSkipBehavior != .off && sec >= m.start && sec < end && !dismissedIds.contains(m.id) {
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
        seek(to: end + 0.1, programmatic: true)
        showToast("Đã bỏ qua")
    }

    func togglePlayPause() {
        if isPlaying { player.pause(); isPlaying = false }
        else { player.play(); player.rate = playbackRate; isPlaying = true }
    }

    func toggleMute() {
        isMuted.toggle()
        player.isMuted = isMuted
        showToast(isMuted ? "Đã tắt tiếng" : "Đã bật tiếng")
    }

    func setVolume(_ value: Double) {
        let clamped = min(max(value, 0.0), 1.0)
        volume = clamped
        player.volume = Float(clamped)
        if clamped > 0 && isMuted {
            isMuted = false
            player.isMuted = false
        }
    }

    func seekRelative(_ delta: Double) {
        seek(to: currentTime + delta)
        let label = delta >= 0 ? "+\(Int(delta))s" : "\(Int(delta))s"
        showToast(label)
    }

    func seek(to seconds: Double, programmatic: Bool = false) {
        let clamped = max(0, min(seconds, duration > 0 ? duration : seconds))
        player.seek(to: CMTime(seconds: clamped, preferredTimescale: 600), toleranceBefore: .zero, toleranceAfter: .zero)
        currentTime = clamped
        if !programmatic {
            for m in adMarkers {
                let end = (m.openEnd == true && duration > m.start) ? duration : m.end
                let mode = m.mode ?? (m.type == "ad" ? "cut" : "skip")
                if mode == "skip" && clamped >= m.start && clamped < end {
                    skippedIds.remove(m.id)
                    dismissedIds.remove(m.id)
                }
            }
            evaluateMarkers(at: clamped)
        }
    }

    func setRate(_ rate: Float) {
        playbackRate = rate
        if isPlaying { player.rate = rate }
    }

    func selectEpisode(serverIndex: Int, episodeIndex: Int) {
        guard servers.indices.contains(serverIndex),
              servers[serverIndex].server_data.indices.contains(episodeIndex) else { return }
        self.serverIndex = serverIndex
        self.episodeIndex = episodeIndex
        self.pendingResumeSec = AppState.shared.history.first(where: {
            $0.slug == movie.slug && $0.episodeIndex == episodeIndex
        })?.currentTime ?? 0
        loadCurrentEpisode()
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

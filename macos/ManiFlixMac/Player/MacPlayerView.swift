import SwiftUI
import AVKit
import AppKit

struct MacPlayerSurface: NSViewRepresentable {
    let player: AVPlayer
    let aspectMode: PlayerAspectMode

    func makeNSView(context: Context) -> AVPlayerView {
        let v = AVPlayerView()
        v.player = player
        v.controlsStyle = .none
        v.videoGravity = aspectMode.layerGravity
        return v
    }

    func updateNSView(_ nsView: AVPlayerView, context: Context) {
        if nsView.player !== player { nsView.player = player }
        nsView.videoGravity = aspectMode.layerGravity
    }
}

struct MacPlayerView: View {
    @ObservedObject var engine: MacPlayerEngine
    @ObservedObject private var appState = AppState.shared
    @ObservedObject private var prefs = AppPreferences.shared

    @State private var controlsVisible = true
    @State private var hideTask: Task<Void, Never>?
    @State private var showEpisodeDrawer = false
    @State private var drawerServerIndex = 0
    @State private var drawerSearchQuery = ""
    @State private var isScrubbing = false
    @State private var scrubTargetSec: Double = 0
    @State private var keyMonitor: Any?

    private var displayedTime: Double {
        isScrubbing ? scrubTargetSec : engine.currentTime
    }

    private var showOverlay: Bool {
        controlsVisible || !engine.isPlaying || showEpisodeDrawer || isScrubbing || engine.isFailed
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            MacPlayerSurface(player: engine.player, aspectMode: engine.aspectMode)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .contentShape(Rectangle())
                .onTapGesture(count: 2) {
                    NSApp.keyWindow?.toggleFullScreen(nil)
                    revealControls()
                }
                .onTapGesture {
                    if showEpisodeDrawer {
                        withAnimation(.easeInOut(duration: 0.2)) { showEpisodeDrawer = false }
                    } else if controlsVisible && engine.isPlaying {
                        withAnimation(.easeInOut(duration: 0.2)) { controlsVisible = false }
                    } else {
                        revealControls()
                    }
                }

            if engine.isBuffering && !engine.isFailed {
                ProgressView()
                    .tint(prefs.currentAccentColor)
                    .scaleEffect(1.3)
                    .allowsHitTesting(false)
            }

            if engine.isFailed {
                VStack(spacing: 12) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.title)
                        .foregroundColor(prefs.currentAccentColor)
                    Text(engine.errorMessage)
                        .foregroundColor(.white)
                    Button("Thử lại") { engine.loadCurrentEpisode() }
                        .buttonStyle(.borderedProminent)
                        .tint(prefs.currentAccentColor)
                }
                .padding(24)
                .adaptiveGlassCard(cornerRadius: 16)
            }

            if let toast = engine.statusToast {
                VStack {
                    Text(toast)
                        .font(.caption.weight(.semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .adaptiveGlassCapsule(interactive: false)
                        .padding(.top, showOverlay ? 72 : 20)
                    Spacer()
                }
                .allowsHitTesting(false)
                .animation(.easeInOut(duration: 0.2), value: showOverlay)
            }

            if let skip = engine.activeSkipPrompt ?? engine.activeOutroPrompt {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button {
                            engine.skipMarker(skip)
                            revealControls()
                        } label: {
                            HStack(spacing: 6) {
                                Text(skip.type == "outro" ? "Bỏ qua kết thúc" : (skip.label ?? "Bỏ qua mở đầu"))
                                Image(systemName: "arrow.right")
                            }
                            .font(.subheadline.weight(.bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 16).padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                        .adaptiveGlassCapsule(interactive: true, tint: prefs.currentAccentColor)
                        .padding(.trailing, showEpisodeDrawer ? 330 : 24)
                        .padding(.bottom, showOverlay ? 114 : 24)
                    }
                }
                .animation(.easeInOut(duration: 0.22), value: showOverlay)
            }

            VStack {
                topBar
                Spacer()
                bottomControlsBar
            }
            .opacity(showOverlay ? 1 : 0)
            .allowsHitTesting(showOverlay)
            .animation(.easeInOut(duration: 0.25), value: showOverlay)

            if showEpisodeDrawer {
                HStack(spacing: 0) {
                    Spacer()
                    episodeDrawerSidebar
                        .transition(.move(edge: .trailing).combined(with: .opacity))
                }
            }
        }
        .frame(minWidth: 740, minHeight: 460)
        .onContinuousHover { phase in
            switch phase {
            case .active:
                revealControls()
            case .ended:
                scheduleAutoHide()
            }
        }
        .onAppear {
            drawerServerIndex = engine.serverIndex
            revealControls()
            installKeyMonitor()
        }
        .onDisappear {
            hideTask?.cancel()
            removeKeyMonitor()
        }
        .onChange(of: engine.isPlaying) { _, playing in
            if playing { scheduleAutoHide() }
            else {
                hideTask?.cancel()
                controlsVisible = true
            }
        }
        .onChange(of: engine.serverIndex) { _, newIdx in
            drawerServerIndex = newIdx
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            Button {
                appState.stopPlayback()
            } label: {
                Label("Đóng", systemImage: "xmark.circle.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundColor(.white)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text("\(engine.movie.name) — \(engine.currentEpisode?.name ?? "")")
                    .font(.headline)
                    .foregroundColor(.white)
                    .lineLimit(1)
                Text("Nguồn: \(engine.currentSourceLabel) • \(prefs.spatialAudioMode.badge) • \(engine.outputDeviceName)")
                    .font(.caption2)
                    .foregroundColor(Color.white.opacity(0.72))
                    .lineLimit(1)
            }

            Spacer()

            Button {
                withAnimation(.easeInOut(duration: 0.22)) {
                    showEpisodeDrawer.toggle()
                }
                revealControls()
            } label: {
                Label("Tập & Nguồn", systemImage: "list.bullet.rectangle")
                    .font(.caption.weight(.semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 11).padding(.vertical, 6)
            }
            .buttonStyle(.plain)
            .adaptiveGlassCapsule(interactive: true, tint: showEpisodeDrawer ? prefs.currentAccentColor : nil)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.84), Color.black.opacity(0.0)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    private var bottomControlsBar: some View {
        VStack(spacing: 10) {
            scrubberRow

            HStack(spacing: 12) {
                Button {
                    engine.togglePlayPause()
                    revealControls()
                } label: {
                    Image(systemName: engine.isPlaying ? "pause.fill" : "play.fill")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundColor(.white)
                        .frame(width: 34, height: 34)
                }
                .buttonStyle(.plain)
                .help("Phát / Tạm dừng (Space)")

                Button {
                    engine.seekRelative(-10)
                    revealControls()
                } label: {
                    Image(systemName: "gobackward.10")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 30, height: 30)
                }
                .buttonStyle(.plain)
                .help("Lùi 10 giây (Mũi tên trái)")

                Button {
                    engine.seekRelative(10)
                    revealControls()
                } label: {
                    Image(systemName: "goforward.10")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundColor(.white)
                        .frame(width: 30, height: 30)
                }
                .buttonStyle(.plain)
                .help("Tua 10 giây (Mũi tên phải)")

                Button {
                    engine.previousEpisode()
                    revealControls()
                } label: {
                    Image(systemName: "backward.end.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(engine.hasPreviousEpisode ? .white : .gray)
                        .frame(width: 28, height: 28)
                }
                .buttonStyle(.plain)
                .disabled(!engine.hasPreviousEpisode)

                Button {
                    engine.nextEpisode()
                    revealControls()
                } label: {
                    Image(systemName: "forward.end.fill")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(engine.hasNextEpisode ? .white : .gray)
                        .frame(width: 28, height: 28)
                }
                .buttonStyle(.plain)
                .disabled(!engine.hasNextEpisode)

                HStack(spacing: 6) {
                    Button {
                        engine.toggleMute()
                        revealControls()
                    } label: {
                        Image(systemName: engine.isMuted || engine.volume <= 0.01 ? "speaker.slash.fill" : "speaker.wave.2.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(.white)
                            .frame(width: 26, height: 26)
                    }
                    .buttonStyle(.plain)
                    .help("Tắt / Bật tiếng (M)")

                    Slider(
                        value: Binding(
                            get: { engine.isMuted ? 0 : engine.volume },
                            set: { engine.setVolume($0); revealControls() }
                        ),
                        in: 0...1
                    )
                    .frame(width: 78)
                    .tint(prefs.currentAccentColor)
                }

                Spacer()

                Text("\(MacPlayerEngine.formatTime(displayedTime)) / \(MacPlayerEngine.formatTime(engine.duration))")
                    .font(.caption.monospacedDigit())
                    .foregroundColor(Color.white.opacity(0.86))

                Menu {
                    if engine.availableSubtitles.isEmpty {
                        Text("Không có phụ đề rời")
                    } else {
                        ForEach(engine.availableSubtitles) { sub in
                            Button {
                                engine.selectSubtitle(id: sub.id)
                                revealControls()
                            } label: {
                                HStack {
                                    Text(sub.name)
                                    if engine.selectedSubtitleId == sub.id { Image(systemName: "checkmark") }
                                }
                            }
                        }
                        Divider()
                        Button {
                            engine.selectSubtitle(id: "off")
                            revealControls()
                        } label: {
                            HStack {
                                Text("Tắt phụ đề")
                                if engine.selectedSubtitleId == "off" { Image(systemName: "checkmark") }
                            }
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: engine.selectedSubtitleId == "off" ? "captions.bubble" : "captions.bubble.fill")
                        Text(engine.currentSubtitleShortLabel)
                    }
                    .font(.caption.weight(.medium))
                    .foregroundColor(.white)
                    .padding(.horizontal, 9).padding(.vertical, 5)
                }
                .menuStyle(.borderlessButton)
                .adaptiveGlassCapsule(interactive: true)

                Menu {
                    ForEach(PlayerAspectMode.allCases) { m in
                        Button {
                            engine.aspectMode = m
                            revealControls()
                        } label: {
                            HStack {
                                Text(m.title)
                                if engine.aspectMode == m { Image(systemName: "checkmark") }
                            }
                        }
                    }
                } label: {
                    Text(engine.aspectMode.title)
                        .font(.caption.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 9).padding(.vertical, 5)
                }
                .menuStyle(.borderlessButton)
                .adaptiveGlassCapsule(interactive: true)

                Menu {
                    ForEach([0.75, 1.0, 1.25, 1.5, 2.0], id: \.self) { r in
                        Button("\(String(format: "%.2gx", r))") {
                            engine.setRate(Float(r))
                            revealControls()
                        }
                    }
                } label: {
                    Text("\(String(format: "%.2gx", engine.playbackRate))")
                        .font(.caption.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 9).padding(.vertical, 5)
                }
                .menuStyle(.borderlessButton)
                .adaptiveGlassCapsule(interactive: true)

                Button {
                    engine.switchSource()
                    revealControls()
                } label: {
                    Text("Đổi nguồn")
                        .font(.caption.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10).padding(.vertical, 5)
                }
                .buttonStyle(.plain)
                .adaptiveGlassCapsule(interactive: true)
            }
        }
        .padding(.horizontal, 18)
        .padding(.top, 22)
        .padding(.bottom, 14)
        .background(
            LinearGradient(
                colors: [Color.black.opacity(0.0), Color.black.opacity(0.86)],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }

    private var scrubberRow: some View {
        GeometryReader { geo in
            let w = max(1, geo.size.width)
            let dur = max(1, engine.duration)
            let playedRatio = min(max(displayedTime / dur, 0), 1)
            let bufferedRatio = min(max(engine.bufferedDuration / dur, 0), 1)

            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color.white.opacity(0.22))
                    .frame(height: 5)

                Capsule()
                    .fill(Color.white.opacity(0.42))
                    .frame(width: w * bufferedRatio, height: 5)

                Capsule()
                    .fill(prefs.currentAccentColor)
                    .frame(width: w * playedRatio, height: 5)

                ForEach(engine.adMarkers) { marker in
                    let startRatio = min(max(marker.start / dur, 0), 1)
                    RoundedRectangle(cornerRadius: 1)
                        .fill(marker.type == "ad" ? Color.yellow : Color.cyan)
                        .frame(width: 3, height: 9)
                        .offset(x: w * startRatio)
                }

                Circle()
                    .fill(Color.white)
                    .frame(width: isScrubbing ? 14 : 11, height: isScrubbing ? 14 : 11)
                    .shadow(color: Color.black.opacity(0.4), radius: 3)
                    .offset(x: max(0, min(w - 12, w * playedRatio - 6)))
            }
            .frame(height: 18)
            .contentShape(Rectangle())
            .gesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { value in
                        isScrubbing = true
                        let ratio = min(max(value.location.x / w, 0), 1)
                        scrubTargetSec = ratio * dur
                        revealControls()
                    }
                    .onEnded { value in
                        let ratio = min(max(value.location.x / w, 0), 1)
                        let target = ratio * dur
                        isScrubbing = false
                        engine.seek(to: target)
                        revealControls()
                    }
            )
        }
        .frame(height: 18)
    }

    private var episodeDrawerSidebar: some View {
        let activeSrv = engine.servers[safe: drawerServerIndex] ?? engine.servers.first
        let trimmed = drawerSearchQuery.trimmingCharacters(in: .whitespacesAndNewlines)
        let enumeratedEps = Array((activeSrv?.server_data ?? []).enumerated()).filter { _, ep in
            trimmed.isEmpty || ep.name.localizedCaseInsensitiveContains(trimmed)
        }

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("Danh sách tập")
                    .font(.headline)
                    .foregroundColor(.white)
                Spacer()
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { showEpisodeDrawer = false }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.title3)
                        .foregroundColor(Color.white.opacity(0.75))
                }
                .buttonStyle(.plain)
            }

            if !engine.servers.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 6) {
                        ForEach(Array(engine.servers.enumerated()), id: \.offset) { idx, srv in
                            let selected = drawerServerIndex == idx
                            Button {
                                drawerServerIndex = idx
                                revealControls()
                            } label: {
                                Text(srv.server_name)
                                    .font(.caption.weight(.semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 10).padding(.vertical, 6)
                            }
                            .buttonStyle(.plain)
                            .adaptiveGlassCapsule(interactive: true, tint: selected ? prefs.currentAccentColor : nil)
                        }
                    }
                }
            }

            if (activeSrv?.server_data.count ?? 0) > 6 {
                HStack(spacing: 6) {
                    Image(systemName: "magnifyingglass")
                        .font(.caption)
                        .foregroundColor(Color.white.opacity(0.65))
                    TextField("Tìm tập...", text: $drawerSearchQuery)
                        .textFieldStyle(.plain)
                        .font(.caption)
                        .foregroundColor(.white)
                    if !drawerSearchQuery.isEmpty {
                        Button { drawerSearchQuery = "" } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.caption)
                                .foregroundColor(Color.white.opacity(0.65))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 10).padding(.vertical, 7)
                .background(Color.white.opacity(0.10))
                .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
            }

            ScrollView {
                LazyVGrid(columns: [GridItem(.adaptive(minimum: 68), spacing: 8)], spacing: 8) {
                    ForEach(enumeratedEps, id: \.offset) { epIdx, ep in
                        let isCurrent = drawerServerIndex == engine.serverIndex && epIdx == engine.episodeIndex
                        Button {
                            engine.selectEpisode(serverIndex: drawerServerIndex, episodeIndex: epIdx)
                            revealControls()
                        } label: {
                            Text(ep.name)
                                .font(.caption.weight(isCurrent ? .bold : .medium))
                                .foregroundColor(.white)
                                .lineLimit(1)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 8)
                        }
                        .buttonStyle(.plain)
                        .adaptiveGlassCard(cornerRadius: 8, interactive: true, tint: isCurrent ? prefs.currentAccentColor : nil)
                    }
                }
            }
        }
        .padding(16)
        .frame(width: 310)
        .frame(maxHeight: .infinity)
        .background(Color.black.opacity(0.84))
        .overlay(
            Rectangle()
                .fill(Color.white.opacity(0.12))
                .frame(width: 1),
            alignment: .leading
        )
    }

    private func revealControls() {
        controlsVisible = true
        scheduleAutoHide()
    }

    private func scheduleAutoHide() {
        hideTask?.cancel()
        guard engine.isPlaying && !showEpisodeDrawer && !isScrubbing else { return }
        hideTask = Task {
            try? await Task.sleep(nanoseconds: 3_000_000_000)
            guard !Task.isCancelled else { return }
            if engine.isPlaying && !showEpisodeDrawer && !isScrubbing {
                controlsVisible = false
            }
        }
    }

    private func installKeyMonitor() {
        removeKeyMonitor()
        keyMonitor = NSEvent.addLocalMonitorForEvents(matching: .keyDown) { event in
            if event.window?.firstResponder is NSTextView {
                return event
            }
            let key = event.charactersIgnoringModifiers?.lowercased() ?? ""
            switch event.keyCode {
            case 49: // Space
                Task { @MainActor in
                    engine.togglePlayPause()
                    revealControls()
                }
                return nil
            case 123: // Left Arrow
                Task { @MainActor in
                    engine.seekRelative(-10)
                    revealControls()
                }
                return nil
            case 124: // Right Arrow
                Task { @MainActor in
                    engine.seekRelative(10)
                    revealControls()
                }
                return nil
            case 53: // Escape
                Task { @MainActor in
                    if showEpisodeDrawer {
                        withAnimation(.easeInOut(duration: 0.2)) { showEpisodeDrawer = false }
                    } else {
                        appState.stopPlayback()
                    }
                }
                return nil
            default:
                if key == "m" {
                    Task { @MainActor in
                        engine.toggleMute()
                        revealControls()
                    }
                    return nil
                }
                return event
            }
        }
    }

    private func removeKeyMonitor() {
        if let monitor = keyMonitor {
            NSEvent.removeMonitor(monitor)
            keyMonitor = nil
        }
    }
}

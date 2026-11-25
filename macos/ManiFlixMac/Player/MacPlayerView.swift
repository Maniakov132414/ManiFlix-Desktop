import SwiftUI
import AVKit

struct MacPlayerSurface: NSViewRepresentable {
    let player: AVPlayer
    let aspectMode: PlayerAspectMode

    func makeNSView(context: Context) -> AVPlayerView {
        let v = AVPlayerView()
        v.player = player
        v.controlsStyle = .inline
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

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack(spacing: 0) {
                HStack(spacing: 12) {
                    Button {
                        appState.stopPlayback()
                    } label: {
                        Label("Đóng", systemImage: "xmark.circle.fill")
                            .font(.subheadline.weight(.semibold))
                    }
                    .buttonStyle(.plain).foregroundColor(.white)

                    VStack(alignment: .leading, spacing: 1) {
                        Text("\(engine.movie.name) — \(engine.currentEpisode?.name ?? "")")
                            .font(.headline).foregroundColor(.white).lineLimit(1)
                        Text("Nguồn: \(engine.currentSourceLabel) • \(prefs.spatialAudioMode.badge) • \(engine.outputDeviceName)")
                            .font(.caption2).foregroundColor(.gray).lineLimit(1)
                    }
                    Spacer()

                    Picker("Tỉ lệ", selection: $engine.aspectMode) {
                        ForEach(PlayerAspectMode.allCases) { m in Text(m.title).tag(m) }
                    }
                    .frame(width: 110)

                    Menu("Tốc độ \(String(format: "%.2gx", engine.playbackRate))") {
                        ForEach([0.75, 1.0, 1.25, 1.5, 2.0], id: \.self) { r in
                            Button("\(String(format: "%.2gx", r))") { engine.setRate(Float(r)) }
                        }
                    }

                    Button("Đổi nguồn") { engine.switchSource() }
                    Button("⏮") { engine.previousEpisode() }.disabled(!engine.hasPreviousEpisode)
                    Button("⏭") { engine.nextEpisode() }.disabled(!engine.hasNextEpisode)
                }
                .padding(.horizontal, 16).padding(.vertical, 10)
                .background(Color.black.opacity(0.85))

                ZStack(alignment: .bottomTrailing) {
                    MacPlayerSurface(player: engine.player, aspectMode: engine.aspectMode)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)

                    if engine.isBuffering {
                        ProgressView().tint(prefs.currentAccentColor).scaleEffect(1.3)
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }

                    if engine.isFailed {
                        VStack(spacing: 10) {
                            Text(engine.errorMessage).foregroundColor(.white)
                            Button("Thử lại") { engine.loadCurrentEpisode() }
                                .buttonStyle(.borderedProminent).tint(prefs.currentAccentColor)
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }

                    if let skip = engine.activeSkipPrompt ?? engine.activeOutroPrompt {
                        Button {
                            engine.skipMarker(skip)
                        } label: {
                            Text(skip.type == "outro" ? "Bỏ qua kết thúc →" : (skip.label ?? "Bỏ qua mở đầu →"))
                                .font(.subheadline.weight(.bold))
                                .foregroundColor(.white)
                                .padding(.horizontal, 16).padding(.vertical, 10)
                        }
                        .buttonStyle(.plain)
                        .adaptiveGlassCapsule(interactive: true, tint: prefs.currentAccentColor)
                        .padding(24)
                    }

                    if let toast = engine.statusToast {
                        Text(toast)
                            .font(.caption.weight(.semibold)).foregroundColor(.white)
                            .padding(.horizontal, 14).padding(.vertical, 8)
                            .adaptiveGlassCapsule(interactive: false)
                            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
                            .padding(.top, 16)
                    }
                }
            }
        }
        .frame(minWidth: 680, minHeight: 420)
    }
}

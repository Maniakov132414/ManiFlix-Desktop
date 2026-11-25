import SwiftUI

struct SettingsView: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @ObservedObject private var appState = AppState.shared
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        Form {
            Section("Tài khoản") {
                if appState.isLoggedIn, let user = appState.currentUser {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(user.displayName ?? user.username).font(.subheadline.weight(.semibold))
                            Text("@\(user.username)").font(.caption).foregroundColor(.secondary)
                        }
                        Spacer()
                        Button("Đăng xuất", role: .destructive) { appState.logout() }
                    }
                } else {
                    Button("Đăng nhập hoặc tạo tài khoản") { appState.showAuthSheet = true }
                }
            }

            Section("Tuỳ biến & Chẩn đoán") {
                NavigationLink(destination: ThemeSettingsView()) {
                    HStack {
                        Label("Giao diện & Chủ đề", systemImage: "paintpalette")
                        Spacer()
                        Text(prefs.themeMode.title).font(.caption).foregroundColor(.secondary)
                    }
                }
                NavigationLink(destination: DeviceMonitorView()) {
                    HStack {
                        Label("Kiểm tra mạng & Thiết bị", systemImage: "waveform.path.ecg")
                        Spacer()
                        Text("Apple Silicon / Speedtest").font(.caption).foregroundColor(.secondary)
                    }
                }
            }

            Section("Âm thanh (Spatial Audio)") {
                HStack {
                    Text("Đầu ra mặc định")
                    Spacer()
                    Text(MacPlayerEngine.queryDefaultAudioOutputName())
                        .font(.caption).foregroundColor(.secondary)
                }
                Picker("Âm thanh không gian", selection: $prefs.spatialAudioMode) {
                    ForEach(SpatialAudioMode.allCases) { mode in Text(mode.title).tag(mode) }
                }
                Picker("Xử lý cao độ khi tua", selection: $prefs.pitchAlgorithm) {
                    ForEach(AudioPitchAlgorithmMode.allCases) { alg in Text(alg.title).tag(alg) }
                }
                HStack {
                    Text("Âm lượng nội bộ (\(Int(prefs.comfortGain * 100))%)")
                    Slider(value: $prefs.comfortGain, in: 0.35...1.0, step: 0.05)
                }
            }

            Section("Trình phát") {
                Toggle("Tự cắt đoạn quảng cáo", isOn: $prefs.autoCutAds)
                Toggle("Tự chuyển tập tiếp theo", isOn: $prefs.autoNextEpisode)
                Picker("Mở đầu & kết thúc (TheIntroDB)", selection: $prefs.introSkipBehavior) {
                    ForEach(IntroSkipBehavior.allCases) { b in Text(b.title).tag(b) }
                }
                Picker("Bộ đệm tải trước", selection: $prefs.forwardBufferSeconds) {
                    Text("15 giây").tag(15.0)
                    Text("45 giây").tag(45.0)
                    Text("90 giây").tag(90.0)
                }
            }

            Section("Ứng dụng") {
                HStack {
                    Text("Phiên bản")
                    Spacer()
                    Text("1.1.0 (3)").font(.caption).foregroundColor(.secondary)
                }
                Button("Đặt lại mặc định", role: .destructive) { prefs.resetToDefaults() }
            }
        }
        .formStyle(.grouped)
        .scrollContentBackground(.hidden)
        .background(ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea())
        .navigationTitle("Cài đặt")
    }
}

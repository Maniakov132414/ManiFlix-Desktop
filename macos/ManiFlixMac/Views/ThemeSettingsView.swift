import SwiftUI

struct ThemeSettingsView: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @ObservedObject private var appState = AppState.shared
    @Environment(\.colorScheme) private var colorScheme
    @State private var isSyncing = false

    private var previewScheme: ColorScheme {
        ManiFlixTheme.isLight(colorScheme) ? .light : .dark
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                taurusLivePreviewCard

                VStack(alignment: .leading, spacing: 14) {
                    Picker("Chế độ giao diện", selection: $prefs.themeMode) {
                        ForEach(ThemeMode.allCases) { mode in Text(mode.title).tag(mode) }
                    }
                    .pickerStyle(.segmented)

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Bộ giao diện gợi ý").font(.caption.weight(.semibold)).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(ThemePreset.presets) { preset in
                                    let selected = prefs.activeThemePresetId == preset.id
                                    Button { prefs.applyPreset(preset) } label: {
                                        HStack(spacing: 7) {
                                            ZStack {
                                                Circle().fill(Color(hex: preset.bgHex)).frame(width: 18, height: 18)
                                                Circle().fill(Color(hex: preset.accentHex)).frame(width: 8, height: 8)
                                            }
                                            Text(preset.name).font(.caption.weight(selected ? .semibold : .medium))
                                                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                                        }
                                        .padding(.horizontal, 11).padding(.vertical, 7)
                                        .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(selected ? Color(hex: preset.accentHex).opacity(0.22) : ManiFlixTheme.cardFill(colorScheme)))
                                        .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(selected ? Color(hex: preset.accentHex) : ManiFlixTheme.cardStroke(colorScheme), lineWidth: 1))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    HStack(spacing: 12) {
                        Text("Màu chủ đạo").font(.subheadline)
                        Spacer()
                        ForEach(AccentPreset.allCases) { preset in
                            let selected = prefs.customAccentHex.caseInsensitiveCompare(preset.hexString) == .orderedSame
                            Button { prefs.accentPreset = preset } label: {
                                Circle().fill(preset.color).frame(width: 22, height: 22)
                                    .overlay(Circle().strokeBorder(ManiFlixTheme.primaryText(colorScheme), lineWidth: selected ? 2.2 : 0))
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    ColorPicker("Màu nhấn tuỳ chỉnh", selection: Binding(
                        get: { Color(hex: prefs.customAccentHex) },
                        set: { prefs.customAccentHex = $0.toHexString(); prefs.themeMode = .custom }
                    ), supportsOpacity: false)

                    ColorPicker("Màu nền tuỳ chỉnh", selection: Binding(
                        get: { Color(hex: prefs.customBgHex) },
                        set: { prefs.customBgHex = $0.toHexString(); prefs.themeMode = .custom }
                    ), supportsOpacity: false)

                    ColorPicker("Màu thẻ / bề mặt", selection: Binding(
                        get: { Color(hex: prefs.customSurfaceHex) },
                        set: { prefs.customSurfaceHex = $0.toHexString(); prefs.themeMode = .custom }
                    ), supportsOpacity: false)

                    Picker("Phong cách hiển thị", selection: $prefs.glassStyle) {
                        ForEach(GlassUIStyle.allCases) { st in Text(st.title).tag(st) }
                    }

                    Toggle("Ánh nền theo ảnh phim", isOn: $prefs.ambientArtworkEnabled)

                    Picker("Số cột Chế độ Điện thoại", selection: $prefs.gridColumnsPhone) {
                        Text("2 cột").tag(2)
                        Text("3 cột").tag(3)
                    }

                    if appState.isLoggedIn {
                        Button {
                            Task { isSyncing = true; _ = await appState.syncThemeToServer(); isSyncing = false }
                        } label: {
                            HStack {
                                Label("Đồng bộ lên tài khoản", systemImage: "icloud.and.arrow.up")
                                Spacer()
                                if isSyncing { ProgressView().scaleEffect(0.75) }
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(prefs.currentAccentColor)
                    }
                }
                .padding(16)
                .adaptiveGlassCard(cornerRadius: 16)
            }
            .padding(20)
            .frame(maxWidth: 740)
            .frame(maxWidth: .infinity)
        }
        .background(ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea())
        .navigationTitle("Giao diện & Chủ đề")
    }

    private var taurusLivePreviewCard: some View {
        let bg = ManiFlixTheme.background(scheme: previewScheme)
        let surf = ManiFlixTheme.surface(scheme: previewScheme)
        let txt = ManiFlixTheme.primaryText(previewScheme)
        let sub = ManiFlixTheme.secondaryText(previewScheme)
        let accent = prefs.currentAccentColor

        return VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("XEM TRƯỚC TRỰC TIẾP (TAURUS)").font(.caption2.weight(.bold)).foregroundColor(sub)
                Spacer()
                Text(prefs.themeMode.title).font(.caption2.weight(.bold)).foregroundColor(.white)
                    .padding(.horizontal, 8).padding(.vertical, 3).background(accent).clipShape(Capsule())
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("PHIM MỚI • FHD").font(.system(size: 9.5, weight: .heavy)).foregroundColor(accent)
                Text("Thanh Gươm Diệt Quỷ").font(.headline.bold()).foregroundColor(txt)
                HStack(spacing: 8) {
                    Text("▶ Xem ngay").font(.caption.weight(.bold)).foregroundColor(.white)
                        .padding(.horizontal, 12).padding(.vertical, 6).background(accent).clipShape(Capsule())
                    Text("+ Tủ phim").font(.caption.weight(.semibold)).foregroundColor(txt)
                        .padding(.horizontal, 12).padding(.vertical, 6).background(surf).clipShape(Capsule())
                }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(surf))

            HStack(spacing: 10) {
                ForEach(["Interstellar", "Dune: Part Two"], id: \.self) { name in
                    VStack(alignment: .leading, spacing: 5) {
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .fill(LinearGradient(colors: [accent.opacity(0.45), surf], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(height: 68)
                        Text(name).font(.caption.weight(.semibold)).foregroundColor(txt)
                        Text("FHD • Vietsub").font(.caption2).foregroundColor(sub)
                    }
                    .padding(8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(surf))
                }
            }

            HStack {
                Text("Trang chủ").foregroundColor(accent).fontWeight(.bold)
                Spacer()
                Text("Tìm kiếm").foregroundColor(sub)
                Spacer()
                Text("Tủ phim").foregroundColor(sub)
                Spacer()
                Text("Cài đặt").foregroundColor(sub)
            }
            .font(.caption2)
            .padding(.horizontal, 16).padding(.vertical, 8)
            .adaptiveGlassCapsule(interactive: false)
        }
        .padding(16)
        .background(RoundedRectangle(cornerRadius: 18, style: .continuous).fill(bg))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).strokeBorder(ManiFlixTheme.cardStroke(colorScheme), lineWidth: 1))
    }
}

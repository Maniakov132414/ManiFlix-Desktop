import SwiftUI
import AppKit

enum MacTab: String, CaseIterable, Identifiable {
    case discover = "Trang chủ"
    case search = "Tìm kiếm"
    case library = "Tủ phim"
    case settings = "Cài đặt"

    var id: String { rawValue }
    var icon: String {
        switch self {
        case .discover: return "play.square.stack"
        case .search: return "magnifyingglass"
        case .library: return "bookmark"
        case .settings: return "gearshape"
        }
    }
}

@main
struct ManiFlixMacApp: App {
    @StateObject private var appState = AppState.shared
    @StateObject private var prefs = AppPreferences.shared

    var body: some Scene {
        WindowGroup {
            MacRootShell()
                .preferredColorScheme(prefs.resolvedColorScheme)
                .tint(prefs.currentAccentColor)
                .task { await appState.bootstrapSession() }
                .sheet(isPresented: $appState.showAuthSheet) { AuthSheetView() }
                .sheet(isPresented: Binding(
                    get: { !prefs.hasCompletedLanguageSetup },
                    set: { if !$0 { prefs.hasCompletedLanguageSetup = true } }
                )) {
                    MacLanguageSetupSheet()
                }
                .sheet(isPresented: $appState.isPlayerPresented, onDismiss: { appState.stopPlayback() }) {
                    if let engine = appState.activeEngine {
                        MacPlayerView(engine: engine)
                            .frame(minWidth: 820, minHeight: 500)
                    }
                }
        }
        .defaultSize(width: 1200, height: 780)
        .windowStyle(.titleBar)
    }
}

struct MacRootShell: View {
    @ObservedObject private var appState = AppState.shared
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.colorScheme) private var colorScheme
    @State private var selectedTab: MacTab = .discover
    @State private var windowWidth: CGFloat = 1200

    private var isCompactPhone: Bool { appState.isPhoneMode || windowWidth < 700 }

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                if isCompactPhone {
                    NavigationStack {
                        tabContent(for: selectedTab)
                    }
                } else {
                    NavigationSplitView {
                        List(MacTab.allCases, selection: $selectedTab) { tab in
                            Label(tab.rawValue, systemImage: tab.icon)
                                .tag(tab)
                        }
                        .navigationTitle("ManiFlix")
                        .safeAreaInset(edge: .bottom) {
                            VStack(alignment: .leading, spacing: 6) {
                                Button {
                                    appState.showAuthSheet = true
                                } label: {
                                    HStack(spacing: 8) {
                                        Image(systemName: appState.isLoggedIn ? "person.crop.circle.fill" : "person.crop.circle")
                                            .foregroundColor(prefs.currentAccentColor)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(appState.currentUser?.displayName ?? appState.currentUser?.username ?? "Đăng nhập")
                                                .font(.caption.weight(.semibold))
                                            Text(appState.isLoggedIn ? "@\(appState.currentUser?.username ?? "")" : "Đồng bộ tủ phim")
                                                .font(.caption2).foregroundColor(.secondary)
                                        }
                                        Spacer()
                                    }
                                    .padding(10)
                                }
                                .buttonStyle(.plain)
                                .adaptiveGlassCard(cornerRadius: 12, interactive: true)
                            }
                            .padding(10)
                        }
                    } detail: {
                        NavigationStack {
                            tabContent(for: selectedTab)
                        }
                    }
                }
            }

            if isCompactPhone {
                phoneFloatingCapsuleBar
                    .padding(.horizontal, 14)
                    .padding(.bottom, 12)
            }

            if let banner = appState.globalBannerMessage {
                VStack {
                    Text(banner)
                        .font(.caption.weight(.semibold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                        .padding(.horizontal, 14).padding(.vertical, 8)
                        .adaptiveGlassCapsule(interactive: false)
                        .padding(.top, 10)
                    Spacer()
                }
                .allowsHitTesting(false)
            }
        }
        .readContainerWidth($windowWidth)
        .toolbar {
            ToolbarItemGroup(placement: .automatic) {
                Button {
                    appState.showAuthSheet = true
                } label: {
                    Image(systemName: appState.isLoggedIn ? "person.crop.circle.fill" : "person.crop.circle")
                }
            }
        }
    }

    @ViewBuilder
    private func tabContent(for tab: MacTab) -> some View {
        switch tab {
        case .discover: DiscoverView()
        case .search: CatalogSearchView()
        case .library: LibraryView()
        case .settings: SettingsView()
        }
    }

    private var phoneFloatingCapsuleBar: some View {
        HStack(spacing: 8) {
            HStack(spacing: 4) {
                ForEach([MacTab.discover, .library, .settings]) { tab in
                    let active = selectedTab == tab
                    Button { selectedTab = tab } label: {
                        VStack(spacing: 2) {
                            Image(systemName: tab.icon).font(.system(size: 14, weight: .semibold))
                            Text(tab.rawValue).font(.system(size: 9.5, weight: .semibold))
                        }
                        .foregroundColor(active ? prefs.currentAccentColor : ManiFlixTheme.primaryText(colorScheme))
                        .frame(maxWidth: .infinity).padding(.vertical, 7)
                        .background(active ? prefs.currentAccentColor.opacity(0.16) : Color.clear)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(5)
            .adaptiveGlassCapsule(interactive: true)

            Button { selectedTab = .search } label: {
                Image(systemName: "magnifyingglass")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundColor(selectedTab == .search ? .white : ManiFlixTheme.primaryText(colorScheme))
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .adaptiveGlassCapsule(interactive: true, tint: selectedTab == .search ? prefs.currentAccentColor : nil)
        }
    }
}

struct MacLanguageSetupSheet: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Chọn ngôn ngữ / Choose Language")
                .font(.title3.weight(.bold))
            Text("Lựa chọn sẽ tự động thiết lập ngôn ngữ giao diện và phụ đề mặc định.")
                .font(.caption)
                .foregroundColor(.secondary)

            Button {
                prefs.uiLanguage = "vi"
                prefs.defaultSubtitleLang = "vi"
                prefs.hasCompletedLanguageSetup = true
                dismiss()
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Tiếng Việt").font(.headline)
                        Text("Giao diện Tiếng Việt • Phụ đề mặc định: Tiếng Việt").font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "checkmark.circle.fill").foregroundColor(prefs.currentAccentColor)
                }
                .padding(12)
                .background(Color.primary.opacity(0.06))
                .cornerRadius(12)
            }
            .buttonStyle(.plain)

            Button {
                prefs.uiLanguage = "en"
                prefs.defaultSubtitleLang = "en"
                prefs.hasCompletedLanguageSetup = true
                dismiss()
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("English").font(.headline)
                        Text("English Interface • Default Subtitle: English").font(.caption).foregroundColor(.secondary)
                    }
                    Spacer()
                    Image(systemName: "globe").foregroundColor(prefs.currentAccentColor)
                }
                .padding(12)
                .background(Color.primary.opacity(0.06))
                .cornerRadius(12)
            }
            .buttonStyle(.plain)
        }
        .padding(24)
        .frame(width: 420)
    }
}

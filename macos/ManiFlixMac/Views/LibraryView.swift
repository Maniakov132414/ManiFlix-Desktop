import SwiftUI

struct LibraryView: View {
    @ObservedObject private var appState = AppState.shared
    @ObservedObject private var prefs = AppPreferences.shared
    @Environment(\.colorScheme) private var colorScheme
    @State private var containerWidth: CGFloat = 1000
    @State private var selectedSegment = 0

    var body: some View {
        VStack(spacing: 0) {
            Picker("Danh mục", selection: $selectedSegment) {
                Text("Đang xem").tag(0)
                Text("Đã lưu").tag(1)
                Text("Đã ẩn (\(appState.blockedMovies.count))").tag(2)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, 18)
            .padding(.vertical, 12)

            if selectedSegment == 0 {
                historyList
            } else if selectedSegment == 1 {
                if appState.isLoggedIn { favoritesGrid }
                else {
                    VStack(spacing: 12) {
                        Spacer()
                        Image(systemName: "person.crop.circle").font(.system(size: 44)).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                        Text("Đăng nhập để đồng bộ danh sách đã lưu")
                            .font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                        Button("Đăng nhập") { appState.showAuthSheet = true }
                            .buttonStyle(.borderedProminent).tint(prefs.currentAccentColor)
                        Spacer()
                    }
                }
            } else {
                blockedList
            }
        }
        .background(ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea())
        .readContainerWidth($containerWidth)
        .navigationTitle("Tủ phim")
    }

    private var historyList: some View {
        Group {
            if appState.history.isEmpty {
                VStack { Spacer(); Text("Chưa có phim đang xem.").foregroundColor(ManiFlixTheme.secondaryText(colorScheme)); Spacer() }
            } else {
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(appState.history) { entry in
                            HStack(spacing: 12) {
                                NavigationLink(destination: MovieDetailView(slug: entry.slug, seedMovie: nil)) {
                                    HStack(spacing: 12) {
                                        CachedAsyncImage(url: entry.displayPosterURL)
                                            .frame(width: 104, height: 62)
                                            .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(entry.name ?? entry.slug)
                                                .font(.subheadline.weight(.semibold))
                                                .foregroundColor(ManiFlixTheme.primaryText(colorScheme)).lineLimit(1)
                                            Text("\(entry.episodeName ?? "Tập 1") • \(MacPlayerEngine.formatTime(entry.currentTime ?? 0))")
                                                .font(.caption2).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                                            ProgressView(value: entry.progressRatio).tint(prefs.currentAccentColor)
                                        }
                                        Spacer()
                                    }
                                }
                                .buttonStyle(.plain)

                                Button(role: .destructive) {
                                    Task { await appState.deleteHistory(slug: entry.slug) }
                                } label: {
                                    Image(systemName: "trash").foregroundColor(.red)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(12)
                            .adaptiveGlassCard(cornerRadius: 12)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, containerWidth < 700 ? 94 : 24)
                }
            }
        }
    }

    private var favoritesGrid: some View {
        Group {
            if appState.favorites.isEmpty {
                VStack { Spacer(); Text("Chưa có phim đã lưu.").foregroundColor(ManiFlixTheme.secondaryText(colorScheme)); Spacer() }
            } else {
                ScrollView {
                    let cols = Array(repeating: GridItem(.flexible(), spacing: 12), count: ManiFlixTheme.adaptiveGridColumnCount(width: containerWidth))
                    LazyVGrid(columns: cols, spacing: 16) {
                        ForEach(appState.favorites) { fav in
                            let item = MovieItem(_id: nil, name: fav.name ?? fav.slug, slug: fav.slug, origin_name: nil, poster_url: fav.poster, thumb_url: nil, year: fav.year, type: nil, quality: fav.quality, lang: fav.lang, episode_current: nil, time: nil, category: nil, country: nil)
                            NavigationLink(destination: MovieDetailView(slug: fav.slug, seedMovie: item)) {
                                MoviePosterCard(movie: item)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 18)
                    .padding(.bottom, containerWidth < 700 ? 94 : 24)
                }
            }
        }
    }

    private var blockedList: some View {
        Group {
            if appState.blockedMovies.isEmpty {
                VStack { Spacer(); Text("Chưa có phim nào bị ẩn.").foregroundColor(ManiFlixTheme.secondaryText(colorScheme)); Spacer() }
            } else {
                ScrollView {
                    LazyVStack(spacing: 10) {
                        ForEach(appState.blockedMovies) { item in
                            HStack(spacing: 12) {
                                CachedAsyncImage(url: ImageURLResolver.resolve(item.poster))
                                    .frame(width: 52, height: 74)
                                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                                VStack(alignment: .leading, spacing: 3) {
                                    Text(item.name).font(.subheadline.weight(.semibold)).foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                                    Text("Đang ẩn khỏi Trang chủ & Tìm kiếm").font(.caption2).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                                }
                                Spacer()
                                Button("Hiện lại") { appState.unblockMovie(slug: item.slug) }
                                    .buttonStyle(.borderedProminent).tint(prefs.currentAccentColor)
                            }
                            .padding(12)
                            .adaptiveGlassCard(cornerRadius: 12)
                        }
                    }
                    .padding(.horizontal, 18)
                }
            }
        }
    }
}

import SwiftUI

private enum DiscoverCategoryFilter: String, CaseIterable, Identifiable {
    case all = "Tất cả"
    case series = "Phim bộ"
    case single = "Phim lẻ"
    case anime = "Hoạt hình"
    case tvShows = "TV Shows"
    case action = "Hành động"
    case costume = "Cổ trang"
    case romance = "Tình cảm"
    case horror = "Kinh dị"
    case sciFi = "Viễn tưởng"

    var id: String { rawValue }
    enum Endpoint { case latest, category(String), genre(String) }

    var endpoint: Endpoint {
        switch self {
        case .all: return .latest
        case .series: return .category("phim-bo")
        case .single: return .category("phim-le")
        case .anime: return .category("hoat-hinh")
        case .tvShows: return .category("tv-shows")
        case .action: return .genre("hanh-dong")
        case .costume: return .genre("co-trang")
        case .romance: return .genre("tinh-cam")
        case .horror: return .genre("kinh-di")
        case .sciFi: return .genre("vien-tuong")
        }
    }
}

struct MoviePosterCard: View {
    let movie: MovieItem
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ZStack(alignment: .bottomLeading) {
                CachedAsyncImage(url: movie.displayPosterURL, maxPixelSize: 380)
                    .frame(maxWidth: .infinity)
                    .aspectRatio(2.0 / 3.0, contentMode: .fill)
                    .clipShape(RoundedRectangle(cornerRadius: 13, style: .continuous))
                    .overlay(
                        RoundedRectangle(cornerRadius: 13, style: .continuous)
                            .strokeBorder(
                                LinearGradient(
                                    colors: [Color.white.opacity(0.32), ManiFlixTheme.cardStroke(colorScheme), Color.white.opacity(0.08)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 0.85
                            )
                    )

                if let badge = movie.quality ?? movie.episode_current, !badge.isEmpty {
                    Text(badge)
                        .font(.system(size: 9.5, weight: .semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2.5)
                        .background(Color.black.opacity(0.72))
                        .clipShape(RoundedRectangle(cornerRadius: 5, style: .continuous))
                        .padding(6)
                }
            }

            Text(movie.name)
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .lineLimit(1)

            if let year = movie.year?.value, year > 0 {
                Text("\(String(year)) • \(movie.lang ?? "Vietsub")")
                    .font(.system(size: 11))
                    .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                    .lineLimit(1)
            }
        }
        .contextMenu {
            Button {
                Task { await AppState.shared.toggleFavoriteItem(movie) }
            } label: {
                Label(AppState.shared.isFavorite(slug: movie.slug) ? "Bỏ khỏi Tủ phim" : "Lưu vào Tủ phim", systemImage: "bookmark")
            }
            Button(role: .destructive) {
                AppState.shared.blockMovie(movie)
            } label: {
                Label("Ẩn phim này", systemImage: "eye.slash")
            }
        }
    }
}

struct DiscoverView: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @ObservedObject private var appState = AppState.shared
    @Environment(\.colorScheme) private var colorScheme

    @State private var containerWidth: CGFloat = 1000
    @State private var heroMovies: [MovieItem] = []
    @State private var seriesMovies: [MovieItem] = []
    @State private var singleMovies: [MovieItem] = []
    @State private var animeMovies: [MovieItem] = []
    @State private var filteredMovies: [MovieItem] = []
    @State private var selectedCategory: DiscoverCategoryFilter = .all
    @State private var heroSelection: Int = 0
    @State private var isLoading = true
    @State private var isLoadingFilter = false
    @State private var latestPage = 1
    @State private var isLoadingMoreLatest = false
    @State private var hasMoreLatest = true
    @State private var filterPage = 1
    @State private var isLoadingMoreFilter = false
    @State private var hasMoreFilter = true
    @State private var startingHeroPlaySlug: String?
    @State private var errorMsg: String?

    private var visibleHero: [MovieItem] { heroMovies.filter { !appState.isBlocked(slug: $0.slug) } }
    private var visibleFiltered: [MovieItem] { filteredMovies.filter { !appState.isBlocked(slug: $0.slug) } }
    private var visibleSeries: [MovieItem] { (seriesMovies.isEmpty ? Array(heroMovies.prefix(12)) : seriesMovies).filter { !appState.isBlocked(slug: $0.slug) } }
    private var visibleSingle: [MovieItem] { (singleMovies.isEmpty ? Array(heroMovies.dropFirst(4).prefix(12)) : singleMovies).filter { !appState.isBlocked(slug: $0.slug) } }
    private var visibleAnime: [MovieItem] { animeMovies.filter { !appState.isBlocked(slug: $0.slug) } }
    private var isCompactPhone: Bool { containerWidth < 700 }

    private var currentAmbientURL: URL? {
        let featured = Array(visibleHero.prefix(5))
        return featured[safe: heroSelection]?.displayPosterURL ?? featured.first?.displayPosterURL
    }

    var body: some View {
        ZStack(alignment: .top) {
            ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea()
            AmbientArtworkBackground(url: currentAmbientURL, height: 420)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 24) {
                    if let err = errorMsg, heroMovies.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "wifi.slash").font(.title2).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                            Text(err).font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                            Button("Thử lại") { Task { await loadAll() } }
                                .buttonStyle(.borderedProminent).tint(prefs.currentAccentColor)
                        }
                        .frame(maxWidth: .infinity).padding(.vertical, 80)
                    } else {
                        categoryChipsBar

                        if selectedCategory == .all {
                            if !visibleHero.isEmpty {
                                let featured = Array(visibleHero.prefix(5))
                                if let activeHero = featured[safe: heroSelection] ?? featured.first {
                                    VStack(spacing: 10) {
                                        heroCard(for: activeHero)
                                        if featured.count > 1 {
                                            HStack(spacing: 7) {
                                                ForEach(0..<featured.count, id: \.self) { idx in
                                                    Button {
                                                        withAnimation(.easeInOut(duration: 0.22)) { heroSelection = idx }
                                                    } label: {
                                                        Capsule()
                                                            .fill(idx == heroSelection ? prefs.currentAccentColor : ManiFlixTheme.secondaryText(colorScheme).opacity(0.36))
                                                            .frame(width: idx == heroSelection ? 18 : 6, height: 6)
                                                    }
                                                    .buttonStyle(.plain)
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if isLoading {
                                RoundedRectangle(cornerRadius: 16).fill(ManiFlixTheme.cardFill(colorScheme))
                                    .frame(height: isCompactPhone ? 280 : 340).padding(.horizontal, 18)
                            }

                            if !appState.history.isEmpty { continueWatchingRail }
                            horizontalRail(title: "Phim bộ mới", items: visibleSeries)
                            horizontalRail(title: "Phim lẻ tuyển chọn", items: visibleSingle)
                            horizontalRail(title: "Hoạt hình & Anime", items: visibleAnime)
                            gridSection(
                                title: "Mới cập nhật",
                                items: visibleHero,
                                hasMore: hasMoreLatest,
                                isLoadingMore: isLoadingMoreLatest,
                                onLoadMore: { Task { await loadMoreLatest() } }
                            )
                        } else {
                            if isLoadingFilter && visibleFiltered.isEmpty {
                                ProgressView().tint(prefs.currentAccentColor).frame(maxWidth: .infinity).padding(.vertical, 60)
                            } else {
                                gridSection(
                                    title: selectedCategory.rawValue,
                                    items: visibleFiltered,
                                    hasMore: hasMoreFilter,
                                    isLoadingMore: isLoadingMoreFilter,
                                    onLoadMore: { Task { await loadMoreCategoryFeed(for: selectedCategory) } }
                                )
                            }
                        }
                    }
                }
                .padding(.top, 10)
                .padding(.bottom, isCompactPhone ? 94 : 32)
            }
        }
        .readContainerWidth($containerWidth)
        .navigationTitle("Trang chủ")
        .task {
            if heroMovies.isEmpty { await loadAll() }
        }
    }

    private var categoryChipsBar: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(DiscoverCategoryFilter.allCases) { cat in
                    let isSelected = selectedCategory == cat
                    Button {
                        guard selectedCategory != cat else { return }
                        selectedCategory = cat
                        Task {
                            if cat != .all { await loadCategoryFeed(for: cat) }
                        }
                    } label: {
                        Text(cat.rawValue)
                            .font(.caption.weight(.semibold))
                            .foregroundColor(isSelected ? .white : ManiFlixTheme.primaryText(colorScheme))
                            .padding(.horizontal, 13)
                            .padding(.vertical, 7)
                    }
                    .buttonStyle(.plain)
                    .adaptiveGlassCapsule(interactive: true, tint: isSelected ? prefs.currentAccentColor : nil)
                }
            }
            .padding(.horizontal, 18)
        }
    }

    private func heroCard(for movie: MovieItem) -> some View {
        let h: CGFloat = isCompactPhone ? 280 : 340
        return ZStack(alignment: .bottomLeading) {
            CachedAsyncImage(url: movie.displayThumbURL ?? movie.displayPosterURL, maxPixelSize: 1080)
                .frame(maxWidth: .infinity).frame(height: h)
                .overlay(
                    LinearGradient(
                        stops: [
                            .init(color: .clear, location: 0.15),
                            .init(color: Color.black.opacity(0.65), location: 0.62),
                            .init(color: Color.black.opacity(0.92), location: 1.0)
                        ],
                        startPoint: .top, endPoint: .bottom
                    )
                )
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .strokeBorder(
                            LinearGradient(
                                colors: [Color.white.opacity(0.36), prefs.currentAccentColor.opacity(0.28), Color.white.opacity(0.10)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 1.0
                        )
                )

            VStack(alignment: .leading, spacing: 7) {
                HStack(spacing: 6) {
                    Text(movie.quality ?? "FHD")
                        .font(.system(size: 10.5, weight: .bold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 10).padding(.vertical, 4)
                        .background(prefs.currentAccentColor.opacity(0.92))
                        .clipShape(Capsule())
                    if let lang = movie.lang, !lang.isEmpty {
                        Text(lang)
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundColor(Color(red: 0.43, green: 0.91, blue: 0.72))
                            .padding(.horizontal, 10).padding(.vertical, 4)
                            .background(Color(red: 0.06, green: 0.73, blue: 0.51).opacity(0.22))
                            .clipShape(Capsule())
                    }
                    if let yr = movie.year?.value, yr > 0 {
                        Text(String(yr))
                            .font(.system(size: 10.5, weight: .semibold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 9).padding(.vertical, 4)
                            .adaptiveGlassCapsule(interactive: false)
                    }
                }

                Text(movie.name)
                    .font(.system(size: isCompactPhone ? 20 : 26, weight: .bold))
                    .foregroundColor(.white)
                    .lineLimit(2)

                if let orig = movie.origin_name, !orig.isEmpty {
                    Text(orig).font(.subheadline).foregroundColor(Color.white.opacity(0.78)).lineLimit(1)
                }

                HStack(spacing: 10) {
                    Button {
                        Task { await playHeroDirectly(movie) }
                    } label: {
                        HStack(spacing: 6) {
                            if startingHeroPlaySlug == movie.slug {
                                ProgressView().scaleEffect(0.75).tint(.white)
                            } else {
                                Image(systemName: "play.fill")
                            }
                            Text("Xem ngay")
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(.white)
                        .padding(.horizontal, 16).padding(.vertical, 9)
                        .background(prefs.currentAccentColor)
                        .clipShape(Capsule())
                    }
                    .buttonStyle(.plain)
                    .disabled(startingHeroPlaySlug != nil)

                    NavigationLink(destination: MovieDetailView(slug: movie.slug, seedMovie: movie)) {
                        HStack(spacing: 5) {
                            Image(systemName: "info.circle")
                            Text("Chi tiết")
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14).padding(.vertical, 9)
                    }
                    .buttonStyle(.plain)
                    .adaptiveGlassCapsule(interactive: true)

                    Button {
                        Task { await appState.toggleFavoriteItem(movie) }
                    } label: {
                        HStack(spacing: 5) {
                            Image(systemName: appState.isFavorite(slug: movie.slug) ? "bookmark.fill" : "bookmark")
                            Text(appState.isFavorite(slug: movie.slug) ? "Đã lưu" : "Tủ phim")
                        }
                        .font(.subheadline.weight(.medium))
                        .foregroundColor(.white)
                        .padding(.horizontal, 14).padding(.vertical, 9)
                    }
                    .buttonStyle(.plain)
                    .adaptiveGlassCapsule(interactive: true)
                }
                .padding(.top, 4)
            }
            .padding(20)
        }
        .padding(.horizontal, 18)
        .shadow(color: Color.black.opacity(0.35), radius: 18, x: 0, y: 10)
    }

    private var continueWatchingRail: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Tiếp tục xem")
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .padding(.horizontal, 18)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(appState.history.prefix(12)) { entry in
                        NavigationLink(destination: MovieDetailView(slug: entry.slug, seedMovie: nil)) {
                            VStack(alignment: .leading, spacing: 6) {
                                ZStack(alignment: .bottomLeading) {
                                    CachedAsyncImage(url: entry.displayPosterURL)
                                        .frame(width: 176, height: 104)
                                        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                                    ProgressView(value: entry.progressRatio)
                                        .tint(prefs.currentAccentColor)
                                        .padding(6)
                                }
                                Text(entry.name ?? entry.slug)
                                    .font(.caption.weight(.semibold))
                                    .foregroundColor(ManiFlixTheme.primaryText(colorScheme)).lineLimit(1)
                                Text(entry.episodeName ?? "Tập 1")
                                    .font(.caption2).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                            }
                            .frame(width: 176)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 18)
            }
        }
    }

    private func horizontalRail(title: String, items: [MovieItem]) -> some View {
        Group {
            if !items.isEmpty {
                VStack(alignment: .leading, spacing: 10) {
                    Text(title)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                        .padding(.horizontal, 18)

                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(alignment: .top, spacing: 12) {
                            ForEach(items.prefix(14)) { movie in
                                NavigationLink(destination: MovieDetailView(slug: movie.slug, seedMovie: movie)) {
                                    MoviePosterCard(movie: movie).frame(width: isCompactPhone ? 118 : 144)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 18)
                    }
                }
            }
        }
    }

    private func gridSection(
        title: String,
        items: [MovieItem],
        hasMore: Bool = false,
        isLoadingMore: Bool = false,
        onLoadMore: (() -> Void)? = nil
    ) -> some View {
        let cols = Array(repeating: GridItem(.flexible(), spacing: 12), count: ManiFlixTheme.adaptiveGridColumnCount(width: containerWidth))
        return VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.system(size: 18, weight: .bold))
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .padding(.horizontal, 18)

            LazyVGrid(columns: cols, spacing: 16) {
                ForEach(items) { movie in
                    NavigationLink(destination: MovieDetailView(slug: movie.slug, seedMovie: movie)) {
                        MoviePosterCard(movie: movie)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 18)

            if hasMore, let onLoadMore = onLoadMore {
                HStack {
                    Spacer()
                    Button(action: onLoadMore) {
                        HStack(spacing: 8) {
                            if isLoadingMore {
                                ProgressView().scaleEffect(0.75)
                            } else {
                                Image(systemName: "plus.circle")
                            }
                            Text(isLoadingMore ? "Đang tải..." : "Xem thêm")
                        }
                        .font(.subheadline.weight(.semibold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                        .padding(.horizontal, 20).padding(.vertical, 10)
                    }
                    .buttonStyle(.plain)
                    .adaptiveGlassCapsule(interactive: true)
                    .disabled(isLoadingMore)
                    Spacer()
                }
                .padding(.top, 6)
            }
        }
    }

    private func loadAll() async {
        isLoading = true
        errorMsg = nil
        latestPage = 1
        hasMoreLatest = true
        do {
            async let latestTask = ManiFlixAPI.shared.fetchMovies(page: 1)
            async let seriesTask = ManiFlixAPI.shared.fetchCategory(type: "phim-bo", page: 1)
            async let singleTask = ManiFlixAPI.shared.fetchCategory(type: "phim-le", page: 1)
            async let animeTask = ManiFlixAPI.shared.fetchCategory(type: "hoat-hinh", page: 1)
            let latest = try await latestTask
            let items = latest.items ?? []
            self.heroMovies = items
            self.hasMoreLatest = !items.isEmpty
            self.seriesMovies = (try? await seriesTask)?.items ?? []
            self.singleMovies = (try? await singleTask)?.items ?? []
            self.animeMovies = (try? await animeTask)?.items ?? []
        } catch {
            self.errorMsg = error.localizedDescription
        }
        isLoading = false
    }

    private func loadMoreLatest() async {
        guard !isLoadingMoreLatest && hasMoreLatest else { return }
        isLoadingMoreLatest = true
        let nextPage = latestPage + 1
        if let res = try? await ManiFlixAPI.shared.fetchMovies(page: nextPage) {
            let incoming = res.items ?? []
            let existing = Set(heroMovies.map(\.slug))
            let fresh = incoming.filter { !existing.contains($0.slug) }
            if fresh.isEmpty {
                hasMoreLatest = false
            } else {
                heroMovies.append(contentsOf: fresh)
                latestPage = nextPage
            }
        } else {
            hasMoreLatest = false
        }
        isLoadingMoreLatest = false
    }

    private func fetchFeedItems(for cat: DiscoverCategoryFilter, page: Int) async throws -> [MovieItem] {
        switch cat.endpoint {
        case .latest:
            return (try await ManiFlixAPI.shared.fetchMovies(page: page)).items ?? []
        case .category(let t):
            return (try await ManiFlixAPI.shared.fetchCategory(type: t, page: page)).items ?? []
        case .genre(let s):
            return (try await ManiFlixAPI.shared.fetchGenre(slug: s, page: page)).items ?? []
        }
    }

    private func loadCategoryFeed(for cat: DiscoverCategoryFilter) async {
        isLoadingFilter = true
        filterPage = 1
        hasMoreFilter = true
        do {
            let items = try await fetchFeedItems(for: cat, page: 1)
            filteredMovies = items
            hasMoreFilter = !items.isEmpty
        } catch {
            hasMoreFilter = false
        }
        isLoadingFilter = false
    }

    private func loadMoreCategoryFeed(for cat: DiscoverCategoryFilter) async {
        guard !isLoadingMoreFilter && hasMoreFilter else { return }
        isLoadingMoreFilter = true
        let nextPage = filterPage + 1
        if let incoming = try? await fetchFeedItems(for: cat, page: nextPage) {
            let existing = Set(filteredMovies.map(\.slug))
            let fresh = incoming.filter { !existing.contains($0.slug) }
            if fresh.isEmpty {
                hasMoreFilter = false
            } else {
                filteredMovies.append(contentsOf: fresh)
                filterPage = nextPage
            }
        } else {
            hasMoreFilter = false
        }
        isLoadingMoreFilter = false
    }

    private func playHeroDirectly(_ movie: MovieItem) async {
        guard startingHeroPlaySlug == nil else { return }
        startingHeroPlaySlug = movie.slug
        defer { startingHeroPlaySlug = nil }
        do {
            let res = try await ManiFlixAPI.shared.fetchMovieDetail(slug: movie.slug)
            if let detail = res.movie, let servers = res.episodes, !servers.isEmpty {
                let epCount = servers[0].server_data.count
                let savedEp = appState.history.first(where: { $0.slug == detail.slug })?.episodeIndex ?? 0
                let targetIdx = (savedEp >= 0 && savedEp < epCount) ? savedEp : 0
                if epCount > 0 {
                    appState.startPlayback(movie: detail, servers: servers, serverIndex: 0, episodeIndex: targetIdx)
                    return
                }
            }
            appState.showBanner("Phim này chưa có tập để phát trực tiếp")
        } catch {
            appState.showBanner("Không thể tải luồng phát cho \"\(movie.name)\"")
        }
    }
}

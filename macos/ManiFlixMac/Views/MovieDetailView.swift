import SwiftUI

struct MovieDetailView: View {
    let slug: String
    let seedMovie: MovieItem?

    @ObservedObject private var prefs = AppPreferences.shared
    @ObservedObject private var appState = AppState.shared
    @Environment(\.colorScheme) private var colorScheme

    @State private var containerWidth: CGFloat = 1000
    @State private var detail: MovieDetail?
    @State private var servers: [EpisodeServer] = []
    @State private var franchiseSeasons: [FranchiseSeason] = []
    @State private var relatedMovies: [MovieItem] = []
    @State private var selectedServerIdx = 0
    @State private var isFranchiseExpanded = true
    @State private var isLoading = true
    @State private var errorMsg: String?

    private var isTwoPane: Bool { containerWidth >= 640 }
    private var heroArtworkURL: URL? { detail?.displayPosterURL ?? seedMovie?.displayPosterURL ?? detail?.displayThumbURL }
    private var resumeEntry: HistoryEntry? { appState.history.first(where: { $0.slug == (detail?.slug ?? slug) }) }

    var body: some View {
        ZStack(alignment: .top) {
            ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea()
            AmbientArtworkBackground(url: heroArtworkURL, height: 420)

            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    if isLoading {
                        headerBanner
                        ProgressView().tint(prefs.currentAccentColor).frame(maxWidth: .infinity).padding(.vertical, 32)
                    } else if let err = errorMsg {
                        headerBanner
                        Text(err).font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme)).padding(.horizontal, 18)
                    } else if let movie = detail {
                        if isTwoPane {
                            HStack(alignment: .top, spacing: 28) {
                                VStack(alignment: .leading, spacing: 16) {
                                    headerBanner
                                    actionButtonsRow(movie: movie)
                                    metadataBadges(movie: movie)
                                    if !movie.plainSynopsis.isEmpty { synopsisSection(movie: movie) }
                                }
                                .frame(width: 340, alignment: .leading)

                                VStack(alignment: .leading, spacing: 18) {
                                    if franchiseSeasons.count > 1 { franchiseSection }
                                    episodeSelectorSection(movie: movie)
                                    if !relatedMovies.isEmpty { relatedMoviesRail }
                                }
                                .frame(maxWidth: .infinity, alignment: .leading)
                            }
                            .padding(.horizontal, 22)
                            .padding(.top, 12)
                        } else {
                            VStack(alignment: .leading, spacing: 16) {
                                headerBanner
                                actionButtonsRow(movie: movie)
                                metadataBadges(movie: movie)
                                if franchiseSeasons.count > 1 { franchiseSection }
                                episodeSelectorSection(movie: movie)
                                if !movie.plainSynopsis.isEmpty { synopsisSection(movie: movie) }
                                if !relatedMovies.isEmpty { relatedMoviesRail }
                            }
                            .padding(.horizontal, 16)
                        }
                    }
                }
                .padding(.bottom, containerWidth < 700 ? 94 : 32)
            }
        }
        .readContainerWidth($containerWidth)
        .task(id: slug) { await loadDetail() }
    }

    private var headerBanner: some View {
        VStack(spacing: 12) {
            CachedAsyncImage(url: heroArtworkURL)
                .frame(width: 164, height: 236)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(ManiFlixTheme.cardStroke(colorScheme), lineWidth: 0.6))
                .shadow(color: Color.black.opacity(0.45), radius: 18, x: 0, y: 10)

            Text(detail?.name ?? seedMovie?.name ?? "")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .multilineTextAlignment(.center)

            if let orig = detail?.origin_name ?? seedMovie?.origin_name, !orig.isEmpty {
                Text(orig).font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme)).multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func actionButtonsRow(movie: MovieDetail) -> some View {
        let epCount = servers[safe: selectedServerIdx]?.server_data.count ?? 0
        let targetIdx = (resumeEntry?.episodeIndex ?? 0) < epCount ? (resumeEntry?.episodeIndex ?? 0) : 0
        let playLabel = resumeEntry?.episodeName.map { "Xem tiếp • \($0)" } ?? "Phát"

        return HStack(spacing: 10) {
            Button {
                appState.startPlayback(movie: movie, servers: servers, serverIndex: selectedServerIdx, episodeIndex: targetIdx)
            } label: {
                HStack(spacing: 6) {
                    Image(systemName: "play.fill")
                    Text(playLabel).lineLimit(1)
                }
                .font(.subheadline.weight(.semibold))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity).frame(height: 44)
                .background(RoundedRectangle(cornerRadius: 12, style: .continuous).fill(prefs.currentAccentColor))
            }
            .buttonStyle(.plain)
            .disabled(epCount == 0)

            Button {
                Task { await appState.toggleFavorite(movie: movie) }
            } label: {
                Image(systemName: appState.isFavorite(slug: movie.slug) ? "bookmark.fill" : "bookmark")
                    .foregroundColor(appState.isFavorite(slug: movie.slug) ? prefs.currentAccentColor : ManiFlixTheme.primaryText(colorScheme))
                    .frame(width: 44, height: 44)
            }
            .buttonStyle(.plain)
            .adaptiveGlassCard(cornerRadius: 12, interactive: true)
        }
    }

    private func metadataBadges(movie: MovieDetail) -> some View {
        WrappingFlowLayout(horizontalSpacing: 7, verticalSpacing: 7) {
            if let q = movie.quality, !q.isEmpty { badgePill(q) }
            if let ep = movie.episode_current, !ep.isEmpty { badgePill(ep) }
            ForEach((movie.category ?? []).prefix(5)) { cat in
                if let name = cat.name, !name.isEmpty { badgePill(name) }
            }
        }
    }

    private func badgePill(_ text: String) -> some View {
        Text(text)
            .font(.caption2.weight(.medium))
            .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
            .padding(.horizontal, 10).padding(.vertical, 5)
            .adaptiveGlassCapsule(interactive: false)
    }

    private func synopsisSection(movie: MovieDetail) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Giới thiệu").font(.system(size: 16, weight: .bold)).foregroundColor(ManiFlixTheme.primaryText(colorScheme))
            Text(movie.plainSynopsis).font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme)).lineSpacing(3)
        }
        .padding(14)
        .adaptiveGlassCard(cornerRadius: 14)
    }

    private var franchiseSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { isFranchiseExpanded.toggle() }
            } label: {
                HStack {
                    Text("Các phần phim (\(franchiseSeasons.count))")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                    Spacer()
                    Text(isFranchiseExpanded ? "Thu gọn" : "Mở rộng").font(.caption).foregroundColor(prefs.currentAccentColor)
                }
            }
            .buttonStyle(.plain)

            if isFranchiseExpanded {
                WrappingFlowLayout(horizontalSpacing: 8, verticalSpacing: 8) {
                    ForEach(franchiseSeasons) { season in
                        let isCurrent = season.slug == slug
                        NavigationLink(destination: MovieDetailView(slug: season.slug, seedMovie: nil)) {
                            Text(season.displayFullTitle)
                                .font(.caption.weight(isCurrent ? .semibold : .medium))
                                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(isCurrent ? prefs.currentAccentColor.opacity(0.24) : ManiFlixTheme.cardFill(colorScheme)))
                                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(isCurrent ? prefs.currentAccentColor : ManiFlixTheme.cardStroke(colorScheme), lineWidth: isCurrent ? 1.2 : 0.6))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
        .padding(14)
        .adaptiveGlassCard(cornerRadius: 14)
    }

    private func episodeSelectorSection(movie: MovieDetail) -> some View {
        let watchedIdx = resumeEntry?.episodeIndex
        return VStack(alignment: .leading, spacing: 12) {
            if !servers.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Array(servers.enumerated()), id: \.offset) { idx, srv in
                            let selected = selectedServerIdx == idx
                            Button { selectedServerIdx = idx } label: {
                                Text(srv.server_name)
                                    .font(.caption.weight(.medium))
                                    .foregroundColor(selected ? .white : ManiFlixTheme.primaryText(colorScheme))
                                    .padding(.horizontal, 12).padding(.vertical, 7)
                            }
                            .buttonStyle(.plain)
                            .adaptiveGlassCapsule(interactive: true, tint: selected ? prefs.currentAccentColor : nil)
                        }
                    }
                }

                if let activeSrv = servers[safe: selectedServerIdx] {
                    Text("Danh sách tập (\(activeSrv.server_data.count))")
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))

                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 74), spacing: 8)], spacing: 8) {
                        ForEach(Array(activeSrv.server_data.enumerated()), id: \.offset) { epIdx, ep in
                            let isWatched = watchedIdx == epIdx
                            Button {
                                appState.startPlayback(movie: movie, servers: servers, serverIndex: selectedServerIdx, episodeIndex: epIdx)
                            } label: {
                                Text(ep.name)
                                    .font(.caption.weight(isWatched ? .semibold : .medium))
                                    .foregroundColor(isWatched ? prefs.currentAccentColor : ManiFlixTheme.primaryText(colorScheme))
                                    .frame(maxWidth: .infinity).padding(.vertical, 9)
                            }
                            .buttonStyle(.plain)
                            .adaptiveGlassCard(cornerRadius: 9, interactive: true, tint: isWatched ? prefs.currentAccentColor : nil)
                        }
                    }
                }
            }
        }
    }

    private var relatedMoviesRail: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Có thể bạn cũng thích").font(.system(size: 17, weight: .bold)).foregroundColor(ManiFlixTheme.primaryText(colorScheme))
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(alignment: .top, spacing: 11) {
                    ForEach(relatedMovies) { item in
                        NavigationLink(destination: MovieDetailView(slug: item.slug, seedMovie: item)) {
                            MoviePosterCard(movie: item).frame(width: 126)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }

    private func loadDetail() async {
        isLoading = true; errorMsg = nil
        do {
            let res = try await ManiFlixAPI.shared.fetchMovieDetail(slug: slug)
            self.detail = res.movie
            self.servers = res.episodes ?? []
            if let fr = try? await ManiFlixAPI.shared.fetchFranchise(slug: slug) {
                self.franchiseSeasons = fr.seasons ?? []
            }
            if let gSlug = res.movie?.category?.first?.slug,
               let rel = try? await ManiFlixAPI.shared.fetchGenre(slug: gSlug, page: 1) {
                self.relatedMovies = Array((rel.items ?? []).filter { $0.slug != slug }.prefix(12))
            }
        } catch {
            self.errorMsg = error.localizedDescription
        }
        isLoading = false
    }
}

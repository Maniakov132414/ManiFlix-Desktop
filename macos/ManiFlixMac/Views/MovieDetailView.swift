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
    @State private var franchiseMeta: FranchiseResponse?
    @State private var franchiseSeasons: [FranchiseSeason] = []
    @State private var relatedMovies: [MovieItem] = []
    @State private var selectedServerIdx = 0
    @State private var episodeSearchQuery = ""
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
                                    creditsSection(movie: movie)
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
                                creditsSection(movie: movie)
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
            CachedAsyncImage(url: heroArtworkURL, maxPixelSize: 480)
                .frame(width: 164, height: 236)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                .overlay(RoundedRectangle(cornerRadius: 12, style: .continuous).strokeBorder(ManiFlixTheme.cardStroke(colorScheme), lineWidth: 0.6))
                .shadow(color: Color.black.opacity(0.45), radius: 18, x: 0, y: 10)

            Text(detail?.localizedPrimaryTitle(prefs.uiLanguage) ?? seedMovie?.localizedPrimaryTitle(prefs.uiLanguage) ?? "")
                .font(.system(size: 22, weight: .bold))
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .multilineTextAlignment(.center)

            if let sec = detail?.localizedSecondaryTitle(prefs.uiLanguage) ?? seedMovie?.localizedSecondaryTitle(prefs.uiLanguage), !sec.isEmpty {
                Text(sec).font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme)).multilineTextAlignment(.center)
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
            if let year = movie.year?.value, year > 0 { badgePill(String(year)) }
            if let q = movie.quality, !q.isEmpty { badgePill(q) }
            if let lang = movie.lang, !lang.isEmpty { badgePill(lang) }
            if let time = movie.time, !time.isEmpty { badgePill(time) }
            if let ep = movie.episode_current, !ep.isEmpty { badgePill(ep) }
            ForEach((movie.country ?? []).prefix(3)) { c in
                if let name = c.name, !name.isEmpty { badgePill(name) }
            }
            ForEach((movie.category ?? []).prefix(5)) { cat in
                if let name = cat.name, !name.isEmpty { badgePill(name) }
            }
        }
    }

    @ViewBuilder
    private func creditsSection(movie: MovieDetail) -> some View {
        let countries = (movie.country ?? []).compactMap(\.name).filter { !$0.isEmpty }.joined(separator: ", ")
        let directors = (movie.director ?? []).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: ", ")
        let actors = (movie.actor ?? []).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.prefix(10).joined(separator: ", ")
        if !countries.isEmpty || !directors.isEmpty || !actors.isEmpty {
            VStack(alignment: .leading, spacing: 8) {
                Text("Thông tin chi tiết")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                if !countries.isEmpty { creditRow(label: "Quốc gia", value: countries) }
                if !directors.isEmpty { creditRow(label: "Đạo diễn", value: directors) }
                if !actors.isEmpty { creditRow(label: "Diễn viên", value: actors) }
            }
            .padding(14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .adaptiveGlassCard(cornerRadius: 14)
        }
    }

    private func creditRow(label: String, value: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Text(label)
                .font(.caption.weight(.semibold))
                .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                .frame(width: 68, alignment: .leading)
            Text(value)
                .font(.caption)
                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                .fixedSize(horizontal: false, vertical: true)
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
        let headerTitle = franchiseMeta?.localizedHeader(uiLang: prefs.uiLanguage, count: franchiseSeasons.count)
            ?? (prefs.uiLanguage == "en" ? "Franchise (\(franchiseSeasons.count) parts)" : "Các phần phim (\(franchiseSeasons.count))")
        return VStack(alignment: .leading, spacing: 10) {
            Button {
                withAnimation(.easeInOut(duration: 0.2)) { isFranchiseExpanded.toggle() }
            } label: {
                HStack {
                    Text(headerTitle)
                        .font(.system(size: 16, weight: .bold))
                        .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                    Spacer()
                    Text(isFranchiseExpanded ? prefs.tr("Thu gọn", "Collapse") : prefs.tr("Mở rộng", "Expand"))
                        .font(.caption)
                        .foregroundColor(prefs.currentAccentColor)
                }
            }
            .buttonStyle(.plain)

            if isFranchiseExpanded {
                WrappingFlowLayout(horizontalSpacing: 8, verticalSpacing: 8) {
                    ForEach(franchiseSeasons) { season in
                        let isCurrent = season.slug == slug
                        NavigationLink(destination: MovieDetailView(slug: season.slug, seedMovie: nil)) {
                            Text(season.localizedLabel(uiLang: prefs.uiLanguage, meta: franchiseMeta, allSeasons: franchiseSeasons))
                                .font(.caption.weight(isCurrent ? .semibold : .medium))
                                .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                                .padding(.horizontal, 12).padding(.vertical, 8)
                                .background(RoundedRectangle(cornerRadius: 10, style: .continuous).fill(isCurrent ? prefs.currentAccentColor.opacity(0.24) : ManiFlixTheme.cardFill(colorScheme)))
                                .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).strokeBorder(isCurrent ? prefs.currentAccentColor : ManiFlixTheme.cardStroke(colorScheme), lineWidth: isCurrent ? 1.2 : 0.6))
                        }
                        .buttonStyle(.plain)
                        .help(season.localizedTooltip(uiLang: prefs.uiLanguage))
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
                    let trimmedEp = episodeSearchQuery.trimmingCharacters(in: .whitespacesAndNewlines)
                    let filteredEps = Array(activeSrv.server_data.enumerated()).filter { _, ep in
                        trimmedEp.isEmpty || ep.name.localizedCaseInsensitiveContains(trimmedEp)
                    }

                    HStack(spacing: 10) {
                        Text("Danh sách tập (\(activeSrv.server_data.count))")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                        Spacer()
                        if activeSrv.server_data.count > 1 {
                            HStack(spacing: 6) {
                                Image(systemName: "magnifyingglass")
                                    .font(.caption)
                                    .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                                TextField("Tìm tập...", text: $episodeSearchQuery)
                                    .textFieldStyle(.plain)
                                    .font(.caption)
                                    .frame(width: 110)
                                if !episodeSearchQuery.isEmpty {
                                    Button { episodeSearchQuery = "" } label: {
                                        Image(systemName: "xmark.circle.fill")
                                            .font(.caption)
                                            .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .adaptiveGlassCapsule(interactive: true)
                        }
                    }

                    if filteredEps.isEmpty {
                        Text("Không tìm thấy tập phù hợp với \"\(episodeSearchQuery)\"")
                            .font(.caption)
                            .foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                            .padding(.vertical, 12)
                    } else {
                        LazyVGrid(columns: [GridItem(.adaptive(minimum: 78), spacing: 8)], spacing: 8) {
                            ForEach(filteredEps, id: \.offset) { epIdx, ep in
                                let isWatched = watchedIdx == epIdx
                                let ratio = isWatched ? (resumeEntry?.progressRatio ?? 0) : 0
                                Button {
                                    appState.startPlayback(movie: movie, servers: servers, serverIndex: selectedServerIdx, episodeIndex: epIdx)
                                } label: {
                                    VStack(spacing: 4) {
                                        Text(ep.name)
                                            .font(.caption.weight(isWatched ? .semibold : .medium))
                                            .foregroundColor(isWatched ? prefs.currentAccentColor : ManiFlixTheme.primaryText(colorScheme))
                                            .lineLimit(1)
                                        if ratio > 0.02 {
                                            ProgressView(value: ratio)
                                                .tint(prefs.currentAccentColor)
                                                .scaleEffect(x: 1, y: 0.7)
                                                .padding(.horizontal, 6)
                                        }
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 9)
                                }
                                .buttonStyle(.plain)
                                .adaptiveGlassCard(cornerRadius: 9, interactive: true, tint: isWatched ? prefs.currentAccentColor : nil)
                            }
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
                self.franchiseMeta = fr
                self.franchiseSeasons = TitleLocalizer.sortFranchiseSeasons(fr.seasons ?? [], baseTitle: fr.baseTitle)
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

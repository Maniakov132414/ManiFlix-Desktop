import SwiftUI

struct CatalogSearchView: View {
    @ObservedObject private var prefs = AppPreferences.shared
    @ObservedObject private var appState = AppState.shared
    @Environment(\.colorScheme) private var colorScheme
    @State private var containerWidth: CGFloat = 1000
    @State private var query: String = ""
    @State private var results: [MovieItem] = []
    @State private var isSearching = false
    @State private var isLoadingMore = false
    @State private var hasSearched = false
    @State private var currentPage = 1
    @State private var hasMore = false
    @State private var debounceTask: Task<Void, Never>?

    private let suggestions = ["Hành động", "Khoa học viễn tưởng", "Hình sự", "Tâm lý", "Hoạt hình", "Kinh dị"]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(suggestions, id: \.self) { topic in
                            Button {
                                query = topic
                                performSearch(immediate: true)
                            } label: {
                                Text(topic)
                                    .font(.caption.weight(.medium))
                                    .foregroundColor(ManiFlixTheme.primaryText(colorScheme))
                                    .padding(.horizontal, 12).padding(.vertical, 6)
                            }
                            .buttonStyle(.plain)
                            .adaptiveGlassCapsule(interactive: true)
                        }
                    }
                    .padding(.horizontal, 18)
                }

                if isSearching {
                    ProgressView().tint(prefs.currentAccentColor).frame(maxWidth: .infinity).padding(.vertical, 50)
                } else if results.isEmpty {
                    VStack(spacing: 10) {
                        Image(systemName: "magnifyingglass").font(.title2).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                        Text(hasSearched ? "Không có kết quả cho \"\(query)\"" : "Tìm theo tên phim, tên gốc hoặc diễn viên")
                            .font(.subheadline).foregroundColor(ManiFlixTheme.secondaryText(colorScheme))
                    }
                    .frame(maxWidth: .infinity).padding(.vertical, 70)
                } else {
                    let cols = Array(repeating: GridItem(.flexible(), spacing: 12), count: ManiFlixTheme.adaptiveGridColumnCount(width: containerWidth))
                    LazyVGrid(columns: cols, spacing: 16) {
                        ForEach(results.filter { !appState.isBlocked(slug: $0.slug) }) { movie in
                            NavigationLink(destination: MovieDetailView(slug: movie.slug, seedMovie: movie)) {
                                MoviePosterCard(movie: movie)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 18)

                    if hasMore {
                        HStack {
                            Spacer()
                            Button {
                                Task { await loadMoreResults() }
                            } label: {
                                HStack(spacing: 8) {
                                    if isLoadingMore { ProgressView().scaleEffect(0.75) }
                                    else { Image(systemName: "plus.circle") }
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
                        .padding(.top, 8)
                    }

                    Spacer().frame(height: containerWidth < 700 ? 94 : 32)
                }
            }
            .padding(.vertical, 12)
        }
        .background(ManiFlixTheme.background(scheme: colorScheme).ignoresSafeArea())
        .readContainerWidth($containerWidth)
        .navigationTitle("Tìm kiếm")
        .searchable(text: $query, prompt: "Tên phim, diễn viên...")
        .onChange(of: query) { _, _ in performSearch(immediate: false) }
        .onSubmit(of: .search) { performSearch(immediate: true) }
    }

    private func performSearch(immediate: Bool) {
        debounceTask?.cancel()
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else {
            results = []
            hasSearched = false
            hasMore = false
            currentPage = 1
            return
        }

        debounceTask = Task {
            if !immediate { try? await Task.sleep(nanoseconds: 320_000_000) }
            guard !Task.isCancelled else { return }
            isSearching = true
            currentPage = 1
            if let res = try? await ManiFlixAPI.shared.searchMovies(query: trimmed, page: 1) {
                let items = res.items ?? []
                self.results = items
                self.hasMore = res.hasMore ?? (items.count >= 12)
            } else {
                self.results = []
                self.hasMore = false
            }
            self.hasSearched = true
            isSearching = false
        }
    }

    private func loadMoreResults() async {
        let trimmed = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isLoadingMore, hasMore else { return }
        isLoadingMore = true
        let nextPage = currentPage + 1
        if let res = try? await ManiFlixAPI.shared.searchMovies(query: trimmed, page: nextPage) {
            let incoming = res.items ?? []
            let existing = Set(results.map(\.slug))
            let fresh = incoming.filter { !existing.contains($0.slug) }
            if fresh.isEmpty {
                hasMore = false
            } else {
                results.append(contentsOf: fresh)
                currentPage = nextPage
                hasMore = res.hasMore ?? !fresh.isEmpty
            }
        } else {
            hasMore = false
        }
        isLoadingMore = false
    }
}

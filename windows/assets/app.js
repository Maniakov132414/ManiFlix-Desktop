(() => {
  const APP_VERSION = '2.0.1';

  const THEME_PRESETS = [
    { id: 'crimson_violet', name: 'ManiFlix Mặc Định', mode: 'dark', accent: '#e11d48', bg: '#0b0f19', surface: '#0f172a' },
    { id: 'netflix_oled', name: 'Rạp Đen OLED', mode: 'oled', accent: '#e50914', bg: '#050507', surface: '#0d0d12' },
    { id: 'midnight_indigo', name: 'Đêm Xanh Indigo', mode: 'custom', accent: '#5e5ce6', bg: '#0b1020', surface: '#151c32' },
    { id: 'emerald_aurora', name: 'Lục Bảo Cực Quang', mode: 'custom', accent: '#10b981', bg: '#06120f', surface: '#0b1d19' },
    { id: 'cyber_rose', name: 'Cyberpunk Rose', mode: 'custom', accent: '#ff2d55', bg: '#140818', surface: '#221029' },
    { id: 'pure_light', name: 'Trắng Tinh Khôi', mode: 'light', accent: '#e11d48', bg: '#f4f5f8', surface: '#ffffff' }
  ];

  const ACCENT_PRESETS = [
    { id: 'crimson', name: 'Đỏ', hex: '#FA2D48' },
    { id: 'amber', name: 'Cam', hex: '#FF6448' },
    { id: 'sky', name: 'Xanh dương', hex: '#0A84FF' },
    { id: 'violet', name: 'Tím', hex: '#5E5CE6' },
    { id: 'emerald', name: 'Xanh lá', hex: '#30D158' }
  ];

  const CATEGORIES = [
    { id: 'all', label: 'Tất cả' },
    { id: 'cat:phim-bo', label: 'Phim bộ' },
    { id: 'cat:phim-le', label: 'Phim lẻ' },
    { id: 'cat:hoat-hinh', label: 'Hoạt hình' },
    { id: 'cat:tv-shows', label: 'TV Shows' },
    { id: 'genre:hanh-dong', label: 'Hành động' },
    { id: 'genre:co-trang', label: 'Cổ trang' },
    { id: 'genre:tinh-cam', label: 'Tình cảm' },
    { id: 'genre:kinh-di', label: 'Kinh dị' },
    { id: 'genre:vien-tuong', label: 'Viễn tưởng' }
  ];

  const IMG_FALLBACK_SVG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300"><rect width="200" height="300" fill="#18181c"/><rect x="64" y="114" width="72" height="52" rx="8" fill="none" stroke="#3f3f46" stroke-width="4"/><polygon points="92,130 116,140 92,150" fill="#52525b"/></svg>'
    );

  function svgIcon(name, size = 14) {
    const paths = {
      play: '<polygon points="6 3 20 12 6 21 6 3" fill="currentColor" stroke="none"/>',
      pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
      check: '<polyline points="20 6 9 17 4 12"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
      eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
      back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      forward: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
      chevLeft: '<polyline points="15 18 9 12 15 6"/>',
      chevRight: '<polyline points="9 18 15 12 9 6"/>',
      chevUp: '<polyline points="18 15 12 9 6 15"/>',
      chevDown: '<polyline points="6 9 12 15 18 9"/>',
      cloudUp: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
      close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      prev: '<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5"/>',
      next: '<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/>',
      user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      vol2: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
      volX: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
      replay10: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
      forward10: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
      pip: '<rect x="3" y="5" width="18" height="14" rx="2"/><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" stroke="none"/>',
      fullscreen: '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
      unfullscreen: '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>',
      list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
      refresh: '<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>',
      subtitles: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="6" y1="15" x2="10" y2="15"/><line x1="14" y1="15" x2="18" y2="15"/><line x1="6" y1="11" x2="14" y2="11"/>',
      gamepad: '<rect x="2" y="6" width="20" height="12" rx="5"/><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><circle cx="15" cy="11" r="1" fill="currentColor"/><circle cx="17" cy="13" r="1" fill="currentColor"/>'
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${paths[name] || ''}</svg>`;
  }

  function formatServerLabel(rawName, idx) {
    const s = String(rawName || '').trim();
    if (/thuyết\s*minh|thuyet\s*minh/i.test(s)) return `Thuyết minh #${idx + 1}`;
    if (/lồng\s*tiếng|long\s*tieng/i.test(s)) return `Lồng tiếng #${idx + 1}`;
    if (/engsub|english/i.test(s)) return `Engsub #${idx + 1}`;
    if (/vietsub|phụ\s*đề|phu\s*de/i.test(s)) return `Vietsub #${idx + 1}`;
    return `Máy chủ #${idx + 1}`;
  }

  function safeJsonParse(raw, fallback) {
    try { return JSON.parse(raw); } catch { return fallback; }
  }

  const state = {
    tab: 'discover',
    detailSlug: null,
    detailData: null,
    detailFranchise: [],
    detailRelated: [],
    selectedServerIdx: 0,
    franchiseExpanded: true,
    epFilter: '',
    settingsSubPage: 'main',
    librarySeg: 'history',
    category: 'all',
    heroIdx: 0,
    heroMovies: [],
    seriesMovies: [],
    singleMovies: [],
    animeMovies: [],
    filteredMovies: [],
    discoverPage: 1,
    discoverHasMore: false,
    discoverLoadingMore: false,
    categoryPage: 1,
    categoryHasMore: false,
    categoryLoadingMore: false,
    searchQuery: '',
    searchResults: [],
    searchPage: 1,
    searchHasMore: false,
    searchLoadingMore: false,
    token: localStorage.getItem('mf.token') || '',
    user: null,
    history: safeJsonParse(localStorage.getItem('mf.history') || '[]', []),
    epProgress: safeJsonParse(localStorage.getItem('mf.epProgress') || '{}', {}),
    favorites: [],
    blocked: safeJsonParse(localStorage.getItem('mf.blocked') || '[]', []),
    prefs: Object.assign({
      themeMode: 'dark',
      presetId: 'apple-dark',
      accent: '#FA2D48',
      bg: '#121214',
      surface: '#1C1C1E',
      ambient: true,
      phoneCols: 3,
      autoCutAds: true,
      introSkip: 'button',
      autoNext: true,
      uiLang: 'vi',
      defaultSubLang: 'vi',
      langOnboarded: false
    }, safeJsonParse(localStorage.getItem('mf.prefs') || '{}', {})),
    desktop: { width: 1180, height: 760, fullscreen: false, maximized: false, layoutMode: 'desktop', monitorName: 'Primary', refreshRateHz: 60 },
    monitor: {
      liveProbe: false,
      testing: false,
      timer: null,
      sysinfo: null,
      netStats: null,
      dlMbps: 0,
      ulMbps: 0,
      pingMs: 0,
      jitterMs: 0,
      dlSeries: [],
      ulSeries: [],
      pingSeries: [],
      serverCpuSeries: []
    }
  };

  let heroAutoTimer = null;
  let heroDirectBusy = false;

  // Delegated broken-image fallback (poster_url -> thumb_url -> SVG placeholder)
  document.addEventListener(
    'error',
    (e) => {
      const img = e.target;
      if (!img || img.tagName !== 'IMG') return;
      const step = img.getAttribute('data-fb-step') || '0';
      const altSrc = img.getAttribute('data-fallback');
      if (step === '0' && altSrc && img.src !== altSrc) {
        img.setAttribute('data-fb-step', '1');
        img.src = altSrc;
      } else if (step !== '2') {
        img.setAttribute('data-fb-step', '2');
        img.src = IMG_FALLBACK_SVG;
      }
    },
    true
  );

  function savePrefs() {
    localStorage.setItem('mf.prefs', JSON.stringify(state.prefs));
    applyTheme();
  }

  function hexLuminance(hex) {
    const h = (hex || '#121214').replace('#', '');
    if (h.length !== 6) return 0;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function resolvedPalette() {
    const p = state.prefs;
    let bg = p.bg, surface = p.surface, accent = p.accent;
    if (p.themeMode === 'oled') { bg = '#000000'; surface = '#161618'; }
    else if (p.themeMode === 'dark') { bg = '#121214'; surface = '#1C1C1E'; }
    else if (p.themeMode === 'light') { bg = '#F4F4F7'; surface = '#FFFFFF'; }
    else if (p.themeMode === 'system') {
      const isLightSys = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      bg = isLightSys ? '#F4F4F7' : '#121214';
      surface = isLightSys ? '#FFFFFF' : '#1C1C1E';
    }
    const isLight = hexLuminance(bg) > 0.55;
    return { bg, surface, accent, isLight };
  }

  function applyTheme() {
    const pal = resolvedPalette();
    const root = document.documentElement.style;
    root.setProperty('--accent', pal.accent);
    root.setProperty('--bg', pal.bg);
    root.setProperty('--surface', pal.surface);
    root.setProperty('--text-primary', pal.isLight ? '#16161C' : '#FFFFFF');
    root.setProperty('--text-secondary', pal.isLight ? '#5C5C69' : '#A4A4AD');
    root.setProperty('--card-fill', pal.isLight ? 'rgba(0,0,0,0.045)' : 'rgba(255,255,255,0.075)');
    root.setProperty('--card-stroke', pal.isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.11)');
    root.setProperty('--sidebar-bg', pal.isLight ? 'rgba(244,244,247,0.9)' : 'rgba(20,20,24,0.88)');
    root.setProperty('--phone-cols', String(state.prefs.phoneCols || 3));
    const amb = document.getElementById('ambientBackdrop');
    if (amb) amb.style.display = state.prefs.ambient ? 'block' : 'none';
  }

  function resolveImg(raw) {
    if (!raw) return '';
    let s = String(raw).trim();
    if (!s) return '';
    if (s.startsWith('http://') || s.startsWith('https://')) return s;
    if (s.startsWith('//')) return 'https:' + s;
    if (s.startsWith('/')) s = s.slice(1);
    if (s.startsWith('upload/') || s.startsWith('uploads/') || s.includes('/')) {
      return 'https://phimimg.com/' + s;
    }
    return 'https://phimimg.com/upload/vod/' + s;
  }

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  function toast(msg) {
    const el = document.getElementById('toastBanner');
    el.textContent = msg;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  async function api(path, opts = {}) {
    const headers = Object.assign({ 'Accept': 'application/json' }, opts.headers || {});
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
    if (opts.json !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.json);
    }
    const res = await fetch(path, Object.assign({}, opts, { headers }));
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt.slice(0, 120)}`);
    }
    return res.json();
  }

  function isDesktopLayout() {
    return window.innerWidth > 700 || state.desktop.maximized || state.desktop.fullscreen;
  }

  function syncDesktopChrome() {
    const shell = document.getElementById('appShell');
    shell.classList.toggle('desktop-mode', isDesktopLayout());

    const btnFs = document.getElementById('btnFullscreen');
    if (btnFs) btnFs.classList.toggle('active', !!state.desktop.fullscreen);

    const pFsBtn = document.getElementById('btnPlayerFullscreen');
    if (pFsBtn) {
      pFsBtn.innerHTML = svgIcon(state.desktop.fullscreen ? 'unfullscreen' : 'fullscreen', 15);
      pFsBtn.classList.toggle('active', !!state.desktop.fullscreen);
    }
  }

  window.__maniflixDesktopState = (snap) => {
    const wasDesk = isDesktopLayout();
    state.desktop = Object.assign({}, state.desktop, snap);
    syncDesktopChrome();
    if (wasDesk !== isDesktopLayout() && (state.detailSlug || state.tab === 'settings')) {
      render();
    }
  };

  async function windowOp(op) {
    try {
      const snap = await api(`/__desktop/window?op=${encodeURIComponent(op)}`);
      window.__maniflixDesktopState(snap);
    } catch {
      toast('Không thể đổi trạng thái cửa sổ');
    }
  }

  function setAmbientUrl() {
    // Ambient backdrop uses lightweight GPU radial gradients (zero blur-image decode)
  }

  function isBlocked(slug) {
    return state.blocked.some(b => b.slug === slug);
  }
  function isFavorite(slug) {
    return state.favorites.some(f => f.slug === slug);
  }

  function recordEpisodeProgress(slug, epIndex, t, dur) {
    if (!slug || !Number.isFinite(t) || t <= 0) return;
    if (!state.epProgress[slug]) state.epProgress[slug] = {};
    state.epProgress[slug][String(epIndex)] = {
      t: Math.round(t),
      d: Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0
    };
    localStorage.setItem('mf.epProgress', JSON.stringify(state.epProgress));
  }

  function getEpisodeProgressPct(slug, epIndex) {
    const rec = state.epProgress[slug]?.[String(epIndex)];
    if (rec && rec.d > 1) return Math.min(100, Math.round((rec.t / rec.d) * 100));
    const h = state.history.find(x => x.slug === slug && x.episodeIndex === epIndex);
    if (h && h.duration > 1) return Math.min(100, Math.round(((h.currentTime || 0) / h.duration) * 100));
    return 0;
  }

  async function bootstrapAuth() {
    if (!state.token) return;
    try {
      const me = await api('/api/auth/me');
      state.user = me.user || null;
      if (state.user?.themeConfig) {
        const tc = state.user.themeConfig;
        if (tc.accent) state.prefs.accent = tc.accent;
        if (tc.bg) state.prefs.bg = tc.bg;
        if (tc.surface) state.prefs.surface = tc.surface;
        if (tc.presetId) state.prefs.presetId = tc.presetId;
        savePrefs();
      }
      await refreshLibrary();
    } catch {
      state.token = '';
      localStorage.removeItem('mf.token');
    }
    updateAccountUI();
  }

  async function refreshLibrary() {
    if (!state.token) return;
    try {
      const [h, f] = await Promise.all([
        api('/api/user/history').catch(() => ({})),
        api('/api/user/favorites').catch(() => ({}))
      ]);
      if (Array.isArray(h.history)) {
        state.history = h.history;
        localStorage.setItem('mf.history', JSON.stringify(state.history));
      }
      if (Array.isArray(f.favorites)) state.favorites = f.favorites;
    } catch {}
  }

  function updateAccountUI() {
    const btn = document.getElementById('btnAccount');
    const card = document.getElementById('sidebarUserCard');
    if (state.user) {
      btn.innerHTML = `${svgIcon('user', 13)}<span>${esc(state.user.displayName || state.user.username)}</span>`;
      card.innerHTML = `<div class="su-title">${esc(state.user.displayName || state.user.username)}</div><div class="su-sub">@${esc(state.user.username)}</div>`;
    } else {
      btn.innerHTML = `${svgIcon('user', 13)}<span>Đăng nhập</span>`;
      card.innerHTML = `<div class="su-title">Chưa đăng nhập</div><div class="su-sub">Bấm để đăng nhập / đăng ký</div>`;
    }
  }

  function mergeUniqueMovies(existing, incoming) {
    const seen = new Set(existing.map(m => m.slug));
    const next = existing.slice();
    for (const item of incoming || []) {
      if (item && item.slug && !seen.has(item.slug)) {
        seen.add(item.slug);
        next.push(item);
      }
    }
    return next;
  }

  async function loadDiscover() {
    try {
      const [latest, series, single, anime] = await Promise.all([
        api('/api/movies?page=1'),
        api('/api/category?type=phim-bo&page=1').catch(() => ({ items: [] })),
        api('/api/category?type=phim-le&page=1').catch(() => ({ items: [] })),
        api('/api/category?type=hoat-hinh&page=1').catch(() => ({ items: [] }))
      ]);
      state.heroMovies = latest.items || [];
      state.discoverPage = 1;
      state.discoverHasMore = state.heroMovies.length >= 10;
      state.seriesMovies = series.items || [];
      state.singleMovies = single.items || [];
      state.animeMovies = anime.items || [];
      if (state.heroMovies[0]) {
        setAmbientUrl(resolveImg(state.heroMovies[0].poster_url || state.heroMovies[0].thumb_url));
      }
      render();
    } catch (e) {
      document.getElementById('mainContent').innerHTML = `<div class="glass-box">Không tải được dữ liệu: ${esc(e.message)} <button class="btn-accent" onclick="location.reload()">Thử lại</button></div>`;
    }
  }

  function appendCardsToGrid(gridId, btnId, incoming, hasMore) {
    const grid = document.getElementById(gridId);
    const visNew = (incoming || []).filter(m => !isBlocked(m.slug));
    if (grid && visNew.length) {
      grid.insertAdjacentHTML('beforeend', visNew.map(movieCardHtml).join(''));
    }
    const btn = document.getElementById(btnId);
    if (btn) {
      if (!hasMore) {
        const wrap = btn.closest('.load-more-wrap');
        if (wrap) wrap.remove(); else btn.remove();
      } else {
        btn.disabled = false;
        btn.textContent = 'Tải thêm phim';
      }
    }
  }

  async function loadMoreDiscover() {
    if (state.discoverLoadingMore || !state.discoverHasMore) return;
    state.discoverLoadingMore = true;
    const btn = document.getElementById('btnLoadMoreDiscover');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang tải...'; }
    try {
      const nextPage = state.discoverPage + 1;
      const data = await api(`/api/movies?page=${nextPage}`);
      const items = data.items || [];
      const prevSlugs = new Set(state.heroMovies.map(m => m.slug));
      const newItems = items.filter(m => m && m.slug && !prevSlugs.has(m.slug));
      state.discoverPage = nextPage;
      state.heroMovies = mergeUniqueMovies(state.heroMovies, items);
      state.discoverHasMore = items.length >= 10;
      appendCardsToGrid('discoverGrid', 'btnLoadMoreDiscover', newItems, state.discoverHasMore);
    } catch {
      toast('Không tải thêm được phim');
      if (btn) { btn.disabled = false; btn.textContent = 'Tải thêm phim'; }
    } finally {
      state.discoverLoadingMore = false;
    }
  }

  async function fetchCategoryPage(catId, page) {
    if (catId.startsWith('cat:')) {
      return api(`/api/category?type=${encodeURIComponent(catId.slice(4))}&page=${page}`);
    }
    return api(`/api/the-loai?slug=${encodeURIComponent(catId.slice(6))}&page=${page}`);
  }

  async function selectCategory(catId) {
    state.category = catId;
    state.categoryPage = 1;
    state.categoryHasMore = false;
    state.filteredMovies = [];
    if (catId === 'all') {
      render();
      return;
    }
    render();
    try {
      const data = await fetchCategoryPage(catId, 1);
      const items = data.items || [];
      state.filteredMovies = items;
      state.categoryHasMore = items.length >= 10;
      render();
    } catch {}
  }

  async function loadMoreCategory() {
    if (state.categoryLoadingMore || !state.categoryHasMore || state.category === 'all') return;
    state.categoryLoadingMore = true;
    const btn = document.getElementById('btnLoadMoreCat');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang tải...'; }
    try {
      const nextPage = state.categoryPage + 1;
      const data = await fetchCategoryPage(state.category, nextPage);
      const items = data.items || [];
      const prevSlugs = new Set(state.filteredMovies.map(m => m.slug));
      const newItems = items.filter(m => m && m.slug && !prevSlugs.has(m.slug));
      state.categoryPage = nextPage;
      state.filteredMovies = mergeUniqueMovies(state.filteredMovies, items);
      state.categoryHasMore = items.length >= 10;
      appendCardsToGrid('categoryGrid', 'btnLoadMoreCat', newItems, state.categoryHasMore);
    } catch {
      toast('Không tải thêm được phim');
      if (btn) { btn.disabled = false; btn.textContent = 'Tải thêm phim'; }
    } finally {
      state.categoryLoadingMore = false;
    }
  }

  async function directPlaySlug(slug) {
    if (!slug || heroDirectBusy) return;
    heroDirectBusy = true;
    toast('Đang mở trình phát...');
    try {
      const res = await api(`/api/movie/${encodeURIComponent(slug)}`);
      const movie = res.movie;
      const servers = res.episodes || [];
      if (!movie || !servers.length) {
        openDetail(slug);
        return;
      }
      const srv = servers[0] || { server_data: [] };
      const hist = state.history.find(h => h.slug === movie.slug);
      const epIdx = hist && Number.isInteger(hist.episodeIndex) && hist.episodeIndex < srv.server_data.length ? hist.episodeIndex : 0;
      openPlayer(movie, servers, 0, epIdx);
    } catch (e) {
      toast('Không phát được trực tiếp: ' + e.message);
      openDetail(slug);
    } finally {
      heroDirectBusy = false;
    }
  }

  const VI_DIACRITIC_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const PURE_CJK_RE = /^[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\s\d:!\-–—·.,'()[\]「」『』！？：、。／/]+$/;
  const HAS_CJK_RE = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
  const ROMAJI_TOKEN_RE = /\b(no|wa|ga|wo|ni|kara|made|tachi|monogatari|kyoukai|kanata|shoujo|shounen|sekai|kimi|boku|ore|mahou|tensei|isekai|kuromukuro|shinonome|gekijou|saiban|kako|mirai|kimetsu|yaiba|shingeki|kyojin|jujutsu|kaisen|sousou|kusuriya|hitorigoto|kaguya|kokoro|hikari|yami|kaze|sora|hoshi|yume|kami|oni|ryuu|ouji|hime|gakuen|sensou|densetsu|bouken|yuusha|maou|seirei|tenshi|akuma|shinigami|kyoushitsu|shigatsu|ansatsu|nanatsu|taizai|shokugeki|yakusoku|fumetsu|nariagari|subarashii|hajimeru|seishun|yarou|ressha|yuukaku|katanakaji|hashira|geiko)\b/i;
  const EN_COMMON_RE = /\b(the|beyond|boundary|of|and|in|for|with|from|into|world|story|movie|season|part|demon|slayer|attack|titan|my|hero|academia|sword|art|online|game|life|way|home|country|old|men|time|die|love|war|star|wars|lord|rings|harry|potter|avengers|spider|batman|superman|iron|captain|deadpool|wolverine|stranger|things|breaking|bad|walking|dead|house|dragon|throne|arcane|cyberpunk|edgerunners|frieren|journey|end|apothecary|diaries|solo|leveling|chainsaw|one|piece|ball|bleach|black|clover|hunter|blue|lock|wind|breaker|classroom|elite|reincarnated|slime|shield|rising|eminence|shadow|jobless|overlord|rascal|dream|bunny|girl|violet|evergarden|silent|voice|your|name|weathering|you|spirited|away|howl|moving|castle|princess|mononoke)\b/i;

  function normCmp(s) {
    return String(s || '').toLowerCase().replace(/[\s\-–—:·.,!?'()[\]"“”]+/g, ' ').trim();
  }
  function stripInlineCjk(s) {
    const raw = String(s || '').trim();
    if (!raw || PURE_CJK_RE.test(raw)) return '';
    const cleaned = raw.replace(/\([\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\s:!\-–—·.,']+\)/g, '').replace(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+/g, ' ').replace(/\s{2,}/g, ' ').replace(/^[\s/|\-–—:•]+|[\s/|\-–—:•]+$/g, '').trim();
    return cleaned.length >= 2 ? cleaned : '';
  }
  function classifyTitleSeg(seg) {
    const s = String(seg || '').trim();
    if (!s) return 'empty';
    if (PURE_CJK_RE.test(s)) return 'cjk';
    if (VI_DIACRITIC_RE.test(s)) return 'vi';
    const latin = HAS_CJK_RE.test(s) ? stripInlineCjk(s) : s;
    if (!latin) return 'cjk';
    if (VI_DIACRITIC_RE.test(latin)) return 'vi';
    if (ROMAJI_TOKEN_RE.test(latin) && !EN_COMMON_RE.test(latin)) return 'romaji';
    return 'en';
  }
  function getDisplayTitles(m) {
    if (!m || typeof m !== 'object') return { primary: '', secondary: '', secondaryWithYear: '' };
    const ui = state.prefs.uiLang === 'en' ? 'en' : 'vi';
    const rawName = String(m.name || m.title || '').trim();
    const rawOrig = String(m.origin_name || m.originName || '').trim();
    const yearStr = (m.year && String(m.year).trim() && String(m.year) !== '0') ? String(m.year).trim() : '';
    let viTitle = String(m.vi_name || '').trim();
    let enTitle = String(m.en_name || '').trim();
    let romajiTitle = String(m.romaji_name || '').trim();
    let otherLatin = '';
    let cjkFallback = '';
    if (enTitle && PURE_CJK_RE.test(enTitle)) enTitle = '';
    if (romajiTitle && PURE_CJK_RE.test(romajiTitle)) romajiTitle = '';
    if (enTitle && HAS_CJK_RE.test(enTitle)) enTitle = stripInlineCjk(enTitle);
    if (romajiTitle && HAS_CJK_RE.test(romajiTitle)) romajiTitle = stripInlineCjk(romajiTitle);
    const segs = rawName.split(/\s+(?:\/|\||•|;)\s+/).concat(rawOrig.split(/\s+(?:\/|\||•|;)\s+/)).map(x => x.trim()).filter(Boolean);
    for (const seg of segs) {
      const kind = classifyTitleSeg(seg);
      const cleanSeg = (kind !== 'cjk' && HAS_CJK_RE.test(seg)) ? stripInlineCjk(seg) : seg;
      if (kind === 'vi') { if (!viTitle) viTitle = cleanSeg; }
      else if (kind === 'en') { if (!enTitle) enTitle = cleanSeg; else if (!otherLatin && normCmp(cleanSeg) !== normCmp(enTitle)) otherLatin = cleanSeg; }
      else if (kind === 'romaji') { if (!romajiTitle) romajiTitle = cleanSeg; else if (!otherLatin && normCmp(cleanSeg) !== normCmp(romajiTitle)) otherLatin = cleanSeg; }
      else if (kind === 'cjk') { if (!cjkFallback) cjkFallback = seg; }
    }
    const anyLatin = enTitle || romajiTitle || viTitle || otherLatin || stripInlineCjk(rawName) || stripInlineCjk(rawOrig);
    const isDist = (a, b) => !!(a && b && normCmp(a) && normCmp(b) && normCmp(a) !== normCmp(b));
    let primary = '';
    let secondary = '';
    if (ui === 'en') {
      primary = enTitle || romajiTitle || otherLatin || viTitle || anyLatin || rawName || rawOrig || cjkFallback;
      if (romajiTitle && isDist(primary, romajiTitle) && !normCmp(primary).includes(normCmp(romajiTitle))) secondary = romajiTitle;
      else if (otherLatin && isDist(primary, otherLatin)) secondary = otherLatin;
      else if (viTitle && isDist(primary, viTitle)) secondary = viTitle;
    } else if (viTitle) {
      primary = viTitle;
      const sp = [];
      if (enTitle && isDist(primary, enTitle)) sp.push(enTitle);
      if (romajiTitle && isDist(primary, romajiTitle) && (!enTitle || (isDist(enTitle, romajiTitle) && !normCmp(enTitle).includes(normCmp(romajiTitle))))) sp.push(romajiTitle);
      if (!sp.length && otherLatin && isDist(primary, otherLatin)) sp.push(otherLatin);
      secondary = sp.slice(0, 2).join(' • ');
    } else {
      primary = enTitle || romajiTitle || otherLatin || anyLatin || rawName || rawOrig || cjkFallback;
      if (romajiTitle && isDist(primary, romajiTitle)) secondary = romajiTitle;
      else if (enTitle && isDist(primary, enTitle)) secondary = enTitle;
      else if (otherLatin && isDist(primary, otherLatin)) secondary = otherLatin;
    }
    const secondaryWithYear = secondary ? (yearStr && !secondary.includes(yearStr) ? `${secondary} (${yearStr})` : secondary) : (yearStr ? `(${yearStr})` : '');
    return { primary, secondary, secondaryWithYear };
  }

  function formatFranchiseSeasonChip(s, frMeta, list) {
    const ui = state.prefs.uiLang === 'en' ? 'en' : 'vi';
    const meta = frMeta || {};
    const prefixes = [meta.baseTitleVi, meta.baseTitleEn, meta.baseTitleRomaji, meta.baseTitle]
      .map(x => String(x || '').trim()).filter(x => x.length >= 3).sort((a, b) => b.length - a.length);
    const hasSeason2 = (list || []).some(it => {
      if (Number(it && it.seasonNumber) >= 2) return true;
      const pr = `${it?.name || ''} ${it?.nameVi || ''} ${it?.nameEn || ''} ${it?.fullTitle || ''} ${it?.slug || ''}`;
      return /(?:phần|phan|season|ss|mùa|mua)[\s\-_]*(?:[2-9]|\d{2,}|ii|iii|iv)\b/i.test(pr);
    });
    let cur = String(ui === 'en' ? (s.nameEn || s.name || s.title || s.fullTitle || '') : (s.nameVi || s.name || s.title || s.fullTitle || '')).trim();
    const rawPicked = cur;
    for (const p of prefixes) {
      const escRe = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`^${escRe}[\\s:!\\-–—.]*$`, 'i').test(cur)) { cur = ''; break; }
      const leadRe = new RegExp(`^${escRe}(?:\\s*[:\\-–—!|•]+\\s*|\\s+(?=(?:Movie|Phần|Phan|Season|SS|Mùa|OVA|ONA|Special|SP|Mini|Idol|Shinonome|Chapter|Part|Arc)\\b))`, 'i');
      if (leadRe.test(cur)) { cur = cur.replace(leadRe, '').trim(); break; }
    }
    cur = cur.replace(/^[:\-–—•|\s]+/, '').trim();
    if (!cur || /^tv\s*series$/i.test(cur)) {
      cur = /^tv\s*series$/i.test(rawPicked) ? 'TV Series' : (hasSeason2 ? (ui === 'en' ? 'Season 1' : 'Phần 1') : 'TV Series');
    } else if (ui === 'en' && !s.nameEn) {
      cur = cur.replace(/^Phần\s+(\d+)\b/i, 'Season $1').replace(/^Mùa\s+(\d+)\b/i, 'Season $1');
    } else if (ui === 'vi' && !s.nameVi) {
      cur = cur.replace(/^Season\s+(\d+)\b/i, 'Phần $1');
    }
    const fullTip = (ui === 'en' ? (s.originName || s.fullTitle || cur) : (s.fullTitle || cur)) + (s.year ? ` (${s.year})` : '');
    return { label: cur, tooltip: fullTip };
  }

  function tr(vi, en) {
    return state.prefs.uiLang === 'en' ? en : vi;
  }

  function formatSubBadge(m) {
    const subs = Array.isArray(m && m.sub_langs) ? m.sub_langs : [];
    const ui = state.prefs.uiLang === 'en' ? 'en' : 'vi';
    const rawLang = String((m && m.lang) || 'Vietsub').trim();
    if (subs.length >= 2) {
      const viMap = { vi: 'Vietsub', en: 'Engsub', zh: 'Sub Trung', ja: 'Sub Nhật', ko: 'Sub Hàn', th: 'Sub Thái' };
      const enMap = { vi: 'VI Sub', en: 'EN Sub', zh: 'ZH Sub', ja: 'JA Sub', ko: 'KO Sub', th: 'TH Sub' };
      const map = ui === 'en' ? enMap : viMap;
      const ordered = [...subs].sort((a, b) => ((a === 'vi' ? 0 : (a === 'en' ? 1 : 2)) - (b === 'vi' ? 0 : (b === 'en' ? 1 : 2))));
      const top = ordered.slice(0, 2).map(c => map[c] || c.toUpperCase());
      const extra = ordered.length > 2 ? ` +${ordered.length - 2}` : '';
      return top.join(' + ') + extra;
    }
    if (ui === 'en') {
      return rawLang.replace(/Vietsub/gi, 'VI Sub').replace(/Engsub/gi, 'EN Sub').replace(/Thuyết Minh/gi, 'Voiceover').replace(/Lồng Tiếng/gi, 'Dubbed');
    }
    return rawLang || 'Vietsub';
  }

  function openDesktopLanguageModal(isOnboarding) {
    const root = document.getElementById('modalRoot');
    if (!root) return;
    const selUi = state.prefs.uiLang === 'en' ? 'en' : 'vi';
    root.innerHTML = `
      <div class="modal-backdrop" id="langModalBackdrop">
        <div class="modal-card" style="max-width:460px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong style="font-size:18px">${isOnboarding ? 'Chọn ngôn ngữ / Choose Language' : tr('Ngôn ngữ & Phụ đề', 'Language & Subtitles')}</strong>
            ${isOnboarding ? '' : `<button class="p-btn p-btn-icon" id="btnCloseLangModal">${svgIcon('close', 14)}</button>`}
          </div>
          <div style="font-size:12.5px;color:var(--text-secondary);margin-bottom:14px">
            ${isOnboarding ? 'Chọn ngôn ngữ hiển thị và phụ đề mặc định khi mở phim:' : tr('Chọn ngôn ngữ ứng dụng và phụ đề mặc định:', 'Choose app language and default subtitle:')}
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="s-row clickable" id="btnPickLangVi" style="border-radius:12px;border:1.5px solid ${selUi === 'vi' ? 'var(--accent)' : 'var(--card-stroke)'};background:var(--card-fill);padding:14px">
              <div style="text-align:left">
                <div style="font-weight:700;font-size:14px">Tiếng Việt</div>
                <div class="s-sub">Giao diện Tiếng Việt • Phụ đề mặc định: Tiếng Việt</div>
              </div>
              <span style="font-weight:800;color:var(--accent)">VI</span>
            </button>
            <button class="s-row clickable" id="btnPickLangEn" style="border-radius:12px;border:1.5px solid ${selUi === 'en' ? 'var(--accent)' : 'var(--card-stroke)'};background:var(--card-fill);padding:14px">
              <div style="text-align:left">
                <div style="font-weight:700;font-size:14px">English</div>
                <div class="s-sub">English UI • Default Subtitle: English</div>
              </div>
              <span style="font-weight:800;color:var(--accent)">EN</span>
            </button>
          </div>
        </div>
      </div>`;
    const choose = (lang) => {
      state.prefs.uiLang = lang;
      state.prefs.defaultSubLang = lang;
      state.prefs.langOnboarded = true;
      savePrefs();
      root.innerHTML = '';
      render();
    };
    document.getElementById('btnPickLangVi').onclick = () => choose('vi');
    document.getElementById('btnPickLangEn').onclick = () => choose('en');
    const cl = document.getElementById('btnCloseLangModal');
    if (cl) cl.onclick = () => { root.innerHTML = ''; };
  }

  function movieCardHtml(m) {
    const primary = resolveImg(m.poster_url || m.thumb_url) || IMG_FALLBACK_SVG;
    const secondary = resolveImg(m.thumb_url || m.poster_url) || '';
    const badge = m.quality || m.episode_current || '';
    const yr = m.year ? `${m.year} / ` : '';
    const t = getDisplayTitles(m);
    const dispTitle = t.primary || m.name || m.slug;
    const tip = t.secondary ? `${dispTitle} (${t.secondary})` : dispTitle;
    return `
      <div class="movie-card" data-slug="${esc(m.slug)}" title="${esc(tip)}">
        <div class="poster-wrap">
          <img loading="lazy" decoding="async" src="${esc(primary)}" data-fallback="${esc(secondary)}" alt="${esc(dispTitle)}" />
          ${badge ? `<span class="poster-badge">${esc(badge)}</span>` : ''}
        </div>
        <div class="movie-name">${esc(dispTitle)}</div>
        <div class="movie-meta">${esc(yr + formatSubBadge(m))}</div>
      </div>`;
  }

  function railSectionHtml(title, cardsHtml, railId) {
    return `
      <div class="section-hdr">
        <h3 class="section-title">${esc(title)}</h3>
        <div class="rail-nav-group">
          <button class="rail-nav-btn" data-rail-target="${esc(railId)}" data-rail-dir="-1" title="Cuộn trái">${svgIcon('chevLeft', 14)}</button>
          <button class="rail-nav-btn" data-rail-target="${esc(railId)}" data-rail-dir="1" title="Cuộn phải">${svgIcon('chevRight', 14)}</button>
        </div>
      </div>
      <div class="rail" id="${esc(railId)}">${cardsHtml}</div>`;
  }

  function getFeaturedHeroList() {
    return state.heroMovies.filter(m => !isBlocked(m.slug)).slice(0, 5);
  }

  function heroBannerHtml(featured) {
    const hero = featured[state.heroIdx] || featured[0];
    if (!hero) return '';
    const bg = resolveImg(hero.thumb_url || hero.poster_url) || IMG_FALLBACK_SVG;
    const bgFb = resolveImg(hero.poster_url) || '';
    const ht = getDisplayTitles(hero);
    return `
      <div class="hero-card" id="heroCard">
        <img class="hero-bg" id="heroBgImg" decoding="async" src="${esc(bg)}" data-fallback="${esc(bgFb)}" alt="" />
        <div class="hero-grad"></div>
        <button class="hero-nav hero-prev" id="btnHeroPrev" title="Phim trước">${svgIcon('chevLeft', 18)}</button>
        <button class="hero-nav hero-next" id="btnHeroNext" title="Phim tiếp">${svgIcon('chevRight', 18)}</button>
        <div class="hero-body">
          <span class="hero-tag" id="heroTag">${tr('PHIM MỚI', 'NEW')} / ${esc(hero.quality || 'HD')} / ${esc(formatSubBadge(hero))}</span>
          <h2 class="hero-title" id="heroTitle">${esc(ht.primary || hero.name)}</h2>
          <div class="hero-sub" id="heroSub">${esc(ht.secondaryWithYear)}</div>
          <div class="hero-actions">
            <button class="btn-accent hero-btn" id="btnHeroPlay" data-hero-play="${esc(hero.slug)}">${svgIcon('play', 14)}<span>${tr('Xem ngay', 'Watch Now')}</span></button>
            <button class="btn-glass hero-btn" id="btnHeroDetail" data-open-slug="${esc(hero.slug)}">${svgIcon('info', 14)}<span>${tr('Chi tiết', 'Details')}</span></button>
            <button class="btn-glass hero-btn" id="btnHeroFav" data-fav-slug="${esc(hero.slug)}">${svgIcon(isFavorite(hero.slug) ? 'check' : 'plus', 14)}<span>${isFavorite(hero.slug) ? tr('Đã lưu', 'Saved') : tr('Tủ phim', 'My List')}</span></button>
          </div>
        </div>
      </div>
      <div class="hero-dots" id="heroDots">
        ${featured.map((_, i) => `<button class="hero-dot ${i === state.heroIdx ? 'active' : ''}" data-hero-idx="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}
      </div>`;
  }

  function updateHeroInPlace() {
    const featured = getFeaturedHeroList();
    if (!featured.length) return;
    if (state.heroIdx >= featured.length) state.heroIdx = 0;
    const hero = featured[state.heroIdx];
    const bgImg = document.getElementById('heroBgImg');
    const tagEl = document.getElementById('heroTag');
    const titleEl = document.getElementById('heroTitle');
    const subEl = document.getElementById('heroSub');
    const playBtn = document.getElementById('btnHeroPlay');
    const detBtn = document.getElementById('btnHeroDetail');
    const favBtn = document.getElementById('btnHeroFav');
    const dots = document.getElementById('heroDots');
    if (!bgImg || !dots) return;

    const bg = resolveImg(hero.thumb_url || hero.poster_url) || IMG_FALLBACK_SVG;
    const bgFb = resolveImg(hero.poster_url) || '';
    bgImg.setAttribute('data-fb-step', '0');
    bgImg.setAttribute('data-fallback', bgFb);
    if (bgImg.src !== bg) bgImg.src = bg;
    const ht = getDisplayTitles(hero);
    if (tagEl) tagEl.textContent = `${tr('PHIM MỚI', 'NEW')} / ${hero.quality || 'HD'} / ${formatSubBadge(hero)}`;
    if (titleEl) titleEl.textContent = ht.primary || hero.name || '';
    if (subEl) subEl.textContent = ht.secondaryWithYear || '';
    if (playBtn) playBtn.dataset.heroPlay = hero.slug;
    if (detBtn) detBtn.dataset.openSlug = hero.slug;
    if (favBtn) {
      favBtn.dataset.favSlug = hero.slug;
      const fav = isFavorite(hero.slug);
      favBtn.innerHTML = `${svgIcon(fav ? 'check' : 'plus', 14)}<span>${fav ? tr('Đã lưu', 'Saved') : tr('Tủ phim', 'My List')}</span>`;
    }
    dots.querySelectorAll('.hero-dot').forEach((d, idx) => {
      d.classList.toggle('active', idx === state.heroIdx);
    });
  }

  function bindHeroEvents() {
    const mc = document.getElementById('mainContent');
    if (!mc) return;
    const btnPrev = document.getElementById('btnHeroPrev');
    const btnNext = document.getElementById('btnHeroNext');
    const featured = getFeaturedHeroList();
    if (btnPrev && featured.length) {
      btnPrev.onclick = () => {
        state.heroIdx = (state.heroIdx - 1 + featured.length) % featured.length;
        updateHeroInPlace();
        resetHeroAutoTimer();
      };
    }
    if (btnNext && featured.length) {
      btnNext.onclick = () => {
        state.heroIdx = (state.heroIdx + 1) % featured.length;
        updateHeroInPlace();
        resetHeroAutoTimer();
      };
    }
    mc.querySelectorAll('[data-hero-idx]').forEach(el => {
      el.onclick = () => {
        state.heroIdx = parseInt(el.dataset.heroIdx, 10) || 0;
        updateHeroInPlace();
        resetHeroAutoTimer();
      };
    });
    mc.querySelectorAll('[data-hero-play]').forEach(el => {
      el.onclick = () => directPlaySlug(el.dataset.heroPlay);
    });
    mc.querySelectorAll('[data-open-slug]').forEach(el => {
      el.onclick = () => openDetail(el.dataset.openSlug);
    });
    mc.querySelectorAll('[data-fav-slug]').forEach(el => {
      el.onclick = async () => {
        if (!state.token) { openAuthModal(); return; }
        const slug = el.dataset.favSlug;
        const m = state.heroMovies.find(x => x.slug === slug);
        if (!m) return;
        try {
          const r = await api('/api/user/favorites/toggle', {
            method: 'POST',
            json: { slug: m.slug, name: m.name, poster: m.poster_url || m.thumb_url || '', year: m.year || 0, quality: m.quality || 'HD', lang: m.lang || 'Vietsub' }
          });
          if (Array.isArray(r.favorites)) state.favorites = r.favorites;
          const fav = isFavorite(slug);
          el.innerHTML = `${svgIcon(fav ? 'check' : 'plus', 14)}<span>${fav ? 'Đã lưu' : 'Tủ phim'}</span>`;
        } catch {}
      };
    });
  }

  function resetHeroAutoTimer() {
    clearInterval(heroAutoTimer);
    heroAutoTimer = setInterval(() => {
      if (state.tab !== 'discover' || state.category !== 'all' || state.detailSlug || playerCtrl.isOpen()) return;
      const featured = getFeaturedHeroList();
      if (featured.length <= 1) return;
      state.heroIdx = (state.heroIdx + 1) % featured.length;
      updateHeroInPlace();
    }, 7000);
  }

  function renderDiscover() {
    const visibleHero = state.heroMovies.filter(m => !isBlocked(m.slug));
    const featured = visibleHero.slice(0, 5);
    if (state.heroIdx >= featured.length) state.heroIdx = 0;
    const hero = featured[state.heroIdx] || featured[0];
    if (hero) setAmbientUrl(resolveImg(hero.poster_url || hero.thumb_url));

    let html = `<div class="chips-row">`;
    for (const c of CATEGORIES) {
      html += `<button class="chip cat-chip ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`;
    }
    html += `</div>`;

    if (state.category === 'all') {
      html += heroBannerHtml(featured);

      if (state.history.length > 0) {
        const histCards = state.history.slice(0, 12).map(h => `
          <div class="movie-card" data-slug="${esc(h.slug)}">
            <div class="poster-wrap">
              <img loading="lazy" decoding="async" src="${esc(resolveImg(h.poster) || IMG_FALLBACK_SVG)}" alt="" />
              <span class="poster-badge">${esc(h.episodeName || 'Tập 1')}</span>
            </div>
            <div class="movie-name">${esc(h.name || h.slug)}</div>
            <div class="movie-meta">Xem tiếp</div>
          </div>`).join('');
        html += railSectionHtml('Tiếp tục xem', histCards, 'railHistory');
      }

      const rails = [
        ['Phim bộ mới', state.seriesMovies, 'railSeries'],
        ['Phim lẻ tuyển chọn', state.singleMovies, 'railSingle'],
        ['Hoạt hình & Anime', state.animeMovies, 'railAnime']
      ];
      for (const [title, list, id] of rails) {
        const vis = (list || []).filter(m => !isBlocked(m.slug)).slice(0, 14);
        if (!vis.length) continue;
        html += railSectionHtml(title, vis.map(movieCardHtml).join(''), id);
      }

      html += `<div class="section-hdr"><h3 class="section-title">Mới cập nhật</h3></div><div class="movie-grid" id="discoverGrid">${visibleHero.map(movieCardHtml).join('')}</div>`;
      if (state.discoverHasMore) {
        html += `<div class="load-more-wrap"><button class="btn-glass" id="btnLoadMoreDiscover" ${state.discoverLoadingMore ? 'disabled' : ''}>${state.discoverLoadingMore ? 'Đang tải...' : 'Tải thêm phim'}</button></div>`;
      }
    } else {
      const catLabel = CATEGORIES.find(c => c.id === state.category)?.label || '';
      const list = state.filteredMovies.filter(m => !isBlocked(m.slug));
      html += `<div class="section-hdr"><h3 class="section-title">${esc(catLabel)}</h3></div>`;
      html += list.length
        ? `<div class="movie-grid" id="categoryGrid">${list.map(movieCardHtml).join('')}</div>`
        : `<div class="glass-box">Đang tải danh sách...</div>`;
      if (list.length && state.categoryHasMore) {
        html += `<div class="load-more-wrap"><button class="btn-glass" id="btnLoadMoreCat" ${state.categoryLoadingMore ? 'disabled' : ''}>${state.categoryLoadingMore ? 'Đang tải...' : 'Tải thêm phim'}</button></div>`;
      }
    }

    return html;
  }

  async function openDetail(slug) {
    state.detailSlug = slug;
    state.detailData = null;
    state.detailFranchise = [];
    state.detailRelated = [];
    state.selectedServerIdx = 0;
    state.epFilter = '';
    render();
    try {
      const [res, fr] = await Promise.all([
        api(`/api/movie/${encodeURIComponent(slug)}`),
        api(`/api/franchise?slug=${encodeURIComponent(slug)}`).catch(() => ({ seasons: [] }))
      ]);
      state.detailData = res;
      state.detailFranchise = fr.seasons || [];
      state.detailFranchiseMeta = {
        baseTitle: fr.baseTitle || '',
        baseTitleVi: fr.baseTitleVi || res.movie?.vi_name || '',
        baseTitleEn: fr.baseTitleEn || res.movie?.en_name || '',
        baseTitleRomaji: fr.baseTitleRomaji || res.movie?.romaji_name || ''
      };
      if (res.movie) setAmbientUrl(resolveImg(res.movie.poster_url || res.movie.thumb_url));
      const gSlug = res.movie?.category?.[0]?.slug;
      if (gSlug) {
        api(`/api/the-loai?slug=${encodeURIComponent(gSlug)}&page=1`).then(r => {
          state.detailRelated = (r.items || []).filter(i => i.slug !== slug).slice(0, 10);
          render();
        }).catch(() => {});
      }
      render();
    } catch (e) {
      toast('Lỗi tải phim: ' + e.message);
    }
  }

  function formatPeopleList(val) {
    if (Array.isArray(val)) return val.map(v => String(v || '').trim()).filter(Boolean).join(', ');
    return String(val || '').trim();
  }

  function buildEpisodeButtonsHtml(slug, list, activeEpIndex) {
    const q = (state.epFilter || '').trim().toLowerCase();
    const filtered = list
      .map((ep, idx) => ({ ep, idx }))
      .filter(({ ep }) => !q || String(ep.name || '').toLowerCase().includes(q));
    if (!filtered.length) {
      return `<div style="grid-column:1/-1;color:var(--text-secondary);font-size:12.5px;padding:6px 0">Không tìm thấy tập phù hợp.</div>`;
    }
    return filtered.map(({ ep, idx }) => {
      const pct = getEpisodeProgressPct(slug, idx);
      const isActive = activeEpIndex === idx;
      const watchedCls = pct >= 85 ? 'watched' : '';
      return `
        <button class="ep-btn ${isActive ? 'active' : ''} ${watchedCls}" data-play-ep="${idx}">
          <span>${esc(ep.name)}</span>
          ${pct > 0 ? `<span class="ep-btn-bar"><span style="width:${pct}%"></span></span>` : ''}
        </button>`;
    }).join('');
  }

  function renderDetail() {
    const res = state.detailData;
    let html = `<button class="detail-back" id="btnDetailBack">${svgIcon('back', 14)}<span>Quay lại</span></button>`;
    if (!res || !res.movie) {
      return html + `<div class="glass-box">Đang tải chi tiết phim...</div>`;
    }
    const m = res.movie;
    const servers = res.episodes || [];
    const srv = servers[state.selectedServerIdx] || { server_data: [] };
    const hist = state.history.find(h => h.slug === m.slug);
    const resumePct = hist && hist.duration > 1 ? Math.min(100, Math.round(((hist.currentTime || 0) / hist.duration) * 100)) : 0;
    const synopsis = (m.content || '').replace(/<[^>]+>/g, '').trim();
    const poster = resolveImg(m.poster_url || m.thumb_url) || IMG_FALLBACK_SVG;
    const posterFb = resolveImg(m.thumb_url || m.poster_url) || '';

    const actors = formatPeopleList(m.actor);
    const directors = formatPeopleList(m.director);
    const countries = Array.isArray(m.country) ? m.country.map(c => c.name).filter(Boolean).join(', ') : '';

    const dt = getDisplayTitles(m);
    const detailSubParts = [];
    if (dt.secondary) detailSubParts.push(dt.secondary);
    if (m.year) detailSubParts.push(String(m.year));
    if (m.lang || (Array.isArray(m.sub_langs) && m.sub_langs.length)) detailSubParts.push(formatSubBadge(m));
    const leftCol = `
      <div>
        <img class="detail-poster" decoding="async" src="${esc(poster)}" data-fallback="${esc(posterFb)}" alt="" />
        <h2 class="detail-title">${esc(dt.primary || m.name)}</h2>
        ${detailSubParts.length ? `<div class="detail-origin">${esc(detailSubParts.join(' / '))}</div>` : ''}
        <div class="detail-actions">
          <button class="btn-accent" id="btnDetailPlay">${svgIcon('play', 14)}<span>${hist ? 'Xem tiếp: ' + esc(hist.episodeName || 'Tập 1') : 'Phát'}</span></button>
          <button class="btn-glass" id="btnDetailFav" style="color:var(--text-primary)">${svgIcon('bookmark', 14)}<span>${isFavorite(m.slug) ? 'Đã lưu' : 'Lưu'}</span></button>
          <button class="btn-glass" id="btnDetailBlock" style="color:var(--text-primary)">${svgIcon('eyeOff', 14)}<span>Ẩn</span></button>
        </div>
        ${hist ? `
          <div class="glass-box" style="padding:10px 12px">
            <div style="display:flex;justify-content:space-between;font-size:12px">
              <span>Tiến độ: <strong>${esc(hist.episodeName || 'Tập 1')}</strong></span>
              <span style="color:var(--text-secondary)">${formatTime(hist.currentTime || 0)}${hist.duration ? ' / ' + formatTime(hist.duration) : ''} (${resumePct}%)</span>
            </div>
            <div class="progress-track"><div class="progress-fill" style="width:${resumePct}%"></div></div>
          </div>` : ''}
        <div class="chips-row">
          ${m.quality ? `<span class="chip">${esc(m.quality)}</span>` : ''}
          ${m.episode_current ? `<span class="chip">${esc(m.episode_current)}</span>` : ''}
          ${(m.category || []).slice(0, 4).map(c => `<span class="chip">${esc(c.name)}</span>`).join('')}
        </div>
        ${(directors || actors || countries || m.time) ? `
          <div class="glass-box">
            <div style="font-weight:700;margin-bottom:4px">Thông tin phim</div>
            <div class="detail-meta-list">
              ${countries ? `<div class="detail-meta-row"><span class="detail-meta-lbl">Quốc gia</span><span class="detail-meta-val">${esc(countries)}</span></div>` : ''}
              ${m.time ? `<div class="detail-meta-row"><span class="detail-meta-lbl">Thời lượng</span><span class="detail-meta-val">${esc(m.time)}</span></div>` : ''}
              ${directors ? `<div class="detail-meta-row"><span class="detail-meta-lbl">Đạo diễn</span><span class="detail-meta-val">${esc(directors)}</span></div>` : ''}
              ${actors ? `<div class="detail-meta-row"><span class="detail-meta-lbl">Diễn viên</span><span class="detail-meta-val">${esc(actors)}</span></div>` : ''}
            </div>
          </div>` : ''}
        ${synopsis ? `<div class="glass-box"><div style="font-weight:700;margin-bottom:6px">Giới thiệu</div><div style="font-size:13px;line-height:1.5;color:var(--text-secondary)">${esc(synopsis)}</div></div>` : ''}
      </div>`;

    let franchiseHtml = '';
    if (state.detailFranchise.length > 1) {
      const fMeta = state.detailFranchiseMeta || {};
      const fBase = state.prefs.uiLang === 'en'
        ? (fMeta.baseTitleEn || getDisplayTitles({ name: fMeta.baseTitle, vi_name: fMeta.baseTitleVi, en_name: fMeta.baseTitleEn, romaji_name: fMeta.baseTitleRomaji }).primary || '')
        : (fMeta.baseTitleVi || getDisplayTitles({ name: fMeta.baseTitle, vi_name: fMeta.baseTitleVi, en_name: fMeta.baseTitleEn, romaji_name: fMeta.baseTitleRomaji }).primary || '');
      const fHdr = state.prefs.uiLang === 'en'
        ? (fBase ? `Franchise: ${fBase} (${state.detailFranchise.length} parts)` : `Franchise (${state.detailFranchise.length} parts)`)
        : (fBase ? `Các phần phim: ${fBase} (${state.detailFranchise.length} phần)` : `Các phần phim (${state.detailFranchise.length})`);
      franchiseHtml = `
        <div class="glass-box">
          <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="btnToggleFranchise">
            <strong>${esc(fHdr)}</strong>
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--accent)">${state.franchiseExpanded ? tr('Thu gọn ', 'Collapse ') + svgIcon('chevUp', 13) : tr('Mở rộng ', 'Expand ') + svgIcon('chevDown', 13)}</span>
          </div>
          ${state.franchiseExpanded ? `<div class="franchise-list">${state.detailFranchise.map(s => {
            const fc = formatFranchiseSeasonChip(s, fMeta, state.detailFranchise);
            return `<button class="season-chip ${s.slug === m.slug ? 'active' : ''}" data-slug="${esc(s.slug)}" title="${esc(fc.tooltip)}">${esc(fc.label)}</button>`;
          }).join('')}</div>` : ''}
        </div>`;
    }

    const activeEpIdx = hist ? hist.episodeIndex : -1;
    const rightCol = `
      <div>
        ${franchiseHtml}
        <div class="glass-box">
          <div class="chips-row">
            ${servers.map((s, i) => `<button class="chip ${i === state.selectedServerIdx ? 'active' : ''}" data-srv-idx="${i}">${esc(formatServerLabel(s.server_name, i))}</button>`).join('')}
          </div>
          <div class="ep-toolbar">
            <div style="font-weight:700">Danh sách tập (${srv.server_data.length})</div>
            ${srv.server_data.length > 8 ? `<input id="epSearchInput" class="ep-search-input" placeholder="Lọc tập (vd: 12)..." value="${esc(state.epFilter)}" />` : ''}
          </div>
          <div class="ep-grid" id="detailEpGrid">
            ${buildEpisodeButtonsHtml(m.slug, srv.server_data, activeEpIdx)}
          </div>
        </div>
        ${state.detailRelated.length ? railSectionHtml('Có thể bạn cũng thích', state.detailRelated.map(movieCardHtml).join(''), 'railRelated') : ''}
      </div>`;

    return html + `<div class="detail-layout">${leftCol}${rightCol}</div>`;
  }

  function renderSearch() {
    const topics = ['Hành động', 'Khoa học viễn tưởng', 'Hình sự', 'Tâm lý', 'Hoạt hình', 'Kinh dị'];
    const vis = state.searchResults.filter(m => !isBlocked(m.slug));
    return `
      <div class="search-bar">
        <input id="searchInput" class="search-input" placeholder="Tìm tên phim, tên gốc, diễn viên... (Ctrl+K hoặc /)" value="${esc(state.searchQuery)}" />
        <button id="btnRunSearch" class="btn-accent">Tìm</button>
      </div>
      <div class="chips-row">
        ${topics.map(t => `<button class="chip" data-search-topic="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      ${vis.length
        ? `<div class="movie-grid" id="searchGrid">${vis.map(movieCardHtml).join('')}</div>
           ${state.searchHasMore ? `<div class="load-more-wrap"><button class="btn-glass" id="btnLoadMoreSearch" ${state.searchLoadingMore ? 'disabled' : ''}>${state.searchLoadingMore ? 'Đang tải...' : 'Tải thêm phim'}</button></div>` : ''}`
        : `<div class="glass-box" style="text-align:center;color:var(--text-secondary)">${state.searchQuery ? 'Không có kết quả phù hợp.' : 'Nhập từ khoá hoặc chọn chủ đề bên trên.'}</div>`}
    `;
  }

  let searchDebounce = null;
  async function runSearch(q) {
    state.searchQuery = q;
    state.searchPage = 1;
    state.searchHasMore = false;
    const trimmed = q.trim();
    if (!trimmed) {
      state.searchResults = [];
      render();
      return;
    }
    try {
      const r = await api(`/api/search?q=${encodeURIComponent(trimmed)}&page=1`);
      const items = r.items || [];
      state.searchResults = items;
      state.searchHasMore = items.length >= 10;
      render();
      const inp = document.getElementById('searchInput');
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    } catch {}
  }

  async function loadMoreSearch() {
    const trimmed = state.searchQuery.trim();
    if (!trimmed || state.searchLoadingMore || !state.searchHasMore) return;
    state.searchLoadingMore = true;
    const btn = document.getElementById('btnLoadMoreSearch');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang tải...'; }
    try {
      const nextPage = state.searchPage + 1;
      const r = await api(`/api/search?q=${encodeURIComponent(trimmed)}&page=${nextPage}`);
      const items = r.items || [];
      const prevSlugs = new Set(state.searchResults.map(m => m.slug));
      const newItems = items.filter(m => m && m.slug && !prevSlugs.has(m.slug));
      state.searchPage = nextPage;
      state.searchResults = mergeUniqueMovies(state.searchResults, items);
      state.searchHasMore = items.length >= 10;
      appendCardsToGrid('searchGrid', 'btnLoadMoreSearch', newItems, state.searchHasMore);
    } catch {
      toast('Không tải thêm được kết quả');
      if (btn) { btn.disabled = false; btn.textContent = 'Tải thêm phim'; }
    } finally {
      state.searchLoadingMore = false;
    }
  }

  function renderLibrary() {
    const segs = [
      ['history', 'Đang xem'],
      ['favorites', 'Đã lưu'],
      ['blocked', `Đã ẩn (${state.blocked.length})`]
    ];
    let html = `<div class="seg-tabs">${segs.map(([k, l]) => `<button class="seg-btn ${state.librarySeg === k ? 'active' : ''}" data-lib-seg="${k}">${l}</button>`).join('')}</div>`;

    if (state.librarySeg === 'history') {
      if (!state.history.length) return html + `<div class="glass-box">Chưa có phim đang xem.</div>`;
      html += state.history.map(h => {
        const pct = h.duration > 1 ? Math.min(100, Math.round((h.currentTime || 0) / h.duration * 100)) : 0;
        return `
          <div class="hist-row" data-slug="${esc(h.slug)}">
            <img class="hist-thumb" loading="lazy" decoding="async" src="${esc(resolveImg(h.poster) || IMG_FALLBACK_SVG)}" alt="" />
            <div style="flex:1;min-width:0">
              <div class="movie-name">${esc(h.name || h.slug)}</div>
              <div class="movie-meta">${esc(h.episodeName || 'Tập 1')} (${pct}%)</div>
              <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
            </div>
            <button class="tb-btn" data-del-hist="${esc(h.slug)}">Xoá</button>
          </div>`;
      }).join('');
    } else if (state.librarySeg === 'favorites') {
      if (!state.user) return html + `<div class="glass-box">Đăng nhập để xem danh sách đã lưu. <button class="btn-accent" id="btnLibLogin" style="margin-left:8px">Đăng nhập</button></div>`;
      if (!state.favorites.length) return html + `<div class="glass-box">Chưa có phim đã lưu.</div>`;
      html += `<div class="movie-grid">${state.favorites.map(f => movieCardHtml({ slug: f.slug, name: f.name || f.slug, poster_url: f.poster, year: f.year, quality: f.quality, lang: f.lang })).join('')}</div>`;
    } else {
      if (!state.blocked.length) return html + `<div class="glass-box">Chưa có phim nào bị ẩn.</div>`;
      html += state.blocked.map(b => `
        <div class="hist-row">
          <img class="hist-thumb" loading="lazy" decoding="async" style="width:48px;height:68px" src="${esc(resolveImg(b.poster) || IMG_FALLBACK_SVG)}" alt="" />
          <div style="flex:1;min-width:0">
            <div class="movie-name">${esc(b.name)}</div>
            <div class="movie-meta">Đang ẩn khỏi Trang chủ & Tìm kiếm</div>
          </div>
          <button class="btn-accent" data-unblock="${esc(b.slug)}">Hiện lại</button>
        </div>`).join('');
    }
    return html;
  }

  function renderSettings() {
    if (state.settingsSubPage === 'theme') return renderThemeSubPage();
    if (state.settingsSubPage === 'monitor') return renderMonitorSubPage();

    const modeLabels = { system: 'Hệ thống', light: 'Sáng', dark: 'Tối', oled: 'Đen OLED', custom: 'Tuỳ chỉnh' };
    return `
      <div class="settings-wrap">
        <div class="settings-section">
          <div class="settings-label">Tài khoản</div>
          <div class="settings-card">
            <div class="s-row clickable" id="btnSettingsAuth">
              <div>
                <div style="font-weight:700">${state.user ? esc(state.user.displayName || state.user.username) : 'Đăng nhập hoặc tạo tài khoản'}</div>
                <div class="s-sub">${state.user ? '@' + esc(state.user.username) : 'Đồng bộ tủ phim, lịch sử & giao diện'}</div>
              </div>
              <span style="display:inline-flex;align-items:center;gap:4px">${state.user ? 'Đăng xuất' : svgIcon('chevRight', 16)}</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">${tr('Ngôn ngữ & Phụ đề', 'Language & Subtitles')}</div>
          <div class="settings-card">
            <div class="s-row">
              <span>${tr('Ngôn ngữ ứng dụng', 'App Language')}</span>
              <select id="selUiLang">
                <option value="vi" ${state.prefs.uiLang !== 'en' ? 'selected' : ''}>Tiếng Việt</option>
                <option value="en" ${state.prefs.uiLang === 'en' ? 'selected' : ''}>English</option>
              </select>
            </div>
            <div class="s-row">
              <span>${tr('Phụ đề mặc định', 'Default Subtitle')}</span>
              <select id="selDefaultSub">
                <option value="vi" ${(state.prefs.defaultSubLang || 'vi') === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                <option value="en" ${state.prefs.defaultSubLang === 'en' ? 'selected' : ''}>English</option>
                <option value="off" ${state.prefs.defaultSubLang === 'off' ? 'selected' : ''}>Tắt phụ đề</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">${tr('Tuỳ biến & Chẩn đoán', 'Appearance & Diagnostics')}</div>
          <div class="settings-card">
            <div class="s-row clickable" data-subpage="theme">
              <div>
                <div style="font-weight:700">Giao diện & Chủ đề</div>
                <div class="s-sub">Xem trước trực tiếp (${modeLabels[state.prefs.themeMode] || 'Tối'})</div>
              </div>
              <span style="color:var(--accent);display:inline-flex">${svgIcon('chevRight', 16)}</span>
            </div>
            <div class="s-row clickable" data-subpage="monitor">
              <div>
                <div style="font-weight:700">Kiểm tra mạng & Thiết bị</div>
                <div class="s-sub">CPU, RAM, ổ đĩa & đo tốc độ mạng</div>
              </div>
              <span style="color:var(--accent);display:inline-flex">${svgIcon('chevRight', 16)}</span>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">Trình phát & Bố cục</div>
          <div class="settings-card">
            <div class="s-row">
              <span>Tự cắt đoạn quảng cáo</span>
              <input type="checkbox" id="chkAutoAds" ${state.prefs.autoCutAds ? 'checked' : ''} />
            </div>
            <div class="s-row">
              <span>Mở đầu & kết thúc (TheIntroDB)</span>
              <select id="selIntroSkip">
                <option value="button" ${state.prefs.introSkip === 'button' ? 'selected' : ''}>Hiện nút bỏ qua</option>
                <option value="auto" ${state.prefs.introSkip === 'auto' ? 'selected' : ''}>Tự động bỏ qua</option>
                <option value="off" ${state.prefs.introSkip === 'off' ? 'selected' : ''}>Tắt</option>
              </select>
            </div>
            <div class="s-row">
              <span>Tự chuyển tập tiếp theo</span>
              <input type="checkbox" id="chkAutoNext" ${state.prefs.autoNext ? 'checked' : ''} />
            </div>
            <div class="s-row">
              <span>Số cột cửa sổ nhỏ</span>
              <select id="selPhoneCols">
                <option value="2" ${state.prefs.phoneCols === 2 ? 'selected' : ''}>2 cột</option>
                <option value="3" ${state.prefs.phoneCols === 3 ? 'selected' : ''}>3 cột</option>
              </select>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-label">Ứng dụng</div>
          <div class="settings-card">
            <div class="s-row"><span>Phiên bản</span><span class="s-sub">${APP_VERSION}</span></div>
            <div class="s-row clickable" id="btnResetPrefs"><span style="color:#ff453a;font-weight:600">Đặt lại mặc định</span></div>
          </div>
        </div>
      </div>`;
  }

  function renderThemeSubPage() {
    const pal = resolvedPalette();
    const txt = pal.isLight ? '#16161C' : '#FFFFFF';
    const subTxt = pal.isLight ? '#5C5C69' : '#A4A4AD';
    return `
      <div class="settings-wrap">
        <button class="detail-back" data-subpage="main">${svgIcon('back', 14)}<span>Cài đặt</span></button>
        <h3 style="margin:0 0 12px">Giao diện & Chủ đề</h3>

        <div class="taurus-frame" style="background:${pal.bg};color:${txt}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-size:11px;font-weight:700;color:${subTxt}">XEM TRƯỚC TRỰC TIẾP</span>
            <span style="font-size:10.5px;padding:2px 8px;border-radius:999px;background:${pal.accent};color:#fff;font-weight:700">${esc(state.prefs.themeMode.toUpperCase())}</span>
          </div>
          <div class="taurus-hero">
            <div style="font-size:9.5px;font-weight:800;color:${pal.accent};margin-bottom:3px">PHIM MỚI / FHD</div>
            <div style="font-size:15px;font-weight:800;margin-bottom:8px">Thanh Gươm Diệt Quỷ</div>
            <div style="display:flex;gap:8px">
              <span style="display:inline-flex;align-items:center;gap:5px;background:${pal.accent};color:#fff;padding:5px 12px;border-radius:999px;font-size:11px;font-weight:700">${svgIcon('play', 11)}<span>Xem ngay</span></span>
              <span style="display:inline-flex;align-items:center;gap:5px;background:${pal.surface};color:${txt};padding:5px 12px;border-radius:999px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,0.12)">${svgIcon('plus', 11)}<span>Tủ phim</span></span>
            </div>
          </div>
          <div class="taurus-cards">
            <div class="taurus-card" style="background:${pal.surface}">
              <div class="taurus-poster" style="background:linear-gradient(135deg,${pal.accent}55,${pal.surface})"></div>
              <div style="font-size:11.5px;font-weight:700">Interstellar</div>
              <div style="font-size:10px;color:${subTxt}">2014 / Vietsub</div>
            </div>
            <div class="taurus-card" style="background:${pal.surface}">
              <div class="taurus-poster" style="background:linear-gradient(135deg,#0A84FF55,${pal.surface})"></div>
              <div style="font-size:11.5px;font-weight:700">Dune: Part Two</div>
              <div style="font-size:10px;color:${subTxt}">2024 / FHD</div>
            </div>
          </div>
          <div class="taurus-nav" style="background:${pal.surface}">
            <span style="color:${pal.accent}">Trang chủ</span>
            <span style="color:${subTxt}">Tìm kiếm</span>
            <span style="color:${subTxt}">Tủ phim</span>
            <span style="color:${subTxt}">Cài đặt</span>
          </div>
        </div>

        <div class="settings-card">
          <div class="s-row">
            <span>Chế độ giao diện</span>
            <select id="selThemeMode">
              <option value="system" ${state.prefs.themeMode==='system'?'selected':''}>Tự động</option>
              <option value="dark" ${state.prefs.themeMode==='dark'?'selected':''}>Tối</option>
              <option value="oled" ${state.prefs.themeMode==='oled'?'selected':''}>Đen OLED</option>
              <option value="light" ${state.prefs.themeMode==='light'?'selected':''}>Sáng</option>
              <option value="custom" ${state.prefs.themeMode==='custom'?'selected':''}>Tuỳ chỉnh</option>
            </select>
          </div>
          <div class="s-row" style="flex-direction:column;align-items:stretch">
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:6px">Bộ giao diện gợi ý</div>
            <div class="chips-row" style="margin:0">
              ${THEME_PRESETS.map(pr => `<button class="chip ${state.prefs.presetId===pr.id?'active':''}" data-preset="${pr.id}">${esc(pr.name)}</button>`).join('')}
            </div>
          </div>
          <div class="s-row">
            <span>Màu chủ đạo</span>
            <div class="swatch-row">
              ${ACCENT_PRESETS.map(a => `<button class="swatch ${state.prefs.accent.toLowerCase()===a.hex.toLowerCase()?'active':''}" style="background:${a.hex}" data-accent="${a.hex}" title="${a.name}"></button>`).join('')}
            </div>
          </div>
          <div class="s-row"><span>Màu nhấn tuỳ chỉnh</span><input type="color" id="pickAccent" value="${esc(state.prefs.accent)}" /></div>
          <div class="s-row"><span>Màu nền tuỳ chỉnh</span><input type="color" id="pickBg" value="${esc(state.prefs.bg)}" /></div>
          <div class="s-row"><span>Màu thẻ / bề mặt</span><input type="color" id="pickSurface" value="${esc(state.prefs.surface)}" /></div>
          <div class="s-row"><span>Ánh nền theo ảnh phim</span><input type="checkbox" id="chkAmbient" ${state.prefs.ambient?'checked':''} /></div>
          ${state.user ? `<div class="s-row clickable" id="btnSyncTheme"><span style="display:inline-flex;align-items:center;gap:6px;color:var(--accent);font-weight:700">${svgIcon('cloudUp', 15)}<span>Đồng bộ lên tài khoản</span></span></div>` : ''}
        </div>
      </div>`;
  }

  function getActiveGamepadLabel() {
    if (!navigator.getGamepads) return '';
    try {
      const pads = navigator.getGamepads() || [];
      for (let i = 0; i < pads.length; i++) {
        if (pads[i] && pads[i].connected) {
          return String(pads[i].id || 'Gamepad').replace(/\s*\([^)]*\)\s*/g, ' ').trim() || 'Tay cầm 60fps';
        }
      }
    } catch {}
    return '';
  }

  function renderMonitorSubPage(showBackBtn = true) {
    const si = state.monitor.sysinfo;
    const ns = state.monitor.netStats;
    const dl = state.monitor.dlMbps;
    const ul = state.monitor.ulMbps;
    const ping = state.monitor.pingMs;
    const jitter = state.monitor.jitterMs;

    const score = Math.min(100, Math.round(
      Math.min(55, dl * 1.4) +
      Math.max(0, 25 - Math.min(25, ping / 6)) +
      (si ? Math.min(20, si.cpuLogicalCores * 2) : 10)
    ));
    const t720 = dl >= 5;
    const t1080 = dl >= 12;
    const t4k = dl >= 28 && (!si || si.totalRamMb >= 6000);

    let osDisplay = '...';
    if (si) {
      const nameStr = String(si.osName || '').trim();
      const verStr = String(si.osVersion || '').trim();
      const archStr = si.arch ? ` (${si.arch})` : '';
      if (verStr && verStr !== 'Unknown' && !nameStr.toLowerCase().includes(verStr.toLowerCase())) {
        osDisplay = `${nameStr} ${verStr}${archStr}`;
      } else {
        osDisplay = `${nameStr || 'Linux / Desktop'}${archStr}`;
      }
    }
    const kernelDisplay = si ? (si.kernelVersion || 'Mặc định hệ thống') : '...';
    const runtimeDisplay = si ? (si.runtime || 'Native WebView') : '...';
    const dpiScale = si && si.window && si.window.scaleFactor ? si.window.scaleFactor : (window.devicePixelRatio || 1);
    const gpLabel = getActiveGamepadLabel();

    return `
      <div class="settings-wrap" style="max-width:980px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            ${showBackBtn ? `<button class="detail-back" style="margin:0" data-subpage="main">${svgIcon('back', 14)}<span>Cài đặt</span></button>` : ''}
            <h3 style="margin:0">Kiểm tra mạng & Thiết bị</h3>
            <span class="win-pill" style="color:#30D158;border-color:#30D158">LIVE</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="tb-btn ${state.monitor.liveProbe ? 'active' : ''}" id="btnToggleProbe">Live Probe: ${state.monitor.liveProbe ? 'BẬT' : 'TẮT'}</button>
            <button class="btn-accent" id="btnRunSpeedtest" ${state.monitor.testing ? 'disabled' : ''}>${state.monitor.testing ? 'Đang đo...' : 'Đo Speedtest Ngay'}</button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-lbl">Tải xuống</div><div class="kpi-val" style="color:#30D158">${dl.toFixed(1)} Mbps</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Tải lên</div><div class="kpi-val" style="color:#0A84FF">${ul.toFixed(1)} Mbps</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Ping / Jitter</div><div class="kpi-val">${Math.round(ping)} / ${Math.round(jitter)} ms</div></div>
          <div class="kpi-card"><div class="kpi-lbl">RAM Tiến trình / CPU</div><div class="kpi-val">${si ? si.processRssMb.toFixed(0) : '--'} MB (${si ? si.cpuUsagePct.toFixed(0) : '0'}%)</div></div>
        </div>

        <div class="charts-grid">
          <div class="chart-box">
            <div style="font-size:12px;font-weight:700;margin-bottom:6px">Băng thông Tải xuống / Tải lên (Mbps)</div>
            <canvas id="canvasNetSpeed" width="420" height="135"></canvas>
          </div>
          <div class="chart-box">
            <div style="font-size:12px;font-weight:700;margin-bottom:6px">Ping (ms) & Server CPU (%)</div>
            <canvas id="canvasPingLoad" width="420" height="135"></canvas>
          </div>
        </div>

        <div class="glass-box">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <strong>Sức Tải Tối Đa Của Máy & Mạng</strong>
            <span style="font-weight:800;color:var(--accent)">${score}%</span>
          </div>
          <div class="progress-track" style="height:8px;margin-bottom:10px"><div class="progress-fill" style="width:${score}%"></div></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="chip ${t720?'active':''}" style="display:inline-flex;align-items:center;gap:4px"><span>720p HD</span>${t720?svgIcon('check',12):''}</span>
            <span class="chip ${t1080?'active':''}" style="display:inline-flex;align-items:center;gap:4px"><span>1080p60 FHD</span>${t1080?svgIcon('check',12):''}</span>
            <span class="chip ${t4k?'active':''}" style="display:inline-flex;align-items:center;gap:4px"><span>2K / 4K HDR</span>${t4k?svgIcon('check',12):''}</span>
          </div>
        </div>

        <div class="spec-grid">
          <div class="glass-box">
            <div style="font-weight:700;margin-bottom:8px">Phần cứng & Môi trường</div>
            <div class="spec-kv"><span>Hệ điều hành</span><strong>${esc(osDisplay)}</strong></div>
            <div class="spec-kv"><span>Nhân Kernel</span><strong>${esc(kernelDisplay)}</strong></div>
            <div class="spec-kv"><span>Runtime hiển thị</span><strong>${esc(runtimeDisplay)}</strong></div>
            <div class="spec-kv"><span>CPU</span><strong>${si ? esc(si.cpuBrand) : '...'}</strong></div>
            <div class="spec-kv"><span>Nhân CPU</span><strong>${si ? `${si.cpuPhysicalCores} vật lý / ${si.cpuLogicalCores} luồng` : '...'}</strong></div>
            <div class="spec-kv"><span>RAM Hệ thống</span><strong>${si ? `${(si.usedRamMb/1024).toFixed(1)} / ${(si.totalRamMb/1024).toFixed(1)} GB (Trống ${(si.freeRamMb/1024).toFixed(1)} GB)` : '...'}</strong></div>
            <div class="spec-kv"><span>Ổ đĩa (${si ? esc(si.diskMount || '/') : '/'})</span><strong>${si ? `Trống ${si.diskFreeGb} / ${si.diskTotalGb} GB` : '...'}</strong></div>
            <div class="spec-kv"><span>Cửa sổ & HiDPI</span><strong>${si ? `${si.window.width}x${si.window.height} @ ${si.window.refreshRateHz} Hz (${Number(dpiScale).toFixed(2)}x)` : '...'}</strong></div>
            <div class="spec-kv"><span>Tay cầm (Gamepad)</span><strong>${gpLabel ? esc(gpLabel) : 'Chế độ chờ (0% CPU)'}</strong></div>
          </div>
          <div class="glass-box">
            <div style="font-weight:700;margin-bottom:8px">Máy chủ & Mạng (phim.maniakov.bond)</div>
            <div class="spec-kv"><span>Trạng thái API</span><strong>${ns && ns.ok ? 'Trực tuyến (OK)' : 'Đang kết nối...'}</strong></div>
            <div class="spec-kv"><span>Server RX / TX</span><strong>${ns ? `${ns.rxMbps} / ${ns.txMbps} Mbps` : '...'}</strong></div>
            <div class="spec-kv"><span>Peak RX / TX</span><strong>${ns ? `${ns.peakRxMbps} / ${ns.peakTxMbps} Mbps` : '...'}</strong></div>
            <div class="spec-kv"><span>Server CPU / RAM</span><strong>${ns ? `${ns.cpuPct}% / ${ns.memPct}%` : '...'}</strong></div>
            <div class="spec-kv"><span>Yêu cầu đang xử lý</span><strong>${ns ? `${ns.activeRequests} active (${ns.reqPerSec}/s)` : '...'}</strong></div>
            <div class="spec-kv"><span>Uptime Server</span><strong>${ns ? `${Math.floor(ns.uptimeSec / 60)} phút` : '...'}</strong></div>
          </div>
        </div>
      </div>`;
  }

  function drawChart(canvasId, seriesA, seriesB, colorA, colorB) {
    const c = document.getElementById(canvasId);
    if (!c) return;
    const ctx = c.getContext('2d');
    const w = c.width, h = c.height;
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i = 1; i < 4; i++) {
      const y = (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    const maxVal = Math.max(10, ...seriesA, ...seriesB);
    const plot = (arr, color) => {
      if (arr.length < 2) return;
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      ctx.beginPath();
      arr.forEach((v, idx) => {
        const x = (idx / Math.max(1, arr.length - 1)) * (w - 8) + 4;
        const y = h - 8 - (v / maxVal) * (h - 18);
        if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
    };
    plot(seriesA, colorA);
    plot(seriesB, colorB);
  }

  function isMonitorVisible() {
    return !state.detailSlug && (state.tab === 'monitor' || (state.tab === 'settings' && state.settingsSubPage === 'monitor'));
  }

  function refreshMonitorChartsIfVisible() {
    if (isMonitorVisible()) {
      render();
    }
  }

  async function measurePingJitter() {
    const runProbeSet = async (makeUrl) => {
      const warm = await fetch(makeUrl('warm'), { cache: 'no-store' });
      if (!warm.ok) throw new Error('Ping warmup failed');
      await warm.arrayBuffer();
      const samples = [];
      for (let i = 0; i < 4; i++) {
        const t0 = performance.now();
        const r = await fetch(makeUrl(i), { cache: 'no-store' });
        if (!r.ok) throw new Error('Ping probe failed');
        await r.arrayBuffer();
        samples.push(Math.max(0.5, performance.now() - t0));
      }
      const avgPing = samples.reduce((a, b) => a + b, 0) / samples.length;
      let jitterSum = 0;
      for (let i = 1; i < samples.length; i++) jitterSum += Math.abs(samples[i] - samples[i - 1]);
      const jitter = samples.length > 1 ? jitterSum / (samples.length - 1) : 0;
      return { pingMs: avgPing, jitterMs: jitter };
    };

    try {
      return await runProbeSet(k => `https://speed.cloudflare.com/__down?bytes=0&_t=${Date.now()}_${k}_${Math.random()}`);
    } catch {
      return await runProbeSet(k => `/api/net-probe?kb=1&_t=${Date.now()}_${k}`);
    }
  }

  async function readStreamBytes(res) {
    if (res.body && typeof res.body.getReader === 'function') {
      const reader = res.body.getReader();
      let total = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) total += value.byteLength;
      }
      return total;
    }
    const buf = await res.arrayBuffer();
    return buf.byteLength;
  }

  async function measureParallelDownload(urls) {
    const responses = await Promise.all(urls.map(u => fetch(u, { cache: 'no-store' })));
    for (const r of responses) {
      if (!r.ok) throw new Error('Download stream HTTP ' + r.status);
    }
    const t0 = performance.now();
    const counts = await Promise.all(responses.map(readStreamBytes));
    const elapsedSec = Math.max(0.05, (performance.now() - t0) / 1000);
    const totalBytes = counts.reduce((a, b) => a + b, 0);
    return (totalBytes * 8) / (elapsedSec * 1_000_000);
  }

  async function measureDownloadSpeed(streamsCount = 4, cfBytes = 6000000, fallbackKb = 2048) {
    try {
      const cfUrls = Array.from({ length: streamsCount }, (_, i) =>
        `https://speed.cloudflare.com/__down?bytes=${cfBytes}&_r=${Date.now()}_${i}_${Math.random()}`
      );
      return await measureParallelDownload(cfUrls);
    } catch {
      const fbUrls = Array.from({ length: streamsCount }, (_, i) =>
        `/api/net-probe?kb=${fallbackKb}&_r=${Date.now()}_${i}_${Math.random()}`
      );
      return await measureParallelDownload(fbUrls);
    }
  }

  async function measureUploadSpeed() {
    const postStreams = async (url, byteLen) => {
      const payload = new Uint8Array(byteLen);
      const t0 = performance.now();
      const resps = await Promise.all([0, 1].map(() =>
        fetch(url, {
          method: 'POST',
          cache: 'no-store',
          body: payload,
          headers: { 'Content-Type': 'application/octet-stream' }
        })
      ));
      for (const r of resps) {
        if (!r.ok) throw new Error('Upload HTTP ' + r.status);
      }
      const elapsedSec = Math.max(0.05, (performance.now() - t0) / 1000);
      return (byteLen * 2 * 8) / (elapsedSec * 1_000_000);
    };

    try {
      return await postStreams('https://speed.cloudflare.com/__up', 1_500_000);
    } catch {
      return await postStreams('/api/net-up', 512 * 1024);
    }
  }

  function pushMonitorSeries(ns) {
    const push = (arr, v) => { arr.push(v); if (arr.length > 24) arr.shift(); };
    push(state.monitor.dlSeries, state.monitor.dlMbps);
    push(state.monitor.ulSeries, state.monitor.ulMbps);
    push(state.monitor.pingSeries, state.monitor.pingMs);
    push(state.monitor.serverCpuSeries, ns?.cpuPct || 0);
  }

  async function pollMonitor(mode = 'telemetry') {
    if (mode === 'full' && state.monitor.testing) return;
    if (mode === 'full') {
      state.monitor.testing = true;
      refreshMonitorChartsIfVisible();
    }
    try {
      const [si, ns] = await Promise.all([
        api('/__desktop/sysinfo'),
        api('/api/net-stats').catch(() => null)
      ]);
      state.monitor.sysinfo = si;
      if (ns) state.monitor.netStats = ns;

      if (mode === 'full') {
        const pj = await measurePingJitter();
        state.monitor.pingMs = pj.pingMs;
        state.monitor.jitterMs = pj.jitterMs;

        state.monitor.dlMbps = await measureDownloadSpeed(4, 6000000, 2048);
        state.monitor.ulMbps = await measureUploadSpeed();
        pushMonitorSeries(ns);
      } else if (mode === 'live1mb') {
        const pj = await measurePingJitter();
        state.monitor.pingMs = pj.pingMs;
        state.monitor.jitterMs = pj.jitterMs;
        state.monitor.dlMbps = await measureDownloadSpeed(1, 1000000, 1024);
        pushMonitorSeries(ns);
      }

      refreshMonitorChartsIfVisible();
    } catch {
      refreshMonitorChartsIfVisible();
    } finally {
      if (mode === 'full') {
        state.monitor.testing = false;
        refreshMonitorChartsIfVisible();
      }
    }
  }

  function startMonitorLoop() {
    stopMonitorLoop();
    pollMonitor('full');
    state.monitor.timer = setInterval(() => {
      if (isMonitorVisible()) {
        pollMonitor(state.monitor.liveProbe ? 'live1mb' : 'telemetry');
      }
    }, 8000);
  }

  function stopMonitorLoop() {
    if (state.monitor.timer) {
      clearInterval(state.monitor.timer);
      state.monitor.timer = null;
    }
  }

  const playerCtrl = (() => {
    let active = null;

    return {
      isOpen: () => !!active,
      isDrawerOpen: () => !!(active && active.drawerOpen),
      closeDrawer: () => { if (active) active.setDrawer(false); },
      close: () => { if (active) active.close(); },
      togglePlay: () => { if (active) active.togglePlay(); },
      seekBy: (sec) => { if (active) active.seekBy(sec); },
      adjustVolume: (delta) => { if (active) active.adjustVolume(delta); },
      toggleMute: () => { if (active) active.toggleMute(); },
      toggleFullscreen: () => { if (active) active.toggleFullscreen(); },
      nextEp: () => { if (active) active.stepEpisode(1); },
      prevEp: () => { if (active) active.stepEpisode(-1); },
      triggerSkip: () => { if (active) active.triggerSkip(); },
      cycleSubtitle: () => { if (active) active.cycleSubtitle(); },
      adjustSubDelay: (delta) => { if (active) active.adjustSubDelay(delta); },
      resetSubDelay: () => { if (active) active.resetSubDelay(); },
      _setActive: (inst) => { active = inst; }
    };
  })();

  function openPlayer(movie, servers, initialServerIdx, initialEpisodeIdx) {
    if (playerCtrl.isOpen()) playerCtrl.close();

    const root = document.getElementById('playerRoot');
    let serverIndex = initialServerIdx || 0;
    let episodeIndex = initialEpisodeIdx || 0;
    let hls = null;
    let markers = [];
    let skippedIds = new Set();
    let activeSkip = null;
    let lastSave = -999;
    let drawerOpen = false;
    let drawerFilter = '';
    let hudTimer = null;
    let flashTimer = null;
    let draggingScrub = false;
    let boostVal = 1.0;
    let audioCtx = null;
    let mediaSrc = null;
    let gainNode = null;
    let curSrcIsClean = true;
    let activeSubLang = ['vi', 'en', 'off'].includes(state.prefs.defaultSubLang) ? state.prefs.defaultSubLang : 'vi';
    let subDelaySec = 0;
    let useCustomSubOverlay = false;

    const srv0 = servers[serverIndex] || { server_data: [] };
    const ep0 = srv0.server_data[episodeIndex];
    if (!ep0 || !ep0.link_m3u8) { toast('Tập này chưa có luồng HLS'); return; }

    root.innerHTML = `
      <div class="player-overlay" id="playerOverlay">
        <div id="playerStage" class="player-stage">
          <video id="videoEl" autoplay playsinline></video>
          <div id="playerSubOverlay" class="player-sub-overlay hidden"></div>
        </div>

        <div class="player-buffering hidden" id="playerBuffering"></div>
        <div class="player-center-flash" id="playerFlash"></div>

        <div class="player-topbar" id="playerTopbar">
          <div class="player-title-wrap">
            <div class="player-title" id="playerTitleText"></div>
            <div class="player-sub" id="playerSourceLbl">Luồng phát: Tối ưu HD</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <button class="p-btn" id="btnPlayerDrawer" title="Danh sách tập & máy chủ">${svgIcon('list', 14)}<span>Tập phim</span></button>
            <button class="p-btn" id="btnPlayerClose" title="Đóng trình phát (Esc / Tay cầm B)">${svgIcon('close', 14)}<span>Đóng</span></button>
          </div>
        </div>

        <button id="btnSkipMarker" class="skip-floating hidden"><span>Bỏ qua mở đầu</span>${svgIcon('forward', 14)}</button>

        <div class="player-bottom-hud" id="playerBottomHud">
          <div class="scrubber-wrap" id="scrubberWrap">
            <div class="scrubber-track" id="scrubberTrack">
              <div class="scrubber-buf" id="scrubberBuf" style="width:0%"></div>
              <div class="scrubber-fill" id="scrubberFill" style="width:0%"></div>
              <div class="scrubber-markers" id="scrubberMarkers"></div>
              <div class="scrubber-thumb" id="scrubberThumb" style="left:0%"></div>
            </div>
            <div class="scrubber-tooltip" id="scrubberTooltip">0:00</div>
          </div>

          <div class="player-ctrl-row">
            <div class="player-ctrl-group">
              <button class="p-btn p-btn-icon" id="btnPlayPause" title="Phát / Tạm dừng (Space/K)">${svgIcon('pause', 15)}</button>
              <button class="p-btn" id="btnSeekBack" title="Lùi 10 giây (J / Trái)">${svgIcon('replay10', 14)}<span>10s</span></button>
              <button class="p-btn" id="btnSeekFwd" title="Tiến 10 giây (L / Phải)"><span>10s</span>${svgIcon('forward10', 14)}</button>
              <button class="p-btn p-btn-icon" id="btnPrevEp" title="Tập trước (P / LB)">${svgIcon('prev', 14)}</button>
              <button class="p-btn p-btn-icon" id="btnNextEp" title="Tập sau (N / RB)">${svgIcon('next', 14)}</button>
              <div class="p-vol-wrap">
                <button class="p-btn p-btn-icon" id="btnMute" title="Tắt/Bật tiếng (M)">${svgIcon('vol2', 15)}</button>
                <input type="range" class="p-range" id="volRange" min="0" max="1" step="0.02" value="1" title="Âm lượng" />
                <select class="p-select" id="selPlayerBoost" title="Khuếch đại âm lượng (WebAudio Gain)">
                  <option value="1" selected>100%</option>
                  <option value="1.25">125%</option>
                  <option value="1.5">150%</option>
                  <option value="1.75">175%</option>
                  <option value="2">200%</option>
                </select>
              </div>
              <span class="p-time" id="playerTimeLbl">0:00 / 0:00</span>
            </div>

            <div class="player-ctrl-group">
              <select class="p-select hidden" id="selPlayerSub" style="display:none" title="Ngôn ngữ phụ đề (C / Tay cầm Y)">
                <option value="vi" ${activeSubLang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                <option value="en" ${activeSubLang === 'en' ? 'selected' : ''}>English</option>
                <option value="off" ${activeSubLang === 'off' ? 'selected' : ''}>Tắt phụ đề</option>
              </select>
              <div class="p-sub-sync hidden" id="subSyncWrap" style="display:none" title="Đồng bộ phụ đề (-10s đến +10s, phím [ / ])">
                <button class="p-btn p-sub-step" id="btnSubDelayMinus" type="button" title="Lùi phụ đề 0.5 giây ([)">-</button>
                <button class="p-btn p-sub-val" id="btnSubDelayReset" type="button" title="Đặt lại độ trễ phụ đề 0.0s">0.0s</button>
                <button class="p-btn p-sub-step" id="btnSubDelayPlus" type="button" title="Tiến phụ đề 0.5 giây (])">+</button>
              </div>
              <select class="p-select" id="selPlayerQuality" title="Chất lượng HLS">
                <option value="-1" selected>Auto</option>
              </select>
              <select class="p-select" id="selPlayerSpeed" title="Tốc độ phát">
                <option value="0.75">0.75x</option>
                <option value="1" selected>1.0x</option>
                <option value="1.25">1.25x</option>
                <option value="1.5">1.5x</option>
                <option value="2">2.0x</option>
              </select>
              <button class="p-btn" id="btnPlayerAspect">Tỉ lệ: Gốc</button>
              <button class="p-btn" id="btnFailover">Đổi luồng</button>
              <button class="p-btn p-btn-icon" id="btnPlayerPip" title="Hình trong hình (PiP)">${svgIcon('pip', 15)}</button>
              <button class="p-btn p-btn-icon ${state.desktop.fullscreen ? 'active' : ''}" id="btnPlayerFullscreen" title="Toàn màn hình (F / F11 / Tay cầm X)">${svgIcon(state.desktop.fullscreen ? 'unfullscreen' : 'fullscreen', 15)}</button>
            </div>
          </div>
        </div>

        <aside class="player-drawer" id="playerDrawer">
          <div class="player-drawer-hdr">
            <strong>Danh sách tập & Máy chủ</strong>
            <button class="p-btn p-btn-icon" id="btnCloseDrawer">${svgIcon('close', 14)}</button>
          </div>
          <div class="player-drawer-body">
            <div class="chips-row" id="drawerServerChips"></div>
            <input id="drawerEpSearch" class="ep-search-input" style="width:100%;margin-bottom:10px" placeholder="Tìm tập nhanh..." />
            <div class="drawer-ep-list" id="drawerEpList"></div>
          </div>
        </aside>
      </div>`;

    const overlay = document.getElementById('playerOverlay');
    const stage = document.getElementById('playerStage');
    const video = document.getElementById('videoEl');
    const bufferingEl = document.getElementById('playerBuffering');
    const flashEl = document.getElementById('playerFlash');
    const skipBtn = document.getElementById('btnSkipMarker');
    const scrubWrap = document.getElementById('scrubberWrap');
    const scrubBuf = document.getElementById('scrubberBuf');
    const scrubFill = document.getElementById('scrubberFill');
    const scrubThumb = document.getElementById('scrubberThumb');
    const scrubMarkers = document.getElementById('scrubberMarkers');
    const scrubTip = document.getElementById('scrubberTooltip');
    const timeLbl = document.getElementById('playerTimeLbl');
    const btnPlayPause = document.getElementById('btnPlayPause');
    const btnMute = document.getElementById('btnMute');
    const volRange = document.getElementById('volRange');
    const selBoost = document.getElementById('selPlayerBoost');
    const selQuality = document.getElementById('selPlayerQuality');
    const selSpeed = document.getElementById('selPlayerSpeed');
    const drawerEl = document.getElementById('playerDrawer');

    function currentSrv() {
      return servers[serverIndex] || { server_data: [] };
    }
    function currentEp() {
      return currentSrv().server_data[episodeIndex];
    }

    function showFlash(iconName, text) {
      flashEl.innerHTML = `${iconName ? svgIcon(iconName, 16) : ''}<span>${esc(text)}</span>`;
      flashEl.classList.add('show');
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => flashEl.classList.remove('show'), 750);
    }

    function wakeHud() {
      overlay.classList.remove('hud-hidden');
      clearTimeout(hudTimer);
      if (!video.paused && !drawerOpen && !draggingScrub) {
        hudTimer = setTimeout(() => {
          if (!video.paused && !drawerOpen && !draggingScrub) {
            overlay.classList.add('hud-hidden');
          }
        }, 3000);
      }
    }

    function updatePlayPauseUi() {
      btnPlayPause.innerHTML = svgIcon(video.paused ? 'play' : 'pause', 15);
      wakeHud();
    }

    function updateMuteUi() {
      const muted = video.muted || video.volume === 0;
      btnMute.innerHTML = svgIcon(muted ? 'volX' : 'vol2', 15);
      volRange.value = video.muted ? '0' : String(video.volume);
    }

    function ensureGainBoost(val) {
      boostVal = val;
      if (val <= 1.0 && !gainNode) return;
      try {
        if (!audioCtx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) return;
          audioCtx = new AC();
          mediaSrc = audioCtx.createMediaElementSource(video);
          gainNode = audioCtx.createGain();
          mediaSrc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
        }
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
        if (gainNode) gainNode.gain.value = val;
      } catch {
        toast('Không thể kích hoạt khuếch đại âm thanh trên luồng này');
      }
    }

    function renderScrubberMarkers() {
      const dur = video.duration || 0;
      if (!dur || !markers.length) {
        scrubMarkers.innerHTML = '';
        return;
      }
      scrubMarkers.innerHTML = markers.map(m => {
        const start = Math.max(0, Math.min(dur, m.start || 0));
        const end = m.openEnd && dur > start ? dur : Math.max(start, Math.min(dur, m.end || start + 2));
        const leftPct = (start / dur) * 100;
        const widthPct = Math.max(0.4, ((end - start) / dur) * 100);
        const cls = m.type === 'ad' ? 'marker-ad' : (m.type === 'outro' ? 'marker-outro' : 'marker-intro');
        const label = m.label || (m.type === 'ad' ? 'Quảng cáo' : m.type === 'outro' ? 'Outro' : 'Intro');
        return `<span class="scrubber-marker ${cls}" style="left:${leftPct.toFixed(3)}%;width:${widthPct.toFixed(3)}%" title="${esc(label)}"></span>`;
      }).join('');
    }

    function syncScrubberUi() {
      const dur = video.duration || 0;
      const cur = video.currentTime || 0;
      const pct = dur > 0 ? Math.min(100, Math.max(0, (cur / dur) * 100)) : 0;
      scrubFill.style.width = `${pct}%`;
      scrubThumb.style.left = `${pct}%`;
      timeLbl.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;

      if (dur > 0 && video.buffered && video.buffered.length > 0) {
        let bufEnd = 0;
        for (let i = 0; i < video.buffered.length; i++) {
          if (video.buffered.start(i) <= cur + 1 && video.buffered.end(i) > bufEnd) {
            bufEnd = video.buffered.end(i);
          }
        }
        scrubBuf.style.width = `${Math.min(100, (bufEnd / dur) * 100)}%`;
      } else {
        scrubBuf.style.width = '0%';
      }
    }

    function renderDrawer() {
      const srvChips = document.getElementById('drawerServerChips');
      const epListEl = document.getElementById('drawerEpList');
      srvChips.innerHTML = servers.map((s, i) => `
        <button class="chip ${i === serverIndex ? 'active' : ''}" data-drawer-srv="${i}">${esc(formatServerLabel(s.server_name, i))}</button>
      `).join('');
      const list = currentSrv().server_data || [];
      const q = drawerFilter.trim().toLowerCase();
      const filtered = list
        .map((ep, idx) => ({ ep, idx }))
        .filter(({ ep }) => !q || String(ep.name || '').toLowerCase().includes(q));
      epListEl.innerHTML = filtered.map(({ ep, idx }) => {
        const pct = getEpisodeProgressPct(movie.slug, idx);
        return `
          <button class="ep-btn ${idx === episodeIndex ? 'active' : ''} ${pct >= 85 ? 'watched' : ''}" data-drawer-ep="${idx}">
            <span>${esc(ep.name)}</span>
            ${pct > 0 ? `<span class="ep-btn-bar"><span style="width:${pct}%"></span></span>` : ''}
          </button>`;
      }).join('');

      srvChips.querySelectorAll('[data-drawer-srv]').forEach(btn => {
        btn.onclick = () => {
          const nextSrv = parseInt(btn.dataset.drawerSrv, 10) || 0;
          if (nextSrv === serverIndex) return;
          serverIndex = nextSrv;
          const maxIdx = Math.max(0, (currentSrv().server_data || []).length - 1);
          if (episodeIndex > maxIdx) episodeIndex = maxIdx;
          loadCurrentEpisode(false);
        };
      });
      epListEl.querySelectorAll('[data-drawer-ep]').forEach(btn => {
        btn.onclick = () => {
          const nextEp = parseInt(btn.dataset.drawerEp, 10) || 0;
          if (nextEp === episodeIndex) return;
          saveCurrentProgress(true);
          episodeIndex = nextEp;
          loadCurrentEpisode(true);
        };
      });
    }

    function setDrawer(open) {
      drawerOpen = !!open;
      drawerEl.classList.toggle('open', drawerOpen);
      document.getElementById('btnPlayerDrawer').classList.toggle('active', drawerOpen);
      if (drawerOpen) renderDrawer();
      wakeHud();
    }

    function populateQualitySelector() {
      if (!hls || !hls.levels || !hls.levels.length) {
        selQuality.innerHTML = '<option value="-1" selected>Auto</option>';
        return;
      }
      const opts = ['<option value="-1" selected>Auto</option>'];
      const indexed = hls.levels.map((lvl, i) => ({
        idx: i,
        height: lvl.height || 0,
        bitrate: lvl.bitrate || 0
      })).sort((a, b) => (b.height - a.height) || (b.bitrate - a.bitrate));
      for (const item of indexed) {
        const lbl = item.height ? `${item.height}p` : `${Math.round(item.bitrate / 1000)}kbps`;
        opts.push(`<option value="${item.idx}">${esc(lbl)}</option>`);
      }
      selQuality.innerHTML = opts.join('');
    }

    const subOverlayEl = document.getElementById('playerSubOverlay');
    const selSubEl = document.getElementById('selPlayerSub');
    const subSyncWrapEl = document.getElementById('subSyncWrap');
    const btnSubMinus = document.getElementById('btnSubDelayMinus');
    const btnSubReset = document.getElementById('btnSubDelayReset');
    const btnSubPlus = document.getElementById('btnSubDelayPlus');

    function subLangDisplayName(code) {
      if (code === 'en') return 'English';
      if (code === 'off') return 'Tắt phụ đề';
      return 'Tiếng Việt';
    }

    function classifySubTrack(langRaw, nameRaw) {
      const combined = `${langRaw || ''} ${nameRaw || ''}`.toLowerCase();
      if (/\b(en|eng|english)\b/.test(combined)) return 'en';
      if (/\b(vi|vie|viet)\b|tiếng\s*việt|tieng\s*viet/.test(combined)) return 'vi';
      return '';
    }

    function hasEngSubAvailable() {
      const hTracks = (hls && Array.isArray(hls.subtitleTracks)) ? hls.subtitleTracks : [];
      if (hTracks.some(t => classifySubTrack(t.lang, t.name) === 'en')) return true;
      let nativeCount = 0;
      let nativeAllVi = true;
      if (video && video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const tt = video.textTracks[i];
          if (tt.kind !== 'subtitles' && tt.kind !== 'captions') continue;
          nativeCount++;
          const cls = classifySubTrack(tt.language, tt.label);
          if (cls === 'en') return true;
          if (cls !== 'vi') nativeAllVi = false;
        }
      }
      const hlsAllVi = hTracks.length > 0 && hTracks.every(t => classifySubTrack(t.lang, t.name) === 'vi');
      if ((hTracks.length > 0 && hlsAllVi && nativeCount === 0) || (hTracks.length === 0 && nativeCount > 0 && nativeAllVi)) {
        return false;
      }
      if (movie && Array.isArray(movie.sub_langs) && movie.sub_langs.some(s => /^en/i.test(String(s || ''))) && (hTracks.length > 0 || nativeCount > 0)) {
        return true;
      }
      return false;
    }

    function applySubControlsVisibility(show) {
      if (selSubEl) {
        selSubEl.classList.toggle('hidden', !show);
        selSubEl.style.display = show ? '' : 'none';
      }
      if (subSyncWrapEl) {
        subSyncWrapEl.classList.toggle('hidden', !show);
        subSyncWrapEl.style.display = show ? '' : 'none';
      }
    }

    function shiftCuesInTrack(tt, delaySec) {
      if (!tt || !tt.cues) return true;
      let writable = true;
      for (let i = 0; i < tt.cues.length; i++) {
        const cue = tt.cues[i];
        if (cue._mfOrigStart === undefined) {
          cue._mfOrigStart = cue.startTime;
          cue._mfOrigEnd = cue.endTime;
        }
        if (cue._mfAppliedDelay === delaySec) continue;
        const rawStart = cue._mfOrigStart + delaySec;
        const rawEnd = cue._mfOrigEnd + delaySec;
        const newStart = rawEnd <= 0 ? 0 : Math.max(0, rawStart);
        const newEnd = rawEnd <= 0 ? 0 : Math.max(newStart, rawEnd);
        try {
          if (newStart > cue.endTime) {
            cue.endTime = newEnd;
            cue.startTime = newStart;
          } else {
            cue.startTime = newStart;
            cue.endTime = newEnd;
          }
          cue._mfAppliedDelay = delaySec;
        } catch {
          writable = false;
        }
      }
      return writable;
    }

    function renderFallbackSubCue() {
      if (!subOverlayEl) return;
      if (!useCustomSubOverlay || activeSubLang === 'off' || !video || !video.textTracks) {
        subOverlayEl.classList.add('hidden');
        subOverlayEl.innerHTML = '';
        return;
      }
      const targetTime = (video.currentTime || 0) - subDelaySec;
      const lines = [];
      for (let i = 0; i < video.textTracks.length; i++) {
        const tt = video.textTracks[i];
        if (!tt._mfSelected || !tt.cues) continue;
        for (let j = 0; j < tt.cues.length; j++) {
          const cue = tt.cues[j];
          const s = cue._mfOrigStart !== undefined ? cue._mfOrigStart : cue.startTime;
          const e = cue._mfOrigEnd !== undefined ? cue._mfOrigEnd : cue.endTime;
          if (targetTime >= s && targetTime <= e && cue.text) {
            lines.push(String(cue.text).replace(/<[^>]+>/g, '').trim());
          }
        }
      }
      if (lines.length) {
        subOverlayEl.innerHTML = `<span class="player-sub-line">${esc(lines.join('\n'))}</span>`;
        subOverlayEl.classList.remove('hidden');
      } else {
        subOverlayEl.classList.add('hidden');
        subOverlayEl.innerHTML = '';
      }
    }

    function syncSubtitleState() {
      const hasEngSub = hasEngSubAvailable();
      applySubControlsVisibility(hasEngSub);
      if (selSubEl && selSubEl.value !== activeSubLang) {
        selSubEl.value = activeSubLang;
      }
      if (btnSubReset) {
        const sign = subDelaySec > 0 ? '+' : '';
        btnSubReset.textContent = `${sign}${subDelaySec.toFixed(1)}s`;
      }

      if (hls) {
        const tracks = hls.subtitleTracks || [];
        if (activeSubLang === 'off') {
          hls.subtitleTrack = -1;
          hls.subtitleDisplay = false;
        } else if (tracks.length > 0) {
          let idx = tracks.findIndex(t => classifySubTrack(t.lang, t.name) === activeSubLang);
          if (idx < 0 && activeSubLang === 'vi') {
            idx = tracks.findIndex(t => classifySubTrack(t.lang, t.name) !== 'en');
          }
          hls.subtitleDisplay = idx >= 0;
          hls.subtitleTrack = idx;
        }
      }

      useCustomSubOverlay = false;
      if (video && video.textTracks) {
        let matchedIdx = -1;
        if (activeSubLang !== 'off') {
          if (hls && hls.subtitleTrack >= 0 && hls.subtitleTracks && hls.subtitleTracks[hls.subtitleTrack]) {
            const trk = hls.subtitleTracks[hls.subtitleTrack];
            const hLang = String(trk.lang || '').toLowerCase();
            const hName = String(trk.name || '').toLowerCase();
            for (let i = 0; i < video.textTracks.length; i++) {
              const tt = video.textTracks[i];
              if (tt.kind !== 'subtitles' && tt.kind !== 'captions') continue;
              const tL = String(tt.language || '').toLowerCase();
              const tN = String(tt.label || '').toLowerCase();
              if ((tL && hLang && (tL === hLang || tL.startsWith(hLang.slice(0, 2)))) || (tN && hName && tN === hName)) {
                matchedIdx = i;
                break;
              }
            }
          }
          if (matchedIdx < 0) {
            for (let i = 0; i < video.textTracks.length; i++) {
              const tt = video.textTracks[i];
              if (tt.kind !== 'subtitles' && tt.kind !== 'captions') continue;
              if (classifySubTrack(tt.language, tt.label) === activeSubLang) {
                matchedIdx = i;
                break;
              }
            }
          }
          if (matchedIdx < 0 && activeSubLang === 'vi' && video.textTracks.length === 1) {
            const only = video.textTracks[0];
            if ((only.kind === 'subtitles' || only.kind === 'captions') && classifySubTrack(only.language, only.label) !== 'en') {
              matchedIdx = 0;
            }
          }
        }

        for (let i = 0; i < video.textTracks.length; i++) {
          const tt = video.textTracks[i];
          if (tt.kind !== 'subtitles' && tt.kind !== 'captions') continue;
          const isTarget = (i === matchedIdx && activeSubLang !== 'off');
          tt._mfSelected = isTarget;
          if (!isTarget) {
            tt.mode = 'disabled';
          } else {
            const writable = shiftCuesInTrack(tt, subDelaySec);
            if (!writable && subDelaySec !== 0) {
              useCustomSubOverlay = true;
              tt.mode = 'hidden';
            } else {
              tt.mode = 'showing';
            }
          }
        }
      }
      renderFallbackSubCue();
    }

    function setSubtitleLanguage(nextLang, withToast = false) {
      activeSubLang = ['vi', 'en', 'off'].includes(nextLang) ? nextLang : 'vi';
      state.prefs.defaultSubLang = activeSubLang;
      savePrefs();
      syncSubtitleState();
      const lbl = subLangDisplayName(activeSubLang);
      showFlash('subtitles', lbl);
      if (withToast) toast(`Phụ đề: ${lbl}`);
      wakeHud();
    }

    function cycleSubtitle() {
      if (!hasEngSubAvailable()) return;
      const order = ['vi', 'en', 'off'];
      const next = order[(order.indexOf(activeSubLang) + 1) % order.length];
      setSubtitleLanguage(next, true);
    }

    function setSubtitleDelay(nextDelay, announce = true) {
      if (!hasEngSubAvailable()) return;
      const clamped = Math.max(-10, Math.min(10, Math.round(nextDelay * 10) / 10));
      subDelaySec = Object.is(clamped, -0) ? 0 : clamped;
      syncSubtitleState();
      if (announce) {
        const sign = subDelaySec > 0 ? '+' : '';
        showFlash('subtitles', `Độ trễ phụ đề: ${sign}${subDelaySec.toFixed(1)}s`);
      }
      wakeHud();
    }

    function attachStream(srcUrl, label, rawUrl, resumeSec) {
      document.getElementById('playerSourceLbl').textContent = `Luồng phát: ${label}`;
      if (hls) { hls.destroy(); hls = null; }
      applySubControlsVisibility(false);
      selQuality.innerHTML = '<option value="-1" selected>Auto</option>';
      let soughtResume = false;
      const tryResume = () => {
        if (!soughtResume && resumeSec > 5 && Number.isFinite(video.duration) && resumeSec < video.duration - 10) {
          soughtResume = true;
          video.currentTime = resumeSec;
        }
      };

      const isHttpOrigin = window.location.protocol === 'http:' || window.location.protocol === 'https:';

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: isHttpOrigin,
          startFragPrefetch: true,
          subtitleDisplay: true,
          maxBufferLength: 45,
          backBufferLength: 60
        });
        hls.loadSource(srcUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          populateQualitySelector();
          video.playbackRate = parseFloat(selSpeed.value) || 1;
          video.play().catch(() => {});
          tryResume();
          syncSubtitleState();
        });
        hls.on(window.Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          syncSubtitleState();
        });
        if (window.Hls.Events.SUBTITLE_FRAG_PROCESSED) {
          hls.on(window.Hls.Events.SUBTITLE_FRAG_PROCESSED, () => {
            syncSubtitleState();
          });
        }
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            const hasVirtualHash = rawUrl.includes('#');
            const fbUrl = hasVirtualHash ? (`/api/clean-m3u8?url=${encodeURIComponent(rawUrl)}&sub=${encodeURIComponent(activeSubLang)}&ap=1`) : rawUrl;
            if (srcUrl !== fbUrl) {
              curSrcIsClean = hasVirtualHash;
              attachStream(fbUrl, hasVirtualHash ? 'Dự phòng (Relay)' : 'Dự phòng (Trực tiếp)', rawUrl, resumeSec);
            }
          }
        });
      } else {
        video.src = srcUrl;
        video.onloadedmetadata = () => {
          video.playbackRate = parseFloat(selSpeed.value) || 1;
          tryResume();
          renderScrubberMarkers();
          syncSubtitleState();
          video.play().catch(() => {});
        };
      }

      if (video && video.textTracks && !video.textTracks._mfBound) {
        video.textTracks._mfBound = true;
        video.textTracks.addEventListener('addtrack', () => syncSubtitleState());
        video.textTracks.addEventListener('change', () => renderFallbackSubCue());
      }
    }

    function saveCurrentProgress(force = false) {
      const ep = currentEp();
      if (!ep) return;
      const t = video.currentTime || 0;
      const dur = video.duration || 0;
      if (!force && (t <= 5 || Math.abs(t - lastSave) < 12)) return;
      if (t <= 1) return;
      lastSave = t;
      recordEpisodeProgress(movie.slug, episodeIndex, t, dur);
      const entry = {
        slug: movie.slug,
        name: movie.name,
        poster: movie.poster_url || movie.thumb_url,
        episodeIndex,
        episodeName: ep.name,
        currentTime: t,
        duration: dur
      };
      state.history = [entry, ...state.history.filter(x => x.slug !== movie.slug)].slice(0, 40);
      localStorage.setItem('mf.history', JSON.stringify(state.history));
      if (state.token) {
        api('/api/user/history', { method: 'POST', json: entry }).catch(() => {});
      }
    }

    function loadCurrentEpisode(useSavedResume) {
      const srv = currentSrv();
      const ep = currentEp();
      if (!ep || !ep.link_m3u8) { toast('Tập này chưa có luồng HLS'); return; }

      markers = [];
      skippedIds = new Set();
      activeSkip = null;
      lastSave = -999;
      curSrcIsClean = true;
      skipBtn.classList.add('hidden');
      scrubMarkers.innerHTML = '';

      document.getElementById('playerTitleText').textContent = `${getDisplayTitles(movie).primary || movie.name} — ${ep.name}`;
      document.getElementById('btnPrevEp').disabled = episodeIndex <= 0;
      document.getElementById('btnNextEp').disabled = episodeIndex + 1 >= srv.server_data.length;

      let resumeSec = 0;
      if (useSavedResume) {
        const epRec = state.epProgress[movie.slug]?.[String(episodeIndex)];
        const hist = state.history.find(h => h.slug === movie.slug && h.episodeIndex === episodeIndex);
        if (epRec && epRec.t > 5 && (!epRec.d || epRec.t < epRec.d - 15)) resumeSec = epRec.t;
        else if (hist && hist.currentTime > 5 && (!hist.duration || hist.currentTime < hist.duration - 15)) resumeSec = hist.currentTime;
      }

      const rawUrl = ep.link_m3u8.trim();
      const cleanUrl = `/api/clean-m3u8?url=${encodeURIComponent(rawUrl)}&sub=${encodeURIComponent(activeSubLang)}`;
      attachStream(cleanUrl, 'Tối ưu HD', rawUrl, resumeSec);

      const epDigits = (ep.slug || String(episodeIndex + 1)).replace(/\D+/g, '') || '1';
      const titleHint = movie.origin_name || movie.name || '';
      api(`/api/ads/${encodeURIComponent(movie.slug)}/${encodeURIComponent(epDigits)}?title=${encodeURIComponent(titleHint)}`)
        .then(r => {
          markers = r.markers || [];
          renderScrubberMarkers();
          evaluatePlaybackMarkers(false);
        })
        .catch(() => {});

      if (drawerOpen) renderDrawer();
      wakeHud();
    }

    function stepEpisode(delta) {
      const srv = currentSrv();
      const next = episodeIndex + delta;
      if (next < 0 || next >= srv.server_data.length) return;
      saveCurrentProgress(true);
      episodeIndex = next;
      loadCurrentEpisode(true);
      showFlash(delta > 0 ? 'next' : 'prev', currentEp()?.name || '');
    }

    function togglePlay() {
      if (video.paused) {
        video.play().catch(() => {});
        showFlash('play', 'Phát');
      } else {
        video.pause();
        showFlash('pause', 'Tạm dừng');
      }
      updatePlayPauseUi();
    }

    function seekBy(deltaSec) {
      const dur = video.duration || 0;
      const next = Math.max(0, Math.min(dur > 0 ? dur : Infinity, (video.currentTime || 0) + deltaSec));
      video.currentTime = next;
      syncScrubberUi();
      showFlash(deltaSec >= 0 ? 'forward10' : 'replay10', (deltaSec >= 0 ? '+' : '') + deltaSec + 's');
      wakeHud();
    }

    function adjustVolume(delta) {
      video.muted = false;
      video.volume = Math.max(0, Math.min(1, (video.volume || 0) + delta));
      updateMuteUi();
      showFlash(video.volume === 0 ? 'volX' : 'vol2', `${Math.round(video.volume * 100)}%`);
      wakeHud();
    }

    function toggleMute() {
      video.muted = !video.muted;
      updateMuteUi();
      showFlash(video.muted ? 'volX' : 'vol2', video.muted ? 'Tắt tiếng' : `${Math.round(video.volume * 100)}%`);
      wakeHud();
    }

    let programmaticSkipUntil = 0;
    function getMarkerKey(m, endSec) {
      return (m && m.id) ? String(m.id) : `${(m && m.type) || 'skip'}_${m ? m.start : 0}_${endSec}`;
    }

    function triggerSkip() {
      if (!activeSkip) return;
      skippedIds.add(activeSkip.mkId);
      programmaticSkipUntil = Date.now() + 900;
      video.currentTime = activeSkip.end + 0.1;
      skipBtn.classList.add('hidden');
      activeSkip = null;
      showFlash('forward', 'Đã bỏ qua');
    }

    function closePlayer() {
      saveCurrentProgress(true);
      clearTimeout(hudTimer);
      clearTimeout(flashTimer);
      if (hls) { hls.destroy(); hls = null; }
      video.pause();
      if (document.pictureInPictureElement === video) {
        document.exitPictureInPicture().catch(() => {});
      }
      if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
      playerCtrl._setActive(null);
      root.innerHTML = '';
      if (state.detailSlug) render();
    }

    // Event wiring
    overlay.addEventListener('mousemove', wakeHud);
    stage.addEventListener('click', () => {
      if (drawerOpen) { setDrawer(false); return; }
      togglePlay();
    });
    stage.addEventListener('dblclick', () => windowOp('fullscreen'));

    btnPlayPause.onclick = (e) => { e.stopPropagation(); togglePlay(); };
    document.getElementById('btnSeekBack').onclick = () => seekBy(-10);
    document.getElementById('btnSeekFwd').onclick = () => seekBy(10);
    document.getElementById('btnPrevEp').onclick = () => stepEpisode(-1);
    document.getElementById('btnNextEp').onclick = () => stepEpisode(1);
    btnMute.onclick = toggleMute;
    volRange.oninput = () => {
      video.muted = false;
      video.volume = parseFloat(volRange.value) || 0;
      updateMuteUi();
      wakeHud();
    };
    selBoost.onchange = () => {
      const val = parseFloat(selBoost.value) || 1.0;
      ensureGainBoost(val);
      showFlash('vol2', `Âm lượng ${Math.round(val * 100)}%`);
      wakeHud();
    };
    if (selSubEl) {
      selSubEl.onchange = () => {
        setSubtitleLanguage(selSubEl.value, false);
      };
    }
    if (btnSubMinus) btnSubMinus.onclick = () => setSubtitleDelay(subDelaySec - 0.5, true);
    if (btnSubReset) btnSubReset.onclick = () => setSubtitleDelay(0, true);
    if (btnSubPlus) btnSubPlus.onclick = () => setSubtitleDelay(subDelaySec + 0.5, true);
    selQuality.onchange = () => {
      if (!hls) return;
      hls.currentLevel = parseInt(selQuality.value, 10);
      const lbl = selQuality.options[selQuality.selectedIndex]?.textContent || 'Auto';
      showFlash(null, `Chất lượng: ${lbl}`);
      wakeHud();
    };
    selSpeed.onchange = () => {
      const rate = parseFloat(selSpeed.value) || 1;
      video.playbackRate = rate;
      showFlash(null, `${rate}x`);
      wakeHud();
    };

    const aspects = [
      ['fit', 'Gốc', ''],
      ['16x9', '16:9', 'aspect-16x9'],
      ['4x3', '4:3', 'aspect-4x3'],
      ['21x9', '21:9', 'aspect-21x9'],
      ['fill', 'Tràn viền', 'aspect-fill']
    ];
    let aIdx = 0;
    document.getElementById('btnPlayerAspect').onclick = () => {
      aIdx = (aIdx + 1) % aspects.length;
      const [, lbl, cls] = aspects[aIdx];
      stage.className = 'player-stage ' + cls;
      document.getElementById('btnPlayerAspect').textContent = 'Tỉ lệ: ' + lbl;
      wakeHud();
    };

    document.getElementById('btnFailover').onclick = () => {
      const ep = currentEp();
      if (!ep) return;
      const rawUrl = ep.link_m3u8.trim();
      const cleanUrl = `/api/clean-m3u8?url=${encodeURIComponent(rawUrl)}&sub=${encodeURIComponent(activeSubLang)}`;
      const hasVirtualHash = rawUrl.includes('#');
      const fbUrl = hasVirtualHash ? (cleanUrl + '&ap=1') : rawUrl;
      const curPos = video.currentTime || 0;
      curSrcIsClean = !curSrcIsClean;
      attachStream(curSrcIsClean ? cleanUrl : fbUrl, curSrcIsClean ? 'Tối ưu HD' : (hasVirtualHash ? 'Dự phòng (Relay)' : 'Dự phòng (Trực tiếp)'), rawUrl, curPos);
      wakeHud();
    };

    document.getElementById('btnPlayerPip').onclick = async () => {
      try {
        if (document.pictureInPictureElement === video) {
          await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled && video.requestPictureInPicture) {
          await video.requestPictureInPicture();
        } else {
          toast('Trình phát không hỗ trợ Picture-in-Picture');
        }
      } catch {
        toast('Không thể mở Picture-in-Picture');
      }
      wakeHud();
    };

    document.getElementById('btnPlayerFullscreen').onclick = () => windowOp('fullscreen');
    document.getElementById('btnPlayerDrawer').onclick = () => setDrawer(!drawerOpen);
    document.getElementById('btnCloseDrawer').onclick = () => setDrawer(false);
    document.getElementById('btnPlayerClose').onclick = closePlayer;

    document.getElementById('drawerEpSearch').oninput = (e) => {
      drawerFilter = e.target.value;
      renderDrawer();
    };

    // Scrubber drag & click
    const seekFromPointer = (clientX) => {
      const rect = scrubWrap.getBoundingClientRect();
      const ratio = rect.width > 0 ? Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) : 0;
      const dur = video.duration || 0;
      scrubTip.style.left = `${ratio * 100}%`;
      scrubTip.textContent = formatTime(ratio * dur);
      if (draggingScrub && dur > 0) {
        video.currentTime = ratio * dur;
        syncScrubberUi();
      }
    };
    scrubWrap.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      draggingScrub = true;
      scrubWrap.classList.add('dragging');
      scrubWrap.setPointerCapture(e.pointerId);
      seekFromPointer(e.clientX);
      wakeHud();
    });
    scrubWrap.addEventListener('pointermove', (e) => seekFromPointer(e.clientX));
    const endScrub = (e) => {
      if (!draggingScrub) return;
      seekFromPointer(e.clientX);
      draggingScrub = false;
      scrubWrap.classList.remove('dragging');
      wakeHud();
    };
    scrubWrap.addEventListener('pointerup', endScrub);
    scrubWrap.addEventListener('pointercancel', endScrub);

    function evaluatePlaybackMarkers(isFromSeek = false) {
      const t = video.currentTime || 0;
      const dur = video.duration || 0;
      const inProgSkip = Date.now() < programmaticSkipUntil;
      activeSkip = null;
      for (const m of markers) {
        if (!m || typeof m.start !== 'number' || typeof m.end !== 'number') continue;
        const end = m.openEnd && dur > m.start ? dur : m.end;
        if (end <= m.start) continue;
        const mkId = getMarkerKey(m, end);
        const mode = m.mode || (m.type === 'ad' ? 'cut' : 'skip');
        if (mode === 'cut' && state.prefs.autoCutAds && !skippedIds.has(mkId) && t >= m.start && t < end) {
          skippedIds.add(mkId);
          programmaticSkipUntil = Date.now() + 900;
          video.currentTime = end + 0.1;
          toast('Đã bỏ qua quảng cáo');
          return;
        }
        if (mode === 'skip' && state.prefs.introSkip !== 'off' && t >= m.start && t < end) {
          if (isFromSeek && !inProgSkip) {
            skippedIds.delete(mkId);
          }
          if (!skippedIds.has(mkId)) {
            if (state.prefs.introSkip === 'auto' && !isFromSeek) {
              skippedIds.add(mkId);
              programmaticSkipUntil = Date.now() + 900;
              video.currentTime = end + 0.1;
              toast('Đã tự động bỏ qua giới thiệu');
              return;
            }
            activeSkip = { m, end, mkId };
          }
        }
      }

      if (activeSkip) {
        const lbl = activeSkip.m.type === 'outro'
          ? 'Bỏ qua kết thúc (S)'
          : (activeSkip.m.type === 'recap' ? 'Bỏ qua tóm tắt (S)' : (activeSkip.m.type === 'intro' ? 'Bỏ qua phần giới thiệu (S)' : (activeSkip.m.label || 'Bỏ qua mở đầu (S)')));
        skipBtn.innerHTML = `<span>${esc(lbl)}</span>${svgIcon('forward', 14)}`;
        skipBtn.classList.remove('hidden');
        skipBtn.onclick = triggerSkip;
      } else {
        skipBtn.classList.add('hidden');
      }
    }

    // Video lifecycle
    video.onplay = () => { bufferingEl.classList.add('hidden'); updatePlayPauseUi(); evaluatePlaybackMarkers(false); };
    video.onpause = () => { updatePlayPauseUi(); evaluatePlaybackMarkers(false); };
    video.onseeked = () => { syncScrubberUi(); evaluatePlaybackMarkers(true); };
    video.onwaiting = () => { bufferingEl.classList.remove('hidden'); };
    video.onplaying = () => { bufferingEl.classList.add('hidden'); updatePlayPauseUi(); };
    video.oncanplay = () => { bufferingEl.classList.add('hidden'); };
    video.ondurationchange = () => { renderScrubberMarkers(); syncScrubberUi(); evaluatePlaybackMarkers(false); };
    video.onprogress = syncScrubberUi;

    video.ontimeupdate = () => {
      syncScrubberUi();
      if (subDelaySec !== 0 && video.textTracks) {
        for (let i = 0; i < video.textTracks.length; i++) {
          const tt = video.textTracks[i];
          if (tt._mfSelected && !useCustomSubOverlay) shiftCuesInTrack(tt, subDelaySec);
        }
      }
      if (useCustomSubOverlay) renderFallbackSubCue();
      evaluatePlaybackMarkers(false);
      saveCurrentProgress(false);
    };

    video.onended = () => {
      saveCurrentProgress(true);
      const srv = currentSrv();
      if (state.prefs.autoNext && episodeIndex + 1 < srv.server_data.length) {
        stepEpisode(1);
      } else {
        updatePlayPauseUi();
      }
    };

    playerCtrl._setActive({
      get drawerOpen() { return drawerOpen; },
      setDrawer,
      close: closePlayer,
      togglePlay,
      seekBy,
      adjustVolume,
      toggleMute,
      toggleFullscreen: () => windowOp('fullscreen'),
      stepEpisode,
      triggerSkip,
      cycleSubtitle,
      adjustSubDelay: (delta) => setSubtitleDelay(subDelaySec + delta, true),
      resetSubDelay: () => setSubtitleDelay(0, true)
    });

    loadCurrentEpisode(true);
  }

  function openAuthModal() {
    const root = document.getElementById('modalRoot');
    let reg = false;
    const draw = () => {
      root.innerHTML = `
        <div class="modal-backdrop" id="authBackdrop">
          <div class="modal-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <strong>${state.user ? 'Tài khoản' : (reg ? 'Đăng ký' : 'Đăng nhập')}</strong>
              <button class="tb-btn" id="btnCloseAuth">${svgIcon('close', 13)}</button>
            </div>
            ${state.user ? `
              <div class="s-sub" style="margin-bottom:12px">Đang đăng nhập: <strong>@${esc(state.user.username)}</strong></div>
              <button class="btn-accent" style="width:100%" id="btnDoLogout">Đăng xuất</button>
            ` : `
              <div class="seg-tabs" style="grid-template-columns:1fr 1fr">
                <button class="seg-btn ${!reg?'active':''}" id="tabLogin">Đăng nhập</button>
                <button class="seg-btn ${reg?'active':''}" id="tabReg">Đăng ký</button>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px">
                <input id="authUser" class="search-input" placeholder="Tên đăng nhập" />
                ${reg ? `<input id="authDisp" class="search-input" placeholder="Tên hiển thị" />` : ''}
                <input id="authPass" type="password" class="search-input" placeholder="Mật khẩu" />
                <div id="authErr" style="color:#ff453a;font-size:12px"></div>
                <button class="btn-accent" id="btnAuthSubmit">${reg ? 'Tạo tài khoản' : 'Đăng nhập'}</button>
              </div>
            `}
          </div>
        </div>`;

      document.getElementById('btnCloseAuth').onclick = () => { root.innerHTML = ''; };
      document.getElementById('authBackdrop').onclick = (e) => { if (e.target.id === 'authBackdrop') root.innerHTML = ''; };
      if (state.user) {
        document.getElementById('btnDoLogout').onclick = () => {
          state.token = ''; state.user = null; state.favorites = [];
          localStorage.removeItem('mf.token');
          updateAccountUI();
          root.innerHTML = '';
          render();
        };
      } else {
        document.getElementById('tabLogin').onclick = () => { reg = false; draw(); };
        document.getElementById('tabReg').onclick = () => { reg = true; draw(); };
        document.getElementById('btnAuthSubmit').onclick = async () => {
          const username = document.getElementById('authUser').value.trim();
          const password = document.getElementById('authPass').value;
          const displayName = reg ? document.getElementById('authDisp').value.trim() : '';
          try {
            const r = await api(reg ? '/api/auth/register' : '/api/auth/login', {
              method: 'POST',
              json: reg ? { username, password, displayName: displayName || username } : { username, password }
            });
            if (r.token) {
              state.token = r.token;
              state.user = r.user;
              localStorage.setItem('mf.token', r.token);
              await refreshLibrary();
              updateAccountUI();
              root.innerHTML = '';
              render();
              toast('Đăng nhập thành công');
            } else {
              document.getElementById('authErr').textContent = r.error || 'Lỗi đăng nhập';
            }
          } catch (e) {
            document.getElementById('authErr').textContent = e.message;
          }
        };
      }
    };
    draw();
  }

  let gpInteracting = false;
  let gpFocusedEl = null;
  let gpFocusRestoreSelector = '';

  function restoreGamepadFocusIfActive() {
    if (!gpInteracting || playerCtrl.isOpen()) return;
    if (gpFocusedEl && document.body.contains(gpFocusedEl) && gpFocusedEl.offsetParent !== null) {
      gpFocusedEl.classList.add('mf-gp-focus');
      return;
    }
    if (gpFocusRestoreSelector) {
      try {
        const candidate = document.querySelector(gpFocusRestoreSelector);
        if (candidate && candidate.offsetParent !== null) {
          setGamepadFocus(candidate, false);
          return;
        }
      } catch {}
    }
    const fallback = getDefaultBrowsingFocusTarget();
    if (fallback) setGamepadFocus(fallback, false);
  }

  function render() {
    document.querySelectorAll('.nav-item, .bnav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === state.tab);
    });

    const mc = document.getElementById('mainContent');
    if (state.detailSlug) {
      mc.innerHTML = renderDetail();
    } else if (state.tab === 'discover') {
      mc.innerHTML = renderDiscover();
    } else if (state.tab === 'search') {
      mc.innerHTML = renderSearch();
    } else if (state.tab === 'library') {
      mc.innerHTML = renderLibrary();
    } else if (state.tab === 'monitor') {
      mc.innerHTML = renderMonitorSubPage(false);
    } else {
      mc.innerHTML = renderSettings();
    }
    bindDynamicEvents();
    if (isMonitorVisible()) {
      drawChart('canvasNetSpeed', state.monitor.dlSeries, state.monitor.ulSeries, '#30D158', '#0A84FF');
      drawChart('canvasPingLoad', state.monitor.pingSeries, state.monitor.serverCpuSeries, '#FF9F0A', '#FA2D48');
    }
    restoreGamepadFocusIfActive();
  }

  function bindDynamicEvents() {
    const mc = document.getElementById('mainContent');
    bindHeroEvents();

    mc.querySelectorAll('[data-cat]').forEach(el => {
      el.onclick = () => selectCategory(el.dataset.cat);
    });
    mc.querySelectorAll('[data-rail-target]').forEach(btn => {
      btn.onclick = () => {
        const rail = document.getElementById(btn.dataset.railTarget);
        const dir = parseInt(btn.dataset.railDir, 10) || 1;
        if (rail) rail.scrollBy({ left: dir * 520, behavior: 'smooth' });
      };
    });

    const btnMoreDisc = document.getElementById('btnLoadMoreDiscover');
    if (btnMoreDisc) btnMoreDisc.onclick = loadMoreDiscover;
    const btnMoreCat = document.getElementById('btnLoadMoreCat');
    if (btnMoreCat) btnMoreCat.onclick = loadMoreCategory;
    const btnMoreSearch = document.getElementById('btnLoadMoreSearch');
    if (btnMoreSearch) btnMoreSearch.onclick = loadMoreSearch;

    const backBtn = document.getElementById('btnDetailBack');
    if (backBtn) backBtn.onclick = () => { state.detailSlug = null; render(); };

    const toggleFr = document.getElementById('btnToggleFranchise');
    if (toggleFr) toggleFr.onclick = () => { state.franchiseExpanded = !state.franchiseExpanded; render(); };

    mc.querySelectorAll('[data-srv-idx]').forEach(el => {
      el.onclick = () => { state.selectedServerIdx = parseInt(el.dataset.srvIdx, 10) || 0; render(); };
    });

    const bindDetailEpPlay = () => {
      mc.querySelectorAll('[data-play-ep]').forEach(el => {
        el.onclick = () => {
          const epIdx = parseInt(el.dataset.playEp, 10) || 0;
          openPlayer(state.detailData.movie, state.detailData.episodes || [], state.selectedServerIdx, epIdx);
        };
      });
    };
    bindDetailEpPlay();

    const epSearch = document.getElementById('epSearchInput');
    if (epSearch && state.detailData?.movie) {
      epSearch.oninput = (e) => {
        state.epFilter = e.target.value;
        const m = state.detailData.movie;
        const srv = (state.detailData.episodes || [])[state.selectedServerIdx] || { server_data: [] };
        const hist = state.history.find(h => h.slug === m.slug);
        const grid = document.getElementById('detailEpGrid');
        if (grid) {
          grid.innerHTML = buildEpisodeButtonsHtml(m.slug, srv.server_data, hist ? hist.episodeIndex : -1);
          bindDetailEpPlay();
        }
      };
    }

    const dPlay = document.getElementById('btnDetailPlay');
    if (dPlay) dPlay.onclick = () => {
      const m = state.detailData.movie;
      const srv = (state.detailData.episodes || [])[state.selectedServerIdx] || { server_data: [] };
      const hist = state.history.find(h => h.slug === m.slug);
      const epIdx = hist && Number.isInteger(hist.episodeIndex) && hist.episodeIndex < srv.server_data.length ? hist.episodeIndex : 0;
      openPlayer(m, state.detailData.episodes || [], state.selectedServerIdx, epIdx);
    };
    const dFav = document.getElementById('btnDetailFav');
    if (dFav) dFav.onclick = async () => {
      if (!state.token) { openAuthModal(); return; }
      const m = state.detailData.movie;
      try {
        const r = await api('/api/user/favorites/toggle', {
          method: 'POST',
          json: { slug: m.slug, name: m.name, poster: m.poster_url || m.thumb_url || '', year: m.year || 0, quality: m.quality || 'HD', lang: m.lang || 'Vietsub' }
        });
        if (Array.isArray(r.favorites)) state.favorites = r.favorites;
        dFav.innerHTML = `${svgIcon('bookmark', 14)}<span>${isFavorite(m.slug) ? 'Đã lưu' : 'Lưu'}</span>`;
      } catch {}
    };
    const dBlock = document.getElementById('btnDetailBlock');
    if (dBlock) dBlock.onclick = () => {
      const m = state.detailData.movie;
      if (!isBlocked(m.slug)) {
        state.blocked.unshift({ slug: m.slug, name: m.name, poster: m.poster_url || m.thumb_url });
        localStorage.setItem('mf.blocked', JSON.stringify(state.blocked));
      }
      state.detailSlug = null;
      toast(`Đã ẩn "${m.name}"`);
      render();
    };

    const sInput = document.getElementById('searchInput');
    if (sInput) {
      sInput.oninput = (e) => {
        clearTimeout(searchDebounce);
        const val = e.target.value;
        searchDebounce = setTimeout(() => runSearch(val), 340);
      };
      sInput.onkeydown = (e) => { if (e.key === 'Enter') runSearch(sInput.value); };
    }
    const sBtn = document.getElementById('btnRunSearch');
    if (sBtn) sBtn.onclick = () => runSearch(document.getElementById('searchInput').value);
    mc.querySelectorAll('[data-search-topic]').forEach(el => {
      el.onclick = () => runSearch(el.dataset.searchTopic);
    });

    mc.querySelectorAll('[data-lib-seg]').forEach(el => {
      el.onclick = () => { state.librarySeg = el.dataset.libSeg; render(); };
    });
    const libLogin = document.getElementById('btnLibLogin');
    if (libLogin) libLogin.onclick = openAuthModal;
    mc.querySelectorAll('[data-del-hist]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const slug = el.dataset.delHist;
        state.history = state.history.filter(x => x.slug !== slug);
        localStorage.setItem('mf.history', JSON.stringify(state.history));
        if (state.token) api('/api/user/history/delete', { method: 'POST', json: { slug } }).catch(() => {});
        render();
      };
    });
    mc.querySelectorAll('[data-unblock]').forEach(el => {
      el.onclick = () => {
        state.blocked = state.blocked.filter(b => b.slug !== el.dataset.unblock);
        localStorage.setItem('mf.blocked', JSON.stringify(state.blocked));
        render();
      };
    });

    const sAuth = document.getElementById('btnSettingsAuth');
    if (sAuth) sAuth.onclick = openAuthModal;
    mc.querySelectorAll('[data-subpage]').forEach(el => {
      el.onclick = () => {
        state.settingsSubPage = el.dataset.subpage;
        if (state.settingsSubPage === 'monitor') startMonitorLoop(); else stopMonitorLoop();
        render();
      };
    });

    const bindChk = (id, key, onChange) => {
      const el = document.getElementById(id);
      if (el) el.onchange = () => { state.prefs[key] = el.checked; savePrefs(); if (onChange) onChange(); };
    };
    const selUiLang = document.getElementById('selUiLang');
    if (selUiLang) selUiLang.onchange = () => { state.prefs.uiLang = selUiLang.value; savePrefs(); render(); };
    const selDefSub = document.getElementById('selDefaultSub');
    if (selDefSub) selDefSub.onchange = () => { state.prefs.defaultSubLang = selDefSub.value; savePrefs(); };
    bindChk('chkAutoAds', 'autoCutAds');
    bindChk('chkAutoNext', 'autoNext');
    bindChk('chkAmbient', 'ambient', () => render());
    const selIntro = document.getElementById('selIntroSkip');
    if (selIntro) selIntro.onchange = () => { state.prefs.introSkip = selIntro.value; savePrefs(); };
    const selCols = document.getElementById('selPhoneCols');
    if (selCols) selCols.onchange = () => { state.prefs.phoneCols = parseInt(selCols.value, 10) || 3; savePrefs(); render(); };
    const btnReset = document.getElementById('btnResetPrefs');
    if (btnReset) btnReset.onclick = () => {
      state.prefs = { themeMode: 'dark', presetId: 'apple-dark', accent: '#FA2D48', bg: '#121214', surface: '#1C1C1E', ambient: true, phoneCols: 3, autoCutAds: true, introSkip: 'button', autoNext: true };
      savePrefs(); toast('Đã đặt lại mặc định'); render();
    };

    const selTm = document.getElementById('selThemeMode');
    if (selTm) selTm.onchange = () => { state.prefs.themeMode = selTm.value; savePrefs(); render(); };
    mc.querySelectorAll('[data-preset]').forEach(el => {
      el.onclick = () => {
        const pr = THEME_PRESETS.find(p => p.id === el.dataset.preset);
        if (!pr) return;
        state.prefs.presetId = pr.id; state.prefs.themeMode = pr.mode;
        state.prefs.accent = pr.accent; state.prefs.bg = pr.bg; state.prefs.surface = pr.surface;
        savePrefs(); render();
      };
    });
    mc.querySelectorAll('[data-accent]').forEach(el => {
      el.onclick = () => { state.prefs.accent = el.dataset.accent; savePrefs(); render(); };
    });
    const bindColor = (id, key) => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => { state.prefs.themeMode = 'custom'; state.prefs.presetId = 'custom'; state.prefs[key] = el.value; savePrefs(); render(); };
    };
    bindColor('pickAccent', 'accent');
    bindColor('pickBg', 'bg');
    bindColor('pickSurface', 'surface');
    const btnSyncTheme = document.getElementById('btnSyncTheme');
    if (btnSyncTheme) btnSyncTheme.onclick = async () => {
      try {
        await api('/api/user/theme', { method: 'POST', json: { presetId: state.prefs.presetId, accent: state.prefs.accent, bg: state.prefs.bg, surface: state.prefs.surface } });
        toast('Đã đồng bộ giao diện lên tài khoản');
      } catch { toast('Lỗi đồng bộ giao diện'); }
    };

    const btnProbe = document.getElementById('btnToggleProbe');
    if (btnProbe) btnProbe.onclick = () => {
      state.monitor.liveProbe = !state.monitor.liveProbe;
      refreshMonitorChartsIfVisible();
    };
    const btnSpeed = document.getElementById('btnRunSpeedtest');
    if (btnSpeed) btnSpeed.onclick = () => { toast('Đang đo Speedtest...'); pollMonitor('full'); };
  }

  const SIDEBAR_TABS = ['discover', 'search', 'library', 'monitor', 'settings'];

  function switchTab(nextTab) {
    if (!SIDEBAR_TABS.includes(nextTab)) return;
    state.tab = nextTab;
    state.detailSlug = null;
    if (nextTab === 'settings') state.settingsSubPage = 'main';
    if (nextTab === 'monitor' || (nextTab === 'settings' && state.settingsSubPage === 'monitor')) {
      startMonitorLoop();
    } else {
      stopMonitorLoop();
    }
    render();
  }

  function focusSearchTab() {
    switchTab('search');
    const inp = document.getElementById('searchInput');
    if (inp) {
      inp.focus();
      inp.select();
      if (gpInteracting) setGamepadFocus(inp, false);
    }
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      windowOp('fullscreen');
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (!playerCtrl.isOpen()) focusSearchTab();
      return;
    }

    if (e.key === 'Escape') {
      if (state.desktop.fullscreen) {
        e.preventDefault();
        windowOp('unfullscreen');
        return;
      }
      if (playerCtrl.isDrawerOpen()) {
        e.preventDefault();
        playerCtrl.closeDrawer();
        return;
      }
      if (playerCtrl.isOpen()) {
        e.preventDefault();
        playerCtrl.close();
        return;
      }
      const modalRoot = document.getElementById('modalRoot');
      if (modalRoot && modalRoot.innerHTML.trim()) {
        e.preventDefault();
        modalRoot.innerHTML = '';
        return;
      }
      if (state.detailSlug) {
        e.preventDefault();
        state.detailSlug = null;
        render();
        return;
      }
      if (state.tab === 'settings' && state.settingsSubPage !== 'main') {
        e.preventDefault();
        state.settingsSubPage = 'main';
        stopMonitorLoop();
        render();
        return;
      }
      return;
    }

    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
    if (isTyping) return;

    if (e.key === '/' && !playerCtrl.isOpen()) {
      e.preventDefault();
      focusSearchTab();
      return;
    }

    if (!playerCtrl.isOpen()) return;

    const k = e.key.toLowerCase();
    if (e.code === 'Space' || k === 'k') {
      e.preventDefault();
      playerCtrl.togglePlay();
    } else if (e.key === 'ArrowLeft' || k === 'j') {
      e.preventDefault();
      playerCtrl.seekBy(-10);
    } else if (e.key === 'ArrowRight' || k === 'l') {
      e.preventDefault();
      playerCtrl.seekBy(10);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      playerCtrl.adjustVolume(0.05);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      playerCtrl.adjustVolume(-0.05);
    } else if (k === 'm') {
      e.preventDefault();
      playerCtrl.toggleMute();
    } else if (k === 'f') {
      e.preventDefault();
      playerCtrl.toggleFullscreen();
    } else if (k === 'n') {
      e.preventDefault();
      playerCtrl.nextEp();
    } else if (k === 'p') {
      e.preventDefault();
      playerCtrl.prevEp();
    } else if (k === 's') {
      e.preventDefault();
      playerCtrl.triggerSkip();
    } else if (k === 'c') {
      e.preventDefault();
      playerCtrl.cycleSubtitle();
    } else if (e.key === '[') {
      e.preventDefault();
      playerCtrl.adjustSubDelay(-0.5);
    } else if (e.key === ']') {
      e.preventDefault();
      playerCtrl.adjustSubDelay(0.5);
    } else if (e.key === '\\') {
      e.preventDefault();
      playerCtrl.resetSubDelay();
    }
  });

  document.querySelectorAll('.nav-item, .bnav-item').forEach(btn => {
    btn.onclick = () => switchTab(btn.dataset.tab);
  });

  document.getElementById('btnFullscreen').onclick = () => windowOp('fullscreen');
  document.getElementById('btnAccount').onclick = openAuthModal;
  document.getElementById('sidebarUserCard').onclick = openAuthModal;

  const mainContentEl = document.getElementById('mainContent');
  if (mainContentEl) {
    mainContentEl.addEventListener('click', (e) => {
      if (e.target.closest('[data-del-hist]') || e.target.closest('[data-unblock]')) return;
      const card = e.target.closest('[data-slug]');
      if (card && card.dataset.slug) {
        openDetail(card.dataset.slug);
      }
    });

    let scrollRaf = 0;
    mainContentEl.addEventListener('scroll', () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        const amb = document.getElementById('ambientBackdrop');
        if (amb && state.prefs.ambient) {
          const op = Math.max(0.35, 0.9 - mainContentEl.scrollTop / 600);
          amb.style.opacity = op.toFixed(2);
        }
      });
    }, { passive: true });
  }

  // Zero-Overhead 60fps Gamepad Engine (Steam Deck / Xbox / DualSense — 0% CPU when disconnected)
  const GP_FOCUS_SELECTOR = '.nav-item, .bnav-item, .cat-chip, .hero-btn, .movie-card, .ep-btn, .hist-row, .s-row.clickable, .sidebar-user-card, button:not([disabled]), select, input';
  let gpRafId = 0;
  let gpPrevBtns = {};
  let gpActiveDir = null;
  let gpNextRepeatAt = 0;

  function hasConnectedGamepad() {
    if (!navigator.getGamepads) return false;
    try {
      const pads = navigator.getGamepads();
      if (!pads) return false;
      for (let i = 0; i < pads.length; i++) {
        if (pads[i] && pads[i].connected) return true;
      }
    } catch {}
    return false;
  }

  function updateSidebarGamepadBadge(connected) {
    const badge = document.getElementById('sidebarGamepadBadge');
    if (badge) badge.classList.toggle('hidden', !connected);
  }

  function clearGamepadFocus() {
    document.querySelectorAll('.mf-gp-focus').forEach(el => el.classList.remove('mf-gp-focus'));
    gpFocusedEl = null;
    gpFocusRestoreSelector = '';
  }

  function setGamepadFocus(el, scroll = true) {
    if (!el) return;
    gpInteracting = true;
    document.querySelectorAll('.mf-gp-focus').forEach(n => {
      if (n !== el) n.classList.remove('mf-gp-focus');
    });
    el.classList.add('mf-gp-focus');
    gpFocusedEl = el;
    if (el.id) {
      gpFocusRestoreSelector = '#' + el.id;
    } else if (el.dataset && el.dataset.tab) {
      gpFocusRestoreSelector = `.nav-item[data-tab="${el.dataset.tab}"]`;
    } else {
      gpFocusRestoreSelector = '';
    }
    if (scroll && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }
  }

  function getVisibleFocusableCandidates() {
    const modalRoot = document.getElementById('modalRoot');
    const activeModal = modalRoot && modalRoot.querySelector('.modal-card');
    const scopeRoot = activeModal || document;
    const rawList = scopeRoot.querySelectorAll(GP_FOCUS_SELECTOR);
    const results = [];
    const maxY = window.innerHeight + 520;
    const maxX = window.innerWidth + 520;
    for (let i = 0; i < rawList.length; i++) {
      const el = rawList[i];
      if (el.disabled || el.closest('.hidden')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 6 || rect.height < 6) continue;
      if (rect.bottom < -420 || rect.top > maxY || rect.right < -320 || rect.left > maxX) continue;
      results.push({ el, rect });
    }
    return results;
  }

  function getDefaultBrowsingFocusTarget() {
    const modalRoot = document.getElementById('modalRoot');
    const modalBtn = modalRoot && modalRoot.querySelector('.modal-card button:not([disabled]), .modal-card input');
    if (modalBtn) return modalBtn;
    if (state.detailSlug) {
      return document.getElementById('btnDetailPlay') || document.getElementById('btnDetailBack');
    }
    if (state.tab === 'search') {
      return document.getElementById('searchInput');
    }
    return (
      document.getElementById('btnHeroPlay') ||
      document.querySelector('#mainContent .movie-card') ||
      document.querySelector('.sidebar .nav-item.active') ||
      document.querySelector('.bottom-nav .bnav-item.active')
    );
  }

  function moveSpatialFocus(dx, dy) {
    const candidates = getVisibleFocusableCandidates();
    if (!candidates.length) return;
    if (!gpFocusedEl || !document.body.contains(gpFocusedEl)) {
      const first = getDefaultBrowsingFocusTarget() || candidates[0].el;
      setGamepadFocus(first, true);
      return;
    }

    const curRect = gpFocusedEl.getBoundingClientRect();
    const cx = curRect.left + curRect.width * 0.5;
    const cy = curRect.top + curRect.height * 0.5;
    let bestEl = null;
    let bestScore = Infinity;

    for (let i = 0; i < candidates.length; i++) {
      const { el, rect } = candidates[i];
      if (el === gpFocusedEl) continue;
      const tx = rect.left + rect.width * 0.5;
      const ty = rect.top + rect.height * 0.5;
      const vx = tx - cx;
      const vy = ty - cy;
      const proj = vx * dx + vy * dy;
      if (proj <= 6) continue;

      const ortho = Math.abs(vx * dy - vy * dx);
      const overlap = dx !== 0
        ? (Math.min(curRect.bottom, rect.bottom) - Math.max(curRect.top, rect.top))
        : (Math.min(curRect.right, rect.right) - Math.max(curRect.left, rect.left));
      const sameLane = overlap > 4;
      const score = proj + (sameLane ? ortho * 0.35 : ortho * 2.5 + 110);
      if (score < bestScore) {
        bestScore = score;
        bestEl = el;
      }
    }

    if (bestEl) {
      setGamepadFocus(bestEl, true);
    }
  }

  function activateGamepadFocusedElement() {
    if (!gpFocusedEl || !document.body.contains(gpFocusedEl)) {
      const def = getDefaultBrowsingFocusTarget();
      if (def) setGamepadFocus(def, true);
      return;
    }
    const el = gpFocusedEl;
    if (el.tagName === 'SELECT' && el.options && el.options.length > 0) {
      el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      const optText = el.options[el.selectedIndex]?.textContent || '';
      if (optText) toast(optText);
      return;
    }
    if (el.tagName === 'INPUT' && el.type !== 'checkbox' && el.type !== 'color') {
      el.focus();
      el.click();
      return;
    }
    el.click();
  }

  function handleGamepadBackInBrowser() {
    const modalRoot = document.getElementById('modalRoot');
    if (modalRoot && modalRoot.innerHTML.trim()) {
      if (!state.prefs.langOnboarded) {
        state.prefs.langOnboarded = true;
        savePrefs();
      }
      modalRoot.innerHTML = '';
      restoreGamepadFocusIfActive();
      return;
    }
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT')) {
      document.activeElement.blur();
      return;
    }
    if (state.detailSlug) {
      state.detailSlug = null;
      render();
      return;
    }
    if (state.tab === 'settings' && state.settingsSubPage !== 'main') {
      state.settingsSubPage = 'main';
      stopMonitorLoop();
      render();
    }
  }

  function cycleSidebarTab(delta) {
    const modalRoot = document.getElementById('modalRoot');
    if (modalRoot && modalRoot.innerHTML.trim()) modalRoot.innerHTML = '';
    const curIdx = Math.max(0, SIDEBAR_TABS.indexOf(state.tab));
    const nextIdx = (curIdx + delta + SIDEBAR_TABS.length) % SIDEBAR_TABS.length;
    const nextTab = SIDEBAR_TABS[nextIdx];
    switchTab(nextTab);
    const navBtn = document.querySelector(`.sidebar .nav-item[data-tab="${nextTab}"]`) || document.querySelector(`.bottom-nav .bnav-item[data-tab="${nextTab}"]`);
    if (navBtn && navBtn.offsetParent !== null) {
      setGamepadFocus(navBtn, false);
    }
  }

  function dispatchGamepadDirection(dir) {
    if (playerCtrl.isOpen()) {
      if (dir === 'left') playerCtrl.seekBy(-10);
      else if (dir === 'right') playerCtrl.seekBy(10);
      else if (dir === 'up') playerCtrl.adjustVolume(0.05);
      else if (dir === 'down') playerCtrl.adjustVolume(-0.05);
      return;
    }
    if (dir === 'left') moveSpatialFocus(-1, 0);
    else if (dir === 'right') moveSpatialFocus(1, 0);
    else if (dir === 'up') moveSpatialFocus(0, -1);
    else if (dir === 'down') moveSpatialFocus(0, 1);
  }

  function dispatchGamepadButtonDown(btnIndex) {
    gpInteracting = true;
    if (playerCtrl.isOpen()) {
      if (btnIndex === 0) playerCtrl.togglePlay();
      else if (btnIndex === 1) playerCtrl.close();
      else if (btnIndex === 2) playerCtrl.toggleFullscreen();
      else if (btnIndex === 3) playerCtrl.cycleSubtitle();
      else if (btnIndex === 4) playerCtrl.prevEp();
      else if (btnIndex === 5) playerCtrl.nextEp();
      else if (btnIndex === 9) playerCtrl.triggerSkip();
      return;
    }

    if (btnIndex === 0) activateGamepadFocusedElement();
    else if (btnIndex === 1) handleGamepadBackInBrowser();
    else if (btnIndex === 2) windowOp('fullscreen');
    else if (btnIndex === 3) focusSearchTab();
    else if (btnIndex === 4) cycleSidebarTab(-1);
    else if (btnIndex === 5) cycleSidebarTab(1);
  }

  function pollGamepads(now) {
    if (!hasConnectedGamepad()) {
      gpRafId = 0;
      gpPrevBtns = {};
      gpActiveDir = null;
      updateSidebarGamepadBadge(false);
      return;
    }

    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let detectedDir = null;

    for (let p = 0; p < pads.length; p++) {
      const pad = pads[p];
      if (!pad || !pad.connected) continue;

      const prev = gpPrevBtns[pad.index] || [];
      const next = [];
      const btns = pad.buttons || [];
      for (let b = 0; b < btns.length; b++) {
        const btn = btns[b];
        const pressed = !!(btn && (btn.pressed || btn.value > 0.6));
        next[b] = pressed;
        if (pressed && !prev[b] && b <= 11) {
          dispatchGamepadButtonDown(b);
        }
      }
      gpPrevBtns[pad.index] = next;

      if (!detectedDir) {
        const axX = (pad.axes && pad.axes.length > 0) ? pad.axes[0] : 0;
        const axY = (pad.axes && pad.axes.length > 1) ? pad.axes[1] : 0;
        const thresh = gpActiveDir ? 0.36 : 0.52;
        if ((btns[12] && btns[12].pressed) || axY < -thresh) detectedDir = 'up';
        else if ((btns[13] && btns[13].pressed) || axY > thresh) detectedDir = 'down';
        else if ((btns[14] && btns[14].pressed) || axX < -thresh) detectedDir = 'left';
        else if ((btns[15] && btns[15].pressed) || axX > thresh) detectedDir = 'right';
      }
    }

    if (detectedDir) {
      if (detectedDir !== gpActiveDir) {
        gpActiveDir = detectedDir;
        gpNextRepeatAt = now + 330;
        dispatchGamepadDirection(detectedDir);
      } else if (now >= gpNextRepeatAt) {
        gpNextRepeatAt = now + 150;
        dispatchGamepadDirection(detectedDir);
      }
    } else {
      gpActiveDir = null;
      gpNextRepeatAt = 0;
    }

    gpRafId = requestAnimationFrame(pollGamepads);
  }

  function startGamepadLoop() {
    updateSidebarGamepadBadge(true);
    if (!gpRafId) {
      gpRafId = requestAnimationFrame(pollGamepads);
    }
  }

  function stopGamepadLoop() {
    if (gpRafId) {
      cancelAnimationFrame(gpRafId);
      gpRafId = 0;
    }
    gpPrevBtns = {};
    gpActiveDir = null;
    gpInteracting = false;
    clearGamepadFocus();
    updateSidebarGamepadBadge(false);
  }

  window.addEventListener('gamepadconnected', () => {
    startGamepadLoop();
    toast('Đã kết nối tay cầm 60fps');
    if (!playerCtrl.isOpen() && !gpFocusedEl) {
      const first = getDefaultBrowsingFocusTarget();
      if (first) setGamepadFocus(first, false);
    }
    if (isMonitorVisible()) render();
  });

  window.addEventListener('gamepaddisconnected', () => {
    if (!hasConnectedGamepad()) {
      stopGamepadLoop();
      if (isMonitorVisible()) render();
    }
  });

  document.addEventListener('pointerdown', () => {
    if (gpFocusedEl) {
      gpInteracting = false;
      clearGamepadFocus();
    }
  }, { passive: true });

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      const was = isDesktopLayout();
      syncDesktopChrome();
      if (was !== isDesktopLayout()) render();
    });
  }, { passive: true });

  applyTheme();
  syncDesktopChrome();
  bootstrapAuth();
  loadDiscover();
  resetHeroAutoTimer();
  if (!state.prefs.langOnboarded) {
    setTimeout(() => openDesktopLanguageModal(true), 200);
  }
})();

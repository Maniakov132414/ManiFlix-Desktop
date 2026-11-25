(() => {
  const THEME_PRESETS = [
    { id: 'apple-dark', name: 'Apple Music Tối', mode: 'dark', accent: '#FA2D48', bg: '#121214', surface: '#1C1C1E' },
    { id: 'pure-light', name: 'Trắng Tinh Khôi', mode: 'light', accent: '#FA2D48', bg: '#F4F4F7', surface: '#FFFFFF' },
    { id: 'midnight-indigo', name: 'Midnight Indigo', mode: 'custom', accent: '#5E5CE6', bg: '#0B1020', surface: '#151C32' },
    { id: 'forest-emerald', name: 'Forest Emerald', mode: 'custom', accent: '#30D158', bg: '#0B1612', surface: '#14241D' },
    { id: 'cyberpunk-rose', name: 'Cyberpunk Rose', mode: 'custom', accent: '#FF2D55', bg: '#16091A', surface: '#26112E' }
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
      check: '<polyline points="20 6 9 17 4 12"/>',
      plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
      bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>',
      eyeOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
      back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
      forward: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
      chevRight: '<polyline points="9 18 15 12 9 6"/>',
      chevUp: '<polyline points="18 15 12 9 6 15"/>',
      chevDown: '<polyline points="6 9 12 15 18 9"/>',
      cloudUp: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
      close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      prev: '<polygon points="19 20 9 12 19 4 19 20" fill="currentColor"/><line x1="5" y1="19" x2="5" y2="5"/>',
      next: '<polygon points="5 4 15 12 5 20 5 4" fill="currentColor"/><line x1="19" y1="5" x2="19" y2="19"/>',
      user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'
    };
    return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${paths[name] || ''}</svg>`;
  }

  const state = {
    tab: 'discover',
    detailSlug: null,
    detailData: null,
    detailFranchise: [],
    detailRelated: [],
    selectedServerIdx: 0,
    franchiseExpanded: true,
    settingsSubPage: 'main',
    librarySeg: 'history',
    category: 'all',
    heroIdx: 0,
    heroMovies: [],
    seriesMovies: [],
    singleMovies: [],
    animeMovies: [],
    filteredMovies: [],
    searchQuery: '',
    searchResults: [],
    token: localStorage.getItem('mf.token') || '',
    user: null,
    history: JSON.parse(localStorage.getItem('mf.history') || '[]'),
    favorites: [],
    blocked: JSON.parse(localStorage.getItem('mf.blocked') || '[]'),
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
      autoNext: true
    }, JSON.parse(localStorage.getItem('mf.prefs') || '{}')),
    desktop: { width: 1180, height: 760, alwaysOnTop: false, fullscreen: false, maximized: false, layoutMode: 'desktop', monitorName: 'Primary', refreshRateHz: 60 },
    monitor: {
      liveProbe: true,
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

    const btnPin = document.getElementById('btnPinToggle');
    if (btnPin) btnPin.classList.toggle('active', !!state.desktop.alwaysOnTop);

    const btnFs = document.getElementById('btnFullscreen');
    if (btnFs) btnFs.classList.toggle('active', !!state.desktop.fullscreen);
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

  function setAmbientUrl(imgUrl) {
    const el = document.getElementById('ambientBackdrop');
    if (el && imgUrl) el.style.backgroundImage = `url("${imgUrl}")`;
  }

  function isBlocked(slug) {
    return state.blocked.some(b => b.slug === slug);
  }
  function isFavorite(slug) {
    return state.favorites.some(f => f.slug === slug);
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

  async function loadDiscover() {
    try {
      const [latest, series, single, anime] = await Promise.all([
        api('/api/movies?page=1'),
        api('/api/category?type=phim-bo&page=1').catch(() => ({ items: [] })),
        api('/api/category?type=phim-le&page=1').catch(() => ({ items: [] })),
        api('/api/category?type=hoat-hinh&page=1').catch(() => ({ items: [] }))
      ]);
      state.heroMovies = latest.items || [];
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

  async function selectCategory(catId) {
    state.category = catId;
    if (catId === 'all') {
      render();
      return;
    }
    render();
    try {
      let data;
      if (catId.startsWith('cat:')) {
        data = await api(`/api/category?type=${encodeURIComponent(catId.slice(4))}&page=1`);
      } else {
        data = await api(`/api/the-loai?slug=${encodeURIComponent(catId.slice(6))}&page=1`);
      }
      state.filteredMovies = data.items || [];
      render();
    } catch {}
  }

  function movieCardHtml(m) {
    const primary = resolveImg(m.poster_url || m.thumb_url) || IMG_FALLBACK_SVG;
    const secondary = resolveImg(m.thumb_url || m.poster_url) || '';
    const badge = m.quality || m.episode_current || '';
    const yr = m.year ? `${m.year} / ` : '';
    return `
      <div class="movie-card" data-slug="${esc(m.slug)}">
        <div class="poster-wrap">
          <img loading="lazy" src="${esc(primary)}" data-fallback="${esc(secondary)}" alt="${esc(m.name)}" />
          ${badge ? `<span class="poster-badge">${esc(badge)}</span>` : ''}
        </div>
        <div class="movie-name">${esc(m.name)}</div>
        <div class="movie-meta">${esc(yr + (m.lang || 'Vietsub'))}</div>
      </div>`;
  }

  function renderDiscover() {
    const visibleHero = state.heroMovies.filter(m => !isBlocked(m.slug));
    const featured = visibleHero.slice(0, 5);
    const hero = featured[state.heroIdx] || featured[0];
    if (hero) setAmbientUrl(resolveImg(hero.poster_url || hero.thumb_url));

    let html = `<div class="chips-row">`;
    for (const c of CATEGORIES) {
      html += `<button class="chip ${state.category === c.id ? 'active' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`;
    }
    html += `</div>`;

    if (state.category === 'all') {
      if (hero) {
        const bg = resolveImg(hero.thumb_url || hero.poster_url) || IMG_FALLBACK_SVG;
        const bgFb = resolveImg(hero.poster_url) || '';
        html += `
          <div class="hero-card">
            <img class="hero-bg" src="${esc(bg)}" data-fallback="${esc(bgFb)}" alt="" />
            <div class="hero-grad"></div>
            <div class="hero-body">
              <span class="hero-tag">PHIM MỚI / ${esc(hero.quality || 'HD')}</span>
              <h2 class="hero-title">${esc(hero.name)}</h2>
              <div class="hero-sub">${esc(hero.origin_name || '')} ${hero.year ? '(' + hero.year + ')' : ''}</div>
              <div class="hero-actions">
                <button class="btn-accent" data-open-slug="${esc(hero.slug)}">${svgIcon('play', 14)}<span>Xem ngay</span></button>
                <button class="btn-glass" data-fav-slug="${esc(hero.slug)}">${svgIcon(isFavorite(hero.slug) ? 'check' : 'plus', 14)}<span>${isFavorite(hero.slug) ? 'Đã lưu' : 'Tủ phim'}</span></button>
              </div>
            </div>
          </div>
          <div class="hero-dots">
            ${featured.map((_, i) => `<button class="hero-dot ${i === state.heroIdx ? 'active' : ''}" data-hero-idx="${i}" aria-label="Slide ${i + 1}"></button>`).join('')}
          </div>`;
      }

      if (state.history.length > 0) {
        html += `<div class="section-hdr"><h3 class="section-title">Tiếp tục xem</h3></div><div class="rail">`;
        for (const h of state.history.slice(0, 12)) {
          html += `
            <div class="movie-card" data-slug="${esc(h.slug)}">
              <div class="poster-wrap">
                <img src="${esc(resolveImg(h.poster) || IMG_FALLBACK_SVG)}" alt="" />
                <span class="poster-badge">${esc(h.episodeName || 'Tập 1')}</span>
              </div>
              <div class="movie-name">${esc(h.name || h.slug)}</div>
              <div class="movie-meta">Xem tiếp</div>
            </div>`;
        }
        html += `</div>`;
      }

      const rails = [
        ['Phim bộ mới', state.seriesMovies],
        ['Phim lẻ tuyển chọn', state.singleMovies],
        ['Hoạt hình & Anime', state.animeMovies]
      ];
      for (const [title, list] of rails) {
        const vis = (list || []).filter(m => !isBlocked(m.slug)).slice(0, 14);
        if (!vis.length) continue;
        html += `<div class="section-hdr"><h3 class="section-title">${title}</h3></div><div class="rail">${vis.map(movieCardHtml).join('')}</div>`;
      }

      html += `<div class="section-hdr"><h3 class="section-title">Mới cập nhật</h3></div><div class="movie-grid">${visibleHero.map(movieCardHtml).join('')}</div>`;
    } else {
      const catLabel = CATEGORIES.find(c => c.id === state.category)?.label || '';
      const list = state.filteredMovies.filter(m => !isBlocked(m.slug));
      html += `<div class="section-hdr"><h3 class="section-title">${esc(catLabel)}</h3></div>`;
      html += list.length
        ? `<div class="movie-grid">${list.map(movieCardHtml).join('')}</div>`
        : `<div class="glass-box">Đang tải danh sách...</div>`;
    }

    return html;
  }

  async function openDetail(slug) {
    state.detailSlug = slug;
    state.detailData = null;
    state.detailFranchise = [];
    state.detailRelated = [];
    state.selectedServerIdx = 0;
    render();
    try {
      const [res, fr] = await Promise.all([
        api(`/api/movie/${encodeURIComponent(slug)}`),
        api(`/api/franchise?slug=${encodeURIComponent(slug)}`).catch(() => ({ seasons: [] }))
      ]);
      state.detailData = res;
      state.detailFranchise = fr.seasons || [];
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
    const synopsis = (m.content || '').replace(/<[^>]+>/g, '').trim();
    const poster = resolveImg(m.poster_url || m.thumb_url) || IMG_FALLBACK_SVG;
    const posterFb = resolveImg(m.thumb_url || m.poster_url) || '';

    const leftCol = `
      <div>
        <img class="detail-poster" src="${esc(poster)}" data-fallback="${esc(posterFb)}" alt="" />
        <h2 class="detail-title">${esc(m.name)}</h2>
        ${m.origin_name ? `<div class="detail-origin">${esc(m.origin_name)} ${m.year ? '/ ' + esc(m.year) : ''} ${m.lang ? '/ ' + esc(m.lang) : ''}</div>` : ''}
        <div class="detail-actions">
          <button class="btn-accent" id="btnDetailPlay">${svgIcon('play', 14)}<span>${hist ? 'Xem tiếp: ' + esc(hist.episodeName || 'Tập 1') : 'Phát'}</span></button>
          <button class="btn-glass" id="btnDetailFav" style="color:var(--text-primary)">${svgIcon('bookmark', 14)}<span>${isFavorite(m.slug) ? 'Đã lưu' : 'Lưu'}</span></button>
          <button class="btn-glass" id="btnDetailBlock" style="color:var(--text-primary)">${svgIcon('eyeOff', 14)}<span>Ẩn</span></button>
        </div>
        <div class="chips-row">
          ${m.quality ? `<span class="chip">${esc(m.quality)}</span>` : ''}
          ${m.episode_current ? `<span class="chip">${esc(m.episode_current)}</span>` : ''}
          ${(m.category || []).slice(0, 4).map(c => `<span class="chip">${esc(c.name)}</span>`).join('')}
        </div>
        ${synopsis ? `<div class="glass-box"><div style="font-weight:700;margin-bottom:6px">Giới thiệu</div><div style="font-size:13px;line-height:1.5;color:var(--text-secondary)">${esc(synopsis)}</div></div>` : ''}
      </div>`;

    let franchiseHtml = '';
    if (state.detailFranchise.length > 1) {
      franchiseHtml = `
        <div class="glass-box">
          <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer" id="btnToggleFranchise">
            <strong>Các phần phim (${state.detailFranchise.length})</strong>
            <span style="display:inline-flex;align-items:center;gap:4px;font-size:12px;color:var(--accent)">${state.franchiseExpanded ? 'Thu gọn ' + svgIcon('chevUp', 13) : 'Mở rộng ' + svgIcon('chevDown', 13)}</span>
          </div>
          ${state.franchiseExpanded ? `<div class="franchise-list">${state.detailFranchise.map(s => `
            <button class="season-chip ${s.slug === m.slug ? 'active' : ''}" data-slug="${esc(s.slug)}">${esc(s.fullTitle || s.name || s.slug)}</button>
          `).join('')}</div>` : ''}
        </div>`;
    }

    const rightCol = `
      <div>
        ${franchiseHtml}
        <div class="glass-box">
          <div class="chips-row">
            ${servers.map((s, i) => `<button class="chip ${i === state.selectedServerIdx ? 'active' : ''}" data-srv-idx="${i}">${esc(s.server_name)}</button>`).join('')}
          </div>
          <div style="font-weight:700;margin-bottom:10px">Danh sách tập (${srv.server_data.length})</div>
          <div class="ep-grid">
            ${srv.server_data.map((ep, idx) => `<button class="ep-btn ${hist && hist.episodeIndex === idx ? 'active' : ''}" data-play-ep="${idx}">${esc(ep.name)}</button>`).join('')}
          </div>
        </div>
        ${state.detailRelated.length ? `<div class="section-hdr"><h3 class="section-title">Có thể bạn cũng thích</h3></div><div class="rail">${state.detailRelated.map(movieCardHtml).join('')}</div>` : ''}
      </div>`;

    return html + `<div class="detail-layout">${leftCol}${rightCol}</div>`;
  }

  function renderSearch() {
    const topics = ['Hành động', 'Khoa học viễn tưởng', 'Hình sự', 'Tâm lý', 'Hoạt hình', 'Kinh dị'];
    const vis = state.searchResults.filter(m => !isBlocked(m.slug));
    return `
      <div class="search-bar">
        <input id="searchInput" class="search-input" placeholder="Tìm tên phim, tên gốc, diễn viên..." value="${esc(state.searchQuery)}" />
        <button id="btnRunSearch" class="btn-accent">Tìm</button>
      </div>
      <div class="chips-row">
        ${topics.map(t => `<button class="chip" data-search-topic="${esc(t)}">${esc(t)}</button>`).join('')}
      </div>
      ${vis.length
        ? `<div class="movie-grid">${vis.map(movieCardHtml).join('')}</div>`
        : `<div class="glass-box" style="text-align:center;color:var(--text-secondary)">${state.searchQuery ? 'Không có kết quả phù hợp.' : 'Nhập từ khoá hoặc chọn chủ đề bên trên.'}</div>`}
    `;
  }

  let searchDebounce = null;
  async function runSearch(q) {
    state.searchQuery = q;
    const trimmed = q.trim();
    if (!trimmed) {
      state.searchResults = [];
      render();
      return;
    }
    try {
      const r = await api(`/api/search?q=${encodeURIComponent(trimmed)}&page=1`);
      state.searchResults = r.items || [];
      render();
    } catch {}
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
            <img class="hist-thumb" src="${esc(resolveImg(h.poster) || IMG_FALLBACK_SVG)}" alt="" />
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
          <img class="hist-thumb" style="width:48px;height:68px" src="${esc(resolveImg(b.poster) || IMG_FALLBACK_SVG)}" alt="" />
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
          <div class="settings-label">Tuỳ biến & Chẩn đoán</div>
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
            <div class="s-row"><span>Phiên bản</span><span class="s-sub">1.0.1</span></div>
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

  function renderMonitorSubPage() {
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

    return `
      <div class="settings-wrap" style="max-width:980px">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <button class="detail-back" style="margin:0" data-subpage="main">${svgIcon('back', 14)}<span>Cài đặt</span></button>
            <h3 style="margin:0">Kiểm tra mạng & Thiết bị</h3>
            <span class="win-pill" style="color:#30D158;border-color:#30D158">LIVE</span>
          </div>
          <div style="display:flex;gap:8px">
            <button class="tb-btn ${state.monitor.liveProbe?'active':''}" id="btnToggleProbe">Live Probe: ${state.monitor.liveProbe?'BẬT':'TẮT'}</button>
            <button class="btn-accent" id="btnRunSpeedtest">Đo Speedtest Ngay</button>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card"><div class="kpi-lbl">Tải xuống (Probe)</div><div class="kpi-val" style="color:#30D158">${dl.toFixed(1)} Mbps</div></div>
          <div class="kpi-card"><div class="kpi-lbl">Tải lên (Probe)</div><div class="kpi-val" style="color:#0A84FF">${ul.toFixed(1)} Mbps</div></div>
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
            <div style="font-weight:700;margin-bottom:8px">Phần cứng thiết bị</div>
            <div class="spec-kv"><span>Hệ điều hành</span><strong>${si ? esc(si.osName + ' ' + si.osVersion) : '...'}</strong></div>
            <div class="spec-kv"><span>CPU</span><strong>${si ? esc(si.cpuBrand) : '...'}</strong></div>
            <div class="spec-kv"><span>Nhân CPU</span><strong>${si ? `${si.cpuPhysicalCores} vật lý / ${si.cpuLogicalCores} luồng` : '...'}</strong></div>
            <div class="spec-kv"><span>RAM Hệ thống</span><strong>${si ? `${(si.usedRamMb/1024).toFixed(1)} / ${(si.totalRamMb/1024).toFixed(1)} GB (Trống ${(si.freeRamMb/1024).toFixed(1)} GB)` : '...'}</strong></div>
            <div class="spec-kv"><span>Ổ đĩa (${si ? esc(si.diskMount) : 'C:'})</span><strong>${si ? `Trống ${si.diskFreeGb} / ${si.diskTotalGb} GB` : '...'}</strong></div>
            <div class="spec-kv"><span>Cửa sổ & Màn hình</span><strong>${si ? `${si.window.width}x${si.window.height} (${si.window.refreshRateHz} Hz)` : '...'}</strong></div>
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

  async function pollMonitor(runProbe = false) {
    try {
      const t0 = performance.now();
      const [si, ns] = await Promise.all([
        api('/__desktop/sysinfo'),
        api('/api/net-stats').catch(() => null)
      ]);
      const ping = Math.max(1, performance.now() - t0);
      const prevPing = state.monitor.pingMs || ping;
      state.monitor.jitterMs = Math.abs(ping - prevPing);
      state.monitor.pingMs = ping;
      state.monitor.sysinfo = si;
      if (ns) state.monitor.netStats = ns;

      if (runProbe) {
        const d0 = performance.now();
        const probeRes = await fetch('/api/net-probe?kb=256', { cache: 'no-store' });
        const buf = await probeRes.arrayBuffer();
        const dSec = Math.max(0.005, (performance.now() - d0) / 1000);
        state.monitor.dlMbps = (buf.byteLength * 8) / (dSec * 1_000_000);

        const u0 = performance.now();
        const payload = new Uint8Array(128 * 1024);
        await fetch('/api/net-up', { method: 'POST', body: payload, headers: { 'Content-Type': 'application/octet-stream' } });
        const uSec = Math.max(0.005, (performance.now() - u0) / 1000);
        state.monitor.ulMbps = (payload.byteLength * 8) / (uSec * 1_000_000);
      }

      const push = (arr, v) => { arr.push(v); if (arr.length > 24) arr.shift(); };
      push(state.monitor.dlSeries, state.monitor.dlMbps);
      push(state.monitor.ulSeries, state.monitor.ulMbps);
      push(state.monitor.pingSeries, state.monitor.pingMs);
      push(state.monitor.serverCpuSeries, ns?.cpuPct || 0);

      if (state.tab === 'settings' && state.settingsSubPage === 'monitor') {
        render();
        drawChart('canvasNetSpeed', state.monitor.dlSeries, state.monitor.ulSeries, '#30D158', '#0A84FF');
        drawChart('canvasPingLoad', state.monitor.pingSeries, state.monitor.serverCpuSeries, '#FF9F0A', '#FA2D48');
      }
    } catch {}
  }

  function startMonitorLoop() {
    stopMonitorLoop();
    pollMonitor(true);
    state.monitor.timer = setInterval(() => {
      if (state.tab === 'settings' && state.settingsSubPage === 'monitor') {
        pollMonitor(state.monitor.liveProbe);
      }
    }, 2500);
  }

  function stopMonitorLoop() {
    if (state.monitor.timer) {
      clearInterval(state.monitor.timer);
      state.monitor.timer = null;
    }
  }

  function openPlayer(movie, servers, serverIndex, episodeIndex) {
    const srv = servers[serverIndex] || { server_data: [] };
    const ep = srv.server_data[episodeIndex];
    if (!ep || !ep.link_m3u8) { toast('Tập này chưa có luồng HLS'); return; }

    const root = document.getElementById('playerRoot');
    let hls = null;
    let markers = [];
    let skippedIds = new Set();
    let lastSave = -999;

    const rawUrl = ep.link_m3u8.trim();
    const cleanUrl = `/api/clean-m3u8?url=${encodeURIComponent(rawUrl)}`;

    root.innerHTML = `
      <div class="player-overlay">
        <div class="player-topbar">
          <div style="min-width:0">
            <div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(movie.name)} — ${esc(ep.name)}</div>
            <div id="playerSourceLbl" style="font-size:11px;color:#a4a4ad">Nguồn: Chuẩn (clean-m3u8)</div>
          </div>
          <div style="display:flex;gap:6px">
            <button class="tb-btn" id="btnPlayerAspect">Tỉ lệ: Gốc</button>
            <button class="tb-btn" id="btnPlayerClose">${svgIcon('close', 13)}<span>Đóng</span></button>
          </div>
        </div>
        <div id="playerStage" class="player-stage">
          <video id="videoEl" controls autoplay playsinline></video>
          <button id="btnSkipMarker" class="skip-floating hidden"><span>Bỏ qua mở đầu</span>${svgIcon('forward', 14)}</button>
        </div>
        <div class="player-controls">
          <div style="display:flex;gap:6px;align-items:center">
            <button class="tb-btn" id="btnPrevEp" ${episodeIndex <= 0 ? 'disabled' : ''}>${svgIcon('prev', 13)}<span>Tập trước</span></button>
            <button class="tb-btn" id="btnNextEp" ${episodeIndex + 1 >= srv.server_data.length ? 'disabled' : ''}><span>Tập sau</span>${svgIcon('next', 13)}</button>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <select id="selPlayerSpeed">
              <option value="0.75">0.75x</option>
              <option value="1" selected>1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
            <button class="tb-btn" id="btnFailover">Đổi nguồn</button>
          </div>
        </div>
      </div>`;

    const video = document.getElementById('videoEl');
    const stage = document.getElementById('playerStage');
    const skipBtn = document.getElementById('btnSkipMarker');

    function attachStream(srcUrl, label) {
      document.getElementById('playerSourceLbl').textContent = `Nguồn: ${label}`;
      if (hls) { hls.destroy(); hls = null; }
      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({ enableWorker: true });
        hls.loadSource(srcUrl);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, (_, data) => {
          if (data.fatal && srcUrl !== rawUrl) {
            attachStream(rawUrl, 'Dự phòng (gốc)');
          }
        });
      } else {
        video.src = srcUrl;
      }
    }

    attachStream(cleanUrl, 'Chuẩn (clean-m3u8)');

    const epDigits = (ep.slug || String(episodeIndex + 1)).replace(/\D+/g, '') || '1';
    const titleHint = movie.origin_name || movie.name || '';
    api(`/api/ads/${encodeURIComponent(movie.slug)}/${encodeURIComponent(epDigits)}?title=${encodeURIComponent(titleHint)}`)
      .then(r => { markers = r.markers || []; })
      .catch(() => {});

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
    };

    document.getElementById('selPlayerSpeed').onchange = (e) => {
      video.playbackRate = parseFloat(e.target.value) || 1;
    };

    document.getElementById('btnFailover').onclick = () => {
      const cur = document.getElementById('playerSourceLbl').textContent.includes('Chuẩn');
      attachStream(cur ? rawUrl : cleanUrl, cur ? 'Dự phòng (gốc)' : 'Chuẩn (clean-m3u8)');
    };

    const closePlayer = () => {
      if (hls) hls.destroy();
      video.pause();
      root.innerHTML = '';
    };
    document.getElementById('btnPlayerClose').onclick = closePlayer;

    document.getElementById('btnPrevEp').onclick = () => {
      if (episodeIndex > 0) { closePlayer(); openPlayer(movie, servers, serverIndex, episodeIndex - 1); }
    };
    document.getElementById('btnNextEp').onclick = () => {
      if (episodeIndex + 1 < srv.server_data.length) { closePlayer(); openPlayer(movie, servers, serverIndex, episodeIndex + 1); }
    };

    video.ontimeupdate = () => {
      const t = video.currentTime || 0;
      const dur = video.duration || 0;

      let activeSkip = null;
      for (const m of markers) {
        const end = m.openEnd && dur > m.start ? dur : m.end;
        const mode = m.mode || (m.type === 'ad' ? 'cut' : 'skip');
        if (mode === 'cut' && state.prefs.autoCutAds && !skippedIds.has(m.id) && t >= m.start && t < end) {
          skippedIds.add(m.id);
          video.currentTime = end + 0.1;
          toast('Đã bỏ qua quảng cáo');
          return;
        }
        if (mode === 'skip' && state.prefs.introSkip !== 'off' && t >= m.start && t < end - 0.5 && !skippedIds.has(m.id)) {
          if (state.prefs.introSkip === 'auto') {
            skippedIds.add(m.id);
            video.currentTime = end + 0.1;
            toast('Đã tự động bỏ qua giới thiệu');
            return;
          }
          activeSkip = { m, end };
        }
      }

      if (activeSkip) {
        const lbl = activeSkip.m.type === 'outro' ? 'Bỏ qua kết thúc' : (activeSkip.m.label || 'Bỏ qua mở đầu');
        skipBtn.innerHTML = `<span>${esc(lbl)}</span>${svgIcon('forward', 14)}`;
        skipBtn.classList.remove('hidden');
        skipBtn.onclick = () => {
          skippedIds.add(activeSkip.m.id);
          video.currentTime = activeSkip.end + 0.1;
          skipBtn.classList.add('hidden');
        };
      } else {
        skipBtn.classList.add('hidden');
      }

      if (t > 5 && Math.abs(t - lastSave) >= 12) {
        lastSave = t;
        const entry = {
          slug: movie.slug, name: movie.name, poster: movie.poster_url || movie.thumb_url,
          episodeIndex, episodeName: ep.name, currentTime: t, duration: dur
        };
        state.history = [entry, ...state.history.filter(x => x.slug !== movie.slug)].slice(0, 40);
        localStorage.setItem('mf.history', JSON.stringify(state.history));
        if (state.token) {
          api('/api/user/history', { method: 'POST', json: entry }).catch(() => {});
        }
      }
    };

    video.onended = () => {
      if (state.prefs.autoNext && episodeIndex + 1 < srv.server_data.length) {
        closePlayer();
        openPlayer(movie, servers, serverIndex, episodeIndex + 1);
      }
    };
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
    } else {
      mc.innerHTML = renderSettings();
    }
    bindDynamicEvents();
  }

  function bindDynamicEvents() {
    const mc = document.getElementById('mainContent');
    mc.querySelectorAll('[data-slug]').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('[data-del-hist]') || e.target.closest('[data-unblock]')) return;
        openDetail(el.dataset.slug);
      };
    });
    mc.querySelectorAll('[data-open-slug]').forEach(el => {
      el.onclick = () => openDetail(el.dataset.openSlug);
    });
    mc.querySelectorAll('[data-cat]').forEach(el => {
      el.onclick = () => selectCategory(el.dataset.cat);
    });
    mc.querySelectorAll('[data-hero-idx]').forEach(el => {
      el.onclick = () => { state.heroIdx = parseInt(el.dataset.heroIdx, 10) || 0; render(); };
    });
    mc.querySelectorAll('[data-fav-slug]').forEach(el => {
      el.onclick = async () => {
        if (!state.token) { openAuthModal(); return; }
        const m = state.heroMovies.find(x => x.slug === el.dataset.favSlug);
        if (!m) return;
        try {
          const r = await api('/api/user/favorites/toggle', {
            method: 'POST',
            json: { slug: m.slug, name: m.name, poster: m.poster_url || m.thumb_url || '', year: m.year || 0, quality: m.quality || 'HD', lang: m.lang || 'Vietsub' }
          });
          if (Array.isArray(r.favorites)) state.favorites = r.favorites;
          render();
        } catch {}
      };
    });

    const backBtn = document.getElementById('btnDetailBack');
    if (backBtn) backBtn.onclick = () => { state.detailSlug = null; render(); };

    const toggleFr = document.getElementById('btnToggleFranchise');
    if (toggleFr) toggleFr.onclick = () => { state.franchiseExpanded = !state.franchiseExpanded; render(); };

    mc.querySelectorAll('[data-srv-idx]').forEach(el => {
      el.onclick = () => { state.selectedServerIdx = parseInt(el.dataset.srvIdx, 10) || 0; render(); };
    });
    mc.querySelectorAll('[data-play-ep]').forEach(el => {
      el.onclick = () => {
        const epIdx = parseInt(el.dataset.playEp, 10) || 0;
        openPlayer(state.detailData.movie, state.detailData.episodes || [], state.selectedServerIdx, epIdx);
      };
    });
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
      const r = await api('/api/user/favorites/toggle', {
        method: 'POST',
        json: { slug: m.slug, name: m.name, poster: m.poster_url || m.thumb_url || '', year: m.year || 0, quality: m.quality || 'HD', lang: m.lang || 'Vietsub' }
      });
      if (Array.isArray(r.favorites)) state.favorites = r.favorites;
      render();
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
    if (btnProbe) btnProbe.onclick = () => { state.monitor.liveProbe = !state.monitor.liveProbe; render(); };
    const btnSpeed = document.getElementById('btnRunSpeedtest');
    if (btnSpeed) btnSpeed.onclick = () => { toast('Đang đo Speedtest...'); pollMonitor(true); };
  }

  document.querySelectorAll('.nav-item, .bnav-item').forEach(btn => {
    btn.onclick = () => {
      state.tab = btn.dataset.tab;
      state.detailSlug = null;
      if (state.tab !== 'settings' || state.settingsSubPage !== 'monitor') stopMonitorLoop();
      else startMonitorLoop();
      render();
    };
  });

  document.getElementById('btnPinToggle').onclick = () => windowOp(state.desktop.alwaysOnTop ? 'unpin' : 'pin');
  document.getElementById('btnFullscreen').onclick = () => windowOp('fullscreen');
  document.getElementById('btnAccount').onclick = openAuthModal;
  document.getElementById('sidebarUserCard').onclick = openAuthModal;

  window.addEventListener('resize', () => {
    const was = isDesktopLayout();
    syncDesktopChrome();
    if (was !== isDesktopLayout()) render();
  });

  applyTheme();
  syncDesktopChrome();
  bootstrapAuth();
  loadDiscover();
})();

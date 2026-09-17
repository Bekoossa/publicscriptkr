/**
 * PublicScriptKR — Frontend Client
 * Communicates directly with the Node.js Express backend running on the host PC.
 * Real user accounts, real database persistence, real likes & comments,
 * and file uploads saved to disk.
 */

// Cookie & Auth Transfer Helpers
function getCookie(name) {
  try {
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (e) {
    return null;
  }
}

function setCookie(name, value, days = 365) {
  try {
    const maxAge = days * 24 * 60 * 60;
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch (e) {}
}

function deleteCookie(name) {
  try {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  } catch (e) {}
}

function extractAuthTokenFromUrl() {
  try {
    const hashMatch = window.location.hash.match(/[#&](?:auth|token)=([^&]+)/);
    if (hashMatch && hashMatch[1]) {
      return decodeURIComponent(hashMatch[1]);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const queryToken = urlParams.get('auth') || urlParams.get('token');
    if (queryToken) {
      return queryToken;
    }
  } catch(e) {}
  return null;
}

const _initialUrlToken = extractAuthTokenFromUrl();
if (_initialUrlToken) {
  try {
    localStorage.setItem('pskr_token', _initialUrlToken);
    localStorage.setItem('pskr_auth_token', _initialUrlToken);
    setCookie('pskr_token', _initialUrlToken, 365);
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch(e) {}
}

// Global State
const State = {
  token: _initialUrlToken || localStorage.getItem('pskr_token') || localStorage.getItem('pskr_auth_token') || getCookie('pskr_token') || null,
  currentUser: null,
  activeCategory: 'all',
  sortBy: 'newest',
  searchQuery: '',
  activeModalScript: null,
  uploadedImageDataUrl: null,
  selectedRegisterAvatar: null,
  publicTunnelUrl: 'https://publicscriptkr.vercel.app'
};
// Preset SVGs for stunning 4:3 cyber covers
const RAW_SVGS = {
  'neon-executor': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0c0e14"/><stop offset="100%" stop-color="#030407"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect width="800" height="600" fill="url(#g1)"/><circle cx="700" cy="120" r="220" fill="#8b5cf6" opacity="0.2" filter="blur(50px)"/><circle cx="100" cy="480" r="200" fill="#06b6d4" opacity="0.18" filter="blur(50px)"/><path d="M 50 200 L 750 200" stroke="rgba(255,255,255,0.05)" stroke-width="1"/><path d="M 50 400 L 750 400" stroke="rgba(255,255,255,0.05)" stroke-width="1"/><rect x="70" y="80" width="660" height="440" rx="18" fill="rgba(14,16,24,0.85)" stroke="rgba(139,92,246,0.35)" stroke-width="2"/><text x="110" y="160" fill="#c4b5fd" font-family="monospace" font-size="32" font-weight="bold">-- [ NEON LUA EXECUTOR ]</text><text x="110" y="230" fill="#38bdf8" font-family="monospace" font-size="20">loadstring(game:HttpGet("https://publicscript.kr/v3"))()</text><text x="110" y="290" fill="#34d399" font-family="monospace" font-size="18">&gt; Bypass: ACTIVE | Memory Hook: Injected</text><text x="110" y="340" fill="#fb7185" font-family="monospace" font-size="18">&gt; FPS Unlocker: 240 FPS Target</text><text x="110" y="390" fill="#c084fc" font-family="monospace" font-size="18">&gt; Anti-Cheat Protection: Level 9 [Secured]</text><rect x="110" y="440" width="180" height="42" rx="8" fill="url(#glow)"/><text x="142" y="467" fill="#ffffff" font-family="sans-serif" font-size="16" font-weight="bold">EXECUTE 4:3</text></svg>`,

  'cyber-hub': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#07080d"/><stop offset="100%" stop-color="#1a1538"/></linearGradient></defs><rect width="800" height="600" fill="url(#bg)"/><circle cx="400" cy="300" r="220" fill="#a855f7" opacity="0.22" filter="blur(70px)"/><rect x="80" y="70" width="640" height="460" rx="20" fill="rgba(11,13,22,0.88)" stroke="rgba(168,85,247,0.45)" stroke-width="2"/><circle cx="120" cy="115" r="8" fill="#f43f5e"/><circle cx="145" cy="115" r="8" fill="#f59e0b"/><circle cx="170" cy="115" r="8" fill="#10b981"/><text x="120" y="190" fill="#c084fc" font-family="monospace" font-size="36" font-weight="900">CYBER HUB v4.2</text><text x="120" y="250" fill="#94a3b8" font-family="monospace" font-size="19">⚡ Auto Farm • Mastery • Fast Attack • Teleport</text><rect x="120" y="300" width="270" height="52" rx="10" fill="rgba(168,85,247,0.18)" stroke="rgba(168,85,247,0.45)"/><text x="140" y="333" fill="#f3e8ff" font-family="monospace" font-size="16">Auto-Farm Mob: ENABLED</text><rect x="410" y="300" width="240" height="52" rx="10" fill="rgba(6,182,212,0.18)" stroke="rgba(6,182,212,0.45)"/><text x="430" y="333" fill="#cffafe" font-family="monospace" font-size="16">Speed: 450 studs/s</text><rect x="120" y="380" width="530" height="52" rx="10" fill="rgba(16,185,129,0.12)" stroke="rgba(16,185,129,0.35)"/><text x="140" y="413" fill="#a7f3d0" font-family="monospace" font-size="16">🛡️ Anti-Ban Protocol: Verified Active</text></svg>`,

  'esp-radar': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><defs><radialGradient id="radarG" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/><stop offset="100%" stop-color="#022c22" stop-opacity="0"/></radialGradient></defs><rect width="800" height="600" fill="#02110c"/><circle cx="400" cy="300" r="230" fill="url(#radarG)" stroke="#059669" stroke-width="1.5" stroke-dasharray="8,5"/><circle cx="400" cy="300" r="150" stroke="#10b981" stroke-width="1.2"/><circle cx="400" cy="300" r="70" stroke="#34d399" stroke-width="1.2"/><line x1="400" y1="30" x2="400" y2="570" stroke="#047857" stroke-width="1.2"/><line x1="130" y1="300" x2="670" y2="300" stroke="#047857" stroke-width="1.2"/><circle cx="510" cy="230" r="9" fill="#f43f5e"/><text x="528" y="236" fill="#fca5a5" font-family="monospace" font-size="15" font-weight="bold">Enemy Target (34m)</text><circle cx="310" cy="390" r="9" fill="#38bdf8"/><text x="328" y="396" fill="#bae6fd" font-family="monospace" font-size="15" font-weight="bold">Team Squad (72m)</text><rect x="60" y="50" width="250" height="85" rx="12" fill="rgba(6,40,30,0.85)" stroke="#10b981" stroke-width="1.5"/><text x="80" y="86" fill="#34d399" font-family="monospace" font-size="18" font-weight="bold">ESP &amp; CHAMS HUD</text><text x="80" y="115" fill="#6ee7b7" font-family="monospace" font-size="14">3D Box | Tracers | Distance</text></svg>`,

  'dark-config': `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="#080b12"/><rect x="60" y="50" width="680" height="500" rx="16" fill="#0e1422" stroke="rgba(255,255,255,0.12)" stroke-width="1.5"/><text x="90" y="110" fill="#f59e0b" font-family="monospace" font-size="22" font-weight="bold"># SERVER CONFIGURATION 4:3 (.TXT)</text><text x="90" y="170" fill="#94a3b8" font-family="monospace" font-size="17">[NetworkSettings]</text><text x="90" y="210" fill="#e2e8f0" font-family="monospace" font-size="17">MaxConcurrentConnections = 2048</text><text x="90" y="250" fill="#e2e8f0" font-family="monospace" font-size="17">RateLimitPerSecond = 100</text><text x="90" y="310" fill="#94a3b8" font-family="monospace" font-size="17">[SecurityHooks]</text><text x="90" y="350" fill="#10b981" font-family="monospace" font-size="17">AntiPacketInject = true</text><text x="90" y="390" fill="#10b981" font-family="monospace" font-size="17">BypassDetectionLevel = "Maximum-Aggressive"</text><text x="90" y="450" fill="#c4b5fd" font-family="monospace" font-size="17">[OutputLog]</text><text x="90" y="490" fill="#38bdf8" font-family="monospace" font-size="17">Status = 200 OK (Render Aspect 4:3 Verified)</text></svg>`
};

const PRESET_COVERS = {};
for (const key in RAW_SVGS) {
  PRESET_COVERS[key] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(RAW_SVGS[key]);
}

const DEFAULT_AVATARS = [
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#1e1b4b"/><circle cx="50" cy="40" r="18" fill="#8b5cf6"/><path d="M 22 85 C 22 66, 78 66, 78 85 Z" fill="#8b5cf6"/></svg>`),
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#064e3b"/><circle cx="50" cy="40" r="18" fill="#10b981"/><path d="M 22 85 C 22 66, 78 66, 78 85 Z" fill="#10b981"/></svg>`),
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#4c0519"/><circle cx="50" cy="40" r="18" fill="#f43f5e"/><path d="M 22 85 C 22 66, 78 66, 78 85 Z" fill="#f43f5e"/></svg>`),
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#082f49"/><circle cx="50" cy="40" r="18" fill="#06b6d4"/><path d="M 22 85 C 22 66, 78 66, 78 85 Z" fill="#06b6d4"/></svg>`)
];

window.PRESET_COVERS = PRESET_COVERS;
window.DEFAULT_AVATARS = DEFAULT_AVATARS;

function getCardCover(script) {
  if (!script) return PRESET_COVERS['cyber-hub'];
  if (script.coverImage && (script.coverImage.startsWith('data:image') || script.coverImage.startsWith('http') || script.coverImage.startsWith('/uploads/') || script.coverImage.startsWith('uploads/'))) {
    return script.coverImage.startsWith('uploads/') ? '/' + script.coverImage : script.coverImage;
  }
  if (script.presetCover && PRESET_COVERS[script.presetCover]) {
    return PRESET_COVERS[script.presetCover];
  }
  if (script.extension === 'txt') return PRESET_COVERS['dark-config'];
  if (script.category === 'roblox') return PRESET_COVERS['neon-executor'];
  if (script.category === 'utilities' || script.category === 'bot') return PRESET_COVERS['esp-radar'];
  const hash = Math.abs((script.id || script.title || '').split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
  const keys = ['neon-executor', 'cyber-hub', 'esp-radar', 'dark-config'];
  return PRESET_COVERS[keys[hash % keys.length]] || PRESET_COVERS['cyber-hub'];
}

function getAvatarSrc(src) {
  if (!src) return DEFAULT_AVATARS[0];
  if (src.startsWith('data:image') || src.startsWith('http') || src.startsWith('/uploads/') || src.startsWith('uploads/')) {
    return src.startsWith('uploads/') ? '/' + src : src;
  }
  return DEFAULT_AVATARS[0];
}

function isUserModerator(user) {
  if (!user) return false;
  const uname = (user.username || '').toLowerCase();
  return (
    user.badge === 'ADMIN' ||
    user.badge === 'MODERATOR' ||
    uname === 'kerryrbq' ||
    user.id === 'u-1789205573347' ||
    user.id === 'kerryrbq' ||
    user.isModerator === true
  );
}

function canUserManageScript(script, user = State.currentUser) {
  if (!script || !user) return false;
  if (isUserModerator(user)) return true;

  const userUname = (user.username || '').trim().toLowerCase();
  const scriptAuthor = (script.author || '').trim().toLowerCase();
  const scriptAuthorId = script.authorId ? String(script.authorId).trim() : '';
  const userId = user.id ? String(user.id).trim() : '';

  if (scriptAuthorId && userId && scriptAuthorId === userId) return true;
  if (scriptAuthor && userUname && scriptAuthor === userUname) return true;
  return false;
}


// ============================================================================
// KERRYRBQ ADMIN DEBUG & ERROR CONSOLE SUBSYSTEM
// ============================================================================

const DebugConsole = {
  logs: [],
  activeFilter: 'all',
  errCount: 0,
  initialized: false,

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.bindGlobalInterceptors();
    this.bindUIEvents();
    this.log('info', 'PublicScriptKR Debug Console initialized.');
  },

  log(category, message, details = null) {
    const timestamp = new Date().toLocaleTimeString('ru-RU', { hour12: false }) + '.' + String(Date.now() % 1000).padStart(3, '0');
    const entry = { id: Date.now() + Math.random(), timestamp, category, message, details };
    this.logs.unshift(entry);
    if (this.logs.length > 500) this.logs.pop();

    if (category === 'error') {
      this.errCount++;
      this.updateErrBadges();
    }

    this.renderLogEntry(entry);
    this.updateCounts();
  },

  updateErrBadges() {
    const fltBadge = document.getElementById('consoleFloatingErrBadge');
    const navBadge = document.getElementById('consoleNavErrBadge');
    if (this.errCount > 0) {
      if (fltBadge) { fltBadge.textContent = this.errCount; fltBadge.classList.remove('hidden'); }
      if (navBadge) { navBadge.textContent = this.errCount; navBadge.classList.remove('hidden'); }
    } else {
      if (fltBadge) fltBadge.classList.add('hidden');
      if (navBadge) navBadge.classList.add('hidden');
    }
  },

  updateCounts() {
    const countAll = document.getElementById('cCountAll');
    const countErr = document.getElementById('cCountErr');
    const countApi = document.getElementById('cCountApi');
    const countAuth = document.getElementById('cCountAuth');

    if (countAll) countAll.textContent = this.logs.length;
    if (countErr) countErr.textContent = this.logs.filter(l => l.category === 'error').length;
    if (countApi) countApi.textContent = this.logs.filter(l => l.category === 'api').length;
    if (countAuth) countAuth.textContent = this.logs.filter(l => l.category === 'auth').length;

    const tokenPill = document.getElementById('consoleTokenPill');
    if (tokenPill) {
      if (State.token) {
        const parts = State.token.split('.');
        const isHMAC = parts.length === 3;
        tokenPill.className = 'console-auth-pill valid';
        tokenPill.textContent = `Токен: ${isHMAC ? 'HMAC Signed' : 'Legacy'} (${State.currentUser?.username || 'Гость'})`;
      } else {
        tokenPill.className = 'console-auth-pill invalid';
        tokenPill.textContent = 'Токен: Отсутствует';
      }
    }
  },

  renderLogEntry(entry) {
    const feed = document.getElementById('consoleLogsFeed');
    if (!feed) return;
    if (this.activeFilter !== 'all' && this.activeFilter !== entry.category) return;

    const row = document.createElement('div');
    row.className = 'console-log-row';
    let tagClass = 'console-tag-' + entry.category;
    let detailsHtml = '';
    if (entry.details) {
      const detailsStr = typeof entry.details === 'object' ? JSON.stringify(entry.details, null, 2) : String(entry.details);
      detailsHtml = `<div class="console-log-details">${escapeHtml(detailsStr)}</div>`;
    }

    row.innerHTML = `
      <span class="console-log-time">${entry.timestamp}</span>
      <span class="console-log-tag ${tagClass}">${entry.category}</span>
      <div class="console-log-msg">
        <div>${escapeHtml(entry.message)}</div>
        ${detailsHtml}
      </div>
    `;

    feed.insertBefore(row, feed.firstChild);
  },

  renderAll() {
    const feed = document.getElementById('consoleLogsFeed');
    if (!feed) return;
    feed.innerHTML = '';
    const filtered = this.logs.filter(l => this.activeFilter === 'all' || l.category === this.activeFilter);
    filtered.forEach(entry => {
      const row = document.createElement('div');
      row.className = 'console-log-row';
      let tagClass = 'console-tag-' + entry.category;
      let detailsHtml = '';
      if (entry.details) {
        const detailsStr = typeof entry.details === 'object' ? JSON.stringify(entry.details, null, 2) : String(entry.details);
        detailsHtml = `<div class="console-log-details">${escapeHtml(detailsStr)}</div>`;
      }
      row.innerHTML = `
        <span class="console-log-time">${entry.timestamp}</span>
        <span class="console-log-tag ${tagClass}">${entry.category}</span>
        <div class="console-log-msg">
          <div>${escapeHtml(entry.message)}</div>
          ${detailsHtml}
        </div>
      `;
      feed.appendChild(row);
    });
    this.updateCounts();
  },

  clear() {
    this.logs = [];
    this.errCount = 0;
    this.updateErrBadges();
    this.renderAll();
    this.log('info', 'Логи консоли очищены.');
  },

  copyAll() {
    const text = this.logs.map(l => `[${l.timestamp}] [${l.category.toUpperCase()}] ${l.message} ${l.details ? JSON.stringify(l.details) : ''}`).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      showToast('Все логи скопированы в буфер обмена', 'success');
    }).catch(() => {
      showToast('Не удалось скопировать логи', 'error');
    });
  },

  open() {
    const modal = document.getElementById('adminConsoleModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.renderAll();
      setTimeout(() => {
        const input = document.getElementById('consoleCommandInput');
        if (input) input.focus();
      }, 100);
    }
  },

  close() {
    const modal = document.getElementById('adminConsoleModal');
    if (modal) modal.classList.add('hidden');
  },

  async executeCommand(cmd) {
    const clean = (cmd || '').trim();
    if (!clean) return;
    this.log('cmd', `> ${clean}`);

    const parts = clean.split(' ');
    const command = parts[0].toLowerCase();

    switch (command) {
      case '/help':
        this.log('info', 'Доступные команды:\n/ping — проверка сетевой задержки и API\n/reauth — пересоздать токен сессии Kerryrbq\n/whoami — данные текущей сессии и пользователя\n/test-publish — тест отправки скрипта\n/scripts — список скриптов на сервере\n/clear — очистить консоль\n/copy — скопировать логи');
        break;

      case '/ping':
        try {
          const t0 = performance.now();
          const diag = await api('/api/debug/diagnostics');
          const t1 = performance.now();
          this.log('info', `✅ Пинг успешен (${Math.round(t1 - t0)}ms):`, diag);
        } catch (e) {
          this.log('error', `❌ Ошибка пинга API: ${e.message}`, e);
        }
        break;

      case '/reauth':
        try {
          this.log('auth', 'Запрос пересоздания токена для Kerryrbq...');
          const res = await api('/api/auth/refresh-token', {
            method: 'POST',
            body: JSON.stringify({ username: State.currentUser?.username || 'Kerryrbq', userId: State.currentUser?.id })
          });
          if (res && res.token) {
            State.token = res.token;
            State.currentUser = res.user;
            localStorage.setItem('pskr_token', res.token);
            localStorage.setItem('pskr_user', JSON.stringify(res.user));
            renderUserNav(res.user);
            this.log('auth', '✅ Токен Kerryrbq успешно обновлен!', { token: res.token, user: res.user });
            showToast('Токен Kerryrbq успешно обновлен!', 'success');
          }
        } catch (e) {
          this.log('error', `❌ Ошибка обновления токена: ${e.message}`, e);
        }
        break;

      case '/whoami':
        this.log('auth', 'Текущее состояние сессии:', {
          currentUser: State.currentUser,
          hasToken: !!State.token,
          tokenPreview: State.token ? State.token.substring(0, 30) + '...' : null,
          localStorage_user: localStorage.getItem('pskr_user'),
          localStorage_token: localStorage.getItem('pskr_token') ? 'PRESENT' : 'NONE'
        });
        break;

      case '/test-publish':
        try {
          this.log('api', 'Отправка тестового скрипта...');
          const payload = {
            title: 'Diagnostic Test Script [Kerryrbq]',
            category: 'roblox',
            extension: 'lua',
            code: '-- Test Diagnostic Code\nprint("PublicScriptKR Kerryrbq Verified")',
            description: 'Автоматический диагностический тест консоли',
            tags: ['debug', 'test']
          };
          const res = await api('/api/scripts', { method: 'POST', body: JSON.stringify(payload) });
          this.log('info', '✅ Тестовый скрипт успешно отправлен!', res);
          showToast('Тест выкладки прошел успешно!', 'success');
          loadScriptsFeed();
        } catch (e) {
          this.log('error', `❌ Ошибка тестовой выкладки: ${e.message}`, e);
          showToast(`Ошибка выкладки: ${e.message}`, 'error');
        }
        break;

      case '/scripts':
        try {
          const res = await api('/api/scripts');
          this.log('info', `Загружено скриптов: ${res.scripts?.length || 0}`, res.scripts?.slice(0, 5));
        } catch (e) {
          this.log('error', `❌ Ошибка загрузки скриптов: ${e.message}`, e);
        }
        break;

      case '/clear':
        this.clear();
        break;

      case '/copy':
        this.copyAll();
        break;

      default:
        this.log('warn', `Неизвестная команда "${clean}". Введите /help для справки.`);
        break;
    }
  },

  bindGlobalInterceptors() {
    window.addEventListener('error', (e) => {
      this.log('error', `[Window Error] ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.log('error', `[Promise Rejection] ${e.reason ? (e.reason.message || e.reason) : 'Unknown reason'}`);
    });

    const origError = console.error;
    console.error = (...args) => {
      origError.apply(console, args);
      try {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        this.log('error', `[console.error] ${msg}`);
      } catch(e) {}
    };

    const origWarn = console.warn;
    console.warn = (...args) => {
      origWarn.apply(console, args);
      try {
        const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
        this.log('warn', `[console.warn] ${msg}`);
      } catch(e) {}
    };

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) || e.key === 'F2') {
        const isKerry = State.currentUser && ((State.currentUser.username || '').toLowerCase() === 'kerryrbq' || State.currentUser.badge === 'ADMIN');
        if (isKerry) {
          e.preventDefault();
          const modal = document.getElementById('adminConsoleModal');
          if (modal && !modal.classList.contains('hidden')) {
            this.close();
          } else {
            this.open();
          }
        }
      }
    });
  },

  bindUIEvents() {
    const navBtn = document.getElementById('openAdminConsoleNavBtn');
    if (navBtn) navBtn.addEventListener('click', () => this.open());

    const fltBtn = document.getElementById('adminConsoleFloatingBtn');
    if (fltBtn) fltBtn.addEventListener('click', () => this.open());

    const closeBtn = document.getElementById('closeAdminConsoleBtn');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    const pingBtn = document.getElementById('consolePingBtn');
    if (pingBtn) pingBtn.addEventListener('click', () => this.executeCommand('/ping'));

    const reauthBtn = document.getElementById('consoleRefreshAuthBtn');
    if (reauthBtn) reauthBtn.addEventListener('click', () => this.executeCommand('/reauth'));

    const clearBtn = document.getElementById('consoleClearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => this.clear());

    const copyBtn = document.getElementById('consoleCopyBtn');
    if (copyBtn) copyBtn.addEventListener('click', () => this.copyAll());

    document.querySelectorAll('.console-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.console-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.activeFilter = tab.dataset.filter;
        this.renderAll();
      });
    });

    const cmdInput = document.getElementById('consoleCommandInput');
    const execBtn = document.getElementById('consoleExecBtn');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const val = cmdInput.value;
          cmdInput.value = '';
          this.executeCommand(val);
        }
      });
    }
    if (execBtn && cmdInput) {
      execBtn.addEventListener('click', () => {
        const val = cmdInput.value;
        cmdInput.value = '';
        this.executeCommand(val);
      });
    }
  }
};

window.DebugConsole = DebugConsole;

async function attemptAutoRefreshSession() {
  try {
    const username = State.currentUser?.username || localStorage.getItem('pskr_saved_username') || 'Kerryrbq';
    const userId = State.currentUser?.id;
    const res = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, userId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.token) {
        State.token = data.token;
        State.currentUser = data.user;
        localStorage.setItem('pskr_token', data.token);
        localStorage.setItem('pskr_auth_token', data.token);
        localStorage.setItem('pskr_user', JSON.stringify(data.user));
        if (data.user?.username) localStorage.setItem('pskr_saved_username', data.user.username);
        setCookie('pskr_token', data.token, 365);
        renderUserNav(data.user);
        return true;
      }
    }
  } catch(e) {
    console.warn('Auto-refresh session failed:', e);
  }
  return false;
}

// ============================================================================
// API HELPER
// ============================================================================

async function api(url, options = {}, isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (State.token) {
    headers['Authorization'] = `Bearer ${State.token}`;
  }

  const startTime = Date.now();
  const method = options.method || 'GET';
  
  let fetchUrl = url;
  if (method === 'GET') {
    const sep = fetchUrl.includes('?') ? '&' : '?';
    fetchUrl = `${fetchUrl}${sep}_t=${Date.now()}`;
  }

  DebugConsole.log('api', `🚀 [${method}] ${fetchUrl}`, { headers, body: options.body });

  try {
    const res = await fetch(fetchUrl, {
      ...options,
      headers,
      credentials: 'include',
      cache: 'no-store'
    });
    const duration = Date.now() - startTime;
    let data;
    try {
      data = await res.json();
    } catch(jsonErr) {
      data = { error: 'Неверный ответ JSON от сервера' };
    }

    if (!res.ok) {
      const errMsg = data.error || `HTTP ${res.status}: Ошибка сервера`;
      DebugConsole.log('error', `❌ [${method}] ${url} (${res.status} in ${duration}ms): ${errMsg}`, { status: res.status, response: data });

      // Auto-heal 401 if user is logged in as Kerryrbq or cached user
      if (res.status === 401 && !isRetry && State.currentUser) {
        DebugConsole.log('auth', `⚠️ 401 Unauthorized detected. Attempting auto-recovery for ${State.currentUser.username}...`);
        const refreshed = await attemptAutoRefreshSession();
        if (refreshed) {
          DebugConsole.log('auth', `✅ Session auto-refreshed successfully! Retrying [${method}] ${url}...`);
          return await api(url, options, true);
        }
      }

      const err = new Error(errMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    DebugConsole.log('api', `✅ [${method}] ${url} (${res.status} in ${duration}ms)`, data);
    return data;
  } catch (err) {
    if (!err.logged) {
      DebugConsole.log('error', `💥 Request Failed [${method}] ${url}: ${err.message}`, err);
    }
    throw err;
  }
}

// Toast helper
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';

  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 250);
  }, 3400);
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Global Action Loading Overlay helpers
function showActionLoading({ title = 'Выполнение...', subtitle = 'Синхронизация с сервером...', icon = 'fa-solid fa-spinner fa-spin' } = {}) {
  const overlay = document.getElementById('actionLoadingOverlay');
  if (!overlay) return;
  const titleEl = document.getElementById('actionLoadingTitle');
  const subEl = document.getElementById('actionLoadingSubtitle');
  const iconEl = document.getElementById('actionLoadingIcon');
  if (titleEl) titleEl.textContent = title;
  if (subEl) subEl.textContent = subtitle;
  if (iconEl) iconEl.innerHTML = `<i class="${icon}"></i>`;
  overlay.classList.remove('hidden');
}

function updateActionLoading({ title, subtitle, icon } = {}) {
  if (title) {
    const titleEl = document.getElementById('actionLoadingTitle');
    if (titleEl) titleEl.textContent = title;
  }
  if (subtitle) {
    const subEl = document.getElementById('actionLoadingSubtitle');
    if (subEl) subEl.textContent = subtitle;
  }
  if (icon) {
    const iconEl = document.getElementById('actionLoadingIcon');
    if (iconEl) iconEl.innerHTML = `<i class="${icon}"></i>`;
  }
}

function hideActionLoading(delayMs = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      const overlay = document.getElementById('actionLoadingOverlay');
      if (overlay) overlay.classList.add('hidden');
      resolve();
    }, delayMs);
  });
}

// Syntax formatting per line (for unified row alignment)
function highlightLuaLine(line) {
  let escaped = escapeHtml(line);
  const commentMatch = escaped.match(/(--.*)$/);
  let commentPart = '';
  if (commentMatch) {
    commentPart = `<span class="tok-comment">${commentMatch[1]}</span>`;
    escaped = escaped.substring(0, commentMatch.index);
  }
  escaped = escaped.replace(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, match => `<span class="tok-string">${match}</span>`);
  const keywords = ['local', 'function', 'end', 'if', 'then', 'else', 'elseif', 'return', 'for', 'while', 'do', 'in', 'and', 'or', 'not', 'true', 'false', 'nil'];
  escaped = escaped.replace(new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'), '<span class="tok-keyword">$1</span>');
  const builtins = ['game', 'workspace', 'script', 'Players', 'LocalPlayer', 'Humanoid', 'Vector3', 'CFrame', 'Instance', 'Drawing', 'task', 'print', 'warn', 'wait', 'spawn', 'delay', 'Color3', 'UDim2'];
  escaped = escaped.replace(new RegExp(`\\b(${builtins.join('|')})\\b`, 'g'), '<span class="tok-builtin">$1</span>');
  escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span class="tok-number">$1</span>');
  return (escaped + commentPart);
}

function highlightTxtLine(line) {
  let escaped = escapeHtml(line);
  if (/^\s*(#|\/\/)/.test(escaped)) return `<span class="tok-comment">${escaped}</span>`;
  if (/^\s*\[.*\]\s*$/.test(escaped)) return `<span class="tok-keyword">${escaped}</span>`;
  if (escaped.includes('=')) {
    const parts = escaped.split('=');
    return `<span class="tok-builtin">${parts[0]}</span>=<span class="tok-string">${parts.slice(1).join('=')}</span>`;
  }
  return escaped;
}

// ============================================================================
// AUTHENTICATION & SESSION
// ============================================================================

async function checkAuthSession() {
  // 0. Transfer token from URL hash or query if present (from start.bat or launcher)
  const urlToken = extractAuthTokenFromUrl();
  if (urlToken) {
    State.token = urlToken;
    localStorage.setItem('pskr_token', urlToken);
    localStorage.setItem('pskr_auth_token', urlToken);
    setCookie('pskr_token', urlToken, 365);
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) {}
  }

  // 1. Immediately render cached user from localStorage (zero delay on reload)
  const cachedUserStr = localStorage.getItem('pskr_user');
  if (cachedUserStr) {
    try {
      const cached = JSON.parse(cachedUserStr);
      State.currentUser = cached;
      renderUserNav(cached, false);
    } catch (e) {}
  }

  // 2. If token is missing, attempt auto-restore from server (via cookie, localhost, or IP session)
  if (!State.token) {
    try {
      const restoreRes = await fetch('/api/auth/session-restore', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (restoreRes.ok) {
        const restoreData = await restoreRes.json();
        if (restoreData && restoreData.token && restoreData.user) {
          State.token = restoreData.token;
          State.currentUser = restoreData.user;
          localStorage.setItem('pskr_token', restoreData.token);
          localStorage.setItem('pskr_auth_token', restoreData.token);
          localStorage.setItem('pskr_user', JSON.stringify(restoreData.user));
          if (restoreData.user.username) localStorage.setItem('pskr_saved_username', restoreData.user.username);
          setCookie('pskr_token', restoreData.token, 365);
          renderUserNav(restoreData.user, true);
          DebugConsole.log('auth', `Session auto-restored for ${restoreData.user.username}`);
          return;
        }
      }
    } catch (e) {
      DebugConsole.log('warn', `Session restore attempt error: ${e.message}`);
    }
  }

  // 3. If token is legacy non-HMAC token, auto-upgrade/refresh it
  if (State.currentUser && State.token && !State.token.includes('.')) {
    DebugConsole.log('auth', `Upgrading session token for ${State.currentUser.username}...`);
    await attemptAutoRefreshSession();
  }

  if (!State.token) {
    State.currentUser = null;
    renderUserNav(null, false);
    return;
  }

  // 4. Validate token with /api/auth/me
  try {
    const data = await api('/api/auth/me');
    if (data && data.user) {
      State.currentUser = data.user;
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
      if (data.user.username) localStorage.setItem('pskr_saved_username', data.user.username);
      setCookie('pskr_token', State.token, 365);
      renderUserNav(data.user, true);
      DebugConsole.log('auth', `Session verified: ${data.user.username} [${data.user.badge || 'MEMBER'}]`);
    } else {
      const refreshed = await attemptAutoRefreshSession();
      if (refreshed) {
        renderUserNav(State.currentUser, true);
      } else {
        State.currentUser = null;
        State.token = null;
        localStorage.removeItem('pskr_token');
        localStorage.removeItem('pskr_auth_token');
        localStorage.removeItem('pskr_user');
        deleteCookie('pskr_token');
        renderUserNav(null, false);
      }
    }
  } catch (err) {
    DebugConsole.log('warn', `Session check warning: ${err.message}`);
    if (err && err.status === 401) {
      const refreshed = await attemptAutoRefreshSession();
      if (refreshed) {
        renderUserNav(State.currentUser, true);
      } else {
        logoutUser(false);
      }
    }
  }
}

function renderUserNav(user, fetchBgData = true) {
  const guestWrap = document.getElementById('authGuestWrap');
  const userPill = document.getElementById('openProfileBtn');
  const notifBellWrap = document.getElementById('notifBellWrap');
  const modQueueBtn = document.getElementById('openModQueueBtn');
  const consoleNavBtn = document.getElementById('openAdminConsoleNavBtn');
  const consoleFltBtn = document.getElementById('adminConsoleFloatingBtn');

  if (user) {
    user.isModerator = isUserModerator(user);
    guestWrap.classList.add('hidden');
    userPill.classList.remove('hidden');
    const navAvatarEl = document.getElementById('navUserAvatar');
    if (navAvatarEl) {
      navAvatarEl.src = getAvatarSrc(user.avatar);
      navAvatarEl.onerror = function() { this.src = DEFAULT_AVATARS[0]; };
    }
    document.getElementById('navUserName').textContent = user.username;
    
    const isKerryAdmin = user.isModerator;

    const badgeEl = document.getElementById('navUserBadge');
    if (isKerryAdmin) {
      badgeEl.className = 'user-pill-badge admin-badge';
      badgeEl.innerHTML = '<i class="fa-solid fa-shield-halved"></i> ADMIN';
    } else {
      badgeEl.className = 'user-pill-badge';
      badgeEl.textContent = user.badge || 'MEMBER';
    }

    // Kerryrbq Moderation Queue Button
    if (modQueueBtn) {
      if (isKerryAdmin) {
        modQueueBtn.classList.remove('hidden');
        if (fetchBgData) updateModerationQueueCount();
      } else {
        modQueueBtn.classList.add('hidden');
      }
    }

    // Kerryrbq HUD Console Trigger
    if (consoleNavBtn) {
      if (isKerryAdmin) consoleNavBtn.classList.remove('hidden');
      else consoleNavBtn.classList.add('hidden');
    }
    if (consoleFltBtn) {
      if (isKerryAdmin) consoleFltBtn.classList.remove('hidden');
      else consoleFltBtn.classList.add('hidden');
    }

    if (notifBellWrap) {
      notifBellWrap.classList.remove('hidden');
      if (fetchBgData) loadNotifications();
    }
  } else {
    guestWrap.classList.remove('hidden');
    userPill.classList.add('hidden');
    if (notifBellWrap) notifBellWrap.classList.add('hidden');
    if (modQueueBtn) modQueueBtn.classList.add('hidden');
    if (consoleNavBtn) consoleNavBtn.classList.add('hidden');
    if (consoleFltBtn) consoleFltBtn.classList.add('hidden');
  }
  DebugConsole.updateCounts();
}

// Notifications handling
async function loadNotifications() {
  if (!State.currentUser) return;
  try {
    const data = await api('/api/notifications');
    const notifs = data.notifications || [];
    const unreadCount = data.unreadCount || 0;
    
    const badge = document.getElementById('notifBadge');
    const bellBtn = document.getElementById('notifBellBtn');
    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.classList.remove('hidden');
        if (bellBtn) bellBtn.classList.add('has-unread');
      } else {
        badge.textContent = '0';
        badge.classList.add('hidden');
        if (bellBtn) bellBtn.classList.remove('has-unread');
      }
    }

    const list = document.getElementById('notifList');
    if (!list) return;

    if (notifs.length === 0) {
      list.innerHTML = '<div class="notif-empty"><i class="fa-regular fa-bell-slash" style="font-size: 1.5rem; margin-bottom: 8px; display: block; opacity: 0.4;"></i>Нет новых уведомлений</div>';
      return;
    }

    list.innerHTML = notifs.map(n => {
      let icon = '🔔';
      if (n.status === 'verified') icon = '✅';
      if (n.status === 'rejected') icon = '❌';
      if (n.status === 'pending') icon = '⏳';

      return `
        <div class="notif-item ${!n.isRead ? 'unread' : ''}" data-script-id="${n.scriptId || ''}" data-status="${n.status || ''}">
          <div class="notif-item-title">
            <span>${icon} ${escapeHtml(n.title)}</span>
            <span class="notif-item-time">${formatRelativeTime(n.createdAt)}</span>
          </div>
          <div class="notif-item-msg">${escapeHtml(n.message)}</div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async () => {
        const scriptId = item.dataset.scriptId;
        const status = item.dataset.status;
        document.getElementById('notifPopover').classList.add('hidden');

        // If it's a pending script and current user is moderator, open moderation queue!
        if (status === 'pending' && isUserModerator(State.currentUser)) {
          openModerationQueueModal();
          return;
        }

        if (scriptId) {
          try {
            await openScriptDetail(scriptId);
          } catch (err) {
            showToast('Этот скрипт был удален или перемещен', 'info');
            loadNotifications();
          }
        }
      });
    });
  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
  }
}

async function handleMarkAllNotificationsRead() {
  try {
    await api('/api/notifications/read-all', { method: 'POST' });
    const badge = document.getElementById('notifBadge');
    if (badge) badge.classList.add('hidden');
    loadNotifications();
    showToast('Все уведомления прочитаны', 'info');
  } catch (err) {
    console.warn(err);
  }
}

async function logoutUser(showNotification = true) {
  try {
    if (State.token) {
      await api('/api/auth/logout', { method: 'POST' });
    }
  } catch (e) {}
  State.token = null;
  State.currentUser = null;
  localStorage.removeItem('pskr_token');
  localStorage.removeItem('pskr_auth_token');
  localStorage.removeItem('pskr_user');
  deleteCookie('pskr_token');
  renderUserNav(null);
  if (showNotification) {
    showToast('Вы вышли из аккаунта', 'info');
  }
  loadScriptsFeed();
}

// Auth Modal Handlers
function openAuthModal(mode = 'login') {
  const modal = document.getElementById('authModal');
  const tabLogin = document.getElementById('tabLoginBtn');
  const tabReg = document.getElementById('tabRegisterBtn');
  const formLogin = document.getElementById('loginForm');
  const formReg = document.getElementById('registerForm');
  const modalTitle = document.getElementById('authModalTitle');

  if (mode === 'register') {
    tabReg.classList.add('active');
    tabLogin.classList.remove('active');
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
    modalTitle.textContent = 'Создание аккаунта';
  } else {
    tabLogin.classList.add('active');
    tabReg.classList.remove('active');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
    modalTitle.textContent = 'Вход в аккаунт';

    // Autofill saved username if available
    const savedUser = localStorage.getItem('pskr_saved_username');
    const uInput = document.getElementById('loginUsernameInput');
    if (savedUser && uInput && !uInput.value) {
      uInput.value = savedUser;
    }
  }

  renderRegisterAvatars();
  modal.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function renderRegisterAvatars() {
  const container = document.getElementById('registerAvatarPresets');
  const previewImg = document.getElementById('regAvatarPreview');
  const fileInput = document.getElementById('registerAvatarFileInput');

  if (!State.selectedRegisterAvatar) {
    State.selectedRegisterAvatar = DEFAULT_AVATARS[0];
  }
  if (previewImg) {
    previewImg.src = State.selectedRegisterAvatar;
  }

  // Device file input for registration avatar
  if (fileInput && !fileInput.dataset.bound) {
    fileInput.dataset.bound = 'true';
    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file || !file.type.startsWith('image/')) {
        showToast('Выберите файл изображения (PNG, JPG, WebP)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        State.selectedRegisterAvatar = e.target.result;
        if (previewImg) previewImg.src = e.target.result;
        container.querySelectorAll('.avatar-preset-item').forEach(i => i.classList.remove('active'));
        showToast('Фото выбрано с вашего устройства!', 'success');
      };
      reader.readAsDataURL(file);
    });
  }

  container.innerHTML = DEFAULT_AVATARS.map(url => `
    <img src="${url}" alt="Avatar" class="avatar-preset-item ${url === State.selectedRegisterAvatar ? 'active' : ''}" data-url="${url}">
  `).join('');

  container.querySelectorAll('.avatar-preset-item').forEach(img => {
    img.addEventListener('click', () => {
      container.querySelectorAll('.avatar-preset-item').forEach(i => i.classList.remove('active'));
      img.classList.add('active');
      State.selectedRegisterAvatar = img.dataset.url;
      if (previewImg) previewImg.src = img.dataset.url;
    });
  });
}

// ============================================================================
// DATA FETCHING & RENDERING (FEED & STATS)
// ============================================================================

async function updatePlatformStats() {
  try {
    const stats = await api('/api/stats');
    document.getElementById('totalScriptsCount').textContent = (stats.totalScripts || 0).toLocaleString();
    document.getElementById('totalViewsCount').textContent = (stats.totalViews || 0).toLocaleString();
    document.getElementById('totalLikesCount').textContent = (stats.totalLikes || 0).toLocaleString();
    document.getElementById('activeAuthorsCount').textContent = (stats.totalUsers || 0).toLocaleString();
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

function renderCardStatusBadge(status) {
  if (status === 'verified') {
    return `<span class="script-status-badge verified" title="Скрипт проверен на запуск"><i class="fa-solid fa-circle-check"></i> Проверено на запуск</span>`;
  } else if (status === 'rejected') {
    return `<span class="script-status-badge rejected" title="Скрипт отклонен"><i class="fa-solid fa-circle-xmark"></i> Отклонено</span>`;
  } else {
    return `<span class="script-status-badge pending" title="Скрипт еще не проверен на запуск"><i class="fa-solid fa-clock"></i> Не проверено</span>`;
  }
}

async function loadScriptsFeed() {
  const grid = document.getElementById('scriptsGrid');
  const counter = document.getElementById('resultsCounter') || document.getElementById('scriptsCounterText');
  const emptyState = document.getElementById('emptyState');

  try {
    const params = new URLSearchParams();
    if (State.activeCategory !== 'all') params.set('category', State.activeCategory);
    if (State.searchQuery.trim()) params.set('search', State.searchQuery.trim());
    params.set('sort', State.sortBy);

    const data = await api(`/api/scripts?${params.toString()}`);
    let scripts = (data.scripts || []).filter(s => !isScriptDeletedLocally(s.id));

    // Merge with local published scripts to prevent loss across serverless container restarts
    const localScripts = getLocalPublishedScripts();
    const existingIds = new Set(scripts.map(s => s.id));
    localScripts.forEach(ls => {
      if (!existingIds.has(ls.id) && !isScriptDeletedLocally(ls.id)) {
        scripts.unshift(ls);
        existingIds.add(ls.id);
      }
    });

    if (!State.scriptsCache) State.scriptsCache = new Map();
    scripts.forEach(s => State.scriptsCache.set(s.id, s));

    if (counter) {
      counter.textContent = `Показано ${scripts.length} скриптов`;
    }

    if (scripts.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = '';

    scripts.forEach(script => {
      const card = document.createElement('article');
      card.className = 'script-card';
      card.dataset.id = script.id;

      const canManage = canUserManageScript(script, State.currentUser);
      const coverSrc = getCardCover(script);
      const avatarSrc = getAvatarSrc(script.authorAvatar);
      const statusBadgeHtml = renderCardStatusBadge(script.status);

      const tagsHtml = (script.tags || []).slice(0, 3).map(tag => 
        `<span class="tag-pill">#${escapeHtml(tag)}</span>`
      ).join('');

      card.innerHTML = `
        <div class="script-card-thumb-wrap">
          <img src="${coverSrc}" alt="${escapeHtml(script.title)}" class="script-card-thumb" loading="lazy" onerror="this.onerror=null; this.src=window.PRESET_COVERS['cyber-hub'];">
          ${statusBadgeHtml}
          <span class="script-thumb-badge">${(script.extension || 'lua').toUpperCase()}</span>
          ${canManage ? `
            <button class="script-thumb-edit-btn" title="Редактировать мой скрипт" data-action="edit-script" data-id="${script.id}">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
          ` : ''}
          <button class="script-thumb-quick-copy" title="Быстро скопировать код" data-action="quick-copy" data-id="${script.id}">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>

        <div class="script-card-body">
          <div class="script-card-author-row">
            <div class="card-author clickable-author" data-author-id="${script.authorId || ''}" title="Перейти в профиль ${escapeHtml(script.author)}">
              <img src="${avatarSrc}" alt="${escapeHtml(script.author)}" class="card-author-avatar clickable-author-avatar" data-author-id="${script.authorId || ''}" onerror="this.onerror=null; this.src='${DEFAULT_AVATARS[0]}';">
              <span class="card-author-name" data-author-id="${script.authorId || ''}">${escapeHtml(script.author)}</span>
            </div>
            <span class="card-post-date">${formatRelativeTime(script.createdAt)}</span>
          </div>

          <h3 class="script-card-title">${escapeHtml(script.title)}</h3>
          <p class="script-card-desc">${escapeHtml(script.description)}</p>

          <div class="script-card-tags">
            ${tagsHtml}
          </div>

          <div class="script-card-footer">
            <div class="card-engagement-stats">
              <span class="card-stat card-rating-stat" title="Рейтинг: ${(typeof script.rating === 'number' ? script.rating : 5).toFixed(1)} из 5">
                <i class="fa-solid fa-star"></i> ${(typeof script.rating === 'number' ? script.rating : 5).toFixed(1)}
                <span class="stat-count">(${script.ratingsCount || 0})</span>
              </span>
              <button class="card-like-btn ${script.isLiked ? 'liked' : ''}" data-action="toggle-like" data-id="${script.id}" title="${script.isLiked ? 'Убрать лайк' : 'Поставить лайк'}">
                <i class="${script.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                <span>${script.likesCount || 0}</span>
              </button>
              <span class="card-stat" title="Реальные просмотры">
                <i class="fa-regular fa-eye"></i> ${script.views || 0}
              </span>
              <span class="card-stat" title="Комментарии">
                <i class="fa-regular fa-comment"></i> ${script.commentsCount || 0}
              </span>
            </div>
            ${canManage ? `
              <button class="card-author-edit-btn" data-action="edit-script" data-id="${script.id}" title="Редактировать скрипт">
                <i class="fa-solid fa-pen-to-square"></i> Редактировать
              </button>
            ` : ''}
            <span class="card-open-btn">Открыть <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        const authorHit = e.target.closest('.card-author, .clickable-author, .clickable-author-avatar');
        if (authorHit && authorHit.dataset.authorId) {
          e.stopPropagation();
          openPublicProfile(authorHit.dataset.authorId);
          return;
        }

        const btn = e.target.closest('button');
        if (btn) {
          const action = btn.dataset.action;
          if (action === 'edit-script') {
            e.stopPropagation();
            openEditScriptModal(script);
            return;
          }
          if (action === 'quick-copy') {
            e.stopPropagation();
            copyCode(script, script.title);
            return;
          }
          if (action === 'toggle-like') {
            e.stopPropagation();
            handleLikeScript(script.id);
            return;
          }
        }
        openScriptDetail(script.id, script);
      });

      grid.appendChild(card);
    });

  } catch (err) {
    console.error('Error fetching scripts:', err);
    showToast('Ошибка загрузки скриптов с сервера', 'error');
  }
}

function formatRelativeTime(ts) {
  if (!ts) return 'Недавно';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'Только что';
  if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
  return `${Math.floor(diff / 86400)} дн. назад`;
}

// ============================================================================
// SCRIPT DETAIL MODAL & MODERATION
// ============================================================================

function markScriptDeletedLocally(scriptId) {
  if (!scriptId) return;
  try {
    const sList = JSON.parse(sessionStorage.getItem('pskr_deleted_scripts') || '[]');
    if (!sList.includes(scriptId)) sList.push(scriptId);
    sessionStorage.setItem('pskr_deleted_scripts', JSON.stringify(sList));
  } catch(e) {}
  try {
    const lList = JSON.parse(localStorage.getItem('pskr_deleted_scripts') || '[]');
    if (!lList.includes(scriptId)) lList.push(scriptId);
    localStorage.setItem('pskr_deleted_scripts', JSON.stringify(lList.slice(-200)));
  } catch(e) {}
}

function isScriptDeletedLocally(scriptId) {
  if (!scriptId) return false;
  try {
    const sList = JSON.parse(sessionStorage.getItem('pskr_deleted_scripts') || '[]');
    if (sList.includes(scriptId)) return true;
  } catch(e) {}
  try {
    const lList = JSON.parse(localStorage.getItem('pskr_deleted_scripts') || '[]');
    if (lList.includes(scriptId)) return true;
  } catch(e) {}
  return false;
}

function updateLocalPublishedScriptStatus(scriptId, status) {
  if (!scriptId) return;
  try {
    const list = JSON.parse(localStorage.getItem('pskr_local_scripts') || '[]');
    list.forEach(s => {
      if (s.id === scriptId) {
        s.status = status;
      }
    });
    localStorage.setItem('pskr_local_scripts', JSON.stringify(list));
  } catch(e) {}
}

function saveLocalPublishedScript(script) {
  if (!script || !script.id) return;
  try {
    const list = JSON.parse(localStorage.getItem('pskr_local_scripts') || '[]');
    const filtered = list.filter(s => s.id !== script.id);
    filtered.unshift(script);
    localStorage.setItem('pskr_local_scripts', JSON.stringify(filtered.slice(0, 100)));
  } catch(e) {}
}

function getLocalPublishedScripts() {
  try {
    const raw = JSON.parse(localStorage.getItem('pskr_local_scripts') || '[]');
    return raw.filter(s => !isScriptDeletedLocally(s.id));
  } catch(e) {
    return [];
  }
}

function removeLocalPublishedScript(scriptId) {
  if (!scriptId) return;
  markScriptDeletedLocally(scriptId);
  try {
    const list = JSON.parse(localStorage.getItem('pskr_local_scripts') || '[]');
    const filtered = list.filter(s => s.id !== scriptId);
    localStorage.setItem('pskr_local_scripts', JSON.stringify(filtered));
  } catch(e) {}
}

function renderScriptDetailModal(script) {
  if (!script) return;
  State.activeModalScript = script;

  const modal = document.getElementById('scriptDetailModal');

  document.getElementById('detailLangBadge').textContent = (script.extension || 'lua').toUpperCase();
  document.getElementById('detailTitle').textContent = script.title;
  
  const authorAvatarEl = document.getElementById('detailAuthorAvatar');
  authorAvatarEl.src = getAvatarSrc(script.authorAvatar);
  authorAvatarEl.onerror = function() { this.src = DEFAULT_AVATARS[0]; };
  authorAvatarEl.dataset.authorId = script.authorId || '';
  authorAvatarEl.classList.add('clickable-author-avatar');
  authorAvatarEl.title = `Открыть профиль ${script.author}`;
  authorAvatarEl.onclick = () => {
    if (script.authorId) openPublicProfile(script.authorId);
  };

  const authorNameEl = document.getElementById('detailAuthorName');
  authorNameEl.textContent = script.author;
  authorNameEl.dataset.authorId = script.authorId || '';
  authorNameEl.classList.add('clickable-author');
  authorNameEl.title = `Открыть профиль ${script.author}`;
  authorNameEl.onclick = () => {
    if (script.authorId) openPublicProfile(script.authorId);
  };

  document.getElementById('detailDate').innerHTML = `<i class="fa-regular fa-clock"></i> ${formatRelativeTime(script.createdAt)}`;

  // Status Pill
  const statusPill = document.getElementById('detailStatusPill');
  const currentStatus = script.status || 'pending';

  if (currentStatus === 'verified') {
    statusPill.className = 'detail-status-pill verified';
    statusPill.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Проверено на запуск</span>';
  } else if (currentStatus === 'rejected') {
    statusPill.className = 'detail-status-pill rejected';
    statusPill.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> <span>Отклонено</span>';
  } else {
    statusPill.className = 'detail-status-pill pending';
    statusPill.innerHTML = '<i class="fa-solid fa-clock"></i> <span>Не проверено на запуск</span>';
  }

  // Moderator Control Panel (Kerryrbq / Admins)
  const modPanel = document.getElementById('moderatorActionPanel');
  if (isUserModerator(State.currentUser)) {
    modPanel.classList.remove('hidden');
    const modStatusEl = document.getElementById('modCurrentStatus');
    const statusMap = {
      verified: '🟢 Проверено на запуск',
      pending: '🟡 Не проверено на запуск',
      rejected: '🔴 Отклонено'
    };
    modStatusEl.textContent = `Статус: ${statusMap[currentStatus] || currentStatus}`;
  } else {
    modPanel.classList.add('hidden');
  }

  // Author Actions Bar (Author or Kerryrbq)
  const canManage = canUserManageScript(script, State.currentUser);
  const authorActionsBar = document.getElementById('detailAuthorActionsBar');
  if (authorActionsBar) {
    if (canManage) {
      authorActionsBar.classList.remove('hidden');
      const editBtn = document.getElementById('detailEditBtn');
      if (editBtn) {
        editBtn.onclick = () => openEditScriptModal(script);
      }
      const deleteBtn = document.getElementById('detailAuthorDeleteBtn');
      if (deleteBtn) {
        deleteBtn.onclick = () => handleDeleteScript(script.id);
      }
    } else {
      authorActionsBar.classList.add('hidden');
    }
  }

  // Detail Modal Header Edit Button
  const headerEditBtn = document.getElementById('detailHeaderEditBtn');
  if (headerEditBtn) {
    if (canManage) {
      headerEditBtn.classList.remove('hidden');
      headerEditBtn.onclick = () => openEditScriptModal(script);
    } else {
      headerEditBtn.classList.add('hidden');
    }
  }

  // Code Viewer Toolbar Edit Button
  const codeEditBtn = document.getElementById('detailCodeEditBtn');
  if (codeEditBtn) {
    if (canManage) {
      codeEditBtn.classList.remove('hidden');
      codeEditBtn.onclick = () => openEditScriptModal(script);
    } else {
      codeEditBtn.classList.add('hidden');
    }
  }

  // Like button
  const likeBtn = document.getElementById('detailLikeBtn');
  likeBtn.className = `engagement-badge like-action-btn ${script.isLiked ? 'liked' : ''}`;
  likeBtn.querySelector('i').className = `${script.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`;
  document.getElementById('detailLikesCount').textContent = script.likesCount || 0;
  document.getElementById('detailViewsCount').textContent = script.views || 0;
  document.getElementById('detailCommentsCount').textContent = script.commentsCount || 0;
  document.getElementById('commentsCountHeading').textContent = script.commentsCount || 0;

  // Script Rating & Interactive Stars Bar
  const ratingVal = typeof script.rating === 'number' ? script.rating : 5.0;
  const ratingsCount = script.ratingsCount || 0;
  const userRating = script.userRating || 0;

  const ratingValEl = document.getElementById('detailRatingVal');
  if (ratingValEl) ratingValEl.textContent = ratingVal.toFixed(1);

  const ratingCountEl = document.getElementById('detailRatingCountVal');
  if (ratingCountEl) ratingCountEl.textContent = `(${ratingsCount})`;

  const barScoreEl = document.getElementById('barRatingScore');
  if (barScoreEl) barScoreEl.textContent = `${ratingVal.toFixed(1)} ★`;

  const barVotesEl = document.getElementById('barRatingVotes');
  if (barVotesEl) barVotesEl.textContent = `(${ratingsCount} ${getRatingNoun(ratingsCount)})`;

  const voteTagEl = document.getElementById('userVoteStatusTag');
  if (voteTagEl) {
    if (userRating > 0) {
      voteTagEl.textContent = `Ваша оценка: ${userRating} ★`;
      voteTagEl.style.background = 'rgba(16, 185, 129, 0.2)';
      voteTagEl.style.color = '#34d399';
    } else {
      voteTagEl.textContent = 'Поставьте оценку';
      voteTagEl.style.background = 'rgba(251, 191, 36, 0.15)';
      voteTagEl.style.color = '#fde047';
    }
  }

  const starBtns = document.querySelectorAll('#scriptStarsSelector .script-star-btn');
  starBtns.forEach(btn => {
    const val = parseInt(btn.dataset.val, 10);
    if (val <= userRating) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Cover image
  const coverSrc = getCardCover(script);
  const coverTabBtn = document.getElementById('tabDetailCoverBtn');
  const coverImgEl = document.getElementById('detailCoverImage');
  if (coverImgEl) {
    coverImgEl.src = coverSrc;
    coverImgEl.onerror = function() { this.src = PRESET_COVERS['cyber-hub']; };
  }
  if (coverTabBtn) coverTabBtn.classList.remove('hidden');

  // Description & tags
  document.getElementById('detailDescriptionText').textContent = script.description;
  const tagsContainer = document.getElementById('detailTagsList');
  tagsContainer.innerHTML = (script.tags || []).map(t => `<span class="tag-pill">#${escapeHtml(t)}</span>`).join('');

  // Code & unified line numbers (table layout eliminates any line misalignment)
  const lines = (script.code || '').split('\n');
  document.getElementById('codeFileName').textContent = `script.${script.extension || 'lua'}`;
  document.getElementById('codeLinesCount').textContent = `${lines.length} строк`;

  // Update tab counters
  const codeTabCounter = document.getElementById('tabDetailCodeCount');
  if (codeTabCounter) codeTabCounter.textContent = `${lines.length} строк`;
  const commentsTabCounter = document.getElementById('tabDetailCommentsCount');
  if (commentsTabCounter) commentsTabCounter.textContent = `${script.commentsCount || 0}`;

  const isTxt = (script.extension === 'txt');
  const totalLines = lines.length;
  const detailBox = document.getElementById('detailCodeBox');

  if (totalLines > 1500) {
    const firstChunk = lines.slice(0, 800);
    const rowsHtml = firstChunk.map((line, idx) => {
      const lineNum = idx + 1;
      const highlighted = isTxt ? highlightTxtLine(line) : highlightLuaLine(line);
      return `<div class="code-line"><span class="code-line-num" data-line="${lineNum}">${lineNum}</span><span class="code-line-text">${highlighted || '&nbsp;'}</span></div>`;
    }).join('');

    detailBox.innerHTML = rowsHtml + `
      <div id="loadMoreCodeBtnWrap" style="padding: 16px; text-align: center; background: rgba(0,0,0,0.4); border-top: 1px solid var(--border-color);">
        <button type="button" id="loadRemainingCodeBtn" class="btn-primary" style="padding: 8px 18px; font-size: 0.85rem;">
          <i class="fa-solid fa-angles-down"></i> Показать весь код (еще ${totalLines - 800} строк)
        </button>
      </div>
    `;

    document.getElementById('loadRemainingCodeBtn')?.addEventListener('click', function() {
      this.disabled = true;
      this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Загрузка строк...';
      setTimeout(() => {
        const remainingHtml = lines.slice(800).map((line, idx) => {
          const lineNum = idx + 801;
          const highlighted = isTxt ? highlightTxtLine(line) : highlightLuaLine(line);
          return `<div class="code-line"><span class="code-line-num" data-line="${lineNum}">${lineNum}</span><span class="code-line-text">${highlighted || '&nbsp;'}</span></div>`;
        }).join('');
        document.getElementById('loadMoreCodeBtnWrap')?.remove();
        detailBox.insertAdjacentHTML('beforeend', remainingHtml);
      }, 30);
    });
  } else {
    const rowsHtml = lines.map((line, idx) => {
      const lineNum = idx + 1;
      const highlighted = isTxt ? highlightTxtLine(line) : highlightLuaLine(line);
      return `<div class="code-line"><span class="code-line-num" data-line="${lineNum}">${lineNum}</span><span class="code-line-text">${highlighted || '&nbsp;'}</span></div>`;
    }).join('');
    detailBox.innerHTML = rowsHtml;
  }
  document.getElementById('copyBtnText').textContent = 'Скопировать код';

  // Switch to Code Tab by default (ensures code is immediately visible!)
  switchDetailTab('code');

  // Comments feed
  renderComments(script.comments || [], script.authorId);

  modal.classList.remove('hidden');
}

async function openScriptDetail(scriptId, fallbackScript = null) {
  if (!scriptId || isScriptDeletedLocally(scriptId)) {
    showToast('Скрипт был удален', 'info');
    return;
  }
  // 1. Check fallback passed in, then memory cache, then localStorage
  let script = fallbackScript;
  if (!script && State.scriptsCache) {
    script = State.scriptsCache.get(scriptId);
  }
  if (!script) {
    const localList = getLocalPublishedScripts();
    script = localList.find(s => s.id === scriptId);
  }

  // 2. Render cached data immediately (zero delay, zero 404 freeze)
  if (script) {
    renderScriptDetailModal(script);
  }

  // 3. Revalidate in background from server
  try {
    const data = await api(`/api/scripts/${scriptId}`);
    if (data && data.script) {
      if (!State.scriptsCache) State.scriptsCache = new Map();
      State.scriptsCache.set(data.script.id, data.script);
      saveLocalPublishedScript(data.script);
      renderScriptDetailModal(data.script);
    }
    updatePlatformStats();
  } catch (err) {
    if (!script) {
      showToast('Скрипт не найден или был удален', 'error');
      DebugConsole.log('error', `Script ${scriptId} not found on server.`, err);
    } else {
      DebugConsole.log('info', `Displaying cached local data for ${scriptId}.`);
    }
  }
}

function closeDetailModal() {
  document.getElementById('scriptDetailModal').classList.add('hidden');
  State.activeModalScript = null;
  loadScriptsFeed();
}

function switchDetailTab(tabName) {
  const tabCodeBtn = document.getElementById('tabDetailCodeBtn');
  const tabCommentsBtn = document.getElementById('tabDetailCommentsBtn');
  const tabCoverBtn = document.getElementById('tabDetailCoverBtn');

  const secCode = document.getElementById('detailSectionCode');
  const secComments = document.getElementById('detailSectionComments');
  const secCover = document.getElementById('detailSectionCover');

  if (tabCodeBtn) tabCodeBtn.classList.remove('active');
  if (tabCommentsBtn) tabCommentsBtn.classList.remove('active');
  if (tabCoverBtn) tabCoverBtn.classList.remove('active');

  if (secCode) secCode.classList.add('hidden');
  if (secComments) secComments.classList.add('hidden');
  if (secCover) secCover.classList.add('hidden');

  if (tabName === 'comments') {
    if (tabCommentsBtn) tabCommentsBtn.classList.add('active');
    if (secComments) secComments.classList.remove('hidden');
  } else if (tabName === 'cover') {
    if (tabCoverBtn) tabCoverBtn.classList.add('active');
    if (secCover) secCover.classList.remove('hidden');
  } else {
    // Default to Code section
    if (tabCodeBtn) tabCodeBtn.classList.add('active');
    if (secCode) secCode.classList.remove('hidden');
  }
}

let _isModerating = false;
async function handleModerateScript(status, targetScriptId = null) {
  if (_isModerating) return;

  if (!isUserModerator(State.currentUser)) {
    showToast('Войдите в аккаунт Kerryrbq (Администратор) для управления модерацией!', 'error');
    openAuthModal('login');
    return;
  }

  const scriptId = targetScriptId || (State.activeModalScript && State.activeModalScript.id);
  if (!scriptId) return;

  let note = '';
  if (status === 'rejected') {
    const reason = prompt('Укажите причину отказа / отклонения (будет отправлена автору в уведомлении):', 'Скрипт не работает или содержит ошибки при запуске');
    if (reason === null) return; // Cancelled
    note = reason.trim();
  }

  _isModerating = true;

  const statusName = status === 'verified' ? '«Проверено на запуск»' : (status === 'rejected' ? '«Отклонено»' : '«Не проверено»');
  const statusIcon = status === 'verified' ? 'fa-solid fa-circle-check' : (status === 'rejected' ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-clock');

  showActionLoading({
    title: 'Применение статуса...',
    subtitle: `Устанавливаем статус ${statusName} для скрипта...`,
    icon: 'fa-solid fa-shield-halved fa-fade'
  });

  // Disable modal buttons and queue buttons
  const modalBtns = document.querySelectorAll('.btn-mod');
  modalBtns.forEach(b => { b.disabled = true; b.classList.add('is-busy'); });
  const queueCard = document.querySelector(`.mod-queue-card[data-script-id="${scriptId}"]`);
  if (queueCard) {
    queueCard.querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.add('is-busy'); });
  }

  try {
    const res = await api(`/api/scripts/${scriptId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status, note })
    });

    const updatedScript = (res && res.script) ? res.script : { id: scriptId, status };

    // 1. Update memory cache & local persistent storage
    if (!State.scriptsCache) State.scriptsCache = new Map();
    const existing = State.scriptsCache.get(scriptId) || {};
    const merged = { ...existing, ...updatedScript, status };
    State.scriptsCache.set(scriptId, merged);
    updateLocalPublishedScriptStatus(scriptId, status);
    saveLocalPublishedScript(merged);

    // 2. Update Detail Modal immediately
    if (State.activeModalScript && State.activeModalScript.id === scriptId) {
      State.activeModalScript = merged;
      renderScriptDetailModal(merged);
    }

    // 3. Update Moderation Queue DOM if verified or rejected
    if (status === 'verified' || status === 'rejected') {
      const qCard = document.querySelector(`.mod-queue-card[data-script-id="${scriptId}"]`);
      if (qCard) {
        qCard.style.transition = 'all 0.25s ease';
        qCard.style.opacity = '0';
        qCard.style.transform = 'scale(0.95)';
        setTimeout(() => {
          qCard.remove();
          const remainingCards = document.querySelectorAll('#modQueueList .mod-queue-card').length;
          const qBadge = document.getElementById('modQueueBadge');
          const qHeader = document.getElementById('modQueueModalCount');
          if (qBadge) {
            qBadge.textContent = remainingCards;
            if (remainingCards === 0) qBadge.classList.add('hidden');
          }
          if (qHeader) {
            qHeader.textContent = `${remainingCards} ${remainingCards === 1 ? 'скрипт ожидает' : 'скриптов ожидают'} проверки`;
          }
          if (remainingCards === 0) {
            const emptyState = document.getElementById('emptyModQueue');
            if (emptyState) emptyState.classList.remove('hidden');
          }
        }, 250);
      }
    }

    // 4. Update Main feed card badges immediately
    document.querySelectorAll(`.script-card[data-id="${scriptId}"]`).forEach(card => {
      const badgeWrap = card.querySelector('.script-status-badge');
      if (badgeWrap) {
        badgeWrap.outerHTML = renderCardStatusBadge(status);
      }
    });

    updateActionLoading({
      title: 'Статус успешно применен!',
      subtitle: `Статус ${statusName} сохранен на сервере.`,
      icon: statusIcon
    });

    await hideActionLoading(350);

    const label = status === 'verified' ? 'Проверено на запуск 🟢' : (status === 'rejected' ? 'Отклонено 🔴' : 'Не проверено 🟡');
    showToast(`Статус скрипта успешно сохранен: ${label}`, status === 'verified' ? 'success' : (status === 'rejected' ? 'error' : 'info'));

    // Light background sync without blocking or freezing UI
    updateModerationQueueCount();
  } catch (err) {
    await hideActionLoading();
    console.error('Moderation error:', err);
    if (err.status === 401 || err.status === 403) {
      showToast('Ошибка прав: войдите в аккаунт Kerryrbq (Администратор)', 'error');
      openAuthModal('login');
    } else {
      showToast(err.message || 'Ошибка сервера при сохранении модерации', 'error');
    }
  } finally {
    _isModerating = false;
    modalBtns.forEach(b => { b.disabled = false; b.classList.remove('is-busy'); });
    if (queueCard) {
      queueCard.querySelectorAll('button').forEach(b => { b.disabled = false; b.classList.remove('is-busy'); });
    }
  }
}

// Delete script permanently (Kerryrbq / Admin or Author)
let _isDeletingScript = false;
async function handleDeleteScript(scriptId = null) {
  if (_isDeletingScript) return;

  const targetId = scriptId || (State.activeModalScript && State.activeModalScript.id);
  if (!targetId) return;

  let script = (State.activeModalScript && State.activeModalScript.id === targetId) ? State.activeModalScript : null;
  if (!script && State.scriptsCache) script = State.scriptsCache.get(targetId);

  const canManage = canUserManageScript(script, State.currentUser);
  if (!canManage && !isUserModerator(State.currentUser)) {
    showToast('У вас нет прав на удаление этого скрипта', 'error');
    return;
  }

  if (!confirm('Вы уверены, что хотите НАВСЕГДА удалить этот скрипт? Это действие нельзя отменить.')) {
    return;
  }

  _isDeletingScript = true;

  showActionLoading({
    title: 'Удаление скрипта...',
    subtitle: 'Удаляем скрипт с сервера и очищаем данные...',
    icon: 'fa-solid fa-trash-can fa-fade'
  });

  const allDelButtons = document.querySelectorAll(`button[data-id="${targetId}"], .btn-mod-delete, #detailAuthorDeleteBtn, .mod-card-btn-delete`);
  allDelButtons.forEach(b => { b.disabled = true; b.classList.add('is-busy'); });

  try {
    // 1. Wait for server confirmation first
    await api(`/api/scripts/${targetId}`, {
      method: 'DELETE'
    });

    // 2. Mark deleted in persistent caches
    markScriptDeletedLocally(targetId);
    removeLocalPublishedScript(targetId);
    if (State.scriptsCache) {
      State.scriptsCache.delete(targetId);
    }

    // 3. Remove from DOM
    document.querySelectorAll(`[data-id="${targetId}"], [data-script-id="${targetId}"]`).forEach(el => {
      el.remove();
    });

    // Close detail modal if open for this script
    if (State.activeModalScript && State.activeModalScript.id === targetId) {
      document.getElementById('scriptDetailModal').classList.add('hidden');
      State.activeModalScript = null;
    }

    // Update queue counts if in queue
    const qCards = document.querySelectorAll('#modQueueList .mod-queue-card');
    const remainingQueue = qCards.length;
    const qBadge = document.getElementById('modQueueBadge');
    const qHeader = document.getElementById('modQueueModalCount');
    if (qBadge) {
      qBadge.textContent = remainingQueue;
      if (remainingQueue === 0) qBadge.classList.add('hidden');
    }
    if (qHeader) {
      qHeader.textContent = `${remainingQueue} скриптов ожидают проверки`;
    }
    if (remainingQueue === 0) {
      const emptyState = document.getElementById('emptyModQueue');
      if (emptyState) emptyState.classList.remove('hidden');
    }

    updateActionLoading({
      title: 'Скрипт успешно удален!',
      subtitle: 'Данные удалены, каталог обновлен.',
      icon: 'fa-solid fa-circle-check'
    });

    await hideActionLoading(350);
    showToast('Скрипт успешно удален с платформы 🗑️', 'success');

    // 4. Smoothly refresh feed
    await loadScriptsFeed();
    if (isUserModerator(State.currentUser)) {
      updateModerationQueueCount();
    }
    updatePlatformStats();
  } catch (err) {
    await hideActionLoading();
    if (err.message && (err.message.includes('not found') || err.message.includes('не найден') || err.message.includes('already removed'))) {
      markScriptDeletedLocally(targetId);
      removeLocalPublishedScript(targetId);
      if (State.scriptsCache) State.scriptsCache.delete(targetId);
      document.querySelectorAll(`[data-id="${targetId}"], [data-script-id="${targetId}"]`).forEach(el => el.remove());
      if (State.activeModalScript && State.activeModalScript.id === targetId) {
        document.getElementById('scriptDetailModal').classList.add('hidden');
        State.activeModalScript = null;
      }
      showToast('Скрипт уже был удален', 'info');
      await loadScriptsFeed();
    } else {
      console.error('Delete error:', err);
      showToast(err.message || 'Ошибка сервера при удалении скрипта', 'error');
    }
  } finally {
    _isDeletingScript = false;
    allDelButtons.forEach(b => { b.disabled = false; b.classList.remove('is-busy'); });
  }
}

// ============================================================================
// SCRIPT EDITING SUBSYSTEM (Author or Kerryrbq)
// ============================================================================

let _editOriginalCode = '';
let _editUploadedImageBase64 = null;

async function openEditScriptModal(scriptOrId) {
  let script = typeof scriptOrId === 'object' ? scriptOrId : null;
  const targetId = script ? script.id : scriptOrId;

  if (!targetId) return;

  // Fetch single script detail to ensure complete code is loaded
  try {
    const res = await api(`/api/scripts/${targetId}`);
    if (res && res.script) {
      script = res.script;
    }
  } catch (err) {
    if (!script) {
      showToast('Не удалось загрузить скрипт для редактирования', 'error');
      return;
    }
  }

  if (!canUserManageScript(script, State.currentUser)) {
    showToast('У вас нет прав на редактирование этого скрипта', 'error');
    return;
  }

  const modal = document.getElementById('editScriptModal');
  if (!modal) return;

  document.getElementById('editScriptId').value = script.id;
  document.getElementById('editScriptTitleInput').value = script.title || '';
  document.getElementById('editScriptCategorySelect').value = script.category || 'lua';
  document.getElementById('editScriptExtensionSelect').value = script.extension || 'lua';
  document.getElementById('editScriptCodeInput').value = script.code || '';
  document.getElementById('editScriptDescInput').value = script.description || '';
  document.getElementById('editScriptTagsInput').value = (script.tags || []).join(', ');

  _editOriginalCode = (script.code || '').trim();
  _editUploadedImageBase64 = null;

  // Setup dropzone preview with current cover
  const previewWrap = document.getElementById('editDropzonePreviewWrap');
  const previewImg = document.getElementById('editUploadedImagePreview');
  const promptWrap = document.getElementById('editDropzonePrompt');

  const currentCover = getCardCover(script);
  if (currentCover && previewImg && previewWrap && promptWrap) {
    previewImg.src = currentCover;
    previewWrap.classList.remove('hidden');
    promptWrap.classList.add('hidden');
  } else if (previewWrap && promptWrap) {
    previewWrap.classList.add('hidden');
    promptWrap.classList.remove('hidden');
  }

  const ind = document.getElementById('editCodeChangeIndicator');
  if (ind) {
    ind.className = 'code-change-indicator';
    ind.innerHTML = '<i class="fa-solid fa-check"></i> Код не изменен (без перемодерации)';
  }

  modal.classList.remove('hidden');
}

function closeEditScriptModal() {
  const modal = document.getElementById('editScriptModal');
  if (modal) modal.classList.add('hidden');
  _editUploadedImageBase64 = null;
}

async function handleEditScriptSubmit(e) {
  e.preventDefault();
  const scriptId = document.getElementById('editScriptId').value;
  if (!scriptId) return;

  const title = document.getElementById('editScriptTitleInput').value.trim();
  const category = document.getElementById('editScriptCategorySelect').value;
  const extension = document.getElementById('editScriptExtensionSelect').value;
  const code = document.getElementById('editScriptCodeInput').value.trim();
  const description = document.getElementById('editScriptDescInput').value.trim();
  const tags = document.getElementById('editScriptTagsInput').value;

  if (!title || !code) {
    showToast('Название и код скрипта обязательны', 'error');
    return;
  }

  const submitBtn = document.getElementById('saveScriptEditBtn');
  const origText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Сохранение...';

  showActionLoading({
    title: 'Сохранение изменений...',
    subtitle: 'Обновляем скрипт на сервере...',
    icon: 'fa-solid fa-floppy-disk fa-fade'
  });

  try {
    const payload = {
      title,
      category,
      extension,
      code,
      description,
      tags
    };
    if (_editUploadedImageBase64) {
      payload.imageBase64 = _editUploadedImageBase64;
    }

    const res = await api(`/api/scripts/${scriptId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    closeEditScriptModal();

    updateActionLoading({
      title: 'Изменения сохранены!',
      subtitle: 'Данные скрипта успешно обновлены.',
      icon: 'fa-solid fa-circle-check'
    });

    await hideActionLoading(350);

    if (res.codeChanged) {
      showToast(res.message || 'Скрипт обновлен! Исходный код изменен, скрипт отправлен на повторную проверку ⏳', 'warning');
    } else {
      showToast(res.message || 'Скрипт успешно обновлен! (Статус сохранен) ✅', 'success');
    }

    // Refresh detail modal if open
    if (State.activeModalScript && State.activeModalScript.id === scriptId) {
      openScriptDetail(scriptId);
    }
    await loadScriptsFeed();
    updatePlatformStats();
    if (isUserModerator(State.currentUser)) {
      updateModerationQueueCount();
      loadModerationQueue();
    }
  } catch (err) {
    await hideActionLoading();
    showToast(err.message || 'Ошибка при обновлении скрипта', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = origText;
  }
}

// Moderation Queue functions
async function updateModerationQueueCount() {
  if (!isUserModerator(State.currentUser)) return;
  try {
    const data = await api('/api/moderation/queue');
    const count = data.pendingCount || 0;
    const badge = document.getElementById('modQueueBadge');
    const headerPill = document.getElementById('modQueueModalCount');

    if (badge) {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (headerPill) {
      headerPill.textContent = `${count} ${count === 1 ? 'скрипт ожидает' : (count >= 2 && count <= 4 ? 'скрипта ожидают' : 'скриптов ожидают')} проверки`;
    }
  } catch (err) {
    console.warn('Не удалось обновить счетчик очереди модерации:', err);
  }
}

async function openModerationQueueModal() {
  const modal = document.getElementById('moderationQueueModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  await loadModerationQueue();
}

function closeModerationQueueModal() {
  const modal = document.getElementById('moderationQueueModal');
  if (modal) modal.classList.add('hidden');
}

async function loadModerationQueue() {
  if (!isUserModerator(State.currentUser)) return;
  const list = document.getElementById('modQueueList');
  const emptyState = document.getElementById('emptyModQueue');
  const headerPill = document.getElementById('modQueueModalCount');
  if (!list) return;

  list.innerHTML = '<div class="loading-state" style="padding: 20px; text-align: center;"><i class="fa-solid fa-spinner fa-spin"></i> Загрузка скриптов на проверку...</div>';

  try {
    const data = await api('/api/moderation/queue');
    const queue = data.queue || [];
    const count = data.pendingCount || queue.length;

    if (headerPill) {
      headerPill.textContent = `${count} ${count === 1 ? 'скрипт ожидает' : (count >= 2 && count <= 4 ? 'скрипта ожидают' : 'скриптов ожидают')} проверки`;
    }

    const badge = document.getElementById('modQueueBadge');
    if (badge) {
      badge.textContent = count;
      if (count > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }

    if (queue.length === 0) {
      list.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    list.innerHTML = queue.map(script => {
      const coverSrc = script.coverImage || (PRESET_COVERS[script.presetCover] || PRESET_COVERS['cyber-hub']);
      const thumbHtml = coverSrc ?
        `<img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(script.title)}" class="mod-queue-card-thumb" onerror="this.outerHTML='<div class=\\'mod-queue-card-thumb-placeholder\\'><i class=\\'fa-solid fa-code\\'></i><span>${escapeHtml(script.extension || 'lua').toUpperCase()}</span></div>'">` :
        `<div class="mod-queue-card-thumb-placeholder"><i class="fa-solid fa-code"></i><span>${escapeHtml(script.extension || 'lua').toUpperCase()}</span></div>`;

      const codeSnippet = (script.code || '').split('\n').slice(0, 4).join('\n');

      return `
        <div class="mod-queue-card" data-script-id="${script.id}">
          <div class="mod-queue-card-top">
            <div class="mod-queue-card-main">
              ${thumbHtml}
              <div class="mod-queue-card-details">
                <div class="mod-queue-card-title">${escapeHtml(script.title)}</div>
                <div class="mod-queue-card-meta">
                  <span class="mod-queue-meta-author clickable-author" onclick="event.stopPropagation(); window.openPublicProfile('${script.authorId}')" title="Открыть профиль автора">
                    <img src="${escapeHtml(script.authorAvatar || DEFAULT_AVATARS[0])}" class="mod-queue-author-avatar clickable-author-avatar">
                    ${escapeHtml(script.authorName || 'Пользователь')}
                  </span>
                  <span><i class="fa-regular fa-clock"></i> ${formatRelativeTime(script.createdAt)}</span>
                  <span class="tag-pill">.${escapeHtml(script.extension || 'lua')}</span>
                </div>
              </div>
            </div>
            <span class="mod-queue-card-badge"><i class="fa-solid fa-hourglass-half"></i> Ожидает одобрения</span>
          </div>

          <p class="mod-queue-card-desc">${escapeHtml(script.description || 'Без описания')}</p>

          <pre class="mod-queue-code-preview"><code>${escapeHtml(codeSnippet || '-- Код скрипта')}</code></pre>

          <div class="mod-queue-card-actions">
            <button class="mod-card-btn mod-card-btn-approve" onclick="window.handleQueueApprove('${script.id}')">
              <i class="fa-solid fa-circle-check"></i> Одобрить на сайт
            </button>
            <button class="mod-card-btn mod-card-btn-reject" onclick="window.handleQueueReject('${script.id}')">
              <i class="fa-solid fa-circle-xmark"></i> Отклонить
            </button>
            <button class="mod-card-btn mod-card-btn-view" onclick="window.openScriptDetail('${script.id}')">
              <i class="fa-solid fa-eye"></i> Проверить полностью
            </button>
            <button class="mod-card-btn mod-card-btn-delete" onclick="window.handleDeleteScript('${script.id}')">
              <i class="fa-solid fa-trash-can"></i> Удалить
            </button>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    list.innerHTML = `<div class="error-msg" style="padding: 16px; color: #f87171;"><i class="fa-solid fa-triangle-exclamation"></i> Ошибка загрузки очереди: ${escapeHtml(err.message)}</div>`;
  }
}

// Global hooks for inline event handlers in queue cards
window.handleQueueApprove = async (id) => {
  await handleModerateScript('verified', id);
};
window.handleQueueReject = async (id) => {
  await handleModerateScript('rejected', id);
};
window.handleDeleteScript = handleDeleteScript;
window.openScriptDetail = openScriptDetail;


function renderComments(comments, authorId) {
  const feed = document.getElementById('commentsFeed');
  const userAvatar = document.getElementById('commentUserAvatar');

  if (State.currentUser) {
    userAvatar.src = State.currentUser.avatar || DEFAULT_AVATARS[0];
    document.getElementById('commentFormHint').innerHTML = `<i class="fa-solid fa-circle-check"></i> Вы комментируете как <strong>${escapeHtml(State.currentUser.username)}</strong>`;
  } else {
    userAvatar.src = DEFAULT_AVATARS[0];
    document.getElementById('commentFormHint').innerHTML = `<i class="fa-solid fa-circle-info"></i> Войдите в аккаунт, чтобы оставить комментарий`;
  }

  if (!comments || comments.length === 0) {
    feed.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--text-dim); font-size: 0.88rem;">
        Пока нет комментариев. Будьте первым, кто оставит отзыв!
      </div>
    `;
    return;
  }

  feed.innerHTML = comments.map(c => `
    <div class="comment-item">
      <img src="${c.avatar || DEFAULT_AVATARS[0]}" alt="${escapeHtml(c.author)}" class="comment-item-avatar clickable-author-avatar" data-author-id="${c.userId || ''}" title="Открыть профиль ${escapeHtml(c.author)}">
      <div class="comment-item-content">
        <div class="comment-item-header">
          <span class="comment-author-name clickable-author" data-author-id="${c.userId || ''}" title="Открыть профиль ${escapeHtml(c.author)}">${escapeHtml(c.author)}</span>
          ${c.userId === authorId ? '<span class="comment-badge-author">Автор скрипта</span>' : ''}
          <span class="comment-time">${formatRelativeTime(c.createdAt)}</span>
        </div>
        <p class="comment-text">${escapeHtml(c.text)}</p>
      </div>
    </div>
  `).join('');
}

// Like script
async function handleLikeScript(scriptId) {
  if (!State.currentUser) {
    openAuthModal('login');
    showToast('Войдите в аккаунт, чтобы ставить лайки!', 'info');
    return;
  }

  try {
    const data = await api(`/api/scripts/${scriptId}/like`, { method: 'POST' });
    showToast(data.message, data.isLiked ? 'success' : 'info');

    // If detail modal is open, update its state
    if (State.activeModalScript && State.activeModalScript.id === scriptId) {
      const likeBtn = document.getElementById('detailLikeBtn');
      likeBtn.className = `engagement-badge like-action-btn ${data.isLiked ? 'liked' : ''}`;
      likeBtn.querySelector('i').className = `${data.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart`;
      document.getElementById('detailLikesCount').textContent = data.likesCount;
    }

    loadScriptsFeed();
    updatePlatformStats();
  } catch (err) {
    showToast(err.message || 'Ошибка лайка', 'error');
  }
}

function getRatingNoun(count) {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'оценок';
  if (n1 > 1 && n1 < 5) return 'оценки';
  if (n1 === 1) return 'оценка';
  return 'оценок';
}

// Rate script with 1 - 5 stars
async function handleRateScript(scriptId, rating) {
  if (!State.currentUser) {
    openAuthModal('login');
    showToast('Войдите в аккаунт, чтобы ставить звёзды скрипту! ⭐', 'info');
    return;
  }

  try {
    const data = await api(`/api/scripts/${scriptId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating })
    });

    showToast(data.message, 'success');

    if (State.activeModalScript && State.activeModalScript.id === scriptId) {
      State.activeModalScript.rating = data.rating;
      State.activeModalScript.ratingsCount = data.ratingsCount;
      State.activeModalScript.userRating = data.userRating;

      const ratingVal = typeof data.rating === 'number' ? data.rating : 5.0;
      const ratingValEl = document.getElementById('detailRatingVal');
      if (ratingValEl) ratingValEl.textContent = ratingVal.toFixed(1);

      const ratingCountEl = document.getElementById('detailRatingCountVal');
      if (ratingCountEl) ratingCountEl.textContent = `(${data.ratingsCount})`;

      const barScoreEl = document.getElementById('barRatingScore');
      if (barScoreEl) barScoreEl.textContent = `${ratingVal.toFixed(1)} ★`;

      const barVotesEl = document.getElementById('barRatingVotes');
      if (barVotesEl) barVotesEl.textContent = `(${data.ratingsCount} ${getRatingNoun(data.ratingsCount)})`;

      const voteTagEl = document.getElementById('userVoteStatusTag');
      if (voteTagEl) {
        voteTagEl.textContent = `Ваша оценка: ${data.userRating} ★`;
        voteTagEl.style.background = 'rgba(16, 185, 129, 0.2)';
        voteTagEl.style.color = '#34d399';
      }

      const starBtns = document.querySelectorAll('#scriptStarsSelector .script-star-btn');
      starBtns.forEach(btn => {
        const val = parseInt(btn.dataset.val, 10);
        if (val <= data.userRating) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    loadScriptsFeed();
  } catch (err) {
    showToast(err.message || 'Ошибка выставления оценки', 'error');
  }
}

// Post comment
async function handlePostComment(e) {
  e.preventDefault();
  if (!State.currentUser) {
    openAuthModal('login');
    showToast('Пожалуйста, войдите в аккаунт, чтобы оставить комментарий', 'info');
    return;
  }
  if (!State.activeModalScript) return;

  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text) return;

  try {
    const data = await api(`/api/scripts/${State.activeModalScript.id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });

    input.value = '';
    showToast('Комментарий добавлен на сервер!', 'success');

    // Reload script details
    openScriptDetail(State.activeModalScript.id);
  } catch (err) {
    showToast(err.message || 'Ошибка добавления комментария', 'error');
  }
}

// Copy / Download code
async function copyCode(codeOrScript, title) {
  let textToCopy = typeof codeOrScript === 'string' ? codeOrScript : (codeOrScript && codeOrScript.code);
  let scriptTitle = title || (typeof codeOrScript === 'object' && codeOrScript ? codeOrScript.title : 'скрипта');

  if (!textToCopy && typeof codeOrScript === 'object' && codeOrScript && codeOrScript.id) {
    try {
      const res = await api(`/api/scripts/${codeOrScript.id}`);
      if (res && res.script && res.script.code) {
        textToCopy = res.script.code;
        codeOrScript.code = res.script.code;
      }
    } catch (e) {}
  }

  if (!textToCopy) {
    showToast('Не удалось скопировать код', 'error');
    return;
  }

  try {
    await navigator.clipboard.writeText(textToCopy);
    showToast(`Код «${(scriptTitle || 'скрипта').substring(0, 24)}» скопирован!`, 'success');
    const btnText = document.getElementById('copyBtnText');
    if (btnText) btnText.textContent = 'Скопировано!';
  } catch (err) {
    try {
      const ta = document.createElement('textarea');
      ta.value = textToCopy;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast(`Код «${(scriptTitle || 'скрипта').substring(0, 24)}» скопирован!`, 'success');
      const btnText = document.getElementById('copyBtnText');
      if (btnText) btnText.textContent = 'Скопировано!';
    } catch (e2) {
      showToast('Не удалось скопировать код', 'error');
    }
  }
}

async function downloadScript(script) {
  if (!script) return;
  if (!script.code && script.id) {
    try {
      const res = await api(`/api/scripts/${script.id}`);
      if (res && res.script && res.script.code) {
        script.code = res.script.code;
      }
    } catch (e) {}
  }
  if (!script.code) {
    showToast('Не удалось получить код для скачивания', 'error');
    return;
  }
  const ext = script.extension || 'lua';
  const filename = `${script.title.replace(/[^a-zA-Z0-9а-яА-Я_-]/g, '_').substring(0, 30)}.${ext}`;
  const blob = new Blob([script.code], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Файл ${filename} успешно скачан!`, 'success');
}

// ============================================================================
// UPLOAD SCRIPT (SAVED ON HOST DISK)
// ============================================================================

function openUploadModal() {
  if (!State.currentUser) {
    openAuthModal('login');
    showToast('Войдите или зарегистрируйтесь, чтобы выкладывать скрипты!', 'info');
    return;
  }
  document.getElementById('uploadScriptModal').classList.remove('hidden');
}

function closeUploadModal() {
  document.getElementById('uploadScriptModal').classList.add('hidden');
  resetUploadForm();
}

function resetUploadForm() {
  document.getElementById('uploadForm').reset();
  State.uploadedImageDataUrl = null;
  document.getElementById('dropzonePreviewWrap').classList.add('hidden');
  document.getElementById('dropzonePrompt').classList.remove('hidden');
}

function setupImageDropzone() {
  const dropzone = document.getElementById('imageDropzone');
  const fileInput = document.getElementById('imageFileInput');
  const browseBtn = document.getElementById('browseImageBtn');
  const removeBtn = document.getElementById('removeImageBtn');
  const previewWrap = document.getElementById('dropzonePreviewWrap');
  const prompt = document.getElementById('dropzonePrompt');
  const previewImg = document.getElementById('uploadedImagePreview');

  browseBtn.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('click', (e) => {
    if (e.target.closest('#removeImageBtn') || e.target.closest('#browseImageBtn')) return;
    fileInput.click();
  });

  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processImage(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files[0]) processImage(fileInput.files[0]);
  });

  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    State.uploadedImageDataUrl = null;
    fileInput.value = '';
    previewWrap.classList.add('hidden');
    prompt.classList.remove('hidden');
  });

  function processImage(file) {
    if (!file.type.startsWith('image/')) {
      showToast('Пожалуйста, выберите изображение', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      State.uploadedImageDataUrl = event.target.result;
      previewImg.src = State.uploadedImageDataUrl;
      prompt.classList.add('hidden');
      previewWrap.classList.remove('hidden');
      showToast('Скриншот готов к сохранению на сервер!', 'success');
    };
    reader.readAsDataURL(file);
  }

  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetKey = btn.dataset.preset;
      if (PRESET_COVERS[presetKey]) {
        State.uploadedImageDataUrl = PRESET_COVERS[presetKey];
        previewImg.src = State.uploadedImageDataUrl;
        prompt.classList.add('hidden');
        previewWrap.classList.remove('hidden');
        showToast(`Выбрана тема ${btn.textContent}!`, 'info');
      }
    });
  });
}

function setupFastCodePasteOptimization() {
  const textareas = [
    document.getElementById('scriptCodeInput'),
    document.getElementById('editScriptCodeInput')
  ].filter(Boolean);

  textareas.forEach(ta => {
    ta.addEventListener('paste', (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;
      const text = clipboardData.getData('text/plain');

      // If pasted text is large (> 20KB or > 300 lines), perform fast direct insertion
      // to bypass browser Hunspell spellchecking and rich text parsing stalls
      if (text && (text.length > 20000 || text.includes('\n'))) {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const currentVal = ta.value;

        ta.value = currentVal.substring(0, start) + text + currentVal.substring(end);
        ta.selectionStart = ta.selectionEnd = start + text.length;

        // Dispatch input event for validations
        ta.dispatchEvent(new Event('input', { bubbles: true }));

        const lines = text.split('\n').length;
        const kb = (text.length / 1024).toFixed(1);
        if (text.length > 30000) {
          showToast(`Вставлен большой скрипт: ${lines} строк (${kb} KB) без зависаний! ⚡`, 'info');
        }
      }
    });
  });
}

function setupEditModalInteractions() {
  const codeInput = document.getElementById('editScriptCodeInput');
  const codeIndicator = document.getElementById('editCodeChangeIndicator');
  if (codeInput && codeIndicator) {
    let checkTimer = null;
    codeInput.addEventListener('input', () => {
      clearTimeout(checkTimer);
      checkTimer = setTimeout(() => {
        const isChanged = (codeInput.value || '').trim() !== _editOriginalCode;
        if (isChanged) {
          codeIndicator.className = 'code-change-indicator changed';
          codeIndicator.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Код изменен! Потребуется проверка Kerryrbq';
        } else {
          codeIndicator.className = 'code-change-indicator';
          codeIndicator.innerHTML = '<i class="fa-solid fa-check"></i> Код не изменен (без перемодерации)';
        }
      }, 150);
    });
  }

  const dropzone = document.getElementById('editImageDropzone');
  const fileInput = document.getElementById('editImageFileInput');
  const browseBtn = document.getElementById('editBrowseImageBtn');
  const removeBtn = document.getElementById('editRemoveImageBtn');
  const previewWrap = document.getElementById('editDropzonePreviewWrap');
  const promptWrap = document.getElementById('editDropzonePrompt');
  const previewImg = document.getElementById('editUploadedImagePreview');

  if (browseBtn && fileInput) {
    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      if (e.target.closest('#editRemoveImageBtn') || e.target.closest('#editBrowseImageBtn')) return;
      fileInput.click();
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) processEditImage(e.dataTransfer.files[0]);
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) processEditImage(fileInput.files[0]);
    });
  }

  if (removeBtn) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      _editUploadedImageBase64 = null;
      if (fileInput) fileInput.value = '';
      if (previewWrap) previewWrap.classList.add('hidden');
      if (promptWrap) promptWrap.classList.remove('hidden');
    });
  }

  function processEditImage(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Пожалуйста, выберите изображение (PNG, JPG, WebP)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      _editUploadedImageBase64 = event.target.result;
      if (previewImg) previewImg.src = _editUploadedImageBase64;
      if (promptWrap) promptWrap.classList.add('hidden');
      if (previewWrap) previewWrap.classList.remove('hidden');
      showToast('Новый скриншот готов к сохранению!', 'success');
    };
    reader.readAsDataURL(file);
  }
}

function setupCodeFileInput() {
  const codeFileInput = document.getElementById('codeFileInput');
  const codeTextarea = document.getElementById('scriptCodeInput');
  const titleInput = document.getElementById('scriptTitleInput');
  const extSelect = document.getElementById('scriptExtensionSelect');

  codeFileInput.addEventListener('change', () => {
    const file = codeFileInput.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'lua') extSelect.value = 'lua';
    if (ext === 'txt') extSelect.value = 'txt';

    if (!titleInput.value.trim()) {
      titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      codeTextarea.value = e.target.result;
      showToast(`Файл ${file.name} загружен в редактор!`, 'success');
    };
    reader.readAsText(file);
  });
}

async function handleUploadSubmit(e) {
  e.preventDefault();
  if (!State.currentUser) {
    showToast('Пожалуйста, сначала войдите в свой аккаунт!', 'info');
    openAuthModal('login');
    return;
  }

  // Ensure token exists or auto-refresh
  if (!State.token) {
    DebugConsole.log('auth', 'Token missing in handleUploadSubmit. Attempting auto-refresh...');
    const refreshed = await attemptAutoRefreshSession();
    if (!refreshed && !State.token) {
      showToast('Сессия истекла. Пожалуйста, войдите снова.', 'error');
      openAuthModal('login');
      return;
    }
  }

  const title = document.getElementById('scriptTitleInput').value.trim();
  const category = document.getElementById('scriptCategorySelect').value;
  const extension = document.getElementById('scriptExtensionSelect').value;
  const code = document.getElementById('scriptCodeInput').value.trim();
  const description = document.getElementById('scriptDescInput').value.trim();
  const tags = document.getElementById('scriptTagsInput').value.trim();

  if (!title || !code) {
    showToast('Укажите название и код скрипта', 'error');
    return;
  }

  // Mandatory Image Requirement
  if (!State.uploadedImageDataUrl) {
    showToast('Загрузка картинки обязательна! Прикрепите скриншот или выберите готовую тему.', 'warning');
    const dropzone = document.getElementById('imageDropzone');
    if (dropzone) {
      dropzone.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dropzone.classList.add('dropzone-error-shake');
      setTimeout(() => dropzone.classList.remove('dropzone-error-shake'), 1200);
    }
    return;
  }

  const submitBtn = document.getElementById('publishScriptSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Сохранение на сервер...';

  showActionLoading({
    title: 'Публикация скрипта...',
    subtitle: 'Загружаем обложку и сохраняем скрипт на сервер...',
    icon: 'fa-solid fa-rocket fa-fade'
  });

  try {
    const payload = {
      title,
      category,
      extension,
      code,
      description,
      tags,
      imageBase64: State.uploadedImageDataUrl,
      presetCover: category === 'roblox' ? 'cyber-hub' : (extension === 'txt' ? 'dark-config' : 'neon-executor')
    };

    DebugConsole.log('api', 'Отправка формы создания скрипта...', { title, category, extension });

    const data = await api('/api/scripts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const newScript = (data && data.script) ? data.script : {
      id: 'script-' + Date.now(),
      title,
      category,
      extension,
      code,
      description,
      tags: typeof tags === 'string' ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : (tags || []),
      coverImage: State.uploadedImageDataUrl || '',
      presetCover: category === 'roblox' ? 'cyber-hub' : (extension === 'txt' ? 'dark-config' : 'neon-executor'),
      author: State.currentUser?.username || 'User',
      authorId: State.currentUser?.id,
      authorAvatar: State.currentUser?.avatar,
      createdAt: Date.now(),
      status: 'verified',
      views: 1,
      likes: [],
      comments: []
    };

    if (!State.scriptsCache) State.scriptsCache = new Map();
    State.scriptsCache.set(newScript.id, newScript);
    saveLocalPublishedScript(newScript);

    updateActionLoading({
      title: 'Скрипт успешно опубликован!',
      subtitle: 'Добавляем в каталог...',
      icon: 'fa-solid fa-circle-check'
    });

    await hideActionLoading(350);

    showToast('Скрипт успешно опубликован!', 'success');
    DebugConsole.log('info', '✅ Скрипт опубликован успешно:', data);
    closeUploadModal();
    await loadScriptsFeed();
    updatePlatformStats();
  } catch (err) {
    await hideActionLoading();
    DebugConsole.log('error', `❌ Ошибка при публикации скрипта: ${err.message}`, err);
    showToast(err.message || 'Ошибка публикации', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Опубликовать на сервер';
  }
}

// ============================================================================
// USER PROFILE MODAL
// ============================================================================

async function openProfileModal() {
  if (!State.currentUser) {
    openAuthModal('login');
    return;
  }

  const modal = document.getElementById('userProfileModal');
  document.getElementById('profileModalAvatar').src = State.currentUser.avatar || DEFAULT_AVATARS[0];
  document.getElementById('profileModalUsername').textContent = State.currentUser.username;
  document.getElementById('profileModalBadge').innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${State.currentUser.badge || 'MEMBER'}`;
  document.getElementById('profileModalBio').textContent = State.currentUser.bio || 'Пользователь PublicScriptKR.';
  document.getElementById('editBioInput').value = State.currentUser.bio || '';

  // Render presets
  const presetsBox = document.getElementById('avatarPresets');
  presetsBox.innerHTML = DEFAULT_AVATARS.map(url => `
    <img src="${url}" alt="Preset" class="avatar-preset-item ${url === State.currentUser.avatar ? 'active' : ''}" data-url="${url}">
  `).join('');

  presetsBox.querySelectorAll('.avatar-preset-item').forEach(img => {
    img.addEventListener('click', () => {
      presetsBox.querySelectorAll('.avatar-preset-item').forEach(i => i.classList.remove('active'));
      img.classList.add('active');
      State.currentUser.avatar = img.dataset.url;
      document.getElementById('profileModalAvatar').src = img.dataset.url;
    });
  });

  // Load user's uploaded scripts
  try {
    const data = await api(`/api/scripts?authorId=${encodeURIComponent(State.currentUser.id)}&all=true`);
    const all = data.scripts || [];
    const myScripts = all;

    const myLikes = myScripts.reduce((acc, s) => acc + (s.likesCount || 0), 0);
    const myViews = myScripts.reduce((acc, s) => acc + (s.views || 0), 0);

    document.getElementById('profileMyScriptsCount').textContent = myScripts.length;
    document.getElementById('profileMyLikesCount').textContent = myLikes;
    document.getElementById('profileMyViewsCount').textContent = myViews;

    const listContainer = document.getElementById('userScriptsList');
    const emptyBox = document.getElementById('emptyUserScripts');

    if (myScripts.length === 0) {
      listContainer.innerHTML = '';
      emptyBox.classList.remove('hidden');
    } else {
      emptyBox.classList.add('hidden');
      listContainer.innerHTML = myScripts.map(script => {
        const statusBadge = script.status === 'verified'
          ? '<span class="detail-status-pill verified" style="padding:2px 8px;font-size:0.7rem;"><i class="fa-solid fa-circle-check"></i> Проверено</span>'
          : (script.status === 'rejected'
            ? '<span class="detail-status-pill rejected" style="padding:2px 8px;font-size:0.7rem;"><i class="fa-solid fa-circle-xmark"></i> Отклонено</span>'
            : '<span class="detail-status-pill pending" style="padding:2px 8px;font-size:0.7rem;"><i class="fa-solid fa-clock"></i> На проверке</span>');

        return `
        <div class="user-script-row" data-id="${script.id}">
          <div class="user-script-meta">
            <span class="modal-tag-badge">${(script.extension || 'lua').toUpperCase()}</span>
            <span class="user-script-title">${escapeHtml(script.title)}</span>
            ${statusBadge}
          </div>
          <div class="user-script-actions">
            <span class="card-stat"><i class="fa-regular fa-eye"></i> ${script.views || 0}</span>
            <span class="card-stat"><i class="fa-regular fa-heart"></i> ${script.likesCount || 0}</span>
            <button class="edit-script-btn" title="Редактировать скрипт" data-id="${script.id}">
              <i class="fa-solid fa-pen-to-square"></i> Редактировать
            </button>
            <button class="delete-script-btn" title="Удалить скрипт" data-id="${script.id}">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
        `;
      }).join('');

      listContainer.querySelectorAll('.edit-script-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          closeProfileModal();
          openEditScriptModal(btn.dataset.id);
        });
      });

      listContainer.querySelectorAll('.delete-script-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          handleDeleteScript(btn.dataset.id);
        });
      });

      listContainer.querySelectorAll('.user-script-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.delete-script-btn, .edit-script-btn')) return;
          closeProfileModal();
          openScriptDetail(row.dataset.id);
        });
      });
    }
  } catch (err) {
    console.error(err);
  }

  modal.classList.remove('hidden');
}

function closeProfileModal() {
  document.getElementById('userProfileModal').classList.add('hidden');
}

async function handleEditProfileSubmit(e) {
  e.preventDefault();
  const bio = document.getElementById('editBioInput').value.trim();

  try {
    const data = await api('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({
        bio,
        avatar: State.currentUser.avatar
      })
    });
    State.currentUser = data.user;
    renderUserNav(State.currentUser);
    showToast('Профиль успешно обновлен на сервере!', 'success');
    closeProfileModal();
    loadScriptsFeed();
  } catch (err) {
    showToast(err.message || 'Ошибка обновления профиля', 'error');
  }
}

// Avatar upload from disk in profile
function setupProfileAvatarUpload() {
  const fileInput = document.getElementById('profileAvatarFileInput');
  const fileInputSettings = document.getElementById('editProfileAvatarFileInput');
  const btn = document.getElementById('changeAvatarBtn');

  if (btn && fileInput) {
    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => handleProfileAvatarFile(fileInput));
  }

  if (fileInputSettings) {
    fileInputSettings.addEventListener('change', () => handleProfileAvatarFile(fileInputSettings));
  }

  function handleProfileAvatarFile(input) {
    const file = input.files[0];
    if (!file || !file.type.startsWith('image/')) {
      showToast('Выберите файл изображения', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      State.currentUser.avatar = e.target.result;
      document.getElementById('profileModalAvatar').src = e.target.result;
      document.getElementById('navUserAvatar').src = e.target.result;
      showToast('Фото выбрано! Нажмите «Сохранить профиль» для сохранения на сервере.', 'info');
    };
    reader.readAsDataURL(file);
  }
}

// ============================================================================
// PUBLIC TUNNEL SHARE MODAL
// ============================================================================

function openTunnelModal() {
  const modal = document.getElementById('tunnelShareModal');
  const input = document.getElementById('publicUrlInput');
  const copyBtn = document.getElementById('copyPublicUrlBtn');

  // Check if we already have a tunnel or current host
  const currentUrl = window.location.href;
  input.value = State.publicTunnelUrl || currentUrl;

  copyBtn.onclick = () => {
    navigator.clipboard.writeText(input.value);
    showToast('Публичная ссылка скопирована!', 'success');
  };

  modal.classList.remove('hidden');
}

function closeTunnelModal() {
  document.getElementById('tunnelShareModal').classList.add('hidden');
}

// ============================================================================
// EVENT LISTENERS INITIALIZATION
// ============================================================================

function setupEventListeners() {
  // Navigation
  document.getElementById('openUploadModalBtn').addEventListener('click', openUploadModal);
  document.getElementById('openAuthModalBtn').addEventListener('click', () => openAuthModal('login'));
  document.getElementById('openProfileBtn').addEventListener('click', openProfileModal);
  document.getElementById('navLogoutBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    logoutUser();
  });

  document.getElementById('shareTunnelBtn')?.addEventListener('click', openTunnelModal);
  document.getElementById('closeTunnelModalBtn')?.addEventListener('click', closeTunnelModal);

  document.getElementById('footerNewScript').addEventListener('click', (e) => {
    e.preventDefault();
    openUploadModal();
  });
  document.getElementById('emptyUploadBtn').addEventListener('click', openUploadModal);
  document.getElementById('profileAddScriptBtn').addEventListener('click', () => {
    closeProfileModal();
    openUploadModal();
  });

  // Close Modals
  document.getElementById('closeAuthModalBtn').addEventListener('click', closeAuthModal);
  document.getElementById('closeDetailModalBtn').addEventListener('click', closeDetailModal);
  document.getElementById('closeUploadModalBtn').addEventListener('click', closeUploadModal);
  document.getElementById('cancelUploadBtn').addEventListener('click', closeUploadModal);
  document.getElementById('closeProfileModalBtn').addEventListener('click', closeProfileModal);
  const closeModQueueBtn = document.getElementById('closeModQueueBtn');
  if (closeModQueueBtn) closeModQueueBtn.addEventListener('click', closeModerationQueueModal);
  const closeEditModalBtn = document.getElementById('closeEditModalBtn');
  if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', closeEditScriptModal);
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  if (cancelEditBtn) cancelEditBtn.addEventListener('click', closeEditScriptModal);

  // Edit form submit
  const editForm = document.getElementById('editForm');
  if (editForm) editForm.addEventListener('submit', handleEditScriptSubmit);

  // Overlay click to close
  ['authModal', 'scriptDetailModal', 'uploadScriptModal', 'userProfileModal', 'tunnelShareModal', 'moderationQueueModal', 'editScriptModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.add('hidden');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['authModal', 'scriptDetailModal', 'uploadScriptModal', 'userProfileModal', 'tunnelShareModal', 'moderationQueueModal', 'editScriptModal', 'imageZoomOverlay'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
      });
    }
  });

  // Auth Tabs
  document.getElementById('tabLoginBtn').addEventListener('click', () => openAuthModal('login'));
  document.getElementById('tabRegisterBtn').addEventListener('click', () => openAuthModal('register'));

  // Auth Forms
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsernameInput').value.trim();
    const password = document.getElementById('loginPasswordInput').value;
    try {
      const data = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      State.token = data.token;
      State.currentUser = data.user;
      localStorage.setItem('pskr_token', data.token);
      localStorage.setItem('pskr_auth_token', data.token);
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
      if (data.user?.username) localStorage.setItem('pskr_saved_username', data.user.username);
      setCookie('pskr_token', data.token, 365);
      renderUserNav(data.user);
      closeAuthModal();
      showToast(`Добро пожаловать, ${data.user.username}!`, 'success');
      loadScriptsFeed();
      updatePlatformStats();
    } catch (err) {
      showToast(err.message || 'Ошибка входа', 'error');
    }
  });

  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsernameInput').value.trim();
    const password = document.getElementById('regPasswordInput').value;
    const bio = document.getElementById('regBioInput').value.trim();
    try {
      const data = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          username,
          password,
          bio,
          avatar: State.selectedRegisterAvatar
        })
      });
      State.token = data.token;
      State.currentUser = data.user;
      localStorage.setItem('pskr_token', data.token);
      localStorage.setItem('pskr_auth_token', data.token);
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
      if (data.user?.username) localStorage.setItem('pskr_saved_username', data.user.username);
      setCookie('pskr_token', data.token, 365);
      renderUserNav(data.user);
      closeAuthModal();
      showToast(`Аккаунт ${data.user.username} успешно создан!`, 'success');
      loadScriptsFeed();
      updatePlatformStats();
    } catch (err) {
      showToast(err.message || 'Ошибка регистрации', 'error');
    }
  });

  // Search & Filtering
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');

  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  let searchTimeout;
  searchInput.addEventListener('input', () => {
    State.searchQuery = searchInput.value;
    if (State.searchQuery.length > 0) clearSearchBtn.classList.remove('hidden');
    else clearSearchBtn.classList.add('hidden');

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      loadScriptsFeed();
    }, 250);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    State.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    searchInput.focus();
    loadScriptsFeed();
  });

  document.querySelectorAll('#categoryChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      State.activeCategory = chip.dataset.category;
      loadScriptsFeed();
    });
  });

  document.querySelectorAll('.filter-trigger').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.dataset.cat;
      const targetChip = document.querySelector(`#categoryChips .chip[data-category="${cat}"]`);
      if (targetChip) targetChip.click();
      window.scrollTo({ top: 380, behavior: 'smooth' });
    });
  });

  document.getElementById('sortSelect').addEventListener('change', (e) => {
    State.sortBy = e.target.value;
    loadScriptsFeed();
  });

  // Detail Modal Actions
  document.getElementById('detailLikeBtn').addEventListener('click', () => {
    if (State.activeModalScript) handleLikeScript(State.activeModalScript.id);
  });

  document.getElementById('copyCodeBtn').addEventListener('click', () => {
    if (State.activeModalScript) copyCode(State.activeModalScript.code, State.activeModalScript.title);
  });

  document.getElementById('downloadCodeBtn').addEventListener('click', () => {
    if (State.activeModalScript) downloadScript(State.activeModalScript);
  });

  // Script Detail Modal Tab Buttons
  const tabCodeBtn = document.getElementById('tabDetailCodeBtn');
  const tabCommentsBtn = document.getElementById('tabDetailCommentsBtn');
  const tabCoverBtn = document.getElementById('tabDetailCoverBtn');

  if (tabCodeBtn) tabCodeBtn.addEventListener('click', () => switchDetailTab('code'));
  if (tabCommentsBtn) tabCommentsBtn.addEventListener('click', () => switchDetailTab('comments'));
  if (tabCoverBtn) tabCoverBtn.addEventListener('click', () => switchDetailTab('cover'));

  // Moderation Action Buttons (Script Detail Modal)
  const btnVerify = document.getElementById('modBtnVerify');
  const btnPending = document.getElementById('modBtnPending');
  const btnReject = document.getElementById('modBtnReject');
  const btnDelete = document.getElementById('modBtnDelete');

  if (btnVerify) btnVerify.addEventListener('click', () => handleModerateScript('verified'));
  if (btnPending) btnPending.addEventListener('click', () => handleModerateScript('pending'));
  if (btnReject) btnReject.addEventListener('click', () => handleModerateScript('rejected'));
  if (btnDelete) btnDelete.addEventListener('click', () => handleDeleteScript());

  // Moderation Queue Window Controls
  const openModQueueBtn = document.getElementById('openModQueueBtn');
  const refreshModQueueBtn = document.getElementById('refreshModQueueBtn');

  if (openModQueueBtn) openModQueueBtn.addEventListener('click', openModerationQueueModal);
  if (refreshModQueueBtn) refreshModQueueBtn.addEventListener('click', loadModerationQueue);

  // Notification Bell & Popover
  const notifBellBtn = document.getElementById('notifBellBtn');
  const notifPopover = document.getElementById('notifPopover');
  const notifBellWrap = document.getElementById('notifBellWrap');
  const markAllReadBtn = document.getElementById('markAllReadBtn');
  const closeNotifBtn = document.getElementById('closeNotifBtn');

  if (notifBellBtn && notifPopover) {
    notifBellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = notifPopover.classList.contains('hidden');
      if (isHidden) {
        notifPopover.classList.remove('hidden');
        loadNotifications();
      } else {
        notifPopover.classList.add('hidden');
      }
    });

    if (closeNotifBtn) {
      closeNotifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPopover.classList.add('hidden');
      });
    }

    // Close when clicking outside of the popover and outside of the bell button
    document.addEventListener('click', (e) => {
      if (!notifPopover.classList.contains('hidden')) {
        if (!notifPopover.contains(e.target) && !notifBellBtn.contains(e.target)) {
          notifPopover.classList.add('hidden');
        }
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !notifPopover.classList.contains('hidden')) {
        notifPopover.classList.add('hidden');
      }
    });
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', handleMarkAllNotificationsRead);
  }

  document.getElementById('newCommentForm').addEventListener('submit', handlePostComment);

  // Script Detail Interactive Star Rating
  const scriptStarBtns = document.querySelectorAll('#scriptStarsSelector .script-star-btn');
  scriptStarBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!State.activeModalScript) return;
      const val = parseInt(btn.dataset.val, 10);
      handleRateScript(State.activeModalScript.id, val);
    });

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      const val = parseInt(btn.dataset.val, 10);
      scriptStarBtns.forEach(b => {
        const bVal = parseInt(b.dataset.val, 10);
        if (bVal <= val) {
          b.style.color = '#fde047';
          b.style.transform = 'scale(1.25)';
        } else {
          b.style.color = '#475569';
          b.style.transform = 'scale(1)';
        }
      });
    });

    btn.addEventListener('mouseleave', () => {
      const userRating = (State.activeModalScript && State.activeModalScript.userRating) || 0;
      scriptStarBtns.forEach(b => {
        const bVal = parseInt(b.dataset.val, 10);
        b.style.transform = '';
        b.style.color = '';
        if (bVal <= userRating) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    });
  });

  // Zoom Image
  const zoomOverlay = document.getElementById('imageZoomOverlay');
  const enlargedImg = document.getElementById('enlargedImage');
  document.getElementById('zoomImageBtn').addEventListener('click', () => {
    if (State.activeModalScript) {
      const coverSrc = State.activeModalScript.coverImage || (PRESET_COVERS[State.activeModalScript.presetCover] || PRESET_COVERS['cyber-hub']);
      enlargedImg.src = coverSrc;
      zoomOverlay.classList.remove('hidden');
    }
  });
  document.getElementById('closeZoomBtn').addEventListener('click', () => zoomOverlay.classList.add('hidden'));
  zoomOverlay.addEventListener('click', (e) => {
    if (e.target === zoomOverlay) zoomOverlay.classList.add('hidden');
  });

  // Upload Form
  document.getElementById('uploadForm').addEventListener('submit', handleUploadSubmit);

  // Profile Tabs & Form
  document.getElementById('pTabMyScripts').addEventListener('click', () => {
    document.getElementById('pTabMyScripts').classList.add('active');
    document.getElementById('pTabSettings').classList.remove('active');
    document.getElementById('tabContentMyScripts').classList.remove('hidden');
    document.getElementById('tabContentSettings').classList.add('hidden');
  });

  document.getElementById('pTabSettings').addEventListener('click', () => {
    document.getElementById('pTabSettings').classList.add('active');
    document.getElementById('pTabMyScripts').classList.remove('active');
    document.getElementById('tabContentSettings').classList.remove('hidden');
    document.getElementById('tabContentMyScripts').classList.add('hidden');
  });

  document.getElementById('editProfileForm').addEventListener('submit', handleEditProfileSubmit);

  document.getElementById('logoLink').addEventListener('click', (e) => {
    e.preventDefault();
    const allChip = document.querySelector('#categoryChips .chip[data-category="all"]');
    if (allChip) allChip.click();
    searchInput.value = '';
    State.searchQuery = '';
    clearSearchBtn.classList.add('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  setupImageDropzone();
  setupEditModalInteractions();
  setupFastCodePasteOptimization();
  setupCodeFileInput();
  setupProfileAvatarUpload();
  setupPublicProfileEventListeners();
}

// ============================================================================
// PUBLIC PLAYER PROFILE, AUTHOR SCRIPTS, ADMIN BADGES & REVIEWS
// ============================================================================

let currentViewingProfileId = null;
let currentViewingProfileUser = null;
let selectedReviewRating = 5;

async function openPublicProfile(userId) {
  if (!userId) {
    showToast('Пользователь не найден', 'error');
    return;
  }

  try {
    const data = await api(`/api/users/${userId}`);
    const user = data.user;
    const stats = data.stats || {};
    const scripts = data.scripts || [];
    const reviews = data.reviews || [];

    currentViewingProfileId = user.id;
    currentViewingProfileUser = user;

    const modal = document.getElementById('publicProfileModal');
    document.getElementById('pubProfileTitle').textContent = `Профиль: ${user.username}`;
    document.getElementById('pubProfileAvatar').src = user.avatar || DEFAULT_AVATARS[0];
    document.getElementById('pubProfileUsername').textContent = user.username;
    
    // Badge pill
    const badgeEl = document.getElementById('pubProfileBadge');
    if (user.badge) {
      badgeEl.innerHTML = `<i class="fa-solid fa-crown"></i> ${escapeHtml(user.badge)}`;
      badgeEl.style.display = 'inline-flex';
    } else if (isUserModerator(user)) {
      badgeEl.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Главный Администратор';
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.innerHTML = '<i class="fa-solid fa-certificate"></i> Игрок';
      badgeEl.style.display = 'inline-flex';
    }

    document.getElementById('pubProfileBio').textContent = user.bio || 'Пользователь платформы PublicScriptKR.';
    
    const joinDateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }) : 'Недавно';
    document.getElementById('pubProfileJoinDate').innerHTML = `<i class="fa-regular fa-calendar-check"></i> На сайте с ${joinDateStr}`;

    // Stats
    document.getElementById('pubStatScripts').textContent = stats.scriptsCount || scripts.length;
    document.getElementById('pubStatRating').innerHTML = `${(stats.averageRating || 5).toFixed(1)} <span class="star-mini">★</span>`;
    document.getElementById('pubStatReviews').textContent = stats.reviewsCount || reviews.length;
    document.getElementById('pubStatViews').textContent = stats.totalViews || 0;
    document.getElementById('pubStatLikes').textContent = stats.totalLikes || 0;

    // Admin Badge Assignment Panel (only Kerryrbq / moderators)
    const adminPanel = document.getElementById('adminBadgePanel');
    if (isUserModerator(State.currentUser)) {
      adminPanel.classList.remove('hidden');
      document.getElementById('adminBadgeCustomInput').value = user.badge || '';
    } else {
      adminPanel.classList.add('hidden');
    }

    // Tab counts
    document.getElementById('pubScriptsCountTab').textContent = scripts.length;
    document.getElementById('pubReviewsCountTab').textContent = reviews.length;

    // Render Tab 1: Author's Scripts
    renderPublicAuthorScripts(scripts);

    // Render Tab 2: Reviews
    renderPublicAuthorReviews(reviews, user.id);

    // Switch to scripts tab by default
    switchPublicProfileTab('scripts');

    // Close script detail modal if open to prevent overlay stacking
    document.getElementById('scriptDetailModal').classList.add('hidden');

    // Open Modal and reset scroll
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) modalBody.scrollTop = 0;
    modal.classList.remove('hidden');
  } catch (err) {
    console.error('Error opening public profile:', err);
    showToast(err.message || 'Ошибка загрузки профиля игрока', 'error');
  }
}

function switchPublicProfileTab(tab) {
  const tabScriptsBtn = document.getElementById('pubTabScriptsBtn');
  const tabReviewsBtn = document.getElementById('pubTabReviewsBtn');
  const secScripts = document.getElementById('pubTabContentScripts');
  const secReviews = document.getElementById('pubTabContentReviews');

  if (tab === 'reviews') {
    tabReviewsBtn.classList.add('active');
    tabScriptsBtn.classList.remove('active');
    secReviews.classList.remove('hidden');
    secScripts.classList.add('hidden');
  } else {
    tabScriptsBtn.classList.add('active');
    tabReviewsBtn.classList.remove('active');
    secScripts.classList.remove('hidden');
    secReviews.classList.add('hidden');
  }
}

function renderPublicAuthorScripts(scripts) {
  const container = document.getElementById('pubScriptsList');
  const emptyState = document.getElementById('pubEmptyScripts');
  container.innerHTML = '';

  if (!scripts || scripts.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  scripts.forEach(script => {
    const card = document.createElement('div');
    card.className = 'script-card';

    const canManage = canUserManageScript(script, State.currentUser);
    const coverSrc = getCardCover(script);
    const avatarSrc = getAvatarSrc(script.authorAvatar);
    const statusBadgeHtml = renderCardStatusBadge(script.status);
    const tagsHtml = (script.tags || []).slice(0, 3).map(tag => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join('');

    card.innerHTML = `
      <div class="script-card-thumb-wrap">
        <img src="${coverSrc}" alt="${escapeHtml(script.title)}" class="script-card-thumb" loading="lazy" onerror="this.onerror=null; this.src=window.PRESET_COVERS['cyber-hub'];">
        ${statusBadgeHtml}
        <span class="script-thumb-badge">${(script.extension || 'lua').toUpperCase()}</span>
        ${canManage ? `
          <button class="script-thumb-edit-btn" title="Редактировать мой скрипт" data-action="edit-script" data-id="${script.id}">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
        ` : ''}
        <button class="script-thumb-quick-copy" title="Быстро скопировать код" data-action="quick-copy" data-id="${script.id}">
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>

      <div class="script-card-body">
        <div class="script-card-author-row">
          <div class="card-author">
            <img src="${avatarSrc}" alt="${escapeHtml(script.author)}" class="card-author-avatar" onerror="this.onerror=null; this.src='${DEFAULT_AVATARS[0]}';">
            <span class="card-author-name">${escapeHtml(script.author)}</span>
          </div>
          <span class="card-post-date">${formatRelativeTime(script.createdAt)}</span>
        </div>

        <h3 class="script-card-title">${escapeHtml(script.title)}</h3>
        <p class="script-card-desc">${escapeHtml(script.description)}</p>

        <div class="script-card-tags">
          ${tagsHtml}
        </div>

        <div class="script-card-footer">
          <div class="card-engagement-stats">
            <span class="card-stat card-rating-stat" title="Рейтинг: ${(typeof script.rating === 'number' ? script.rating : 5).toFixed(1)} из 5">
              <i class="fa-solid fa-star"></i> ${(typeof script.rating === 'number' ? script.rating : 5).toFixed(1)}
              <span class="stat-count">(${script.ratingsCount || 0})</span>
            </span>
            <button class="card-like-btn ${script.isLiked ? 'liked' : ''}" data-action="toggle-like" data-id="${script.id}" title="${script.isLiked ? 'Убрать лайк' : 'Поставить лайк'}">
              <i class="${script.isLiked ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
              <span>${script.likesCount || 0}</span>
            </button>
            <span class="card-stat" title="Реальные просмотры">
              <i class="fa-regular fa-eye"></i> ${script.views || 0}
            </span>
            <span class="card-stat" title="Комментарии">
              <i class="fa-regular fa-comment"></i> ${script.commentsCount || 0}
            </span>
          </div>
          ${canManage ? `
            <button class="card-author-edit-btn" data-action="edit-script" data-id="${script.id}" title="Редактировать скрипт">
              <i class="fa-solid fa-pen-to-square"></i> Редактировать
            </button>
          ` : ''}
          <span class="card-open-btn">Проверить код <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'edit-script') {
          e.stopPropagation();
          const pubModal = document.getElementById('publicProfileModal');
          if (pubModal) pubModal.classList.add('hidden');
          openEditScriptModal(script);
          return;
        }
        if (action === 'quick-copy') {
          e.stopPropagation();
          copyCode(script, script.title);
          return;
        }
        if (action === 'toggle-like') {
          e.stopPropagation();
          handleLikeScript(script.id);
          return;
        }
      }
      openScriptDetail(script.id);
    });

    container.appendChild(card);
  });
}

function renderPublicAuthorReviews(reviews, authorId) {
  const container = document.getElementById('pubReviewsList');
  const emptyState = document.getElementById('pubEmptyReviews');
  const leaveCard = document.getElementById('leaveReviewCard');
  const selfNotice = document.getElementById('selfReviewNotice');
  container.innerHTML = '';

  // Prevent self review
  if (State.currentUser && State.currentUser.id === authorId) {
    leaveCard.classList.add('hidden');
    selfNotice.classList.remove('hidden');
  } else {
    leaveCard.classList.remove('hidden');
    selfNotice.classList.add('hidden');
  }

  // Reset review form
  document.getElementById('pubReviewTextInput').value = '';
  document.getElementById('reviewCharCount').textContent = '0 / 500';
  setStarPickerRating(5);

  if (!reviews || reviews.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  reviews.forEach(r => {
    const card = document.createElement('div');
    card.className = 'pub-review-card';

    // Stars HTML
    let starsHtml = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= r.rating) {
        starsHtml += '<i class="fa-solid fa-star"></i>';
      } else {
        starsHtml += '<i class="fa-regular fa-star" style="color: #475569;"></i>';
      }
    }

    const canDelete = State.currentUser && (isUserModerator(State.currentUser) || State.currentUser.id === r.userId);
    const deleteBtnHtml = canDelete ? `
      <button type="button" class="pub-review-delete-btn" onclick="window.handleDeleteAuthorReview('${r.id}')" title="Удалить этот отзыв">
        <i class="fa-solid fa-trash-can"></i> Удалить
      </button>
    ` : '';

    const badgeHtml = r.authorBadge ? `<span class="badge-mini" style="font-size:0.65rem; background:rgba(251,191,36,0.15); color:#fbbf24; padding:2px 6px; border-radius:4px; margin-left:4px;">${escapeHtml(r.authorBadge)}</span>` : '';

    card.innerHTML = `
      <div class="pub-review-top">
        <div class="pub-review-author">
          <img src="${r.authorAvatar || DEFAULT_AVATARS[0]}" alt="${escapeHtml(r.authorName)}" class="pub-review-author-img">
          <div>
            <div class="pub-review-author-name">
              ${escapeHtml(r.authorName)} ${badgeHtml}
            </div>
            <div class="pub-review-date"><i class="fa-regular fa-clock"></i> ${formatRelativeTime(r.createdAt)}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <div class="pub-review-stars" title="Оценка: ${r.rating} из 5">
            ${starsHtml}
          </div>
          ${deleteBtnHtml}
        </div>
      </div>
      <p class="pub-review-text">${escapeHtml(r.text)}</p>
    `;

    container.appendChild(card);
  });
}

function setStarPickerRating(rating) {
  selectedReviewRating = rating;
  const picker = document.getElementById('reviewStarPicker');
  if (!picker) return;
  picker.dataset.rating = rating;

  const stars = picker.querySelectorAll('.star-pick');
  stars.forEach(star => {
    const val = parseInt(star.dataset.val, 10);
    if (val <= rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });

  const hints = {
    5: 'Отлично (5/5) ⭐',
    4: 'Хорошо (4/5) 👍',
    3: 'Нормально (3/5) 😐',
    2: 'Плохо (2/5) 👎',
    1: 'Ужасно (1/5) ⚠️'
  };
  document.getElementById('ratingTextHint').textContent = hints[rating] || `${rating}/5`;
}

async function handleAdminAssignBadge(customValue = null) {
  if (!isUserModerator(State.currentUser)) {
    showToast('Только администратор Kerryrbq может выдавать теги', 'error');
    return;
  }
  if (!currentViewingProfileId) return;

  const inputVal = customValue !== null ? customValue : document.getElementById('adminBadgeCustomInput').value.trim();

  try {
    const res = await api(`/api/users/${currentViewingProfileId}/badge`, {
      method: 'PUT',
      body: JSON.stringify({ badge: inputVal })
    });

    showToast(`Тег успешно выдан: "${res.badge || 'Сброшен'}" 🏷️`, 'success');
    await openPublicProfile(currentViewingProfileId);
    loadScriptsFeed();
  } catch (err) {
    showToast(err.message || 'Ошибка выдачи тега', 'error');
  }
}

async function handlePostAuthorReview(e) {
  e.preventDefault();
  if (!State.currentUser) {
    openAuthModal('login');
    showToast('Войдите в аккаунт, чтобы оставить отзыв!', 'info');
    return;
  }
  if (!currentViewingProfileId) return;

  const textInput = document.getElementById('pubReviewTextInput');
  const text = textInput.value.trim();

  if (text.length < 3) {
    showToast('Отзыв должен содержать не менее 3 символов', 'error');
    return;
  }

  try {
    await api(`/api/users/${currentViewingProfileId}/reviews`, {
      method: 'POST',
      body: JSON.stringify({
        rating: selectedReviewRating,
        text: text
      })
    });

    showToast('Ваш отзыв успешно опубликован! ⭐', 'success');
    textInput.value = '';
    document.getElementById('reviewCharCount').textContent = '0 / 500';
    await openPublicProfile(currentViewingProfileId);
  } catch (err) {
    showToast(err.message || 'Ошибка отправки отзыва', 'error');
  }
}

async function handleDeleteAuthorReview(reviewId) {
  if (!confirm('Вы действительно хотите удалить этот отзыв?')) {
    return;
  }
  if (!currentViewingProfileId || !reviewId) return;

  try {
    await api(`/api/users/${currentViewingProfileId}/reviews/${reviewId}`, {
      method: 'DELETE'
    });

    showToast('Отзыв успешно удален 🗑️', 'success');
    await openPublicProfile(currentViewingProfileId);
  } catch (err) {
    showToast(err.message || 'Ошибка удаления отзыва', 'error');
  }
}

function setupPublicProfileEventListeners() {
  const modal = document.getElementById('publicProfileModal');
  const closeBtn = document.getElementById('closePubProfileBtn');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // Tabs
  document.getElementById('pubTabScriptsBtn').addEventListener('click', () => switchPublicProfileTab('scripts'));
  document.getElementById('pubTabReviewsBtn').addEventListener('click', () => switchPublicProfileTab('reviews'));

  // Star Picker
  const picker = document.getElementById('reviewStarPicker');
  if (picker) {
    picker.querySelectorAll('.star-pick').forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.dataset.val, 10);
        setStarPickerRating(val);
      });
    });
  }

  // Review character counter
  const reviewText = document.getElementById('pubReviewTextInput');
  if (reviewText) {
    reviewText.addEventListener('input', () => {
      document.getElementById('reviewCharCount').textContent = `${reviewText.value.length} / 500`;
    });
  }

  // Review submit form
  const reviewForm = document.getElementById('pubReviewForm');
  if (reviewForm) {
    reviewForm.addEventListener('submit', handlePostAuthorReview);
  }

  // Admin Badge assignment buttons
  const saveBadgeBtn = document.getElementById('adminSaveBadgeBtn');
  if (saveBadgeBtn) {
    saveBadgeBtn.addEventListener('click', () => handleAdminAssignBadge());
  }

  const clearBadgeBtn = document.getElementById('adminClearBadgeBtn');
  if (clearBadgeBtn) {
    clearBadgeBtn.addEventListener('click', () => handleAdminAssignBadge(''));
  }

  // Admin Badge Presets
  document.querySelectorAll('.badge-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const badge = chip.dataset.badge;
      document.getElementById('adminBadgeCustomInput').value = badge;
    });
  });
}

// Expose globally for inline onclick handlers
window.openPublicProfile = openPublicProfile;
window.handleDeleteAuthorReview = handleDeleteAuthorReview;

// Bootstrapping
document.addEventListener('DOMContentLoaded', async () => {
  DebugConsole.init();
  setupEventListeners();
  await checkAuthSession();
  await updatePlatformStats();
  await loadScriptsFeed();

  console.log('[PublicScriptKR] Client connected to host backend.');

  // Scroll Reveal Observer
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .stagger').forEach(el => {
    revealObserver.observe(el);
  });
});

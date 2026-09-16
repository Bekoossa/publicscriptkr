/**
 * PublicScriptKR — Frontend Client
 * Communicates directly with the Node.js Express backend running on the host PC.
 * Real user accounts, real database persistence, real likes & comments,
 * and file uploads saved to disk.
 */

// Global State
const State = {
  token: localStorage.getItem('pskr_token') || localStorage.getItem('pskr_auth_token') || null,
  currentUser: null,
  activeCategory: 'all',
  sortBy: 'newest',
  searchQuery: '',
  activeModalScript: null,
  uploadedImageDataUrl: null,
  selectedRegisterAvatar: null,
  publicTunnelUrl: 'https://publicscriptkr.vercel.app'
};

// Preset SVGs for stunning cyber covers
const PRESET_COVERS = {
  'neon-executor': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23020617"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="%236366f1"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="800" height="450" fill="url(%23g1)"/><circle cx="700" cy="80" r="180" fill="%236366f1" opacity="0.15" filter="blur(40px)"/><circle cx="100" cy="380" r="150" fill="%2306b6d4" opacity="0.15" filter="blur(40px)"/><path d="M 50 150 L 750 150" stroke="rgba(255,255,255,0.05)" stroke-width="1"/><path d="M 50 300 L 750 300" stroke="rgba(255,255,255,0.05)" stroke-width="1"/><rect x="80" y="70" width="640" height="310" rx="14" fill="rgba(15,23,42,0.8)" stroke="rgba(99,102,241,0.3)" stroke-width="2"/><text x="120" y="140" fill="%23a5b4fc" font-family="monospace" font-size="28" font-weight="bold">-- [ NEON LUA EXECUTOR ]</text><text x="120" y="190" fill="%2338bdf8" font-family="monospace" font-size="18">loadstring(game:HttpGet("https://publicscript.kr/v3"))()</text><text x="120" y="230" fill="%2334d399" font-family="monospace" font-size="16">&gt; Bypass: OK | Memory Hook: Injected</text><text x="120" y="270" fill="%23fb7185" font-family="monospace" font-size="16">&gt; FPS Unlocker: 240 FPS</text><rect x="120" y="310" width="140" height="32" rx="6" fill="url(%23glow)"/><text x="145" y="332" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="bold">RUN SCRIPT</text></svg>`,

  'cyber-hub': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23090d16"/><stop offset="100%" stop-color="%231e1b4b"/></linearGradient></defs><rect width="800" height="450" fill="url(%23bg)"/><circle cx="400" cy="225" r="160" fill="%23a855f7" opacity="0.2" filter="blur(60px)"/><rect x="90" y="60" width="620" height="330" rx="16" fill="rgba(10,15,28,0.85)" stroke="rgba(168,85,247,0.4)" stroke-width="2"/><circle cx="120" cy="95" r="6" fill="%23f43f5e"/><circle cx="140" cy="95" r="6" fill="%23f59e0b"/><circle cx="160" cy="95" r="6" fill="%2310b981"/><text x="120" y="160" fill="%23c084fc" font-family="monospace" font-size="32" font-weight="900">CYBER HUB v4.2</text><text x="120" y="210" fill="%2394a3b8" font-family="monospace" font-size="17">⚡ Auto Farm • Mastery • Fast Attack • Teleport</text><rect x="120" y="250" width="260" height="44" rx="8" fill="rgba(168,85,247,0.15)" stroke="rgba(168,85,247,0.4)"/><text x="140" y="278" fill="%23f3e8ff" font-family="monospace" font-size="15">Auto-Farm Mob: ENABLED</text><rect x="400" y="250" width="220" height="44" rx="8" fill="rgba(6,182,212,0.15)" stroke="rgba(6,182,212,0.4)"/><text x="420" y="278" fill="%23cffafe" font-family="monospace" font-size="15">Speed: 450 studs/s</text></svg>`,

  'esp-radar': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><radialGradient id="radarG" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%2310b981" stop-opacity="0.3"/><stop offset="100%" stop-color="%23022c22" stop-opacity="0"/></radialGradient></defs><rect width="800" height="450" fill="%2302140e"/><circle cx="400" cy="225" r="180" fill="url(%23radarG)" stroke="%23059669" stroke-width="1.5" stroke-dasharray="6,4"/><circle cx="400" cy="225" r="110" stroke="%2310b981" stroke-width="1"/><circle cx="400" cy="225" r="40" stroke="%2334d399" stroke-width="1"/><line x1="400" y1="20" x2="400" y2="430" stroke="%23047857" stroke-width="1"/><line x1="180" y1="225" x2="620" y2="225" stroke="%23047857" stroke-width="1"/><circle cx="480" cy="180" r="7" fill="%23f43f5e"/><text x="495" y="185" fill="%23fca5a5" font-family="monospace" font-size="13">Enemy (34m)</text><circle cx="340" cy="290" r="7" fill="%2338bdf8"/><text x="355" y="295" fill="%23bae6fd" font-family="monospace" font-size="13">Team (72m)</text><rect x="60" y="40" width="220" height="70" rx="10" fill="rgba(6,40,30,0.8)" stroke="%2310b981"/><text x="80" y="70" fill="%2334d399" font-family="monospace" font-size="16" font-weight="bold">ESP &amp; CHAMS</text><text x="80" y="94" fill="%236ee7b7" font-family="monospace" font-size="13">Box | Tracers | Distance</text></svg>`,

  'dark-config': `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><rect width="800" height="450" fill="%230b0f19"/><rect x="60" y="50" width="680" height="350" rx="12" fill="%230f172a" stroke="rgba(255,255,255,0.1)" stroke-width="1"/><text x="90" y="100" fill="%23f59e0b" font-family="monospace" font-size="20" font-weight="bold"># SERVER CONFIGURATION (.TXT)</text><text x="90" y="150" fill="%2394a3b8" font-family="monospace" font-size="15">[NetworkSettings]</text><text x="90" y="180" fill="%23e2e8f0" font-family="monospace" font-size="15">MaxConcurrentConnections = 1024</text><text x="90" y="210" fill="%23e2e8f0" font-family="monospace" font-size="15">RateLimitPerSecond = 50</text><text x="90" y="260" fill="%2394a3b8" font-family="monospace" font-size="15">[SecurityHooks]</text><text x="90" y="290" fill="%2310b981" font-family="monospace" font-size="15">AntiPacketInject = true</text><text x="90" y="320" fill="%2310b981" font-family="monospace" font-size="15">BypassDetectionLevel = "Aggressive"</text></svg>`
};

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80'
];

// ============================================================================
// API HELPER
// ============================================================================

async function api(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (State.token) {
    headers['Authorization'] = `Bearer ${State.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Произошла ошибка при обращении к серверу');
    }
    return data;
  } catch (err) {
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
  // 1. Immediately render cached user from localStorage (zero delay on reload)
  const cachedUserStr = localStorage.getItem('pskr_user');
  if (cachedUserStr) {
    try {
      const cached = JSON.parse(cachedUserStr);
      State.currentUser = cached;
      renderUserNav(cached);
    } catch (e) {}
  }

  // 2. If token is missing, attempt auto-restore from server
  if (!State.token) {
    try {
      const restoreRes = await api('/api/auth/session-restore');
      if (restoreRes && restoreRes.token && restoreRes.user) {
        State.token = restoreRes.token;
        State.currentUser = restoreRes.user;
        localStorage.setItem('pskr_token', restoreRes.token);
        localStorage.setItem('pskr_user', JSON.stringify(restoreRes.user));
        renderUserNav(restoreRes.user);
        return;
      }
    } catch (e) {}

    State.currentUser = null;
    renderUserNav(null);
    return;
  }

  // 3. Validate token with /api/auth/me
  try {
    const data = await api('/api/auth/me');
    if (data && data.user) {
      State.currentUser = data.user;
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
      renderUserNav(data.user);
    } else {
      // Check session restore fallback
      const restoreRes = await api('/api/auth/session-restore');
      if (restoreRes && restoreRes.token && restoreRes.user) {
        State.token = restoreRes.token;
        State.currentUser = restoreRes.user;
        localStorage.setItem('pskr_token', restoreRes.token);
        localStorage.setItem('pskr_user', JSON.stringify(restoreRes.user));
        renderUserNav(restoreRes.user);
      } else {
        logoutUser(false);
      }
    }
  } catch (err) {
    console.warn('Session check warning (keeping cached user):', err);
    // Do NOT wipe the token on temporary network errors!
    if (err && err.status === 401) {
      logoutUser(false);
    }
  }
}

function renderUserNav(user) {
  const guestWrap = document.getElementById('authGuestWrap');
  const userPill = document.getElementById('openProfileBtn');
  const notifBellWrap = document.getElementById('notifBellWrap');
  const modQueueBtn = document.getElementById('openModQueueBtn');

  if (user) {
    guestWrap.classList.add('hidden');
    userPill.classList.remove('hidden');
    document.getElementById('navUserAvatar').src = user.avatar || DEFAULT_AVATARS[0];
    document.getElementById('navUserName').textContent = user.username;
    
    const badgeEl = document.getElementById('navUserBadge');
    if (user.isModerator || user.badge === 'ADMIN') {
      badgeEl.className = 'user-pill-badge admin-badge';
      badgeEl.innerHTML = '<i class="fa-solid fa-shield-halved"></i> ADMIN';
    } else {
      badgeEl.className = 'user-pill-badge';
      badgeEl.textContent = user.badge || 'MEMBER';
    }

    // Kerryrbq Moderation Queue Button
    if (modQueueBtn) {
      if (user.isModerator || user.badge === 'ADMIN') {
        modQueueBtn.classList.remove('hidden');
        updateModerationQueueCount();
      } else {
        modQueueBtn.classList.add('hidden');
      }
    }

    if (notifBellWrap) {
      notifBellWrap.classList.remove('hidden');
      loadNotifications();
    }
  } else {
    guestWrap.classList.remove('hidden');
    userPill.classList.add('hidden');
    if (notifBellWrap) notifBellWrap.classList.add('hidden');
    if (modQueueBtn) modQueueBtn.classList.add('hidden');
  }
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
        if (status === 'pending' && State.currentUser && State.currentUser.isModerator) {
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
    const scripts = data.scripts || [];

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

      const coverSrc = script.coverImage || (PRESET_COVERS[script.presetCover] || PRESET_COVERS['cyber-hub']);
      const statusBadgeHtml = renderCardStatusBadge(script.status);

      const tagsHtml = (script.tags || []).slice(0, 3).map(tag => 
        `<span class="tag-pill">#${escapeHtml(tag)}</span>`
      ).join('');

      card.innerHTML = `
        <div class="script-card-thumb-wrap">
          <img src="${coverSrc}" alt="${escapeHtml(script.title)}" class="script-card-thumb" loading="lazy">
          ${statusBadgeHtml}
          <span class="script-thumb-badge">${(script.extension || 'lua').toUpperCase()}</span>
          <button class="script-thumb-quick-copy" title="Быстро скопировать код" data-action="quick-copy" data-id="${script.id}">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>

        <div class="script-card-body">
          <div class="script-card-author-row">
            <div class="card-author clickable-author" data-author-id="${script.authorId || ''}" title="Перейти в профиль ${escapeHtml(script.author)}">
              <img src="${script.authorAvatar || DEFAULT_AVATARS[0]}" alt="${escapeHtml(script.author)}" class="card-author-avatar clickable-author-avatar" data-author-id="${script.authorId || ''}">
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
          if (action === 'quick-copy') {
            e.stopPropagation();
            copyCode(script.code, script.title);
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

async function openScriptDetail(scriptId) {
  try {
    const data = await api(`/api/scripts/${scriptId}`);
    const script = data.script;
    State.activeModalScript = script;

    const modal = document.getElementById('scriptDetailModal');

    document.getElementById('detailLangBadge').textContent = (script.extension || 'lua').toUpperCase();
    document.getElementById('detailTitle').textContent = script.title;
    
    const authorAvatarEl = document.getElementById('detailAuthorAvatar');
    authorAvatarEl.src = script.authorAvatar || DEFAULT_AVATARS[0];
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
    if (State.currentUser && State.currentUser.isModerator) {
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
    const coverSrc = script.coverImage || (PRESET_COVERS[script.presetCover] || null);
    const coverTabBtn = document.getElementById('tabDetailCoverBtn');
    if (coverSrc) {
      document.getElementById('detailCoverImage').src = coverSrc;
      if (coverTabBtn) coverTabBtn.classList.remove('hidden');
    } else {
      if (coverTabBtn) coverTabBtn.classList.add('hidden');
    }

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
    const rowsHtml = lines.map((line, idx) => {
      const lineNum = idx + 1;
      const highlighted = isTxt ? highlightTxtLine(line) : highlightLuaLine(line);
      return `<div class="code-line"><span class="code-line-num" data-line="${lineNum}">${lineNum}</span><span class="code-line-text">${highlighted || '&nbsp;'}</span></div>`;
    }).join('');

    document.getElementById('detailCodeBox').innerHTML = rowsHtml;
    document.getElementById('copyBtnText').textContent = 'Скопировать код';

    // Switch to Code Tab by default (ensures code is immediately visible!)
    switchDetailTab('code');

    // Comments feed
    renderComments(script.comments || [], script.authorId);

    modal.classList.remove('hidden');
    updatePlatformStats();

  } catch (err) {
    showToast(err.message || 'Не удалось открыть скрипт', 'error');
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

async function handleModerateScript(status, targetScriptId = null) {
  if (!State.currentUser || !State.currentUser.isModerator) {
    showToast('Только модератор (Kerryrbq) может проверять скрипты', 'error');
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

  try {
    const res = await api(`/api/scripts/${scriptId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ status, note })
    });

    const label = status === 'verified' ? 'Проверено на запуск 🟢' : (status === 'rejected' ? 'Отклонено 🔴' : 'Не проверено 🟡');
    showToast(`Статус скрипта успешно изменен: ${label}`, status === 'verified' ? 'success' : (status === 'rejected' ? 'error' : 'info'));

    // Refresh modal details if it's currently opened for this script
    if (State.activeModalScript && State.activeModalScript.id === scriptId) {
      openScriptDetail(scriptId);
    }
    loadScriptsFeed();
    loadModerationQueue();
    updateModerationQueueCount();
    loadNotifications();
    updatePlatformStats();
  } catch (err) {
    showToast(err.message || 'Ошибка модерации', 'error');
  }
}

// Delete script permanently (Kerryrbq / Admin or Author)
async function handleDeleteScript(scriptId = null) {
  if (!State.currentUser || !State.currentUser.isModerator) {
    showToast('Удалять скрипты с сайта может только модератор Kerryrbq', 'error');
    return;
  }

  const targetId = scriptId || (State.activeModalScript && State.activeModalScript.id);
  if (!targetId) return;

  if (!confirm('Вы уверены, что хотите НАВСЕГДА удалить этот скрипт с сайта? Это действие нельзя отменить.')) {
    return;
  }

  try {
    await api(`/api/scripts/${targetId}`, {
      method: 'DELETE'
    });

    showToast('Скрипт успешно удален с платформы 🗑️', 'success');

    // If modal open for this script, close it
    if (State.activeModalScript && State.activeModalScript.id === targetId) {
      closeDetailModal();
    }

    loadScriptsFeed();
    loadModerationQueue();
    updateModerationQueueCount();
    updatePlatformStats();
  } catch (err) {
    showToast(err.message || 'Ошибка при удалении скрипта', 'error');
  }
}

// Moderation Queue functions
async function updateModerationQueueCount() {
  if (!State.currentUser || !State.currentUser.isModerator) return;
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
  if (!State.currentUser || !State.currentUser.isModerator) return;
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
function copyCode(code, title) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Код «${(title || 'скрипта').substring(0, 24)}» скопирован!`, 'success');
    const btnText = document.getElementById('copyBtnText');
    if (btnText) btnText.textContent = 'Скопировано!';
  }).catch(() => {
    showToast('Не удалось скопировать', 'error');
  });
}

function downloadScript(script) {
  if (!script) return;
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
    openAuthModal('login');
    return;
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

  const submitBtn = document.getElementById('publishScriptSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Сохранение на хост...';

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

    const data = await api('/api/scripts', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    showToast('Скрипт успешно опубликован на вашем хосте!', 'success');
    closeUploadModal();
    loadScriptsFeed();
    updatePlatformStats();
  } catch (err) {
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
    const data = await api('/api/scripts');
    const all = data.scripts || [];
    const myScripts = all.filter(s => s.authorId === State.currentUser.id || s.author === State.currentUser.username);

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
      listContainer.innerHTML = myScripts.map(script => `
        <div class="user-script-row" data-id="${script.id}">
          <div class="user-script-meta">
            <span class="modal-tag-badge">${(script.extension || 'lua').toUpperCase()}</span>
            <span class="user-script-title">${escapeHtml(script.title)}</span>
          </div>
          <div class="user-script-actions">
            <span class="card-stat"><i class="fa-regular fa-eye"></i> ${script.views || 0}</span>
            <span class="card-stat"><i class="fa-regular fa-heart"></i> ${script.likesCount || 0}</span>
            <button class="delete-script-btn" title="Удалить скрипт" data-id="${script.id}">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </div>
      `).join('');

      listContainer.querySelectorAll('.delete-script-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm('Вы уверены, что хотите удалить этот скрипт с хоста?')) return;
          try {
            await api(`/api/scripts/${btn.dataset.id}`, { method: 'DELETE' });
            showToast('Скрипт удален', 'info');
            openProfileModal();
            loadScriptsFeed();
            updatePlatformStats();
          } catch (err) {
            showToast(err.message || 'Ошибка удаления', 'error');
          }
        });
      });

      listContainer.querySelectorAll('.user-script-row').forEach(row => {
        row.addEventListener('click', (e) => {
          if (e.target.closest('.delete-script-btn')) return;
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

  document.getElementById('shareTunnelBtn').addEventListener('click', openTunnelModal);
  document.getElementById('closeTunnelModalBtn').addEventListener('click', closeTunnelModal);

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

  // Overlay click to close
  ['authModal', 'scriptDetailModal', 'uploadScriptModal', 'userProfileModal', 'tunnelShareModal', 'moderationQueueModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('click', (e) => {
        if (e.target === el) el.classList.add('hidden');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['authModal', 'scriptDetailModal', 'uploadScriptModal', 'userProfileModal', 'tunnelShareModal', 'moderationQueueModal', 'imageZoomOverlay'].forEach(id => {
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
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
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
      localStorage.setItem('pskr_user', JSON.stringify(data.user));
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
    } else if (user.isModerator) {
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
    if (State.currentUser && State.currentUser.isModerator) {
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

    const coverSrc = script.coverImage || (PRESET_COVERS[script.presetCover] || PRESET_COVERS['cyber-hub']);
    const statusBadgeHtml = renderCardStatusBadge(script.status);
    const tagsHtml = (script.tags || []).slice(0, 3).map(tag => `<span class="tag-pill">#${escapeHtml(tag)}</span>`).join('');

    card.innerHTML = `
      <div class="script-card-thumb-wrap">
        <img src="${coverSrc}" alt="${escapeHtml(script.title)}" class="script-card-thumb" loading="lazy">
        ${statusBadgeHtml}
        <span class="script-thumb-badge">${(script.extension || 'lua').toUpperCase()}</span>
        <button class="script-thumb-quick-copy" title="Быстро скопировать код" data-action="quick-copy" data-id="${script.id}">
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>

      <div class="script-card-body">
        <div class="script-card-author-row">
          <div class="card-author">
            <img src="${script.authorAvatar || DEFAULT_AVATARS[0]}" alt="${escapeHtml(script.author)}" class="card-author-avatar">
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
          <span class="card-open-btn">Проверить код <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'quick-copy') {
          e.stopPropagation();
          copyCode(script.code, script.title);
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

    const canDelete = State.currentUser && (State.currentUser.isModerator || State.currentUser.id === r.userId);
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
  if (!State.currentUser || !State.currentUser.isModerator) {
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
  setupEventListeners();
  await checkAuthSession();
  await updatePlatformStats();
  await loadScriptsFeed();

  // If visitor is NOT logged in, prompt Login / Registration
  if (!State.currentUser) {
    setTimeout(() => {
      openAuthModal('register');
    }, 400);
  }

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

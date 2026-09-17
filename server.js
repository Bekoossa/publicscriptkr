/**
 * PublicScriptKR — Official Node.js Backend Server
 * Stores all accounts, scripts, comments, views, and uploaded images directly
 * on the host computer in ./data/db.json and ./uploads/.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Directories
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '35mb' }));
app.use(express.urlencoded({ extended: true, limit: '35mb' }));

// Prevent browser caching stale HTML/JS/CSS
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Serve static frontend files and uploads
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(__dirname, { etag: false, maxAge: 0 }));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================================
// DATABASE LAYER (JSON FILE ON HOST COMPUTER)
// ============================================================================

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80'
];

const TOKEN_SECRET = 'pskr_jwt_super_secret_salt_2026_x89';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_pskr_salt_2026').digest('hex');
}

function generateToken(userId = 'u-anon') {
  const ts = Date.now();
  const data = `${userId}.${ts}`;
  const hmac = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('hex');
  return `${data}.${hmac}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length === 3) {
    const [userId, ts, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(`${userId}.${ts}`).digest('hex');
    if (sig === expectedSig) {
      return userId;
    }
  }
  return null;
}

function getInitialDB() {
  return {
    users: [],
    scripts: [],
    tokens: {}
  };
}

let db = null;

function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    db = getInitialDB();
    saveDB();
  } else {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      db = JSON.parse(content);
    } catch (err) {
      console.error('Error reading db.json, restoring defaults:', err);
      db = getInitialDB();
      saveDB();
    }
  }
  if (!db.notifications) db.notifications = [];
  if (db.users) {
    db.users.forEach(u => {
      if ((u.username || '').toLowerCase() === 'kerryrbq') {
        u.badge = 'ADMIN';
      }
    });
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    const seedPath = path.join(__dirname, 'lib', 'seed.json');
    if (fs.existsSync(path.dirname(seedPath))) {
      fs.writeFileSync(seedPath, JSON.stringify(db, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

loadDB();

// Helper: Save Base64 Image to Disk
function saveBase64Image(dataUrl, prefix = 'img') {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return '';
  try {
    const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return '';
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (e) {
    console.error('Failed to save base64 image:', e);
    return '';
  }
}

// Cookie Parser Helper
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (!rc) return list;
  rc.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    const name = parts.shift()?.trim();
    if (name) list[name] = decodeURIComponent(parts.join('=').trim());
  });
  return list;
}

// Authentication & Security Middleware
function authMiddleware(req, res, next) {
  // Extract client IP
  const forwarded = req.headers['x-forwarded-for'];
  const cfConnectingIp = req.headers['cf-connecting-ip'];
  const clientIp = cfConnectingIp || (forwarded ? forwarded.split(',')[0].trim() : (req.ip || req.connection?.remoteAddress || '127.0.0.1'));
  req.clientIp = clientIp;

  // Check IP ban
  if (!db.bannedIps) db.bannedIps = [];
  if (db.bannedIps.includes(clientIp)) {
    return res.status(403).json({
      error: '⛔ Ваш IP-адрес заблокирован администратором Kerryrbq за нарушение правил платформы.'
    });
  }

  const cookies = parseCookies(req);
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (cookies.pskr_token) {
    token = cookies.pskr_token;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  const userId = verifyToken(token) || (db.tokens ? db.tokens[token] : null);
  if (!userId) {
    req.user = null;
    return next();
  }
  let user = db.users.find(u => u.id === userId);
  if (!user && (userId === 'u-1789205573347' || userId === 'kerryrbq')) {
    user = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
  }
  if (user) {
    user.lastIp = clientIp;
    user.lastActiveAt = Date.now();
    db.lastActiveUserToken = token;
    // Check full account ban
    if (user.bans && user.bans.full) {
      req.user = null;
      return res.status(403).json({
        error: `⛔ Ваш аккаунт полностью заблокирован администратором! Причина: ${user.bans.reason || 'Нарушение правил'}`
      });
    }
  }
  req.user = user || null;
  next();
}

function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Пожалуйста, войдите в аккаунт или зарегистрируйтесь.' });
  }
  next();
}

function isModerator(user) {
  if (!user) return false;
  const uname = (user.username || '').toLowerCase();
  return user.badge === 'ADMIN' || user.badge === 'MODERATOR' || uname === 'kerryrbq';
}

function requireModerator(req, res, next) {
  if (!req.user || !isModerator(req.user)) {
    return res.status(403).json({ error: 'Доступ запрещен. Требуются права модератора.' });
  }
  next();
}

// Granular ban verification middleware
function requireNotBanned(type, label) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Пожалуйста, войдите в аккаунт.' });
    }
    if (req.user.bans && req.user.bans[type]) {
      const reason = req.user.bans.reason ? ` Причина: ${req.user.bans.reason}` : '';
      return res.status(403).json({
        error: `⛔ Администратор ограничил вам действие: «${label}».${reason}`
      });
    }
    next();
  };
}

app.use(authMiddleware);

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register new account
app.post('/api/auth/register', (req, res) => {
  const { username, password, avatar, bio } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Введите имя пользователя и пароль' });
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length < 3 || cleanUsername.length > 25) {
    return res.status(400).json({ error: 'Имя пользователя должно быть от 3 до 25 символов' });
  }
  if (password.length < 4) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 4 символов' });
  }

  // Check if username taken
  const exists = db.users.find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
  }

  let finalAvatar = avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
  if (finalAvatar.startsWith('data:image')) {
    finalAvatar = saveBase64Image(finalAvatar, 'avatar') || finalAvatar;
  }

  const newUser = {
    id: 'u-' + Date.now(),
    username: cleanUsername,
    passwordHash: hashPassword(password),
    avatar: finalAvatar,
    badge: 'MEMBER',
    bio: bio ? bio.trim() : 'Пользователь платформы PublicScriptKR.',
    createdAt: Date.now()
  };

  db.users.push(newUser);

  // Generate Token
  const token = generateToken(newUser.id);
  if (!db.tokens) db.tokens = {};
  db.tokens[token] = newUser.id;
  db.lastActiveUserToken = token;
  newUser.lastIp = req.clientIp;
  newUser.lastActiveAt = Date.now();
  saveDB();

  res.cookie('pskr_token', token, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'Lax',
    path: '/'
  });

  const userSafe = { ...newUser, isModerator: isModerator(newUser) };
  delete userSafe.passwordHash;

  res.status(201).json({
    message: 'Аккаунт успешно создан!',
    user: userSafe,
    token
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Укажите логин и пароль' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
  }

  const token = generateToken(user.id);
  if (!db.tokens) db.tokens = {};
  db.tokens[token] = user.id;
  db.lastActiveUserToken = token;
  user.lastIp = req.clientIp;
  user.lastActiveAt = Date.now();
  saveDB();

  res.cookie('pskr_token', token, {
    maxAge: 365 * 24 * 60 * 60 * 1000,
    httpOnly: false,
    sameSite: 'Lax',
    path: '/'
  });

  const userSafe = { ...user, isModerator: isModerator(user) };
  delete userSafe.passwordHash;

  res.json({
    message: 'Вход выполнен успешно!',
    user: userSafe,
    token
  });
});

// POST /api/auth/refresh-token
app.post('/api/auth/refresh-token', (req, res) => {
  const { username, userId } = req.body || {};
  let targetUser = req.user;
  if (!targetUser && username) {
    targetUser = db.users.find(u => (u.username || '').toLowerCase() === username.trim().toLowerCase());
  } else if (!targetUser && userId) {
    targetUser = db.users.find(u => u.id === userId);
  }
  if (!targetUser && username && username.toLowerCase() === 'kerryrbq') {
    targetUser = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
  }
  if (!targetUser && db.lastActiveUserToken) {
    const uid = verifyToken(db.lastActiveUserToken) || (db.tokens ? db.tokens[db.lastActiveUserToken] : null);
    targetUser = db.users.find(u => u.id === uid);
  }
  if (targetUser) {
    const freshToken = generateToken(targetUser.id);
    if (!db.tokens) db.tokens = {};
    db.tokens[freshToken] = targetUser.id;
    db.lastActiveUserToken = freshToken;
    targetUser.lastActiveAt = Date.now();
    saveDB();

    res.cookie('pskr_token', freshToken, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'Lax',
      path: '/'
    });

    const userSafe = { ...targetUser, isModerator: isModerator(targetUser) };
    delete userSafe.passwordHash;
    return res.json({ token: freshToken, user: userSafe, refreshed: true });
  }
  return res.status(401).json({ error: 'Cannot refresh token' });
});

// GET /api/debug/diagnostics
app.get('/api/debug/diagnostics', (req, res) => {
  res.json({
    status: 'online',
    timestamp: Date.now(),
    usersCount: (db.users || []).length,
    scriptsCount: (db.scripts || []).length,
    authStatus: req.user ? 'authenticated' : 'anonymous',
    currentUser: req.user ? { id: req.user.id, username: req.user.username, badge: req.user.badge } : null,
    clientIp: req.clientIp
  });
});

// Session Restore (auto-login on reload / reopen / cross-domain launch)
app.get('/api/auth/session-restore', (req, res) => {
  // 1. If req.user is already authenticated via Bearer token or Cookie
  if (req.user) {
    const freshToken = generateToken(req.user.id);
    if (!db.tokens) db.tokens = {};
    db.tokens[freshToken] = req.user.id;
    db.lastActiveUserToken = freshToken;
    saveDB();
    res.cookie('pskr_token', freshToken, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'Lax',
      path: '/'
    });
    const userSafe = { ...req.user, isModerator: isModerator(req.user) };
    delete userSafe.passwordHash;
    return res.json({ token: freshToken, user: userSafe });
  }

  // 2. Check if request is from localhost / host machine
  const isLocalhost = req.clientIp === '127.0.0.1' || req.clientIp === '::1' || req.clientIp === '::ffff:127.0.0.1' || req.clientIp === 'localhost';
  let candidateUser = null;

  if (isLocalhost && db.lastActiveUserToken) {
    const uid = verifyToken(db.lastActiveUserToken) || (db.tokens ? db.tokens[db.lastActiveUserToken] : null);
    candidateUser = db.users.find(u => u.id === uid);
    if (!candidateUser) {
      candidateUser = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
    }
  }

  // 3. Fallback: match by lastIp (if within same IP and not banned)
  if (!candidateUser && req.clientIp && req.clientIp !== '127.0.0.1') {
    const matchingUsers = (db.users || []).filter(u => u.lastIp === req.clientIp && (!u.bans || !u.bans.full));
    if (matchingUsers.length === 1) {
      candidateUser = matchingUsers[0];
    }
  }

  if (candidateUser) {
    const freshToken = generateToken(candidateUser.id);
    if (!db.tokens) db.tokens = {};
    db.tokens[freshToken] = candidateUser.id;
    db.lastActiveUserToken = freshToken;
    candidateUser.lastActiveAt = Date.now();
    saveDB();
    res.cookie('pskr_token', freshToken, {
      maxAge: 365 * 24 * 60 * 60 * 1000,
      httpOnly: false,
      sameSite: 'Lax',
      path: '/'
    });
    const userSafe = { ...candidateUser, isModerator: isModerator(candidateUser) };
    delete userSafe.passwordHash;
    return res.json({ token: freshToken, user: userSafe });
  }

  res.json({ user: null, token: null });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (cookies.pskr_token) {
    token = cookies.pskr_token;
  }
  if (token) {
    if (db.tokens) delete db.tokens[token];
    if (db.lastActiveUserToken === token) delete db.lastActiveUserToken;
    saveDB();
  }
  res.clearCookie('pskr_token', { path: '/' });
  res.json({ success: true });
});

// Get Current User
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  const userSafe = { ...req.user, isModerator: isModerator(req.user) };
  delete userSafe.passwordHash;
  res.json({ user: userSafe });
});

// Update Profile
app.put('/api/auth/profile', requireAuth, (req, res) => {
  const { bio, avatar } = req.body;
  const user = req.user;

  if (bio !== undefined) user.bio = bio.trim().substring(0, 160);
  if (avatar) {
    if (avatar.startsWith('data:image')) {
      user.avatar = saveBase64Image(avatar, 'avatar') || user.avatar;
    } else {
      user.avatar = avatar;
    }
  }

  // Update in scripts and comments
  db.scripts.forEach(s => {
    if (s.authorId === user.id) {
      s.authorAvatar = user.avatar;
    }
    if (s.comments) {
      s.comments.forEach(c => {
        if (c.userId === user.id) {
          c.avatar = user.avatar;
        }
      });
    }
  });

  saveDB();

  const userSafe = { ...user };
  delete userSafe.passwordHash;
  res.json({ message: 'Профиль обновлен', user: userSafe });
});

// ============================================================================
// SCRIPTS API ROUTES
// ============================================================================

// Get Scripts (with category, search, and sorting)
// Get Scripts (with category, search, and sorting)
app.get('/api/scripts', (req, res) => {
  const { category, search, sort, status, authorId, all } = req.query;
  let list = [...db.scripts];

  // Pre-moderation: public catalog only shows verified scripts.
  // Kerryrbq/moderators or explicit status queries can see all.
  if (status) {
    list = list.filter(s => (s.status || 'pending') === status);
  } else if (!all) {
    if (authorId) {
      list = list.filter(s => s.authorId === authorId);
    } else if (!req.user || !isModerator(req.user)) {
      list = list.filter(s => (s.status || 'pending') === 'verified');
    }
  }

  // Category filter
  if (category && category !== 'all') {
    list = list.filter(s => {
      if (category === 'lua') return s.extension === 'lua' || s.category === 'lua';
      if (category === 'txt') return s.extension === 'txt' || s.category === 'txt';
      return s.category === category;
    });
  }

  // Search filter
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(s => {
      const inTitle = (s.title || '').toLowerCase().includes(q);
      const inDesc = (s.description || '').toLowerCase().includes(q);
      const inAuthor = (s.author || '').toLowerCase().includes(q);
      const inTags = (s.tags || []).some(t => t.toLowerCase().includes(q));
      return inTitle || inDesc || inAuthor || inTags;
    });
  }

  // Sort
  if (sort === 'popular') {
    list.sort((a, b) => (b.views || 0) - (a.views || 0));
  } else if (sort === 'liked') {
    list.sort((a, b) => ((b.likes || []).length) - ((a.likes || []).length));
  } else if (sort === 'comments') {
    list.sort((a, b) => ((b.comments || []).length) - ((a.comments || []).length));
  } else {
    // Newest
    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }

  // Format response (count likes, check if current user liked)
  const currentUserId = req.user ? req.user.id : null;
  const result = list.map(s => {
    const userRatingObj = (s.ratings || []).find(r => r.userId === currentUserId);
    return {
      ...s,
      likesCount: (s.likes || []).length,
      isLiked: currentUserId ? (s.likes || []).includes(currentUserId) : false,
      commentsCount: (s.comments || []).length,
      rating: typeof s.rating === 'number' ? s.rating : 5.0,
      ratingsCount: (s.ratings || []).length,
      userRating: userRatingObj ? userRatingObj.rating : null
    };
  });

  res.json({ scripts: result });
});

// Get Single Script Detail (Increments Real Views on Disk)
app.get('/api/scripts/:id', (req, res) => {
  const script = db.scripts.find(s => s.id === req.params.id);
  if (!script) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  // Real View count tracker
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'client';
  if (!script.viewedIps) script.viewedIps = {};
  const lastViewTime = script.viewedIps[clientIp] || 0;
  // Count view once every 5 minutes per IP
  if (Date.now() - lastViewTime > 5 * 60 * 1000) {
    script.views = (script.views || 0) + 1;
    script.viewedIps[clientIp] = Date.now();
    saveDB();
  }

  const currentUserId = req.user ? req.user.id : null;
  const userRatingObj = (script.ratings || []).find(r => r.userId === currentUserId);
  const scriptDetail = {
    ...script,
    likesCount: (script.likes || []).length,
    isLiked: currentUserId ? (script.likes || []).includes(currentUserId) : false,
    commentsCount: (script.comments || []).length,
    rating: typeof script.rating === 'number' ? script.rating : 5.0,
    ratingsCount: (script.ratings || []).length,
    userRating: userRatingObj ? userRatingObj.rating : null
  };

  res.json({ script: scriptDetail });
});

// Upload New Script
app.post('/api/scripts', requireAuth, (req, res) => {
  const { title, category, extension, code, description, tags, imageBase64, presetCover } = req.body;

  if (!title || !code) {
    return res.status(400).json({ error: 'Название и код скрипта обязательны' });
  }

  let coverImage = '';
  if (imageBase64 && imageBase64.startsWith('data:image')) {
    coverImage = saveBase64Image(imageBase64, 'script_cover');
  }

  const tagsList = Array.isArray(tags)
    ? tags
    : (typeof tags === 'string'
      ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
      : [category || 'lua']);

  const newScript = {
    id: 'script-' + Date.now(),
    title: title.trim(),
    authorId: req.user.id,
    author: req.user.username,
    authorAvatar: req.user.avatar,
    category: category || 'lua',
    extension: extension || 'lua',
    status: isModerator(req.user) ? 'verified' : 'pending',
    createdAt: Date.now(),
    coverImage: coverImage,
    presetCover: presetCover || 'cyber-hub',
    views: 1,
    viewedIps: {},
    likes: [],
    tags: tagsList,
    description: description ? description.trim() : 'Описание отсутствует.',
    code: code.trim(),
    comments: []
  };

  db.scripts.unshift(newScript);

  // If uploaded by regular user, create admin notification for Kerryrbq!
  const isMod = isModerator(req.user);
  if (!isMod) {
    const kerryUser = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
    if (kerryUser) {
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({
        id: 'n-' + Date.now(),
        userId: kerryUser.id,
        scriptId: newScript.id,
        scriptTitle: newScript.title,
        title: 'Новый скрипт на проверку ⏳',
        message: `Пользователь ${req.user.username} отправил скрипт «${newScript.title}». Проверьте его в окне модерации!`,
        status: 'pending',
        isRead: false,
        createdAt: Date.now()
      });
    }
  }

  saveDB();

  res.status(201).json({
    message: isMod ? 'Скрипт успешно опубликован на сайте!' : 'Скрипт отправлен модератору на проверку! Он появится в каталоге после подтверждения.',
    script: {
      ...newScript,
      likesCount: 0,
      isLiked: false,
      commentsCount: 0
    }
  });
});

// Toggle Like (Real DB Like tied to User Account)
app.post('/api/scripts/:id/like', requireAuth, (req, res) => {
  const script = db.scripts.find(s => s.id === req.params.id);
  if (!script) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  if (!script.likes) script.likes = [];
  const userId = req.user.id;
  const idx = script.likes.indexOf(userId);

  let isLiked = false;
  if (idx === -1) {
    script.likes.push(userId);
    isLiked = true;
  } else {
    script.likes.splice(idx, 1);
    isLiked = false;
  }

  saveDB();

  res.json({
    isLiked,
    likesCount: script.likes.length,
    message: isLiked ? 'Лайк поставлен!' : 'Лайк убран'
  });
});

// Rate Script (1 - 5 stars ⭐)
app.post('/api/scripts/:id/rate', requireAuth, (req, res) => {
  const script = db.scripts.find(s => s.id === req.params.id);
  if (!script) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  let rating = parseInt(req.body.rating, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Оценка должна быть целым числом от 1 до 5 звёзд' });
  }

  if (!script.ratings) script.ratings = [];
  const existingIdx = script.ratings.findIndex(r => r.userId === req.user.id);
  if (existingIdx !== -1) {
    script.ratings[existingIdx].rating = rating;
    script.ratings[existingIdx].updatedAt = Date.now();
  } else {
    script.ratings.push({
      userId: req.user.id,
      rating,
      createdAt: Date.now()
    });
  }

  // Recalculate average rating
  const sum = script.ratings.reduce((acc, r) => acc + r.rating, 0);
  script.rating = parseFloat((sum / script.ratings.length).toFixed(1));
  script.ratingsCount = script.ratings.length;

  // Send in-app notification to script author
  if (script.authorId && script.authorId !== req.user.id) {
    if (!db.notifications) db.notifications = [];
    db.notifications.unshift({
      id: `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: script.authorId,
      type: 'script_rated',
      title: 'Новая оценка скрипта ⭐',
      message: `Пользователь ${req.user.username} оценил ваш скрипт «${script.title}» на ${rating} из 5 звёзд!`,
      scriptId: script.id,
      read: false,
      createdAt: Date.now()
    });
  }

  saveDB();

  res.json({
    message: `Вы поставили ${rating} звёзд скрипту! ⭐`,
    rating: script.rating,
    ratingsCount: script.ratingsCount,
    userRating: rating
  });
});

// Post Comment (Real DB Comment)
app.post('/api/scripts/:id/comments', requireAuth, (req, res) => {
  const script = db.scripts.find(s => s.id === req.params.id);
  if (!script) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Текст комментария не может быть пустым' });
  }

  const newComment = {
    id: 'c-' + Date.now(),
    userId: req.user.id,
    author: req.user.username,
    avatar: req.user.avatar,
    text: text.trim().substring(0, 1000),
    createdAt: Date.now()
  };

  if (!script.comments) script.comments = [];
  script.comments.unshift(newComment);
  saveDB();

  res.status(201).json({
    message: 'Комментарий опубликован',
    comment: newComment,
    commentsCount: script.comments.length
  });
});

// ============================================================================
// MODERATION & NOTIFICATIONS
// ============================================================================

// Moderate Script (Admin / Moderator only: Kerryrbq)
app.post('/api/scripts/:id/moderate', requireAuth, requireModerator, (req, res) => {
  const { status, note } = req.body;
  const allowed = ['verified', 'pending', 'rejected'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Недопустимый статус. Разрешены: verified, pending, rejected' });
  }

  const script = db.scripts.find(s => s.id === req.params.id);
  if (!script) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  script.status = status;
  script.moderatedBy = req.user.username;
  script.moderatedAt = Date.now();
  if (note !== undefined) script.moderatorNote = note ? note.trim() : '';

  // Create notification for script author
  if (!db.notifications) db.notifications = [];

  let statusLabel = '';
  let statusIcon = '';
  if (status === 'verified') {
    statusLabel = 'одобрен и проверен на запуск 🟢 (Проверено на запуск)';
    statusIcon = '✅';
  } else if (status === 'rejected') {
    statusLabel = 'отклонен модератором 🔴 (Отказано)' + (script.moderatorNote ? `: "${script.moderatorNote}"` : '');
    statusIcon = '❌';
  } else {
    statusLabel = 'переведен в статус 🟡 (Не проверено на запуск)';
    statusIcon = '⏳';
  }

  db.notifications.unshift({
    id: 'n-' + Date.now(),
    userId: script.authorId,
    scriptId: script.id,
    scriptTitle: script.title,
    title: `Статус скрипта изменен ${statusIcon}`,
    message: `Ваш скрипт «${script.title}» ${statusLabel}`,
    status,
    isRead: false,
    createdAt: Date.now()
  });

  saveDB();

  const currentUserId = req.user ? req.user.id : null;
  res.json({
    message: `Статус скрипта успешно изменен: ${status === 'verified' ? 'Проверено на запуск' : (status === 'rejected' ? 'Отклонено' : 'Не проверено')}`,
    script: {
      ...script,
      likesCount: (script.likes || []).length,
      isLiked: currentUserId ? (script.likes || []).includes(currentUserId) : false,
      commentsCount: (script.comments || []).length
    }
  });
});

// Get User Notifications
app.get('/api/notifications', requireAuth, (req, res) => {
  if (!db.notifications) db.notifications = [];
  const list = db.notifications.filter(n => n.userId === req.user.id);
  list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  const unreadCount = list.filter(n => !n.isRead).length;
  res.json({ notifications: list, unreadCount });
});

// Mark all notifications as read
app.post('/api/notifications/read-all', requireAuth, (req, res) => {
  if (!db.notifications) db.notifications = [];
  db.notifications.forEach(n => {
    if (n.userId === req.user.id) {
      n.isRead = true;
    }
  });
  saveDB();
  res.json({ message: 'Все уведомления прочитаны' });
});

// Get Moderation Queue (Kerryrbq / Admins only)
app.get('/api/moderation/queue', requireAuth, requireModerator, (req, res) => {
  const pending = db.scripts.filter(s => (s.status || 'pending') === 'pending');
  pending.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({
    queue: pending,
    pendingCount: pending.length
  });
});

// Delete Script (Author or Kerryrbq/Moderator)
app.delete('/api/scripts/:id', requireAuth, (req, res) => {
  const idx = db.scripts.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Скрипт не найден' });
  }

  const script = db.scripts[idx];
  if (script.authorId !== req.user.id && !isModerator(req.user)) {
    return res.status(403).json({ error: 'У вас нет прав на удаление этого скрипта' });
  }

  db.scripts.splice(idx, 1);
  if (db.notifications) {
    db.notifications = db.notifications.filter(n => n.scriptId !== req.params.id);
  }
  saveDB();

  res.json({ message: 'Скрипт успешно удален с сервера' });
});

// ============================================================================
// PUBLIC USER PROFILES, BADGE ASSIGNMENT & REVIEWS
// ============================================================================

// Get Public User Profile with stats, scripts, and reviews
app.get('/api/users/:id', (req, res) => {
  const targetId = req.params.id;
  const user = db.users.find(u => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const userSafe = { ...user, isModerator: isModerator(user) };
  delete userSafe.passwordHash;

  // Scripts by this user
  const isReqMod = req.user && isModerator(req.user);
  const isSelf = req.user && req.user.id === user.id;

  const userScripts = db.scripts.filter(s => {
    if (s.authorId !== user.id) return false;
    // Moderators and author can see pending/rejected; public sees verified
    if (isReqMod || isSelf) return true;
    return s.status === 'verified';
  });

  const totalLikes = userScripts.reduce((acc, s) => acc + ((s.likes || []).length), 0);
  const totalViews = userScripts.reduce((acc, s) => acc + (s.views || 0), 0);

  // Reviews for this user
  if (!db.userReviews) db.userReviews = [];
  const reviews = db.userReviews.filter(r => r.targetUserId === user.id);
  reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0) / reviews.length).toFixed(1)
    : null;

  const currentUserId = req.user ? req.user.id : null;
  const mappedScripts = userScripts.map(s => {
    const userRatingObj = (s.ratings || []).find(r => r.userId === currentUserId);
    return {
      ...s,
      likesCount: (s.likes || []).length,
      isLiked: currentUserId ? (s.likes || []).includes(currentUserId) : false,
      commentsCount: (s.comments || []).length,
      rating: typeof s.rating === 'number' ? s.rating : 5.0,
      ratingsCount: (s.ratings || []).length,
      userRating: userRatingObj ? userRatingObj.rating : null
    };
  });

  res.json({
    user: userSafe,
    stats: {
      scriptsCount: userScripts.length,
      totalLikes,
      totalViews,
      reviewsCount: reviews.length,
      averageRating: averageRating ? Number(averageRating) : 5.0
    },
    scripts: mappedScripts,
    reviews
  });
});

// Admin Badge/Tag Assignment (Kerryrbq / Moderators only)
app.put('/api/users/:id/badge', requireAuth, requireModerator, (req, res) => {
  const targetId = req.params.id;
  const { badge } = req.body;

  if (!badge || typeof badge !== 'string') {
    return res.status(400).json({ error: 'Укажите название тега / ранга' });
  }

  const cleanBadge = badge.trim().substring(0, 30).toUpperCase();
  const user = db.users.find(u => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  user.badge = cleanBadge;

  // Send notification to the user
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: 'n-' + Date.now(),
    userId: user.id,
    scriptId: null,
    scriptTitle: null,
    title: 'Вам выдан новый тег! 🏷️',
    message: `Администратор Kerryrbq присвоил вашему профилю официальный статус: «${cleanBadge}»`,
    status: 'verified',
    isRead: false,
    createdAt: Date.now()
  });

  saveDB();

  res.json({
    message: `Тег успешно изменен на «${cleanBadge}»!`,
    badge: cleanBadge
  });
});

// Post a Review for a User
app.post('/api/users/:id/reviews', requireAuth, (req, res) => {
  const targetId = req.params.id;
  const { rating, text } = req.body;

  const user = db.users.find(u => u.id === targetId || u.username.toLowerCase() === targetId.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (req.user.id === user.id) {
    return res.status(400).json({ error: 'Вы не можете оставить отзыв на самого себя' });
  }

  const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const reviewText = (text || '').trim();
  if (!reviewText) {
    return res.status(400).json({ error: 'Напишите текст отзыва' });
  }

  if (!db.userReviews) db.userReviews = [];

  const newReview = {
    id: 'rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    targetUserId: user.id,
    authorId: req.user.id,
    authorName: req.user.username,
    authorAvatar: req.user.avatar || DEFAULT_AVATARS[0],
    rating: numRating,
    text: reviewText.substring(0, 500),
    createdAt: Date.now()
  };

  db.userReviews.unshift(newReview);

  // Send notification to target user
  if (!db.notifications) db.notifications = [];
  db.notifications.unshift({
    id: 'n-' + Date.now(),
    userId: user.id,
    scriptId: null,
    scriptTitle: null,
    title: 'Новый отзыв о вас ⭐',
    message: `Пользователь ${req.user.username} оставил отзыв с оценкой ${numRating}/5: "${reviewText.substring(0, 60)}..."`,
    status: 'verified',
    isRead: false,
    createdAt: Date.now()
  });

  saveDB();

  res.status(201).json({
    message: 'Отзыв успешно опубликован!',
    review: newReview
  });
});

// Delete a Review (Moderator or Author of review)
app.delete('/api/users/:id/reviews/:reviewId', requireAuth, (req, res) => {
  const { id: targetId, reviewId } = req.params;

  if (!db.userReviews) db.userReviews = [];
  const idx = db.userReviews.findIndex(r => r.id === reviewId && r.targetUserId === targetId);

  if (idx === -1) {
    return res.status(404).json({ error: 'Отзыв не найден' });
  }

  const review = db.userReviews[idx];
  if (review.authorId !== req.user.id && !isModerator(req.user)) {
    return res.status(403).json({ error: 'У вас нет прав на удаление этого отзыва' });
  }

  db.userReviews.splice(idx, 1);
  saveDB();

  res.json({ message: 'Отзыв успешно удален' });
});

// Global Platform Stats
app.get('/api/stats', (req, res) => {
  const totalUsers = db.users.length;
  const totalScripts = db.scripts.length;
  const totalViews = db.scripts.reduce((acc, s) => acc + (s.views || 0), 0);
  const totalLikes = db.scripts.reduce((acc, s) => acc + ((s.likes || []).length), 0);

  res.json({
    totalUsers,
    totalScripts,
    totalViews,
    totalLikes
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`===================================================`);
  console.log(`[PublicScriptKR] Server started successfully!`);
  console.log(`Local Access:  http://localhost:${PORT}`);
  console.log(`Database File: ${DB_FILE}`);
  console.log(`Uploads Dir:   ${UPLOADS_DIR}`);
  console.log(`===================================================`);
});

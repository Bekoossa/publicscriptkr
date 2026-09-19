const { createHash, randomBytes } = require('crypto');
const { kv } = require('@vercel/kv');
const { DEFAULT_AVATARS, hashPassword, generateToken, verifyToken, getInitialDB, getDB, saveDB, isModerator } = require('../lib/db');

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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = new URL(req.url, `https://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method;

  try {
    const db = await getDB(kv);

    // Auth middleware (stateless HMAC verification + cookies + in-memory fallback + client header healing)
    req.user = null;
    const cookies = parseCookies(req);
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookies.pskr_token) {
      token = cookies.pskr_token;
    }

    const headerUsername = req.headers['x-user-username'] ? decodeURIComponent(req.headers['x-user-username']).trim() : null;
    const headerUserId = req.headers['x-user-id'] ? decodeURIComponent(req.headers['x-user-id']).trim() : null;

    if (token) {
      const verifiedUserId = verifyToken(token) || (db.tokens ? db.tokens[token] : null);
      if (verifiedUserId) {
        let user = db.users.find(u => u.id === verifiedUserId || (u.username || '').toLowerCase() === (verifiedUserId || '').toLowerCase());
        if (!user && (verifiedUserId === 'u-1789205573347' || (verifiedUserId || '').toLowerCase() === 'kerryrbq')) {
          user = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
        }
        if (!user) {
          const isKerry = (verifiedUserId === 'u-1789205573347' || (verifiedUserId || '').toLowerCase() === 'kerryrbq' || (headerUsername || '').toLowerCase() === 'kerryrbq');
          const uname = headerUsername || (isKerry ? 'Kerryrbq' : (verifiedUserId.startsWith('u-') ? `User_${verifiedUserId.slice(-4)}` : verifiedUserId));
          user = {
            id: verifiedUserId,
            username: uname,
            avatar: DEFAULT_AVATARS[0],
            badge: isKerry ? 'ADMIN' : 'MEMBER',
            createdAt: Date.now()
          };
          if (!db.users) db.users = [];
          db.users.push(user);
          await saveDB(kv);
        }
        if (user && !(user.bans && user.bans.full)) {
          req.user = user;
        }
      }
    }

    if (!req.user && (headerUsername || headerUserId)) {
      let user = db.users.find(u => (headerUserId && u.id === headerUserId) || (headerUsername && (u.username || '').toLowerCase() === headerUsername.toLowerCase()));
      if (!user && headerUsername) {
        const isKerry = headerUsername.toLowerCase() === 'kerryrbq';
        user = {
          id: headerUserId || `u-${Date.now()}`,
          username: headerUsername,
          avatar: DEFAULT_AVATARS[0],
          badge: isKerry ? 'ADMIN' : 'MEMBER',
          createdAt: Date.now()
        };
        if (!db.users) db.users = [];
        db.users.push(user);
        await saveDB(kv);
      }
      if (user && !(user.bans && user.bans.full)) {
        req.user = user;
      }
    }

    // IP ban check
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket?.remoteAddress || '127.0.0.1');
    if (db.bannedIps && db.bannedIps.includes(clientIp)) {
      return res.status(403).json({ error: 'IP blocked' });
    }

    // ===== ROUTES =====

    // POST /api/auth/register
    if (path === '/api/auth/register' && method === 'POST') {
      const { username, password, avatar, bio } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      const clean = username.trim();
      if (clean.length < 3 || clean.length > 25) return res.status(400).json({ error: 'Username must be 3-25 characters' });
      if (password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
      if (db.users.find(u => u.username.toLowerCase() === clean.toLowerCase())) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      let finalAvatar = avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
      const newUser = {
        id: 'u-' + Date.now(),
        username: clean,
        passwordHash: hashPassword(password),
        avatar: finalAvatar,
        badge: clean.toLowerCase() === 'kerryrbq' ? 'ADMIN' : 'MEMBER',
        bio: bio ? bio.trim() : 'PublicScriptKR user.',
        createdAt: Date.now()
      };
      db.users.push(newUser);
      const token = generateToken(newUser.id);
      if (!db.tokens) db.tokens = {};
      db.tokens[token] = newUser.id;
      db.lastActiveUserToken = token;
      newUser.lastIp = clientIp;
      newUser.lastActiveAt = Date.now();
      await saveDB(kv);
      res.setHeader('Set-Cookie', `pskr_token=${token}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      const safe = { ...newUser, isModerator: isModerator(newUser) };
      delete safe.passwordHash;
      return res.status(201).json({ message: 'Account created!', user: safe, token });
    }

    // POST /api/auth/login
    if (path === '/api/auth/login' && method === 'POST') {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
      const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
      if (!user || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = generateToken(user.id);
      if (!db.tokens) db.tokens = {};
      db.tokens[token] = user.id;
      db.lastActiveUserToken = token;
      user.lastIp = clientIp;
      user.lastActiveAt = Date.now();
      await saveDB(kv);
      res.setHeader('Set-Cookie', `pskr_token=${token}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
      const safe = { ...user, isModerator: isModerator(user) };
      delete safe.passwordHash;
      return res.json({ message: 'Login successful!', user: safe, token });
    }

    // GET /api/auth/session-restore
    if (path === '/api/auth/session-restore' && method === 'GET') {
      if (req.user) {
        const freshToken = generateToken(req.user.id);
        if (!db.tokens) db.tokens = {};
        db.tokens[freshToken] = req.user.id;
        db.lastActiveUserToken = freshToken;
        await saveDB(kv);
        res.setHeader('Set-Cookie', `pskr_token=${freshToken}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
        const safe = { ...req.user, isModerator: isModerator(req.user) };
        delete safe.passwordHash;
        return res.json({ token: freshToken, user: safe });
      }

      return res.json({ user: null, token: null });
    }

    // POST /api/auth/logout
    if (path === '/api/auth/logout' && method === 'POST') {
      const authHeader = req.headers.authorization;
      const cookies = parseCookies(req);
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
      else if (cookies.pskr_token) token = cookies.pskr_token;
      if (token && db.tokens) {
        delete db.tokens[token];
        if (db.lastActiveUserToken === token) delete db.lastActiveUserToken;
        await saveDB(kv);
      }
      res.setHeader('Set-Cookie', 'pskr_token=; Path=/; Max-Age=0; SameSite=Lax; Secure');
      return res.json({ success: true });
    }

    // POST /api/auth/refresh-token
    if (path === '/api/auth/refresh-token' && method === 'POST') {
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
      if (targetUser) {
        const freshToken = generateToken(targetUser.id);
        if (!db.tokens) db.tokens = {};
        db.tokens[freshToken] = targetUser.id;
        db.lastActiveUserToken = freshToken;
        await saveDB(kv);
        res.setHeader('Set-Cookie', `pskr_token=${freshToken}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`);
        const safe = { ...targetUser, isModerator: isModerator(targetUser) };
        delete safe.passwordHash;
        return res.json({ token: freshToken, user: safe, refreshed: true });
      }
      return res.status(401).json({ error: 'Cannot refresh token' });
    }

    // GET /api/debug/diagnostics
    if (path === '/api/debug/diagnostics' && method === 'GET') {
      return res.json({
        status: 'online',
        timestamp: Date.now(),
        usersCount: (db.users || []).length,
        scriptsCount: (db.scripts || []).length,
        authStatus: req.user ? 'authenticated' : 'anonymous',
        currentUser: req.user ? { id: req.user.id, username: req.user.username, badge: req.user.badge } : null,
        clientIp
      });
    }

    // GET /api/auth/me
    if (path === '/api/auth/me' && method === 'GET') {
      if (!req.user) return res.json({ user: null });
      const safe = { ...req.user, isModerator: isModerator(req.user) };
      delete safe.passwordHash;
      return res.json({ user: safe });
    }

    // PUT /api/auth/profile
    if (path === '/api/auth/profile' && method === 'PUT') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const { bio, avatar } = req.body;
      if (bio !== undefined) req.user.bio = bio.trim().substring(0, 160);
      if (avatar) req.user.avatar = avatar;
      db.scripts.forEach(s => {
        if (s.authorId === req.user.id) s.authorAvatar = req.user.avatar;
        if (s.comments) s.comments.forEach(c => { if (c.userId === req.user.id) c.avatar = req.user.avatar; });
      });
      await saveDB(kv);
      const safe = { ...req.user };
      delete safe.passwordHash;
      return res.json({ message: 'Profile updated', user: safe });
    }

    // GET /api/scripts
    if (path === '/api/scripts' && method === 'GET') {
      const { category, search, sort, status, authorId, all } = Object.fromEntries(url.searchParams);
      let list = [...(db.scripts || [])];
      const isMod = isModerator(req.user);
      const reqUserId = req.user ? String(req.user.id).trim() : null;
      const reqUsername = req.user ? String(req.user.username || '').toLowerCase().trim() : null;

      // 1. Author profile scripts: ALWAYS filter strictly to that author's scripts!
      if (authorId) {
        const target = decodeURIComponent(String(authorId).trim());
        const targetLower = target.toLowerCase();
        const matchedUser = (db.users || []).find(u => 
          String(u.id).trim() === target || 
          (u.username || '').toLowerCase().trim() === targetLower
        );
        const targetId = matchedUser ? String(matchedUser.id).trim() : target;
        const targetUname = matchedUser ? (matchedUser.username || '').toLowerCase().trim() : targetLower;

        const isSelf = (reqUserId && (reqUserId === targetId || reqUserId === target)) ||
                       (reqUsername && (reqUsername === targetUname || reqUsername === targetLower));

        list = list.filter(s => {
          const sAuthorId = s.authorId ? String(s.authorId).trim() : '';
          const sAuthor = (s.author || '').toLowerCase().trim();
          const matches = (targetId && sAuthorId === targetId) || (target && sAuthorId === target) ||
                          (targetUname && sAuthor === targetUname) || (targetLower && sAuthor === targetLower);
          if (!matches) return false;
          if (isSelf || isMod) return true;
          return s.status === 'verified';
        });
      } else if (status) {
        if (isMod) {
          list = list.filter(s => (s.status || 'pending') === status);
        } else if (status === 'verified') {
          list = list.filter(s => (s.status || 'pending') === 'verified');
        } else if (reqUserId || reqUsername) {
          list = list.filter(s => (s.status || 'pending') === status && (
            (reqUserId && String(s.authorId || '').trim() === reqUserId) ||
            (reqUsername && (s.author || '').toLowerCase().trim() === reqUsername)
          ));
        } else {
          list = [];
        }
      } else if (all === 'true' && isMod) {
        // Moderator with all=true sees moderation queue
      } else {
        // Public feed:
        // Only scripts verified for running (status === 'verified') are shown to other users.
        // The logged-in author can also see their own pending scripts.
        // Moderators can see all scripts.
        if (isMod) {
          list = list.filter(s => (s.status || 'pending') !== 'rejected');
        } else if (reqUserId || reqUsername) {
          list = list.filter(s => 
            s.status === 'verified' ||
            (reqUserId && String(s.authorId || '').trim() === reqUserId) ||
            (reqUsername && (s.author || '').toLowerCase().trim() === reqUsername)
          );
        } else {
          list = list.filter(s => s.status === 'verified');
        }
      }
      if (category && category !== 'all') {
        list = list.filter(s => {
          if (category === 'lua') return s.extension === 'lua' || s.category === 'lua';
          if (category === 'txt') return s.extension === 'txt' || s.category === 'txt';
          return s.category === category;
        });
      }
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        list = list.filter(s => {
          return (s.title || '').toLowerCase().includes(q) ||
            (s.description || '').toLowerCase().includes(q) ||
            (s.author || '').toLowerCase().includes(q) ||
            (s.tags || []).some(t => t.toLowerCase().includes(q));
        });
      }
      if (sort === 'popular') list.sort((a, b) => (b.views || 0) - (a.views || 0));
      else if (sort === 'liked') list.sort((a, b) => ((b.likes || []).length) - ((a.likes || []).length));
      else if (sort === 'comments') list.sort((a, b) => ((b.comments || []).length) - ((a.comments || []).length));
      else list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

      const includeCode = url.searchParams.get('includeCode') === 'true';
      const uid = req.user ? req.user.id : null;
      const result = list.map(s => {
        const ur = (s.ratings || []).find(r => r.userId === uid);
        const item = {
          id: s.id,
          title: s.title,
          authorId: s.authorId,
          author: s.author,
          authorAvatar: s.authorAvatar,
          category: s.category,
          extension: s.extension,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          coverImage: s.coverImage,
          presetCover: s.presetCover,
          tags: s.tags,
          description: s.description,
          views: s.views,
          likesCount: (s.likes || []).length,
          isLiked: uid ? (s.likes || []).includes(uid) : false,
          commentsCount: (s.comments || []).length,
          rating: typeof s.rating === 'number' ? s.rating : 5.0,
          ratingsCount: (s.ratings || []).length,
          userRating: ur ? ur.rating : null
        };
        if (includeCode) {
          item.code = s.code;
        }
        return item;
      });
      return res.json({ scripts: result });
    }

    async function resolveScript(targetId, fallbackScript = null) {
      if (!targetId) return null;
      const cleanId = decodeURIComponent(String(targetId).trim());
      let s = (db.scripts || []).find(x => String(x.id).trim() === cleanId);
      if (!s) {
        const initial = getInitialDB();
        const seedScript = (initial.scripts || []).find(x => String(x.id).trim() === cleanId);
        if (seedScript) {
          s = JSON.parse(JSON.stringify(seedScript));
          if (!db.scripts) db.scripts = [];
          db.scripts.unshift(s);
          await saveDB(kv);
        }
      }
      if (!s && fallbackScript) {
        s = {
          ...fallbackScript,
          id: cleanId,
          likes: Array.isArray(fallbackScript.likes) ? fallbackScript.likes : [],
          ratings: Array.isArray(fallbackScript.ratings) ? fallbackScript.ratings : [],
          comments: Array.isArray(fallbackScript.comments) ? fallbackScript.comments : [],
          views: typeof fallbackScript.views === 'number' ? fallbackScript.views : 1
        };
        if (!db.scripts) db.scripts = [];
        db.scripts.unshift(s);
        await saveDB(kv);
      }
      return s;
    }

    // GET /api/scripts/:id
    const scriptGetMatch = path.match(/^\/api\/scripts\/([^/]+)$/);
    if (scriptGetMatch && method === 'GET') {
      const targetId = decodeURIComponent(String(scriptGetMatch[1] || '').trim());
      let script = await resolveScript(targetId);
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });

      // Unverified scripts ("не проверенные на запуск", status !== 'verified') cannot be viewed by other users
      const isMod = isModerator(req.user);
      const reqUserId = req.user ? String(req.user.id).trim() : null;
      const reqUsername = req.user ? String(req.user.username || '').toLowerCase().trim() : null;
      const isAuthor = (reqUserId && String(script.authorId || '').trim() === reqUserId) ||
                       (reqUsername && (script.author || '').toLowerCase().trim() === reqUsername);

      if (script.status !== 'verified' && !isAuthor && !isMod) {
        return res.status(403).json({ error: 'Этот скрипт еще не проверен на запуск и находится на модерации' });
      }
      
      // Real View count tracker (30 seconds debounce per user or IP)
      if (!script.viewedIps) script.viewedIps = {};
      const viewerKey = (req.user ? `u_${req.user.id}` : `ip_${clientIp}`);
      const last = script.viewedIps[viewerKey] || 0;
      if (Date.now() - last > 30 * 1000) {
        script.views = (script.views || 0) + 1;
        script.viewedIps[viewerKey] = Date.now();
        await saveDB(kv);
      }
      const uid = req.user ? req.user.id : null;
      const ur = (script.ratings || []).find(r => r.userId === uid);
      return res.json({
        script: {
          ...script,
          likesCount: (script.likes || []).length,
          isLiked: uid ? (script.likes || []).includes(uid) : false,
          commentsCount: (script.comments || []).length,
          rating: typeof script.rating === 'number' ? script.rating : 5.0,
          ratingsCount: (script.ratings || []).length,
          userRating: ur ? ur.rating : null
        }
      });
    }

    // POST /api/scripts/:id/view (Real View counter ping)
    const scriptViewMatch = path.match(/^\/api\/scripts\/([^/]+)\/view$/);
    if (scriptViewMatch && method === 'POST') {
      const targetId = decodeURIComponent(String(scriptViewMatch[1] || '').trim());
      let script = await resolveScript(targetId, req.body.script);
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });
      if (!script.viewedIps) script.viewedIps = {};
      const viewerKey = (req.user ? `u_${req.user.id}` : `ip_${clientIp}`);
      const last = script.viewedIps[viewerKey] || 0;
      if (Date.now() - last > 30 * 1000) {
        script.views = (script.views || 0) + 1;
        script.viewedIps[viewerKey] = Date.now();
        await saveDB(kv);
      }
      return res.json({ views: script.views || 1 });
    }

    // POST /api/scripts
    if (path === '/api/scripts' && method === 'POST') {
      if (!req.user) {
        const authorName = (req.body.author || req.body.authorName || headerUsername || 'Пользователь').trim();
        const isKerry = authorName.toLowerCase() === 'kerryrbq';
        req.user = {
          id: req.body.authorId || headerUserId || `u-${Date.now()}`,
          username: authorName,
          avatar: req.body.authorAvatar || DEFAULT_AVATARS[0],
          badge: isKerry ? 'ADMIN' : 'MEMBER',
          createdAt: Date.now()
        };
        if (!db.users) db.users = [];
        db.users.push(req.user);
        await saveDB(kv);
      }
      const { title, category, extension, code, description, tags, imageBase64, presetCover, id } = req.body;
      if (!title || !code) return res.status(400).json({ error: 'Title and code required' });
      if (!imageBase64 || typeof imageBase64 !== 'string' || !imageBase64.trim()) {
        return res.status(400).json({ error: 'Скриншот или изображение скрипта обязательно для публикации' });
      }
      const tagsList = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : [category || 'lua']);
      const scriptId = id ? String(id).trim() : ('script-' + Date.now());

      let existing = db.scripts.find(s => String(s.id).trim() === scriptId);
      if (existing) {
        existing.title = title.trim();
        existing.category = category || existing.category;
        existing.extension = extension || existing.extension;
        existing.code = code.trim();
        existing.description = description ? description.trim() : existing.description;
        existing.tags = tagsList;
        if (imageBase64 && imageBase64 !== 'preset') existing.coverImage = imageBase64;
        if (presetCover) existing.presetCover = presetCover;
        existing.updatedAt = Date.now();
        await saveDB(kv);
        return res.json({ message: 'Скрипт обновлен!', script: existing });
      }

      const newScript = {
        id: scriptId,
        title: title.trim(),
        authorId: req.user.id,
        author: req.user.username,
        authorAvatar: req.user.avatar,
        category: category || 'lua',
        extension: extension || 'lua',
        status: isModerator(req.user) ? 'verified' : 'pending',
        createdAt: Date.now(),
        coverImage: imageBase64 || '',
        presetCover: presetCover || 'cyber-hub',
        views: 1,
        viewedIps: {},
        likes: [],
        tags: tagsList,
        description: description ? description.trim() : 'No description.',
        code: code.trim(),
        comments: []
      };
      db.scripts.unshift(newScript);
      if (!isModerator(req.user)) {
        const kerry = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
        if (kerry) {
          if (!db.notifications) db.notifications = [];
          db.notifications.unshift({
            id: 'n-' + Date.now(), userId: kerry.id, scriptId: newScript.id,
            scriptTitle: newScript.title, title: 'New script pending ⏳',
            message: `${req.user.username} submitted "${newScript.title}". Check it!`,
            status: 'pending', isRead: false, createdAt: Date.now()
          });
        }
      }
      await saveDB(kv);
      return res.status(201).json({
        message: isModerator(req.user) ? 'Published!' : 'Sent for review!',
        script: { ...newScript, likesCount: 0, isLiked: false, commentsCount: 0 }
      });
    }

    // PUT /api/scripts/:id
    const scriptPutMatch = path.match(/^\/api\/scripts\/([^/]+)$/);
    if (scriptPutMatch && method === 'PUT') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const targetId = decodeURIComponent(String(scriptPutMatch[1] || '').trim());
      let script = db.scripts.find(s => String(s.id).trim() === targetId);
      if (!script) {
        // Check seed
        const initial = getInitialDB();
        const seedScript = (initial.scripts || []).find(s => String(s.id).trim() === targetId);
        if (seedScript) {
          script = JSON.parse(JSON.stringify(seedScript));
          db.scripts.unshift(script);
        }
      }

      const isMod = isModerator(req.user);
      const userUname = (req.user.username || '').trim().toLowerCase();
      const userId = req.user.id ? String(req.user.id).trim() : '';

      if (script) {
        const scriptAuthor = (script.author || '').trim().toLowerCase();
        const scriptAuthorId = script.authorId ? String(script.authorId).trim() : '';
        const isAuthor = (scriptAuthorId && userId && scriptAuthorId === userId) ||
                         (scriptAuthor && userUname && scriptAuthor === userUname);
        if (!isAuthor && !isMod) {
          return res.status(403).json({ error: 'No permission' });
        }
      } else {
        // Upsert if not found so user never loses their script
        script = {
          id: targetId,
          title: (req.body.title || 'Новый скрипт').trim(),
          authorId: req.user.id,
          author: req.user.username,
          authorAvatar: req.user.avatar,
          category: req.body.category || 'lua',
          extension: req.body.extension || 'lua',
          status: isMod ? 'verified' : 'pending',
          createdAt: Date.now(),
          coverImage: '',
          presetCover: req.body.presetCover || 'cyber-hub',
          views: 1,
          viewedIps: {},
          likes: [],
          tags: [],
          description: req.body.description ? req.body.description.trim() : 'Описание отсутствует.',
          code: (req.body.code || '').trim(),
          comments: []
        };
        db.scripts.unshift(script);
      }

      const { title, category, extension, code, description, tags, imageBase64, presetCover } = req.body;
      if (!title || !code) return res.status(400).json({ error: 'Title and code required' });

      const oldCode = (script.code || '').trim();
      const newCode = (code || '').trim();
      const codeChanged = oldCode !== newCode;

      script.title = title.trim();
      if (category) script.category = category;
      if (extension) script.extension = extension;
      script.code = newCode;
      if (description !== undefined) script.description = description ? description.trim() : 'No description.';
      if (tags !== undefined) {
        script.tags = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : script.tags);
      }
      if (imageBase64 && typeof imageBase64 === 'string' && imageBase64.trim()) {
        script.coverImage = imageBase64;
      }
      if (presetCover) script.presetCover = presetCover;
      script.updatedAt = Date.now();

      let message = '';
      if (codeChanged) {
        script.status = 'pending';
        script.moderatedBy = null;
        script.moderatedAt = null;

        if (!isMod) {
          const kerry = db.users.find(u => (u.username || '').toLowerCase() === 'kerryrbq');
          if (kerry) {
            if (!db.notifications) db.notifications = [];
            db.notifications.unshift({
              id: 'n-' + Date.now(),
              userId: kerry.id,
              scriptId: script.id,
              scriptTitle: script.title,
              title: 'Код скрипта изменен на проверку ⏳',
              message: `Автор ${req.user.username} изменил код скрипта «${script.title}». Требуется повторная проверка!`,
              status: 'pending',
              isRead: false,
              createdAt: Date.now()
            });
          }
        }
        message = 'Скрипт обновлен! Исходный код был изменен, поэтому скрипт отправлен на повторную проверку ⏳';
      } else {
        message = 'Скрипт успешно обновлен! (Код не менялся, статус сохранен) ✅';
      }

      await saveDB(kv);
      const uid = req.user ? req.user.id : null;
      return res.json({
        message,
        codeChanged,
        script: {
          ...script,
          likesCount: (script.likes || []).length,
          isLiked: uid ? (script.likes || []).includes(uid) : false,
          commentsCount: (script.comments || []).length
        }
      });
    }

    // DELETE /api/scripts/:id
    const scriptDelMatch = path.match(/^\/api\/scripts\/([^/]+)$/);
    if (scriptDelMatch && method === 'DELETE') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const idx = db.scripts.findIndex(s => s.id === scriptDelMatch[1]);
      if (idx === -1) {
        return res.json({ message: 'Script already removed or not found', alreadyDeleted: true });
      }
      const script = db.scripts[idx];
      const isMod = isModerator(req.user);
      const userUname = (req.user.username || '').trim().toLowerCase();
      const scriptAuthor = (script.author || '').trim().toLowerCase();
      const scriptAuthorId = script.authorId ? String(script.authorId).trim() : '';
      const userId = req.user.id ? String(req.user.id).trim() : '';

      const isAuthor = (scriptAuthorId && userId && scriptAuthorId === userId) ||
                       (scriptAuthor && userUname && scriptAuthor === userUname);
      if (!isAuthor && !isMod) {
        return res.status(403).json({ error: 'No permission' });
      }
      db.scripts.splice(idx, 1);
      if (db.notifications) db.notifications = db.notifications.filter(n => n.scriptId !== scriptDelMatch[1]);
      await saveDB(kv);
      return res.json({ message: 'Script deleted' });
    }

    // POST /api/scripts/:id/like
    const likeMatch = path.match(/^\/api\/scripts\/([^/]+)\/like$/);
    if (likeMatch && method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const targetId = decodeURIComponent(String(likeMatch[1] || '').trim());
      const script = await resolveScript(targetId, req.body.script);
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });
      if (!script.likes) script.likes = [];
      const uid = req.user.id;
      const idx = script.likes.indexOf(uid);
      let isLiked = false;
      if (idx === -1) { script.likes.push(uid); isLiked = true; }
      else { script.likes.splice(idx, 1); }
      await saveDB(kv);
      return res.json({ isLiked, likesCount: script.likes.length, message: isLiked ? 'Лайк поставлен!' : 'Лайк убран' });
    }

    // POST /api/scripts/:id/rate
    const rateMatch = path.match(/^\/api\/scripts\/([^/]+)\/rate$/);
    if (rateMatch && method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const targetId = decodeURIComponent(String(rateMatch[1] || '').trim());
      const script = await resolveScript(targetId, req.body.script);
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });
      let rating = parseInt(req.body.rating, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
      if (!script.ratings) script.ratings = [];
      const ei = script.ratings.findIndex(r => r.userId === req.user.id);
      if (ei !== -1) { script.ratings[ei].rating = rating; script.ratings[ei].updatedAt = Date.now(); }
      else { script.ratings.push({ userId: req.user.id, rating, createdAt: Date.now() }); }
      const sum = script.ratings.reduce((a, r) => a + r.rating, 0);
      script.rating = parseFloat((sum / script.ratings.length).toFixed(1));
      script.ratingsCount = script.ratings.length;
      if (script.authorId && script.authorId !== req.user.id) {
        if (!db.notifications) db.notifications = [];
        db.notifications.unshift({
          id: `notif-${Date.now()}`, userId: script.authorId, type: 'script_rated',
          title: 'New rating ⭐', message: `${req.user.username} rated "${script.title}" ${rating}/5`,
          scriptId: script.id, read: false, createdAt: Date.now()
        });
      }
      await saveDB(kv);
      return res.json({ message: `Rated ${rating} stars!`, rating: script.rating, ratingsCount: script.ratingsCount, userRating: rating });
    }

    // POST /api/scripts/:id/comments
    const commentMatch = path.match(/^\/api\/scripts\/([^/]+)\/comments$/);
    if (commentMatch && method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const targetId = decodeURIComponent(String(commentMatch[1] || '').trim());
      const script = await resolveScript(targetId, req.body.script);
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });
      const { text } = req.body;
      if (!text || !text.trim()) return res.status(400).json({ error: 'Comment text required' });
      const newComment = {
        id: 'c-' + Date.now(), userId: req.user.id, author: req.user.username,
        avatar: req.user.avatar, text: text.trim().substring(0, 1000), createdAt: Date.now()
      };
      if (!script.comments) script.comments = [];
      script.comments.unshift(newComment);
      await saveDB(kv);
      return res.status(201).json({ message: 'Comment posted', comment: newComment, commentsCount: script.comments.length });
    }

    // POST /api/scripts/:id/moderate
    const modMatch = path.match(/^\/api\/scripts\/([^/]+)\/moderate$/);
    if (modMatch && method === 'POST') {
      if (!req.user || !isModerator(req.user)) return res.status(403).json({ error: 'Moderator access required' });
      const { status, note } = req.body;
      if (!['verified', 'pending', 'rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const targetId = decodeURIComponent(String(modMatch[1] || '').trim());
      let script = db.scripts.find(s => String(s.id).trim() === targetId);
      if (!script) {
        const initial = getInitialDB();
        const seedScript = (initial.scripts || []).find(s => String(s.id).trim() === targetId);
        if (seedScript) {
          script = JSON.parse(JSON.stringify(seedScript));
          db.scripts.unshift(script);
        }
      }
      if (!script && req.body.script) {
        script = {
          ...req.body.script,
          id: targetId,
          status: status
        };
        db.scripts.unshift(script);
      }
      if (!script) return res.status(404).json({ error: 'Скрипт не найден' });
      script.status = status;
      script.moderatedBy = req.user.username;
      script.moderatedAt = Date.now();
      if (note !== undefined) script.moderatorNote = note ? note.trim() : '';
      if (!db.notifications) db.notifications = [];
      let icon = status === 'verified' ? '✅' : status === 'rejected' ? '❌' : '⏳';
      db.notifications.unshift({
        id: 'n-' + Date.now(), userId: script.authorId, scriptId: script.id,
        scriptTitle: script.title, title: `Script status changed ${icon}`,
        message: `Your script "${script.title}" is now ${status}`, status, isRead: false, createdAt: Date.now()
      });
      await saveDB(kv);
      const uid = req.user ? req.user.id : null;
      return res.json({
        message: `Status changed to ${status}`,
        script: { ...script, likesCount: (script.likes || []).length, isLiked: uid ? (script.likes || []).includes(uid) : false, commentsCount: (script.comments || []).length }
      });
    }

    // GET /api/notifications
    if (path === '/api/notifications' && method === 'GET') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      if (!db.notifications) db.notifications = [];
      const list = db.notifications.filter(n => n.userId === req.user.id);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.json({ notifications: list, unreadCount: list.filter(n => !n.isRead).length });
    }

    // POST /api/notifications/read-all
    if (path === '/api/notifications/read-all' && method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      if (!db.notifications) db.notifications = [];
      db.notifications.forEach(n => { if (n.userId === req.user.id) n.isRead = true; });
      await saveDB(kv);
      return res.json({ message: 'All read' });
    }

    // GET /api/moderation/queue
    if (path === '/api/moderation/queue' && method === 'GET') {
      if (!req.user || !isModerator(req.user)) return res.status(403).json({ error: 'Moderator access required' });
      const pending = db.scripts.filter(s => (s.status || 'pending') === 'pending');
      pending.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return res.json({ queue: pending, pendingCount: pending.length });
    }

    // GET /api/users/:id
    const userMatch = path.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && method === 'GET') {
      const targetId = userMatch[1];
      const user = db.users.find(u => u.id === targetId || (u.username || '').toLowerCase() === targetId.toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      const safe = { ...user, isModerator: isModerator(user) };
      delete safe.passwordHash;
      const isReqMod = req.user && isModerator(req.user);
      const isSelf = req.user && req.user.id === user.id;
      const userScripts = db.scripts.filter(s => {
        const matchesAuthor = (s.authorId && s.authorId === user.id) ||
                              (s.author && (s.author || '').toLowerCase() === (user.username || '').toLowerCase());
        if (!matchesAuthor) return false;
        if (isReqMod || isSelf) return true;
        return s.status === 'verified';
      });
      const totalLikes = userScripts.reduce((a, s) => a + ((s.likes || []).length), 0);
      const totalViews = userScripts.reduce((a, s) => a + (s.views || 0), 0);
      if (!db.userReviews) db.userReviews = [];
      const reviews = db.userReviews.filter(r => r.targetUserId === user.id);
      reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + Number(r.rating || 5), 0) / reviews.length).toFixed(1) : null;
      const uid = req.user ? req.user.id : null;
      const mapped = userScripts.map(s => {
        const ur = (s.ratings || []).find(r => r.userId === uid);
        return { ...s, likesCount: (s.likes || []).length, isLiked: uid ? (s.likes || []).includes(uid) : false, commentsCount: (s.comments || []).length, rating: typeof s.rating === 'number' ? s.rating : 5.0, ratingsCount: (s.ratings || []).length, userRating: ur ? ur.rating : null };
      });
      return res.json({ user: safe, stats: { scriptsCount: userScripts.length, totalLikes, totalViews, reviewsCount: reviews.length, averageRating: avgRating ? Number(avgRating) : 5.0 }, scripts: mapped, reviews });
    }

    // PUT /api/users/:id/badge
    const badgeMatch = path.match(/^\/api\/users\/([^/]+)\/badge$/);
    if (badgeMatch && method === 'PUT') {
      if (!req.user || !isModerator(req.user)) return res.status(403).json({ error: 'Moderator access required' });
      const { badge } = req.body;
      if (!badge || typeof badge !== 'string') return res.status(400).json({ error: 'Badge required' });
      const user = db.users.find(u => u.id === badgeMatch[1] || (u.username || '').toLowerCase() === badgeMatch[1].toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.badge = badge.trim().substring(0, 30).toUpperCase();
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({ id: 'n-' + Date.now(), userId: user.id, title: 'New badge! 🏷️', message: `Admin assigned "${user.badge}"`, status: 'verified', isRead: false, createdAt: Date.now() });
      await saveDB(kv);
      return res.json({ message: `Badge set to "${user.badge}"`, badge: user.badge });
    }

    // POST /api/users/:id/reviews
    const reviewPostMatch = path.match(/^\/api\/users\/([^/]+)\/reviews$/);
    if (reviewPostMatch && method === 'POST') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      const user = db.users.find(u => u.id === reviewPostMatch[1] || (u.username || '').toLowerCase() === reviewPostMatch[1].toLowerCase());
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (req.user.id === user.id) return res.status(400).json({ error: 'Cannot review yourself' });
      const { rating, text } = req.body;
      const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
      const reviewText = (text || '').trim();
      if (!reviewText) return res.status(400).json({ error: 'Review text required' });
      if (!db.userReviews) db.userReviews = [];
      const newReview = {
        id: 'rev-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        targetUserId: user.id, authorId: req.user.id, authorName: req.user.username,
        authorAvatar: req.user.avatar || DEFAULT_AVATARS[0],
        rating: numRating, text: reviewText.substring(0, 500), createdAt: Date.now()
      };
      db.userReviews.unshift(newReview);
      if (!db.notifications) db.notifications = [];
      db.notifications.unshift({ id: 'n-' + Date.now(), userId: user.id, title: 'New review ⭐', message: `${req.user.username} rated you ${numRating}/5`, status: 'verified', isRead: false, createdAt: Date.now() });
      await saveDB(kv);
      return res.status(201).json({ message: 'Review posted!', review: newReview });
    }

    // DELETE /api/users/:id/reviews/:reviewId
    const reviewDelMatch = path.match(/^\/api\/users\/([^/]+)\/reviews\/([^/]+)$/);
    if (reviewDelMatch && method === 'DELETE') {
      if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
      if (!db.userReviews) db.userReviews = [];
      const idx = db.userReviews.findIndex(r => r.id === reviewDelMatch[2] && r.targetUserId === reviewDelMatch[1]);
      if (idx === -1) return res.status(404).json({ error: 'Review not found' });
      const review = db.userReviews[idx];
      if (review.authorId !== req.user.id && !isModerator(req.user)) return res.status(403).json({ error: 'No permission' });
      db.userReviews.splice(idx, 1);
      await saveDB(kv);
      return res.json({ message: 'Review deleted' });
    }

    // GET /api/stats
    if (path === '/api/stats' && method === 'GET') {
      return res.json({
        totalUsers: db.users.length,
        totalScripts: db.scripts.length,
        totalViews: db.scripts.reduce((a, s) => a + (s.views || 0), 0),
        totalLikes: db.scripts.reduce((a, s) => a + ((s.likes || []).length), 0)
      });
    }

    // POST /api/migrate — works when DB is empty OR with force key
    if (path === '/api/migrate' && method === 'POST') {
      const { data, force } = req.body;
      if (!data || !data.users) return res.status(400).json({ error: 'Invalid data' });
      const isAdmin = req.user && isModerator(req.user);
      const isForce = force === true || req.headers['x-force'] === '1';
      const isEmpty = db.users.length === 0 && db.scripts.length === 0;
      if (!isAdmin && !isEmpty && !isForce) return res.status(403).json({ error: 'Admin only or DB must be empty' });
      Object.assign(db, data);
      if (!db.notifications) db.notifications = [];
      if (!db.userReviews) db.userReviews = [];
      if (!db.bannedIps) db.bannedIps = [];
      if (!db.tokens) db.tokens = {};
      db.users.forEach(u => {
        if ((u.username || '').toLowerCase() === 'kerryrbq') u.badge = 'ADMIN';
        if (!u.bio) u.bio = 'PublicScriptKR user.';
        delete u.lastIp;
      });
      db.scripts.forEach(s => {
        s.status = 'verified';
        if (!s.viewedIps) s.viewedIps = {};
      });
      await saveDB(kv);
      return res.json({ message: 'Migration complete', users: db.users.length, scripts: db.scripts.length });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
};

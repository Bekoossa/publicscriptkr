const crypto = require('crypto');

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

let seedData = null;
try {
  seedData = require('./seed.json');
} catch (e) {
  try {
    seedData = require('../data/db.json');
  } catch(e2) {}
}

function getInitialDB() {
  if (seedData && seedData.users && seedData.scripts) {
    const clone = JSON.parse(JSON.stringify(seedData));
    if (!clone.notifications) clone.notifications = [];
    if (!clone.userReviews) clone.userReviews = [];
    if (!clone.bannedIps) clone.bannedIps = [];
    if (!clone.tokens) clone.tokens = {};
    clone.scripts.forEach(s => {
      if (!s.status) s.status = 'verified';
    });
    return clone;
  }
  return {
    users: [],
    scripts: [],
    tokens: {},
    notifications: [],
    userReviews: [],
    bannedIps: []
  };
}

let _db = null;

async function getDB(kv) {
  if (kv) {
    try {
      const raw = await kv.get('pskr_database');
      if (raw) {
        _db = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!_db.notifications) _db.notifications = [];
        if (!_db.userReviews) _db.userReviews = [];
        if (!_db.bannedIps) _db.bannedIps = [];
        if (!_db.tokens) _db.tokens = {};
        if (!_db.scripts || _db.scripts.length === 0) {
          const init = getInitialDB();
          if (init.scripts && init.scripts.length > 0) {
            _db.scripts = init.scripts;
            _db.users = init.users;
            await saveDB(kv);
          }
        }
        // Ensure admin badge
        if (_db.users) {
          _db.users.forEach(u => {
            if ((u.username || '').toLowerCase() === 'kerryrbq') u.badge = 'ADMIN';
          });
        }
        return _db;
      }
    } catch (e) {
      console.error('KV read error:', e);
    }
  }

  if (!_db) {
    _db = getInitialDB();
    if (kv) {
      try { await saveDB(kv); } catch(e) {}
    }
  }
  return _db;
}

async function saveDB(kv) {
  if (!kv) return;
  try {
    await kv.set('pskr_database', JSON.stringify(_db));
  } catch (e) {
    console.error('KV write error:', e);
  }
}

function isModerator(user) {
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

module.exports = {
  DEFAULT_AVATARS,
  hashPassword,
  generateToken,
  verifyToken,
  TOKEN_SECRET,
  getInitialDB,
  getDB,
  saveDB,
  isModerator
};

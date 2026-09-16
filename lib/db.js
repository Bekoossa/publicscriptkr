const crypto = require('crypto');

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80'
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_pskr_salt_2026').digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getInitialDB() {
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
  if (_db) return _db;

  if (kv) {
    try {
      const raw = await kv.get('pskr_database');
      if (raw) {
        _db = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!_db.notifications) _db.notifications = [];
        if (!_db.userReviews) _db.userReviews = [];
        if (!_db.bannedIps) _db.bannedIps = [];
        if (!_db.tokens) _db.tokens = {};
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

  _db = getInitialDB();
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
  return user.badge === 'ADMIN' || user.badge === 'MODERATOR' || uname === 'kerryrbq';
}

module.exports = {
  DEFAULT_AVATARS,
  hashPassword,
  generateToken,
  getInitialDB,
  getDB,
  saveDB,
  isModerator
};

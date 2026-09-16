const fs = require('fs');
const path = require('path');

const VERCEL_URL = 'https://publicscriptkr.vercel.app';
const DB_PATH = path.join(__dirname, 'data', 'db.json');

async function migrate() {
  console.log('Reading local database...');
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  const data = JSON.parse(raw);
  if (data.scripts) {
    data.scripts.forEach(s => {
      if (!s.status) s.status = 'verified';
    });
  }
  console.log(`Found ${data.users.length} users, ${data.scripts.length} scripts`);

  console.log('Pushing to Vercel KV...');
  const res = await fetch(`${VERCEL_URL}/api/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  const result = await res.json();
  console.log(res.ok ? 'SUCCESS:' : 'FAILED:', result);
}

migrate().catch(console.error);

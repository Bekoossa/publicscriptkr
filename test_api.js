async function runTest() {
  try {
    // 1. Register new user
    const reg = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'ProGamer_KZ_' + Math.floor(Math.random()*1000),
        password: 'password123',
        bio: 'Люблю Lua скрипты для Roblox'
      })
    }).then(r => r.json());
    console.log('1. Registration:', reg.message, 'User:', reg.user?.username);

    // 2. Upload script
    const script = await fetch('http://localhost:3000/api/scripts', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + reg.token 
      },
      body: JSON.stringify({
        title: 'Arsenal Triggerbot & Silent Aim',
        category: 'roblox',
        extension: 'lua',
        code: '-- Arsenal Script\nprint("PublicScriptKR Loaded")',
        description: 'Отличный скрипт с быстрым наведением',
        tags: ['arsenal', 'roblox', 'triggerbot']
      })
    }).then(r => r.json());
    console.log('2. Upload Script:', script.message, 'Title:', script.script?.title);

    // 3. Like script
    const like = await fetch(`http://localhost:3000/api/scripts/${script.script.id}/like`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + reg.token }
    }).then(r => r.json());
    console.log('3. Like Script:', like.message, 'Count:', like.likesCount);

    // 4. Add comment
    const comment = await fetch(`http://localhost:3000/api/scripts/${script.script.id}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + reg.token 
      },
      body: JSON.stringify({ text: 'Проверил на сервере, все работает идеально!' })
    }).then(r => r.json());
    console.log('4. Post Comment:', comment.message, 'Author:', comment.comment?.author);

    // 5. Check stats
    const stats = await fetch('http://localhost:3000/api/stats').then(r => r.json());
    console.log('5. Global Stats on Host:', stats);

    // 6. Test Moderation by Kerryrbq
    // Login as Kerryrbq (or test moderation route)
    const allUsers = JSON.parse(require('fs').readFileSync('data/db.json')).users;
    const kerry = allUsers.find(u => u.username.toLowerCase() === 'kerryrbq');
    console.log('Kerry user:', kerry.username, 'Badge:', kerry.badge);

    // Get an auth token for Kerryrbq
    const tokens = JSON.parse(require('fs').readFileSync('data/db.json')).tokens || {};
    let kerryToken = Object.keys(tokens).find(t => tokens[t] === kerry.id);
    if (!kerryToken) {
      // login or create token
      kerryToken = 'test-kerry-token';
      const dbObj = JSON.parse(require('fs').readFileSync('data/db.json'));
      if (!dbObj.tokens) dbObj.tokens = {};
      dbObj.tokens[kerryToken] = kerry.id;
      require('fs').writeFileSync('data/db.json', JSON.stringify(dbObj, null, 2));
    }

    // Check Kerryrbq me endpoint
    const me = await fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': 'Bearer ' + kerryToken }
    }).then(r => r.json());
    console.log('6. Kerryrbq Auth/Me:', me.user?.username, 'Badge:', me.user?.badge, 'isModerator:', me.user?.isModerator);

    // Moderate the uploaded script (mark verified: Проверено на запуск)
    const modRes = await fetch(`http://localhost:3000/api/scripts/${script.script.id}/moderate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + kerryToken 
      },
      body: JSON.stringify({ status: 'verified', note: 'Проверено лично, работает без крашей!' })
    }).then(r => r.json());
    console.log('7. Moderation Result:', modRes.message, 'Script Status:', modRes.script?.status);

    // 8. Check Notifications for the script author
    const notifs = await fetch('http://localhost:3000/api/notifications', {
      headers: { 'Authorization': 'Bearer ' + reg.token }
    }).then(r => r.json());
    console.log('8. Author Notifications count:', notifs.notifications?.length, 'Unread:', notifs.unreadCount);
    console.log('   Latest notification:', notifs.notifications[0]?.title, '->', notifs.notifications[0]?.message);
  } catch (err) {
    console.error('Test failed:', err);
  }
}
runTest();

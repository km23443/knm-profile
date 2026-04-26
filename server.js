// server.js - Multi-tenant self-introduction site server.
const path     = require('path');
const fs       = require('fs');
const express  = require('express');
const session  = require('express-session');
const bcrypt   = require('bcryptjs');
const { db, isSlugReserved, isValidSlug } = require('./db');
const defaultConfig = require('./defaultConfig');

const app  = express();
const PORT = process.env.PORT || 3000;

// Behind Railway's HTTPS proxy
app.set('trust proxy', 1);

// --- Middleware ---------------------------------------------------------
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use('/static', express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_in_production_please_xyz_42',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure:  process.env.NODE_ENV === 'production',
    maxAge:  1000 * 60 * 60 * 24 * 7
  }
}));

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    if (req.path.startsWith('/api/')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.redirect('/login');
  }
  next();
}

function sendHtml(res, file) {
  res.sendFile(path.join(__dirname, 'views', file));
}

const TEMPLATE_PATH = path.join(__dirname, 'views', 'template.html');
function renderSite(siteRow) {
  let html = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  let cfg;
  try { cfg = JSON.parse(siteRow.config); } catch (e) { cfg = defaultConfig; }
  cfg.viewCount = siteRow.views;
  const inject = '<script id="server-config">window.__CONFIG__ = ' + JSON.stringify(cfg) + ';</script>';
  html = html.replace('<!--SERVER_CONFIG-->', inject);
  return html;
}

// --- Auth API -----------------------------------------------------------
app.post('/api/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '請輸入帳號與密碼' });
  if (username.length < 3 || username.length > 30) return res.status(400).json({ error: '帳號長度需 3-30 字元' });
  if (password.length < 6) return res.status(400).json({ error: '密碼至少 6 字元' });

  const exists = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
  if (exists) return res.status(409).json({ error: '此帳號已被使用' });

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hash);
  req.session.userId = info.lastInsertRowid;
  req.session.username = username;
  res.json({ ok: true, redirect: '/admin' });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '請輸入帳號與密碼' });
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ ok: true, redirect: '/admin' });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id: req.session.userId, username: req.session.username });
});

// --- Site API -----------------------------------------------------------
app.get('/api/sites', requireAuth, (req, res) => {
  const rows = db.prepare(
    'SELECT id, slug, title, views, created_at, updated_at FROM sites WHERE user_id = ? ORDER BY updated_at DESC'
  ).all(req.session.userId);
  res.json(rows);
});

app.get('/api/check-slug', (req, res) => {
  const slug = String(req.query.slug || '').trim();
  if (!isValidSlug(slug)) return res.json({ available: false, reason: 'invalid' });
  if (isSlugReserved(slug)) return res.json({ available: false, reason: 'reserved' });
  const taken = db.prepare('SELECT 1 FROM sites WHERE slug = ?').get(slug);
  res.json({ available: !taken });
});

app.post('/api/sites', requireAuth, (req, res) => {
  const slug = String(req.body.slug || '').trim();
  if (!isValidSlug(slug)) return res.status(400).json({ error: '網址只能用英數、底線、連字號 (2-40 字)' });
  if (isSlugReserved(slug)) return res.status(400).json({ error: '此網址為系統保留字，請換一個' });
  const taken = db.prepare('SELECT 1 FROM sites WHERE slug = ?').get(slug);
  if (taken) return res.status(409).json({ error: '此網址已被使用' });

  const cfg = Object.assign({}, defaultConfig, { username: req.body.username || slug });
  const info = db.prepare(
    'INSERT INTO sites (user_id, slug, title, config) VALUES (?, ?, ?, ?)'
  ).run(req.session.userId, slug, cfg.username, JSON.stringify(cfg));
  res.json({ ok: true, id: info.lastInsertRowid, slug });
});

app.get('/api/sites/:slug', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM sites WHERE slug = ? AND user_id = ?').get(req.params.slug, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({
    id: row.id, slug: row.slug, title: row.title, views: row.views,
    config: JSON.parse(row.config),
    created_at: row.created_at, updated_at: row.updated_at
  });
});

app.put('/api/sites/:slug', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM sites WHERE slug = ? AND user_id = ?').get(req.params.slug, req.session.userId);
  if (!row) return res.status(404).json({ error: 'Not found' });
  const cfg = req.body.config;
  if (!cfg || typeof cfg !== 'object') return res.status(400).json({ error: '設定資料格式錯誤' });

  let newSlug = row.slug;
  if (req.body.slug && req.body.slug !== row.slug) {
    const want = String(req.body.slug).trim();
    if (!isValidSlug(want)) return res.status(400).json({ error: '新網址格式錯誤' });
    if (isSlugReserved(want)) return res.status(400).json({ error: '此網址為系統保留字，請換一個' });
    if (db.prepare('SELECT 1 FROM sites WHERE slug = ? AND id != ?').get(want, row.id)) {
      return res.status(409).json({ error: '此網址已被使用' });
    }
    newSlug = want;
  }

  db.prepare(
    "UPDATE sites SET slug = ?, title = ?, config = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(newSlug, cfg.username || newSlug, JSON.stringify(cfg), row.id);
  res.json({ ok: true, slug: newSlug });
});

app.delete('/api/sites/:slug', requireAuth, (req, res) => {
  const info = db.prepare('DELETE FROM sites WHERE slug = ? AND user_id = ?').run(req.params.slug, req.session.userId);
  if (!info.changes) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// --- Page routes --------------------------------------------------------
app.get('/', (req, res) => {
  if (req.session.userId) return res.redirect('/admin');
  res.redirect('/login');
});

app.get('/login',     (req, res) => sendHtml(res, 'login.html'));
app.get('/register',  (req, res) => sendHtml(res, 'register.html'));
app.get('/admin',     requireAuth, (req, res) => sendHtml(res, 'admin.html'));
app.get('/admin/edit/:slug', requireAuth, (req, res) => sendHtml(res, 'edit.html'));

app.get('/:slug', (req, res, next) => {
  const slug = req.params.slug;
  if (isSlugReserved(slug) || !isValidSlug(slug)) return next();
  const row = db.prepare('SELECT * FROM sites WHERE slug = ?').get(slug);
  if (!row) return next();
  db.prepare('UPDATE sites SET views = views + 1 WHERE id = ?').run(row.id);
  row.views += 1;
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(renderSite(row));
});

app.use((req, res) => {
  res.status(404).set('Content-Type', 'text/html; charset=utf-8').send(
    '<!doctype html><html><head><meta charset="utf-8"><title>404</title>' +
    '<style>body{background:#0b0b10;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}' +
    '.box{text-align:center}h1{font-size:6rem;margin:0;letter-spacing:-.05em}' +
    'a{color:#9ad;text-decoration:none;border-bottom:1px solid #345}</style></head>' +
    '<body><div class="box"><h1>404</h1><p>page not found</p>' +
    '<p><a href="/">go home</a></p></div></body></html>'
  );
});

app.listen(PORT, () => {
  const line = '====================================================';
  console.log(line);
  console.log('  Self-Intro Multi-tenant Server is running');
  console.log('  Open in browser:  http://localhost:' + PORT);
  console.log('  Admin panel:      http://localhost:' + PORT + '/admin');
  console.log('  Public page demo: http://localhost:' + PORT + '/<your-slug>');
  console.log(line);
});

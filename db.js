// db.js - SQLite using Node.js built-in node:sqlite (no native binary needed)
// Requires Node.js 22.5+ (stable in 24+). Compatible with Railway.
const path = require('path');

let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  console.error('\n[FATAL] Your Node.js version does not include node:sqlite.');
  console.error('        Please upgrade to Node.js 22.5+ (recommended: 22 LTS or 24+).');
  console.error('        Download: https://nodejs.org\n');
  process.exit(1);
}

const DATA_DIR = process.env.DATA_DIR || __dirname;
try { require('fs').mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
const dbPath = path.join(DATA_DIR, 'data.db');
console.log('[db] using SQLite at', dbPath);
const db = new DatabaseSync(dbPath);

// Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT UNIQUE NOT NULL,
    password   TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sites (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    slug       TEXT UNIQUE NOT NULL COLLATE NOCASE,
    title      TEXT,
    config     TEXT NOT NULL,
    views      INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sites_user ON sites(user_id);
  CREATE INDEX IF NOT EXISTS idx_sites_slug ON sites(slug);
`);

// Reserved slugs that cannot be used as user site slugs
const RESERVED_SLUGS = new Set([
  'admin', 'login', 'register', 'logout', 'api', 'public', 'static',
  'assets', 'favicon.ico', 'robots.txt', 'sitemap.xml', '_template',
  'health', 'dashboard', 'settings', 'account', 'help', 'about', 'home'
]);

function isSlugReserved(slug) {
  return RESERVED_SLUGS.has(String(slug).toLowerCase());
}

function isValidSlug(slug) {
  return /^[a-zA-Z0-9_-]{2,40}$/.test(slug);
}

module.exports = { db, isSlugReserved, isValidSlug };

const { createHmac, timingSafeEqual } = require('node:crypto');

const COOKIE = 'nd_admin_session';
const MAX_AGE = 60 * 60 * 8;

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function sign(value) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET).update(value).digest('base64url');
}

function setCookie(res, value, maxAge) {
  res.setHeader('Set-Cookie', `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
}

function issueSession(res) {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = Buffer.from(JSON.stringify({ exp: expires })).toString('base64url');
  setCookie(res, `${payload}.${sign(payload)}`, MAX_AGE);
}

function clearSession(res) {
  setCookie(res, '', 0);
}

function isAuthenticated(req) {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').map((part) => {
    const i = part.indexOf('=');
    return i < 0 ? ['', ''] : [part.slice(0, i).trim(), part.slice(i + 1).trim()];
  }));
  const [payload, signature, extra] = (cookies[COOKIE] || '').split('.');
  if (!payload || !signature || extra) return false;
  if (!safeEqual(signature, sign(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

function requireAdmin(req, res) {
  if (isAuthenticated(req)) return true;
  res.status(401).json({ error: 'Please sign in again.' });
  return false;
}

function githubConfig() {
  const { GITHUB_TOKEN } = process.env;
  const owner = process.env.GITHUB_OWNER || 'JEtechnologies';
  const repo = process.env.GITHUB_REPO || 'NDtourandtravel';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!GITHUB_TOKEN) throw new Error('GitHub storage is not configured yet.');
  return { token: GITHUB_TOKEN, owner, repo, branch };
}

async function githubRequest(path, options = {}) {
  const { token, owner, repo } = githubConfig();
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  });
  const result = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 404 ? 'Content file was not found.' : (result.message || 'GitHub could not save the changes.'));
    error.status = response.status;
    throw error;
  }
  return result;
}

module.exports = { safeEqual, issueSession, clearSession, isAuthenticated, requireAdmin, githubConfig, githubRequest };

const { safeEqual, issueSession } = require('../../server/admin');
const attemptsByIp = new Map();

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return res.status(503).json({ error: 'Admin login is not configured yet.' });
  }
  const username = String(req.body?.username || '');
  const password = String(req.body?.password || '');
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const previous = attemptsByIp.get(ip);
  if (previous && previous.lockedUntil > Date.now()) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  if (!safeEqual(username, process.env.ADMIN_USERNAME) || !safeEqual(password, process.env.ADMIN_PASSWORD)) {
    const attempts = previous && previous.resetAt > Date.now() ? previous.attempts + 1 : 1;
    attemptsByIp.set(ip, { attempts, resetAt: Date.now() + 15 * 60 * 1000, lockedUntil: attempts >= 5 ? Date.now() + 15 * 60 * 1000 : 0 });
    return res.status(401).json({ error: 'The ID or password is incorrect.' });
  }
  attemptsByIp.delete(ip);
  issueSession(res);
  return res.status(200).json({ ok: true });
};

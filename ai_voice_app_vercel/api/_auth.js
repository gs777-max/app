/**
 * ログイン認証の共通ヘルパー（v3.6.0）
 *
 * - ユーザーID / パスワードの平文はコードに書かない。
 *   Vercel 環境変数 LOGIN_PASSWORD_HASH に
 *   SHA-256 ハッシュ（16進64文字）を設定する。
 * - ログイン成功時は HMAC 署名付きセッションCookie（7日間）を発行する。
 *   署名キーは LOGIN_PASSWORD_HASH 自体（サーバー内でのみ使用）。
 * - /api/token と /api/rest はこのCookieがないと 401 を返す。
 */

const crypto = require('crypto');

const COOKIE_NAME = 'aivoice_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value == null ? '' : value), 'utf8').digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function getLoginHashes() {
  // v3.6.2: 貼り付け時の改行・空白混入に強くするため、空白類を全て除去する。
  return {
    idHash: (process.env.LOGIN_ID_HASH || '').replace(/\s+/g, '').toLowerCase(),
    pwHash: (process.env.LOGIN_PASSWORD_HASH || '').replace(/\s+/g, '').toLowerCase()
  };
}

function configState() {
  // 'ok' | 'missing' | 'malformed'（値そのものは返さない）
  const h = getLoginHashes();
  if (!h.pwHash) return 'missing';
  return /^[0-9a-f]{64}$/.test(h.pwHash) ? 'ok' : 'malformed';
}

function isConfigured() {
  // v3.6.1: パスワードのみでログイン（IDは廃止）。必要なのは LOGIN_PASSWORD_HASH のみ。
  return configState() === 'ok';
}

function sign(payloadB64) {
  return crypto.createHmac('sha256', getLoginHashes().pwHash).update(payloadB64).digest('base64url');
}

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS }), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof data.exp === 'number' && Date.now() < data.exp;
  } catch (e) {
    return false;
  }
}

function parseCookies(req) {
  const out = {};
  const raw = req.headers && req.headers.cookie;
  if (!raw) return out;
  for (const part of String(raw).split(';')) {
    const i = part.indexOf('=');
    if (i > 0) {
      const k = part.slice(0, i).trim();
      try { out[k] = decodeURIComponent(part.slice(i + 1).trim()); } catch (e) { out[k] = part.slice(i + 1).trim(); }
    }
  }
  return out;
}

function isAuthenticated(req) {
  if (!isConfigured()) return false;
  return verifySessionToken(parseCookies(req)[COOKIE_NAME]);
}

function sessionCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.floor(SESSION_MS / 1000)}`;
}

function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

function checkCredentials(password) {
  const h = getLoginHashes();
  return safeEqual(sha256Hex(password), h.pwHash);
}

module.exports = {
  COOKIE_NAME,
  sha256Hex,
  isConfigured,
  configState,
  checkCredentials,
  createSessionToken,
  verifySessionToken,
  isAuthenticated,
  sessionCookie,
  clearCookie
};

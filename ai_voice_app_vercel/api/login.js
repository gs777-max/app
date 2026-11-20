/**
 * Vercel Serverless Function: ログイン
 *
 * エンドポイント: /api/login
 * - GET    : ログイン状態を返す { success: true, authenticated: boolean }
 * - POST   : { password } を検証し、成功時にセッションCookieを発行
 * - DELETE : ログアウト（Cookieを消去）
 *
 * パスワードの平文はコードに書かない。環境変数 LOGIN_PASSWORD_HASH
 * （SHA-256ハッシュ）と比較する（_auth.js 参照）。
 */

const auth = require('./_auth');

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://app-aivoiceappvercel.vercel.app') return true;
  if (/^https:\/\/[A-Za-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body;
  try { return JSON.parse(String(req.body)); } catch (e) { return {}; }
}

async function handler(req, res) {
  const origin = req.headers && req.headers.origin;
  const allowed = isAllowedOrigin(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(allowed ? 204 : 403).end();
    return;
  }
  if (!allowed) {
    res.status(403).json({ success: false, error: 'このオリジンからは利用できません。' });
    return;
  }

  if (!auth.isConfigured()) {
    res.status(503).json({
      success: false,
      code: 'AUTH_NOT_CONFIGURED',
      error: 'ログイン設定が未完了です（Vercel環境変数 LOGIN_PASSWORD_HASH を設定してください）。'
    });
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({ success: true, authenticated: auth.isAuthenticated(req) });
    return;
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', auth.clearCookie());
    res.status(200).json({ success: true });
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed' });
    return;
  }

  const body = parseBody(req);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!password || !auth.checkCredentials(password)) {
    res.status(401).json({ success: false, error: 'パスワードが違います。' });
    return;
  }

  res.setHeader('Set-Cookie', auth.sessionCookie(auth.createSessionToken()));
  res.status(200).json({ success: true, authenticated: true });
}

module.exports = handler;
module.exports.default = handler;

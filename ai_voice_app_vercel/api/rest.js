/**
 * Vercel Serverless Function: REST フォールバック用プロキシ
 *
 * エンドポイント: POST /api/rest
 * Body: { prompt: string, systemInstruction?: string }
 * Response: { success: true, text: string }
 *
 * v3.4: エフェメラルトークンは Live API 専用で REST（generateContent）には
 * 使えないため、フォールバック対話はサーバー経由に変えた。
 * ブラウザは生キーを一切受け取らない。キーは Vercel 環境変数だけが持つ。
 *
 * 注意: アカウント・レート制限がない現状では、この経路も公開のまま。
 * 利用制限は次フェーズで必須。
 */

const REST_MODEL = 'models/gemini-2.5-flash';
const MAX_PROMPT_CHARS = 2000;
const MAX_SYSTEM_CHARS = 4000;
const MAX_HISTORY_CHARS = 8000;

const auth = require('./_auth');

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://app-aivoiceappvercel.vercel.app') return true;
  if (/^https:\/\/[A-Za-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function getServerKey() {
  return (
    process.env.GEMINI_LIVE_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_LIVE_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ''
  ).trim();
}

async function handler(req, res) {
  const origin = req.headers && req.headers.origin;
  const allowed = isAllowedOrigin(origin);
  if (allowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(allowed ? 204 : 403).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method Not Allowed（POSTのみ）' });
    return;
  }
  if (!allowed) {
    res.status(403).json({ success: false, error: 'このオリジンからは利用できません。' });
    return;
  }

  // v3.6.0: ログイン必須（セッションCookieがないと使えない）。
  if (!auth.isAuthenticated(req)) {
    res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'ログインが必要です。' });
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (e) { payload = null; }
  }
  const prompt = payload && typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
  const systemInstruction = payload && typeof payload.systemInstruction === 'string' ? payload.systemInstruction : '';
  if (!prompt) {
    res.status(400).json({ success: false, error: 'prompt が空です。' });
    return;
  }
  if (prompt.length > MAX_PROMPT_CHARS || systemInstruction.length > MAX_SYSTEM_CHARS) {
    res.status(400).json({ success: false, error: '入力が長すぎます。' });
    return;
  }

  const apiKey = getServerKey();
  if (!apiKey) {
    res.status(500).json({ success: false, error: 'サーバーに Gemini キーが設定されていません。' });
    return;
  }

  // v3.7.4: フォールバック会話に文脈を持たせる（直近の履歴をcontentsに含める）。
  const contents = [];
  let histChars = 0;
  if (Array.isArray(payload.history)) {
    for (const h of payload.history.slice(-20)) {
      if (!h || typeof h.text !== 'string') continue;
      const t = h.text.trim().slice(0, MAX_PROMPT_CHARS);
      if (!t) continue;
      histChars += t.length;
      if (histChars > MAX_HISTORY_CHARS) break;
      contents.push({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: t }] });
    }
  }
  contents.push({ role: 'user', parts: [{ text: prompt }] });
  const body = { contents };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${REST_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      res.status(502).json({ success: false, error: `AI応答の取得に失敗しました（HTTP ${upstream.status}）。` });
      return;
    }
    const text =
      (data.candidates &&
        data.candidates[0] &&
        data.candidates[0].content &&
        data.candidates[0].content.parts &&
        data.candidates[0].content.parts[0] &&
        data.candidates[0].content.parts[0].text) ||
      '';
    res.status(200).json({ success: true, text });
  } catch (error) {
    res.status(502).json({ success: false, error: 'AI応答サーバーに接続できませんでした。' });
  }
}

module.exports = handler;
module.exports.default = handler;


/**
 * Vercel Serverless Function: Gemini Live API エフェメラルトークン発行
 *
 * エンドポイント: POST /api/token
 *
 * v3.4: 生の API キーをブラウザに渡す /api/key を廃止し、代わりに
 * 短命のエフェメラルトークン（Live API 専用・v1beta）を発行する。
 * キーはサーバー（Vercel 環境変数）だけが持ち、ブラウザはトークンで
 * Google へ直接 WebSocket 接続する（遅延は増えない）。
 *
 * v3.4.1: liveConnectConstraints を公式例の最小構成（model +
 * responseModalities + sessionResumption）に絞った。v3.4 では制約に
 * 文字起こし（不正フィールド languageCode）と VAD 設定まで入れており、
 * Google が HTTP 400 を返してトークン発行に失敗していた。
 * 文字起こし・VAD の設定はクライアントの setup メッセージ側で送る。
 * 失敗時は Google の詳細エラー（message / status のみ）を 502 に含める。
 *
 * v3.4.2: 制約なしのプレーントークンに変更。v3.4.1 でも
 * 「Unknown name "liveConnectConstraints" at 'auth_token'」で 400 になった
 * （実機の詳細エラーで確認）。生 REST では制約フィールドを受け付けないため、
 * 公式の簡略例どおり uses / expireTime / newSessionExpireTime のみで発行し、
 * モデル・設定はクライアントの setup メッセージで指定する。
 * トークンは単回・短命のまま。モデル固定はしない（利用制限は次フェーズ）。
 *
 * 公式ドキュメント: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 * 既定の有効期限: 新規セッション開始は発行後1分以内、接続は30分、uses 1回。
 * ここでは新規セッション開始を2分に少しだけ延ばし、接続は30分のままにする。
 *
 * 注意: トークン化は「キーの盗難」を止めるが、無料枠・レート制限がないと
 * /api/token 自体が公開の発行口になり「タダ乗り」は止まらない。
 * アカウント・利用制限は次フェーズで必須。
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
  // トークン発行口を外部サイトから使わせない（同一オリジンのブラウザ fetch は Origin を送る）。
  if (!allowed) {
    res.status(403).json({ success: false, error: 'このオリジンからはトークンを発行できません。' });
    return;
  }

  // v3.6.0: ログイン必須（セッションCookieがないと発行しない）。
  if (!auth.isAuthenticated(req)) {
    res.status(401).json({ success: false, code: 'AUTH_REQUIRED', error: 'ログインが必要です。' });
    return;
  }

  const apiKey = getServerKey();
  if (!apiKey) {
    res.status(500).json({
      success: false,
      error: 'サーバーに Gemini キーが設定されていません（Vercel環境変数 GEMINI_LIVE_API_KEY / GEMINI_API_KEY）。'
    });
    return;
  }

  const now = Date.now();
  const expireTime = new Date(now + 30 * 60 * 1000).toISOString();
  const newSessionExpireTime = new Date(now + 2 * 60 * 1000).toISOString();

  // v3.4.2: プレーントークン（制約なし）。モデル・設定はクライアント setup で指定する。
  const body = {
    uses: 1,
    expireTime,
    newSessionExpireTime
  };

  try {
    const upstream = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data.name) {
      // v3.4.1: 切り分けのため Google の詳細エラー（message / status のみ）を返す。
      // キー等の秘密情報は含めない。
      const gErr = (data && data.error) || {};
      const detail = [gErr.status, gErr.message].filter(Boolean).join(': ');
      res.status(502).json({
        success: false,
        error: `トークン発行に失敗しました（HTTP ${upstream.status}）。キー設定と Live API の有効化を確認してください。${detail ? ` 詳細: ${detail}` : ''}`,
        upstreamStatus: gErr.status || null,
        upstreamMessage: gErr.message || null
      });
      return;
    }
    res.status(200).json({
      success: true,
      token: data.name,
      expireTime: data.expireTime || expireTime,
      newSessionExpireTime: data.newSessionExpireTime || newSessionExpireTime
    });
  } catch (error) {
    res.status(502).json({
      success: false,
      error: 'トークン発行サーバーに接続できませんでした。しばらく待って再試行してください。'
    });
  }
}

module.exports = handler;
module.exports.default = handler;

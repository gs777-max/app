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
 * 公式ドキュメント: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
 * 既定の有効期限: 新規セッション開始は発行後1分以内、接続は30分、uses 1回。
 * ここでは新規セッション開始を2分に少しだけ延ばし、接続は30分のままにする。
 *
 * 注意: トークン化は「キーの盗難」を止めるが、無料枠・レート制限がないと
 * /api/token 自体が公開の発行口になり「タダ乗り」は止まらない。
 * アカウント・利用制限は次フェーズで必須。
 */

const LIVE_MODEL = 'models/gemini-2.5-flash-native-audio-latest';

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

  const body = {
    uses: 1,
    expireTime,
    newSessionExpireTime,
    liveConnectConstraints: {
      model: LIVE_MODEL,
      config: {
        responseModalities: ['AUDIO'],
        sessionResumption: {},
        inputAudioTranscription: { languageCode: 'ja-JP' },
        outputAudioTranscription: { languageCode: 'ja-JP' },
        realtimeInputConfig: {
          automaticActivityDetection: {
            disabled: false,
            startOfSpeechSensitivity: 'START_SENSITIVITY_HIGH',
            endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
            prefixPaddingMs: 20,
            silenceDurationMs: 500
          }
        }
      }
    }
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
      res.status(502).json({
        success: false,
        error: `トークン発行に失敗しました（HTTP ${upstream.status}）。キー設定と Live API の有効化を確認してください。`
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

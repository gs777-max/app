/**
 * Vercel Serverless Function: Google Gemini Live API Key Provider
 * 
 * Vercel に登録された環境変数（GEMINI_LIVE_API_KEY または GEMINI_API_KEY）を
 * バックエンドから安全かつ自動的にフロントエンドへ提供するサーバーレスAPIです。
 * 
 * エンドポイント: /api/key
 */

// v2.9 小さな緩和: /api/key を叩けるオリジンを自サイトとローカル開発に限定する。
// ※ 完全な対策ではない。サイト訪問者は誰でもキーを読める構造自体は変わらないため、
//   次フェーズでサーバー側プロキシ化（キーをブラウザに渡さない設計）が必須。
function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (origin === 'https://app-aivoiceappvercel.vercel.app') return true;
  if (/^https:\/\/[A-Za-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) return true;
  return false;
}

function handler(req, res) {
  // CORS ヘッダーの設定（許可オリジンにだけ反映する）
  const origin = req.headers && req.headers.origin;
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // OPTIONS プリフライト対応
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET メソッドのみ許可
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
    return;
  }

  try {
    // Vercel 環境変数からキーを取得（表記揺れ・設定揺れに柔軟に対応）
    const apiKey = (
      process.env.GEMINI_LIVE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_LIVE_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      ''
    ).trim();

    if (!apiKey) {
      res.status(404).json({
        success: false,
        error: 'Vercelの環境変数に GEMINI_LIVE_API_KEY または GEMINI_API_KEY が設定されていません。Vercelダッシュボードの Settings > Environment Variables から設定してください。'
      });
      return;
    }

    // 正常レスポンス
    res.status(200).json({
      success: true,
      apiKey: apiKey,
      source: 'vercel_env',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `サーバーエラー: ${error.message}`
    });
  }
}

module.exports = handler;
module.exports.default = handler;

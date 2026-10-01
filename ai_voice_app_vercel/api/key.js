/**
 * Vercel Serverless Function: Google Gemini Live API Key Provider
 * 
 * Vercel に登録された環境変数（GEMINI_LIVE_API_KEY または GEMINI_API_KEY）を
 * バックエンドから安全かつ自動的にフロントエンドへ提供するサーバーレスAPIです。
 * 
 * エンドポイント: /api/key
 */

function handler(req, res) {
  // CORS ヘッダーの設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
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

/**
 * Vercel Serverless Function: /api/key（廃止済み）
 *
 * v3.4 で廃止した。生の API キーをブラウザに返す経路は残さない。
 * 代わりに POST /api/token（エフェメラルトークン発行）を使うこと。
 * /api/get-key はこのファイルのエイリアスのため、同じく 410 を返す。
 */

function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.status(410).json({
    success: false,
    error: '/api/key は廃止されました。生キーは返しません。POST /api/token で一時トークンを取得してください。'
  });
}

module.exports = handler;
module.exports.default = handler;

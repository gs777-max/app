import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // CORSヘッダー設定 (ローカル開発および本番クロスオリジン対応)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Vercel KV 環境変数の有無をチェック (未接続時でもクラッシュさせない安全設計)
  const hasKvConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

  try {
    // -------------------------------------------------------------
    // GET /api/course?id={courseId}
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Missing courseId parameter (?id=...)'
        });
      }

      if (!hasKvConfig) {
        return res.status(200).json({
          success: true,
          courseId: id,
          data: null,
          note: 'Vercel KV is not configured. Running in local fallback mode.'
        });
      }

      const key = `course:${id}`;
      const courseData = await kv.get(key);

      return res.status(200).json({
        success: true,
        courseId: id,
        data: courseData || null
      });
    }

    // -------------------------------------------------------------
    // POST /api/course
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON body' });
        }
      }

      const { courseId, holes, calibrations, ips, updatedAt } = body || {};

      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'Missing courseId in request body'
        });
      }

      const payload = {
        courseId,
        holes: holes || [],
        calibrations: calibrations || {},
        ips: ips || {},
        updatedAt: updatedAt || new Date().toISOString()
      };

      if (!hasKvConfig) {
        return res.status(200).json({
          success: true,
          courseId,
          saved: false,
          note: 'Vercel KV is not configured. Data safely kept in localStorage.'
        });
      }

      const key = `course:${courseId}`;
      await kv.set(key, payload);

      return res.status(200).json({
        success: true,
        message: 'Saved to Vercel KV successfully',
        courseId,
        updatedAt: payload.updatedAt
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  } catch (error) {
    console.error('Vercel KV API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

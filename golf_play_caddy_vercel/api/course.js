import { Redis } from '@upstash/redis';

// Redis クライアントの安全な初期化 (Upstash Redis & Vercel KV 両環境変数に対応)
function getRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (url && token) {
    return new Redis({ url, token });
  }
  return null;
}

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

  const redis = getRedisClient();

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

      if (!redis) {
        return res.status(200).json({
          success: true,
          courseId: id,
          data: null,
          note: 'Vercel KV / Upstash Redis is not configured. Running in local fallback mode.'
        });
      }

      const key = `course:${id}`;
      const courseData = await redis.get(key);

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

      if (!redis) {
        return res.status(200).json({
          success: true,
          courseId,
          saved: false,
          note: 'Vercel KV / Upstash Redis is not configured. Data safely kept in localStorage.'
        });
      }

      const key = `course:${courseId}`;
      await redis.set(key, payload);

      return res.status(200).json({
        success: true,
        message: 'Saved to cloud storage successfully',
        courseId,
        updatedAt: payload.updatedAt
      });
    }

    return res.status(405).json({
      success: false,
      error: `Method ${req.method} Not Allowed`
    });
  } catch (error) {
    console.error('Vercel Cloud API Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal Server Error'
    });
  }
}

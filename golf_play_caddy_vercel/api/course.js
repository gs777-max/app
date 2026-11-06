import { Redis } from '@upstash/redis';

// Redis 接続用環境変数の解決。
// 標準名 (UPSTASH_REDIS_REST_URL / KV_REST_API_URL) を最優先し、無ければ
// Vercel の新しい Storage 接続が付ける接頭辞付きの名前
// (例: REDIS_YELLOW_MOUNTAIN_KV_REST_API_URL) も自動検出する。
// 値そのものは返さず、health では一致した「変数名」だけを診断用に返す。
let matchedRedisEnvKey = null;
function findRedisEnv() {
  const env = process.env;
  const directPairs = [
    ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
    ['KV_REST_API_URL', 'KV_REST_API_TOKEN']
  ];
  for (const [urlKey, tokenKey] of directPairs) {
    if (env[urlKey] && env[tokenKey]) {
      return { url: env[urlKey], token: env[tokenKey], urlKey };
    }
  }
  for (const key of Object.keys(env)) {
    const m = key.match(/^(.*_)?(KV_REST_API_URL|UPSTASH_REDIS_REST_URL)$/);
    if (!m) continue;
    const prefix = key.slice(0, key.length - m[2].length);
    const tokenKey = prefix + m[2].replace('URL', 'TOKEN');
    if (env[key] && env[tokenKey]) {
      return { url: env[key], token: env[tokenKey], urlKey: key };
    }
  }
  // 汎用: *_REST_URL / *_REST_API_URL (https) と対になる *_TOKEN を広く拾う
  for (const key of Object.keys(env)) {
    if (!/(REST_URL|REST_API_URL)$/.test(key)) continue;
    if (typeof env[key] !== 'string' || !env[key].startsWith('https://')) continue;
    const tokenKey = key.replace(/URL$/, 'TOKEN');
    if (env[tokenKey]) {
      return { url: env[key], token: env[tokenKey], urlKey: key };
    }
  }
  return null;
}

// Redis クライアントの安全な初期化
function getRedisClient() {
  const found = findRedisEnv();
  matchedRedisEnvKey = found ? found.urlKey : null;
  if (found) {
    return new Redis({ url: found.url, token: found.token });
  }
  return null;
}

// -------------------------------------------------------------
// バリデーション / マージ用ユーティリティ
// -------------------------------------------------------------
const COURSE_ID_PATTERN = /^[A-Za-z0-9._-]+$/;
const MAX_COURSE_ID_LENGTH = 64;
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB 目安
// エントリ単位で updatedAt マージを行うグループ
const MERGE_GROUPS = ['calibrations', 'manualHoles', 'ips'];
// 削除マーク (tombstone) を保持するグループ名と保持期間。
// 削除した端末の情報が他端末へ伝播するよう、削除は「キーと削除時刻」の
// マークとして保存し、エントリのマージ時に照合して実データを消す。
const TOMBSTONE_GROUP = 'deleted';
const TOMBSTONE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000; // 90日

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function isValidCourseId(id) {
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= MAX_COURSE_ID_LENGTH &&
    COURSE_ID_PATTERN.test(id)
  );
}

// エントリの updatedAt をミリ秒で返す。{updatedAt} を持たない旧形式
// (座標配列そのもの等) は「最も古い」ものとして null を返す。
function entryTimestamp(entry) {
  if (!isPlainObject(entry)) return null;
  const t = Date.parse(entry.updatedAt);
  return Number.isNaN(t) ? null : t;
}

// グループ辞書をエントリ単位でマージする。
// - 両方に updatedAt があれば新しい方を残す
// - 片方だけにあれば、ある方を採用する (無い方は「最も古い」扱い)
// - 両方なければ受信側 (incoming) を採用する
// - 受信に無いキーは既存値を保持する (削除は伝播しない)
function mergeGroup(existingGroup, incomingGroup) {
  const base = isPlainObject(existingGroup) ? existingGroup : {};
  const incoming = isPlainObject(incomingGroup) ? incomingGroup : {};
  const merged = { ...base };
  for (const key of Object.keys(incoming)) {
    if (!(key in merged)) {
      merged[key] = incoming[key];
      continue;
    }
    const incTs = entryTimestamp(incoming[key]);
    const curTs = entryTimestamp(merged[key]);
    if (incTs === null && curTs === null) {
      merged[key] = incoming[key]; // 両方とも旧形式 → 受信側を採用
    } else if (incTs === null) {
      // 受信側が「最も古い」→ 既存 (updatedAt あり) を保持
    } else if (curTs === null) {
      merged[key] = incoming[key]; // 既存が「最も古い」→ 受信側を採用
    } else if (incTs >= curTs) {
      merged[key] = incoming[key]; // 受信側が新しい (同点も受信側)
    }
    // それ以外は既存の方が新しいので保持
  }
  return merged;
}

// 削除マーク同士のマージ: キーごとに deletedAt が新しい方を残し、
// 保持期間 (90日) を過ぎた古いマークは掃除する。
function mergeTombstones(existingDeleted, incomingDeleted) {
  const merged = {};
  const now = Date.now();
  const consider = (src) => {
    if (!isPlainObject(src)) return;
    for (const key of Object.keys(src)) {
      const entry = src[key];
      const t = isPlainObject(entry) ? Date.parse(entry.deletedAt) : NaN;
      if (Number.isNaN(t)) continue;
      if (now - t > TOMBSTONE_RETENTION_MS) continue; // 期限切れは破棄
      if (!merged[key] || t > Date.parse(merged[key].deletedAt)) {
        merged[key] = entry;
      }
    }
  };
  consider(existingDeleted);
  consider(incomingDeleted);
  return merged;
}

// 削除マークを実データへ適用する: マークより古い (または時刻を持たない)
// エントリを各グループから取り除く。マークより後に再作成された
// エントリ (updatedAt が新しいもの) は残す。
function applyTombstones(merged, tombstones) {
  for (const group of MERGE_GROUPS) {
    if (!isPlainObject(merged[group])) continue;
    for (const key of Object.keys(merged[group])) {
      const tomb = tombstones[key];
      if (!tomb) continue;
      const tombTs = Date.parse(tomb.deletedAt);
      if (Number.isNaN(tombTs)) continue;
      const entryTs = entryTimestamp(merged[group][key]);
      if (entryTs === null || entryTs < tombTs) {
        delete merged[group][key];
      }
    }
  }
}

// redis.get の戻りが文字列だった場合にオブジェクトへ復元する保険
function asRecord(value) {
  if (isPlainObject(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (isPlainObject(parsed)) return parsed;
    } catch (e) { /* fall through */ }
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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Sync-Token'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedisClient();

  try {
    // -------------------------------------------------------------
    // GET /api/course?id={courseId}
    // GET /api/course (id なし) / ?health=1 → 死活確認
    // -------------------------------------------------------------
    if (req.method === 'GET') {
      const { id, health } = req.query || {};

      // 死活確認: データは返さず、Redis 設定状況とサーバー時刻のみ返す
      if (!id || health === '1' || health === 'true') {
        return res.status(200).json({
          success: true,
          configured: !!redis,
          envKey: matchedRedisEnvKey,
          time: new Date().toISOString()
        });
      }

      if (!isValidCourseId(id)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid courseId parameter'
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
    // POST /api/course (キー単位マージ保存)
    // -------------------------------------------------------------
    if (req.method === 'POST') {
      // 任意の共有トークン認証: SYNC_TOKEN が設定されている場合のみ、
      // x-sync-token ヘッダーの一致を要求する。未設定なら素通し (互換)。
      const syncToken = process.env.SYNC_TOKEN;
      if (syncToken && req.headers['x-sync-token'] !== syncToken) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: missing or invalid x-sync-token header'
        });
      }

      // ペイロードサイズチェック (Content-Length があれば先に弾く)
      const declaredLength = parseInt(req.headers['content-length'] || '', 10);
      if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
        return res.status(413).json({
          success: false,
          error: 'Payload too large'
        });
      }

      let body = req.body;
      if (typeof body === 'string') {
        if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
          return res.status(413).json({
            success: false,
            error: 'Payload too large'
          });
        }
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ success: false, error: 'Invalid JSON body' });
        }
      }

      if (!isPlainObject(body)) {
        return res.status(400).json({
          success: false,
          error: 'Request body must be a JSON object'
        });
      }

      // パース済みボディでも実サイズで再チェックする
      if (Buffer.byteLength(JSON.stringify(body), 'utf8') > MAX_BODY_BYTES) {
        return res.status(413).json({
          success: false,
          error: 'Payload too large'
        });
      }

      const courseId = body.courseId || body.id;
      if (!courseId) {
        return res.status(400).json({
          success: false,
          error: 'Missing courseId in request body'
        });
      }
      if (!isValidCourseId(courseId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid courseId (allowed: A-Z a-z 0-9 . _ -, max 64 chars)'
        });
      }

      if (!redis) {
        return res.status(200).json({
          success: true,
          courseId,
          saved: false,
          note: 'Vercel KV / Upstash Redis is not configured. Data safely kept in localStorage.'
        });
      }

      const key = `course:${courseId}`;
      const existing = asRecord(await redis.get(key));

      // 世代バックアップ: 上書き前に既存レコードを1世代だけ退避する
      if (existing) {
        try {
          await redis.set(`${key}:__prev`, existing);
        } catch (e) {
          console.warn('Previous-generation backup failed:', e);
        }
      }

      // ---- マージ ----
      // 1) グループ外フィールドは受信に含まれるものだけ更新し、
      //    含まれないフィールドは既存値を保持する (部分更新で消さない)
      const merged = existing ? { ...existing } : {};
      for (const field of Object.keys(body)) {
        if (MERGE_GROUPS.includes(field)) continue; // グループは下で個別マージ
        if (field === TOMBSTONE_GROUP) continue; // 削除マークは下で個別マージ
        if (field === 'updatedAt' || field === 'clientUpdatedAt') continue; // サーバー側で採番
        if (field === 'id') continue; // courseId に一本化
        merged[field] = body[field];
      }
      merged.courseId = courseId;

      // 2) グループはエントリ単位で updatedAt の新しい方を残す
      for (const group of MERGE_GROUPS) {
        if (isPlainObject(body[group])) {
          merged[group] = mergeGroup(existing ? existing[group] : null, body[group]);
        } else if (!isPlainObject(merged[group])) {
          merged[group] = {};
        }
      }

      // 2.5) 削除マークをマージし、実データへ適用する (削除の伝播)
      merged[TOMBSTONE_GROUP] = mergeTombstones(
        existing ? existing[TOMBSTONE_GROUP] : null,
        body[TOMBSTONE_GROUP]
      );
      applyTombstones(merged, merged[TOMBSTONE_GROUP]);

      // 3) updatedAt はサーバー時刻で採番し直す。
      //    クライアント申告値は clientUpdatedAt として併記する。
      if (typeof body.updatedAt === 'string' && body.updatedAt) {
        merged.clientUpdatedAt = body.updatedAt;
      }
      merged.updatedAt = new Date().toISOString();

      await redis.set(key, merged);

      return res.status(200).json({
        success: true,
        message: 'Saved to cloud storage successfully',
        courseId,
        shotsCount: Array.isArray(merged.shots) ? merged.shots.length : 0,
        updatedAt: merged.updatedAt
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

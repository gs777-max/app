#!/usr/bin/env python3
"""
ai_voice_app_vercel / api / server.py
- Vercel Python Serverless Function (エンドポイント: /api/server)
- v3.4: 生キー返却（/api/key 等）は廃止。/api/token でエフェメラルトークンを発行し、
  /api/rest で REST フォールバックをサーバー経由にする。キーは環境変数だけが持つ。
- ローカル開発時 (python api/server.py 8080) は public ディレクトリの静的Web配信も担当
"""

from http.server import SimpleHTTPRequestHandler
import socketserver
import os
import sys
import json
import re
import urllib.request
import urllib.error
import hashlib
import hmac
import base64
from datetime import datetime, timedelta, timezone

# Windows 環境での Unicode 出力対策
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 静的ファイルのルートパス (../public)
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))

REST_MODEL = 'models/gemini-2.5-flash'

def get_api_key():
    """環境変数またはローカルの開発用バックアップ/共通設定からキーを取得（サーバー内でのみ使用）"""
    key = os.environ.get('GEMINI_LIVE_API_KEY') or os.environ.get('GEMINI_API_KEY')
    if key:
        return key.strip(), "vercel_env"

    # 開発環境ローカルでの探索パス
    candidate_paths = [
        os.path.join(PUBLIC_DIR, '.env_anti_20261001_1210_BK'),
        os.path.join(os.path.dirname(__file__), '..', '..', 'ai_voice_app', '.env'),
        os.path.join(os.path.dirname(__file__), '..', '.env')
    ]
    for env_path in candidate_paths:
        if os.path.exists(env_path):
            try:
                with open(env_path, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                    m = re.search(r'(?:GEMINI_LIVE_API_KEY|GEMINI_API_KEY)\s*=\s*([^\r\n#]+)', content)
                    if m and m.group(1).strip() and m.group(1).strip() != 'YOUR_GEMINI_API_KEY_HERE':
                        return m.group(1).strip(), f"local_dev_key ({os.path.basename(env_path)})"
            except Exception:
                pass
    return None, None

def _iso(dt):
    return dt.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')

def issue_ephemeral_token(api_key):
    """Gemini のエフェメラルトークンを発行する（v1beta auth_tokens）。

    v3.4.2: 制約なしのプレーントークン。生 REST では liveConnectConstraints が
    「Unknown name」として 400 で拒否される（実機の詳細エラーで確認）。
    モデル・設定はクライアントの setup メッセージ側で送る。
    """
    now = datetime.now(timezone.utc)
    body = {
        "uses": 1,
        "expireTime": _iso(now + timedelta(minutes=30)),
        "newSessionExpireTime": _iso(now + timedelta(minutes=2))
    }
    req = urllib.request.Request(
        'https://generativelanguage.googleapis.com/v1beta/auth_tokens',
        data=json.dumps(body).encode('utf-8'),
        headers={'x-goog-api-key': api_key, 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    return data

def rest_generate(api_key, prompt, system_instruction):
    """REST フォールバック（generateContent）をサーバー側で実行する。"""
    body = {"contents": [{"parts": [{"text": prompt}]}]}
    if system_instruction:
        body["systemInstruction"] = {"parts": [{"text": system_instruction}]}
    req = urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/{REST_MODEL}:generateContent',
        data=json.dumps(body).encode('utf-8'),
        headers={'x-goog-api-key': api_key, 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read().decode('utf-8'))
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return ''

# --- v3.6.0 ログイン認証（ID/PW平文は書かない。環境変数のSHA-256ハッシュと比較） ---
AUTH_COOKIE = 'aivoice_session'
AUTH_SESSION_SEC = 7 * 24 * 60 * 60

def _login_hashes():
    return ((os.environ.get('LOGIN_ID_HASH') or '').strip().lower(),
            (os.environ.get('LOGIN_PASSWORD_HASH') or '').strip().lower())

def _auth_configured():
    id_h, pw_h = _login_hashes()
    return bool(re.fullmatch(r'[0-9a-f]{64}', id_h or '')) and bool(re.fullmatch(r'[0-9a-f]{64}', pw_h or ''))

def _sha256_hex(v):
    return hashlib.sha256(str(v or '').encode('utf-8')).hexdigest()

def _b64url(b):
    return base64.urlsafe_b64encode(b).decode('ascii').rstrip('=')

def _sign_session(payload_b64):
    _, pw_h = _login_hashes()
    return _b64url(hmac.new(pw_h.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest())

def _create_session_token():
    import time as _time
    payload = _b64url(json.dumps({"exp": int((_time.time() + AUTH_SESSION_SEC) * 1000)}).encode('utf-8'))
    return f"{payload}.{_sign_session(payload)}"

def _verify_session_token(token):
    if not token or '.' not in token:
        return False
    payload, sig = token.rsplit('.', 1)
    if not hmac.compare_digest(sig, _sign_session(payload)):
        return False
    try:
        import time as _time
        pad = '=' * (-len(payload) % 4)
        data = json.loads(base64.urlsafe_b64decode(payload + pad).decode('utf-8'))
        return isinstance(data.get('exp'), (int, float)) and _time.time() * 1000 < data['exp']
    except Exception:
        return False

def _is_authenticated(headers):
    if not _auth_configured():
        return False
    raw = headers.get('Cookie') or ''
    for part in raw.split(';'):
        if '=' in part:
            k, v = part.split('=', 1)
            if k.strip() == AUTH_COOKIE:
                return _verify_session_token(v.strip())
    return False

class handler(SimpleHTTPRequestHandler):
    """Vercel サーバーレス関数規格ハンドラー (class名: handler)"""

    def __init__(self, *args, **kwargs):
        # ローカル実行時は public ディレクトリを配信
        if os.path.exists(PUBLIC_DIR):
            super().__init__(*args, directory=PUBLIC_DIR, **kwargs)
        else:
            super().__init__(*args, **kwargs)

    def _allowed_origin(self):
        origin = self.headers.get('Origin') if hasattr(self, 'headers') and self.headers else None
        if not origin:
            return None
        if origin == 'https://app-aivoiceappvercel.vercel.app':
            return origin
        if re.match(r'^https://[A-Za-z0-9-]+\.vercel\.app$', origin):
            return origin
        if re.match(r'^http://(localhost|127\.0\.0\.1)(:\d+)?$', origin):
            return origin
        return None

    def end_headers(self):
        allowed = self._allowed_origin()
        if allowed:
            self.send_header('Access-Control-Allow-Origin', allowed)
            self.send_header('Vary', 'Origin')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def _send_json(self, status, resp_data, set_cookie=None):
        body = json.dumps(resp_data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        if set_cookie:
            self.send_header('Set-Cookie', set_cookie)
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')

        # v3.4: 生キー返却経路は廃止（410）。/api/server もキー返却には使わない。
        if clean_path in ['/api/key', '/api/get-key'] or (not os.path.exists(PUBLIC_DIR) and clean_path == ''):
            self._send_json(410, {
                "success": False,
                "error": "/api/key は廃止されました。生キーは返しません。POST /api/token で一時トークンを取得してください。",
                "runtime": "python"
            })
            return
        if clean_path == '/api/login':
            if not _auth_configured():
                self._send_json(503, {"success": False, "code": "AUTH_NOT_CONFIGURED", "error": "ログイン設定が未完了です（環境変数 LOGIN_ID_HASH / LOGIN_PASSWORD_HASH）。", "runtime": "python"})
                return
            self._send_json(200, {"success": True, "authenticated": _is_authenticated(self.headers), "runtime": "python"})
            return
        if clean_path in ['/api/token', '/api/rest']:
            self._send_json(405, {"success": False, "error": "POSTのみ対応しています。", "runtime": "python"})
            return

        # ローカルサーバー実行時の静的ファイル配信
        super().do_GET()

    def do_DELETE(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        if clean_path == '/api/login':
            self._send_json(200, {"success": True, "runtime": "python"},
                            set_cookie=f"{AUTH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0")
            return
        self._send_json(404, {"success": False, "error": "Not Found", "runtime": "python"})

    def do_POST(self):
        clean_path = self.path.split('?')[0].rstrip('/')

        if clean_path not in ['/api/token', '/api/rest', '/api/login']:
            self._send_json(404, {"success": False, "error": "Not Found", "runtime": "python"})
            return
        if not self._allowed_origin():
            self._send_json(403, {"success": False, "error": "このオリジンからは利用できません。", "runtime": "python"})
            return

        if clean_path == '/api/login':
            if not _auth_configured():
                self._send_json(503, {"success": False, "code": "AUTH_NOT_CONFIGURED", "error": "ログイン設定が未完了です（環境変数 LOGIN_ID_HASH / LOGIN_PASSWORD_HASH）。", "runtime": "python"})
                return
            try:
                length = int(self.headers.get('Content-Length') or 0)
                raw = self.rfile.read(length) if length > 0 else b''
                payload = json.loads(raw.decode('utf-8')) if raw else {}
            except Exception:
                payload = {}
            id_h, pw_h = _login_hashes()
            ok = hmac.compare_digest(_sha256_hex(payload.get('id')), id_h) and hmac.compare_digest(_sha256_hex(payload.get('password')), pw_h)
            if not ok:
                self._send_json(401, {"success": False, "error": "IDまたはパスワードが違います。", "runtime": "python"})
                return
            cookie = f"{AUTH_COOKIE}={_create_session_token()}; Path=/; HttpOnly; SameSite=Lax; Max-Age={AUTH_SESSION_SEC}"
            self._send_json(200, {"success": True, "authenticated": True, "runtime": "python"}, set_cookie=cookie)
            return

        # v3.6.0: ログイン必須（セッションCookieがないと発行しない）。
        if not _is_authenticated(self.headers):
            self._send_json(401, {"success": False, "code": "AUTH_REQUIRED", "error": "ログインが必要です。", "runtime": "python"})
            return

        key, _source = get_api_key()
        if not key:
            self._send_json(500, {"success": False, "error": "サーバーに Gemini キーが設定されていません。", "runtime": "python"})
            return

        try:
            length = int(self.headers.get('Content-Length') or 0)
            raw = self.rfile.read(length) if length > 0 else b''
            payload = json.loads(raw.decode('utf-8')) if raw else {}
        except Exception:
            payload = {}

        try:
            if clean_path == '/api/token':
                data = issue_ephemeral_token(key)
                if not data.get('name'):
                    self._send_json(502, {"success": False, "error": "トークン発行に失敗しました。", "runtime": "python"})
                    return
                self._send_json(200, {
                    "success": True,
                    "token": data.get('name'),
                    "expireTime": data.get('expireTime'),
                    "newSessionExpireTime": data.get('newSessionExpireTime'),
                    "runtime": "python"
                })
                return
            # /api/rest
            prompt = str(payload.get('prompt') or '').strip()
            system_instruction = str(payload.get('systemInstruction') or '')
            if not prompt:
                self._send_json(400, {"success": False, "error": "prompt が空です。", "runtime": "python"})
                return
            if len(prompt) > 2000 or len(system_instruction) > 4000:
                self._send_json(400, {"success": False, "error": "入力が長すぎます。", "runtime": "python"})
                return
            text = rest_generate(key, prompt, system_instruction)
            self._send_json(200, {"success": True, "text": text, "runtime": "python"})
            return
        except urllib.error.HTTPError as e:
            # v3.4.1: 切り分けのため Google の詳細エラー（message / status のみ）を返す。
            detail = ''
            try:
                err_data = json.loads(e.read().decode('utf-8'))
                g_err = err_data.get('error') or {}
                detail = ': '.join(str(x) for x in [g_err.get('status'), g_err.get('message')] if x)
            except Exception:
                pass
            msg = f"上流APIエラー（HTTP {e.code}）" + (f"。詳細: {detail}" if detail else "")
            self._send_json(502, {"success": False, "error": msg, "runtime": "python"})
            return
        except Exception:
            self._send_json(502, {"success": False, "error": "上流APIに接続できませんでした。", "runtime": "python"})
            return

    def log_message(self, format, *args):
        # 簡易アクセスログ
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
        sys.stdout.flush()

def run_server(port=8080):
    handler_class = handler
    for p in range(port, port + 10):
        try:
            with socketserver.TCPServer(("", p), handler_class) as httpd:
                print("=" * 60)
                print(f"[*] 感情AIボイスアプリ (Vercel Python Serverless in api/) 起動完了！")
                print(f"[*] Local URL       : http://localhost:{p}/")
                print(f"[*] 命名規約URL(今回): http://localhost:{p}/index_20261001_1244.html")
                print(f"[*] 命名規約URL(前回): http://localhost:{p}/index_anti_20261001_1244.html")
                print(f"[*] Python API エンドポイント : http://localhost:{p}/api/token")
                print(f"[*] 停止するには Ctrl+C を押してください。")
                print("=" * 60)
                sys.stdout.flush()
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    run_server(port)

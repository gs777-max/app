#!/usr/bin/env python3
"""
ai_voice_app_vercel / api / server.py
- Vercel Python Serverless Function (エンドポイント: /api/server)
- Google Live API キーの提供 (GEMINI_LIVE_API_KEY / GEMINI_API_KEY)
- ローカル開発時 (python api/server.py 8080) は public ディレクトリの静的Web配信も担当
"""

from http.server import SimpleHTTPRequestHandler
import socketserver
import os
import sys
import json
import re

# Windows 環境での Unicode 出力対策
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# 静的ファイルのルートパス (../public)
PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public'))

def get_api_key():
    """環境変数またはローカルの開発用バックアップ/共通設定からキーを取得"""
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

class handler(SimpleHTTPRequestHandler):
    """Vercel サーバーレス関数規格ハンドラー (class名: handler)"""

    def __init__(self, *args, **kwargs):
        # ローカル実行時は public ディレクトリを配信
        if os.path.exists(PUBLIC_DIR):
            super().__init__(*args, directory=PUBLIC_DIR, **kwargs)
        else:
            super().__init__(*args, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        clean_path = self.path.split('?')[0].rstrip('/')
        
        # APIキー要求の場合 (/api/server, /api/key, /api/get-key)
        if clean_path in ['/api/server', '/api/key', '/api/get-key'] or (not os.path.exists(PUBLIC_DIR) and clean_path == ''):
            key, source = get_api_key()
            if key:
                resp_data = {
                    "success": True,
                    "apiKey": key,
                    "source": f"python_serverless ({source})",
                    "runtime": "python"
                }
                body = json.dumps(resp_data, ensure_ascii=False).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            else:
                resp_data = {
                    "success": False,
                    "error": "GEMINI_LIVE_API_KEY not configured in environment variables",
                    "runtime": "python"
                }
                body = json.dumps(resp_data, ensure_ascii=False).encode('utf-8')
                self.send_response(404)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

        # ローカルサーバー実行時の静的ファイル配信
        super().do_GET()

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
                print(f"[*] Python API エンドポイント : http://localhost:{p}/api/server")
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

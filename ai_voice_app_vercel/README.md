# 🎙️ 感情AIボイス - ネオ・サイバーAIホログラムHUD (v2.7 Vercel Serverless)

Google Gemini Live API（WebSocket 双方向音声ストリーミング）を活用した、リアルタイム感情音声対話Webアプリケーションです。
Vercel へのデプロイに最適化されたサーバーレス関数アーキテクチャを採用しています。

---

## 🌟 今回の改修内容 (v2.7)

1. **Vercel サーバーレス API バックエンドの構築 (`api/key.js`)**:
   - Vercel の環境変数（`GEMINI_LIVE_API_KEY` または `GEMINI_API_KEY`）を自動的に読み込んでクライアントに提供するバックエンド API を新規作成。
   - クライアント側から直接 `.env` ファイルを fetch する脆弱な仕様を完全に撤廃・不要化。
2. **自動キーローダーの実装 (`initEnvConfig`)**:
   - ページ起動時に自動で `/api/key` へリクエストを送信し、API キーをシームレスに初期設定。
   - キーが未設定の場合でも、画面右上の「⚙️ CONFIG」モーダルから直接入力・ローカル保存 (`localStorage`) する安全なフォールバックを維持。
3. **ローカルサーバー (`server.py`) の Vercel エミュレーション機能**:
   - ローカル開発時も `http://localhost:8080/api/key` 経由でキーが自動取得されるよう、Vercel サーバーレス API と同等のエンドポイントをシミュレーション。
4. **マルチプラットフォーム対応 (iOS / Windows / macOS)**:
   - iOS Safari で必須となるユーザー操作起点の AudioContext 有効化、Web Audio API の単一インスタンス管理、マイク権限ハンドリングに完全対応。

---

## 🚀 Vercel へのデプロイ手順

1. **GitHub リポジトリへプッシュ**:
   `game/ai_voice_app_vercel` 以下のコードを GitHub にプッシュします。

2. **Vercel ダッシュボードでインポート**:
   - [Vercel Dashboard](https://vercel.com/) にログインし、「Add New Project」からリポジトリを選択します。
   - Root Directory を `game/ai_voice_app_vercel` に指定（またはリポジトリルートの場合そのまま）。

3. **環境変数 (Environment Variables) の登録**:
   Vercel のプロジェクト設定画面で以下の環境変数のいずれかを登録します：
   - **Key**: `GEMINI_LIVE_API_KEY`（または `GEMINI_API_KEY`）
   - **Value**: Google AI Studio で取得した Gemini API キー

4. **デプロイ完了**:
   デプロイ後、公開URLにアクセスすると自動的に Vercel サーバーレス関数からキーがロードされ、すぐに音声対話が可能です！

---

## 🌐 ローカルWebサーバー URL

現在、ローカルサーバー（ポート 8080）が稼働中です：

- **今回分 URL (最新版 v2.7)**:
  [http://localhost:8080/index_20261001_1244.html](http://localhost:8080/index_20261001_1244.html)
- **ルート URL**:
  [http://localhost:8080/](http://localhost:8080/)
- **前回分 URL (バックアップ版・いつでも復元可能)**:
  [http://localhost:8080/index_anti_20261001_1244.html](http://localhost:8080/index_anti_20261001_1244.html)
- **サーバーレス API エンドポイント (Python)**:
  [http://localhost:8080/api/server](http://localhost:8080/api/server)
- **サーバーレス API エンドポイント (JS/共通)**:
  [http://localhost:8080/api/key](http://localhost:8080/api/key)

---

## 📋 ローカル実行手順

```bash
# game/ai_voice_app_vercel ディレクトリで実行
python api/server.py 8080
```
ブラウザで `http://localhost:8080/` を開き、マイクを許可して「会話開始」を押してください。

# ⛅ SmartWeather TV PRO | 専門気象＆ゴルフコース情報チャンネル (Vercel Edition)

専門放送局仕様のプロ向け気象＆全国名門ゴルフ場スマート天気チャンネル Web アプリケーションです。  
iOS（iPhone / iPad）、Mac、Windows の全デバイスに完全対応し、Vercel への 1-Click デプロイ設定が施されています。

---

## 🌟 改修内容 & Vercel 最適化 (2026/10/03 11:43)

### 1. Vercel デプロイ完全対応
- **ルート 404 エラー解消**:
  Vercel の仕様に対応したエントリーポイント `index.html` および `vercel.json` ルーティング設定（`/`、`/weather`、`/index_weatherSearch`）を新設。
- **ビルドエラー・依存関係インストールの完全防止**:
  `vercel.json` に `"framework": null`, `"buildCommand": null`, `"installCommand": null`, `"outputDirectory": "."` を指定。静的 HTML/JS サイトとして認識させ、`npm install`（Installing dependencies...）やビルドエラーの発生を 100% 回避。
- **マルチフォールバック構造**:
  万が一 Vercel の管理画面で Output Directory に `public` や `dist` が指定されていても動作するよう、`public/` および `dist/` ディレクトリにも静的ファイルを同期配備。
- **PWA・HTTPS・SEO 最適化**:
  PWA マニフェスト（`manifest.json`）および天気ファビコン（⛅）、OGP ソーシャルカード用メタタグを完備。

### 2. iOS (iPhone / iPad) 最適化
- **セーフエリアインセット**:
  `env(safe-area-inset-*)` に対応し、iPhone のノッチ・Dynamic Island・下部ホームバーとの被りを解消。
- **`100dvh` Viewport 対応**:
  アドレスバー出入り時の画面カクつきや縦伸びを解消。
- **位置情報 (Geolocation) ハンドリング**:
  HTTPS 経由での現在地天気取得（Open-Meteo API連携）を安定動作化。

### 3. Mac & Windows (PC) 最適化
- **キーボードショートカット**:
  - `/` キー: ゴルフ場・都市検索入力欄へ即時フォーカス＆全選択。
  - `Escape` キー: 検索入力のクリア・フォーカス解除。
  - `Enter` キー: 検索の即時実行。
- **レスポンシブ UI**:
  4K / Retina 高解像度モニターからラップトップまで、サイバーダークな放送局 UI がクリアに描画。

---

## 🌐 ローカル Web サーバー URL

現在、`game/index_weatherSearch_vercel` をルートとしてポート **`8080`** にてローカルサーバーが稼働中です：

- **今回分 URL (最新版・Vercel 対応版)**:  
  [http://localhost:8080/index_weatherSearch_20261003_1143.html](http://localhost:8080/index_weatherSearch_20261003_1143.html)  
  または  
  [http://localhost:8080/index_20261003_1143.html](http://localhost:8080/index_20261003_1143.html)
- **ルート URL (Vercel デプロイ時と同一表示)**:  
  [http://localhost:8080/](http://localhost:8080/)
- **メインファイル URL**:  
  [http://localhost:8080/index_weatherSearch.html](http://localhost:8080/index_weatherSearch.html)
- **前回分 URL (バックアップ版・改修前バージョン)**:  
  [http://localhost:8080/index_weatherSearch_anti_20261003_1143_BK.html](http://localhost:8080/index_weatherSearch_anti_20261003_1143_BK.html)

---

## 📁 ファイル構成一覧

| ファイル名 | 説明 |
| :--- | :--- |
| `index.html` | Vercel ルート配信用最新メインファイル |
| `index_weatherSearch.html` | 最新改修版（直接リンク用） |
| `index_weatherSearch_20261003_1143.html` | 今回分（当日日付・更新時間付きファイル） |
| `index_weatherSearch_anti_20261003_1143_BK.html` | 前回分（修正前バックアップ、いつでも復元可能） |
| `old/` | 過去バックアップ保管ディレクトリ |
| `vercel.json` | Vercel 高速静的配信設定ファイル |
| `manifest.json` | PWA（ホーム画面追加）マニフェスト |
| `package.json` | ローカル開発・設定ファイル |
| `.vercelignore` | デプロイ除外設定（デプロイ高速化） |
| `public/` / `dist/` | Vercel 出力ディレクトリフォールバック用同期フォルダ |

---

## 🚀 Vercel デプロイ手順

1. 本ディレクトリ（`game/index_weatherSearch_vercel`）の内容を GitHub リポジトリにプッシュします。
2. Vercel ダッシュボードでリポジトリをインポートします。
3. `vercel.json` の設定により、ビルドコマンド不要で自動的に即座にデプロイされます！

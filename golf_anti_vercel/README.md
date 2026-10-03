# ⛳ 3D Golf Tour — PGA Realistic Simulation (Vercel Edition)

Three.js を活用した、本格 3D ゴルフシミュレーションゲームです。  
iOS（iPhone / iPad）、Mac、Windows のすべてのデバイス環境で快適に動作し、Vercel への完全対応（静的デプロイ設定）が施されています。

---

## 🌟 Vercel ビルドエラー解消 & 改修内容 (2026/10/03 11:04)

### 発生していたエラーの原因と対策
- **原因**:  
  静的 HTML/JS サイトであるにもかかわらず、`package.json` のビルド定義によって Vercel が「Node.js プロジェクト」と自動判定し、`Installing dependencies...`（依存関係インストール）や存在しない出力ディレクトリ（`public` や `dist`）の探索を行おうとして停止していました。
- **解決策**:  
  1. `vercel.json` に `"framework": null`, `"buildCommand": null`, `"installCommand": null`, `"outputDirectory": "."` を明記し、Vercel の自動推論を抑制してビルド不要の純粋な静的サイト（Edge CDN 配信）として即座にデプロイを完了させる設計に最適化。
  2. `package.json` 内からビルドコマンドを排除し、万が一の誤動作を防止。
  3. 万が一 Vercel の管理画面設定で `public` や `dist` が Output Directory に指定されていても成功するよう、フォールバック構成（`public/`、`dist/`）を完備。
  4. `.vercelignore` を追加し、過去のバックアップファイル（`old/`）を除外してデプロイを数秒で高速完了化。

---

## 🌐 ローカル Web サーバー URL

現在、ローカルサーバーがポート `8080` にて稼働中です：

- **今回分 URL (最新版・Vercel ビルドエラー解消版)**:  
  [http://localhost:8080/index_20261003_1104.html](http://localhost:8080/index_20261003_1104.html)  
  または  
  [http://localhost:8080/golf_3d_game_20261003_1104.html](http://localhost:8080/golf_3d_game_20261003_1104.html)
- **ルート URL (Vercel デプロイ時と同一表示)**:  
  [http://localhost:8080/](http://localhost:8080/)
- **メインファイル URL**:  
  [http://localhost:8080/golf_3d_game.html](http://localhost:8080/golf_3d_game.html)
- **前回分 URL (バックアップ版・いつでも改修前へ復元可能)**:  
  [http://localhost:8080/index_anti_20261003_1104_BK.html](http://localhost:8080/index_anti_20261003_1104_BK.html)  
  または  
  [http://localhost:8080/golf_3d_game_anti_20261003_1104_BK.html](http://localhost:8080/golf_3d_game_anti_20261003_1104_BK.html)

---

## 🚀 GitHub プッシュ & Vercel 再デプロイ手順

本修正を GitHub リポジトリ（`github.com/gs777-max/app`）へプッシュするだけで、Vercel 側で自動的にビルド不要の静的サイトとして検知され、数秒でデプロイが完了します！

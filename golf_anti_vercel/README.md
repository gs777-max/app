# ⛳ 3D Golf Tour — PGA Realistic Simulation (Vercel Edition)

Three.js を活用した、本格 3D ゴルフシミュレーションゲームです。  
iOS（iPhone / iPad）、Mac、Windows のすべてのデバイス環境で快適に動作し、Vercel への 1-Click デプロイに完全対応しています。

---

## 🌟 改修内容 & マルチデバイス最適化 (2026/10/03)

1. **Vercel デプロイ完全対応**:
   - `vercel.json` ルーティング設定（ルート `/` での自動ロード、`cleanUrls` 有効化）。
   - エントリーポイント `index.html` および `golf_3d_game.html` のデュアルサポート。
   - PWA マニフェスト（`manifest.json`）とファビコンを同梱し、ホーム画面追加（PWA）やアプリ化に対応。

2. **iOS（iPhone / iPad）最適化**:
   - `100dvh` (Dynamic Viewport Height) 対応により、アドレスバー出入り時のUIズレ・画面はみ出しを解消。
   - ピンチズーム・ダブルタップ拡大の誤動作を防止（`gesturestart` 抑制 & `touch-action` 最適化）。
   - Safari の厳格な Autoplay ポリシーに対応（`touchstart` / `click` / スタートボタン押下時の Web Audio 確実アンロック）。
   - ノッチ・Dynamic Island・ホームバーのセーフエリア（`env(safe-area-inset-*)`）対応。

3. **Mac & Windows (PC) 最適化**:
   - キーボード操作を大幅強化：
     - **ショット**: `SPACE` / `ENTER`
     - **エイム（左右）**: `←` `→` または `A` `D`
     - **視線チルト（上下）**: `↑` `↓` または `W` `S`
     - **カメラ切り替え**: `C`
     - **弾道トレース**: `T`
   - PC 画面向けに操作ガイドバッジを画面左下に常時スマート表示。
   - マウス右ドラッグによるカメラ自由回転時の右クリックメニュー（コンテキストメニュー）誤発動を防止。
   - Retina / 4K 高解像度ディスプレイにおける最適なピクセル比（`Math.min(devicePixelRatio, 2)`）による軽快な 60fps 描画。

---

## 🌐 ローカル Web サーバー URL

現在、ローカルサーバーがポート `8080` にて稼働中です：

- **今回分 URL (最新版・Vercel & マルチデバイス完全対応)**:  
  [http://localhost:8080/golf_3d_game_20261003_1027.html](http://localhost:8080/golf_3d_game_20261003_1027.html)
- **ルート URL (Vercel デプロイ時と同一表示)**:  
  [http://localhost:8080/](http://localhost:8080/)
- **メインファイル URL**:  
  [http://localhost:8080/golf_3d_game.html](http://localhost:8080/golf_3d_game.html)
- **前回分 URL (バックアップ版・いつでも改修前に復元可能)**:  
  [http://localhost:8080/golf_3d_game_anti_20261003_1027_BK.html](http://localhost:8080/golf_3d_game_anti_20261003_1027_BK.html)

---

## 🚀 Vercel へのデプロイ手順

### 方法 1: Vercel CLI を使用する場合
```bash
# プロジェクトフォルダに移動してデプロイ
cd game/golf_anti_20260909
vercel --prod
```

### 方法 2: GitHub 連携を使用する場合
1. GitHub にリポジトリをプッシュします。
2. Vercel ダッシュボードで「Import Project」を選択します。
3. Root Directory に `game/golf_anti_20260909`（または `game/golf_3d_game_vercel`）を指定して「Deploy」をクリックします。
4. 数十秒で全世界に HTTPS で高速配信されます！

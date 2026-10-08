# -*- coding: utf-8 -*-
"""
SmartCaddie Pro - PGA Tour Grade WebGIS Golf Navigator
【案1: Vercel Serverless Function + Vercel KV（無料枠）完全マージビルダー】
"""
import os
import re

def build():
    src_file = r"c:\Users\亘\Desktop\root\_ai\GoogleAntigravity\dev\test\game\golf_play_caddy\index.html"
    dest_dir = r"c:\Users\亘\Desktop\root\_ai\GoogleAntigravity\dev\test\game\golf_play_caddy_vercel"
    dest_file = os.path.join(dest_dir, "index.html")

    with open(src_file, "r", encoding="utf-8") as f:
        code = f.read()

    orig_len = len(code)
    print(f"Source index.html len: {orig_len}")

    # 1. CSS スタイルの追加（Vercel KV 用）
    css_addition = '''
    /* Vercel KV クラウド同期用スタイル */
    @keyframes spin-clockwise {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .icon-spin {
      display: inline-block;
      animation: spin-clockwise 1s linear infinite;
    }
    .vercel-kv-synced {
      border-color: #10b981 !important;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.45) !important;
      position: relative;
    }
    .vercel-kv-synced::after {
      content: '';
      position: absolute;
      top: 2px;
      right: 2px;
      width: 7px;
      height: 7px;
      background: #10b981;
      border-radius: 50%;
      border: 1px solid #080d1a;
    }
'''
    if '/* Vercel KV クラウド同期用スタイル */' not in code:
        code = code.replace(
            '</style>',
            css_addition + '\n  </style>'
        )
        print("Step 1: Added Vercel KV CSS styles")

    # 2. ヘッダーの top-controls の同期ボタンを Vercel KV 用に調整
    code = code.replace(
        'id="btn-cloud-sync" onclick="openCloudSyncModal()" title="☁️ GitHub Gist クラウド同期"',
        'id="btn-vercel-sync" onclick="syncWithVercelKvManual()" title="☁️ Vercel KV クラウド永続同期"'
    )
    print("Step 2: Adjusted header sync button to Vercel KV")

    # 3. JavaScript: Vercel KV クラウド同期エンジンの実装
    vercel_kv_engine = '''
    /* ==========================================================
       ★ 案1: Vercel Serverless Function + Vercel KV クラウド同期エンジン
    ========================================================== */
    let isVercelKvSyncing = false;
    let vercelKvLastSyncTime = null;

    // コース読み込み時の非同期クラウドフェッチ (GET /api/course?id={courseId})
    async function fetchCourseFromVercelKv(courseId) {
      if (!courseId) return;
      const syncBtn = document.getElementById('btn-vercel-sync');
      if (syncBtn) syncBtn.innerHTML = '<span class="icon-spin">🔄</span>';

      try {
        const res = await fetch(`/api/course?id=${encodeURIComponent(courseId)}`, {
          headers: { 'Accept': 'application/json' }
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json && json.success && json.data) {
          const cloudData = json.data;
          let hasUpdates = false;

          // キャリブレーション (Tee/Pin) 反映
          if (cloudData.calibrations) {
            Object.keys(cloudData.calibrations).forEach(k => {
              localStorage.setItem(k, JSON.stringify(cloudData.calibrations[k]));
              hasUpdates = true;
            });
          }
          // IP点 (中間点) 反映
          if (cloudData.ips) {
            Object.keys(cloudData.ips).forEach(k => {
              localStorage.setItem(k, JSON.stringify(cloudData.ips[k]));
              hasUpdates = true;
            });
          }
          // ホールデータ自体に更新がある場合
          if (cloudData.holes && Array.isArray(cloudData.holes) && cloudData.holes.length > 0) {
            holeList = cloudData.holes;
            hasUpdates = true;
          }

          if (hasUpdates) {
            applyHole(currentHoleIndex);
            showCalibrationToast('☁️ Vercel KVから最新コースデータを反映しました');
          }

          updateVercelKvSyncStatus(true, cloudData.updatedAt);
        } else {
          updateVercelKvSyncStatus(true, null);
        }
      } catch (err) {
        console.warn('Vercel KV fetch fallback (offline/local mode):', err);
        updateVercelKvSyncStatus(false, null);
      } finally {
        if (syncBtn) syncBtn.innerHTML = '☁️';
      }
    }

    // 手動登録・微調整時の非同期クラウド保存 (POST /api/course)
    let vercelKvSaveTimer = null;
    function triggerVercelKvAutoSync(courseId) {
      if (vercelKvSaveTimer) clearTimeout(vercelKvSaveTimer);
      vercelKvSaveTimer = setTimeout(() => {
        saveCourseToVercelKv(courseId);
      }, 1000);
    }

    async function saveCourseToVercelKv(courseId) {
      if (!courseId || isVercelKvSyncing) return;
      isVercelKvSyncing = true;
      const syncBtn = document.getElementById('btn-vercel-sync');
      if (syncBtn) syncBtn.innerHTML = '<span class="icon-spin">🔄</span>';

      try {
        // 当該コースのキャリブレーション & IP データを抽出
        const calibrations = {};
        const ips = {};
        const prefixCalib = `smart_caddie_calib_${courseId}_`;
        const prefixIps = `smart_caddie_ips_${courseId}_`;

        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(prefixCalib)) {
            try { calibrations[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
          } else if (k && k.startsWith(prefixIps)) {
            try { ips[k] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
          }
        }

        const payload = {
          courseId: courseId,
          holes: holeList,
          calibrations: calibrations,
          ips: ips,
          updatedAt: new Date().toISOString()
        };

        const res = await fetch('/api/course', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        if (json && json.success) {
          updateVercelKvSyncStatus(true, json.updatedAt);
          showCalibrationToast('☁️ クラウドへ自動永続保存しました');
        }
      } catch (err) {
        console.warn('Vercel KV save fallback (local storage active):', err);
      } finally {
        isVercelKvSyncing = false;
        if (syncBtn) syncBtn.innerHTML = '☁️';
      }
    }

    function updateVercelKvSyncStatus(isSuccess, updatedAt) {
      const syncBtn = document.getElementById('btn-vercel-sync');
      if (!syncBtn) return;
      if (isSuccess) {
        syncBtn.classList.add('vercel-kv-synced');
        if (updatedAt) {
          const d = new Date(updatedAt);
          vercelKvLastSyncTime = d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
          syncBtn.title = `☁️ Vercel KV 同期完了 (${vercelKvLastSyncTime})`;
        } else {
          syncBtn.title = '☁️ Vercel KV 同期スタンバイ (ローカル正常)';
        }
      } else {
        syncBtn.classList.remove('vercel-kv-synced');
        syncBtn.title = '☁️ Vercel KV ローカルモード (オフライン保持)';
      }
    }

    async function syncWithVercelKvManual() {
      if (currentCourse && currentCourse.id) {
        showCalibrationToast('☁️ Vercel KV クラウド同期を実行中...');
        await saveCourseToVercelKv(currentCourse.id);
        await fetchCourseFromVercelKv(currentCourse.id);
      }
    }
'''

    if 'function fetchCourseFromVercelKv' not in code:
        # 17. ホール適用 の直前に Vercel KV エンジンを挿入
        m = re.search(r'([ \t]*/\*\s*={10,}[\r\n]+[ \t]*17\.\s*ホール適用)', code)
        if m:
            code = code[:m.start()] + vercel_kv_engine + "\n\n" + code[m.start():]
            print("Step 3: Inserted Vercel KV engine successfully!")
        else:
            print("Warning: Step 3 target pattern not found")

    # 4. フック箇所の追加
    # (a) commitRoundWizard 内
    if 'fetchCourseFromVercelKv(currentCourse.id);' not in code:
        code = code.replace(
            'fetchRealWeather(currentCourse.lat, currentCourse.lon);',
            'fetchRealWeather(currentCourse.lat, currentCourse.lon);\n      fetchCourseFromVercelKv(currentCourse.id);'
        )
        print("Step 4a: Hooked fetchCourseFromVercelKv to commitRoundWizard")

    # (b) DOMContentLoaded 内
    if 'fetchCourseFromVercelKv(currentCourse.id);' not in code:
        code = code.replace(
            'renderClubEditorList();',
            'renderClubEditorList();\n      if (currentCourse) fetchCourseFromVercelKv(currentCourse.id);'
        )
        print("Step 4b: Hooked fetchCourseFromVercelKv to DOMContentLoaded")
    else:
        # すでにStep 4aで文字列が含まれている場合のDOMContentLoaded判定
        if 'if (currentCourse) fetchCourseFromVercelKv(currentCourse.id);' not in code:
            code = code.replace(
                'renderClubEditorList();',
                'renderClubEditorList();\n      if (currentCourse) fetchCourseFromVercelKv(currentCourse.id);'
            )
            print("Step 4b: Hooked fetchCourseFromVercelKv to DOMContentLoaded")

    # (c) saveCalibratedTeePinCoord 内
    if 'triggerVercelKvAutoSync(currentCourse.id);' not in code:
        code = code.replace(
            'saveCalibratedTeePinCoord(tee, pin) {',
            'saveCalibratedTeePinCoord(tee, pin) {\n      if (currentCourse) triggerVercelKvAutoSync(currentCourse.id);'
        )
        print("Step 4c: Hooked triggerVercelKvAutoSync to saveCalibratedTeePinCoord")

    # (d) saveCurrentHoleIps 内
    if 'triggerVercelKvAutoSync(currentCourse.id);' not in code:
        code = code.replace(
            'saveCurrentHoleIps(coords) {',
            'saveCurrentHoleIps(coords) {\n      if (currentCourse) triggerVercelKvAutoSync(currentCourse.id);'
        )
        print("Step 4d: Hooked triggerVercelKvAutoSync to saveCurrentHoleIps")

    # (e) handleMapClickForQuickSnap 内
    if 'triggerVercelKvAutoSync(currentCourse.id);' not in code:
        code = code.replace(
            'cancelQuickSnapMode();\n        showCalibrationToast',
            'if (currentCourse) triggerVercelKvAutoSync(currentCourse.id);\n        cancelQuickSnapMode();\n        showCalibrationToast'
        )
        print("Step 4e: Hooked triggerVercelKvAutoSync to handleMapClickForQuickSnap")

    # 書き込み: golf_play_caddy_vercel/index.html
    with open(dest_file, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Updated {dest_file}: {len(code)} chars")

    # 新規日付版: golf_play_caddy_vercel/index_20261008_0945.html
    new_dated_file = os.path.join(dest_dir, "index_20261008_0945.html")
    with open(new_dated_file, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Created {new_dated_file}: {len(code)} chars")

if __name__ == "__main__":
    build()

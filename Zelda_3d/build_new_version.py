# -*- coding: utf-8 -*-
import os, sys

source_path = "game/Zelda_3d/rpg_3d_20260609_1.html"
target_path = "game/Zelda_3d/rpg_3d_20260609_1_20260910_1100.html"

with open(source_path, "r", encoding="utf-8") as f:
    code = f.read()

# ==============================================================================
# 1. CSS & HTML拡張 (ガチャモーダル、マネタイズヘッダー、RPG用オーバーレイUI)
# ==============================================================================
extra_css = """
/* ══════════════════════════════════════════════════════
   💎 PRO MONETIZATION & CYBER FANTASY UI SYSTEM
   ══════════════════════════════════════════════════════ */
#topBarPro {
  position: fixed; top: 0; left: 0; width: 100%; height: 42px;
  background: linear-gradient(180deg, rgba(6,11,25,0.92) 0%, rgba(10,18,36,0.75) 100%);
  border-bottom: 1px solid rgba(0, 240, 255, 0.25);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 12px; z-index: 25; font-family: 'Zen Kaku Gothic New', monospace, sans-serif;
  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
}
.hud-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 4px 10px; rounded: 8px; border-radius: 8px; font-size: 11px; font-weight: bold;
  color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}
.hud-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid #38bdf8; color: #fff; padding: 4px 12px;
  border-radius: 8px; font-size: 11px; font-weight: bold; cursor: pointer;
  transition: all 0.2s; box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
  display: inline-flex; align-items: center; gap: 4px;
}
.hud-btn:hover {
  transform: translateY(-1px); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.6);
  border-color: #7dd3fc;
}
.hud-btn-gacha {
  background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  border-color: #fbbf24; box-shadow: 0 2px 8px rgba(217, 119, 6, 0.4);
}
.hud-btn-gacha:hover {
  box-shadow: 0 4px 14px rgba(251, 191, 36, 0.6); border-color: #fde68a;
}
.hud-btn-rpg {
  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
  border-color: #c084fc; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.4);
}
.hud-btn-rpg:hover {
  box-shadow: 0 4px 14px rgba(192, 132, 252, 0.6);
}

/* ガチャモーダル */
#gachaModal {
  display: none; position: fixed; inset: 0; z-index: 100;
  background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); align-items: center; justify-content: center;
}
.gacha-box {
  background: linear-gradient(145deg, #0f172a 0%, #1e1b4b 100%);
  border: 2px solid #fbbf24; border-radius: 20px; width: 92%; max-width: 520px;
  padding: 24px; text-align: center; color: #fff; position: relative;
  box-shadow: 0 0 50px rgba(251, 191, 36, 0.3), inset 0 0 20px rgba(251, 191, 36, 0.1);
  animation: gachaPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes gachaPop {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

/* RPGモード用オーバーレイUI */
#rpgUiOverlay {
  display: none; position: fixed; top: 0; left: 0; width: 100%; height: 42px;
  z-index: 60; pointer-events: auto; padding: 6px 12px;
  background: linear-gradient(180deg, rgba(0,0,30,0.9) 0%, rgba(0,0,20,0.6) 100%);
  border-bottom: 1px solid #4466aa; display: flex; align-items: center; justify-content: space-between;
}
"""

# HTMLヘッダーにCSSを注入
code = code.replace("</style>", extra_css + "\n</style>")

# body直下にトップバーとガチャモーダル、RPGオーバーレイを注入
extra_html = """
<div id="topBarPro">
  <div style="display:flex;align-items:center;gap:8px;">
    <span class="hud-chip" style="border-color:#fbbf24;color:#fbbf24;">
      👑 <span id="vipBadge">VIP PASS</span>
    </span>
    <span class="hud-chip">
      🪙 <span id="goldVal">1,200</span> G
    </span>
    <span class="hud-chip">
      💎 <span id="gemsVal">150</span> GEMS
    </span>
  </div>
  <div style="display:flex;align-items:center;gap:6px;">
    <button type="button" class="hud-btn hud-btn-gacha" id="btnOpenGacha">
      🎁 武器召喚
    </button>
    <button type="button" class="hud-btn hud-btn-rpg" id="btnToggleRpg">
      🐉 RPGモード
    </button>
  </div>
</div>

<div id="rpgUiOverlay" style="display:none;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="font-weight:bold;color:#ffee88;font-size:13px;font-family:monospace;">🐉 勇者クエスト (RPG MODE)</span>
    <span class="hud-chip">🪙 <span id="rpgGoldVal">1,200</span> G</span>
    <span class="hud-chip">💎 <span id="rpgGemsVal">150</span></span>
  </div>
  <div style="display:flex;align-items:center;gap:6px;">
    <button type="button" class="hud-btn hud-btn-gacha" id="btnRpgGacha">
      🎁 召喚ガチャ
    </button>
    <button type="button" class="hud-btn" id="btnExitRpg">
      🎮 3Dアクションへ戻る
    </button>
  </div>
</div>

<div id="gachaModal">
  <div class="gacha-box">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h2 style="font-size:20px;font-weight:bold;color:#fbbf24;display:flex;align-items:center;gap:6px;">
        ⚔️ 伝説の神器 召喚祭
      </h2>
      <button type="button" id="btnCloseGacha" style="background:none;border:none;color:#aaa;font-size:20px;cursor:pointer;">✕</button>
    </div>
    <p style="font-size:12px;color:#cbd5e1;margin-bottom:16px;">
      【SSR / UR】排出率超絶UP中！獲得した武器は3D・RPG双方で即座に装備可能！
    </p>

    <!-- 召喚バナー演出 -->
    <div style="background:radial-gradient(circle,#312e81 0%,#0f172a 100%);border:1px solid #6366f1;border-radius:12px;padding:16px;margin-bottom:16px;min-height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;" id="gachaBanner">
      <div id="gachaSummonAnim" style="display:none;font-size:48px;animation:live-pulse 0.5s infinite;">✨🔮✨</div>
      <div id="gachaStaticDisplay">
        <div style="font-size:36px;margin-bottom:6px;">🗡️⚡</div>
        <div style="font-size:14px;font-weight:bold;color:#fde047;">SSR 神聖天帝の聖剣エクスカリバー</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">ATK+80 / 聖光レーザー衝撃波</div>
      </div>
      <div id="gachaResultDisplay" style="display:none;"></div>
    </div>

    <!-- 召喚ボタン群 -->
    <div style="display:flex;gap:10px;justify-content:center;">
      <button type="button" id="btnSummonGold" style="flex:1;padding:10px;background:linear-gradient(135deg,#eab308,#ca8a04);border:1px solid #fde047;border-radius:10px;color:#000;font-weight:bold;font-size:13px;cursor:pointer;">
        🪙 500G で召喚
      </button>
      <button type="button" id="btnSummonGem" style="flex:1;padding:10px;background:linear-gradient(135deg,#06b6d4,#0891b2);border:1px solid #67e8f9;border-radius:10px;color:#fff;font-weight:bold;font-size:13px;cursor:pointer;">
        💎 100ダイヤ で召喚 (SSR確定率UP)
      </button>
    </div>
  </div>
</div>
"""

code = code.replace('<canvas id="hud"></canvas>', extra_html + '\n<canvas id="hud"></canvas>')

# ==============================================================================
# 2. WEAPON_DEF に SSR/UR 神話級武器を追加
# ==============================================================================
ssr_weapons = """
  {name:'【SSR】神聖天帝の聖剣エクスカリバー', color:0x00f0ff,emissive:0x0088cc,range:7,damage:80, laser:true, stageLabel:'SSR'},
  {name:'【SSR】天雷龍王の業火刃',         color:0xff3300,emissive:0x661100,range:6,damage:65, laser:true, stageLabel:'SSR'},
  {name:'【UR】終焉の魔導神槍ヴォイド',      color:0xaa00ff,emissive:0x5500aa,range:8,damage:120,laser:true, stageLabel:'UR'},
"""
code = code.replace("const WEAPON_DEF=[", "const WEAPON_DEF=[\n" + ssr_weapons)

ssr_shields = """
  {name:'【SSR】神聖イージスの神盾', color:0xffee44,emissive:0x443300,stunTime:25,damage:30,stageLabel:'SSR'},
  {name:'【UR】絶対防御のアヴァロン', color:0x00ffaa,emissive:0x005533,stunTime:40,damage:60,stageLabel:'UR'},
"""
code = code.replace("const SHIELD_DEF=[", "const SHIELD_DEF=[\n" + ssr_shields)

# ==============================================================================
# 3. 通貨（ゴールド＆ジェム）システムの実装
# ==============================================================================
economy_code = """
// ── MONETIZATION & IN-GAME ECONOMY ────────────────
let playerGold = 1200;
let playerGems = 150;

function updateCurrencyUI(){
  const gEl = document.getElementById('goldVal');
  const dEl = document.getElementById('gemsVal');
  const rgEl = document.getElementById('rpgGoldVal');
  const rdEl = document.getElementById('rpgGemsVal');
  if(gEl) gEl.textContent = playerGold.toLocaleString();
  if(dEl) dEl.textContent = playerGems.toLocaleString();
  if(rgEl) rgEl.textContent = playerGold.toLocaleString();
  if(rdEl) rdEl.textContent = playerGems.toLocaleString();
  if(typeof rp !== 'undefined'){
    rp.gold = playerGold;
  }
}

function addGold(n){
  playerGold += n;
  updateCurrencyUI();
  try{ snd(880, 0.08, 'sine', 0.15); }catch(e){}
}
function addGems(n){
  playerGems += n;
  updateCurrencyUI();
  try{ snd(1200, 0.12, 'sine', 0.2); }catch(e){}
}

// ガチャ召喚プール
const GACHA_POOL = [
  {type:'weapon', idx:0, rarity:'SSR', name:'【SSR】神聖天帝の聖剣エクスカリバー', star:'★★★★★', col:'#00f0ff'},
  {type:'weapon', idx:1, rarity:'SSR', name:'【SSR】天雷龍王の業火刃', star:'★★★★★', col:'#ff3300'},
  {type:'shield', idx:0, rarity:'SSR', name:'【SSR】神聖イージスの神盾', star:'★★★★★', col:'#ffee44'},
  {type:'weapon', idx:5, rarity:'SR',  name:'黄金の無敵の長剣', star:'★★★★', col:'#ffdd00'},
  {type:'shield', idx:5, rarity:'SR',  name:'黄金の無敵の盾', star:'★★★★', col:'#ffcc00'},
  {type:'weapon', idx:4, rarity:'R',   name:'銀の神武の長剣', star:'★★★', col:'#ccddee'},
  {type:'weapon', idx:2, rarity:'UR',  name:'【UR】終焉の魔導神槍ヴォイド', star:'★★★★★★', col:'#cc00ff'},
];

function performGacha(costType){
  if(costType === 'gold'){
    if(playerGold < 500){
      alert('ゴールドが不足しています！(必要: 500G)');
      return;
    }
    playerGold -= 500;
  } else {
    if(playerGems < 100){
      alert('ダイヤが不足しています！(必要: 100ダイヤ)');
      return;
    }
    playerGems -= 100;
  }
  updateCurrencyUI();

  // 召喚演出
  const staticDisp = document.getElementById('gachaStaticDisplay');
  const animDisp = document.getElementById('gachaSummonAnim');
  const resDisp = document.getElementById('gachaResultDisplay');
  staticDisp.style.display = 'none';
  resDisp.style.display = 'none';
  animDisp.style.display = 'block';

  try{ snd(330, 0.2, 'sawtooth', 0.25); setTimeout(()=>snd(660, 0.3, 'sine', 0.4), 300); }catch(e){}

  setTimeout(()=>{
    animDisp.style.display = 'none';
    const rand = Math.random();
    let picked;
    if(costType === 'gems' && rand < 0.35){
      picked = GACHA_POOL[0]; // SSR エクスカリバー
    } else if(rand < 0.15){
      picked = GACHA_POOL[6]; // UR
    } else if(rand < 0.45){
      picked = GACHA_POOL[Math.floor(Math.random()*3)];
    } else {
      picked = GACHA_POOL[Math.floor(Math.random()*GACHA_POOL.length)];
    }

    if(picked.type === 'weapon'){
      equippedWeapon = picked.idx;
      if(typeof rp !== 'undefined'){
        rp.weapon = { name: picked.name, atk: 40 };
      }
    } else {
      equippedShield = picked.idx;
      if(typeof rp !== 'undefined'){
        rp.armor = { name: picked.name, def: 25 };
      }
    }

    resDisp.innerHTML = `
      <div style="font-size:12px;font-weight:bold;color:${picked.col};margin-bottom:4px;">${picked.rarity} ${picked.star}</div>
      <div style="font-size:18px;font-weight:black;color:#fff;margin-bottom:6px;">${picked.name}</div>
      <div style="font-size:12px;color:#86efac;font-weight:bold;">⚡ 即座に装備しました！</div>
    `;
    resDisp.style.display = 'block';
    try{ snd(880, 0.15, 'sine', 0.3); setTimeout(()=>snd(1320, 0.2, 'sine', 0.4), 150); }catch(e){}
  }, 700);
}
"""

code = code.replace("// Current equipment (indices)", economy_code + "\n// Current equipment (indices)")

# ==============================================================================
# 4. RPGモード起動と終了の修復 (z-index, gst, 表示/非表示の完全同期)
# ==============================================================================
new_rpg_start = """
// ── START / EXIT RPG (FIXED & FULLY SYNCHRONIZED) ──
function startRPGMode(){
  gameMode = 'rpg';
  gst = 'rpg'; // 3Dタイトルループの描画上書きをストップ！
  rp.state = 'world'; rp.bat = null; rp.dlg = null; rp.shop = null;
  rp.x = 3; rp.y = 6; rp.dir = 2; rp.goTimer = 0; rp.inputCool = 0;
  
  // キャンバスとHUDの表示切替
  rpgCv.style.display = 'block';
  rpgCv.style.zIndex = '50';
  hud.style.display = 'none'; // 3D HUDを完全非表示に！
  renderer.domElement.style.display = 'none';
  
  const vEl = document.getElementById('vignette'); if(vEl) vEl.style.display = 'none';
  const pcEl = document.getElementById('pcctrl'); if(pcEl) pcEl.style.display = 'none';
  const wlEl = document.getElementById('weatherLabel'); if(wlEl) wlEl.style.display = 'none';
  const tlEl = document.getElementById('timeLabel'); if(tlEl) tlEl.style.display = 'none';
  const prEl = document.getElementById('prompt'); if(prEl) prEl.style.display = 'none';
  const topBar = document.getElementById('topBarPro'); if(topBar) topBar.style.display = 'none';
  const rpgUi = document.getElementById('rpgUiOverlay'); if(rpgUi) rpgUi.style.display = 'flex';
  
  updateCurrencyUI();
  rsRpg();
  rpLoop();
}

function rpExitRpg(){
  gameMode = 'title3d';
  gst = 'title'; titlePhase = 0; titleModeIdx = 0;
  rpgCv.style.display = 'none';
  hud.style.display = 'block';
  renderer.domElement.style.display = 'block';
  
  const vEl = document.getElementById('vignette'); if(vEl) vEl.style.display = 'block';
  const pcEl = document.getElementById('pcctrl'); if(pcEl) pcEl.style.display = IS_TOUCH ? 'none' : 'block';
  const wlEl = document.getElementById('weatherLabel'); if(wlEl) wlEl.style.display = 'block';
  const tlEl = document.getElementById('timeLabel'); if(tlEl) tlEl.style.display = 'block';
  const topBar = document.getElementById('topBarPro'); if(topBar) topBar.style.display = 'flex';
  const rpgUi = document.getElementById('rpgUiOverlay'); if(rpgUi) rpgUi.style.display = 'none';
}
"""

code = code.replace("""function startRPGMode(){
  gameMode='rpg';
  // Reset RPG state
  rp.state='world'; rp.bat=null; rp.dlg=null; rp.shop=null;
  rp.x=3; rp.y=6; rp.dir=2; rp.goTimer=0; rp.inputCool=0;
  rpgCv.style.display='block';
  renderer.domElement.style.display='none';
  rpLoop();
}
function rpExitRpg(){
  gameMode='title3d'; rpgCv.style.display='none';
  renderer.domElement.style.display='';
  gst='title'; titlePhase=0; titleModeIdx=0;
}""", new_rpg_start)

# ==============================================================================
# 5. マウス/タッチ共通のポインターイベントを追加 (PCでボタンが押せない問題を完全修復)
# ==============================================================================
pointer_events_code = """
// ── MOUSE & TOUCH UNIVERSAL POINTER HANDLER ───────
window.addEventListener('pointerdown', e => {
  const px = e.clientX, py = e.clientY;
  const W = window.innerWidth, H = window.innerHeight;

  // タイトル画面でのクリック処理
  if(gst === 'title'){
    if(titlePhase === 0){
      // モード選択ボタン
      const _bw = Math.min(160, W * 0.26), _bh = 70, _by = H * 0.52;
      const _bx0 = W / 2 - _bw - 10, _bx1 = W / 2 + 10;
      // 3Dアクション
      if(px >= _bx0 && px <= _bx0 + _bw && py >= _by && py <= _by + _bh){
        titleModeIdx = 0; titlePhase = 1;
        try{ snd(440, 0.08, 'square'); }catch(err){}
        return;
      }
      // RPGモード
      if(px >= _bx1 && px <= _bx1 + _bw && py >= _by && py <= _by + _bh){
        startRPGMode();
        try{ snd(550, 0.1, 'sine'); }catch(err){}
        return;
      }
    } else {
      // 難易度選択ボタン
      for(let d = 0; d < 5; d++){
        const by2 = H * 0.42 + d * H * 0.1;
        if(py > by2 - H * 0.04 && py < by2 + H * 0.04){
          startFromTitle(d + 1);
          return;
        }
      }
      // 戻るボタン
      if(py < H * 0.35){
        titlePhase = 0;
        return;
      }
    }
  }
});
"""

code = code.replace("const tMap=new Map();", pointer_events_code + "\nconst tMap=new Map();")

# ==============================================================================
# 6. RPG画面のPCマウスクリック操作を追加 (バトルコマンド直接クリック等)
# ==============================================================================
rpg_mouse_code = """
// RPG Mouse / Pointer click for battle commands & movement
rpgCv.addEventListener('pointerdown', ev => {
  if(gameMode !== 'rpg') return;
  const rect = rpgCv.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (rpgCv.width / rect.width);
  const py = (ev.clientY - rect.top) * (rpgCv.height / rect.height);
  const W = rpgCv.width, H = rpgCv.height;

  // バトル中のコマンドクリック
  if(rp.state === 'battle' && rp.bat && rp.bat.phase === 'cmd'){
    const cw = 140, ch = 110, cx = 14, cy = H - ch - 12;
    // 4コマンド: [たたかう, じゅもん, どうぐ, にげる]
    const lineH = 22;
    for(let i = 0; i < 4; i++){
      const btnY = cy + 28 + i * lineH;
      if(px >= cx && px <= cx + cw && py >= btnY - 14 && py <= btnY + 8){
        rp.bat.cmd = i;
        rpK.z = true;
        setTimeout(() => { rpK.z = false; }, 100);
        return;
      }
    }
  }

  // 会話送りクリック
  if(rp.state === 'dialog' || rp.state === 'inn'){
    rpK.z = true;
    setTimeout(() => { rpK.z = false; }, 100);
    return;
  }

  // フィールド移動 (クリックした方向へ歩く)
  if(rp.state === 'world'){
    const cX = W / 2, cY = H / 2;
    const dx = px - cX, dy = py - cY;
    if(Math.abs(dy) > Math.abs(dx)){
      if(dy < -30) { rpK.ArrowUp = true; setTimeout(()=>rpK.ArrowUp=false, 150); }
      else if(dy > 30) { rpK.ArrowDown = true; setTimeout(()=>rpK.ArrowDown=false, 150); }
    } else {
      if(dx < -30) { rpK.ArrowLeft = true; setTimeout(()=>rpK.ArrowLeft=false, 150); }
      else if(dx > 30) { rpK.ArrowRight = true; setTimeout(()=>rpK.ArrowRight=false, 150); }
    }
  }
});
"""

code = code.replace("// ── RPG TOUCH SUPPORT ─────────────────────────────", rpg_mouse_code + "\n// ── RPG TOUCH SUPPORT ─────────────────────────────")

# ==============================================================================
# 7. トップバー・ガチャモーダルのイベントバインド
# ==============================================================================
modal_bind_code = """
// ── BIND TOP BAR & GACHA MODAL EVENTS ────────────
document.addEventListener('DOMContentLoaded', () => {
  const gachaModal = document.getElementById('gachaModal');
  const btnOpenGacha = document.getElementById('btnOpenGacha');
  const btnRpgGacha = document.getElementById('btnRpgGacha');
  const btnCloseGacha = document.getElementById('btnCloseGacha');
  const btnSummonGold = document.getElementById('btnSummonGold');
  const btnSummonGem = document.getElementById('btnSummonGem');
  const btnToggleRpg = document.getElementById('btnToggleRpg');
  const btnExitRpg = document.getElementById('btnExitRpg');

  if(btnOpenGacha) btnOpenGacha.addEventListener('click', () => { gachaModal.style.display = 'flex'; });
  if(btnRpgGacha) btnRpgGacha.addEventListener('click', () => { gachaModal.style.display = 'flex'; });
  if(btnCloseGacha) btnCloseGacha.addEventListener('click', () => { gachaModal.style.display = 'none'; });
  if(btnSummonGold) btnSummonGold.addEventListener('click', () => performGacha('gold'));
  if(btnSummonGem) btnSummonGem.addEventListener('click', () => performGacha('gems'));
  if(btnToggleRpg) btnToggleRpg.addEventListener('click', () => startRPGMode());
  if(btnExitRpg) btnExitRpg.addEventListener('click', () => rpExitRpg());

  updateCurrencyUI();
});
"""

code = code.replace("initApp();", "initApp();\n" + modal_bind_code) if "initApp();" in code else code + "\n<script>\n" + modal_bind_code + "\n</script>"

# 敵撃破時にゴールドとダイヤがドロップする演出を追加
code = code.replace("addScore(100);", "addScore(100); addGold(50); if(Math.random()<0.3) addGems(5);")

with open(target_path, "w", encoding="utf-8") as f:
    f.write(code)

print(f"Successfully generated {target_path} (length: {len(code)})")

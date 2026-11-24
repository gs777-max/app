
  /* ===== v4.3 HQアセット (読込失敗時は従来表示に自動フォールバック) ===== */
  window.HQW = { parts:null, pending:[], tex:{}, _ready:{}, _waiters:{} };
  /* v4.10 A2: 診断記録（記録のみ・挙動変更なし）。window.__GOAT_DIAG__ に集約し最終エラーのみ保持する。
     golf 文書と同一構造にし、プローブから両文書で同じキーで読めるようにする。 */
  window.__GOAT_DIAG__ = window.__GOAT_DIAG__ || {};
  (function(D){
    D.ctx = D.ctx || { lost:false, checks:0, lastCheckAt:0 };
    D.golfLoop = D.golfLoop || { consecErrors:0, lastError:null, lastErrorAt:0 };
    D.worldAnimate = D.worldAnimate || { consecErrors:0, lastError:null, lastErrorAt:0 };
    D.hq = D.hq || {};
    D.hq.player = D.hq.player || { failed:false, error:null, detail:null, at:0 };
    D.hq.courseDress = D.hq.courseDress || { failed:false, error:null, detail:null, at:0 };
    D.hq.sky = D.hq.sky || { failed:false, error:null, detail:null, at:0 };
    D.ibl = D.ibl || { failed:false, error:null, detail:null, at:0 };
  })(window.__GOAT_DIAG__);
  window.__goatDiagFail = function(slot, detail, e){ try{ var D = window.__GOAT_DIAG__; if(!D) return; var s = (slot === "ibl") ? D.ibl : (D.hq && D.hq[slot]); if(!s) return; s.failed = true; s.detail = detail; s.error = (e && e.message) ? String(e.message).slice(0, 200) : String(e).slice(0, 200); s.at = Date.now(); }catch(_){} };
  window.__goatDiagLoopErr = function(slot, e){ try{ var D = window.__GOAT_DIAG__; if(!D || !D[slot]) return; var s = D[slot]; s.consecErrors = (s.consecErrors || 0) + 1; s.lastError = (e && e.message) ? String(e.message).slice(0, 200) : String(e).slice(0, 200); s.lastErrorAt = Date.now(); }catch(_){} };
  window.__goatDiagLoopOk = function(slot){ try{ var D = window.__GOAT_DIAG__; if(D && D[slot]) D[slot].consecErrors = 0; }catch(_){} };
  /* v4.24 C-6: 毎フレームの getElementById をやめ、静的DOMの参照を初回にキャッシュする。
     ファイルスコープに置くこと（テクスチャ用 IIFE の内側だと animate() から見えず
     ReferenceError になる）。game-world.js は bootstrap 経由で文書解析後に読み込ま
     れるため、ここでの取得は安全。万一要素が無ければ null のままで、各使用箇所が
     ガードする（ループを止めない）。 */
  var _elChargeFill = document.getElementById("chargeFill");
  var _elChargeLv = document.getElementById("chargeLv");
  var _elHurtFlash = document.getElementById("hurtFlash");
  var _elThreatAura = document.getElementById("threatAura");
  var _elInteractPrompt = document.getElementById("interactPrompt");
  var _elPromptLabel = document.getElementById("promptLabel");
  (function(){
    var TL = new THREE.TextureLoader();
    /* v4.9: アセット版数（boot 層の __GOAT_AV__ と連動）。テクスチャ/GLB の URL に付与する */
    var AVQ = '?v=' + (window.__GOAT_AV__ || 'N10');
    function loadTex(name, srgb, rx, ry){
    var t = TL.load('assets/textures/' + name + '.png' + AVQ, function(){
      window.HQW._ready[name] = 1;
      var w = window.HQW._waiters[name] || []; window.HQW._waiters[name] = [];
      for(var i=0;i<w.length;i++){ try{ w[i](); }catch(e){} }
    }, undefined, function(){
      /* v4.9: テクスチャ読込失敗を無言で握らず最大2回まで再試行する */
      window.HQW._tf = window.HQW._tf || {};
      var f = (window.HQW._tf[name] || 0) + 1; window.HQW._tf[name] = f;
      if(f <= 2) setTimeout(function(){ loadTex(name, srgb, rx, ry); }, 1500);
    });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      if(rx) t.repeat.set(rx, ry || rx);
      if(srgb) t.colorSpace = THREE.SRGBColorSpace;
      window.HQW.tex[name] = t;
      return t;
    }
    window.HQW.whenTex = function(name, cb){
      if(window.HQW._ready[name]){ cb(); }
      else { (window.HQW._waiters[name] = window.HQW._waiters[name] || []).push(cb); }
    };
 loadTex('skin_map', 1); loadTex('skin_nrm'); loadTex('skin_rgh'); loadTex('eye', 1);
loadTex('head_map', 1); loadTex('head_nrm');
/* v4.9: キャラ別テクスチャは主人公（URL の char）の分だけロードする。残影（モブ）は汎用マップを
使うため、使わない5人分（デコード約40MiB/文書）の常駐を消す。画質・見た目は不変。 */
(function(){ var ck = (new URLSearchParams(location.search).get('char') || 'Watu').toLowerCase();
if(['watu','matuya','tiiger','junbo','mcilro','decham'].indexOf(ck) === -1) ck = 'watu';
loadTex('head_' + ck, 1); loadTex('skin_' + ck, 1);})();
    loadTex('pants_map', 1); loadTex('pants_nrm'); loadTex('pants_rgh');
    loadTex('shirt_nrm'); loadTex('shirt_rgh');
    loadTex('grass_map', 1, 26, 26); loadTex('grass_nrm', 0, 26, 26); loadTex('grass_rgh', 0, 26, 26);
    loadTex('leaf_map', 1); loadTex('leaf_nrm');
    loadTex('stone_map', 1); loadTex('stone_nrm'); loadTex('stone_rgh');
    loadTex('bark_map', 1); loadTex('bark_nrm');
 /* v4.9: GLB を「共通ベース＋キャラ別ヘッド」に分割。主人公のヘッドだけを追加ロードし、
残影（charId なし）はベースのみで適用する。パーツ名・マテリアル名・中身は従来と同一（画質不変）。
iOS Safari では (a) MeshoptDecoder の WASM 初期化が遅れて supported=false の
まま GLB を読むと GLTFLoader が例外を投げ、(b) GLB 内蔵テクスチャの createImageBitmap デコードが
失敗すると GLB 読込全体が失敗する。従来は再試行が最大3回で打ち切られ、ベースは仮モデルのまま
固定、ヘッドは「最終失敗」として汎用ヘッドで適用されていた（実機でロボット風に見える状態）。
対策: ① デコーダ ready ゲート（supported になるまで読込を開始しない）
② 再試行は打ち切らず、createImageBitmap 無効経路（TextureLoader）と交互に試す
③ 適用ヘッド種別と失敗理由を _appliedHead / _diag に記録する */
window.HQW._pBase = false; window.HQW._pHead = {};
window.HQW._diag = { baseFails: 0, headFails: {}, lastErr: '', decoderWaited: false};
window.HQW._noteErr = function(where, e){
try{ window.HQW._diag.lastErr = where + ': ' + String((e && e.message) || e || 'load error').slice(0, 140);}catch(_){}
};
window.HQW._decoderReady = function(cb){
var d = window.MeshoptDecoder;
if(!d || d.supported){ cb(); return;}
window.HQW._diag.decoderWaited = true;
var iv = setInterval(function(){
if(!window.MeshoptDecoder || window.MeshoptDecoder.supported){ clearInterval(iv); cb();}
}, 200);
};
var _bmDepthW = 0, _bmSavedW = null;
function _bmOffW(){ if(_bmDepthW === 0){ _bmSavedW = window.createImageBitmap; try{ window.createImageBitmap = undefined;}catch(e){}} _bmDepthW++;}
function _bmOnW(){ _bmDepthW--; if(_bmDepthW <= 0){ _bmDepthW = 0; try{ window.createImageBitmap = _bmSavedW;}catch(e){}}}
window.HQW._glbLoad = function(url, noBitmap, onOk, onFail){
window.HQW._decoderReady(function(){
try{
var loader = new THREE.GLTFLoader();
if(window.MeshoptDecoder) loader.setMeshoptDecoder(window.MeshoptDecoder);
if(noBitmap) _bmOffW();
loader.load(url, function(g){ if(noBitmap) _bmOnW(); onOk(g);}, undefined, function(err){ if(noBitmap) _bmOnW(); onFail(err);});
}catch(e){ if(noBitmap) _bmOnW(); onFail(e);}
});
};
window.HQW._keyOf = function(ctx){
var k = ctx && ctx.charId? String(ctx.charId).toLowerCase(): null;
return (k && ['watu','matuya','tiiger','junbo','mcilro','decham'].indexOf(k)!== -1)? k: null;
};
window.HQW._readyFor = function(key){
if(!window.HQW._pBase ||!window.HQW.parts) return false;
if(!key || key === 'watu') return true;
var s = window.HQW._pHead[key];
/* 堅牢化: ヘッド未着のまま汎用ヘッドで適用を進めることはしない */
return s === 'ok';
};
window.HQW._flushPending = function(){
if(!window.HQW._pBase) return;
var pend = window.HQW.pending; window.HQW.pending = [];
for(var i=0;i<pend.length;i++){
if(window.HQW._readyFor(window.HQW._keyOf(pend[i][1]))){ try{ window.HQW.applyGolfer(pend[i][0], pend[i][1]);}catch(e){}}
else window.HQW.pending.push(pend[i]);
}
};
function mergePartsW(gltf, minRoots){
var roots = 0;
gltf.scene.children.forEach(function(root){ if(root && root.name){ (window.HQW.parts = window.HQW.parts || {})[root.name] = root; roots++;}});
return roots >= minRoots;
}
window.HQW._baseFail = function(err){
window.HQW._fails = (window.HQW._fails || 0) + 1;
window.HQW._diag.baseFails = window.HQW._fails;
window.HQW._noteErr('base', err);
/* 堅牢化: 打ち切らず再試行し続ける（バックオフ上限10秒）。
奇数回目の試行は createImageBitmap を無効化した経路で読む（iOS のデコード失敗対策） */
var delay = Math.min(2500 * Math.ceil(window.HQW._fails / 2), 10000);
setTimeout(function(){ window.HQW._loadBase();}, delay);
};
window.HQW._loadBase = function(){
var noBitmap = ((window.HQW._fails || 0) % 2) === 1;
window.HQW._glbLoad('assets/models/hero_world_base.glb' + AVQ, noBitmap, function(gltf){
if(!mergePartsW(gltf, 10)){ window.HQW._baseFail(new Error('base roots < 10')); return;}
window.HQW._pBase = true;
window.HQW._flushPending();
}, function(err){ window.HQW._baseFail(err);});
};
window.HQW._loadHead = function(key){
var f = window.HQW._pHead[key + '_f'] || 0;
window.HQW._glbLoad('assets/models/hero_world_head_' + key + '.glb' + AVQ, (f % 2) === 1, function(gltf){
mergePartsW(gltf, 1);
window.HQW._pHead[key] = 'ok';
window.HQW._flushPending();
}, function(err){
var nf = window.HQW._pHead[key + '_f'] = f + 1;
window.HQW._diag.headFails[key] = nf;
window.HQW._noteErr('head_' + key, err);
/* 堅牢化: 'err'（汎用ヘッドで進める）には落とさず、成功するまで再試行する */
var delay = Math.min(2500 * Math.ceil(nf / 2), 10000);
setTimeout(function(){ window.HQW._loadHead(key);}, delay);
});
};
window.HQW.loadParts = function(charKey){
try{
if(!window.HQW._baseStarted){ window.HQW._baseStarted = 1; window.HQW._loadBase();}
if(charKey && charKey!== 'watu' &&!window.HQW._pHead[charKey]){
window.HQW._pHead[charKey] = 'loading';
window.HQW._loadHead(charKey);
}
}catch(e){}
};
window.HQW.enqueueGolfer = function(g, ctx){
var key = window.HQW._keyOf(ctx);
if(window.HQW._readyFor(key)){ try{ window.HQW.applyGolfer(g, ctx);}catch(e){}}
else { window.HQW.pending.push([g, ctx]); window.HQW.loadParts(key);}
};
    /* v4.9: enqueueGolfer は分割ロード版（上記）を唯一の定義とする。旧定義は削除した */
    var INV = new THREE.MeshBasicMaterial(); INV.visible = false;
    window.HQW.applyGolfer = function(g, ctx){
      var P = window.HQW.parts; if(!P) return;
      var T = window.HQW.tex;
      var sm = ctx.shirtMat, pm = ctx.pantsMat, sk = ctx.skinMat;
      if(!sm.userData.hq){ sm.userData.hq = 1; if(T.shirt_nrm){ sm.normalMap = T.shirt_nrm; sm.roughnessMap = T.shirt_rgh; } sm.needsUpdate = true; }
      if(!pm.userData.hq){ pm.userData.hq = 1; if(T.pants_map){ pm.map = T.pants_map; pm.normalMap = T.pants_nrm; pm.roughnessMap = T.pants_rgh; } pm.needsUpdate = true; }
      if(!sk.userData.hq){ sk.userData.hq = 1; if(T.skin_nrm){ sk.normalMap = T.skin_nrm; sk.roughnessMap = T.skin_rgh; } sk.needsUpdate = true; }
      var headM = sk.clone();
      /* v4.4: パレット肌色から色調を導出し全員同一肌色を是正 (マップ平均 (197,153,121) で正規化) */
      var _bc = new THREE.Color(ctx.skinMat.color.getHex());
      var _tint = new THREE.Color(Math.min(1, _bc.r / 0.773), Math.min(1, _bc.g / 0.600), Math.min(1, _bc.b / 0.475));
      var _vk = ctx.charId ? String(ctx.charId).toLowerCase() : null;
      var _vH = (_vk && T['head_' + _vk]) ? T['head_' + _vk] : null; /* v4.4是正2: _readyゲート廃止(golf側と同件) */
      var _vS = (_vk && T['skin_' + _vk]) ? T['skin_' + _vk] : null;
      if(_vS && !sk.userData.vApplied){ sk.userData.vApplied = 1; sk.map = _vS; sk.color.set(0xffffff); sk.needsUpdate = true; }
      if(_vH){ headM.map = _vH; headM.normalMap = T.head_nrm; headM.color.set(0xffffff); }
      else if(T.head_map){ headM.map = T.head_map; headM.normalMap = T.head_nrm; headM.color.copy(_tint); } headM.roughness = 1.0; headM.envMapIntensity = 0.5; headM.needsUpdate = true;
      if(T.skin_map){ sk.color.copy(_tint); } sk.roughness = 1.0; sk.envMapIntensity = 0.5; sk.needsUpdate = true;
      var strawM = new THREE.MeshStandardMaterial({ color: 0xb08a34, roughness: 0.9, envMapIntensity: 0.35 });
      var hatM2 = (ctx.hatType === 'straw') ? strawM : new THREE.MeshStandardMaterial({ color: ctx.hatCol, roughness: 0.55 });
      var SLOT = { MAT_SKIN: sk, MAT_HEAD: headM, MAT_SHIRT: sm, MAT_PANTS: pm, MAT_HAT: hatM2, MAT_STRAW: strawM,
        MAT_SHOE: ctx.shoeMat, MAT_SHOE2: ctx.toeMat,
        MAT_DARK: new THREE.MeshStandardMaterial({ color: 0x181820, roughness: 0.5, metalness: 0.2 }),
        MAT_METAL: new THREE.MeshStandardMaterial({ color: 0xd8e2f0, roughness: 0.15, metalness: 0.92 }),
        MAT_GOLD: new THREE.MeshStandardMaterial({ color: 0xffd466, roughness: 0.2, metalness: 0.9 }),
        MAT_WHITE: new THREE.MeshStandardMaterial({ color: 0xf6f6f6, roughness: 0.5 }),
        MAT_EYE: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, map: T.eye || null }) };
      var put = function(name, parent){
        var tpl = P[name]; if(!tpl || !parent) return null;
        var o = tpl.clone();
        o.traverse(function(n){ if(n.isMesh){ n.castShadow = true; n.userData.hqPart = true; var mn = n.material && n.material.name; if(mn && SLOT[mn]) n.material = SLOT[mn]; } });
        parent.add(o);
        return o;
      };
      var bodyMats = [ctx.shirtMat, ctx.pantsMat, ctx.skinMat, ctx.hatMat, ctx.shoeMat, ctx.toeMat];
      var hideBody = function(grp){
        if(!grp) return;
        for(var i=0;i<grp.children.length;i++){ var c = grp.children[i]; if(c.isMesh && c !== ctx.torso && !c.userData.hqPart && bodyMats.indexOf(c.material) >= 0) c.visible = false; }
      };
      var J = ctx.joints;
      for(var i=0;i<2;i++){
        put('thigh', ctx.legs[i]); put('shin', ctx.knees[i]); put('shoe', ctx.ankles[i]); put('toe', ctx.ankles[i]);
        hideBody(ctx.legs[i]); hideBody(ctx.knees[i]); hideBody(ctx.ankles[i]);
      }
      put('pelvis', J.hips); put('belt', J.hips); hideBody(J.hips);
      put('torso', ctx.torso); ctx.torso.material = INV; hideBody(J.torso);
      var _hpUsed = put('head_' + (_vk || 'watu'), J.head);
var _hpKind = _hpUsed ? ((_vk && window.HQW.parts['head_' + _vk]) ? _vk : 'watu-base') : (put('head', J.head) ? 'generic' : 'none');
if(_vk) window.HQW._appliedHead = _hpKind; else window.HQW._appliedMobHead = _hpKind;
put('earL', J.head); put('earR', J.head); put('nose', J.head);
      /* v4.13: ツバが目を覆う問題の修正。頭部ローカル実測では目 y0.219-0.274・眉 y0.254-0.277 に対し
         キャップツバ前端が y0.238・z0.407 と低く長く、正面〜斜め上から目が隠れていた。
         ツバ系パーツは付け根を支点に前上げ回転＋持上げし、前端を眉より上へ逃がす。 */
      var _hatAdj = function(o, lift, tilt, py, pz){
        if(!o) return;
        var c = Math.cos(tilt), s = Math.sin(tilt), oy = o.position.y, oz = o.position.z;
        o.position.y = (oy * c - oz * s) + (py - (py * c - pz * s)) + lift;
        o.position.z = (oy * s + oz * c) + (pz - (py * s + pz * c));
        o.rotation.x += tilt;
      };
      if(ctx.hatType === 'cap'){ put('cap', J.head); _hatAdj(put('cap_brim', J.head), 0.016, -0.44, 0.33, 0.19); put('cap_logo', J.head); }
      else if(ctx.hatType === 'visor'){ _hatAdj(put('cap_brim', J.head), 0.016, -0.44, 0.33, 0.19); }
      else if(ctx.hatType === 'straw'){ _hatAdj(put('straw', J.head), 0.020, -0.08, 0.30, 0.0); _hatAdj(put('straw_top', J.head), 0.020, -0.08, 0.30, 0.0); }
      else { _hatAdj(put('flat', J.head), 0.012, -0.12, 0.30, 0.19); }
      hideBody(J.head);
      put('upperarm', J.shoulderC); put('upperarm', J.shoulderF);
      put('forearm', J.elbowC); put('forearm', J.elbowF);
      put('hand', J.wristC); put('glove', J.wristC); put('hand', J.wristF);
      hideBody(J.shoulderC); hideBody(J.shoulderF); hideBody(J.elbowC); hideBody(J.elbowF); hideBody(J.wristC); hideBody(J.wristF);
      put('clubw_grip', ctx.clubGroup); put('clubw_shaft', ctx.clubGroup); put('clubw_head', ctx.clubGroup);
      for(var ci=0; ci<ctx.clubGroup.children.length; ci++){ var cc = ctx.clubGroup.children[ci]; if(cc.isMesh && !cc.userData.hqPart) cc.visible = false; }
    };
  })();
  
;

    "use strict";
    /* =========================================================================
       第1部：パラメータ・全6エリア環境プロファイル・残影30名ビジュアル定義
       ========================================================================= */
 var QP = new URLSearchParams(location.search);
var AREA_IDX = Math.max(0, Math.min(5, parseInt(QP.get("area") || "0", 10) || 0));
var CHAR_ID = QP.get("char") || "Watu";
/* v4.9: 対戦復帰時の位置復元（シェルが px/pz を渡した場合のみ。不正値・範囲外はスポーン固定） */
var SPAWN_X = 0, SPAWN_Z = 22;
(function(){ var px = parseFloat(QP.get("px")), pz = parseFloat(QP.get("pz"));
if(isFinite(px) && isFinite(pz) && Math.abs(px) <= 600 && Math.abs(pz) <= 600){ SPAWN_X = px; SPAWN_Z = pz;}})();
    var PNAME = QP.get("name") || CHAR_ID;
    var IS_GOAT = (QP.get("mode") === "goat");

    var CHAR_PALETTE = {
      Watu: { shirt: 0xf2e7c9, pants: 0x3c3528, cap: 0xd6a11e, skin: 0xeab98e, accent: 0xffd875 },
      Matuya: { shirt: 0x1f4e82, pants: 0xeaeef7, cap: 0xffffff, skin: 0xe8b184, accent: 0x5ce1e6 },
      TIiger: { shirt: 0xc91a25, pants: 0x15161c, cap: 0x14151a, skin: 0x8d5b36, accent: 0xff4d5a },
      Junbo: { shirt: 0xe87417, pants: 0x22232b, cap: 0xf5f5f5, skin: 0xe5b386, accent: 0xffb84d },
      McIlro: { shirt: 0x2665c2, pants: 0xdde5f4, cap: 0x1b2c4d, skin: 0xf2c8a2, accent: 0x68b5ff },
      DeCham: { shirt: 0xebedf5, pants: 0x2a2f3d, cap: 0x282c38, skin: 0xe2aa7c, accent: 0xff8547 }
    };

    var AREA_THEMES = [
      {
        idx: 0, id: "kyoto", title: "KYOTO — 天孫降臨の古都",
        skyTop: [0.07, 0.09, 0.24], skyHor: [0.38, 0.28, 0.46], skyPureTop: [0.14, 0.34, 0.68], skyPureHor: [0.72, 0.58, 0.48],
        sunColor: 0xffd998, fogColor: 0x221c34, fogPure: 0x6d7ea8, grassA: "#1d4c2e", grassB: "#255e39",
        waterColor: 0x164c64, archType: "kyoto", petalColor: 0xffb7c5
      },
      {
        idx: 1, id: "paris", title: "PARIS — オリンポスの宮廷",
        skyTop: [0.10, 0.20, 0.46], skyHor: [0.58, 0.52, 0.66], skyPureTop: [0.18, 0.44, 0.82], skyPureHor: [0.86, 0.78, 0.66],
        sunColor: 0xfff1c8, fogColor: 0x363a58, fogPure: 0x8fa4c8, grassA: "#1f5d34", grassB: "#2a7343",
        waterColor: 0x1c6b8a, archType: "paris", petalColor: 0xffe999
      },
      {
        idx: 2, id: "rome", title: "ROME — 神代の闘技場",
        skyTop: [0.14, 0.18, 0.38], skyHor: [0.68, 0.44, 0.32], skyPureTop: [0.16, 0.40, 0.76], skyPureHor: [0.92, 0.66, 0.42],
        sunColor: 0xffcf86, fogColor: 0x3c2c2c, fogPure: 0x9e826c, grassA: "#2a5829", grassB: "#376b33",
        waterColor: 0x145d78, archType: "rome", petalColor: 0xffaa55
      },
      {
        idx: 3, id: "america", title: "AMERICA — プロメテウスの火の継承地",
        skyTop: [0.09, 0.26, 0.56], skyHor: [0.55, 0.68, 0.78], skyPureTop: [0.12, 0.46, 0.86], skyPureHor: [0.78, 0.88, 0.95],
        sunColor: 0xfff6dc, fogColor: 0x2f4358, fogPure: 0x8ab2d4, grassA: "#15632f", grassB: "#1d7a3c",
        waterColor: 0x145b8c, archType: "america", petalColor: 0xff7eb3
      },
      {
        idx: 4, id: "edo", title: "EDO CASTLE — 黄泉の門と天岩戸",
        skyTop: [0.05, 0.03, 0.12], skyHor: [0.26, 0.11, 0.32], skyPureTop: [0.22, 0.34, 0.62], skyPureHor: [0.88, 0.66, 0.34],
        sunColor: 0xffb86c, fogColor: 0x180e26, fogPure: 0x7c6858, grassA: "#183b28", grassB: "#214d35",
        waterColor: 0x16294a, archType: "edo", petalColor: 0xd99bff
      },
      {
        idx: 5, id: "olympus_sky", title: "SKY SANCTUARY — 天空の神域",
        skyTop: [0.16, 0.38, 0.82], skyHor: [0.96, 0.88, 0.68], skyPureTop: [0.18, 0.46, 0.92], skyPureHor: [0.99, 0.92, 0.74],
        sunColor: 0xfff9e2, fogColor: 0x9ab4dc, fogPure: 0xb8cef0, grassA: "#207542", grassB: "#2b8c52",
        waterColor: 0x3298c8, archType: "olympus", petalColor: 0xfff099
      }
    ];

    /* 残影30名の個別外観特徴テーブル（浄化後に本来の鮮やかな衣装へ蘇る） */
    var FALLBACK_MOBS_30 = [
      { id: "garcia", area: 0, cls: "小", name: "ガルシヤ", shirt: 0xd62828, pants: 0xf7b801, hat: "cap", acc: "none" },
      { id: "scott", area: 0, cls: "小", name: "スコト", shirt: 0x2b5876, pants: 0xeaeaea, hat: "visor", acc: "none" },
      { id: "nakajima", area: 0, cls: "中", name: "ナカジマ", shirt: 0x2c3e50, pants: 0xdcdde1, hat: "cap", acc: "glasses" },
      { id: "singh", area: 0, cls: "中", name: "シソ", shirt: 0x192a56, pants: 0x2f3640, hat: "visor", acc: "none" },
      { id: "snead_m", area: 0, cls: "大", name: "スニード", shirt: 0xf5f6fa, pants: 0x57606f, hat: "straw", acc: "none" },
      { id: "hogan_m", area: 0, cls: "大", name: "ホーガソ", shirt: 0xf1f2f6, pants: 0x747d8c, hat: "flat", acc: "none" },

      { id: "rose", area: 1, cls: "小", name: "ローズ", shirt: 0x1e3799, pants: 0xf5f6fa, hat: "cap", acc: "goldpin" },
      { id: "stenson", area: 1, cls: "小", name: "ステンソソ", shirt: 0x3c6382, pants: 0x1e272e, hat: "cap", acc: "sunglass" },
      { id: "harring", area: 1, cls: "中", name: "ハリントソ", shirt: 0x009432, pants: 0xdcdde1, hat: "cap", acc: "none" },
      { id: "stewart", area: 1, cls: "中", name: "スチワート", shirt: 0x6f1e51, pants: 0xd1ccc0, hat: "beret", acc: "knicker" },
      { id: "vardon_m", area: 1, cls: "大", name: "バードソ", shirt: 0x846d52, pants: 0x594a38, hat: "flat", acc: "knicker" },
      { id: "faldo_m", area: 1, cls: "大", name: "ファルソ", shirt: 0x2f3542, pants: 0xdfe4ea, hat: "none", acc: "argyle" },

      { id: "day", area: 2, cls: "小", name: "デェイ", shirt: 0x1e272e, pants: 0x2f3542, hat: "cap", acc: "none" },
      { id: "thomson_m", area: 2, cls: "中", name: "トムソソ", shirt: 0x3867d6, pants: 0xd1d8e0, hat: "none", acc: "none" },
      { id: "els", area: 2, cls: "中", name: "エルズ", shirt: 0x222f3e, pants: 0xc8d6e5, hat: "cap", acc: "tall" },
      { id: "rahm", area: 2, cls: "中", name: "ラム", shirt: 0xc23616, pants: 0x192a56, hat: "cap", acc: "tall" },
      { id: "seve_m", area: 2, cls: "大", name: "セベ", shirt: 0x130f40, pants: 0xdff9fb, hat: "visor", acc: "none" },
      { id: "sarazen_m", area: 2, cls: "大", name: "サラゼソ", shirt: 0x9c88ff, pants: 0x7f8fa6, hat: "flat", acc: "knicker" },

      { id: "couples", area: 3, cls: "小", name: "カプルス", shirt: 0xf7f1e3, pants: 0x84817a, hat: "visor", acc: "none" },
      { id: "spieth", area: 3, cls: "中", name: "スピーズ", shirt: 0x227093, pants: 0xf7f1e3, hat: "cap", acc: "none" },
      { id: "scheff", area: 3, cls: "中", name: "シェフラ", shirt: 0xffffff, pants: 0x2c2c54, hat: "cap", acc: "beard" },
      { id: "floyd", area: 3, cls: "中", name: "フロイソ", shirt: 0x40407a, pants: 0xd1ccc0, hat: "visor", acc: "none" },
      { id: "trevino_m", area: 3, cls: "大", name: "トレヴィーノ", shirt: 0xe15f41, pants: 0xf5cd79, hat: "visor", acc: "none" },
      { id: "jones_m", area: 3, cls: "大", name: "ジョンズ", shirt: 0xf5f6fa, pants: 0x718093, hat: "none", acc: "tie_knicker" },

      { id: "nelson_m", area: 4, cls: "中", name: "ネルソソ", shirt: 0xd2dae2, pants: 0x485460, hat: "flat", acc: "none" },
      { id: "norman", area: 4, cls: "中", name: "ノーマソ", shirt: 0xf5f6fa, pants: 0x1e272e, hat: "straw", acc: "shark" },
      { id: "hagen_m", area: 4, cls: "大", name: "ヘーゲソ", shirt: 0xf8efba, pants: 0x2c3a47, hat: "none", acc: "twotone" },
      { id: "watson_m", area: 4, cls: "大", name: "ワトソソ", shirt: 0x833471, pants: 0xd1ccc0, hat: "cap", acc: "beard" },
      { id: "lefty_m", area: 4, cls: "大", name: "ミケルソソ", shirt: 0x111318, pants: 0x181b22, hat: "visor", acc: "lefty" },
      { id: "koepka", area: 4, cls: "大", name: "コプカ", shirt: 0x2f3640, pants: 0x191c22, hat: "cap", acc: "tall" }
    ];

    var MOBS_VISUAL_MAP = {};
    FALLBACK_MOBS_30.forEach(function (m) { MOBS_VISUAL_MAP[m.id] = m; });

    /* 四神波動クラブ定義 */
    var FOUR_GOD_CLUBS = [
      {
        idx: 0, name: "🐉 青龍ドライバー", color: 0x48dbfb, kusanagiColor: 0xffcf48, range: 68, speed: 52, dmg: 46,
        desc: "青龍：超長距離・螺旋龍貫通ビーム（地面に光の溝を刻む）"
      },
      {
        idx: 1, name: "🔥 朱雀アイアン", color: 0xff5e57, range: 46, speed: 38, dmg: 36,
        desc: "朱雀：中距離・オーロラ軌跡から炎の光羽が扇状に分裂追尾"
      },
      {
        idx: 2, name: "⚡ 白虎ウェッジ", color: 0xf5f6fa, range: 32, speed: 26, dmg: 52,
        desc: "白虎：高弾道ロブ→天からの垂直光柱＆虎爪地割れ（バンカーで砂煙目くらまし！）"
      },
      {
        idx: 3, name: "🐢 玄武パター", color: 0x2ed573, range: 24, speed: 30, dmg: 28,
        desc: "玄武：無音で地形を這う六角亀甲波紋（他残影に気づかれず100%確定スタン！）"
      }
    ];

    /* 効果音シンセ（フィールド打撃・四神波動・ファー咆哮・浄化チャイム） */
    var AC = null;
    function ensureAC() {
      if (!AC) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (C) AC = new C();
      }
      if (AC && AC.state === "suspended") AC.resume().catch(function () { });
      return AC;
    }
    function tone(f1, f2, dur, type, vol) {
      var ac = ensureAC(); if (!ac) return;
      var now = ac.currentTime;
      var o = ac.createOscillator(), g = ac.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(f1, now);
      if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + dur);
      g.gain.setValueAtTime(Math.max(0.001, vol || 0.14), now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.connect(g); g.connect(ac.destination);
      o.start(now); o.stop(now + dur + 0.03);
    }
    /* 空間環境音（風のそよぎ＋鳥の声）をWeb Audioで生成・ループ */
    var ambNodes = null;
    function startAmbient() {
      var ac = ensureAC(); if (!ac || ambNodes) return;
      try {
        var master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
        master.gain.setTargetAtTime(0.15, ac.currentTime, 1.5);
        var len = ac.sampleRate * 2, buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0), last = 0;
        for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
        var src = ac.createBufferSource(); src.buffer = buf; src.loop = true;
        var bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 480; bp.Q.value = 0.6;
        var wg = ac.createGain(); wg.gain.value = 0.5;
        var lfo = ac.createOscillator(); lfo.frequency.value = 0.07; var lfoG = ac.createGain(); lfoG.gain.value = 180; lfo.connect(lfoG); lfoG.connect(bp.frequency);
        var lfo2 = ac.createOscillator(); lfo2.frequency.value = 0.045; var lfo2G = ac.createGain(); lfo2G.gain.value = 0.22; lfo2.connect(lfo2G); lfo2G.connect(wg.gain);
        src.connect(bp); bp.connect(wg); wg.connect(master); src.start(); lfo.start(); lfo2.start();
        ambNodes = { master: master };
        (function birds() {
          setTimeout(function () {
            if (AC && AC.state === "running") { var f = 2100 + Math.random() * 900; tone(f, f * 1.35, 0.09, "sine", 0.028); setTimeout(function () { tone(f * 1.1, f * 0.9, 0.07, "sine", 0.02); }, 120); }
            birds();
          }, 3500 + Math.random() * 6500);
        })();
      } catch (e) {}
    }
    function playSfx(k) {
      startAmbient();
      if (k === "seiryu") { tone(240, 1320, 0.36, "sawtooth", 0.14); setTimeout(function () { tone(660, 1760, 0.28, "triangle", 0.11); }, 55); }
      else if (k === "suzaku") { tone(420, 1480, 0.28, "triangle", 0.13); setTimeout(function () { tone(880, 1960, 0.22, "sine", 0.10); }, 70); }
      else if (k === "byakko") { tone(320, 760, 0.22, "sine", 0.12); }
      else if (k === "byakko_land") { tone(160, 52, 0.38, "sawtooth", 0.20); tone(920, 440, 0.25, "triangle", 0.12); }
      else if (k === "genbu") { tone(280, 540, 0.24, "sine", 0.10); }
      else if (k === "hit") { tone(210, 85, 0.14, "square", 0.16); }
      else if (k === "purify") { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { setTimeout(function () { tone(f, f * 1.01, 0.38, "triangle", 0.13); }, i * 75); }); }
      else if (k === "fore") { tone(340, 620, 0.16, "sawtooth", 0.18); setTimeout(function () { tone(580, 290, 0.34, "sawtooth", 0.18); }, 110); }
      else if (k === "push") { tone(260, 90, 0.18, "triangle", 0.18); }
      else if (k === "pickup") { tone(880, 1320, 0.14, "sine", 0.12); }
      else if (k === "splash") { tone(380, 95, 0.32, "sine", 0.15); }
      else if (k === "hurt") { tone(135, 62, 0.25, "sawtooth", 0.20); }
    }

    /* =========================================================================
       第2部：PS5級 Three.js PBR/IBLレンダラー・GLSL空＆水面シェーダー・全6聖地3D建築
       ========================================================================= */
    var THEME = AREA_THEMES[AREA_IDX] || AREA_THEMES[0];
    document.getElementById("hudArea").textContent = THEME.title;
    document.getElementById("hudName").textContent = PNAME;

    var container = document.getElementById("gl");
    var renderer = window.__GOAT_RENDERER__;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 820 ? 1.5 : 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(THEME.fogColor, 0.0046);

    var camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.25, 480);

    /* プロシージャルIBL環境マップ（PMREMGeneratorによる金属・水面・大理石のリアル反射） */
    (function buildIBL() {
      try {
        var pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        var envScene = new THREE.Scene();
        var skyGeo = new THREE.SphereGeometry(40, 24, 16);
        var cTop = new THREE.Color(THEME.skyPureTop[0], THEME.skyPureTop[1], THEME.skyPureTop[2]);
        var cHor = new THREE.Color(THEME.skyPureHor[0], THEME.skyPureHor[1], THEME.skyPureHor[2]);
        var cols = [];
        var pos = skyGeo.attributes.position;
        for (var i = 0; i < pos.count; i++) {
          var t = Math.max(0, Math.min(1, (pos.getY(i) + 40) / 80));
          var c = cHor.clone().lerp(cTop, Math.pow(t, 0.7));
          cols.push(c.r, c.g, c.b);
        }
        skyGeo.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
        envScene.add(new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
        var sunBall = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 12), new THREE.MeshBasicMaterial({ color: 0xfff4cc }));
        sunBall.position.set(18, 22, -20);
        envScene.add(sunBall);
        var rt = pmrem.fromScene(envScene, 0.04);
        scene.environment = rt.texture;
        pmrem.dispose();
      } catch (e) { window.__goatDiagFail("ibl", "buildIBL", e); }
    })();

    /* プロシージャル高精細PBRテクスチャ生成（芝ストライプ・石垣・大理石・バンカー砂） */
    function makeProceduralTex(drawFn, repX, repY) {
      var cv = document.createElement("canvas");
      cv.width = 512; cv.height = 512;
      drawFn(cv.getContext("2d"), 512, 512);
      var tx = new THREE.CanvasTexture(cv);
      tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
      tx.repeat.set(repX || 1, repY || 1);
      tx.colorSpace = THREE.SRGBColorSpace;
      return tx;
    }

    var grassAlbedo = makeProceduralTex(function (ctx, w, h) {
      ctx.fillStyle = THEME.grassA; ctx.fillRect(0, 0, w, h);
      for (var bs = 0; bs < 300; bs++) {
        var bx2 = Math.random() * w, by2 = Math.random() * h, br2 = 12 + Math.random() * 52;
        ctx.globalAlpha = 0.10 + Math.random() * 0.13;
        ctx.fillStyle = Math.random() < 0.55 ? THEME.grassB : (Math.random() < 0.5 ? "#0c2c16" : "#7fae62");
        ctx.beginPath(); ctx.arc(bx2, by2, br2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (var i = 0; i < 6000; i++) {
        var x = Math.random() * w, y = Math.random() * h;
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.045)" : "rgba(0,0,0,0.06)";
        ctx.fillRect(x, y, 2, 3);
      }
    }, 26, 26);

    var grassBump = makeProceduralTex(function (ctx, w, h) {
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 9000; i++) {
        var v = 90 + Math.floor(Math.random() * 80);
        ctx.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    }, 32, 32);

    var marbleTex = makeProceduralTex(function (ctx, w, h) {
      ctx.fillStyle = "#ece9e2"; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(155,145,130,0.28)";
      for (var i = 0; i < 22; i++) {
        ctx.lineWidth = 1 + Math.random() * 2.5;
        ctx.beginPath();
        var y = Math.random() * h;
        ctx.moveTo(0, y);
        for (var x = 0; x <= w; x += 32) {
          y += (Math.random() - 0.5) * 24;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }, 3, 3);

    var stoneTex = makeProceduralTex(function (ctx, w, h) {
      ctx.fillStyle = "#4c4e56"; ctx.fillRect(0, 0, w, h);
      var rows = 8;
      for (var r = 0; r < rows; r++) {
        var y = r * (h / rows), cols = 5;
        var off = (r % 2) * 45;
        for (var c = 0; c <= cols; c++) {
          var x = c * (w / cols) - off;
          var sh = 58 + Math.floor(Math.random() * 36);
          ctx.fillStyle = "rgb(" + sh + "," + sh + "," + (sh + 5) + ")";
          ctx.fillRect(x + 2, y + 2, (w / cols) - 4, (h / rows) - 4);
        }
      }
    }, 4, 2);

    var sandTex = makeProceduralTex(function (ctx, w, h) {
      ctx.fillStyle = "#ebd9b4"; ctx.fillRect(0, 0, w, h);
      for (var i = 0; i < 5000; i++) {
        ctx.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,0.12)" : "rgba(160,130,85,0.12)";
        ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2);
      }
    }, 6, 6);

    /* GLSL大気スカイドーム（浄化率 uPure ＆ Lv3チャージ暗転雷鳴 uStorm 連動） */
    var skyUniforms = {
      uTopDark: { value: new THREE.Vector3().fromArray(THEME.skyTop) },
      uHorDark: { value: new THREE.Vector3().fromArray(THEME.skyHor) },
      uTopPure: { value: new THREE.Vector3().fromArray(THEME.skyPureTop) },
      uHorPure: { value: new THREE.Vector3().fromArray(THEME.skyPureHor) },
      uSunDir: { value: new THREE.Vector3(0.45, 0.48, -0.75).normalize() },
      uPure: { value: (AREA_IDX === 5 || IS_GOAT) ? 1.0 : 0.15 },
      uStorm: { value: 0.0 },
      uFlash: { value: 0.0 }
    };
    var skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(360, 36, 24),
      window.__GOAT_SHADER__('worldSky', {
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: skyUniforms,
        vertexShader: [
          "varying vec3 vWorldPos;",
          "void main(){",
          "  vec4 wp = modelMatrix * vec4(position, 1.0);",
          "  vWorldPos = wp.xyz;",
          "  gl_Position = projectionMatrix * viewMatrix * wp;",
          "}"
        ].join("\n"),
        fragmentShader: [
          "uniform vec3 uTopDark, uHorDark, uTopPure, uHorPure, uSunDir;",
          "uniform float uPure, uStorm, uFlash;",
          "varying vec3 vWorldPos;",
          "void main(){",
          "  vec3 d = normalize(vWorldPos);",
          "  float h = clamp(d.y * 1.15 + 0.08, 0.0, 1.0);",
          "  vec3 topC = mix(uTopDark, uTopPure, uPure);",
          "  vec3 horC = mix(uHorDark, uHorPure, uPure);",
          "  vec3 col = mix(horC, topC, pow(h, 0.62));",
          "  float sunAmt = max(dot(d, uSunDir), 0.0);",
          "  col += vec3(1.0, 0.88, 0.62) * pow(sunAmt, 24.0) * (0.35 + 0.65 * uPure);",
          "  col += vec3(1.0, 0.96, 0.84) * smoothstep(0.996, 0.9995, sunAmt) * 1.6;",
          "  col *= (1.0 - uStorm * 0.58);",
          "  col += vec3(0.75, 0.84, 1.0) * uFlash;",
          "  gl_FragColor = vec4(col, 1.0);",
          "}"
        ].join("\n")
      })
    );
    scene.add(skyDome);

    /* 太陽光（PCFソフトシャドウ）＆ 半球環境光 */
    var hemiLight = new THREE.HemisphereLight(0xdce8ff, 0x263824, 0.72 * Math.PI);
    scene.add(hemiLight);

    var sunLight = new THREE.DirectionalLight(THEME.sunColor, 1.45 * Math.PI);
    sunLight.position.set(58, 74, -85);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = window.innerWidth < 820 ? 1024 : 2048;
    sunLight.shadow.mapSize.height = window.innerWidth < 820 ? 1024 : 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 260;
    var sBox = 95;
    sunLight.shadow.camera.left = -sBox;
    sunLight.shadow.camera.right = sBox;
    sunLight.shadow.camera.top = sBox;
    sunLight.shadow.camera.bottom = -sBox;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    /* 地形ハイトフィールド（中心施設広場・池窪地・外周のなだらかなアンジュレーション） */
    var WORLD_R = 96;
    var PONDS = [
      { x: 26, z: -18, r: 12.5 },
      { x: -32, z: 22, r: 10.5 }
    ];
    var BUNKERS = [
      { x: 14, z: -26, r: 6.2 },
      { x: -18, z: -14, r: 5.8 },
      { x: 24, z: 24, r: 6.5 }
    ];

    function terrainY(x, z) {
      var dCenter = Math.hypot(x, z);
      var flatCenter = Math.min(1, Math.max(0, (dCenter - 16) / 18));
      var y = (Math.sin(x * 0.045) * Math.cos(z * 0.045) * 2.1 + Math.sin((x + z) * 0.025) * 1.2) * flatCenter;
      for (var i = 0; i < PONDS.length; i++) {
        var pd = PONDS[i];
        var dp = Math.hypot(x - pd.x, z - pd.z);
        if (dp < pd.r + 3.5) {
          var t = Math.max(0, 1 - dp / (pd.r + 3.5));
          y -= t * t * 2.6;
        }
      }
      return y;
    }

    function isInPond(x, z) {
      /* v4.29 P-5: 半径との比較だけのため平方根をやめ二乗比較にする（数学的に等価。PONDS の r は 10.5 以上で r-0.8 は常に正だが、念のため rr>0 のガードを付ける）。 */
      for (var i = 0; i < PONDS.length; i++) {
        var _pdx = x - PONDS[i].x, _pdz = z - PONDS[i].z, _prr = PONDS[i].r - 0.8;
        if (_prr > 0 && _pdx * _pdx + _pdz * _pdz < _prr * _prr) return true;
      }
      return false;
    }
    function nudgeOutOfPond(x, z, margin) {
      var m = margin || 1.6;
      var rx = x, rz = z;
      for (var i = 0; i < PONDS.length; i++) {
        var pd = PONDS[i];
        var dx = rx - pd.x, dz = rz - pd.z;
        var d = Math.hypot(dx, dz);
        if (d < pd.r + m) {
          if (d < 0.01) { dx = 0; dz = 1; d = 1; }
          rx = pd.x + (dx / d) * (pd.r + m);
          rz = pd.z + (dz / d) * (pd.r + m);
        }
      }
      var dc = Math.hypot(rx, rz);
      if (dc > WORLD_R - 3.5) {
        rx *= (WORLD_R - 3.5) / dc;
        rz *= (WORLD_R - 3.5) / dc;
      }
      return { x: rx, z: rz };
    }
    function isInBunker(x, z) {
      /* v4.29 P-5: 半径との比較だけのため二乗比較にする（数学的に等価。念のため rr>0 のガードを付ける）。 */
      for (var i = 0; i < BUNKERS.length; i++) {
        var _bdx = x - BUNKERS[i].x, _bdz = z - BUNKERS[i].z, _brr = BUNKERS[i].r;
        if (_brr > 0 && _bdx * _bdx + _bdz * _bdz < _brr * _brr) return true;
      }
      return false;
    }

    /* 3Dフェアウェイ＆ラフ起伏メッシュ構築 */
    var groundMesh = null;
    (function buildTerrain() {
      var geo = new THREE.PlaneGeometry(WORLD_R * 2.3, WORLD_R * 2.3, 128, 128);
      geo.rotateX(-Math.PI / 2);
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        pos.setY(i, terrainY(pos.getX(i), pos.getZ(i)));
      }
      geo.computeVertexNormals();
      var gCols = new Float32Array(pos.count * 3);
      for (var ci2 = 0; ci2 < pos.count; ci2++) {
        var vx2 = pos.getX(ci2), vz2 = pos.getZ(ci2);
        var nn2 = 0.90 + 0.10 * Math.sin(vx2 * 0.11 + vz2 * 0.07) * Math.cos(vz2 * 0.09 - vx2 * 0.05);
        var pp2 = (Math.sin(vx2 * 0.021 + 3.1) * Math.cos(vz2 * 0.019 - 1.2) > 0.55) ? 0.90 : 1.0;
        var vv2 = nn2 * pp2;
        gCols[ci2 * 3] = vv2 * 0.95; gCols[ci2 * 3 + 1] = vv2; gCols[ci2 * 3 + 2] = vv2 * 0.93;
      }
      geo.setAttribute("color", new THREE.BufferAttribute(gCols, 3));
      var mat = new THREE.MeshStandardMaterial({
        vertexColors: true,
        map: grassAlbedo,
        bumpMap: grassBump,
        bumpScale: 0.08,
        roughness: 0.82,
        metalness: 0.04
      });
      if (window.HQW) HQW.whenTex('grass_map', function(){ mat.map = HQW.tex.grass_map; mat.normalMap = HQW.tex.grass_nrm; mat.roughnessMap = HQW.tex.grass_rgh; mat.bumpMap = null; mat.needsUpdate = true; });
      var ground = new THREE.Mesh(geo, mat);
      ground.receiveShadow = true;
      groundMesh = ground;
      scene.add(ground);

      /* 天空の神域（エリア5）は周囲に幻想的な雲海リングを配置 */
      if (AREA_IDX === 5) {
        var cloudMat = new THREE.MeshStandardMaterial({ color: 0xfff9ee, roughness: 0.95, transparent: true, opacity: 0.82, depthWrite: false }); /* v4.15: 画素プローブで実害を確認（重なる雲同士で後方の雲が欠ける）。雲は32個で1枚のマテリアルを共有。 */
        for (var c = 0; c < 32; c++) {
          var ang = (c / 32) * Math.PI * 2;
          var rad = 98 + (c % 3) * 14;
          var puff = new THREE.Mesh(new THREE.SphereGeometry(16 + (c % 4) * 5, 16, 12), cloudMat);
          puff.scale.y = 0.38;
          puff.position.set(Math.cos(ang) * rad, -4, Math.sin(ang) * rad);
          scene.add(puff);
        }
      }
    })();

    /* GLSLフレネル波紋シェーダーによる池・堀水面 + バンカー砂面 */
    var waterUniforms = {
      uTime: { value: 0 },
      uBaseColor: { value: new THREE.Color(THEME.waterColor) }
    };
    var waterMat = window.__GOAT_SHADER__('worldWater', {
      transparent: true,
      depthWrite: false, /* v4.15: 画素プローブで実害を確認（水面が後方の半透明物を欠けさせる）。水面は平面1枚で自己交差がないため描画順のみで正しく重なる。 */

      uniforms: waterUniforms,
      vertexShader: [
        "uniform float uTime;",
        "varying vec2 vUv;",
        "varying vec3 vWorld;",
        "void main(){",
        "  vUv = uv;",
        "  vec3 p = position;",
        "  p.z += sin(p.x * 0.9 + uTime * 2.2) * 0.04 + cos(p.y * 1.1 - uTime * 1.8) * 0.04;",
        "  vec4 wp = modelMatrix * vec4(p, 1.0);",
        "  vWorld = wp.xyz;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "uniform float uTime;",
        "uniform vec3 uBaseColor;",
        "varying vec2 vUv;",
        "varying vec3 vWorld;",
        "void main(){",
        "  float w1 = sin(vWorld.x * 1.6 + uTime * 2.4) * cos(vWorld.z * 1.5 - uTime * 1.9);",
        "  float spec = smoothstep(0.68, 0.98, w1);",
        "  vec3 viewD = normalize(cameraPosition - vWorld);",
        "  float fres = pow(1.0 - max(dot(viewD, vec3(0.0,1.0,0.0)), 0.0), 2.6);",
        "  vec3 col = mix(uBaseColor, vec3(0.72, 0.88, 1.0), fres * 0.55) + vec3(1.0, 0.95, 0.8) * spec * 0.45;",
        "  gl_FragColor = vec4(col, 0.86);",
        "}"
      ].join("\n")
    });

    PONDS.forEach(function (pd) {
      var wm = new THREE.Mesh(new THREE.CircleGeometry(pd.r, 40), waterMat);
      wm.rotation.x = -Math.PI / 2;
      wm.position.set(pd.x, terrainY(pd.x, pd.z) + 1.55, pd.z);
      scene.add(wm);
    });

    var bunkerMat = new THREE.MeshStandardMaterial({ map: sandTex, roughness: 0.9, metalness: 0.02 });
    BUNKERS.forEach(function (bk) {
      var bm = new THREE.Mesh(new THREE.CircleGeometry(bk.r, 28), bunkerMat);
      bm.rotation.x = -Math.PI / 2;
      bm.position.set(bk.x, terrainY(bk.x, bk.z) + 0.07, bk.z);
      bm.receiveShadow = true;
      scene.add(bm);
    });

    /* 全6エリア固有の歴史・神話ランドマーク3D建築生成 */
    var celestialRings = [];
    (function buildAreaArchitecture() {
      var goldMat = new THREE.MeshStandardMaterial({ color: 0xffcf56, roughness: 0.24, metalness: 0.86 });
      var marbMat = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.35, metalness: 0.08 });
      var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85, metalness: 0.06 });
      if (window.HQW) HQW.whenTex('stone_map', function(){ stoneMat.map = HQW.tex.stone_map; stoneMat.normalMap = HQW.tex.stone_nrm; stoneMat.roughnessMap = HQW.tex.stone_rgh; stoneMat.needsUpdate = true; });
      var vermMat = new THREE.MeshStandardMaterial({ color: 0xc8251d, roughness: 0.42, metalness: 0.12 });
      var darkWood = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.75 });
      if (window.HQW) HQW.whenTex('bark_map', function(){ darkWood.map = HQW.tex.bark_map; darkWood.normalMap = HQW.tex.bark_nrm; darkWood.needsUpdate = true; });

      function makeTorii(x, z, rotY, sc, matOverride) {
        var g = new THREE.Group();
        var m = matOverride || vermMat;
        var pL = new THREE.Mesh(new THREE.CylinderGeometry(0.28 * sc, 0.34 * sc, 5.2 * sc, 14), m);
        var pR = pL.clone();
        pL.position.set(-1.9 * sc, 2.6 * sc, 0);
        pR.position.set(1.9 * sc, 2.6 * sc, 0);
        var kasagi = new THREE.Mesh(new THREE.BoxGeometry(5.4 * sc, 0.42 * sc, 0.65 * sc), darkWood);
        kasagi.position.y = 5.25 * sc;
        var shimaki = new THREE.Mesh(new THREE.BoxGeometry(4.8 * sc, 0.32 * sc, 0.48 * sc), m);
        shimaki.position.y = 4.92 * sc;
        var nuki = new THREE.Mesh(new THREE.BoxGeometry(4.4 * sc, 0.28 * sc, 0.36 * sc), m);
        nuki.position.y = 3.95 * sc;
        g.add(pL, pR, kasagi, shimaki, nuki);
        g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
        g.position.set(x, terrainY(x, z), z);
        g.rotation.y = rotY || 0;
        scene.add(g);
      }

      function makeTree(x, z, crownColor, tall) {
        var g = new THREE.Group();
        var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, tall ? 5.5 : 3.2, 8), darkWood);
        tr.position.y = tall ? 2.75 : 1.6;
        tr.castShadow = true;
        g.add(tr);
        var cMat = new THREE.MeshStandardMaterial({ color: crownColor, roughness: 0.78, flatShading: true }); /* v4.25 D-2: 樹冠の面の陰影を出す（色・形・配置は不変） */
        if (window.HQW) HQW.whenTex('leaf_map', function(){ cMat.normalMap = HQW.tex.leaf_nrm; cMat.bumpMap = HQW.tex.leaf_map; cMat.bumpScale = 0.6; cMat.needsUpdate = true; });
        if (tall) {
          var cone = new THREE.Mesh(new THREE.ConeGeometry(1.4, 7.2, 10), cMat);
          cone.position.y = 6.2; cone.castShadow = true;
          g.add(cone);
        } else {
          for (var i = 0; i < 3; i++) {
            var sp = new THREE.Mesh(new THREE.DodecahedronGeometry(1.75 - i * 0.25, 1), cMat);
            sp.position.set((i - 1) * 0.7, 3.4 + (i % 2) * 0.7, (i % 2) * 0.5);
            sp.castShadow = true;
            g.add(sp);
          }
        }
        g.position.set(x, terrainY(x, z), z);
        scene.add(g);
      }

      if (THEME.archType === "kyoto") {
        /* 京都：朱塗りの連続鳥居参道・五重塔・竹林・桜並木 */
        for (var i = 0; i < 5; i++) makeTorii(0, -18 - i * 9.5, 0, 1.0 + i * 0.05);
        /* 五重塔ランドマーク */
        var pag = new THREE.Group();
        for (var lv = 0; lv < 5; lv++) {
          var s = 1 - lv * 0.13;
          var core = new THREE.Mesh(new THREE.BoxGeometry(4.2 * s, 2.2, 4.2 * s), vermMat);
          core.position.y = 1.2 + lv * 2.4;
          var roof = new THREE.Mesh(new THREE.ConeGeometry(4.3 * s, 1.15, 4), darkWood);
          roof.rotation.y = Math.PI / 4;
          roof.position.y = 2.5 + lv * 2.4;
          core.castShadow = roof.castShadow = true;
          pag.add(core, roof);
        }
        var spire = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.22, 3.6, 8), goldMat);
        spire.position.y = 14.5;
        pag.add(spire);
        pag.position.set(-38, terrainY(-38, -38), -38);
        scene.add(pag);
        /* 竹林＆桜 */
        var bamMat = new THREE.MeshStandardMaterial({ color: 0x3b8c47, roughness: 0.45 });
        for (var b = 0; b < 45; b++) {
          var bx = 38 + Math.sin(b * 2.1) * 18, bz = -5 + Math.cos(b * 1.7) * 28;
          var bm = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 9 + (b % 4) * 2, 7), bamMat);
          bm.position.set(bx, terrainY(bx, bz) + 4.5, bz);
          bm.castShadow = true;
          scene.add(bm);
        }
        for (var sk = 0; sk < 18; sk++) {
          var a = (sk / 18) * Math.PI * 2;
          makeTree(Math.cos(a) * 54, Math.sin(a) * 54, sk % 2 === 0 ? 0xffb7c5 : 0x2f6b39, false);
        }
      } else if (THEME.archType === "paris") {
        /* パリ：ベルサイユ白大理石列柱宮殿・黄金噴水・幾何学トピアリー庭園 */
        var pal = new THREE.Group();
        var base = new THREE.Mesh(new THREE.BoxGeometry(42, 9.5, 10), marbMat);
        base.position.y = 4.75; base.castShadow = true; pal.add(base);
        var trim = new THREE.Mesh(new THREE.BoxGeometry(43, 0.8, 10.8), goldMat);
        trim.position.y = 9.6; pal.add(trim);
        for (var c = -5; c <= 5; c++) {
          var col = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 9.2, 14), marbMat);
          col.position.set(c * 3.6, 4.6, 5.4); col.castShadow = true; pal.add(col);
        }
        var dome = new THREE.Mesh(new THREE.SphereGeometry(5.5, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), goldMat);
        dome.position.y = 9.8; pal.add(dome);
        pal.position.set(0, terrainY(0, -72), -72);
        scene.add(pal);
        for (var g = 0; g < 20; g++) {
          var ga = (g / 20) * Math.PI * 2;
          makeTree(Math.cos(ga) * 52, Math.sin(ga) * 52, 0x226b3a, true);
        }
      } else if (THEME.archType === "rome") {
        /* ローマ：コロッセオ大円形アーチ回廊・糸杉並木・鍛冶神の炎炉 */
        for (var ar = 0; ar < 20; ar++) {
          var ang = (ar / 20) * Math.PI * 2;
          if (Math.abs(Math.sin(ang)) < 0.25 && Math.cos(ang) < 0) continue;
          var rx = Math.cos(ang) * 68, rz = Math.sin(ang) * 68;
          var pillar = new THREE.Mesh(new THREE.BoxGeometry(5.2, 13.5, 3.2), marbMat);
          pillar.position.set(rx, terrainY(rx, rz) + 6.75, rz);
          pillar.lookAt(0, pillar.position.y, 0);
          pillar.castShadow = true;
          scene.add(pillar);
        }
        for (var cy = 0; cy < 22; cy++) {
          var ca = (cy / 22) * Math.PI * 2;
          makeTree(Math.cos(ca) * 46, Math.sin(ca) * 46, 0x234d28, true);
        }
      } else if (THEME.archType === "america") {
        /* アメリカ：オーガスタ風白亜クラブハウス・アザレアの花壇・クリーク石橋・観客スタンド */
        var ch = new THREE.Group();
        var bodyM = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 12), marbMat);
        bodyM.position.y = 3.75; bodyM.castShadow = true;
        var gRoof = new THREE.Mesh(new THREE.ConeGeometry(16, 4.2, 4), new THREE.MeshStandardMaterial({ color: 0x1e4d32, roughness: 0.7 }));
        gRoof.rotation.y = Math.PI / 4; gRoof.position.y = 9.5;
        ch.add(bodyM, gRoof);
        ch.position.set(-42, terrainY(-42, -45), -45);
        scene.add(ch);
        /* アザレア（鮮やかなピンク・白ツツジ）と松林 */
        for (var az = 0; az < 26; az++) {
          var aa = (az / 26) * Math.PI * 2;
          makeTree(Math.cos(aa) * 54, Math.sin(aa) * 54, az % 3 === 0 ? 0xff5e9c : 0x1b5e32, az % 3 !== 0);
        }
      } else if (THEME.archType === "edo") {
        /* 江戸城：巨大な石垣と黒金三層天守閣・黄泉の鳥居 */
        var keep = new THREE.Group();
        var ishigaki = new THREE.Mesh(new THREE.CylinderGeometry(13, 16.5, 7.5, 4), stoneMat);
        ishigaki.rotation.y = Math.PI / 4; ishigaki.position.y = 3.75; keep.add(ishigaki);
        var blackWall = new THREE.MeshStandardMaterial({ color: 0x181a24, roughness: 0.55 });
        for (var kl = 0; kl < 3; kl++) {
          var ks = 1 - kl * 0.2;
          var flr = new THREE.Mesh(new THREE.BoxGeometry(13 * ks, 3.6, 13 * ks), blackWall);
          flr.position.y = 9.2 + kl * 4.0;
          var krf = new THREE.Mesh(new THREE.ConeGeometry(11.5 * ks, 2.0, 4), goldMat);
          krf.rotation.y = Math.PI / 4; krf.position.y = 11.4 + kl * 4.0;
          flr.castShadow = krf.castShadow = true;
          keep.add(flr, krf);
        }
        keep.position.set(0, terrainY(0, -70), -70);
        scene.add(keep);
        makeTorii(0, -32, 0, 1.25, blackWall);
        for (var et = 0; et < 16; et++) {
          var ea = (et / 16) * Math.PI * 2;
          makeTree(Math.cos(ea) * 55, Math.sin(ea) * 55, 0x263832, false);
        }
      } else {
        /* 天空の神域：黄金鳥居とギリシャ神殿列柱の融合・天空で回転する天球儀リング */
        makeTorii(0, -30, 0, 1.35, goldMat);
        for (var oc = 0; oc < 16; oc++) {
          var oa = (oc / 16) * Math.PI * 2;
          var ox = Math.cos(oa) * 56, oz = Math.sin(oa) * 56;
          var pil = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, 11, 16), marbMat);
          pil.position.set(ox, terrainY(ox, oz) + 5.5, oz);
          pil.castShadow = true;
          var capG = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 2.2), goldMat);
          capG.position.set(ox, terrainY(ox, oz) + 11.2, oz);
          scene.add(pil, capG);
        }
        for (var rg = 0; rg < 2; rg++) {
          var ring = new THREE.Mesh(new THREE.TorusGeometry(42 + rg * 14, 0.35, 12, 80), goldMat);
          ring.position.set(0, 36 + rg * 6, -30);
          ring.rotation.x = Math.PI * (0.32 + rg * 0.2);
          scene.add(ring);
          celestialRings.push(ring);
        }
      }
    })();

    /* ===== 建築ディテール増強（商用品質アップグレード： Extrude/Lathe本格造形・発光・炎の揺らめき） ===== */
    var FLICKER_LIGHTS = [];
    (function buildArchitectureDetail() {
      var goldM = new THREE.MeshStandardMaterial({ color: 0xffcf56, roughness: 0.24, metalness: 0.86 });
      var stoneM = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.85 });
      var marbM = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.35, metalness: 0.08 });
      var darkW = new THREE.MeshStandardMaterial({ color: 0x2b1e16, roughness: 0.75 });
      var vermM = new THREE.MeshStandardMaterial({ color: 0xc8251d, roughness: 0.42 });
      function curvedRoof(w, d, h, mat) {
        var sh = new THREE.Shape();
        sh.moveTo(-w / 2, 0);
        sh.quadraticCurveTo(-w * 0.18, h * 0.92, 0, h);
        sh.quadraticCurveTo(w * 0.18, h * 0.92, w / 2, 0);
        sh.lineTo(w / 2 - 0.35, -0.28); sh.lineTo(-w / 2 + 0.35, -0.28); sh.closePath();
        var geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -d / 2);
        var m = new THREE.Mesh(geo, mat); m.castShadow = true; return m;
      }
      if (THEME.archType === "kyoto") {
        var lampM = new THREE.MeshStandardMaterial({ color: 0x8a8f7a, roughness: 0.9 });
        var glowM = new THREE.MeshStandardMaterial({ color: 0xffc37a, emissive: 0xff9a3c, emissiveIntensity: 1.6 });
        for (var li = 0; li < 5; li++) {
          [-3.4, 3.4].forEach(function (lx) {
            var lz = -16 - li * 9.5;
            var lg = new THREE.Group();
            var post = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 1.5, 8), lampM); post.position.y = 0.75;
            var lbox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.44, 0.52), glowM); lbox.position.y = 1.65;
            var lcap = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.34, 4), lampM); lcap.rotation.y = Math.PI / 4; lcap.position.y = 2.02;
            lg.add(post, lbox, lcap); lg.position.set(lx, terrainY(lx, lz), lz); scene.add(lg);
          });
        }
        var hall = new THREE.Group();
        var hw = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.6, 4.4), vermM); hw.position.y = 1.3; hw.castShadow = true;
        var rf = curvedRoof(7.6, 5.6, 1.5, darkW); rf.position.y = 2.65;
        hall.add(hw, rf); hall.position.set(-30, terrainY(-30, -24), -24); scene.add(hall);
      } else if (THEME.archType === "paris") {
        var fnt = new THREE.Group();
        var pts = []; [[0.1, 0], [2.6, 0.15], [2.75, 0.5], [1.5, 0.62], [1.35, 1.5], [2.1, 1.62], [2.2, 1.95], [0.9, 2.05], [0.75, 2.8], [1.15, 2.9], [1.2, 3.2], [0.12, 3.3]].forEach(function (p) { pts.push(new THREE.Vector2(p[0], p[1])); });
        var fb = new THREE.Mesh(new THREE.LatheGeometry(pts, 22), marbM); fb.castShadow = true; fnt.add(fb);
        var water = new THREE.Mesh(new THREE.CircleGeometry(2.35, 22), new THREE.MeshStandardMaterial({ color: 0x7ec8e8, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.8 }));
        water.rotation.x = -Math.PI / 2; water.position.y = 0.55; fnt.add(water);
        fnt.position.set(0, terrainY(0, -48), -48); scene.add(fnt);
        var st = new THREE.Group();
        var ped2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 1.6), marbM); ped2.position.y = 1.1; st.add(ped2);
        var robe = new THREE.Mesh(new THREE.ConeGeometry(0.85, 2.6, 10), goldM); robe.position.y = 3.5; st.add(robe);
        var hd = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), goldM); hd.position.y = 5.05; st.add(hd);
        var armS = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.7, 8), goldM); armS.position.set(0.8, 4.4, 0); armS.rotation.z = -0.9; st.add(armS);
        st.position.set(10, terrainY(10, -58), -58); scene.add(st);
        var winMat = new THREE.MeshStandardMaterial({ color: 0x1a2038, roughness: 0.25, metalness: 0.4 });
        for (var wi = -5; wi <= 5; wi++) {
          if (wi === 0) continue;
          var win = new THREE.Group();
          var inset = new THREE.Mesh(new THREE.BoxGeometry(1.5, 3.4, 0.18), winMat); win.add(inset);
          var archT = new THREE.Mesh(new THREE.CircleGeometry(0.75, 14, 0, Math.PI), winMat); archT.position.y = 1.7; win.add(archT);
          win.position.set(wi * 3.6, terrainY(0, -72) + 4.4, -72 + 5.15); scene.add(win);
        }
      } else if (THEME.archType === "rome") {
        var shape = new THREE.Shape();
        shape.moveTo(-2.6, 0); shape.lineTo(2.6, 0); shape.lineTo(2.6, 6.4); shape.lineTo(-2.6, 6.4); shape.closePath();
        var holeP = new THREE.Path();
        holeP.moveTo(-1.15, 0); holeP.lineTo(-1.15, 3.1); holeP.absarc(0, 3.1, 1.15, Math.PI, 0, true); holeP.lineTo(1.15, 0); holeP.closePath();
        shape.holes.push(holeP);
        var segGeo = new THREE.ExtrudeGeometry(shape, { depth: 1.4, bevelEnabled: false });
        for (var tier = 0; tier < 2; tier++) {
          for (var sg = 0; sg < 60; sg++) {
            var a2 = (sg / 60) * Math.PI * 2;
            if (Math.abs(Math.sin(a2)) < 0.22 && Math.cos(a2) < 0) continue;
            var seg = new THREE.Mesh(segGeo, stoneM);
            var px = Math.cos(a2) * 62, pz = Math.sin(a2) * 62;
            seg.position.set(px, terrainY(px, pz) + tier * 6.4, pz);
            seg.lookAt(0, seg.position.y, 0);
            seg.scale.x = 1.14; seg.castShadow = true;
            scene.add(seg);
          }
        }
        var forge = new THREE.Group();
        var fb2 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.3, 1.6, 10), stoneM); fb2.position.y = 0.8; forge.add(fb2);
        var lava = new THREE.Mesh(new THREE.CircleGeometry(1.45, 14), new THREE.MeshStandardMaterial({ color: 0xff5a1e, emissive: 0xff4400, emissiveIntensity: 2.2 }));
        lava.rotation.x = -Math.PI / 2; lava.position.y = 1.62; forge.add(lava);
        var fl = new THREE.PointLight(0xff7a33, 1.6 * Math.PI, 26, 1); fl.position.y = 2.6; forge.add(fl);
        FLICKER_LIGHTS.push({ l: fl, base: 1.6, seed: Math.random() * 9 });
        forge.position.set(20, terrainY(20, -30), -30); scene.add(forge);
      } else if (THEME.archType === "america") {
        var tw = new THREE.Group();
        var tb = new THREE.Mesh(new THREE.BoxGeometry(4.4, 13, 4.4), marbM); tb.position.y = 6.5; tb.castShadow = true; tw.add(tb);
        var trf = new THREE.Mesh(new THREE.ConeGeometry(3.9, 3.2, 4), new THREE.MeshStandardMaterial({ color: 0x1e4d32, roughness: 0.7 })); trf.rotation.y = Math.PI / 4; trf.position.y = 14.6; tw.add(trf);
        var clock = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 0.24, 20), new THREE.MeshStandardMaterial({ color: 0xf6f1de, roughness: 0.3, emissive: 0x444026 }));
        clock.rotation.x = Math.PI / 2; clock.position.set(0, 10.6, 2.25); tw.add(clock);
        var hh1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.1), darkW); hh1.position.set(0, 10.85, 2.42); hh1.rotation.z = -0.7; tw.add(hh1);
        var hh2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.72, 0.1), darkW); hh2.position.set(0.18, 10.45, 2.42); hh2.rotation.z = 1.9; tw.add(hh2);
        tw.position.set(-56, terrainY(-56, -42), -42); scene.add(tw);
        var brShape = new THREE.Shape();
        brShape.moveTo(-7, 0); brShape.quadraticCurveTo(0, 3.4, 7, 0); brShape.lineTo(7, -1.1); brShape.quadraticCurveTo(0, 1.6, -7, -1.1); brShape.closePath();
        var brGeo = new THREE.ExtrudeGeometry(brShape, { depth: 3.2, bevelEnabled: false }); brGeo.translate(0, 0, -1.6);
        var bridge = new THREE.Mesh(brGeo, stoneM); bridge.castShadow = true;
        bridge.position.set(24, terrainY(24, -14) + 0.4, -14); bridge.rotation.y = 0.5; scene.add(bridge);
      } else if (THEME.archType === "edo") {
        [-2.4, 2.4].forEach(function (sx) {
          var shg = new THREE.Group();
          var bd = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.5, 8), goldM); bd.rotation.x = Math.PI; shg.add(bd);
          var hd2 = new THREE.Mesh(new THREE.SphereGeometry(0.34, 8, 6), goldM); hd2.position.set(0, 0.72, 0.12); shg.add(hd2);
          var fin2 = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 4), goldM); fin2.position.set(0, 0.35, -0.4); fin2.rotation.x = -0.8; shg.add(fin2);
          shg.position.set(sx, terrainY(0, -70) + 19.3, -70); shg.rotation.y = sx > 0 ? Math.PI : 0; scene.add(shg);
        });
        [-6, 6].forEach(function (bx) {
          var bz = new THREE.Group();
          var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 2.0, 6), darkW); pole.position.y = 1.0; bz.add(pole);
          var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.3, 0.5, 8, 1, true), darkW); basket.position.y = 2.15; bz.add(basket);
          var flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.85, 8), new THREE.MeshStandardMaterial({ color: 0xffa63e, emissive: 0xff7b1c, emissiveIntensity: 2.4, transparent: true, opacity: 0.92 }));
          flame.position.y = 2.6; bz.add(flame);
          var bl = new THREE.PointLight(0xff8a3c, 1.3 * Math.PI, 20, 1); bl.position.y = 2.7; bz.add(bl);
          FLICKER_LIGHTS.push({ l: bl, base: 1.3, seed: Math.random() * 9 });
          bz.position.set(bx, terrainY(bx, -56), -56); scene.add(bz);
        });
      } else {
        var tmp = new THREE.Group();
        for (var ci = -3; ci <= 3; ci++) {
          var col2 = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 9, 12), marbM);
          col2.position.set(ci * 3.1, 4.5, 0); col2.castShadow = true; tmp.add(col2);
          var cap2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), goldM); cap2.position.set(ci * 3.1, 9.2, 0); tmp.add(cap2);
        }
        var beam = new THREE.Mesh(new THREE.BoxGeometry(21.5, 0.9, 2.2), marbM); beam.position.y = 9.8; tmp.add(beam);
        var pedShape = new THREE.Shape(); pedShape.moveTo(-10.7, 0); pedShape.lineTo(10.7, 0); pedShape.lineTo(0, 3.4); pedShape.closePath();
        var pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 2.0, bevelEnabled: false }); pedGeo.translate(0, 0, -1);
        var ped = new THREE.Mesh(pedGeo, marbM); ped.position.y = 10.25; tmp.add(ped);
        tmp.position.set(0, terrainY(0, -80), -80); scene.add(tmp);
      }
      if (FLICKER_LIGHTS.length) {
        (function flick() {
          /* v4.9: pause 中は明滅ライトの演算を止める */
          if (typeof STATE !== "undefined" && STATE.paused) { requestAnimationFrame(flick); return; }
          var t = performance.now() / 1000;
          FLICKER_LIGHTS.forEach(function (f) { f.l.intensity = f.base * Math.PI * (0.82 + 0.28 * Math.sin(t * 11 + f.seed) * Math.sin(t * 5.3 + f.seed * 2)); });
          requestAnimationFrame(flick);
        })();
      }
    })();

    /* =========================================================================
       v4.4レイヤー：象徴建築のジオメトリ作り込み＋植生密度＋遠景/霧/空の改善
       ・既存の生成関数には一切手を入れず、エリア生成後に追加ジオメトリを足す。
       ・江戸は黄泉・黒金仕様を維持（白壁化しない）。白漆喰＋瓦＋石垣は京都側で表現。
       ========================================================================= */
    (function buildWorldV44Layer() {
      var goldM = new THREE.MeshStandardMaterial({ color: 0xffcf56, roughness: 0.24, metalness: 0.86 });
      var goldDim = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.38, metalness: 0.8 });
      var whiteM = new THREE.MeshStandardMaterial({ color: 0xf2ede0, roughness: 0.82, metalness: 0.02 });
      var tileM = new THREE.MeshStandardMaterial({ color: 0x39424f, roughness: 0.55, metalness: 0.22 });
      var tileDarkM = new THREE.MeshStandardMaterial({ color: 0x1d2027, roughness: 0.5, metalness: 0.3 });
      var blackM = new THREE.MeshStandardMaterial({ color: 0x14151d, roughness: 0.58, metalness: 0.12 });
      var stoneM = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.88, metalness: 0.05 });
      var marbM = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.35, metalness: 0.08 });
      var vermM = new THREE.MeshStandardMaterial({ color: 0xc8251d, roughness: 0.42, metalness: 0.12 });
      var woodM = new THREE.MeshStandardMaterial({ color: 0x4a3421, roughness: 0.78 });
      var slateM = new THREE.MeshStandardMaterial({ color: 0x46586e, roughness: 0.5, metalness: 0.35 });
      var greenRoofM = new THREE.MeshStandardMaterial({ color: 0x1e4d32, roughness: 0.7 });

      var v44count = 0;
      function bx(parent, w, h, d, mat, x, y, z, ry) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z); if (ry) m.rotation.y = ry;
        m.castShadow = true; m.receiveShadow = true; parent.add(m); v44count++; return m;
      }
      function cyl(parent, rt, rb, h, seg, mat, x, y, z) {
        var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); v44count++; return m;
      }
      /* 反りのある屋根（軒反りプロファイルを Extrude した本格瓦屋根スラブ＋棟＋軒先の跳ね上げ） */
      function soriRoof(w, d, h, mat, ridgeMat) {
        var g = new THREE.Group();
        var sh = new THREE.Shape();
        sh.moveTo(-w / 2, 0);
        sh.quadraticCurveTo(-w * 0.20, h * 0.95, 0, h);
        sh.quadraticCurveTo(w * 0.20, h * 0.95, w / 2, 0);
        sh.lineTo(w / 2 - 0.32, -0.30); sh.lineTo(-w / 2 + 0.32, -0.30); sh.closePath();
        var geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -d / 2);
        var slab = new THREE.Mesh(geo, mat); slab.castShadow = true; slab.receiveShadow = true; g.add(slab); v44count++;
        var ridge = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, d * 0.92), ridgeMat || mat);
        ridge.position.y = h + 0.08; ridge.castShadow = true; g.add(ridge); v44count++;
        [-1, 1].forEach(function (sx) { [-1, 1].forEach(function (sz) {
          var tip = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.16, 0.85), mat);
          tip.position.set(sx * (w / 2 - 0.2), 0.22, sz * (d / 2 - 0.2));
          tip.rotation.z = -sx * 0.38; tip.rotation.x = sz * 0.38; tip.castShadow = true; g.add(tip); v44count++;
        }); });
        return g;
      }
      /* 石垣の段差（下段ほど広く・石目テクスチャで段ごとに陰影を作る） */
      function ishigakiSteps(w, d, steps, hEach, mat) {
        var g = new THREE.Group();
        for (var i = 0; i < steps; i++) {
          var k = (steps - i) / steps;
          bx(g, w * (0.72 + 0.28 * k), hEach, d * (0.72 + 0.28 * k), mat || stoneM, 0, hEach * (i + 0.5), 0);
        }
        return g;
      }
      function solidAt(x, z, px, pz, r) { return Math.hypot(x - px, z - pz) < r; }

      var arch = THEME.archType;

      /* ---------------- 京都：白漆喰＋瓦＋石垣の社務所／五重塔の白壁・反り軒／鳥居の部品増し ---------------- */
      if (arch === "kyoto") {
        /* 社務所（石垣台座→白漆喰壁→柱列→反り瓦屋根の関係を部品で表現） */
        var shrineOffice = new THREE.Group();
        var soBase = ishigakiSteps(11, 8, 3, 0.55); shrineOffice.add(soBase);
        bx(shrineOffice, 9.2, 2.7, 6.4, whiteM, 0, 1.65 + 1.35, 0);
        bx(shrineOffice, 9.6, 0.35, 6.8, woodM, 0, 1.65 + 0.18, 0);
        bx(shrineOffice, 9.6, 0.3, 6.8, woodM, 0, 1.65 + 2.62, 0);
        for (var pc = -3; pc <= 3; pc++) cyl(shrineOffice, 0.16, 0.18, 2.7, 8, woodM, pc * 1.45, 1.65 + 1.35, 3.35);
        bx(shrineOffice, 10.6, 0.28, 1.6, woodM, 0, 1.5, 3.6);
        var soRoof = soriRoof(11.6, 8.6, 1.7, tileM, tileDarkM); soRoof.position.y = 1.65 + 2.85; shrineOffice.add(soRoof);
        var soRoof2 = soriRoof(8.2, 6.2, 1.25, tileM, tileDarkM); soRoof2.position.y = 1.65 + 2.85 + 1.55; shrineOffice.add(soRoof2);
        shrineOffice.position.set(20, terrainY(20, 34), 34); shrineOffice.rotation.y = -0.35;
        scene.add(shrineOffice);
        /* 小祠堂（白壁＋瓦） */
        var miniHall = new THREE.Group();
        miniHall.add(ishigakiSteps(5.4, 4.6, 2, 0.5));
        bx(miniHall, 4.2, 2.0, 3.4, whiteM, 0, 1.0 + 1.0, 0);
        var mhRoof = soriRoof(6.0, 4.8, 1.2, tileM, tileDarkM); mhRoof.position.y = 3.05; miniHall.add(mhRoof);
        bx(miniHall, 0.9, 1.3, 0.14, vermM, 0, 1.65, 1.74);
        miniHall.position.set(-24, terrainY(-24, 40), 40); miniHall.rotation.y = 0.5;
        scene.add(miniHall);
        /* 五重塔：各層に白漆喰の壁帯＋反り軒スラブ＋石垣基壇を追加し、円錐屋根だけの平坦さを消す */
        var pagBase = new THREE.Group();
        pagBase.add(ishigakiSteps(9.5, 9.5, 3, 0.6));
        pagBase.position.set(-38, terrainY(-38, -38), -38); scene.add(pagBase);
        for (var lv2 = 0; lv2 < 5; lv2++) {
          var s2 = 1 - lv2 * 0.13;
          var lvlG = new THREE.Group();
          bx(lvlG, 4.35 * s2, 0.85, 4.35 * s2, whiteM, 0, 0, 0);
          var eave = soriRoof(6.1 * s2, 6.1 * s2, 0.55, tileDarkM, goldDim); eave.position.y = 0.42; lvlG.add(eave);
          lvlG.position.set(-38, terrainY(-38, -38) + 1.8 + 0.85 + lv2 * 2.4, -38);
          scene.add(lvlG);
        }
        /* 鳥居の部品増し：根巻き石（柱脚）・額束（がくづか）・笠木の反りキャップ・貫の楔 */
        for (var ti = 0; ti < 5; ti++) {
          var tsc = 1.0 + ti * 0.05, tx = 0, tz = -18 - ti * 9.5, ty = terrainY(tx, tz);
          var tg = new THREE.Group();
          [-1.9 * tsc, 1.9 * tsc].forEach(function (px) {
            cyl(tg, 0.52 * tsc, 0.62 * tsc, 0.5, 10, stoneM, px, 0.25, 0);
            bx(tg, 0.34 * tsc, 0.5 * tsc, 0.2, woodM, px * 0.92, 3.95 * tsc, 0.24);
          });
          bx(tg, 0.55 * tsc, 1.15 * tsc, 0.2, vermM, 0, 4.35 * tsc, 0);
          bx(tg, 0.4 * tsc, 0.5 * tsc, 0.24, goldDim, 0, 4.35 * tsc, 0.02);
          var cap = soriRoof(5.9 * tsc, 0.95, 0.42, tileDarkM, tileDarkM); cap.position.y = 5.42 * tsc; tg.add(cap);
          tg.position.set(tx, ty, tz); scene.add(tg);
        }
        /* 玉垣（朱の柵）で参道の両側を区切る */
        for (var fk = 0; fk < 9; fk++) {
          [-4.6, 4.6].forEach(function (fx) {
            var fz = -14 - fk * 5.2;
            bx(scene, 0.18, 1.0, 0.18, vermM, fx, terrainY(fx, fz) + 0.5, fz);
          });
          [-4.6, 4.6].forEach(function (fx2) {
            var fz2 = -16.6 - fk * 5.2;
            bx(scene, 0.12, 0.16, 5.2, vermM, fx2, terrainY(fx2, fz2) + 0.92, fz2);
          });
        }
      }

      /* ---------------- パリ：マンサード屋根帯・フレッシュ尖塔・両翼ドーム・煙突/ドーマー ---------------- */
      if (arch === "paris") {
        var pBaseY = terrainY(0, -72);
        var pg = new THREE.Group();
        bx(pg, 43.5, 2.4, 11.4, slateM, 0, 10.6, 0);
        var slopeF = bx(pg, 43.5, 3.4, 0.3, slateM, 0, 12.2, 4.6); slopeF.rotation.x = 0.5;
        var slopeB = bx(pg, 43.5, 3.4, 0.3, slateM, 0, 12.2, -4.6); slopeB.rotation.x = -0.5;
        bx(pg, 43.5, 1.5, 6.4, slateM, 0, 13.6, 0);
        for (var dm = -4; dm <= 4; dm++) {
          if (dm === 0) continue;
          bx(pg, 1.3, 1.5, 0.5, whiteM, dm * 4.4, 11.9, 5.35);
          var dRoof = new THREE.Mesh(new THREE.ConeGeometry(1.05, 0.8, 4), goldDim);
          dRoof.rotation.y = Math.PI / 4; dRoof.position.set(dm * 4.4, 13.0, 5.35); dRoof.castShadow = true; pg.add(dRoof); v44count++;
        }
        [-19, -9.5, 9.5, 19].forEach(function (cx) { bx(pg, 0.9, 1.7, 0.9, whiteM, cx, 14.9, 0); });
        /* 中央フレッシュ（尖塔）：ドーム頂から伸びるシルエットの芯 */
        cyl(pg, 0.32, 0.5, 2.2, 8, goldM, 0, 16.6, 0);
        var fleche = new THREE.Mesh(new THREE.ConeGeometry(0.95, 4.6, 8), goldM);
        fleche.position.set(0, 19.9, 0); fleche.castShadow = true; pg.add(fleche); v44count++;
        var fBall = new THREE.Mesh(new THREE.SphereGeometry(0.34, 10, 8), goldM); fBall.position.set(0, 22.4, 0); pg.add(fBall); v44count++;
        /* 両翼パビリオンのドーム＋小尖塔 */
        [-16.5, 16.5].forEach(function (wx) {
          var wd = new THREE.Mesh(new THREE.SphereGeometry(3.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), slateM);
          wd.position.set(wx, 11.6, 0); wd.castShadow = true; pg.add(wd); v44count++;
          var wt = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 8), goldM);
          wt.position.set(wx, 15.9, 0); wt.castShadow = true; pg.add(wt); v44count++;
        });
        /* 正面の破風（ペディメント）と時計円盤 */
        var pedS = new THREE.Shape(); pedS.moveTo(-4.4, 0); pedS.lineTo(4.4, 0); pedS.lineTo(0, 2.2); pedS.closePath();
        var pedG = new THREE.ExtrudeGeometry(pedS, { depth: 0.5, bevelEnabled: false });
        var pedM = new THREE.Mesh(pedG, marbM); pedM.position.set(0, 9.9, 5.2); pedM.castShadow = true; pg.add(pedM); v44count++;
        pg.position.set(0, pBaseY, -72); scene.add(pg);
      }

      /* ---------------- ローマ：コロッセオに横梁（エンタブラチュア）の段＋アリーナ楕円リング ---------------- */
      if (arch === "rome") {
        for (var rb = 0; rb < 40; rb++) {
          var ra = (rb / 40) * Math.PI * 2;
          if (Math.abs(Math.sin(ra)) < 0.25 && Math.cos(ra) < 0) continue;
          var rx2 = Math.cos(ra) * 68, rz2 = Math.sin(ra) * 68, ry2 = terrainY(rx2, rz2);
          [7.0, 13.9].forEach(function (hh) {
            var beam = bx(scene, 11.0, 0.95, 3.5, marbM, rx2, ry2 + hh, rz2);
            beam.lookAt(0, ry2 + hh, 0);
          });
          var key = bx(scene, 1.1, 1.5, 0.5, stoneM, Math.cos(ra) * 66.2, ry2 + 10.6, Math.sin(ra) * 66.2);
          key.lookAt(0, ry2 + 10.6, 0);
        }
        var arena = new THREE.Mesh(new THREE.TorusGeometry(30, 0.45, 8, 64), stoneM);
        arena.rotation.x = Math.PI / 2; arena.scale.set(1, 0.78, 1);
        arena.position.set(0, terrainY(0, 0) + 0.35, 0); arena.receiveShadow = true; scene.add(arena); v44count++;
        var arenaIn = new THREE.Mesh(new THREE.TorusGeometry(21, 0.35, 8, 56), marbM);
        arenaIn.rotation.x = Math.PI / 2; arenaIn.scale.set(1, 0.78, 1);
        arenaIn.position.set(0, terrainY(0, 0) + 0.3, 0); scene.add(arenaIn); v44count++;
      }

      /* ---------------- アメリカ：クラブハウスのポーチ列柱・破風・キューポラ・ドーマー＋観客スタンド ---------------- */
      if (arch === "america") {
        var cBaseY = terrainY(-42, -45);
        var cg = new THREE.Group();
        bx(cg, 27, 0.6, 4.6, marbM, 0, 0.3, 8.1);
        for (var cc2 = -5; cc2 <= 5; cc2 += 2) cyl(cg, 0.3, 0.34, 7.2, 12, whiteM, cc2 * 2.5, 3.9, 9.6);
        var porchRoof = bx(cg, 28, 0.35, 5.4, greenRoofM, 0, 7.75, 8.6); porchRoof.rotation.x = 0.16;
        var pedS2 = new THREE.Shape(); pedS2.moveTo(-5.2, 0); pedS2.lineTo(5.2, 0); pedS2.lineTo(0, 2.4); pedS2.closePath();
        var pedG2 = new THREE.ExtrudeGeometry(pedS2, { depth: 0.6, bevelEnabled: false });
        var pedM2 = new THREE.Mesh(pedG2, whiteM); pedM2.position.set(0, 7.9, 9.9); pedM2.castShadow = true; cg.add(pedM2); v44count++;
        cyl(cg, 1.15, 1.3, 1.6, 10, whiteM, 0, 12.6, 0);
        var cup = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.6, 8), greenRoofM);
        cup.position.set(0, 14.2, 0); cup.castShadow = true; cg.add(cup); v44count++;
        var cupBall = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), goldM); cupBall.position.set(0, 15.3, 0); cg.add(cupBall); v44count++;
        [-8, 0, 8].forEach(function (dx) {
          bx(cg, 1.7, 1.6, 0.6, whiteM, dx, 9.3, 3.4);
          var dr = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.9, 4), greenRoofM);
          dr.rotation.y = Math.PI / 4; dr.position.set(dx, 10.5, 3.4); cg.add(dr); v44count++;
        });
        cg.position.set(-42, cBaseY, -45); scene.add(cg);
        /* 観客グランドスタンド（段々＋屋根柱） */
        var gs = new THREE.Group();
        for (var stp = 0; stp < 4; stp++) bx(gs, 16, 0.85, 1.7, marbM, 0, 0.45 + stp * 0.85, -stp * 1.55);
        bx(gs, 16, 2.2, 0.4, greenRoofM, 0, 4.4, -6.6);
        [-7.4, -2.5, 2.5, 7.4].forEach(function (px2) { cyl(gs, 0.14, 0.14, 5.6, 8, whiteM, px2, 2.8, 0.6); });
        var gsRoof = bx(gs, 17, 0.3, 8.6, greenRoofM, 0, 5.9, -2.6); gsRoof.rotation.x = 0.1;
        gs.position.set(34, terrainY(34, -34), -34); gs.rotation.y = -0.6; scene.add(gs);
      }

      /* ---------------- 江戸：天守の段差石垣・黒壁の段＋反り屋根（黒瓦×金棟）・櫓・外周石垣（※白壁化しない） ---------------- */
      if (arch === "edo") {
        var eBaseY = terrainY(0, -70);
        var eg = new THREE.Group();
        var step1 = cyl(eg, 20.5, 23.5, 2.0, 4, stoneM, 0, 0.6, 0); step1.rotation.y = Math.PI / 4;
        var step2 = cyl(eg, 18.0, 20.5, 2.0, 4, stoneM, 0, 2.2, 0); step2.rotation.y = Math.PI / 4;
        for (var kl2 = 0; kl2 < 3; kl2++) {
          var ks2 = 1 - kl2 * 0.2, fy = 9.2 + kl2 * 4.0;
          bx(eg, 13.5 * ks2, 0.5, 13.5 * ks2, goldDim, 0, fy - 1.65, 0);
          bx(eg, 13.5 * ks2, 0.42, 13.5 * ks2, tileDarkM, 0, fy + 1.72, 0);
          [-1, 1].forEach(function (sx2) { [-1, 1].forEach(function (sz2) {
            var crest = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), goldM);
            crest.position.set(sx2 * 6.4 * ks2, fy + 0.2, sz2 * 6.4 * ks2); eg.add(crest); v44count++;
          }); });
          var eRoof = soriRoof(14.6 * ks2, 14.6 * ks2, 1.15, tileDarkM, goldM);
          eRoof.position.y = fy + 1.85; eg.add(eRoof);
        }
        eg.position.set(0, eBaseY, -70); scene.add(eg);
        /* 隅櫓（黒壁＋反り屋根＋石垣）×2 */
        [[24, -58], [-24, -58]].forEach(function (yp) {
          var yg = new THREE.Group();
          yg.add(ishigakiSteps(7.5, 7.5, 2, 0.8));
          bx(yg, 5.6, 3.0, 5.6, blackM, 0, 1.6 + 1.5, 0);
          bx(yg, 6.0, 0.4, 6.0, goldDim, 0, 1.6 + 0.2, 0);
          var yRoof = soriRoof(7.6, 7.6, 1.3, tileDarkM, goldM); yRoof.position.y = 1.6 + 3.1; yg.add(yRoof);
          yg.position.set(yp[0], terrainY(yp[0], yp[1]), yp[1]); scene.add(yg);
        });
        /* 外周の石垣ウォール（地形に沿った分割配置） */
        for (var wi2 = 0; wi2 < 14; wi2++) {
          var wa = (wi2 / 14) * Math.PI * 2 + 0.22;
          var wx = Math.cos(wa) * 30, wz = -70 + Math.sin(wa) * 26;
          var wall = bx(scene, 11.5, 1.7, 1.1, stoneM, wx, terrainY(wx, wz) + 0.7, wz);
          wall.lookAt(0, terrainY(wx, wz) + 0.7, -70);
        }
        /* 黄泉鳥居（0,-32 黒鳥居）の根巻き石と額束・黒金の笠 */
        var yg2 = new THREE.Group();
        [-2.38, 2.38].forEach(function (px3) { cyl(yg2, 0.6, 0.72, 0.55, 10, stoneM, px3, 0.27, 0); });
        bx(yg2, 0.6, 1.3, 0.22, blackM, 0, 5.45, 0);
        bx(yg2, 0.44, 0.55, 0.26, goldDim, 0, 5.45, 0.02);
        yg2.position.set(0, terrainY(0, -32), -32); scene.add(yg2);
      }

      /* ---------------- 神域：神殿の基壇段・浮遊島（岩塊＋石板＋結晶）・第二列柱 ---------------- */
      if (arch === "olympus") {
        var oBaseY = terrainY(0, -80);
        var og = new THREE.Group();
        bx(og, 26, 0.7, 10, marbM, 0, 0.35, 2);
        bx(og, 23, 0.7, 8.6, marbM, 0, 1.05, 2);
        bx(og, 20, 0.7, 7.4, marbM, 0, 1.75, 2);
        og.position.set(0, oBaseY, -80); scene.add(og);
        for (var oc2 = -4; oc2 <= 4; oc2++) {
          if (oc2 === 0) continue;
          var cx3 = oc2 * 4.4, cz3 = -62, cy3 = terrainY(cx3, cz3);
          cyl(scene, 0.5, 0.62, 7.4, 12, marbM, cx3, cy3 + 3.7, cz3);
          bx(scene, 1.4, 0.45, 1.4, goldM, cx3, cy3 + 7.6, cz3);
          bx(scene, 1.5, 0.4, 1.5, marbM, cx3, cy3 + 0.2, cz3);
        }
        var beam2 = bx(scene, 39, 0.8, 1.9, marbM, 0, terrainY(0, -62) + 8.15, -62);
        function floatIsland(x, z, lift, sc) {
          var fg = new THREE.Group();
          var rock = new THREE.Mesh(new THREE.ConeGeometry(3.4 * sc, 5.2 * sc, 7), stoneM);
          rock.rotation.x = Math.PI; rock.position.y = -2.2 * sc; rock.castShadow = true; fg.add(rock); v44count++;
          cyl(fg, 3.9 * sc, 3.9 * sc, 0.7, 7, marbM, 0, 0.3, 0);
          var cry = new THREE.Mesh(new THREE.OctahedronGeometry(0.85 * sc, 0),
            new THREE.MeshStandardMaterial({ color: 0xffe98a, emissive: 0xcc9a22, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.4 }));
          cry.position.y = 1.9 * sc; fg.add(cry); v44count++;
          var beamC = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * sc, 1.3 * sc, lift, 10, 1, true),
            new THREE.MeshBasicMaterial({ color: 0xffe9a0, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
          beamC.position.y = -lift / 2 - 4.6 * sc; fg.add(beamC); v44count++;
          fg.position.set(x, terrainY(x, z) + lift, z); scene.add(fg);
        }
        floatIsland(30, -54, 9, 1.0);
        floatIsland(-33, -60, 11.5, 1.25);
        floatIsland(17, -90, 13, 0.85);
        floatIsland(-18, -92, 8, 0.7);
      }

      /* ---------------- 全エリア共通：参道の敷石・植生インスタンシング・遠景の山影・地平の霞 ---------------- */
      var stonePathMat = new THREE.MeshStandardMaterial({ color: 0x7d7668, roughness: 0.95 });
      var pathInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.14, 1.15), stonePathMat, 30);
      var dummy = new THREE.Object3D();
      for (var pi2 = 0; pi2 < 30; pi2++) {
        var pz3 = 20 - pi2 * 2.65, px4 = Math.sin(pi2 * 1.7) * 0.35;
        dummy.position.set(px4, terrainY(px4, pz3) + 0.045, pz3); if (pz3 > -46) dummy.scale.set(0.001, 0.001, 0.001); else dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, Math.sin(pi2 * 2.3) * 0.14, 0);
        dummy.updateMatrix(); pathInst.setMatrixAt(pi2, dummy.matrix);
      }
      pathInst.receiveShadow = true; scene.add(pathInst);

      var seed = 1234567;
      function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
      var avoid = [[0, -72, 17], [-42, -45, 16], [0, -70, 20], [0, -80, 15], [-38, -38, 9], [20, -30, 9], [34, -34, 11], [-56, -42, 8], [20, 34, 10], [0, -48, 7]];
      function spotOK(x, z) {
        if (isInPond(x, z)) return false;
        if (Math.abs(x) < 6 && z < 4 && z > -62) return false;
        for (var i = 0; i < PONDS.length; i++) if (Math.hypot(x - PONDS[i].x, z - PONDS[i].z) < PONDS[i].r + 4) return false;
        for (var j = 0; j < BUNKERS.length; j++) if (Math.hypot(x - BUNKERS[j].x, z - BUNKERS[j].z) < BUNKERS[j].r + 2.5) return false;
        for (var k = 0; k < avoid.length; k++) if (solidAt(x, z, avoid[k][0], avoid[k][1], avoid[k][2])) return false;
        if (arch === "rome" && Math.abs(Math.hypot(x, z) - 65) < 9) return false;
        return true;
      }
      var NT = 110, treePos = [];
      var guard = 0;
      while (treePos.length < NT && guard++ < 3000) {
        var ta = rnd() * Math.PI * 2, tr2 = 24 + rnd() * 66;
        var tx2 = Math.cos(ta) * tr2, tz4 = Math.sin(ta) * tr2;
        if (!spotOK(tx2, tz4)) continue;
        treePos.push({ x: tx2, z: tz4, s: 0.75 + rnd() * 0.8, rot: rnd() * Math.PI * 2 });
      }
      var trunkInst = new THREE.InstancedMesh(
        new THREE.CylinderGeometry(0.16, 0.3, 2.8, 7),
        new THREE.MeshStandardMaterial({ color: 0x4c3826, roughness: 0.9 }), treePos.length);
      var crownCols = (arch === "kyoto")
        ? [0xe8a7bf, 0x3d7d3a, 0xd98fab]
        : (arch === "rome" || arch === "paris")
          ? [0x27592e, 0x2e6b34, 0x244f2a]
          : [0x2e6b34, 0x3d7d3a, 0x27592e];
      var crownInsts = crownCols.map(function (cc) {
        return new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.55, 1),
          new THREE.MeshStandardMaterial({ color: cc, roughness: 0.85, flatShading: true }), treePos.length); /* v4.25 D-2: 樹冠の面の陰影を出す */
      });
      var tallCrown = (arch === "rome" || arch === "paris");
      treePos.forEach(function (tp, idx) {
        var gy = terrainY(tp.x, tp.z);
        dummy.position.set(tp.x, gy + 1.4 * tp.s, tp.z);
        dummy.rotation.set(0, tp.rot, 0); dummy.scale.setScalar(tp.s); dummy.updateMatrix();
        trunkInst.setMatrixAt(idx, dummy.matrix);
        for (var ci3 = 0; ci3 < 3; ci3++) {
          dummy.position.set(tp.x + Math.sin(idx * 2.1 + ci3 * 2.4) * 0.62 * tp.s,
            gy + (3.1 + (ci3 % 2) * 0.85) * tp.s, tp.z + Math.cos(idx * 1.7 + ci3 * 2.4) * 0.62 * tp.s);
          dummy.scale.set(tp.s * (1.05 - ci3 * 0.16), tp.s * (tallCrown ? 1.75 - ci3 * 0.2 : 1.0 - ci3 * 0.1), tp.s * (1.05 - ci3 * 0.16));
          dummy.rotation.set(idx + ci3, idx * 1.3 + ci3 * 2.0, 0); dummy.updateMatrix();
          crownInsts[ci3].setMatrixAt(idx, dummy.matrix);
        }
      });
      trunkInst.castShadow = true; scene.add(trunkInst);
      crownInsts.forEach(function (ci4) { ci4.castShadow = true; scene.add(ci4); });

      /* 草むら・花・岩のインスタンシングで平坦な色面を崩す */
      function scatterInst(geo, mat, n, sy0, sy1, rMax) {
        var inst = new THREE.InstancedMesh(geo, mat, n), placed = 0, g2 = 0;
        while (placed < n && g2++ < n * 30) {
          var a3 = rnd() * Math.PI * 2, r3 = 6 + rnd() * (rMax || 84);
          var x3 = Math.cos(a3) * r3, z4 = Math.sin(a3) * r3;
          if (isInPond(x3, z4)) continue;
          if (Math.abs(x3) < 9.5 && z4 > -54 && z4 < 36) continue; /* v4.4: 街路コリドー除外 */
          if (Math.hypot(x3, z4 - 10) < 15.5) continue; /* v4.4: 広場除外 */
          dummy.position.set(x3, terrainY(x3, z4) + sy0, z4);
          dummy.rotation.set((rnd() - 0.5) * 0.5, rnd() * Math.PI, (rnd() - 0.5) * 0.5);
          var sc3 = sy1 * (0.6 + rnd() * 0.9); dummy.scale.set(sc3, sc3, sc3); dummy.updateMatrix();
          inst.setMatrixAt(placed++, dummy.matrix);
        }
        inst.count = placed; scene.add(inst); return inst;
      }
      scatterInst(new THREE.ConeGeometry(0.34, 0.85, 6), new THREE.MeshStandardMaterial({ color: 0x2c6e35, roughness: 0.9 }), 260, 0.3, 1.0);
      scatterInst(new THREE.ConeGeometry(0.26, 0.6, 6), new THREE.MeshStandardMaterial({ color: 0x4c8a3f, roughness: 0.9 }), 200, 0.22, 0.9);
      scatterInst(new THREE.SphereGeometry(0.13, 6, 5), new THREE.MeshBasicMaterial({ color: THEME.petalColor }), 130, 0.32, 1.0);
      var rockInst = scatterInst(new THREE.DodecahedronGeometry(0.55, 0), new THREE.MeshStandardMaterial({ color: 0x777d84, roughness: 0.95 }), 46, 0.18, 1.3);
      rockInst.castShadow = true;

      /* 遠景の山影リング（平坦な地平線をシルエットで割る） */
      var mtnCol = new THREE.Color(THEME.fogColor).lerp(new THREE.Color(0x8fa4c8), 0.45);
      var mtnMat = new THREE.MeshStandardMaterial({ color: mtnCol, roughness: 0.95, flatShading: true }); /* v4.27 D-3b: 山影リングに面の陰影を出す（色・形・配置・個数は不変。v4.25 D-2 の樹冠と同じ方式） */
      for (var mi = 0; mi < 15; mi++) {
        var ma = (mi / 15) * Math.PI * 2 + rnd() * 0.2;
        var mr = 148 + rnd() * 42, mh = 17 + rnd() * 24;
        var mtn = new THREE.Mesh(new THREE.ConeGeometry(20 + rnd() * 16, mh, 5), mtnMat);
        mtn.position.set(Math.cos(ma) * mr, mh * 0.28, Math.sin(ma) * mr);
        mtn.rotation.y = rnd() * Math.PI; scene.add(mtn); v44count++;
      }
      /* 地平の霞グラデーション（空と地面の境界を柔らかく繋ぐ円筒） */
      (function hazeBand() {
        var cv = document.createElement("canvas"); cv.width = 4; cv.height = 256;
        var cx = cv.getContext("2d");
        var hor = new THREE.Color(THEME.skyHor[0], THEME.skyHor[1], THEME.skyHor[2]);
        var grd = cx.createLinearGradient(0, 0, 0, 256);
        var rgb = Math.floor(hor.r * 255) + "," + Math.floor(hor.g * 255) + "," + Math.floor(hor.b * 255);
        grd.addColorStop(0, "rgba(" + rgb + ",0)");
        grd.addColorStop(0.72, "rgba(" + rgb + ",0.10)");
        grd.addColorStop(1, "rgba(" + rgb + ",0.5)");
        cx.fillStyle = grd; cx.fillRect(0, 0, 4, 256);
        var tx = new THREE.CanvasTexture(cv);
        var hz = new THREE.Mesh(new THREE.CylinderGeometry(335, 335, 110, 32, 1, true),
          new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.BackSide, depthWrite: false, fog: false }));
        hz.position.y = 18; scene.add(hz);
      })();
      /* 霧を僅かに抜いて遠景建築のシルエットが立つようにする（濃霧の色面化を回避） */
      if (scene.fog && scene.fog.isFogExp2) scene.fog.density = 0.0034;
      dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0);
      window.__V44 = { added: v44count, trees: treePos.length, arch: arch };
    })();

    /* =========================================================================
       第3部：インタラクティブ施設・運命の祠・神話試練祭壇・決戦の門
       ========================================================================= */

    /* ================= v4.4 拠点の街並み（メインストリート＋建築キット＋小物＋散布物） ================= */
    (function buildTownV44() {
      var arch = (THEME.archType === 'olympus') ? 'olympus_sky' : THEME.archType;
      var stoneMatT = new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.92, metalness: 0.04 });
      var marbMatT = new THREE.MeshStandardMaterial({ map: marbleTex, roughness: 0.4, metalness: 0.06 });
      var goldMatT = new THREE.MeshStandardMaterial({ color: 0xffcf56, roughness: 0.26, metalness: 0.85 });
      var added = 0;
      function bx(parent, w, h, d, mat, x, y, z, ry, rz) {
        var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
        m.position.set(x, y, z); if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz;
        m.castShadow = true; m.receiveShadow = true; parent.add(m); added++; return m;
      }
      function cyl(parent, rt, rb, h, seg, mat, x, y, z) {
        var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
        m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); added++; return m;
      }
      function stdMat(c, r, m2) { return new THREE.MeshStandardMaterial({ color: c, roughness: r == null ? 0.85 : r, metalness: m2 || 0.03 }); }
      /* 反りのある切妻屋根（プロファイル押し出し） */
      function gableRoof(w, d, h, mat, ridgeMat, sori) {
        var g = new THREE.Group();
        var sh = new THREE.Shape();
        sh.moveTo(-w / 2, 0);
        if (sori) { sh.quadraticCurveTo(-w * 0.2, h * 0.95, 0, h); sh.quadraticCurveTo(w * 0.2, h * 0.95, w / 2, 0); }
        else { sh.lineTo(0, h); sh.lineTo(w / 2, 0); }
        sh.lineTo(w / 2 - 0.3, -0.26); sh.lineTo(-w / 2 + 0.3, -0.26); sh.closePath();
        var geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false });
        geo.translate(0, 0, -d / 2);
        var slab = new THREE.Mesh(geo, mat); slab.castShadow = true; slab.receiveShadow = true; g.add(slab); added++;
        var ridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, d * 0.94), ridgeMat || mat);
        ridge.position.y = h + 0.05; ridge.castShadow = true; g.add(ridge); added++;
        return g;
      }
      /* ---------- メインストリート（地形追従リボン）＋広場 ---------- */
      /* v4.4: 明るい石畳テクスチャを自前生成（従来 stoneTex は暗くアスファルトに見えた） */
      var pavCanvas = document.createElement('canvas'); pavCanvas.width = pavCanvas.height = 256;
      var pcx = pavCanvas.getContext('2d');
      pcx.fillStyle = '#8f887a'; pcx.fillRect(0, 0, 256, 256);
      var pavRnd = 1234; function pavRand() { pavRnd = (pavRnd * 16807) % 2147483647; return pavRnd / 2147483647; }
      for (var py = 0; py < 4; py++) for (var px2 = 0; px2 < 4; px2++) {
        var sh = 148 + Math.floor(pavRand() * 26) - 8;
        pcx.fillStyle = 'rgb(' + sh + ',' + (sh - 6) + ',' + (sh - 22) + ')';
        pcx.fillRect(px2 * 64 + 3, py * 64 + 3, 58, 58);
        pcx.fillStyle = 'rgba(255,255,255,0.05)'; pcx.fillRect(px2 * 64 + 3, py * 64 + 3, 58, 10);
      }
      for (var sp = 0; sp < 2600; sp++) {
        var sv = Math.floor(pavRand() * 60) - 30;
        pcx.fillStyle = 'rgba(' + (140 + sv) + ',' + (134 + sv) + ',' + (118 + sv) + ',0.25)';
        pcx.fillRect(Math.floor(pavRand() * 256), Math.floor(pavRand() * 256), 2, 2);
      }
      var streetTex = new THREE.CanvasTexture(pavCanvas);
      streetTex.wrapS = streetTex.wrapT = THREE.RepeatWrapping; streetTex.repeat.set(1, 1);
      var streetMat = new THREE.MeshStandardMaterial({ map: streetTex, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide });
      var edgeMat = stdMat(0x3f4448, 0.95); edgeMat.side = THREE.DoubleSide;
      function ribbon(pts, width, mat, yOff, uvScale) {
        var pos = [], uv = [], idx = [], dist = 0;
        for (var i = 0; i < pts.length; i++) {
          var pt = pts[i];
          var pn = pts[Math.min(pts.length - 1, i + 1)], pp = pts[Math.max(0, i - 1)];
          var vx = pn[0] - pp[0], vz = pn[1] - pp[1]; var vl = Math.hypot(vx, vz) || 1; vx /= vl; vz /= vl;
          var qx = vz, qz = -vx;
          if (i > 0) dist += Math.hypot(pt[0] - pp[0], pt[1] - pp[1]);
          var hw = width / 2;
          var y1 = terrainY(pt[0] - qx * hw, pt[1] - qz * hw) + yOff, y2 = terrainY(pt[0] + qx * hw, pt[1] + qz * hw) + yOff;
          pos.push(pt[0] - qx * hw, y1, pt[1] - qz * hw, pt[0] + qx * hw, y2, pt[1] + qz * hw);
          uv.push(0, dist / (uvScale || 4), 1, dist / (uvScale || 4));
          if (i < pts.length - 1) { var a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        }
        var g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setIndex(idx); g.computeVertexNormals();
        var m = new THREE.Mesh(g, mat); m.receiveShadow = true; scene.add(m); added++;
        return m;
      }
      function densify(pts, step) { var out = [pts[0]]; for (var di = 1; di < pts.length; di++) { var a = pts[di - 1], b = pts[di]; var dd = Math.hypot(b[0] - a[0], b[1] - a[1]); var nn = Math.max(1, Math.round(dd / step)); for (var dj = 1; dj <= nn; dj++) out.push([a[0] + (b[0] - a[0]) * dj / nn, a[1] + (b[1] - a[1]) * dj / nn]); } return out; }
      var mainPts = densify([[0, 32], [1.2, 18], [-1.2, 2], [0.8, -14], [-0.8, -30], [0, -46]], 3.5);
      ribbon(mainPts, 7.6, streetMat, 0.16, 4);
      ribbon(mainPts, 8.7, edgeMat, 0.13, 4);
      var crossPts = densify([[-32, 10.5], [-14, 11.2], [0, 10], [14, 9.4], [32, 10.2]], 3.5);
      ribbon(crossPts, 6.0, streetMat, 0.15, 4);
      var plaza = new THREE.Mesh(new THREE.CircleGeometry(13.5, 36), streetMat);
      plaza.rotation.x = -Math.PI / 2; plaza.position.set(0, terrainY(0, 10) + 0.06, 10); plaza.receiveShadow = true; scene.add(plaza); added++;
      var plazaRing = new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.3, 6, 40), edgeMat);
      plazaRing.rotation.x = Math.PI / 2; plazaRing.position.set(0, terrainY(0, 10) + 0.1, 10); scene.add(plazaRing); added++;

      /* ---------- 建築キット ---------- */
      var PAL = {
        kyoto:    { wall: 0x54402a, wall2: 0xe9e1cd, timber: 0x2e2015, roof: 0x39424f, roofR: 0x232833, accent: 0x2a3a6e, glass: 0xffca7a, sori: true, roofH: 1.35 },
        edo:      { wall: 0x2a2c34, wall2: 0xdcd6c4, timber: 0x17181e, roof: 0x1d2027, roofR: 0xffcf56, accent: 0x8e1f1f, glass: 0xffb45e, sori: true, roofH: 1.45 },
        paris:    { wall: 0xefe6d0, wall2: 0xe6dcc4, timber: 0x4a3421, roof: 0xb5651d, roofR: 0x8a4a16, accent: 0x51643c, glass: 0xbfd9e8, sori: false, roofH: 2.5 },
        rome:     { wall: 0xc9ab7d, wall2: 0xbf9d6c, timber: 0x8a6a42, roof: 0xa8542f, roofR: 0x7e3c20, accent: 0x74552e, glass: 0xbfd9e8, sori: false, roofH: 0.95 },
        america:  { wall: 0xe8e4da, wall2: 0x9db3c0, timber: 0x5a4632, roof: 0x5a5f66, roofR: 0x3c4046, accent: 0x8e3324, glass: 0xbfd9e8, sori: false, roofH: 1.7 },
        olympus_sky: { wall: 0xf2ede0, wall2: 0xe9e2cf, timber: 0xc9a227, roof: 0xffcf56, roofR: 0xc9a227, accent: 0xfff2b0, glass: 0xd8ecff, sori: false, roofH: 1.1 }
      };
      var P = PAL[arch] || PAL.kyoto;
      var wallM = stdMat(P.wall, 0.88), wall2M = stdMat(P.wall2, 0.85), timbM = stdMat(P.timber, 0.8),
          roofM = stdMat(P.roof, 0.6, 0.15), roofRM = stdMat(P.roofR, 0.55, 0.2),
          accM = stdMat(P.accent, 0.7), glassM = new THREE.MeshStandardMaterial({ color: P.glass, roughness: 0.18, metalness: 0.25, emissive: P.glass, emissiveIntensity: (arch === 'kyoto' || arch === 'edo') ? 0.35 : 0.06 });
      function buildHouse(w, d, h, variant) {
        var g = new THREE.Group();
        bx(g, w + 0.35, 0.55, d + 0.35, stoneMatT, 0, 0.27, 0);                    // 石の基壇
        bx(g, w, h, d, variant % 2 ? wall2M : wallM, 0, 0.55 + h / 2, 0);          // 壁
        var fz = d / 2;
        if (arch !== 'olympus_sky') {
          // 木組み: 柱・梁（前面）
          [-1, 1].forEach(function (sx) { bx(g, 0.2, h, 0.2, timbM, sx * (w / 2 - 0.1), 0.55 + h / 2, fz + 0.03); });
          bx(g, w, 0.22, 0.14, timbM, 0, 0.55 + h - 0.12, fz + 0.03);
          bx(g, w, 0.2, 0.14, timbM, 0, 0.55 + 0.35, fz + 0.03);
          if (arch === 'paris') { // ハーフティンバーの斜材
            bx(g, 0.16, h * 0.92, 0.12, timbM, -w * 0.22, 0.55 + h / 2, fz + 0.04, 0, 0.62);
            bx(g, 0.16, h * 0.92, 0.12, timbM, w * 0.22, 0.55 + h / 2, fz + 0.04, 0, -0.62);
          }
          // 窓（枠＋格子＋ガラス）
          var nWin = w > 6.4 ? 3 : 2;
          for (var wi = 0; wi < nWin; wi++) {
            var wx = (wi - (nWin - 1) / 2) * (w / (nWin + 0.6));
            if (Math.abs(wx) < 0.85) continue; // 扉と重なる窓は省略
            bx(g, 0.98, 1.15, 0.1, timbM, wx, 0.55 + h * 0.58, fz + 0.04);
            bx(g, 0.78, 0.95, 0.12, glassM, wx, 0.55 + h * 0.58, fz + 0.05);
            bx(g, 0.07, 0.95, 0.13, timbM, wx, 0.55 + h * 0.58, fz + 0.06);
            bx(g, 0.78, 0.07, 0.13, timbM, wx, 0.55 + h * 0.58, fz + 0.06);
          }
          // 扉＋暖簾/看板
          bx(g, 1.0, 1.95, 0.12, timbM, 0, 0.55 + 0.98, fz + 0.04);
          if (arch === 'kyoto' || arch === 'edo') {
            bx(g, 1.45, 0.6, 0.07, accM, 0, 0.55 + 2.28, fz + 0.16);
            cyl(g, 0.045, 0.045, 1.6, 6, timbM, 0, 0.55 + 2.62, fz + 0.16).rotation.z = Math.PI / 2;
          } else {
            bx(g, 0.55, 1.15, 0.09, accM, w / 2 - 0.75, 0.55 + 1.7, fz + 0.06); // 看板
          }
          // 提灯（京都/江戸） or 街灯ポスト（他）
          var lx = w / 2 + 0.55;
          cyl(g, 0.06, 0.08, 2.5, 6, timbM, lx, 1.25, fz + 0.4);
          var lamp = bx(g, 0.34, 0.44, 0.34, glassM, lx, 2.62, fz + 0.4);
          lamp.material = glassM;
        } else {
          // 神域: 列柱＋ペディメントのパビリオン
          for (var ci = -1; ci <= 1; ci++) cyl(g, 0.22, 0.26, h, 10, marbMatT, ci * (w / 2 - 0.5), 0.55 + h / 2, fz - 0.3);
          bx(g, w + 0.6, 0.35, d + 0.4, goldMatT, 0, 0.55 + h + 0.15, 0);
        }
        var rf = gableRoof(w + 1.7, d + 1.5, P.roofH * (0.9 + (variant % 3) * 0.12), roofM, roofRM, P.sori);
        rf.position.y = 0.55 + h; g.add(rf);
        if (arch === 'paris' || arch === 'america' || arch === 'rome') {
          bx(g, 0.55, 1.25, 0.55, arch === 'america' ? stdMat(0x7a4436, 0.9) : stoneMatT, w * 0.26, 0.55 + h + P.roofH * 0.45, 0); // 煙突
        }
        return g;
      }
      /* 建物列: 参道の両側（施設・池・バンカー・ランドマークを避ける） */
      var exclusions = [[-38, -38, 12], [0, -72, 17], [0, -70, 17], [-42, -45, 13], [0, -80, 15], [20, 34, 10], [-24, 40, 8], [26, -18, 15], [-32, 22, 13], [0, -52, 8], [-11, 8, 5], [11, 8, 5], [0, 14, 5]];
      function blocked(x, z) {
        for (var i = 0; i < exclusions.length; i++) if (Math.hypot(x - exclusions[i][0], z - exclusions[i][1]) < exclusions[i][2]) return true;
        for (var j = 0; j < PONDS.length; j++) if (Math.hypot(x - PONDS[j].x, z - PONDS[j].z) < PONDS[j].r + 5) return true;
        for (var k = 0; k < BUNKERS.length; k++) if (Math.hypot(x - BUNKERS[k].x, z - BUNKERS[k].z) < BUNKERS[k].r + 4) return true;
        return false;
      }
      var seedT = 4242;
      var rndT = function () { seedT = (seedT * 1103515245 + 12345) & 0x7fffffff; return seedT / 0x7fffffff; };
      var slots = [];
      for (var zi = 0; zi < 9; zi++) slots.push(25 - zi * 8.3);
      slots.forEach(function (z, si) {
        [-1, 1].forEach(function (side) {
          if (rndT() < 0.22) return; // 抜けを作る
          var w = 5.6 + rndT() * 2.2, d = 4.6 + rndT() * 1.4, h = 3.1 + rndT() * 1.3;
          var x = side * (6.6 + d / 2);
          var zz = z + (rndT() - 0.5) * 1.6;
          if (blocked(x, zz)) return;
          var house = buildHouse(w, d, h, si * 2 + (side > 0 ? 1 : 0));
          house.position.set(x, terrainY(x, zz), zz);
          house.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
          scene.add(house);
        });
      });
      /* 横丁の建物（広場の東西） */
      [-24, 24].forEach(function (x, hi) {
        if (blocked(x, 17)) return;
        var house = buildHouse(6.4, 5.0, 3.5, hi + 5);
        house.position.set(x, terrainY(x, 17), 17);
        house.rotation.y = x > 0 ? Math.PI : 0;
        scene.add(house);
      });

      /* ---------- エリア固有の小物・ビスタ ---------- */
      if (arch === 'kyoto' || arch === 'edo') {
        var sakuraM = [stdMat(0xf2b8c6, 0.95), stdMat(0xeaa0b4, 0.95), stdMat(0xf6ccd6, 0.95)];
        var trunkMS = stdMat(0x3a2a1c, 0.95);
        [[-6.9, 20], [6.9, 2], [-6.9, -16], [6.9, -34]].forEach(function (sp, i2) {
          var tg = new THREE.Group();
          var tr = cyl(tg, 0.16, 0.3, 2.6, 7, trunkMS, 0, 1.3, 0); tr.rotation.z = (i2 % 2 ? -0.1 : 0.12);
          for (var k2 = 0; k2 < 3; k2++) {
            var cl2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 - k2 * 0.25, 1), sakuraM[(i2 + k2) % 3]);
            cl2.position.set((rndT() - 0.5) * 1.6, 2.9 + k2 * 0.7, (rndT() - 0.5) * 1.6);
            cl2.castShadow = true; tg.add(cl2); added++;
          }
          tg.position.set(sp[0], terrainY(sp[0], sp[1]), sp[1]); scene.add(tg);
        });
        // 石灯籠（参道わき）
        for (var li = 0; li < 6; li++) {
          var lz = 22 - li * 13, lx2 = (li % 2 ? 5.4 : -5.4);
          var lg = new THREE.Group();
          bx(lg, 0.52, 0.22, 0.52, stoneMatT, 0, 0.11, 0);
          cyl(lg, 0.1, 0.13, 0.85, 8, stoneMatT, 0, 0.62, 0);
          bx(lg, 0.44, 0.36, 0.44, stoneMatT, 0, 1.2, 0);
          bx(lg, 0.3, 0.2, 0.3, glassM, 0, 1.2, 0);
          var cap = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.34, 4), stoneMatT);
          cap.rotation.y = Math.PI / 4; cap.position.y = 1.52; cap.castShadow = true; lg.add(cap); added++;
          var jewel = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), stoneMatT); jewel.position.y = 1.76; lg.add(jewel); added++;
          lg.position.set(lx2, terrainY(lx2, lz), lz); scene.add(lg);
        }
        // 石垣＋生垣（東側の擁壁）
        for (var wi2 = 0; wi2 < 3; wi2++) bx(scene, 1.1, 0.5, 34, stoneMatT, 13.8, terrainY(13.8, -2) + 0.25 + wi2 * 0.48, -2);
        bx(scene, 1.3, 0.8, 34, stdMat(0x1d4d22, 0.95), 13.8, terrainY(13.8, -2) + 1.85, -2);
      }
      if (arch === 'paris') {
        // 街の塔（ビスタ）: 石の円塔＋円錐屋根
        var tw = new THREE.Group();
        cyl(tw, 2.0, 2.4, 10.5, 14, stoneMatT, 0, 5.25, 0);
        var trf = new THREE.Mesh(new THREE.ConeGeometry(3.0, 4.4, 14), stdMat(0x46586e, 0.55, 0.3));
        trf.position.y = 12.6; trf.castShadow = true; tw.add(trf); added++;
        bx(tw, 0.7, 1.1, 0.2, glassM, 0, 7.6, 2.25);
        bx(tw, 0.7, 1.1, 0.2, glassM, 0, 4.6, 2.32);
        tw.position.set(-13.5, terrainY(-13.5, -38), -38); scene.add(tw);
      }
      if (arch === 'rome') {
        var cypM = stdMat(0x14401c, 0.95), trkM = stdMat(0x4a3421, 0.9);
        [[-6.8, 14], [6.8, -6], [-6.8, -24], [6.8, -40]].forEach(function (cp) {
          var cg2 = new THREE.Group();
          cyl(cg2, 0.09, 0.14, 1.0, 6, trkM, 0, 0.5, 0);
          var cone = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), cypM);
          cone.scale.set(1, 3.1, 1); cone.position.y = 3.4; cone.castShadow = true; cg2.add(cone); added++;
          cg2.position.set(cp[0], terrainY(cp[0], cp[1]), cp[1]); scene.add(cg2);
        });
      }
      if (arch === 'america') {
        // 星条旗ポール（広場）
        var fp = new THREE.Group();
        cyl(fp, 0.07, 0.1, 9.4, 8, stdMat(0xd8d8d8, 0.4, 0.6), 0, 4.7, 0);
        var flag = bx(fp, 2.3, 1.35, 0.06, stdMat(0xb22234, 0.8), 1.2, 8.5, 0);
        bx(fp, 0.95, 0.72, 0.07, stdMat(0x3c3b6e, 0.8), 0.55, 8.82, 0);
        fp.position.set(6.5, terrainY(6.5, 17), 17); scene.add(fp);
        // 給水塔
        var wt = new THREE.Group();
        [[-1.4, -1.4], [1.4, -1.4], [-1.4, 1.4], [1.4, 1.4]].forEach(function (lg2) { bx(wt, 0.22, 6.4, 0.22, trkM2(), lg2[0], 3.2, lg2[1]); });
        function trkM2() { return stdMat(0x5a4632, 0.9); }
        cyl(wt, 2.5, 2.5, 3.4, 12, stdMat(0x8e6b42, 0.85), 0, 8.1, 0);
        var wtc = new THREE.Mesh(new THREE.ConeGeometry(2.9, 1.7, 12), stdMat(0x5a5f66, 0.6));
        wtc.position.y = 10.6; wtc.castShadow = true; wt.add(wtc); added++;
        wt.position.set(-21, terrainY(-21, -28), -28); scene.add(wt);
      }

      /* ---------- 池・バンカーの縁処理 ---------- */
      PONDS.forEach(function (pd) {
        var mud = new THREE.Mesh(new THREE.RingGeometry(pd.r - 0.4, pd.r + 2.6, 36), stdMat(0x44502f, 1));
        mud.rotation.x = -Math.PI / 2;
        mud.position.set(pd.x, terrainY(pd.x, pd.z) + 1.50, pd.z);
        mud.receiveShadow = true; scene.add(mud); added++;
        for (var si2 = 0; si2 < 14; si2++) {
          var an = (si2 / 14) * Math.PI * 2 + rndT() * 0.3;
          var sx = pd.x + Math.cos(an) * (pd.r + 1.1), sz = pd.z + Math.sin(an) * (pd.r + 1.1);
          var st = new THREE.Mesh(new THREE.DodecahedronGeometry(0.4 + rndT() * 0.4, 0), stoneMatT);
          st.scale.y = 0.55; st.position.set(sx, terrainY(sx, sz) + 0.12, sz); st.rotation.y = rndT() * 3;
          st.castShadow = true; scene.add(st); added++;
        }
      });
      BUNKERS.forEach(function (bk) {
        var lip = new THREE.Mesh(new THREE.TorusGeometry(bk.r, 0.34, 7, 26), stdMat(0x8a6f3c, 1));
        lip.rotation.x = Math.PI / 2; lip.scale.set(1, 1, 0.55);
        lip.position.set(bk.x, terrainY(bk.x, bk.z) + 0.10, bk.z);
        scene.add(lip); added++;
        var inner = new THREE.Mesh(new THREE.CircleGeometry(bk.r * 0.97, 26), stdMat(0xb99c62, 1));
        inner.rotation.x = -Math.PI / 2;
        inner.position.set(bk.x, terrainY(bk.x, bk.z) + 0.045, bk.z);
        scene.add(inner); added++;
      });

      /* ---------- 散布物（茂み・岩・草むら）InstancedMesh ---------- */
      var dummy = new THREE.Object3D();
      var bushGeo = new THREE.IcosahedronGeometry(0.75, 1);
      var bushMat = stdMat(0xffffff, 0.95); bushMat.flatShading = true;
      var bushN = window.innerWidth < 820 ? 90 : 150;
      var bushes = new THREE.InstancedMesh(bushGeo, bushMat, bushN);
      var bushCols = [new THREE.Color(0x1d4d22), new THREE.Color(0x27632a), new THREE.Color(0x2e7030), new THREE.Color(0x1a421e)];
      var placedB = 0, guardB = 0;
      while (placedB < bushN && guardB++ < 900) {
        var a2 = rndT() * Math.PI * 2, rr2 = 13 + rndT() * 76;
        var bx3 = Math.cos(a2) * rr2, bz3 = Math.sin(a2) * rr2;
        if (Math.abs(bx3) < 8.6 && bz3 > -52 && bz3 < 34) continue;
        if (blocked(bx3, bz3)) continue;
        dummy.position.set(bx3, terrainY(bx3, bz3) + 0.25, bz3);
        dummy.scale.set(0.7 + rndT() * 1.1, 0.5 + rndT() * 0.6, 0.7 + rndT() * 1.1);
        dummy.rotation.set(0, rndT() * 3, 0); dummy.updateMatrix();
        bushes.setMatrixAt(placedB, dummy.matrix);
        bushes.setColorAt(placedB, bushCols[Math.floor(rndT() * 4)]);
        placedB++;
      }
      bushes.count = placedB; if (bushes.instanceColor) bushes.instanceColor.needsUpdate = true;
      bushes.castShadow = true; scene.add(bushes); added++;
      var rockGeo = new THREE.DodecahedronGeometry(0.55, 0);
      var rockMat = stdMat(0x777268, 0.95); rockMat.flatShading = true;
      var rockN = window.innerWidth < 820 ? 36 : 60;
      var rocks = new THREE.InstancedMesh(rockGeo, rockMat, rockN);
      var placedR = 0; guardB = 0;
      while (placedR < rockN && guardB++ < 700) {
        var a3 = rndT() * Math.PI * 2, rr3 = 15 + rndT() * 74;
        var rx3 = Math.cos(a3) * rr3, rz3 = Math.sin(a3) * rr3;
        if (Math.abs(rx3) < 8.6 && rz3 > -52 && rz3 < 34) continue;
        if (blocked(rx3, rz3)) continue;
        dummy.position.set(rx3, terrainY(rx3, rz3) + 0.12, rz3);
        dummy.scale.set(0.6 + rndT() * 1.3, 0.5 + rndT() * 0.8, 0.6 + rndT() * 1.3);
        dummy.rotation.set(rndT(), rndT() * 3, rndT()); dummy.updateMatrix();
        rocks.setMatrixAt(placedR, dummy.matrix);
        placedR++;
      }
      rocks.count = placedR; rocks.castShadow = true; scene.add(rocks); added++;
      window.__TOWN44 = { added: added, bushes: placedB, rocks: placedR };
    })();

    var LANDMARKS = [];
    var subTrialTargetMesh = null;
    var _subTrialBaseY = null; /* v4.29 P-6: 試練ターゲットの地面高さ（terrainY(26,-18)。固定座標のため初回に1回だけ計算して使い回す） */
    var duelGateGroup = null, duelPortalMesh = null;

    (function buildFacilities() {
      var goldMat = new THREE.MeshStandardMaterial({ color: 0xffd466, roughness: 0.25, metalness: 0.85, emissive: 0x553800 });
      var cyanMat = new THREE.MeshStandardMaterial({ color: 0x5ce1e6, roughness: 0.2, metalness: 0.6, emissive: 0x104555 });
      var purpMat = new THREE.MeshStandardMaterial({ color: 0xb589ff, roughness: 0.3, metalness: 0.5, emissive: 0x321055 });

      function addBeaconSpot(x, z, colorHex, label, radius, action) {
        var g = new THREE.Group();
        var y = terrainY(x, z);
        var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.85, 0.55, 20),
          new THREE.MeshStandardMaterial({ color: 0x222742, roughness: 0.4, metalness: 0.5 }));
        ped.position.y = 0.28;
        var ring = new THREE.Mesh(new THREE.RingGeometry(1.75, 2.1, 32),
          new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.1;
        var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.68, 0),
          new THREE.MeshStandardMaterial({ color: colorHex, emissive: colorHex, emissiveIntensity: 0.45, roughness: 0.15, metalness: 0.8 }));
        crystal.position.y = 2.1;
        g.add(ped, ring, crystal);
        g.position.set(x, y, z);
        scene.add(g);
        var lm = { x: x, z: z, r: radius || 3.6, label: label, color: colorHex, crystal: crystal, action: action };
        LANDMARKS.push(lm);
        return lm;
      }

      /* 3大拠点（中央広場周辺） */
      addBeaconSpot(-11, 8, 0xffd875, "🏠 クラブハウス（全回復・新聞ヒント・セーブ）", 3.8, { type: "facility", facility: "clubhouse" });
      addBeaconSpot(11, 8, 0x44e587, "🛍 プロショップ（全11枠ギア・ボール購入）", 3.8, { type: "facility", facility: "proshop" });
      addBeaconSpot(0, 14, 0xb589ff, "🍸 19番ホール（モイライの織物・ビンゴ・図鑑）", 3.8, { type: "facility", facility: "hole19" });

      /* 運命の岐路①・② ＆ ノクスの誘惑オベリスク（エリア0〜4） */
      if (AREA_IDX <= 4) {
        addBeaconSpot(-24, -10, 0x7ee8fa, "⚖ 運命の岐路①の祠を調べる", 3.8, { type: "branch", eventKey: "b1" });
        addBeaconSpot(22, 14, 0x7ee8fa, "⚖ 運命の岐路②の碑を調べる", 3.8, { type: "branch", eventKey: "b2" });
        addBeaconSpot(-14, -34, 0xff4d6d, "🌑 ノクスの囁き（誘惑の黒碑）に触れる", 3.8, { type: "branch", eventKey: "tempt" });
      }

      /* 神話のサブ試練祭壇（池越えの波動ターゲットクリスタル！ 波動ショットを当てるか接近で達成） */
      var stX = 26, stZ = -18; // 第1の池の中央上空に浮かぶ神話クリスタル！
      var stY = terrainY(stX, stZ) + 3.4;
      subTrialTargetMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.35, 0),
        cyanMat
      );
      subTrialTargetMesh.position.set(stX, stY, stZ);
      scene.add(subTrialTargetMesh);
      var pillarBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.45, 0.45, 18, 16, 1, true),
        new THREE.MeshBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
      );
      pillarBeam.position.set(stX, stY + 6, stZ);
      scene.add(pillarBeam);
      subTrialTargetMesh.userData.beam = pillarBeam;
      addBeaconSpot(13, -15, 0x5ce1e6, "⚡ 神話の試練祭壇（池上の蒼き結晶を波動ショットで射抜け！）", 3.6, { type: "subtrial_hint" });

      /* 北端：決戦の門（Gate of Duel） */
      duelGateGroup = new THREE.Group();
      var gx = 0, gz = -52, gy = terrainY(gx, gz);
      var p1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.75, 8.2, 16), goldMat);
      var p2 = p1.clone();
      p1.position.set(-3.8, 4.1, 0);
      p2.position.set(3.8, 4.1, 0);
      var arch = new THREE.Mesh(new THREE.BoxGeometry(9.6, 1.1, 1.4), goldMat);
      arch.position.y = 8.4;
      duelPortalMesh = new THREE.Mesh(
        new THREE.CircleGeometry(3.5, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd875, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
      );
      duelPortalMesh.position.y = 4.2;
      duelGateGroup.add(p1, p2, arch, duelPortalMesh);
      duelGateGroup.position.set(gx, gy, gz);
      scene.add(duelGateGroup);
      LANDMARKS.push({ x: gx, z: gz, r: 4.6, label: "⛳ 決戦の門（ゴルフ真剣勝負へ挑む！）", color: 0xff4d5a, isGate: true, action: { type: "duel" } });
      /* v4.4: ビーコンの浮遊クリスタルに光柱と石の基壇リングを与え「祠ビーコン」として接地させる */
      LANDMARKS.forEach(function (lm) {
        if (!lm.crystal) return;
        var gy2 = terrainY(lm.x, lm.z);
        var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 1.65, 10, 1, true),
          new THREE.MeshBasicMaterial({ color: lm.color, transparent: true, opacity: 0.34, side: THREE.DoubleSide, depthWrite: false }));
        pillar.position.set(lm.x, gy2 + 1.28, lm.z); scene.add(pillar);
        var bring = new THREE.Mesh(new THREE.TorusGeometry(1.95, 0.13, 6, 26),
          new THREE.MeshStandardMaterial({ color: 0x4c4e56, roughness: 0.9 }));
        bring.rotation.x = Math.PI / 2; bring.position.set(lm.x, gy2 + 0.14, lm.z); scene.add(bring);
        for (var bs2 = 0; bs2 < 4; bs2++) {
          var an2 = bs2 * Math.PI / 2 + 0.4;
          var bst = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3, 0),
            new THREE.MeshStandardMaterial({ color: 0x5a5c60, roughness: 0.95 }));
          bst.position.set(lm.x + Math.cos(an2) * 2.0, gy2 + 0.1, lm.z + Math.sin(an2) * 2.0);
          scene.add(bst);
        }
      });
    })();

    /* 人型3Dゴルファーメッシュ構築（主人公＆残影30名の個別帽子・眼鏡・衣装完全対応） */
    /* 人型ゴルファー構築（商用品質アップグレード： PBR多関節ボーン階層＋Canvas柄シャツ＋立体造形の顔・帽子） */
    var GOLFER_RIGS = [];
    function golferShirtTexture(kind, baseHex) {
      try {
        var cv = document.createElement("canvas"); cv.width = cv.height = 512;
        var cx = cv.getContext("2d"); cx.scale(4, 4);
        cx.fillStyle = baseHex; cx.fillRect(0, 0, 128, 128);
        cx.strokeStyle = "rgba(255,255,255,0.35)"; cx.lineWidth = 5;
        if (kind === "argyle") {
          cx.save(); cx.translate(64, 64); cx.rotate(Math.PI / 4);
          for (var i = -3; i <= 3; i++) { cx.beginPath(); cx.moveTo(i * 30, -110); cx.lineTo(i * 30, 110); cx.stroke(); cx.beginPath(); cx.moveTo(-110, i * 30); cx.lineTo(110, i * 30); cx.stroke(); }
          cx.restore();
        } else if (kind === "check") {
          cx.fillStyle = "rgba(255,255,255,0.20)";
          for (var j = 0; j < 4; j++) { cx.fillRect(0, j * 32, 128, 7); cx.fillRect(j * 32, 0, 7, 128); }
        } else {
          cx.fillStyle = "rgba(255,255,255,0.30)";
          for (var k = 0; k < 4; k++) cx.fillRect(0, 12 + k * 32, 128, 6);
        }
        cx.fillStyle = "rgba(0,0,0,0.16)"; cx.fillRect(0, 108, 128, 20);
        var tx = new THREE.CanvasTexture(cv);
        tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(2, 1);
        return tx;
      } catch (e) { return null; }
    }
    function buildGolferMesh(opts) {
      var g = new THREE.Group();
      var sc = opts.scale || 1.0;
      var baseCol = "#" + (opts.shirt >>> 0).toString(16).padStart(6, "0");
      var pattern = opts.pattern || (opts.acc === "argyle" ? "argyle" : (opts.acc === "goldpin" ? "check" : "stripe"));
      var shirtTex = golferShirtTexture(pattern, baseCol);
      var shirtMat = new THREE.MeshStandardMaterial({ color: opts.shirt, roughness: 0.62, map: shirtTex || null });
      var pantsMat = new THREE.MeshStandardMaterial({ color: opts.pants, roughness: 0.72 });
      var skinMat = new THREE.MeshStandardMaterial({ color: opts.skin || 0xeab98e, roughness: 0.58 });
      var side = (opts.acc === "lefty") ? -1 : 1;

      /* 脚：股関節→膝→足首の3関節＋ツートンシューズ */
      var shoeCol = (opts.acc === "twotone") ? 0xffffff : 0x1b1e28;
      var shoeMat = new THREE.MeshStandardMaterial({ color: shoeCol, roughness: 0.4 });
      var toeMat = new THREE.MeshStandardMaterial({ color: (opts.acc === "twotone") ? (opts.cap !== undefined ? opts.cap : 0x8b1e24) : 0x0c0e14, roughness: 0.35 });
      var legPivots = [], kneePivots = [], anklePivots = [];
      [-0.22, 0.22].forEach(function (lx) {
        var lp = new THREE.Group(); lp.position.set(lx, 1.15, 0);
        var thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.12, 0.60, 10), pantsMat);
        thigh.position.y = -0.30; thigh.castShadow = true; lp.add(thigh);
        var knee = new THREE.Group(); knee.position.y = -0.60; lp.add(knee);
        var shin = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.095, 0.55, 10), pantsMat);
        shin.position.y = -0.275; shin.castShadow = true; knee.add(shin);
        var ankle = new THREE.Group(); ankle.position.y = -0.55; knee.add(ankle);
        var shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.13, 0.34), shoeMat);
        shoe.position.set(0, -0.045, 0.05); ankle.add(shoe);
        var toe = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.10, 0.12), toeMat);
        toe.position.set(0, -0.055, 0.235); ankle.add(toe);
        g.add(lp); legPivots.push(lp); kneePivots.push(knee); anklePivots.push(ankle);
      });

      /* 骨盤→胸郭 */
      var hips = new THREE.Group(); hips.position.y = 1.15; g.add(hips);
      var pelvis = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.25, 0.24, 12), pantsMat);
      pelvis.position.y = 0.06; pelvis.castShadow = true; hips.add(pelvis);
      var torsoG = new THREE.Group(); torsoG.position.y = 0.10; hips.add(torsoG);
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.28, 0.92, 12), shirtMat);
      torso.position.y = 0.44; torso.castShadow = true; torsoG.add(torso);
      var collar = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.045, 8, 18), shirtMat);
      collar.position.y = 0.90; collar.rotation.x = Math.PI / 2 - 0.25; torsoG.add(collar);
      if (opts.acc === "argyle" || opts.acc === "goldpin") {
        var badge = new THREE.Mesh(new THREE.OctahedronGeometry(0.12, 0),
          new THREE.MeshStandardMaterial({ color: 0xffd875, metalness: 0.9, roughness: 0.2 }));
        badge.position.set(0.12, 0.56, 0.31); torsoG.add(badge);
      }
      if (opts.acc === "tie_knicker") {
        var tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.06),
          new THREE.MeshStandardMaterial({ color: 0x8b1e24 }));
        tie.position.set(0, 0.50, 0.32); torsoG.add(tie);
      }

      /* 頭部：顎ライン・鼻筋・耳を備えた立体造形＋帽子群 */
      var headG = new THREE.Group(); headG.position.y = 0.81; torsoG.add(headG);
      var head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 14), skinMat);
      head.position.y = 0.14; head.castShadow = true; headG.add(head);
      var jaw = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 10), skinMat);
      jaw.scale.set(0.92, 0.78, 0.95); jaw.position.set(0, 0.015, 0.035); headG.add(jaw);
      var nose = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.13, 8), skinMat);
      nose.rotation.x = Math.PI / 2 - 0.35; nose.position.set(0, 0.10, 0.27); headG.add(nose);
      [-0.255, 0.255].forEach(function (ex) {
        var ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), skinMat);
        ear.position.set(ex, 0.13, 0); headG.add(ear);
      });
      if (opts.acc === "glasses" || opts.acc === "sunglass") {
        var glMat = new THREE.MeshStandardMaterial({ color: opts.acc === "sunglass" ? 0x0a0c12 : 0xdde8ff, metalness: 0.85, roughness: 0.15 });
        var glMesh = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.09, 0.08), glMat);
        glMesh.position.set(0, 0.16, 0.24); headG.add(glMesh);
      }
      if (opts.acc === "beard") {
        var brd = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), new THREE.MeshStandardMaterial({ color: 0x4a3728 }));
        brd.position.set(0, 0.03, 0.10); headG.add(brd);
      }
      var hatType = opts.hat || "cap";
      var hatCol = (opts.cap !== undefined) ? opts.cap : (hatType === "straw" ? 0xe5c77b : (hatType === "flat" ? 0xf5f6fa : 0x1e2436));
      var hatMat = new THREE.MeshStandardMaterial({ color: hatCol, roughness: 0.55 });
      if (hatType === "cap" || hatType === "visor") {
        if (hatType === "cap") {
          var dome = new THREE.Mesh(new THREE.SphereGeometry(0.27, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), hatMat);
          dome.position.y = 0.20; headG.add(dome);
        }
        var brim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.04, 0.26), hatMat);
        brim.position.set(0, 0.22, 0.24); headG.add(brim);
      } else if (hatType === "straw") {
        var sBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 18), hatMat);
        sBrim.position.y = 0.28; headG.add(sBrim);
        var sTop = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.20, 16), hatMat);
        sTop.position.y = 0.38; headG.add(sTop);
        if (opts.acc === "shark") {
          var fin = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 4), new THREE.MeshStandardMaterial({ color: 0x38ada9 }));
          fin.position.set(0, 0.54, 0.12); headG.add(fin);
        }
      } else if (hatType === "flat" || hatType === "beret") {
        var fl = new THREE.Mesh(new THREE.SphereGeometry(0.30, 14, 10), hatMat);
        fl.scale.set(1.05, 0.42, 1.18); fl.position.set(0, 0.32, 0.05); headG.add(fl);
      }

      /* 腕：肩→肘→手首の多関節（クラブ側が主動・反対側はグリップへ添える） */
      function buildArm(sx) {
        var sh = new THREE.Group(); sh.position.set(0.34 * sx, 0.70, 0); torsoG.add(sh);
        var up = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.36, 8), shirtMat);
        up.position.y = -0.18; up.castShadow = true; sh.add(up);
        var el = new THREE.Group(); el.position.y = -0.36; sh.add(el);
        var fo = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.34, 8), skinMat);
        fo.position.y = -0.17; el.add(fo);
        var wr = new THREE.Group(); wr.position.y = -0.34; el.add(wr);
        var hand = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), skinMat);
        hand.position.y = -0.05; wr.add(hand);
        return { sh: sh, el: el, wr: wr, hand: hand };
      }
      var armC = buildArm(side);        /* クラブ側 */
      var armF = buildArm(-side);       /* 添え手側 */
      armF.sh.rotation.z = 0.55 * side; armF.sh.rotation.x = -0.55; armF.el.rotation.x = -0.65;
      var armPivot = armC.sh;

      /* クラブ（手首のクラブグループ配下：金属シャフト＋金ヘッド） */
      var clubGroup = new THREE.Group(); clubGroup.position.set(0.03 * side, -0.08, 0.06); armC.wr.add(clubGroup);
      var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.014, 1.15, 6),
        new THREE.MeshStandardMaterial({ color: 0xd8e2f0, metalness: 0.92, roughness: 0.15 }));
      shaft.position.set(0.02 * side, -0.52, 0.16); shaft.rotation.x = 0.30; clubGroup.add(shaft);
      var clubHead = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.20),
        new THREE.MeshStandardMaterial({ color: 0xffd466, metalness: 0.9, roughness: 0.2 }));
      clubHead.position.set(0.04 * side, -1.04, 0.33); clubGroup.add(clubHead);

      g.scale.setScalar(sc);
      var joints = { hips: hips, torso: torsoG, head: headG, shoulderC: armC.sh, elbowC: armC.el, wristC: armC.wr, shoulderF: armF.sh, elbowF: armF.el, knees: kneePivots, ankles: anklePivots };
      g.userData = { shirtMat: shirtMat, pantsMat: pantsMat, armPivot: armPivot, clubHead: clubHead, legs: legPivots, origShirt: opts.shirt, origPants: opts.pants, joints: joints, torsoMesh: torso };
      GOLFER_RIGS.push({ g: g, arm: armPivot, j: joints, torso: torso, seed: Math.random() * 10 });
      if (window.HQW) HQW.enqueueGolfer(g, { shirtMat: shirtMat, pantsMat: pantsMat, skinMat: skinMat, hatMat: hatMat, shoeMat: shoeMat, toeMat: toeMat, hatCol: hatCol, hatType: hatType, joints: joints, legs: legPivots, knees: kneePivots, ankles: anklePivots, clubGroup: clubGroup, torso: torso, charId: opts.charId || null });
      return g;
    }
    /* 運動連鎖＆呼吸モーション（既存の armPivot 駆動から全身へ配分する） */
    (function golferRigLoop() {
      var t0 = performance.now();
      function fr(now) {
        /* v4.9: pause 中はゴルファーリグの演算を止める */
        if (typeof STATE !== "undefined" && STATE.paused) { requestAnimationFrame(fr); return; }
        var t = (now - t0) / 1000;
        for (var i = 0; i < GOLFER_RIGS.length; i++) {
          var R = GOLFER_RIGS[i];
          if (!R.g.parent) continue;
          var ax = R.arm.rotation.x || 0;
          R.j.torso.rotation.y = ax * 0.30;
          R.j.hips.rotation.y = ax * 0.14;
          R.j.head.rotation.y = -ax * 0.36;
          R.j.head.rotation.x = Math.sin(t * 1.6 + R.seed) * 0.03;
          R.j.elbowC.rotation.x = -0.22 - Math.min(0.8, Math.abs(ax) * 0.4);
          R.torso.position.y = 0.44 + Math.sin(t * 1.6 + R.seed) * 0.012;
          R.j.ankles.forEach(function (a) { a.rotation.x = -ax * 0.10; });
        }
        requestAnimationFrame(fr);
      }
      requestAnimationFrame(fr);
    })();

    /* =========================================================================
       第4部：主人公・残影AI・四神波動ショットMAX・ファー咆哮・炎＆糸Canvas HUD
       ========================================================================= */
    var STATE = {
      mode: IS_GOAT ? "goat" : "normal",
      playerName: PNAME,
      rankTitle: IS_GOAT ? "グランドスラマー" : "100切り挑戦者",
      power: 100,
      mental: 100,
      balls: IS_GOAT ? 999 : 18,
      gold: IS_GOAT ? 999999 : 2400,
      tp: IS_GOAT ? 20000 : 0,
      clubIdx: 0,
      gearStats: {
        distPct: IS_GOAT ? 28 : 0,
        critMult: IS_GOAT ? 2.3 : 1.0,
        critRatePct: IS_GOAT ? 35 : 5,
        walkSpdPct: IS_GOAT ? 30 : 0,
        setThree: IS_GOAT,
        setOlympus: IS_GOAT,
        setGodComplete: IS_GOAT,
        specials: IS_GOAT ? { kusanagi: true, yasakani_eternal: true, hades_stealth: true } : {}
      },
      subTrialDone: false,
      paused: false
    };

    /* 主人公モデル＆神装オーラリング */
    var pal = CHAR_PALETTE[CHAR_ID] || CHAR_PALETTE.Watu;
    var playerMesh = buildGolferMesh({
      shirt: pal.shirt, pants: pal.pants, cap: pal.cap, skin: pal.skin, hat: "cap", charId: CHAR_ID, scale: ({ Watu: 1.02, Matuya: 1.05, TIiger: 1.07, Junbo: 1.06, McIlro: 1.10, DeCham: 1.09 }[CHAR_ID] || 1.05)
    });
 var player = { x: SPAWN_X, z: SPAWN_Z, rotY: Math.PI, vx: 0, vz: 0, hurtCd: 0, foreCd: 0, pushCd: 0};
    playerMesh.position.set(player.x, terrainY(player.x, player.z), player.z);
    playerMesh.rotation.y = player.rotY;
    scene.add(playerMesh);

    var sacredAuraRing = new THREE.Mesh(
      new THREE.RingGeometry(0.85, 1.15, 32),
      new THREE.MeshBasicMaterial({ color: 0xffd875, side: THREE.DoubleSide, transparent: true, opacity: 0.0, depthWrite: false })
    );
    sacredAuraRing.rotation.x = -Math.PI / 2;
    sacredAuraRing.position.y = 0.08;
    sacredAuraRing.visible = false; /* v4.14: opacity 0 のまま visible だと深度だけ書いて後方を遮るため、表示と連動させる */
    playerMesh.add(sacredAuraRing);

    var chargeOrb = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0x5ce1e6, transparent: true, opacity: 0.0, depthWrite: false })
    );
    chargeOrb.position.set(0.38, 0.55, 0.48);
    chargeOrb.visible = false; /* v4.14: 同上（チャージ中のみ表示） */
    playerMesh.add(chargeOrb);

    /* 環境パーティクル（桜吹雪・黄金粒子・黄泉霧→天岩戸の光） */
    var envParticles = (function createEnvParticles() {
      var cnt = 140;
      var geo = new THREE.BufferGeometry();
      var pos = new Float32Array(cnt * 3);
      for (var i = 0; i < cnt; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 150;
        pos[i * 3 + 1] = 1 + Math.random() * 22;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 150;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      var mat = new THREE.PointsMaterial({
        color: THEME.petalColor, size: 0.42, transparent: true, opacity: 0.72
      });
      var pts = new THREE.Points(geo, mat);
      scene.add(pts);
      return pts;
    })();

    /* 残影6体の配置と個別外観適用（エリア5天空の神域は最初から清浄） */
    var MOBS = [];
    var MOB_SPAWN_COORDS = [
      { x: -20, z: -2 }, { x: 20, z: -4 },
      { x: -30, z: -24 }, { x: 32, z: 4 },
      { x: -16, z: -40 }, { x: 18, z: -38 }
    ];

    function spawnAreaMobs(mobDefs, purifiedIds) {
      /* v4.5: 旧モブのシャツ用 CanvasTexture を解放し、残影リグ配列から除去済み分を剪定（sync のたびの単調増加を止める） */
 MOBS.forEach(function (m) {
if (m.mesh) {
m.mesh.traverse(function (o) {
/* v4.9: 旧モブの後片付けを完全化（従来は CanvasTexture のみ解放し、ジオメトリとマテリアルが
sync のたびに残留していた）。HQ テンプレート共有分（hqPart のジオメトリと MPFB48 マテリアル）は
次回も使うため解放しない。 */
if (o.geometry &&!o.userData.hqPart) { try { o.geometry.dispose();} catch (e) {}}
if (o.material) {
var mats = Array.isArray(o.material)? o.material: [o.material];
mats.forEach(function (mm) {
if (mm.map && mm.map.isCanvasTexture) { try { mm.map.dispose();} catch (e) {}}
if (!/^MPFB48_/.test(mm.name || "")) { try { mm.dispose();} catch (e) {}}
});
}
});
scene.remove(m.mesh);
}
});
      for (var ri = GOLFER_RIGS.length - 1; ri >= 0; ri--) { if (!GOLFER_RIGS[ri].g.parent) GOLFER_RIGS.splice(ri, 1); }
      MOBS = [];
      if (AREA_IDX === 5) return; // 天空の神域は神聖領域

      var list = (mobDefs && mobDefs.length) ? mobDefs : FALLBACK_MOBS_30.filter(function (m) { return m.area === AREA_IDX; });
      var pureSet = {};
      (purifiedIds || []).forEach(function (id) { pureSet[id] = true; });

      list.slice(0, 6).forEach(function (def, idx) {
        var vis = MOBS_VISUAL_MAP[def.id] || FALLBACK_MOBS_30[idx];
        var maxHp = def.cls === "大" ? 120 : (def.cls === "中" ? 80 : 45);
        var sc = (def.cls === "大" ? 1.16 : (def.cls === "中" ? 1.04 : 0.95)) * (vis.acc === "tall" ? 1.07 : 1.0);
        var mesh = buildGolferMesh({
          shirt: vis.shirt, pants: vis.pants, hat: vis.hat, acc: vis.acc, scale: sc
        });

        /* 闇の瘴気オーラリング */
        var miasma = new THREE.Mesh(
          new THREE.RingGeometry(0.75, 1.25, 24),
          new THREE.MeshBasicMaterial({ color: 0x9b30ff, side: THREE.DoubleSide, transparent: true, opacity: 0.68 })
        );
        miasma.rotation.x = -Math.PI / 2;
        miasma.position.y = 0.08;
        mesh.add(miasma);

        /* 頭上HPバー */
        var hpBg = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.15), new THREE.MeshBasicMaterial({ color: 0x111320, side: THREE.DoubleSide }));
        hpBg.position.y = 2.65;
        var hpFg = new THREE.Mesh(new THREE.PlaneGeometry(1.24, 0.10), new THREE.MeshBasicMaterial({ color: 0xd65eff, side: THREE.DoubleSide }));
        hpFg.position.set(0, 2.65, 0.01);
        mesh.add(hpBg, hpFg);

        var sp = MOB_SPAWN_COORDS[idx % MOB_SPAWN_COORDS.length];
        var isPure = !!pureSet[def.id];
        var mob = {
          id: def.id,
          name: def.name,
          cls: def.cls,
          homeX: sp.x, homeZ: sp.z,
          x: sp.x, z: sp.z,
          vx: 0, vz: 0,
          rotY: 0,
          hp: maxHp, maxHp: maxHp,
          purified: isPure,
          stunTimer: 0,
          blindTimer: 0,
          alerted: false,
          mesh: mesh,
          miasma: miasma,
          hpBg: hpBg,
          hpFg: hpFg
        };
        applyMobVisualState(mob);
        mesh.position.set(mob.x, terrainY(mob.x, mob.z), mob.z);
        scene.add(mesh);
        MOBS.push(mob);
      });
      refreshPurificationAtmosphere();
    }

    function applyMobVisualState(m) {
      var ud = m.mesh.userData;
      if (m.purified) {
        /* 浄化完了：黒紫の影が消え、本来の鮮やかな衣装と生気を取り戻す！ */
        ud.shirtMat.color.setHex(ud.origShirt);
        ud.shirtMat.emissive.setHex(0x000000);
        ud.pantsMat.color.setHex(ud.origPants);
        m.miasma.material.color.setHex(0x44e587);
        m.miasma.material.opacity = 0.35;
        m.hpBg.visible = false;
        m.hpFg.visible = false;
      } else {
        /* 浄化前：黒紫の呪縛トーン */
        ud.shirtMat.color.setHex(0x261738);
        ud.shirtMat.emissive.setHex(0x1f0933);
        ud.pantsMat.color.setHex(0x161124);
        m.miasma.visible = true;
      }
    }

    function countPurified() {
      var c = 0;
      for (var i = 0; i < MOBS.length; i++) if (MOBS[i].purified) c++;
      return c;
    }

    function isDuelGateOpen() {
      if (AREA_IDX === 5 || STATE.mode === "goat") return true;
      return countPurified() >= 2; // 2体以上浄化で決戦の門が開門！
    }

    function refreshPurificationAtmosphere() {
      var ratio = (AREA_IDX === 5 || MOBS.length === 0) ? 1.0 : (countPurified() / MOBS.length);
      /* v4.1（項目7）: ボス撃破済みエリアは残影の浄化率によらず光が満ちた状態にする */
      if (STATE.bossDefeated) ratio = 1.0;
      skyUniforms.uPure.value = Math.min(1.0, 0.16 + ratio * 0.84);
      var cDark = new THREE.Color(THEME.fogColor);
      var cPure = new THREE.Color(THEME.fogPure);
      scene.fog.color.copy(cDark.lerp(cPure, ratio));
      sunLight.intensity = (1.25 + ratio * 0.55) * Math.PI;
      if (duelPortalMesh) {
        var open = isDuelGateOpen();
        duelPortalMesh.material.color.setHex(open ? 0xffd875 : 0x6b3fa0);
        duelPortalMesh.material.opacity = open ? 0.68 : 0.25;
      }
      updateHudNumbers();
    }

    /* フィールド上の拾得ボール配置（ラフやバンカー周辺に点在・時間経過で補充） */
    var PICKUPS = [];
    (function spawnBallPickups() {
      var ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25, metalness: 0.1, emissive: 0x333322 });
      var ringMat = new THREE.MeshBasicMaterial({ color: 0xffe699, side: THREE.DoubleSide, transparent: true, opacity: 0.65 });
      var pts = [
        [-16, -12], [15, -24], [26, 22], [-28, 12], [8, -32], [-8, -22], [32, -10], [-36, -12]
      ];
      pts.forEach(function (p) {
        var grp = new THREE.Group();
        var sp = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), ballMat);
        sp.position.y = 0.35;
        var rg = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.48, 18), ringMat);
        rg.rotation.x = -Math.PI / 2; rg.position.y = 0.08;
        grp.add(sp, rg);
        grp.position.set(p[0], terrainY(p[0], p[1]), p[1]);
        scene.add(grp);
        PICKUPS.push({ x: p[0], z: p[1], active: true, respawn: 0, mesh: grp });
      });
    })();

    /* =========================================================================
       第5部：四神波動ショットMAX（青龍・朱雀・白虎・玄武）＆ 衝撃エフェクト群
       ========================================================================= */
    var PROJECTILES = [];
    var FX_LIST = [];
    var hitstopTimer = 0;
    var camShake = 0;

    function showToast(msg) {
      var area = document.getElementById("toastArea");
      var d = document.createElement("div");
      d.className = "toast";
      d.textContent = msg;
      area.appendChild(d);
      setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 2700);
    }

    var bannerTimer = null;
    function showBanner(big, sub) {
      var wrap = document.getElementById("centerBanner");
      document.getElementById("bannerBig").textContent = big;
      document.getElementById("bannerSub").textContent = sub || "";
      wrap.style.display = "block";
      if (bannerTimer) clearTimeout(bannerTimer);
      bannerTimer = setTimeout(function () { wrap.style.display = "none"; }, 3200);
    }

    /* v4.15: 波動弾・FX除去時の解放ヘルパー（golf側FXManagerと同型）。生成時に毎回 new される
       geometry/material を、除去時に必ず解放する。FX/波動弾のメッシュは生成ごとに新規作成で
       共有資産を使っていないため、ここでの dispose は他への影響がない。 */
    function _disposeFxObj(obj) {
      if (!obj) return;
      try {
        obj.traverse(function (o) {
          if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} }
          if (o.material) {
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach(function (m) { try { m.dispose(); } catch (e) {} });
          }
        });
      } catch (e) {}
    }

    function spawnPillarFX(x, z, colorHex, radius, height, dur) {
      var y = terrainY(x, z);
      var mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
      var cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.65, radius, height, 20, 1, true), mat);
      cyl.position.set(x, y + height * 0.5, z);
      scene.add(cyl);
      FX_LIST.push({ mesh: cyl, age: 0, dur: dur || 0.55, kind: "pillar" });

      var ring = new THREE.Mesh(new THREE.RingGeometry(0.4, radius * 1.3, 28),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, y + 0.14, z);
      scene.add(ring);
      FX_LIST.push({ mesh: ring, age: 0, dur: dur || 0.55, kind: "expand_ring" });
    }

    function spawnGroundGroove(x, z, rotY, colorHex) {
      var m = new THREE.Mesh(
        new THREE.PlaneGeometry(0.65, 2.2),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.78, side: THREE.DoubleSide })
      );
      m.rotation.x = -Math.PI / 2;
      m.rotation.z = -rotY;
      m.position.set(x, terrainY(x, z) + 0.09, z);
      scene.add(m);
      FX_LIST.push({ mesh: m, age: 0, dur: 0.75, kind: "fade" });
    }

    function spawnTigerClaws(x, z, isSandBlind) {
      var y = terrainY(x, z);
      for (var i = 0; i < 6; i++) {
        var a = (i / 6) * Math.PI * 2;
        var claw = new THREE.Mesh(
          new THREE.PlaneGeometry(0.42, isSandBlind ? 7.5 : 5.2),
          new THREE.MeshBasicMaterial({ color: isSandBlind ? 0xf6d365 : 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
        );
        claw.rotation.x = -Math.PI / 2;
        claw.rotation.z = a;
        claw.position.set(x + Math.sin(a) * 2.0, y + 0.11, z + Math.cos(a) * 2.0);
        scene.add(claw);
        FX_LIST.push({ mesh: claw, age: 0, dur: 0.85, kind: "fade" });
      }
      if (isSandBlind) {
        /* バンカー砂煙ドーム（目くらましスタン発動！） */
        var dome = new THREE.Mesh(
          new THREE.SphereGeometry(5.5, 18, 12),
          new THREE.MeshBasicMaterial({ color: 0xe8c987, transparent: true, opacity: 0.62, wireframe: false })
        );
        dome.position.set(x, y + 1.2, z);
        scene.add(dome);
        FX_LIST.push({ mesh: dome, age: 0, dur: 1.15, kind: "sand_dome" });
      }
    }

    function spawnHexRipple(x, z, colorHex) {
      var hex = new THREE.Mesh(
        new THREE.RingGeometry(0.45, 0.72, 6),
        new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85, side: THREE.DoubleSide })
      );
      hex.rotation.x = -Math.PI / 2;
      hex.position.set(x, terrainY(x, z) + 0.10, z);
      scene.add(hex);
      FX_LIST.push({ mesh: hex, age: 0, dur: 0.55, kind: "expand_hex" });
    }

    /* v4.16: 攻撃時の自動補正（パターン2・自動補正型）。
       発射の瞬間、プレイヤーの前方 ±60° の扇範囲内かつ検出圏内（クラブ射程の1.5倍）に
       未浄化の残影がいれば、一番近い残影の方向へ撃ち直す。キャラの向き自体は
       aimTurn で短時間（0.14秒）かけて回して追随させ、瞬間移動的な snap にしない。
       範囲内に敵がいない場合は従来どおり現在の向きへ真っ直ぐ撃つ（挙動不変）。
       操作方法・ダメージ等の数値は一切変更しない。 */
    var AIM_CONE_COS = 0.5; /* cos(60°): 前方±60° を補正範囲とする */
    var aimTurn = null; /* {from,to,t,dur} 向き直りの回転アニメーション状態 */
    function findAutoAimTarget(club) {
      var fx = Math.sin(player.rotY), fz = Math.cos(player.rotY);
      var detectR = club.range * 1.5;
      var best = null, bestD = Infinity;
      for (var i = 0; i < MOBS.length; i++) {
        var m = MOBS[i];
        if (m.purified) continue;
        var dx = m.x - player.x, dz = m.z - player.z;
        var d = Math.hypot(dx, dz);
        if (d < 0.5 || d > detectR) continue;
        var dot = (dx / d) * fx + (dz / d) * fz;
        if (dot < AIM_CONE_COS - 1e-9) continue;
        if (d < bestD) { bestD = d; best = { mob: m, ang: Math.atan2(dx, dz) }; }
      }
      return best;
    }

    /* 四神波動ショット発射！ */
    function fireWaveShot(chargeSec) {
      var gs = STATE.gearStats || {};
      var infiniteBall = (STATE.mode === "goat" || (gs.specials && gs.specials.yasakani_eternal));
      if (!infiniteBall && STATE.balls <= 0) {
        showToast("⚠ ボールが0球です！『[E] FORE!咆哮』で凌ぎつつ白い球を拾うか補給しよう！");
        playSfx("hurt");
        return;
      }
      if (!infiniteBall) {
        STATE.balls = Math.max(0, STATE.balls - 1);
        postToParent({ type: "goat:worldUpdate", addBalls: -1 });
        updateHudNumbers();
      }

      var lv = chargeSec >= 1.28 ? 3 : (chargeSec >= 0.58 ? 2 : 1);
      var mult = lv === 3 ? 2.15 : (lv === 2 ? 1.48 : 1.0);
      var club = FOUR_GOD_CLUBS[STATE.clubIdx];
      /* v4.16: 自動補正 — 範囲内に残影がいれば一番近い残影の方向を撃ち方向にし、
         キャラの向きは aimTurn（短時間回転）でその方向へ追随させる */
      var aimTarget = findAutoAimTarget(club);
      var shotAng = aimTarget ? aimTarget.ang : player.rotY;
      if (aimTarget) {
        aimTurn = { from: player.rotY, to: shotAng, t: 0, dur: 0.14 };
      }
      var dirX = Math.sin(shotAng), dirZ = Math.cos(shotAng);
      var startX = player.x + dirX * 0.9, startZ = player.z + dirZ * 0.9;
      var startY = terrainY(startX, startZ) + 1.05;

      /* スイングモーション＆反動シェイク */
      playerMesh.userData.armPivot.rotation.x = -1.35;
      camShake = Math.max(camShake, 0.14 * lv);
      if (lv === 3) skyUniforms.uFlash.value = 0.85;

      var isCrit = Math.random() * 100 < (12 + (gs.critRatePct || 0) + (lv === 3 ? 25 : 0));
      var dmg = Math.round(club.dmg * mult * (1 + (gs.distPct || 0) * 0.01) * (isCrit ? (gs.critMult || 1.35) : 1.0));

      /* ① 青龍ドライバー：3D二重螺旋ドラゴンビーム（クサナギ装備時は黒金青龍！） */
      if (STATE.clubIdx === 0) {
        playSfx("seiryu");
        var hasKusanagi = !!(gs.specials && gs.specials.kusanagi);
        var col = hasKusanagi ? 0xffcf48 : club.color;
        var grp = new THREE.Group();
        var core = new THREE.Mesh(new THREE.SphereGeometry(0.32 * (0.9 + lv * 0.2), 14, 12),
          new THREE.MeshBasicMaterial({ color: hasKusanagi ? 0xfff3b0 : 0xdff9fb }));
        var helix1 = new THREE.Mesh(new THREE.TorusGeometry(0.58 + lv * 0.14, 0.09, 8, 20),
          new THREE.MeshBasicMaterial({ color: col }));
        var helix2 = new THREE.Mesh(new THREE.TorusGeometry(0.58 + lv * 0.14, 0.08, 8, 20),
          new THREE.MeshBasicMaterial({ color: hasKusanagi ? 0x221a08 : 0x0abde3 }));
        helix2.rotation.y = Math.PI / 2;
        grp.add(core, helix1, helix2);
        grp.position.set(startX, startY, startZ);
        scene.add(grp);
        PROJECTILES.push({
          club: 0, lv: lv, mesh: grp, x: startX, y: startY, z: startZ,
          vx: dirX * club.speed, vy: 0, vz: dirZ * club.speed,
          rotY: shotAng, dist: 0, maxDist: club.range * (0.85 + lv * 0.22),
          dmg: dmg, isCrit: isCrit, pierce: true, hitMap: {}, color: col, stepAcc: 0
        });
      }
      /* ② 朱雀アイアン：オーロラ軌跡から炎の光羽が扇状に分裂飛翔 */
      else if (STATE.clubIdx === 1) {
        playSfx("suzaku");
        var featherCnt = lv === 3 ? 7 : (lv === 2 ? 5 : 3);
        for (var f = 0; f < featherCnt; f++) {
          var spread = (f - (featherCnt - 1) * 0.5) * 0.13;
          var ang = shotAng + spread;
          var fMesh = new THREE.Mesh(
            new THREE.ConeGeometry(0.22, 1.15, 6),
            new THREE.MeshBasicMaterial({ color: f % 2 === 0 ? 0xff5e57 : 0xffbe76 })
          );
          fMesh.rotation.x = Math.PI / 2;
          fMesh.position.set(startX, startY + 0.2, startZ);
          scene.add(fMesh);
          PROJECTILES.push({
            club: 1, lv: lv, mesh: fMesh, x: startX, y: startY + 0.2, z: startZ,
            vx: Math.sin(ang) * club.speed, vy: 2.5, vz: Math.cos(ang) * club.speed,
            rotY: ang, dist: 0, maxDist: club.range * (0.9 + lv * 0.15),
            dmg: Math.round(dmg * 0.72), isCrit: isCrit, pierce: false, hitMap: {}, color: 0xff5e57, stepAcc: 0
          });
        }
      }
      /* ③ 白虎ウェッジ：高弾道ロブ→着弾時に天からの垂直光柱＆虎爪地割れ（バンカーなら砂煙目くらまし！） */
      else if (STATE.clubIdx === 2) {
        playSfx("byakko");
        var fromBunker = isInBunker(player.x, player.z);
        var orb = new THREE.Mesh(
          new THREE.SphereGeometry(0.30, 14, 12),
          new THREE.MeshBasicMaterial({ color: fromBunker ? 0xf6d365 : 0xffffff })
        );
        orb.position.set(startX, startY + 0.3, startZ);
        scene.add(orb);
        var targetDist = (16 + lv * 6.5);
        var flightT = 0.72;
        PROJECTILES.push({
          club: 2, lv: lv, mesh: orb, x: startX, y: startY + 0.3, z: startZ,
          vx: dirX * (targetDist / flightT), vy: 11.5 + lv * 2.0, vz: dirZ * (targetDist / flightT),
          rotY: shotAng, dist: 0, maxDist: 99, age: 0, flightT: flightT,
          dmg: dmg, isCrit: isCrit, fromBunker: fromBunker, color: 0xffffff
        });
      }
      /* ④ 玄武パター：無音で地面を這う六角亀甲波紋（100%確定スタン＆隠密） */
      else {
        playSfx("genbu");
        var disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.42, 0.42, 0.14, 6),
          new THREE.MeshBasicMaterial({ color: 0x2ed573 })
        );
        disc.position.set(startX, terrainY(startX, startZ) + 0.22, startZ);
        scene.add(disc);
        PROJECTILES.push({
          club: 3, lv: lv, mesh: disc, x: startX, y: disc.position.y, z: startZ,
          vx: dirX * club.speed, vy: 0, vz: dirZ * club.speed,
          rotY: shotAng, dist: 0, maxDist: club.range * (0.9 + lv * 0.25),
          dmg: dmg, isCrit: isCrit, pierce: false, hitMap: {}, color: 0x2ed573, stepAcc: 0, stealth: true
        });
      }
    }

    /* 残影へのダメージ・スタン・浄化処理 */
    function damageMob(mob, dmg, opts) {
      if (mob.purified) return;
      opts = opts || {};
      mob.hp -= dmg;
      playSfx("hit");
      hitstopTimer = Math.max(hitstopTimer, 0.042);
      camShake = Math.max(camShake, opts.isCrit ? 0.32 : 0.16);

      if (opts.stunSec) {
        mob.stunTimer = Math.max(mob.stunTimer, opts.stunSec);
      }
      if (opts.blindSec) {
        mob.blindTimer = Math.max(mob.blindTimer, opts.blindSec);
        mob.stunTimer = Math.max(mob.stunTimer, opts.blindSec);
      }
      if (!opts.stealth) {
        mob.alerted = true;
      }

      /* ノックバック */
      var dx = mob.x - player.x, dz = mob.z - player.z;
      var len = Math.hypot(dx, dz) || 1;
      mob.x += (dx / len) * 1.35;
      mob.z += (dz / len) * 1.35;

      /* HPゲージ更新 */
      var ratio = Math.max(0, mob.hp / mob.maxHp);
      mob.hpFg.scale.x = Math.max(0.01, ratio);

      if (opts.isCrit) {
        showToast("⚡ 会心の一撃！ " + mob.name + " に " + dmg + " ダメージ！");
      }

      /* 浄化完了！ */
      if (mob.hp <= 0) {
        mob.hp = 0;
        mob.purified = true;
        applyMobVisualState(mob);
        playSfx("purify");
        spawnPillarFX(mob.x, mob.z, 0xffd875, 2.4, 16, 0.95);

        var gainTp = mob.cls === "大" ? 140 : (mob.cls === "中" ? 95 : 65);
        var gainGold = mob.cls === "大" ? 2200 : (mob.cls === "中" ? 1400 : 900);
        var gainBalls = 2;
        STATE.tp += gainTp;
        STATE.gold += gainGold;
        if (STATE.mode !== "goat") STATE.balls += gainBalls;

        showBanner("✨ 残影浄化 ― " + mob.name, "生気と色彩が蘇った！ +" + gainTp + "TP / +¥" + gainGold.toLocaleString() + " / 球+2");
        postToParent({
          type: "goat:worldUpdate",
          purifiedMobId: mob.id,
          addTp: gainTp,
          addGold: gainGold,
          addBalls: gainBalls,
          narrText: mob.name + "の残影が清められ、聖地に光が戻っていく。",
          narrRole: "male"
        });
        refreshPurificationAtmosphere();
      }
    }

    /* 緊急護身①：『FORE!（ファー！）』咆哮（周囲16mの残影を一斉スタン！ 球消費0） */
    function triggerForeRoar() {
      if (player.foreCd > 0) return;
      player.foreCd = 8.0;
      playSfx("fore");
      spawnPillarFX(player.x, player.z, 0xffd875, 6.5, 4.5, 0.65);
      camShake = 0.25;
      var hitCnt = 0;
      MOBS.forEach(function (m) {
        if (m.purified) return;
        if (Math.hypot(m.x - player.x, m.z - player.z) < 16.5) {
          m.stunTimer = Math.max(m.stunTimer, 3.8);
          hitCnt++;
        }
      });
      showBanner("📢 『FORE!!（ファー！！）』", hitCnt > 0 ? (hitCnt + "体の残影が咆哮に怯んで静止した！") : "聖地に警告の咆哮が響き渡った！");
    }

    /* 緊急護身②：近接プッシュ押し返し（周囲6.5mの残影を弾き飛ばす！ 球消費0） */
    function triggerClosePush() {
      if (player.pushCd > 0) return;
      player.pushCd = 2.5;
      playSfx("push");
      playerMesh.userData.armPivot.rotation.x = -1.2;
      spawnPillarFX(player.x, player.z, 0x5ce1e6, 3.8, 2.5, 0.4);
      MOBS.forEach(function (m) {
        if (m.purified) return;
        var dx = m.x - player.x, dz = m.z - player.z;
        var d = Math.hypot(dx, dz);
        if (d < 6.8) {
          var nx = dx / (d || 1), nz = dz / (d || 1);
          m.x += nx * 5.8;
          m.z += nz * 5.8;
          m.stunTimer = Math.max(m.stunTimer, 1.8);
          damageMob(m, 12, { stunSec: 1.8 });
        }
      });
    }

    /* =========================================================================
       第6部：ユニバーサル高速入力エンジン（Windows WASD/矢印/マウスクリック移動 ＆ スマホ360°スティック/地面タップ/ピンチズーム）
       ========================================================================= */
    var keys = {};
    var camYaw = 0, camPitch = 0.34, camDist = 11.5;
    var charging = false, chargeTime = 0;
    var activePromptLandmark = null;

    /* 高速ダッシュ制御（デフォルトで常時高速ON！ さらにShift/瞬速ボタンで超高速ブースト！） */
    var alwaysDash = true;
    var boostHeld = false;
    var dashBurstTimer = 0;
    var sprintDustAcc = 0;
    var stridePhase = 0;

    /* バーチャルアナログスティック状態（-1..1） */
    var stickVec = { x: 0, y: 0, mag: 0, active: false, pointerId: null };
    var floatStickState = { active: false, pointerId: null, ox: 0, oy: 0 };

    /* 地面クリック／タップ自動高速移動＆目的地3Dマーカー */
    var autoMove = { active: false, x: 0, z: 0, landmark: null };
    var raycaster = new THREE.Raycaster();
    var moveTargetGroup = (function createMoveTargetMarker() {
      var grp = new THREE.Group();
      var r1 = new THREE.Mesh(
        new THREE.RingGeometry(0.55, 0.82, 28),
        new THREE.MeshBasicMaterial({ color: 0x5ce1e6, side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
      );
      r1.rotation.x = -Math.PI / 2;
      r1.position.y = 0.12;
      var r2 = new THREE.Mesh(
        new THREE.RingGeometry(0.18, 0.34, 20),
        new THREE.MeshBasicMaterial({ color: 0xffd875, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
      );
      r2.rotation.x = -Math.PI / 2;
      r2.position.y = 0.14;
      var pin = new THREE.Mesh(
        new THREE.ConeGeometry(0.24, 0.85, 10),
        new THREE.MeshBasicMaterial({ color: 0xffd875, transparent: true, opacity: 0.85 })
      );
      pin.rotation.x = Math.PI;
      pin.position.y = 0.85;
      grp.add(r1, r2, pin);
      grp.visible = false;
      grp.userData = { r1: r1, pin: pin };
      scene.add(grp);
      return grp;
    })();

    function cancelAutoMove() {
      autoMove.active = false;
      autoMove.landmark = null;
      moveTargetGroup.visible = false;
    }

    function setAutoMoveTarget(wx, wz, lm) {
      var safe = nudgeOutOfPond(wx, wz, 1.8);
      autoMove.x = safe.x;
      autoMove.z = safe.z;
      autoMove.landmark = lm || null;
      autoMove.active = true;
      moveTargetGroup.position.set(safe.x, terrainY(safe.x, safe.z), safe.z);
      moveTargetGroup.visible = true;
    }

    function triggerDashBurst() {
      ensureAC();
      dashBurstTimer = 0.52;
      spawnHexRipple(player.x, player.z, 0x5ce1e6);
    }

    var dashToggleEl = document.getElementById("dashToggleBtn");
    dashToggleEl.onclick = function () {
      alwaysDash = !alwaysDash;
      dashToggleEl.classList.toggle("on", alwaysDash);
      dashToggleEl.textContent = alwaysDash ? "⚡ 常時高速: ON" : "🚶 常時高速: OFF";
      showToast(alwaysDash ? "⚡ 常時高速ダッシュ ON（27m/s 爽快移動！）" : "🚶 通常ランニング速度へ切り替えました");
    };

    var boostBtnEl = document.getElementById("boostStepBtn");
    boostBtnEl.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      boostHeld = true;
      boostBtnEl.classList.add("active");
      triggerDashBurst();
    });
    window.addEventListener("pointerup", function () {
      if (boostHeld) { boostHeld = false; boostBtnEl.classList.remove("active"); }
    });
    window.addEventListener("pointercancel", function () {
      if (boostHeld) { boostHeld = false; boostBtnEl.classList.remove("active"); }
    });

    function selectClub(idx) {
      STATE.clubIdx = idx;
      Array.prototype.forEach.call(document.querySelectorAll(".cslot"), function (b, i) {
        b.classList.toggle("active", i === idx);
      });
      document.getElementById("clubDesc").textContent = FOUR_GOD_CLUBS[idx].desc;
    }

    Array.prototype.forEach.call(document.querySelectorAll(".cslot"), function (b) {
      b.onclick = function () { selectClub(parseInt(b.getAttribute("data-club"), 10)); };
    });
    document.getElementById("btnFore").onclick = triggerForeRoar;
    document.getElementById("btnPush").onclick = triggerClosePush;
    document.getElementById("btnQSave").onclick = function () {
      postToParent({ type: "goat:quickSave" });
      showToast("💾 現在地をクイックセーブしました");
    };

    /* チャージ開始時にカメラ正面（または正面近くの未浄化残影）へスマート照準アシスト */
    function alignAimToCameraOrTarget() {
      var fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
      var bestAng = Math.atan2(fwdX, fwdZ);
      var bestScore = 999;
      for (var i = 0; i < MOBS.length; i++) {
        var m = MOBS[i];
        if (m.purified) continue;
        var dx = m.x - player.x, dz = m.z - player.z;
        var dist = Math.hypot(dx, dz);
        if (dist < 0.5 || dist > 38) continue;
        var dot = (dx / dist) * fwdX + (dz / dist) * fwdZ;
        if (dot > 0.84 && dist < bestScore) {
          bestScore = dist;
          bestAng = Math.atan2(dx, dz);
        }
      }
      player.rotY = bestAng;
    }

    function startCharge(pId) {
      if (STATE.paused || charging) return;
      ensureAC();
      aimTurn = null; /* v4.16: 前回の向き直り回転が残っていれば、照準合わせと競合しないよう打ち切る */
      alignAimToCameraOrTarget();
      charging = true;
      chargeTime = 0;
      chargingPointerId = (pId !== undefined) ? pId : null;
      document.getElementById("chargeHud").style.display = "block";
    }
    function releaseCharge() {
      if (!charging) return;
      charging = false;
      chargingPointerId = null;
      document.getElementById("chargeHud").style.display = "none";
      skyUniforms.uStorm.value = 0;
      chargeOrb.visible = false;
      chargeOrb.material.opacity = 0;
      fireWaveShot(chargeTime);
      chargeTime = 0;
    }
    var chargingPointerId = null;

    var cBtn = document.getElementById("chargeBtn");
    cBtn.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      startCharge(e.pointerId);
    });
    window.addEventListener("pointerup", function (e) {
      if (charging && (chargingPointerId === null || e.pointerId === chargingPointerId)) releaseCharge();
    });
    window.addEventListener("pointercancel", function (e) {
      if (charging && (chargingPointerId === null || e.pointerId === chargingPointerId)) releaseCharge();
    });

    /* ① 左下360°バーチャルアナログスティック（スマホ親指＆PCマウスドラッグ両対応・マルチタッチ分離） */
    var vStickBase = document.getElementById("vStickBase");
    var vStickKnob = document.getElementById("vStickKnob");

    function updateStickFromClientXY(cx, cy, rectCx, rectCy, maxR, knobEl) {
      var dx = cx - rectCx, dy = cy - rectCy;
      var dist = Math.hypot(dx, dy);
      var clamped = Math.min(maxR, dist);
      var nx = dist > 0.001 ? (dx / dist) : 0;
      var ny = dist > 0.001 ? (dy / dist) : 0;
      var mag = Math.min(1, dist / maxR);
      if (mag < 0.08) {
        stickVec.x = 0; stickVec.y = 0; stickVec.mag = 0;
      } else {
        stickVec.x = nx * mag;
        stickVec.y = ny * mag;
        stickVec.mag = mag;
        cancelAutoMove();
      }
      if (knobEl) {
        knobEl.style.transform = "translate(" + (nx * clamped).toFixed(1) + "px, " + (ny * clamped).toFixed(1) + "px)";
      }
    }

    function resetVirtualStick() {
      stickVec.x = 0; stickVec.y = 0; stickVec.mag = 0;
      stickVec.active = false; stickVec.pointerId = null;
      vStickBase.classList.remove("active");
      vStickKnob.style.transform = "translate(0px, 0px)";
    }

    vStickBase.addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      ensureAC();
      try { vStickBase.setPointerCapture(e.pointerId); } catch (err) { }
      stickVec.active = true;
      stickVec.pointerId = e.pointerId;
      vStickBase.classList.add("active");
      var r = vStickBase.getBoundingClientRect();
      updateStickFromClientXY(e.clientX, e.clientY, r.left + r.width * 0.5, r.top + r.height * 0.5, r.width * 0.38, vStickKnob);
    });
    vStickBase.addEventListener("pointermove", function (e) {
      if (!stickVec.active || e.pointerId !== stickVec.pointerId) return;
      e.preventDefault();
      var r = vStickBase.getBoundingClientRect();
      updateStickFromClientXY(e.clientX, e.clientY, r.left + r.width * 0.5, r.top + r.height * 0.5, r.width * 0.38, vStickKnob);
    });
    vStickBase.addEventListener("pointerup", function (e) {
      if (e.pointerId === stickVec.pointerId) resetVirtualStick();
    });
    vStickBase.addEventListener("pointercancel", function (e) {
      if (e.pointerId === stickVec.pointerId) resetVirtualStick();
    });

    /* ② 3Dキャンバス操作：マルチタッチ対応（左画面タッチ移動＋右画面カメラ回転＋2本指ピンチズーム＋地面クリック/タップ自動ダッシュ移動！） */
    var canvasPointers = {};
    var pinchPrevDist = 0;
    var floatStickEl = document.getElementById("floatStick");
    var floatStickKnobEl = document.getElementById("floatStickKnob");

    function activeCanvasPointerList() {
      var arr = [];
      for (var k in canvasPointers) {
        if (Object.prototype.hasOwnProperty.call(canvasPointers, k)) arr.push(canvasPointers[k]);
      }
      return arr;
    }
    /* v4.28 C-11: 毎フレームの呼び出し元は個数だけ使うため、配列を作らず数える版を用意する。 */
    function activeCanvasPointerCount() {
      var n = 0;
      for (var k in canvasPointers) {
        if (Object.prototype.hasOwnProperty.call(canvasPointers, k)) n++;
      }
      return n;
    }

    function handleTapToMove(clientX, clientY) {
      if (STATE.paused || !groundMesh) return;
      var rect = renderer.domElement.getBoundingClientRect();
      var ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      var ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
      var hits = raycaster.intersectObject(groundMesh, false);
      if (!hits || !hits.length) return;
      var pt = hits[0].point;

      /* 施設・祠・決戦の門の近くをタップ/クリックした場合は、そこへ高速自動移動して到着時に自動オープン！ */
      var pickedLM = null, bestLMD = 999;
      for (var i = 0; i < LANDMARKS.length; i++) {
        var lm = LANDMARKS[i];
        var d = Math.hypot(pt.x - lm.x, pt.z - lm.z);
        if (d < lm.r + 3.2 && d < bestLMD) {
          bestLMD = d;
          pickedLM = lm;
        }
      }
      if (pickedLM) {
        setAutoMoveTarget(pickedLM.x, pickedLM.z, pickedLM);
        showToast("🏃 『" + pickedLM.label + "』へ高速ダッシュ移動！");
      } else {
        setAutoMoveTarget(pt.x, pt.z, null);
      }
    }

    renderer.domElement.addEventListener("pointerdown", function (e) {
      ensureAC();
      if (e.button === 2) { startCharge(e.pointerId); return; }
      var isLeftTouchZone = (e.pointerType === "touch" && e.clientX < window.innerWidth * 0.43 && !stickVec.active && !floatStickState.active);
      canvasPointers[e.pointerId] = {
        id: e.pointerId,
        startX: e.clientX, startY: e.clientY,
        x: e.clientX, y: e.clientY,
        moved: 0,
        t0: performance.now(),
        role: isLeftTouchZone ? "left_touch" : "cam_or_tap",
        pointerType: e.pointerType
      };
      var list = activeCanvasPointerList();
      if (list.length === 2) {
        pinchPrevDist = Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
      }
    });

    window.addEventListener("contextmenu", function (e) { e.preventDefault(); });

    window.addEventListener("pointermove", function (e) {
      var p = canvasPointers[e.pointerId];
      if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      p.moved = Math.max(p.moved, Math.hypot(e.clientX - p.startX, e.clientY - p.startY));

      var list = activeCanvasPointerList();
      if (list.length >= 2) {
        /* 2本指ピンチズーム */
        var curDist = Math.hypot(list[0].x - list[1].x, list[0].y - list[1].y);
        if (pinchPrevDist > 10) {
          camDist = Math.max(6.5, Math.min(22, camDist - (curDist - pinchPrevDist) * 0.035));
        }
        pinchPrevDist = curDist;
        return;
      }

      /* スマホ左画面タッチドラッグ：どこを触ってもフローティング移動スティックとして即機能！ */
      if (p.role === "left_touch") {
        if (p.moved > 9) {
          if (!floatStickState.active) {
            floatStickState.active = true;
            floatStickState.pointerId = p.id;
            floatStickState.ox = p.startX;
            floatStickState.oy = p.startY;
            floatStickEl.style.left = p.startX + "px";
            floatStickEl.style.top = p.startY + "px";
            floatStickEl.style.display = "block";
          }
          updateStickFromClientXY(p.x, p.y, floatStickState.ox, floatStickState.oy, 44, floatStickKnobEl);
        }
        return;
      }

      /* カメラ視点ドラッグ回転 */
      if (p.moved > 4) {
        camYaw -= dx * 0.0065;
        camPitch = Math.max(0.12, Math.min(1.05, camPitch + dy * 0.005));
      }
    });

    function endCanvasPointer(e) {
      var p = canvasPointers[e.pointerId];
      if (!p) return;
      delete canvasPointers[e.pointerId];
      if (floatStickState.active && floatStickState.pointerId === e.pointerId) {
        floatStickState.active = false;
        floatStickState.pointerId = null;
        floatStickEl.style.display = "none";
        floatStickKnobEl.style.transform = "translate(0px, 0px)";
        if (!stickVec.active) { stickVec.x = 0; stickVec.y = 0; stickVec.mag = 0; }
        return;
      }
      /* ドラッグではなく素早いクリック／タップだった場合は、その地面または施設へ高速ダッシュ移動！ */
      if (e.type === "pointerup" && p.moved < 9 && (performance.now() - p.t0) < 360) {
        handleTapToMove(p.x, p.y);
      }
    }
    window.addEventListener("pointerup", endCanvasPointer);
    window.addEventListener("pointercancel", endCanvasPointer);

    window.addEventListener("wheel", function (e) {
      camDist = Math.max(6.5, Math.min(22, camDist + e.deltaY * 0.01));
    }, { passive: true });

    /* ③ 右下ミニマップのクリック／タップでその地点へ瞬間高速ワープ！ */
    /* v4.27 U-1: ミニマップの誤瞬移防止。pointerdown では位置だけ記録し、pointerup 時に
       移動量10px未満・600ms以内の「タップ」のときだけ瞬移する。ドラッグ（カメラ操作のつもりで
       ミニマップ上から動かし始めた場合）は瞬移しない。タップ時の挙動・座標計算は従来と同一。 */
    var _mmTap = null;
    document.getElementById("minimap").addEventListener("pointerdown", function (e) {
      e.preventDefault(); e.stopPropagation();
      ensureAC();
      _mmTap = { x: e.clientX, y: e.clientY, t: Date.now() };
    });
    document.getElementById("minimap").addEventListener("pointerup", function (e) {
      if (!_mmTap) return;
      var dx = e.clientX - _mmTap.x, dy = e.clientY - _mmTap.y, dtap = Date.now() - _mmTap.t;
      _mmTap = null;
      if (Math.hypot(dx, dy) > 10 || dtap > 600) return; /* ドラッグ／長押しは瞬移しない */
      var cv = document.getElementById("minimap");
      var r = cv.getBoundingClientRect();
      var px = ((e.clientX - r.left) / r.width) * cv.width;
      var pz = ((e.clientY - r.top) / r.height) * cv.height;
      var cx = cv.width * 0.5, cy = cv.height * 0.5;
      var sc = (cv.width * 0.46) / WORLD_R;
      var wx = (px - cx) / sc;
      var wz = (pz - cy) / sc;
      var safe = nudgeOutOfPond(wx, wz, 2.0);
      cancelAutoMove();
      player.x = safe.x;
      player.z = safe.z;
      spawnPillarFX(player.x, player.z, 0x5ce1e6, 2.4, 9, 0.45);
      showToast("⚡ ミニマップ瞬間移動！");
    });
    document.getElementById("minimap").addEventListener("pointercancel", function () { _mmTap = null; });

    /* ④ キーボード入力（Windows直接フォーカス時 ＆ 親フレーム index.html からの自動転送の両対応！） */
    function normalizeKeyTokens(code, key) {
      var list = [];
      if (code) list.push(code);
      if (key) {
        var lk = String(key).toLowerCase();
        if (lk === "w") list.push("KeyW");
        else if (lk === "a") list.push("KeyA");
        else if (lk === "s") list.push("KeyS");
        else if (lk === "d") list.push("KeyD");
        else if (lk === "e") list.push("KeyE");
        else if (lk === "f") list.push("KeyF");
        else if (lk === "q") list.push("KeyQ");
        else if (lk === "1") list.push("Digit1");
        else if (lk === "2") list.push("Digit2");
        else if (lk === "3") list.push("Digit3");
        else if (lk === "4") list.push("Digit4");
        else if (key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight") list.push(key);
        else if (key === "Shift") list.push("ShiftLeft");
        else if (key === " ") list.push("Space");
        else if (key === "Enter") list.push("Enter");
      }
      return list;
    }

    function handleUnifiedKey(code, key, isDown) {
      var tokens = normalizeKeyTokens(code, key);
      if (!isDown) {
        for (var u = 0; u < tokens.length; u++) {
          keys[tokens[u]] = false;
          if (tokens[u] === "Space" && charging) releaseCharge();
        }
        return;
      }
      if (STATE.paused) return;
      var wasShift = !!(keys["ShiftLeft"] || keys["ShiftRight"]);
      for (var i = 0; i < tokens.length; i++) {
        var tk = tokens[i];
        keys[tk] = true;
        if (tk === "Digit1") selectClub(0);
        else if (tk === "Digit2") selectClub(1);
        else if (tk === "Digit3") selectClub(2);
        else if (tk === "Digit4") selectClub(3);
        else if (tk === "KeyE") triggerForeRoar();
        else if (tk === "KeyF") triggerClosePush();
        else if (tk === "KeyQ") { postToParent({ type: "goat:quickSave" }); showToast("💾 クイックセーブ完了"); }
        else if (tk === "Space") { if (!charging) startCharge(null); }
        else if (tk === "Enter" && activePromptLandmark) { executeLandmarkAction(activePromptLandmark); }
        else if ((tk === "ShiftLeft" || tk === "ShiftRight") && !wasShift) { triggerDashBurst(); }
      }
    }

    window.addEventListener("keydown", function (e) {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "ArrowDown" || e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault();
      }
      handleUnifiedKey(e.code, e.key, true);
    });
    window.addEventListener("keyup", function (e) {
      handleUnifiedKey(e.code, e.key, false);
    });
    window.addEventListener("blur", function () {
      keys = {};
      if (stickVec.active) resetVirtualStick();
    });

    document.getElementById("interactPrompt").onclick = function () {
      if (activePromptLandmark) executeLandmarkAction(activePromptLandmark);
    };

    function executeLandmarkAction(lm) {
      if (!lm || !lm.action) return;
      var act = lm.action;
      if (act.type === "facility") {
        postToParent({ type: "goat:openFacility", facility: act.facility });
      } else if (act.type === "branch") {
        postToParent({ type: "goat:triggerBranch", eventKey: act.eventKey });
      } else if (act.type === "subtrial_hint") {
        if (STATE.subTrialDone) {
          showToast("✓ この聖地の神話試練はすでに制覇しています");
        } else {
          showBanner("⚡ 神話の試練", "池の上に浮かぶ蒼き結晶へ四神波動ショットを撃ち込め！");
        }
      } else if (act.type === "duel") {
        if (!isDuelGateOpen()) {
          showBanner("🔒 決戦の門は封印されている", "先に聖地の残影をあと " + (2 - countPurified()) + " 体浄化せよ！");
          playSfx("hurt");
          return;
        }
        postToParent({ type: "goat:toGolf" });
      } else if (act.type === "rival") {
        /* N3: ライバル遭遇。対戦への遷移は決戦の門と同一の goat:toGolf を使う
           （親側 startGolfBattle → getNextBattleTarget が rivalDefeated を見て
           ライバル戦を返すため、遭遇は既存フローの正式な入口になる） */
        handleRivalEncounter();
      } else if (act.type === "npcTalk") {
        /* N5: 住人との本格会話（常に二択の対話ループ。施設・進行・既存機能には触れない）。
           会話情報が無いランドマークの場合のみ、従来の一言バナーに落とす */
        if (act.talk) openNpcTalk(act.talk, lm);
        else showBanner(act.title, act.line);
      }
    }

    /* =========================================================================
       第7部：炎のパワーCanvas・運命の糸Canvas・ミニマップ描画・メインループ
       ========================================================================= */
    function updateHudNumbers() {
      document.getElementById("hudName").textContent = STATE.playerName;
      document.getElementById("hudRank").textContent = STATE.rankTitle;
      var gs = STATE.gearStats || {};
      var inf = (STATE.mode === "goat" || (gs.specials && gs.specials.yasakani_eternal));
      document.getElementById("ballNum").textContent = inf ? "∞" : STATE.balls;
      document.getElementById("pureNum").textContent = AREA_IDX === 5 ? "神域" : (countPurified() + "/" + MOBS.length);
      document.getElementById("goldNum").textContent = "¥" + (STATE.gold || 0).toLocaleString();
      document.getElementById("powerNum").textContent = Math.round(STATE.power) + "%";
      document.getElementById("mentalNum").textContent = Math.round(STATE.mental) + "%";
      document.getElementById("btnFore").disabled = player.foreCd > 0;
      document.getElementById("btnFore").textContent = player.foreCd > 0 ? ("[E] FORE!(" + Math.ceil(player.foreCd) + "s)") : "[E] 📢 FORE!咆哮";
    }

    var flameCv = document.getElementById("flameCanvas");
    var flameCtx = flameCv.getContext("2d");
    /* v4.27 P-W1/P-W2/P-W3: 毎フレームの生成物をキャッシュ／間引きするための変数。 */
    var _gaugeGrad = null, _gaugeGradBand = -1, _gaugeGradW = 0;
    var _lastMiniT = -1e9;
    var _camTarget = null; /* v4.27 P-W3: 初回使用時に生成（読み込み順に依存しないため） */
    /* v4.28 C-1/C-4/C-6/C-7/C-8/C-9: ミニマップ背景グラデーション・terrainY・チャージLv・神装オーラ色・プロンプト表示・脅威オーラのキャッシュ用変数。 */
    var _mmBgGrad = null, _mmBgGradW = 0, _mmBgGradH = 0;
    var _cachedT = 0, _cachedTX = null, _cachedTZ = null;
    var _lastChargeLv = -1, _sacredColKey = -1, _sacredHidden = false;
    var _lastPromptLM = undefined, _threatFar = false;
    var threadCv = document.getElementById("threadCanvas");
    var threadCtx = threadCv.getContext("2d");
    var miniCv = document.getElementById("minimap");
    var miniCtx = miniCv.getContext("2d");

    function renderGauges(t) {
      /* ① 炎のパワーゲージ（満タン時は静かな蒼金の炎、低下時は激しく揺れる紅蓮の炎） */
      var pw = Math.max(0, Math.min(100, STATE.power));
      var W = flameCv.width, H = flameCv.height;
      flameCtx.clearRect(0, 0, W, H);
      var fillW = (pw / 100) * W;
      var turb = pw >= 75 ? 1.8 : (pw >= 40 ? 3.6 : 6.5);
      /* v4.27 P-W1: グラデーションの色はパワー帯（75以上／40以上／それ未満）だけで決まるため、帯が変わったときだけ作り直して使い回す（毎フレームの生成をなくす。炎の波形は従来どおり毎フレーム描き直す）。 */
      var _band = pw >= 75 ? 2 : (pw >= 40 ? 1 : 0);
      if (_gaugeGradBand !== _band || !_gaugeGrad || _gaugeGradW !== W) {
        _gaugeGrad = flameCtx.createLinearGradient(0, 0, W, 0);
        if (_band === 2) {
          _gaugeGrad.addColorStop(0, "#1e90ff"); _gaugeGrad.addColorStop(0.55, "#5ce1e6"); _gaugeGrad.addColorStop(1, "#ffe57f");
        } else if (_band === 1) {
          _gaugeGrad.addColorStop(0, "#ff6b35"); _gaugeGrad.addColorStop(0.6, "#ffb142"); _gaugeGrad.addColorStop(1, "#fff275");
        } else {
          _gaugeGrad.addColorStop(0, "#8b0000"); _gaugeGrad.addColorStop(0.5, "#ff2e4c"); _gaugeGrad.addColorStop(1, "#ff9f43");
        }
        _gaugeGradBand = _band; _gaugeGradW = W;
      }
      var grad = _gaugeGrad;
      flameCtx.fillStyle = grad;
      flameCtx.beginPath();
      flameCtx.moveTo(0, H);
      for (var x = 0; x <= fillW; x += 6) {
        var waveY = 3 + Math.sin(x * 0.14 - t * 9) * turb * 0.45 + Math.cos(x * 0.27 + t * 13) * turb * 0.3;
        flameCtx.lineTo(x, Math.max(1, waveY));
      }
      flameCtx.lineTo(fillW, H);
      flameCtx.closePath();
      flameCtx.fill();

      /* ② 運命の糸メンタルゲージ（絹糸の光沢振動） */
      var mn = Math.max(0, Math.min(100, STATE.mental));
      var TW = threadCv.width, TH = threadCv.height;
      threadCtx.clearRect(0, 0, TW, TH);
      var mW = (mn / 100) * TW;
      for (var s = 0; s < 3; s++) {
        threadCtx.beginPath();
        for (var tx = 0; tx <= mW; tx += 8) {
          var ty = TH * 0.5 + Math.sin(tx * 0.08 + t * 5 + s * 1.5) * (1.5 + (100 - mn) * 0.03);
          if (tx === 0) threadCtx.moveTo(tx, ty); else threadCtx.lineTo(tx, ty);
        }
        threadCtx.strokeStyle = s === 0 ? "#e2d4ff" : (s === 1 ? "#a57dff" : "#5ce1e6");
        threadCtx.lineWidth = s === 0 ? 2.4 : 1.3;
        threadCtx.stroke();
      }
    }

    function renderMinimap() {
      /* アコーディア式エリアマップ（線刷新フェーズ1・ワールド側）:
         座標・スケール計算（cx, cy, sc）とマーカー位置は従来と完全同一（タップ瞬移の前提）。
         変えるのは描画スタイルのみで、対戦側ミニマップの作法に統一する:
         紙面=淡黄緑の放射グラデーション＋斜め刈り目 / 中央広場=フェアウェイ鮮緑＋フリンジ＋落影 /
         池=飽和青フラット＋赤点線PA / バンカー=純白＋土色の細縁 / 外周=OB白実線 /
         マーカー=白ハロー＋細縁のフラット注釈（凡例の紫・緑・黄・赤は維持） */
      var W = miniCv.width, H = miniCv.height, cx = W / 2, cy = H / 2, sc = (W * 0.46) / WORLD_R;
      miniCtx.clearRect(0, 0, W, H);
      miniCtx.lineJoin = "round"; miniCtx.lineCap = "round";

      /* 紙面（ラフ=淡黄緑）: 円盤にクリップして描く */
      miniCtx.save();
      miniCtx.beginPath(); miniCtx.arc(cx, cy, W * 0.48, 0, Math.PI * 2); miniCtx.clip();
      /* v4.28 C-1: 背景グラデーションは寸法が変わらない限り使い回す（P-W1 と同型。色・範囲は同一）。 */
      if (!_mmBgGrad || _mmBgGradW !== W || _mmBgGradH !== H) {
        _mmBgGrad = miniCtx.createRadialGradient(cx, H * 0.42, 6, cx, cy, W * 0.78);
        _mmBgGrad.addColorStop(0, "#dff29e");
        _mmBgGrad.addColorStop(0.65, "#c4e06a");
        _mmBgGrad.addColorStop(1, "#a9cc4e");
        _mmBgGradW = W; _mmBgGradH = H;
      }
      miniCtx.fillStyle = _mmBgGrad;
      miniCtx.fillRect(0, 0, W, H);
      /* ラフの斜め刈り目（ごく淡い2トーン。作法では刈り目はフェアウェイの表現のため紙面側は弱く） */
      for (var rs = -H, rk = 0; rs < W + H; rs += 11, rk++) {
        miniCtx.strokeStyle = (rk % 2 === 0) ? "rgba(255,255,255,0.06)" : "rgba(70,110,20,0.045)";
        miniCtx.lineWidth = 5.5;
        miniCtx.beginPath();
        miniCtx.moveTo(rs, 0);
        miniCtx.lineTo(rs + H * 0.55, H);
        miniCtx.stroke();
      }

      /* 中央広場=フェアウェイ（落影→フリンジ→鮮緑＋刈り目）。半径16は地形の平坦中央部（terrainY）に対応 */
      var plazaR = 16 * sc;
      miniCtx.fillStyle = "rgba(70,100,25,0.25)";
      miniCtx.beginPath(); miniCtx.arc(cx + 1.2, cy + 1.8, plazaR + 2.5, 0, Math.PI * 2); miniCtx.fill();
      miniCtx.fillStyle = "#93cf55";
      miniCtx.beginPath(); miniCtx.arc(cx, cy, plazaR + 2.5, 0, Math.PI * 2); miniCtx.fill();
      miniCtx.fillStyle = "#57b52b";
      miniCtx.beginPath(); miniCtx.arc(cx, cy, plazaR, 0, Math.PI * 2); miniCtx.fill();
      miniCtx.save();
      miniCtx.beginPath(); miniCtx.arc(cx, cy, plazaR, 0, Math.PI * 2); miniCtx.clip();
      for (var fs = cx - plazaR * 2, fk = 0; fs < cx + plazaR * 2; fs += 7, fk++) {
        miniCtx.strokeStyle = (fk % 2 === 0) ? "rgba(255,255,255,0.13)" : "rgba(18,92,12,0.13)";
        miniCtx.lineWidth = 3.5;
        miniCtx.beginPath();
        miniCtx.moveTo(fs, cy - plazaR - 2);
        miniCtx.lineTo(fs + (plazaR + 2) * 1.1, cy + plazaR + 2);
        miniCtx.stroke();
      }
      miniCtx.restore();

      /* 池（飽和青フラット＋赤点線PA） */
      PONDS.forEach(function (pd) {
        var pdx = cx + pd.x * sc, pdy = cy + pd.z * sc, pdr = pd.r * sc;
        miniCtx.fillStyle = "#2f7fe0";
        miniCtx.beginPath(); miniCtx.arc(pdx, pdy, pdr, 0, Math.PI * 2); miniCtx.fill();
        miniCtx.strokeStyle = "#e23b3b"; miniCtx.lineWidth = 1.4;
        miniCtx.setLineDash([2.5, 2.5]);
        miniCtx.beginPath(); miniCtx.arc(pdx, pdy, pdr + 1.5, 0, Math.PI * 2); miniCtx.stroke();
        miniCtx.setLineDash([]);
      });
      /* バンカー（純白＋土色の細縁） */
      BUNKERS.forEach(function (bk) {
        miniCtx.fillStyle = "#ffffff";
        miniCtx.beginPath(); miniCtx.arc(cx + bk.x * sc, cy + bk.z * sc, bk.r * sc, 0, Math.PI * 2); miniCtx.fill();
        miniCtx.strokeStyle = "rgba(196,158,102,0.95)"; miniCtx.lineWidth = 1.0; miniCtx.stroke();
      });

      /* 外周=OB白実線（ワールド境界 WORLD_R） */
      miniCtx.strokeStyle = "rgba(255,255,255,0.95)"; miniCtx.lineWidth = 2;
      miniCtx.beginPath(); miniCtx.arc(cx, cy, WORLD_R * sc, 0, Math.PI * 2); miniCtx.stroke();
      miniCtx.restore();

      /* 円盤の縁（白フチ＋細い濃緑） */
      miniCtx.strokeStyle = "#ffffff"; miniCtx.lineWidth = 2;
      miniCtx.beginPath(); miniCtx.arc(cx, cy, W * 0.48 - 1, 0, Math.PI * 2); miniCtx.stroke();
      miniCtx.strokeStyle = "rgba(23,83,15,0.55)"; miniCtx.lineWidth = 1;
      miniCtx.beginPath(); miniCtx.arc(cx, cy, W * 0.48 - 0.5, 0, Math.PI * 2); miniCtx.stroke();

      /* 方位注釈（北＝決戦の門の方角） */
      miniCtx.font = "bold 9px 'Noto Sans JP', sans-serif";
      miniCtx.textAlign = "center";
      miniCtx.fillStyle = "#17530f";
      miniCtx.fillText("N", cx, cy - W * 0.48 + 11);

      /* 注釈マーカー用ヘルパー（白ハロー＋細い濃縁で、明るい紙面でも判別できるように） */
      function haloDot(x, y, r, fill, edge) {
        miniCtx.fillStyle = "#ffffff";
        miniCtx.beginPath(); miniCtx.arc(x, y, r + 1.7, 0, Math.PI * 2); miniCtx.fill();
        miniCtx.fillStyle = fill;
        miniCtx.beginPath(); miniCtx.arc(x, y, r, 0, Math.PI * 2); miniCtx.fill();
        miniCtx.strokeStyle = edge; miniCtx.lineWidth = 0.9; miniCtx.stroke();
      }

      /* 施設・祠・決戦の門（門は菱形で区別。開=赤の塗り／閉=紫の中抜き・施設=金は従来どおり。v4.27 A-14: 色だけでなく形でも区別） */
      var _gateOpen = isDuelGateOpen(); /* v4.28 C-3: 門の開閉判定は1回の描画で1回だけ行う（描画中に値は変わらない）。 */
      LANDMARKS.forEach(function (lm) {
        var lx = cx + lm.x * sc, ly = cy + lm.z * sc;
        if (lm.isGate) {
          var gr = 5.2, gc = _gateOpen ? "#ff4d5a" : "#7c5295";
          miniCtx.fillStyle = "#ffffff";
          miniCtx.beginPath();
          miniCtx.moveTo(lx, ly - gr - 1.8); miniCtx.lineTo(lx + gr + 1.8, ly); miniCtx.lineTo(lx, ly + gr + 1.8); miniCtx.lineTo(lx - gr - 1.8, ly);
          miniCtx.closePath(); miniCtx.fill();
          miniCtx.beginPath();
          miniCtx.moveTo(lx, ly - gr); miniCtx.lineTo(lx + gr, ly); miniCtx.lineTo(lx, ly + gr); miniCtx.lineTo(lx - gr, ly);
          miniCtx.closePath();
          if (_gateOpen) {
            miniCtx.fillStyle = gc;
            miniCtx.fill();
            miniCtx.strokeStyle = "rgba(60,10,20,0.55)"; miniCtx.lineWidth = 0.9; miniCtx.stroke();
          } else {
            /* v4.27 A-14: 閉じた門は中抜きの菱形（白抜き＋紫の縁）にして、色だけでなく形でも開／閉を区別する。 */
            miniCtx.strokeStyle = gc; miniCtx.lineWidth = 1.8; miniCtx.stroke();
          }
        } else if (lm.isNpcTalk) {
          /* N4: 住人の会話マーカーはミニマップに描かない（施設の金ドットと混同させない） */
        } else if (lm.isRival) {
          /* N3: 好敵手は橙の菱形（未撃破）／仲間は緑の菱形。門（大菱形）と大きさで区別する */
          var rr2 = 4.0, rc2 = STATE.rivalDefeated ? "#44e587" : "#ff7847";
          miniCtx.fillStyle = "#ffffff";
          miniCtx.beginPath();
          miniCtx.moveTo(lx, ly - rr2 - 1.6); miniCtx.lineTo(lx + rr2 + 1.6, ly); miniCtx.lineTo(lx, ly + rr2 + 1.6); miniCtx.lineTo(lx - rr2 - 1.6, ly);
          miniCtx.closePath(); miniCtx.fill();
          miniCtx.fillStyle = rc2;
          miniCtx.beginPath();
          miniCtx.moveTo(lx, ly - rr2); miniCtx.lineTo(lx + rr2, ly); miniCtx.lineTo(lx, ly + rr2); miniCtx.lineTo(lx - rr2, ly);
          miniCtx.closePath(); miniCtx.fill();
          miniCtx.strokeStyle = "rgba(90,30,0,0.6)"; miniCtx.lineWidth = 0.9; miniCtx.stroke();
        } else {
          haloDot(lx, ly, 3.2, "#ffd875", "rgba(120,82,0,0.65)");
        }
      });

      /* 残影（未浄化：紫、浄化済：緑） */
      MOBS.forEach(function (m) {
        if (m.purified) haloDot(cx + m.x * sc, cy + m.z * sc, 3.0, "#44e587", "rgba(10,90,40,0.7)");
        else haloDot(cx + m.x * sc, cy + m.z * sc, 3.8, "#c56cf0", "rgba(74,20,110,0.7)");
      });

      /* 主人公と視線コーン */
      var px = cx + player.x * sc, pz = cy + player.z * sc;
      miniCtx.fillStyle = "rgba(255, 255, 255, 0.5)";
      miniCtx.beginPath();
      miniCtx.moveTo(px, pz);
      miniCtx.arc(px, pz, 13, Math.PI * 0.5 - player.rotY - 0.42, Math.PI * 0.5 - player.rotY + 0.42);
      miniCtx.closePath();
      miniCtx.fill();
      miniCtx.strokeStyle = "rgba(23,83,15,0.5)"; miniCtx.lineWidth = 1; miniCtx.stroke();

      miniCtx.fillStyle = "#ffffff";
      miniCtx.beginPath(); miniCtx.arc(px, pz, 4.0, 0, Math.PI * 2); miniCtx.fill();
      miniCtx.strokeStyle = "#17530f"; miniCtx.lineWidth = 1.6; miniCtx.stroke();
      miniCtx.fillStyle = "#17530f";
      miniCtx.beginPath(); miniCtx.arc(px, pz, 1.5, 0, Math.PI * 2); miniCtx.fill();
    }

    /* メインゲームループ */
    var clock = new THREE.Clock();
    var elapsed = 0;

    function animate() {
      requestAnimationFrame(animate);
      try{ /* v4.10 A2: フレーム本体を包み失敗を記録するだけ。例外時は従来どおり後続を実行せず抜ける（RAFは冒頭で予約済みのため継続する） */
      var dt = Math.min(0.05, clock.getDelta());
      if (STATE.paused || document.hidden) {
        window.__goatDiagLoopOk("worldAnimate");
        return; /* v4.5: 対戦中・非表示中は描画自体を止め、GPU/帯域を対戦側へ譲る（状態は保持され復帰は即時） */
      }
      if (hitstopTimer > 0) {
        hitstopTimer -= dt;
        renderer.render(scene, camera);
        window.__goatDiagLoopOk("worldAnimate");
        return;
      }

      elapsed += dt;
      waterUniforms.uTime.value = elapsed;
      if (skyUniforms.uFlash.value > 0) skyUniforms.uFlash.value = Math.max(0, skyUniforms.uFlash.value - dt * 2.8);

      if (player.hurtCd > 0) player.hurtCd = Math.max(0, player.hurtCd - dt);
      if (player.foreCd > 0) {
        player.foreCd = Math.max(0, player.foreCd - dt);
        if (player.foreCd === 0) updateHudNumbers();
      }
      if (player.pushCd > 0) player.pushCd = Math.max(0, player.pushCd - dt);

      /* スイング腕の自然復帰 */
      var armP = playerMesh.userData.armPivot;
      armP.rotation.x += (0 - armP.rotation.x) * Math.min(1, dt * 10);

      /* 神装オーラ演出 */
      var gs = STATE.gearStats || {};
      if (gs.setGodComplete || gs.setThree || gs.setOlympus) {
        sacredAuraRing.visible = true;
        sacredAuraRing.material.opacity = 0.52 + Math.sin(elapsed * 4) * 0.18;
        /* v4.28 C-7: オーラの色は神装セットの組み合わせが変わったときだけ設定する。 */
        var _scKey = gs.setGodComplete ? 1 : 0;
        if (_scKey !== _sacredColKey) { _sacredColKey = _scKey; sacredAuraRing.material.color.setHex(_scKey ? 0x5ce1e6 : 0xffd875); }
        sacredAuraRing.rotation.z = elapsed * 1.4;
        _sacredHidden = false;
      } else {
        sacredAuraRing.visible = false;
        if (!_sacredHidden) { sacredAuraRing.material.opacity = 0; _sacredHidden = true; }
      }

      /* 波動チャージ3段階演出（カメラドリーイン＋Lv3暗雲雷鳴） */
      var targetFov = 52;
      if (charging) {
        chargeTime += dt;
        var pct = Math.min(100, (chargeTime / 1.35) * 100);
        if(_elChargeFill) _elChargeFill.style.width = pct + "%";
        var lv = chargeTime >= 1.28 ? 3 : (chargeTime >= 0.58 ? 2 : 1);
        var lvEl = _elChargeLv;
        /* v4.28 C-6: Lv 表示とチャージ球の色は Lv が変わったときだけ書き込む（表示・色は同一）。 */
        if (lv !== _lastChargeLv) {
          _lastChargeLv = lv;
          if(lvEl){
            lvEl.textContent = lv === 3 ? "Lv.3 MAX（神威覚醒！）" : ("Lv." + lv);
            lvEl.style.color = lv === 3 ? "#ff6b81" : (lv === 2 ? "#ffd875" : "#5ce1e6");
          }
          chargeOrb.material.color.setHex(lv === 3 ? 0xffd875 : (lv === 2 ? 0x7ee8fa : 0x48dbfb));
        }

        chargeOrb.visible = true;
        chargeOrb.material.opacity = 0.45 + lv * 0.18;
        chargeOrb.scale.setScalar(0.8 + Math.sin(elapsed * 22) * 0.18 + lv * 0.35);

        targetFov = lv === 3 ? 44 : (lv === 2 ? 48 : 50.5);
        skyUniforms.uStorm.value += ((lv === 3 ? 0.85 : (lv === 2 ? 0.25 : 0)) - skyUniforms.uStorm.value) * dt * 4;
        if (lv === 3 && Math.random() < 0.05) skyUniforms.uFlash.value = 0.55;
      } else {
        _lastChargeLv = -1; /* v4.28 C-6: チャージ終了時は Lv キャッシュをリセットする（次のチャージで表示を書き直すため）。 */
        skyUniforms.uStorm.value += (0 - skyUniforms.uStorm.value) * dt * 5;
      }
      /* v4.24 C-6: FOVの変化がしきい値（0.01°）以上のときだけ射影行列を更新する */
      var _newFov = camera.fov + (targetFov - camera.fov) * Math.min(1, dt * 7);
      if(Math.abs(_newFov - camera.fov) > 0.01){ camera.fov = _newFov; camera.updateProjectionMatrix(); }

      /* WASD・矢印・360°バーチャルスティック・地面タップ自動ダッシュ統合高速移動エンジン */
      if (dashBurstTimer > 0) dashBurstTimer = Math.max(0, dashBurstTimer - dt);

      var kbX = (keys["KeyD"] || keys["ArrowRight"] ? 1 : 0) - (keys["KeyA"] || keys["ArrowLeft"] ? 1 : 0);
      var kbZ = (keys["KeyS"] || keys["ArrowDown"] ? 1 : 0) - (keys["KeyW"] || keys["ArrowUp"] ? 1 : 0);
      var inX = kbX + stickVec.x;
      var inZ = kbZ + stickVec.y;
      var manualMag = Math.hypot(inX, inZ);

      if (manualMag > 0.05) {
        if (autoMove.active) cancelAutoMove();
      }

      var moveWorldX = 0, moveWorldZ = 0, activeSpeedRatio = 0;
      var isTurbo = !!(keys["ShiftLeft"] || keys["ShiftRight"] || boostHeld || dashBurstTimer > 0);
      var baseRunSpd = alwaysDash ? 27.0 : 17.5;
      var maxSpd = baseRunSpd * (isTurbo ? 1.32 : 1.0) * (1 + (gs.walkSpdPct || 0) * 0.008) * (charging ? 0.78 : 1.0);
      if (dashBurstTimer > 0) maxSpd = Math.max(maxSpd, 37.5);
      if (isInBunker(player.x, player.z)) maxSpd *= 0.84;

      if (manualMag > 0.05) {
        var normScale = Math.min(1, manualMag);
        var dirInX = inX / manualMag, dirInZ = inZ / manualMag;
        var fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
        var rgtX = Math.cos(camYaw), rgtZ = -Math.sin(camYaw);
        moveWorldX = (fwdX * (-dirInZ) + rgtX * dirInX) * maxSpd * normScale;
        moveWorldZ = (fwdZ * (-dirInZ) + rgtZ * dirInX) * maxSpd * normScale;
        activeSpeedRatio = normScale * (alwaysDash || isTurbo ? 1.25 : 0.85);

        /* スティック／横移動時、カメラをドラッグしていなければ緩やかに背後へオート追従して片手操作を快適化 */
        if (activeCanvasPointerCount() === 0 && (stickVec.mag > 0.15 || floatStickState.active)) {
          camYaw -= dirInX * 0.95 * normScale * dt;
        }
      } else if (autoMove.active) {
        /* 地面クリック／タップ目的地への自動高速スプリント（池自動迂回つき！） */
        var adx = autoMove.x - player.x, adz = autoMove.z - player.z;
        var adist = Math.hypot(adx, adz);
        var stopR = autoMove.landmark ? Math.max(1.4, autoMove.landmark.r - 0.8) : 0.75;
        if (adist <= stopR) {
          var arrivedLM = autoMove.landmark;
          cancelAutoMove();
          if (arrivedLM) executeLandmarkAction(arrivedLM);
        } else {
          var ux = adx / adist, uz = adz / adist;
          /* 前方に池がある場合は接線方向へスマートに迂回して池ポチャを防止 */
          var lookX = player.x + ux * 2.6, lookZ = player.z + uz * 2.6;
          for (var piP = 0; piP < PONDS.length; piP++) {
            var pdA = PONDS[piP];
            var pdxA = lookX - pdA.x, pdzA = lookZ - pdA.z;
            var pDistA = Math.hypot(pdxA, pdzA);
            if (pDistA < pdA.r + 1.5) {
              var txA = -pdzA / (pDistA || 1), tzA = pdxA / (pDistA || 1);
              if (txA * ux + tzA * uz < 0) { txA = -txA; tzA = -tzA; }
              ux = txA; uz = tzA;
              break;
            }
          }
          var autoSpd = Math.min(maxSpd * 1.06, Math.max(10, adist * 6.5));
          moveWorldX = ux * autoSpd;
          moveWorldZ = uz * autoSpd;
          activeSpeedRatio = 1.25;
        }
      }

      /* 目的地3Dリングの脈動アニメーション */
      if (moveTargetGroup.visible) {
        var pulseS = 1.0 + Math.sin(elapsed * 8) * 0.16;
        moveTargetGroup.userData.r1.scale.set(pulseS, pulseS, 1);
        moveTargetGroup.userData.pin.position.y = 0.85 + Math.sin(elapsed * 7) * 0.18;
        moveTargetGroup.rotation.y = elapsed * 2.5;
      }

      /* 慣性ゼロのキビキビした加減速補間 */
      player.vx += (moveWorldX - player.vx) * Math.min(1, dt * 20);
      player.vz += (moveWorldZ - player.vz) * Math.min(1, dt * 20);
      var curSpd = Math.hypot(player.vx, player.vz);

      if (curSpd > 0.25) {
        var nx = player.x + player.vx * dt, nz = player.z + player.vz * dt;

        /* 池ポチャ判定（1球ロスト＆岸へ安全復帰／ヤサカニ・GOATならロスト無効！） */
        if (isInPond(nx, nz)) {
          cancelAutoMove();
          playSfx("splash");
          var infBall = (STATE.mode === "goat" || (gs.specials && gs.specials.yasakani_eternal));
          if (infBall) {
            showToast("🔮 ヤサカニの水上加護！ ボールロスト無効で岸へ戻った");
          } else if (STATE.balls > 0) {
            STATE.balls = Math.max(0, STATE.balls - 1);
            postToParent({ type: "goat:worldUpdate", addBalls: -1 });
            updateHudNumbers();
            showToast("💧 池ポチャ！ ボールを1球ロストした……");
          }
          var safeShore = nudgeOutOfPond(player.x - player.vx * dt * 1.5, player.z - player.vz * dt * 1.5, 1.8);
          player.x = safeShore.x;
          player.z = safeShore.z;
          player.vx = 0; player.vz = 0;
        } else {
          var distC = Math.hypot(nx, nz);
          if (distC > WORLD_R - 3) {
            nx *= (WORLD_R - 3) / distC;
            nz *= (WORLD_R - 3) / distC;
          }
          player.x = nx; player.z = nz;
        }
        if (!charging) {
          player.rotY = Math.atan2(player.vx, player.vz);
        }

        /* 高速走行ストライド脚アニメーション ＆ 疾走風エフェクト */
        stridePhase += dt * (8 + curSpd * 0.58);
        var legSwing = Math.sin(stridePhase) * Math.min(0.82, 0.25 + curSpd * 0.022);
        var pLegs = playerMesh.userData.legs;
        if (pLegs && pLegs.length === 2) {
          pLegs[0].rotation.x = legSwing;
          pLegs[1].rotation.x = -legSwing;
        }
        if (!charging) {
          armP.rotation.x = -legSwing * 0.55;
        }
        if (!charging && curSpd > 22) {
          /* v4.28 C-5: FOV の変化が 0.01°未満なら射影行列の更新を省く（v4.24 C-6 と同型。収束値は同一）。 */
          var _nf = camera.fov + (56.2 - camera.fov) * Math.min(1, dt * 6);
          if (Math.abs(_nf - camera.fov) > 0.01) { camera.fov = _nf; camera.updateProjectionMatrix(); }
          sprintDustAcc += curSpd * dt;
          if (sprintDustAcc > 7.5) {
            sprintDustAcc = 0;
            spawnGroundGroove(player.x, player.z, player.rotY, isTurbo ? 0x5ce1e6 : 0xffd875);
          }
        }
      } else {
        player.vx = 0; player.vz = 0;
        var pLegsIdle = playerMesh.userData.legs;
        if (pLegsIdle && pLegsIdle.length === 2) {
          pLegsIdle[0].rotation.x *= Math.max(0, 1 - dt * 14);
          pLegsIdle[1].rotation.x *= Math.max(0, 1 - dt * 14);
        }
      }

      /* v4.16: 自動補正の向き直り（0.14秒の短時間回転で撃ち方向へ追随）。
         移動で操舵している間はそちらを優先し、回転アニメーションは打ち切る。 */
      if (aimTurn) {
        if (curSpd > 0.25) {
          aimTurn = null;
        } else {
          aimTurn.t += dt;
          var ak = Math.min(1, aimTurn.t / aimTurn.dur);
          var ae = 1 - Math.pow(1 - ak, 3);
          var adiff = ((aimTurn.to - aimTurn.from + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          player.rotY = aimTurn.from + adiff * ae;
          if (ak >= 1) { player.rotY = aimTurn.to; aimTurn = null; }
        }
      }

      var bobY = curSpd > 0.5 ? Math.abs(Math.sin(stridePhase)) * 0.09 : 0;
      /* v4.28 C-4: このフレームの terrainY を覚えておき、カメラ側の計算で流用する（位置が変わっていれば再計算するため値は同一）。 */
      _cachedT = terrainY(player.x, player.z); _cachedTX = player.x; _cachedTZ = player.z;
      playerMesh.position.set(player.x, _cachedT + bobY, player.z);
      playerMesh.rotation.y = player.rotY;

      /* フィールド拾得ボール回収＆リスポーン */
      for (var _pki = 0; _pki < PICKUPS.length; _pki++) {
        var pk = PICKUPS[_pki];
        if (pk.active) {
          pk.mesh.rotation.y = elapsed * 2.2;
          if ((pk.x - player.x) * (pk.x - player.x) + (pk.z - player.z) * (pk.z - player.z) < 3.4225) { /* v4.29 P-5: 1.85 の二乗（半径との比較だけのため平方根をやめる） */
            pk.active = false;
            pk.respawn = 18.0;
            pk.mesh.visible = false;
            playSfx("pickup");
            if (STATE.mode !== "goat") {
              STATE.balls += 2;
              postToParent({ type: "goat:worldUpdate", addBalls: 2 });
            }
            updateHudNumbers();
            showToast("⚪ ツアーボール +2球 を拾得！");
          }
        } else {
          pk.respawn -= dt;
          if (pk.respawn <= 0) { pk.active = true; pk.mesh.visible = true; }
        }
      } /* v4.29 P-4: forEach → for（毎フレームのコールバック生成をやめる。処理内容・順序は同一） */

      /* 飛翔中の四神波動弾更新 ＆ 神話試練クリスタル命中判定 */
      for (var pi = PROJECTILES.length - 1; pi >= 0; pi--) {
        var p = PROJECTILES[pi];
        var stepD = Math.hypot(p.vx * dt, p.vz * dt);
        p.x += p.vx * dt;
        p.z += p.vz * dt;
        p.dist += stepD;
        p.stepAcc = (p.stepAcc || 0) + stepD;

        if (p.club === 0) {
          p.y = terrainY(p.x, p.z) + 1.05;
          p.mesh.rotation.z += dt * 16;
          p.mesh.rotation.x += dt * 12;
          if (p.stepAcc > 1.8) { p.stepAcc = 0; spawnGroundGroove(p.x, p.z, p.rotY, p.color); }
        } else if (p.club === 1) {
          p.vy -= 5.2 * dt;
          p.y = Math.max(terrainY(p.x, p.z) + 0.65, p.y + p.vy * dt);
          /* 最寄りの未浄化残影へゆるやかに誘導（光羽ホーミング） */
          var bestM = null, bestD = 14;
          for (var mi = 0; mi < MOBS.length; mi++) {
            if (MOBS[mi].purified) continue;
            var dm = Math.hypot(MOBS[mi].x - p.x, MOBS[mi].z - p.z);
            if (dm < bestD) { bestD = dm; bestM = MOBS[mi]; }
          }
          if (bestM) {
            var tx = bestM.x - p.x, tz = bestM.z - p.z, tl = Math.hypot(tx, tz) || 1;
            p.vx += (tx / tl) * 26 * dt;
            p.vz += (tz / tl) * 26 * dt;
          }
          p.mesh.lookAt(p.x + p.vx, p.y, p.z + p.vz);
        } else if (p.club === 2) {
          p.age += dt;
          p.vy -= 28 * dt;
          p.y += p.vy * dt;
          var gy = terrainY(p.x, p.z);
          if (p.y <= gy + 0.25 || p.age >= p.flightT) {
            /* 白虎着弾：天からの垂直光柱＋虎爪地割れ（バンカーなら砂煙目くらまし！） */
            playSfx("byakko_land");
            var sandBlind = p.fromBunker || isInBunker(p.x, p.z);
            spawnPillarFX(p.x, p.z, sandBlind ? 0xf6d365 : 0xffffff, 3.2 + p.lv * 0.8, 22, 0.75);
            spawnTigerClaws(p.x, p.z, sandBlind);
            var aoeR = (sandBlind ? 10.5 : 5.8) + p.lv * 1.2; var aoeR2 = aoeR * aoeR; /* v4.30 P-8: AoE 判定を二乗比較化する（aoeR は常に正で実距離は判定以外に使われないため <= のまま同一。aoeR2 はループ外で 1回だけ計算） */
            for (var _aoei = 0; _aoei < MOBS.length; _aoei++) {
              var m = MOBS[_aoei];
              if (!m.purified && (m.x - p.x) * (m.x - p.x) + (m.z - p.z) * (m.z - p.z) <= aoeR2) {
                damageMob(m, p.dmg, { isCrit: p.isCrit, stunSec: sandBlind ? 5.0 : 1.5, blindSec: sandBlind ? 5.0 : 0 });
              }
            } /* v4.29 P-4: forEach → for（処理内容・順序は同一） */
            if (sandBlind) showToast("🌪 白虎・バンカー砂煙目くらまし発動！（周囲5秒スタン）");
            checkSubTrialCrystalHit(p.x, gy + 2, p.z, 6.5);
            scene.remove(p.mesh);
            _disposeFxObj(p.mesh); /* v4.15: 波動弾の除去時に解放（蓄積の修正） */
            PROJECTILES.splice(pi, 1);
            continue;
          }
        } else if (p.club === 3) {
          p.y = terrainY(p.x, p.z) + 0.22;
          p.mesh.rotation.y += dt * 8;
          if (p.stepAcc > 2.2) { p.stepAcc = 0; spawnHexRipple(p.x, p.z, 0x2ed573); }
        }

        p.mesh.position.set(p.x, p.y, p.z);

        /* 神話の試練クリスタルへの命中判定 */
        if (checkSubTrialCrystalHit(p.x, p.y, p.z, 2.8) && !p.pierce) {
          scene.remove(p.mesh);
          _disposeFxObj(p.mesh); /* v4.15: 波動弾の除去時に解放（蓄積の修正） */
          PROJECTILES.splice(pi, 1);
          continue;
        }

        /* 残影との衝突判定（青龍・朱雀・玄武） */
        if (p.club !== 2) {
          var removeProj = false;
          for (var mj = 0; mj < MOBS.length; mj++) {
            var mob = MOBS[mj];
            if (mob.purified || p.hitMap[mob.id]) continue;
            if ((mob.x - p.x) * (mob.x - p.x) + (mob.z - p.z) * (mob.z - p.z) < 2.4025) { /* v4.29 P-5: 1.55 の二乗（半径との比較だけのため平方根をやめる） */
              p.hitMap[mob.id] = true;
              if (p.club === 0 && (p.lv === 3 || p.isCrit)) {
                spawnPillarFX(mob.x, mob.z, p.color, 1.8, 18, 0.55);
              }
              damageMob(mob, p.dmg, {
                isCrit: p.isCrit,
                stunSec: p.club === 3 ? 4.5 : (p.lv === 3 ? 1.4 : 0.4),
                stealth: !!p.stealth
              });
              if (p.club === 3) showToast("🐢 玄武・隠密確定スタン！（4.5秒静止）");
              if (!p.pierce) { removeProj = true; break; }
            }
          }
          if (removeProj || p.dist >= p.maxDist) {
            scene.remove(p.mesh);
            _disposeFxObj(p.mesh); /* v4.15: 波動弾の除去時に解放（蓄積の修正） */
            PROJECTILES.splice(pi, 1);
          }
        }
      }

      /* 残影AI更新 ＆ 画面端の黒紫脅威オーラ更新 */
      var nearestThreat = 999;
      var detectBase = (gs.specials && gs.specials.hades_stealth) ? 8.5 : 14.5; // ハデスの隠れ兜で感知距離激減！
      for (var idx = 0; idx < MOBS.length; idx++) {
        var m = MOBS[idx];
        if (m.purified) {
          /* 浄化済みのゴルファーは穏やかに素振り練習をする */
          m.mesh.userData.armPivot.rotation.x = Math.sin(elapsed * 2.2 + idx) * 0.45;
          continue;
        }
        var dx = player.x - m.x, dz = player.z - m.z;
        var dist = Math.hypot(dx, dz);
        if (dist < nearestThreat) nearestThreat = dist;

        m.miasma.rotation.z = elapsed * 2.5;
        m.hpBg.lookAt(camera.position);
        m.hpFg.lookAt(camera.position);

        if (m.stunTimer > 0) {
          m.stunTimer = Math.max(0, m.stunTimer - dt);
          m.mesh.rotation.y += dt * 7; // スタン中ふらつき演出
          continue;
        }

        if (dist < detectBase || m.alerted) {
          if (dist > 26) m.alerted = false;
          var spdM = m.cls === "大" ? 4.6 : (m.cls === "中" ? 5.2 : 5.8);
          var nxM = m.x + (dx / (dist || 1)) * spdM * dt;
          var nzM = m.z + (dz / (dist || 1)) * spdM * dt;
          if (!isInPond(nxM, nzM)) {
            m.x = nxM; m.z = nzM;
          }
          m.rotY = Math.atan2(dx, dz);
          m.mesh.userData.armPivot.rotation.x = Math.sin(elapsed * 9 + idx) * 0.65;

          /* 主人公への接触ダメージ（炎パワー減少／GOATモードは無敵！） */
          if (dist < 1.35 && player.hurtCd <= 0) {
            player.hurtCd = 1.25;
            if (STATE.mode !== "goat") {
              playSfx("hurt");
              STATE.power = Math.max(10, STATE.power - (m.cls === "大" ? 12 : 8));
              postToParent({ type: "goat:worldUpdate", power: STATE.power });
              updateHudNumbers();
              var hf = _elHurtFlash;
              if(hf){
                hf.style.opacity = "1";
                setTimeout(function () { hf.style.opacity = "0"; }, 180);
              }
            }
          }
        } else {
          /* 巡回 */
          var patrolX = m.homeX + Math.sin(elapsed * 0.7 + idx * 1.7) * 3.5;
          var patrolZ = m.homeZ + Math.cos(elapsed * 0.6 + idx * 1.7) * 3.5;
          var pdx = patrolX - m.x, pdz = patrolZ - m.z, pdist = Math.hypot(pdx, pdz);
          if (pdist > 0.2) {
            m.x += (pdx / pdist) * 1.8 * dt;
            m.z += (pdz / pdist) * 1.8 * dt;
            m.rotY = Math.atan2(pdx, pdz);
          }
        }
        m.mesh.position.set(m.x, terrainY(m.x, m.z), m.z);
        m.mesh.rotation.y = m.rotY;
      } /* v4.29 P-4: forEach → for（処理内容・順序は同一） */

      var auraEl = _elThreatAura;
      if(auraEl){
        if (nearestThreat < detectBase + 2) {
          var pulse = 0.45 + 0.35 * Math.sin(elapsed * 7);
          auraEl.style.opacity = String(Math.min(0.92, (1 - nearestThreat / (detectBase + 3)) * 1.25 * pulse + 0.2));
          _threatFar = false;
        } else {
          /* v4.28 C-9: 遠いときの opacity "0" は初回だけ書き込む。 */
          if (!_threatFar) { auraEl.style.opacity = "0"; _threatFar = true; }
        }
      }

      /* エフェクト寿命更新 */
      for (var fi = FX_LIST.length - 1; fi >= 0; fi--) {
        var fx = FX_LIST[fi];
        fx.age += dt;
        var k = fx.age / fx.dur;
        if (k >= 1) {
          scene.remove(fx.mesh);
          _disposeFxObj(fx.mesh); /* v4.15: FXの除去時に解放（蓄積の修正） */
          FX_LIST.splice(fi, 1);
          continue;
        }
        fx.mesh.material.opacity = (1 - k) * 0.85;
        if (fx.kind === "pillar") {
          fx.mesh.scale.set(1 + k * 0.5, 1, 1 + k * 0.5);
        } else if (fx.kind === "expand_ring" || fx.kind === "expand_hex") {
          var s = 1 + k * 4.2;
          fx.mesh.scale.set(s, s, 1);
        } else if (fx.kind === "sand_dome") {
          var sd = 0.5 + k * 1.6;
          fx.mesh.scale.set(sd, sd * 0.7, sd);
        }
      }

      /* ランドマーク結晶アニメーション＆接触プロンプト判定 */
      var foundLM = null;
      for (var _lmi = 0; _lmi < LANDMARKS.length; _lmi++) {
        var lm = LANDMARKS[_lmi];
        if (lm.crystal) {
          lm.crystal.rotation.y = elapsed * 1.8;
          lm.crystal.position.y = 2.1 + Math.sin(elapsed * 2.6 + lm.x) * 0.22;
        }
        if (lm.r > 0 && (lm.x - player.x) * (lm.x - player.x) + (lm.z - player.z) * (lm.z - player.z) < lm.r * lm.r) { /* v4.29 P-5: 半径との比較だけのため二乗比較にする */
          foundLM = lm;
        }
      } /* v4.29 P-4: forEach → for（処理内容・順序は同一） */
      activePromptLandmark = foundLM;
      var prEl = _elInteractPrompt;
      /* v4.28 C-8: プロンプトの表示・文言は対象ランドマークが変わったときだけ書き込む（表示内容は同一）。 */
      if (foundLM !== _lastPromptLM) {
        _lastPromptLM = foundLM;
        if (foundLM) {
          if(prEl) prEl.style.display = "block";
          if(_elPromptLabel) _elPromptLabel.textContent = foundLM.label;
        } else {
          if(prEl) prEl.style.display = "none";
        }
      }

      /* N3: ライバルNPCの毎フレーム更新（idle再生・プレイヤーへの向き直り・名前ラベル） */
      updateRivalNpc(dt, elapsed);
      /* N4: 住人NPCの毎フレーム更新（歩行・役割NPCのidle再生と向き直り・立ちNPCの微揺れ） */
      updateTownNpcs(dt, elapsed);

      if (subTrialTargetMesh && subTrialTargetMesh.visible) {
        subTrialTargetMesh.rotation.y = elapsed * 2.4;
        if (_subTrialBaseY === null) _subTrialBaseY = terrainY(26, -18);
        subTrialTargetMesh.position.y = _subTrialBaseY + 3.4 + Math.sin(elapsed * 3) * 0.35;
      }
      for (var _cri = 0; _cri < celestialRings.length; _cri++) { celestialRings[_cri].rotation.z = elapsed * (0.12 + _cri * 0.08); } /* v4.29 P-4: forEach → for（処理内容・順序は同一） */

      /* 環境粒子の舞い */
      var pArr = envParticles.geometry.attributes.position;
      /* v4.28 C-10: 位置配列へ直接アクセスする（get/set メソッド呼び出しをなくす。粒子の動きは同一）。 */
      var pData = pArr.array;
      for (var ei = 0; ei < pArr.count; ei++) {
        var i3 = ei * 3;
        var py = pData[i3 + 1] - dt * 0.75;
        var pxE = pData[i3] + Math.sin(elapsed + ei) * dt * 0.4;
        if (py < 0.5) py = 20;
        pData[i3 + 1] = py;
        pData[i3] = pxE;
      }
      pArr.needsUpdate = true;

      /* 3人称カメラ追従＋インパクトシェイク */
      var shakeX = 0, shakeY = 0;
      if (camShake > 0) {
        shakeX = (Math.random() - 0.5) * camShake;
        shakeY = (Math.random() - 0.5) * camShake;
        camShake = Math.max(0, camShake - dt * 1.8);
      }
      var pyTerrain = (player.x === _cachedTX && player.z === _cachedTZ) ? _cachedT : terrainY(player.x, player.z);
      var cxCam = player.x + Math.sin(camYaw) * Math.cos(camPitch) * camDist + shakeX;
      var cyCam = pyTerrain + 1.8 + Math.sin(camPitch) * camDist + shakeY;
      var czCam = player.z + Math.cos(camYaw) * Math.cos(camPitch) * camDist;
      cyCam = Math.max(terrainY(cxCam, czCam) + 1.2, cyCam);
      if (!_camTarget) _camTarget = new THREE.Vector3();
      _camTarget.set(cxCam, cyCam, czCam);
      camera.position.lerp(_camTarget, Math.min(1, dt * 14)); /* v4.27 P-W3: 一時ベクトルを使い回す（毎フレームの new をなくす） */
      camera.lookAt(player.x, pyTerrain + 1.45, player.z);

      renderGauges(elapsed);
      /* v4.27 P-W2: ミニマップは約15Hzに間引く（156pxの地図では最高速でも1更新2px未満のため見た目は変わらない。タップ瞬移の座標計算は描画と独立）。 */
      if (elapsed - _lastMiniT >= 0.066) { _lastMiniT = elapsed; renderMinimap(); }
      renderer.render(scene, camera);
      window.__goatDiagLoopOk("worldAnimate");
      }catch(e){ window.__goatDiagLoopErr("worldAnimate", e); }
    }

    function checkSubTrialCrystalHit(x, y, z, hitR) {
      if (!subTrialTargetMesh || !subTrialTargetMesh.visible || STATE.subTrialDone) return false;
      var tp = subTrialTargetMesh.position;
      if (Math.hypot(tp.x - x, tp.z - z) < hitR) {
        STATE.subTrialDone = true;
        subTrialTargetMesh.visible = false;
        if (subTrialTargetMesh.userData.beam) subTrialTargetMesh.userData.beam.visible = false;
        playSfx("purify");
        spawnPillarFX(tp.x, tp.z, 0x5ce1e6, 4.2, 24, 1.2);
        showBanner("⚡ 神話の試練 達成！！", "池上の神話結晶を射抜いた！");
        postToParent({ type: "goat:subTrialWin" });
        return true;
      }
      return false;
    }

    /* 親フレーム（index.html）との通信ブリッジ */
    function postToParent(msg) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(msg, "*");
      }
    }

    /* v4.5: 文書破棄時に WebGL を明示解放し、遷移ピークの GPU メモリを下げる */
    window.addEventListener("pagehide", function () {
      try { if (renderer) { if (renderer.forceContextLoss) renderer.forceContextLoss(); try { renderer.dispose(); } catch (e2) {} } } catch (e) {}
    });

    window.addEventListener("message", function (ev) {
      var d = ev.data;
      if (!d || typeof d !== "object") return;
 if (d.type === "goat:pause") { STATE.paused = true; keys = {}; resetVirtualStick(); try { postToParent({ type: "goat:worldPos", x: player.x, z: player.z});} catch (e) {} return;}
      if (d.type === "goat:resume") { STATE.paused = false; startAmbient(); return; }
      if (d.type === "goat:key") { handleUnifiedKey(d.code, d.key, !!d.down); return; }
      if (d.type === "goat:syncState") {
        STATE.mode = d.mode || STATE.mode;
        STATE.playerName = d.playerName || STATE.playerName;
        if (d.rank && d.rank.title) STATE.rankTitle = d.rank.title + " (" + d.rank.hc + ")";
        if (typeof d.power === "number") STATE.power = d.power;
        if (typeof d.mental === "number") STATE.mental = d.mental;
        if (typeof d.balls === "number") STATE.balls = d.balls;
        /* LAYOUT FIX v4.0（③GOATは全ステータス常時フル：同期で受けてもフルを維持する） */
        if (STATE.mode === "goat") { STATE.power = 100; STATE.mental = 100; STATE.balls = 999; }
        if (typeof d.gold === "number") STATE.gold = d.gold;
        if (typeof d.tp === "number") STATE.tp = d.tp;
        if (d.gearStats) STATE.gearStats = d.gearStats;
        STATE.subTrialDone = !!d.subTrialDone;
        /* v4.1（項目7）: エリアボス撃破済みなら「天岩戸の光が戻った」状態として大気を完全浄化側へ */
        STATE.bossDefeated = !!d.bossDefeated;
        /* N3: ライバル遭遇（このエリアのライバルと撃破状態を保持し、NPC表示へ反映する） */
        STATE.rivalId = (typeof d.rivalId === "string") ? d.rivalId : null;
        STATE.rivalDefeated = !!d.rivalDefeated;
        STATE.nextTarget = d.nextTarget || null;
        refreshRivalNpc();
        townOnSyncRoles(); /* N4: 役割住人は主人公・ライバルが判明したこの時点で確定する */
        refreshPurificationAtmosphere();
        if (subTrialTargetMesh) {
          subTrialTargetMesh.visible = !STATE.subTrialDone;
          if (subTrialTargetMesh.userData.beam) subTrialTargetMesh.userData.beam.visible = !STATE.subTrialDone;
        }
        spawnAreaMobs(d.areaMobs, d.purifiedMobs);
        updateHudNumbers();
      }
    });

    window.addEventListener("resize", function () {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    /* =========================================================================
       N3: ライバル遭遇（ワールド上に好敵手が実体で立ち、近づくと声かけ→対戦へ）
       - 配置・状態は親（index.html）の goat:syncState が持つ rivalId／rivalDefeated を
         唯一の正とし、ワールド側は表示と導線だけを担う（進行ロジックは親に集約）。
       - 対戦への遷移は決戦の門と同一の goat:toGolf を使う。親の getNextBattleTarget が
         rivalDefeated=false の間はライバル戦を返すため、遭遇は既存フローの正式な入口。
       - モデルは対戦側（N2 CharStage）と同一の圧縮GLB＋KTX2 基盤をワールド向けに移植。
         このエリアのライバル1体だけを読み込み、不要時は traverse して確実に破棄する。
       ========================================================================= */
    var RIVAL_POS = { x: -5.6, z: -46.2 }; /* 決戦の門（0,-52）手前の参道西脇。建物列は |x|>=6.6、門の除外円 (0,-52,r8) の内側で、他テーマの小物（灯籠・糸杉・塔）とも重ならない位置 */
    var RIVAL_WORLD_SCALE = { Watu: 1.02, Matuya: 1.05, TIiger: 1.07, Junbo: 1.06, McIlro: 1.10, DeCham: 1.09 };
    var RIVAL_CHAR_KEY = { Watu: "watu", Matuya: "matuya", TIiger: "tiiger", Junbo: "junbo", McIlro: "mcilro", DeCham: "decham" };
    var RIVAL_LINES = {
      Watu:   { challenge: "「待っていたぞ。神の遊戯を人に授けたこの俺を、まずゴルフで越えてみせよ！」", ally: "「ははっ、いい目覚めだ。これからは俺もお前の味方だ。困ったら声をかけな。」" },
      Matuya: { challenge: "「……来たか。闇に囚われたこの身を、ゴルフで解き放ってみせよ。」", ally: "「……目が覚めた。静かに、しかし確かに――これからはお前の側に立つ。」" },
      TIiger: { challenge: "「フン、挑戦者か。絶対王者の牙城、1ホールで崩せるものなら崩してみせよ！」", ally: "「……悪くない目覚めだ。次に狙う獲物は、共に仕留めよう。」" },
      Junbo:  { challenge: "「おう、来たな！ 地の帝王の豪快なゴルフ、身をもって味わうがいい！」", ally: "「がはは、目が覚めたわい！ ここからは俺の飛距離もお前の武器だ。」" },
      McIlro: { challenge: "「やあ、待っていたよ。北の空を貫く一打、受け止められるかい？」", ally: "「清々しい朝だね。ここからは、同じ空の下で戦おう。」" },
      DeCham: { challenge: "「計算済みだ。君の勝率は――まあ、ゴルフは理論どおりにいかないから面白い。かかってきたまえ。」", ally: "「……データが書き換わった。これからは君の味方として計算するよ。」" }
    };
    var rivalNpc = null; /* { charId, defeated, group, mixer, idleAction, ready, failed, label, labelKind, yaw, gen } */
    var rivalLandmark = null;
    var rivalLoader = null, rivalLoaderErr = null;
    var rivalDialogOpen = false;

    function rivalLog() { try { console.log.apply(console, ["[GOAT-N3]"].concat([].slice.call(arguments))); } catch (e) {} }

    function initRivalLoader(cb) {
      if (rivalLoader || rivalLoaderErr) { cb(rivalLoader); return; }
      import("three/addons/loaders/KTX2Loader.js").then(function (mod) {
        try {
          var ktx2 = new mod.KTX2Loader();
          ktx2.setTranscoderPath("assets/lib/r180/addons/libs/basis/");
          ktx2.detectSupport(renderer);
          rivalLoader = new THREE.GLTFLoader();
          rivalLoader.setKTX2Loader(ktx2);
          if (window.MeshoptDecoder) rivalLoader.setMeshoptDecoder(window.MeshoptDecoder);
          rivalLog("loader ready");
        } catch (e) { rivalLoaderErr = String(e && e.message || e); rivalLog("loader init failed", rivalLoaderErr); }
        cb(rivalLoader);
      }).catch(function (e) { rivalLoaderErr = String(e && e.message || e); rivalLog("KTX2Loader import failed", rivalLoaderErr); cb(null); });
    }

    function disposeRivalNpc() {
      if (!rivalNpc) return;
      var npc = rivalNpc; rivalNpc = null;
      try { if (npc.mixer) npc.mixer.stopAllAction(); } catch (e) {}
      if (npc.group) {
        scene.remove(npc.group);
        npc.group.traverse(function (o) {
          if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} }
          if (o.material) {
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach(function (m) {
              for (var k in m) { var v = m[k]; if (v && v.isTexture) { try { v.dispose(); } catch (e) {} } }
              try { m.dispose(); } catch (e) {}
            });
          }
        });
      }
      if (npc.label) {
        scene.remove(npc.label);
        if (npc.label.material) {
          if (npc.label.material.map) { try { npc.label.material.map.dispose(); } catch (e) {} }
          try { npc.label.material.dispose(); } catch (e) {}
        }
      }
    }

    function makeRivalLabel(charId, defeated) {
      var cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
      var cx2 = cv.getContext("2d");
      cx2.fillStyle = defeated ? "rgba(10,42,24,0.88)" : "rgba(46,14,8,0.88)";
      var bw = 452, bh = 74, bx = (512 - bw) / 2, by = (128 - bh) / 2;
      cx2.beginPath();
      if (cx2.roundRect) cx2.roundRect(bx, by, bw, bh, 20); else cx2.rect(bx, by, bw, bh);
      cx2.fill();
      cx2.lineWidth = 5; cx2.strokeStyle = defeated ? "#44e587" : "#ff7847"; cx2.stroke();
      cx2.font = "900 44px 'Noto Sans JP', sans-serif";
      cx2.textAlign = "center"; cx2.textBaseline = "middle";
      cx2.fillStyle = "#ffffff";
      cx2.fillText(defeated ? (charId + "（仲間）") : ("⚔ " + charId), 256, 66);
      var tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(3.6, 0.9, 1);
      sp.renderOrder = 20;
      return sp;
    }

    function refreshRivalLabel() {
      if (!rivalNpc || !rivalNpc.group) return;
      var kind = rivalNpc.defeated ? "ally" : "rival";
      if (rivalNpc.labelKind === kind && rivalNpc.label) return;
      if (rivalNpc.label) {
        rivalNpc.group.remove(rivalNpc.label);
        if (rivalNpc.label.material) {
          if (rivalNpc.label.material.map) { try { rivalNpc.label.material.map.dispose(); } catch (e) {} }
          try { rivalNpc.label.material.dispose(); } catch (e) {}
        }
        rivalNpc.label = null;
      }
      var sp = makeRivalLabel(rivalNpc.charId, rivalNpc.defeated);
      sp.position.y = (rivalNpc.headY || 2.6) + 0.62;
      rivalNpc.group.add(sp);
      rivalNpc.label = sp;
      rivalNpc.labelKind = kind;
    }

    function refreshRivalLandmarkLabel() {
      if (!rivalLandmark || !rivalNpc) return;
      rivalLandmark.label = rivalNpc.defeated
        ? ("💬 " + rivalNpc.charId + "（仲間）と話す")
        : ("⚔ 好敵手 " + rivalNpc.charId + " に声をかける");
      _lastPromptLM = null; /* 表示中でも文言を即時更新させる */
    }

    /* syncState のたびに呼ばれる。状態が変わったときだけ実作業をする（冪等） */
    function refreshRivalNpc() {
      var charId = (AREA_IDX <= 4) ? (STATE.rivalId || null) : null;
      var defeated = !!STATE.rivalDefeated;
      if (!charId) {
        if (rivalNpc) { disposeRivalNpc(); }
        if (rivalLandmark) {
          var li = LANDMARKS.indexOf(rivalLandmark);
          if (li >= 0) LANDMARKS.splice(li, 1);
          rivalLandmark = null;
        }
        return;
      }
      if (!rivalLandmark) {
        rivalLandmark = { x: RIVAL_POS.x, z: RIVAL_POS.z, r: 3.6, label: "", color: 0xff7847, isRival: true, action: { type: "rival" } };
        LANDMARKS.push(rivalLandmark);
      }
      if (rivalNpc && rivalNpc.charId === charId) {
        if (rivalNpc.defeated !== defeated) {
          rivalNpc.defeated = defeated;
          refreshRivalLabel();
          refreshRivalLandmarkLabel();
        }
        return;
      }
      disposeRivalNpc();
      var npc = {
        charId: charId, defeated: defeated, group: new THREE.Group(),
        mixer: null, idleAction: null, ready: false, failed: false,
        label: null, labelKind: null, headY: 2.6, yaw: 0, gen: 0
      };
      npc.group.position.set(RIVAL_POS.x, terrainY(RIVAL_POS.x, RIVAL_POS.z), RIVAL_POS.z);
      scene.add(npc.group);
      rivalNpc = npc;
      refreshRivalLandmarkLabel();
      var key = RIVAL_CHAR_KEY[charId];
      if (!key) { npc.failed = true; return; }
      initRivalLoader(function (loader) {
        if (!loader) { if (rivalNpc === npc) npc.failed = true; return; }
        loader.loadAsync("assets/chars/" + key + ".glb?v=N10").then(function (gltf) {
          if (rivalNpc !== npc) { /* 読み込み中に状態が変わった場合は破棄して捨てる */
            gltf.scene.traverse(function (o) { if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} } });
            return;
          }
          var model = gltf.scene;
          /* N2 で実証済みの透け対処（不透明化＋alphaTest）を同一に適用 */
          model.traverse(function (o) {
            if (o.isMesh) {
              o.castShadow = true; o.receiveShadow = false;
              var mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach(function (m) { m.transparent = false; m.depthWrite = true; m.alphaTest = 0.35; m.needsUpdate = true; });
            }
          });
          /* 身長キャリブレーション: ワールドの主人公メッシュ実測に体格比で一致させる */
          var mb = new THREE.Box3().setFromObject(model);
          var modelH = Math.max(0.01, mb.max.y - mb.min.y);
          var pb = new THREE.Box3().setFromObject(playerMesh);
          var playerH = Math.max(0.01, pb.max.y - pb.min.y);
          var ratio = (RIVAL_WORLD_SCALE[charId] || 1.05) / (RIVAL_WORLD_SCALE[CHAR_ID] || 1.05);
          var s = (playerH * ratio) / modelH;
          npc.group.scale.setScalar(s);
          npc.headY = modelH;
          npc.group.add(model);
          npc.mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach(function (a) { if (a.name === "idle") npc.idleAction = npc.mixer.clipAction(a); });
          if (npc.idleAction) { npc.idleAction.setLoop(THREE.LoopRepeat, Infinity); npc.idleAction.play(); }
          npc.ready = true;
          refreshRivalLabel();
          rivalLog("rival ready:", charId, "scale", s.toFixed(3));
        }).catch(function (e) {
          if (rivalNpc === npc) { npc.failed = true; rivalLog("rival load FAILED:", charId, e && e.message); }
        });
      });
    }

    function updateRivalNpc(dt, elapsed) {
      if (!rivalNpc || !rivalNpc.group) return;
      if (rivalNpc.mixer && rivalNpc.ready) rivalNpc.mixer.update(dt);
      /* 近づいたらプレイヤーの方を向く（声かけ演出）。遠ければ参道の南（広場側）を向く */
      var dx = player.x - RIVAL_POS.x, dz = player.z - RIVAL_POS.z;
      var dist = Math.hypot(dx, dz);
      var targetYaw = (dist < 14) ? Math.atan2(dx, dz) : 0;
      var diff = targetYaw - rivalNpc.yaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rivalNpc.yaw += diff * Math.min(1, dt * 3.2);
      rivalNpc.group.rotation.y = rivalNpc.yaw;
      /* 名前ラベルは「姿が見える距離」だけ表示する */
      if (rivalNpc.label) rivalNpc.label.visible = dist < 34;
    }

    function openRivalChoice() {
      var npc = rivalNpc; if (!npc) return;
      var lines = RIVAL_LINES[npc.charId] || RIVAL_LINES.Watu;
      var nt = STATE.nextTarget;
      document.getElementById("rcName").textContent = "⚔ 好敵手 " + npc.charId;
      document.getElementById("rcLine").textContent = lines.challenge;
      document.getElementById("rcCond").textContent = (nt && nt.kind === "rival")
        ? ("対戦条件： " + (nt.holes || 1) + "ホールマッチ ＠ " + (nt.courseName || "") + "／" + (nt.title || ""))
        : "対戦条件： 1ホールマッチ（同点はショットポイント→残りパワーで決着）";
      document.getElementById("rivalChoice").style.display = "block";
      rivalDialogOpen = true;
      STATE.paused = true; /* 選択中はワールドを止める（親モーダル表示時と同じ作法） */
    }
    function closeRivalChoice(resume) {
      document.getElementById("rivalChoice").style.display = "none";
      rivalDialogOpen = false;
      if (resume) STATE.paused = false;
    }
    document.getElementById("rcFight").onclick = function () {
      if (!rivalDialogOpen) return;
      closeRivalChoice(false); /* 対戦へ移行するので親側の pause 制御に委ねる */
      STATE.paused = false;
      postToParent({ type: "goat:toGolf" });
    };
    document.getElementById("rcLeave").onclick = function () {
      if (!rivalDialogOpen) return;
      closeRivalChoice(true);
      showToast("対戦をやめておいた（いつでも声をかけられる）");
    };

    function handleRivalEncounter() {
      if (rivalDialogOpen) return;
      if (!rivalNpc || !STATE.rivalId) return;
      var lines = RIVAL_LINES[rivalNpc.charId] || RIVAL_LINES.Watu;
      if (STATE.rivalDefeated) {
        /* 勝利後：その場に仲間として残り、再戦は始まらない（設計書 §4.4 の推奨案） */
        showBanner("💬 " + rivalNpc.charId + "（仲間）", lines.ally);
        return;
      }
      if (!isDuelGateOpen()) {
        /* 進行ゲートは決戦の門と同一条件に揃える（浄化2体 or GOAT/神域） */
        showBanner("🔒 " + rivalNpc.charId + " はまだ本気を出していない", "「まずは聖地の残影を浄化してから来い」――先に残影をあと " + Math.max(0, 2 - countPurified()) + " 体浄化せよ！");
        playSfx("hurt");
        return;
      }
      openRivalChoice();
    }

    /* 文書破棄時はライバルGLB資産も明示破棄する（エリア移動・対戦遷移での残留防止） */
    window.addEventListener("pagehide", function () { try { disposeRivalNpc(); } catch (e) {} });

    /* 検証・診断用ハンドル（N2 の __GOATN2 と同型） */
    window.__GOATN3 = {
      get rivalId() { return rivalNpc ? rivalNpc.charId : null; },
      get defeated() { return !!STATE.rivalDefeated; },
      get ready() { return !!(rivalNpc && rivalNpc.ready); },
      get failed() { return !!(rivalNpc && rivalNpc.failed); },
      get dialogOpen() { return rivalDialogOpen; },
      pos: RIVAL_POS
    };

    /* =========================================================================
       N4: 住人NPC（設計書 visibility_design_v1.md 第3章・併用案C）
       - 役割住人（クラブハウス受付／プロショップ店員）は主人公級GLB（案A）:
         主人公・そのエリアのライバルと重ならないキャラを使い、ポロ（PoloRed）と
         キャップ（CapMat）の色を差し替えて別人化する。idle 再生＋名前ラベル付き。
       - それ以外の住人（19番の客・立ち話ペア・通行人・モイライ）は手続き生成の
         簡易モデル（案B）: 頂点カラーで色分けした部品を1ジオメトリへ結合し、
         立ち=1ドローコール、歩行=3ドローコール（胴＋両脚）に抑える。
       - 配置は全エリア共通レイアウト（町の造りが共通のため）＋エリア別パレット。
         人数は 1エリア 11人（神域は10人）、延べ65人。
       - 読み込みは現在のエリア分だけ。pagehide で全資産を traverse dispose する。
       - 施設ビーコン・ショップ等の既存機能には触れない。会話は npcTalk
         ランドマークによるバナー表示のみ（施設の入口は従来どおりビーコン）。
       ========================================================================= */
    var townNpcs = [];       /* 全NPC（kind: role/guest/moirai/pair/walker） */
    var townRoles = [];      /* GLB役割NPC */
    var townWalkers = [];    /* 歩行NPC */
    var townLandmarks = [];  /* 会話ランドマーク */
    var townGeos = [];       /* 破棄対象（結合ジオメトリ） */
    var townRolesSpawned = false;
    var townSyncSeen = false;
    var townDisposed = false;
    var townVillagerMat = null;

    function townLog() { try { console.log.apply(console, ["[GOAT-N4]"].concat([].slice.call(arguments))); } catch (e) {} }
    function townSeeded(seed) { var s = seed >>> 0; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
    function townYawTo(x, z, tx, tz) { return Math.atan2(tx - x, tz - z); }
    function townMat() {
      if (!townVillagerMat) townVillagerMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
      return townVillagerMat;
    }

    var TOWN_SKINS = [0xf2c8a2, 0xeab98e, 0xe0ac82, 0xc98d64, 0x9c6b43, 0x8d5b36];
    var TOWN_HAIRS = [0x2a2320, 0x4a3728, 0x6e5136, 0x8a8d94, 0xd8d3c8, 0x1c1c22];
    /* エリア別パレット（主人公6人の勝負服＝白/赤ポロ＋黒パンツ等の組み合わせは含めない） */
    var TOWN_PALETTES = [
      { shirts: [0x3b4a6b, 0x707a52, 0x8a5a3b, 0x5d4a68, 0x7a3b3b, 0x46655e], pants: [0x2e3138, 0x4a4038, 0x5b5346, 0x37414f], hats: [0x2a2f45, 0x6b4a2f, 0x44503c, 0x30343e] }, /* 0 京都 */
      { shirts: [0x51643c, 0x7a86a0, 0xa08b62, 0x74586a, 0x4a5d7a, 0x8c6d4f], pants: [0x3a3f4a, 0x5a5148, 0x474f42, 0x2f3540], hats: [0x8a4a16, 0x3c4656, 0x6e5136, 0x2e3138] }, /* 1 パリ */
      { shirts: [0xa8542f, 0x74552e, 0x5f7050, 0x8a6a42, 0x94422e, 0x606a7a], pants: [0x4a3a2c, 0x3c3630, 0x59503f, 0x2e3138], hats: [0x7e3c20, 0x4a3421, 0x596250, 0x30343e] }, /* 2 ローマ */
      { shirts: [0x3c5a78, 0x8e3324, 0x707a52, 0xc0a062, 0x4a4e57, 0x7a4a5e], pants: [0x2c3e50, 0x4a4038, 0x3a3f4a, 0x59503f], hats: [0xb22234, 0x2a2f45, 0xd8d3c8, 0x5a4632] }, /* 3 アメリカ */
      { shirts: [0x2f3a52, 0x55504a, 0x6e5136, 0x473b52, 0x39524a, 0x71463a], pants: [0x22232b, 0x3a3630, 0x2e3138, 0x453f35], hats: [0x17181e, 0x3a2e24, 0x2a2c34, 0x51473c] }, /* 4 江戸城 */
      { shirts: [0xe9e2cf, 0xd8ecff, 0xf2ede0, 0xd9cfa8, 0xcfd8e6, 0xe6dcc4], pants: [0xd8d3c8, 0xb9ac8e, 0xaebdd0, 0xcfc4a4], hats: [0xffcf56, 0xf2ede0, 0xc9a227, 0xd8ecff] }  /* 5 神域 */
    ];
    var TOWN_HINTS = [
      "「この先の門の番人は、日本ツアー94勝の地の帝王だって。残影を浄化しないと、本気を出してくれないらしいよ。」",
      "「パリのボスは、往年の名選手がそのたび入れ替わって現れるそうだ。誰が出るかは運命の糸次第……。」",
      "「ローマの門番は南アフリカの鉄人。正確無比なショットで真っ向から崩すのが近道らしい。」",
      "「アメリカではパーマーとニクラス、往年の二巨頭との2連戦が待っている。体力とボールの残りに注意だ。」",
      "「江戸城の奥には絶対王者が待つ。……だが、その影に糸を引く者の気配がする、と宮司様が言っていたよ。」",
      "「ここは天空の神域。運命の糸の終端で、すべての物語が収束する場所……。」"
    ];

    function townPickVillagerPal(rnd, areaPal) {
      var hatTypes = ["cap", "straw", "flat", "hair", "cap", "hair"];
      return {
        shirt: areaPal.shirts[Math.floor(rnd() * areaPal.shirts.length)],
        pants: areaPal.pants[Math.floor(rnd() * areaPal.pants.length)],
        skin: TOWN_SKINS[Math.floor(rnd() * TOWN_SKINS.length)],
        hair: TOWN_HAIRS[Math.floor(rnd() * TOWN_HAIRS.length)],
        hat: areaPal.hats[Math.floor(rnd() * areaPal.hats.length)],
        hatType: hatTypes[Math.floor(rnd() * hatTypes.length)],
        scale: 0.93 + rnd() * 0.13 + (rnd() < 0.18 ? 0.07 : 0)
      };
    }

    /* ---- 簡易モデルの部品生成（頂点カラーを焼き込み、行列を適用して返す） ---- */
    function townPart(geo, hex, x, y, z, o) {
      o = o || {};
      var m = new THREE.Matrix4().compose(
        new THREE.Vector3(x || 0, y || 0, z || 0),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0)),
        new THREE.Vector3(o.sx == null ? 1 : o.sx, o.sy == null ? 1 : o.sy, o.sz == null ? 1 : o.sz));
      geo.applyMatrix4(m);
      var c = new THREE.Color(hex);
      if (o.shade) c.offsetHSL(0, 0, o.shade);
      var n = geo.attributes.position.count;
      var arr = new Float32Array(n * 3);
      for (var i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
      geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
      return geo;
    }
    function townMerge(parts) {
      var pos = [], nor = [], col = [], idx = [], base = 0;
      parts.forEach(function (g) {
        var pa = g.attributes.position, na = g.attributes.normal, ca = g.attributes.color, ia = g.index;
        for (var i = 0; i < pa.count; i++) { pos.push(pa.getX(i), pa.getY(i), pa.getZ(i)); nor.push(na.getX(i), na.getY(i), na.getZ(i)); col.push(ca.getX(i), ca.getY(i), ca.getZ(i)); }
        if (ia) { for (var j = 0; j < ia.count; j++) idx.push(ia.getX(j) + base); }
        base += pa.count;
        g.dispose();
      });
      var out = new THREE.BufferGeometry();
      out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
      out.setIndex(idx);
      townGeos.push(out);
      return out;
    }
    function townHeadParts(pal, headY) {
      var parts = [];
      parts.push(townPart(new THREE.CylinderGeometry(0.05, 0.055, 0.09, 8), pal.skin, 0, headY - 0.16, 0));
      parts.push(townPart(new THREE.SphereGeometry(0.145, 14, 11), pal.skin, 0, headY, 0));
      parts.push(townPart(new THREE.ConeGeometry(0.028, 0.07, 6), pal.skin, 0, headY - 0.015, 0.148, { rx: Math.PI / 2 - 0.15 }));
      if (pal.hatType === "cap") {
        parts.push(townPart(new THREE.SphereGeometry(0.152, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), pal.hat, 0, headY + 0.017, -0.008));
        parts.push(townPart(new THREE.BoxGeometry(0.21, 0.024, 0.15), pal.hat, 0, headY + 0.033, 0.168));
      } else if (pal.hatType === "straw") {
        parts.push(townPart(new THREE.CylinderGeometry(0.30, 0.30, 0.024, 16), pal.hat, 0, headY + 0.055, 0));
        parts.push(townPart(new THREE.CylinderGeometry(0.148, 0.168, 0.115, 12), pal.hat, 0, headY + 0.12, 0));
      } else if (pal.hatType === "flat") {
        parts.push(townPart(new THREE.SphereGeometry(0.163, 14, 8), pal.hat, 0, headY + 0.055, 0.012, { sx: 1.06, sy: 0.38, sz: 1.18 }));
      } else { /* hair */
        parts.push(townPart(new THREE.SphereGeometry(0.151, 14, 9, 0, Math.PI * 2, 0, 1.95), pal.hair, 0, headY + 0.013, -0.014));
      }
      return parts;
    }
    function townUpperParts(pal, withLegs) {
      var parts = [];
      parts.push(townPart(new THREE.CylinderGeometry(0.150, 0.185, 0.56, 12), pal.shirt, 0, 1.38, 0));   /* 胴 */
      parts.push(townPart(new THREE.CylinderGeometry(0.185, 0.168, 0.22, 12), pal.pants, 0, 1.03, 0));   /* 骨盤 */
      [-1, 1].forEach(function (sd) {                                                                     /* 腕＋肩＋手 */
        parts.push(townPart(new THREE.SphereGeometry(0.062, 9, 7), pal.shirt, sd * 0.185, 1.585, 0));
        parts.push(townPart(new THREE.CylinderGeometry(0.042, 0.037, 0.58, 8), pal.shirt, sd * 0.228, 1.31, 0, { rz: -sd * 0.10 }));
        parts.push(townPart(new THREE.SphereGeometry(0.048, 8, 6), pal.skin, sd * 0.258, 1.01, 0));
      });
      parts = parts.concat(townHeadParts(pal, 1.845));
      if (withLegs) {
        [-1, 1].forEach(function (sd) {
          parts.push(townPart(new THREE.CylinderGeometry(0.060, 0.074, 0.85, 9), pal.pants, sd * 0.10, 0.495, 0));
          parts.push(townPart(new THREE.BoxGeometry(0.115, 0.07, 0.25), 0x23242c, sd * 0.10, 0.035, 0.032));
        });
      }
      return parts;
    }
    function townRobeParts(pal) {
      var parts = [];
      parts.push(townPart(new THREE.CylinderGeometry(0.175, 0.385, 1.32, 14), pal.shirt, 0, 0.66, 0));        /* ローブ裾 */
      parts.push(townPart(new THREE.CylinderGeometry(0.150, 0.180, 0.52, 12), pal.shirt, 0, 1.42, 0, { shade: -0.035 })); /* 上身 */
      parts.push(townPart(new THREE.CylinderGeometry(0.196, 0.205, 0.07, 14), pal.hat, 0, 1.17, 0));          /* 帯（金） */
      [-1, 1].forEach(function (sd) {
        parts.push(townPart(new THREE.SphereGeometry(0.062, 9, 7), pal.shirt, sd * 0.185, 1.60, 0, { shade: -0.035 }));
        parts.push(townPart(new THREE.CylinderGeometry(0.042, 0.037, 0.58, 8), pal.shirt, sd * 0.228, 1.33, 0, { rz: -sd * 0.10, shade: -0.035 }));
        parts.push(townPart(new THREE.SphereGeometry(0.048, 8, 6), pal.skin, sd * 0.258, 1.03, 0));
      });
      parts = parts.concat(townHeadParts({ skin: pal.skin, hair: pal.hair, hat: pal.hat, hatType: "hair" }, 1.86));
      return parts;
    }
    function townLegMesh(pal, sd) {
      var parts = [];
      parts.push(townPart(new THREE.CylinderGeometry(0.060, 0.074, 0.85, 9), pal.pants, 0, -0.425, 0));
      parts.push(townPart(new THREE.BoxGeometry(0.115, 0.07, 0.25), 0x23242c, 0, -0.885, 0.032));
      var mesh = new THREE.Mesh(townMerge(parts), townMat());
      mesh.position.set(sd * 0.10, 0.92, 0);
      mesh.castShadow = true;
      return mesh;
    }
    function buildVillagerFigure(pal, opts) {
      opts = opts || {};
      var grp = new THREE.Group();
      var inner = new THREE.Group();
      grp.add(inner);
      var body = new THREE.Mesh(townMerge(opts.robe ? townRobeParts(pal) : townUpperParts(pal, !opts.walker)), townMat());
      body.castShadow = true;
      inner.add(body);
      var legL = null, legR = null;
      if (opts.walker) { legL = townLegMesh(pal, -1); legR = townLegMesh(pal, 1); inner.add(legL); inner.add(legR); }
      return { grp: grp, inner: inner, body: body, legL: legL, legR: legR };
    }
    function makeTownLabel(text, colorHex) {
      var cv = document.createElement("canvas"); cv.width = 512; cv.height = 128;
      var cx2 = cv.getContext("2d");
      cx2.fillStyle = "rgba(12,16,34,0.88)";
      var bw = 472, bh = 74, bx = (512 - bw) / 2, by = (128 - bh) / 2;
      cx2.beginPath();
      if (cx2.roundRect) cx2.roundRect(bx, by, bw, bh, 20); else cx2.rect(bx, by, bw, bh);
      cx2.fill();
      cx2.lineWidth = 5; cx2.strokeStyle = colorHex; cx2.stroke();
      cx2.font = "900 40px 'Noto Sans JP', sans-serif";
      cx2.textAlign = "center"; cx2.textBaseline = "middle";
      cx2.fillStyle = "#ffffff";
      cx2.fillText(text, 256, 66);
      var tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
      sp.scale.set(3.4, 0.85, 1);
      sp.renderOrder = 20;
      return sp;
    }

    function spawnTownVillager(kind, x, z, yaw, pal, extra) {
      var fig = buildVillagerFigure(pal, extra || {});
      fig.grp.position.set(x, terrainY(x, z), z);
      fig.grp.rotation.y = yaw;
      fig.grp.scale.setScalar(pal.scale || 1);
      scene.add(fig.grp);
      var rec = { kind: kind, grp: fig.grp, group: fig.grp, inner: fig.inner, legL: fig.legL, legR: fig.legR, x: x, z: z, yaw: yaw, seed: (townNpcs.length * 1.37) % 10, labelSprite: null };
      townNpcs.push(rec);
      return rec;
    }

    /* ---- 歩行（経路を往復。端で小休止、プレイヤーが近いと立ち止まる） ---- */
    function townPathPoint(w, d) {
      var dd = d % (w.total * 2); if (dd < 0) dd += w.total * 2;
      var forward = dd <= w.total;
      var rem = forward ? dd : (w.total * 2 - dd);
      for (var i = 0; i < w.segs.length; i++) {
        if (rem <= w.segs[i] || i === w.segs.length - 1) {
          var a = w.path[i], b = w.path[i + 1], t = w.segs[i] ? Math.min(1, rem / w.segs[i]) : 0;
          return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, dx: (b[0] - a[0]) * (forward ? 1 : -1), dz: (b[1] - a[1]) * (forward ? 1 : -1) };
        }
        rem -= w.segs[i];
      }
      var last = w.path[w.path.length - 1];
      return { x: last[0], z: last[1], dx: 0, dz: 1 };
    }
    function spawnTownWalker(path, speed, pal, dist0) {
      var rec = spawnTownVillager("walker", path[0][0], path[0][1], 0, pal, { walker: true });
      var segs = [], total = 0;
      for (var i = 0; i < path.length - 1; i++) { var L = Math.hypot(path[i + 1][0] - path[i][0], path[i + 1][1] - path[i][1]); segs.push(L); total += L; }
      var w = { rec: rec, path: path, segs: segs, total: total, dist: dist0 || 0, speed: speed, phase: (dist0 || 0) * 3.6, pauseT: 0, moving: false };
      townWalkers.push(w);
      townNpcWalkUpdate(w, 0, true);
      return w;
    }
    function townNpcWalkUpdate(w, dt, snap) {
      var rec = w.rec;
      if (w.pauseT > 0) w.pauseT -= dt;
      var pDist = Math.hypot(player.x - rec.grp.position.x, player.z - rec.grp.position.z);
      var wantMove = !snap && w.pauseT <= 0 && pDist > 1.45 && !w.talkHold; /* N5: 会話中は停止 */
      w.moving = wantMove;
      if (wantMove) {
        var prevCycle = Math.floor(w.dist / w.total);
        w.dist += w.speed * dt;
        if (Math.floor(w.dist / w.total) !== prevCycle) w.pauseT = 1.2 + (rec.seed % 1) * 1.3;
        w.phase += dt * w.speed * 3.6;
      }
      var pt = townPathPoint(w, w.dist);
      rec.grp.position.set(pt.x, terrainY(pt.x, pt.z), pt.z);
      if (w.talkLm) { w.talkLm.x = pt.x; w.talkLm.z = pt.z; } /* N5: 会話ランドマークを歩行位置へ追随（既存更新への相乗り） */
      rec.x = pt.x; rec.z = pt.z;
      if (pt.dx || pt.dz) {
        var diff = Math.atan2(pt.dx, pt.dz) - rec.grp.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rec.grp.rotation.y += diff * Math.min(1, snap ? 1 : dt * 5);
      }
      var sw = wantMove ? Math.sin(w.phase) * 0.52 : 0;
      var ease = Math.min(1, snap ? 1 : dt * 10);
      if (rec.legL) { rec.legL.rotation.x += (sw - rec.legL.rotation.x) * ease; rec.legR.rotation.x += (-sw - rec.legR.rotation.x) * ease; }
      if (rec.inner) rec.inner.position.y = wantMove ? Math.abs(Math.cos(w.phase)) * 0.045 : 0;
    }

    /* ---- 役割住人（案A: 主人公級GLB＋色差し替え） ---- */
    var TOWN_ROLE_DEFS = [
      { role: "receptionist", label: "🏠 クラブハウス受付", x: -8.3, z: 4.9, face: [0, 10], scaleMul: 0.99,
        tint: { polo: 0x8fb8ad, cap: 0xf0ead8 }, tint5: { polo: 0xe9e2cf, cap: 0xffcf56 },
        line: "「お疲れさまです、旅のゴルファー様。クラブハウスでは全回復・セーブ・新聞ヒントをご用意しております。お気軽にビーコンへどうぞ。」" },
      { role: "shopkeeper", label: "🛍 プロショップ店員", x: 8.3, z: 4.9, face: [0, 10], scaleMul: 1.03,
        tint: { polo: 0x74553a, cap: 0x2e2a26 }, tint5: { polo: 0xcfd8e6, cap: 0xf2ede0 },
        line: "「いらっしゃいませ！ 全11枠のギアとボールを取り揃えております。お買い求めは隣のビーコンからどうぞ。いい一打になりますように！」" }
    ];
    function townOnSyncRoles() { townSyncSeen = true; refreshTownRoles(); }
    function refreshTownRoles() {
      if (townRolesSpawned || townDisposed) return;
      townRolesSpawned = true;
      var all = ["Watu", "Matuya", "TIiger", "Junbo", "McIlro", "DeCham"];
      var pool = all.filter(function (c) { return c !== CHAR_ID && c !== (STATE.rivalId || null); });
      if (pool.length < 2) pool = all.filter(function (c) { return c !== CHAR_ID; });
      TOWN_ROLE_DEFS.forEach(function (def, i) {
        spawnTownRole(def, pool[(AREA_IDX + i * 2) % pool.length]);
      });
    }
    function spawnTownRole(def, charId) {
      var tint = (AREA_IDX === 5 && def.tint5) ? def.tint5 : def.tint;
      var rec = { kind: "role", role: def.role, charId: charId, def: def, group: null, grp: null, mixer: null, idleAction: null, ready: false, failed: false, label: null, headY: 2.6, yaw: townYawTo(def.x, def.z, def.face[0], def.face[1]), x: def.x, z: def.z, seed: 0 };
      var grp = new THREE.Group();
      grp.position.set(def.x, terrainY(def.x, def.z), def.z);
      grp.rotation.y = rec.yaw;
      scene.add(grp);
      rec.group = grp; rec.grp = grp;
      townRoles.push(rec); townNpcs.push(rec);
      var key = RIVAL_CHAR_KEY[charId];
      if (!key) { rec.failed = true; return; }
      initRivalLoader(function (loader) {
        if (!loader) { rec.failed = true; townLog("role loader unavailable:", def.role); return; }
        loader.loadAsync("assets/chars/" + key + ".glb?v=N10").then(function (gltf) {
          if (townDisposed) { gltf.scene.traverse(function (o) { if (o.geometry) { try { o.geometry.dispose(); } catch (e) {} } }); return; }
          var model = gltf.scene;
          /* N2/N3 で実証済みの透け対処＋別人化の色差し替え（ポロとキャップは無地マテリアルのため色替えがそのまま効く） */
          model.traverse(function (o) {
            if (o.isMesh) {
              o.castShadow = true; o.receiveShadow = false;
              var mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach(function (m) {
                m.transparent = false; m.depthWrite = true; m.alphaTest = 0.35;
                if (m.name === "PoloRed") m.color.setHex(tint.polo);
                else if (m.name === "CapMat") m.color.setHex(tint.cap);
                m.needsUpdate = true;
              });
            }
          });
          /* 身長キャリブレーション（ライバルと同一方式）＋役割ごとの微差 */
          var mb = new THREE.Box3().setFromObject(model);
          var modelH = Math.max(0.01, mb.max.y - mb.min.y);
          var pb = new THREE.Box3().setFromObject(playerMesh);
          var playerH = Math.max(0.01, pb.max.y - pb.min.y);
          var ratio = (RIVAL_WORLD_SCALE[charId] || 1.05) / (RIVAL_WORLD_SCALE[CHAR_ID] || 1.05);
          grp.scale.setScalar((playerH * ratio) / modelH * (def.scaleMul || 1));
          rec.headY = modelH;
          grp.add(model);
          rec.mixer = new THREE.AnimationMixer(model);
          gltf.animations.forEach(function (a) { if (a.name === "idle") rec.idleAction = rec.mixer.clipAction(a); });
          if (rec.idleAction) { rec.idleAction.setLoop(THREE.LoopRepeat, Infinity); rec.idleAction.play(); }
          var sp = makeTownLabel(def.label, def.role === "receptionist" ? "#ffd875" : "#44e587");
          sp.position.y = rec.headY + 0.55;
          grp.add(sp);
          rec.label = sp;
          rec.ready = true;
          townLog("role ready:", def.role, charId);
        }).catch(function (e) { rec.failed = true; townLog("role load FAILED:", def.role, charId, e && e.message); });
      });
      var lm = { x: def.x, z: def.z, r: 2.1, label: "💬 " + def.label + "と話す", color: 0xffe9a8, isNpcTalk: true, action: { type: "npcTalk", title: def.label, line: def.line, talk: { kind: "role", role: def.role, name: def.label } } };
      LANDMARKS.push(lm); townLandmarks.push(lm);
    }

    /* ---- 配置（全エリア共通レイアウト＋エリア別パレット） ---- */
    function spawnTownNpcs() {
      var rnd = townSeeded(9000 + AREA_IDX * 131);
      var pal = TOWN_PALETTES[AREA_IDX] || TOWN_PALETTES[0];
      function nextPal() { return townPickVillagerPal(rnd, pal); }
      /* 19番ホールの客（神域は1人） */
      var guestDefs = (AREA_IDX === 5) ? [{ x: -3.5, z: 11.4, face: [0, 14] }] : [{ x: -3.5, z: 11.4, face: [0, 14] }, { x: 3.7, z: 12.0, face: [0, 14] }];
      guestDefs.forEach(function (g) { spawnTownVillager("guest", g.x, g.z, townYawTo(g.x, g.z, g.face[0], g.face[1]), nextPal(), {}); });
      /* 運命の三女神モイライ（ローブ姿・別格の佇まい） */
      var moiraiRecs = [];
      [[-2.0, 18.8], [0, 19.8], [2.0, 18.8]].forEach(function (p) {
        var mp = { shirt: 0xf2ede0, pants: 0xf2ede0, skin: TOWN_SKINS[Math.floor(rnd() * 3)], hair: 0xd8d3c8, hat: 0xc9a227, hatType: "hair", scale: 1.0 + rnd() * 0.05 };
        moiraiRecs.push(spawnTownVillager("moirai", p[0], p[1], townYawTo(p[0], p[1], 0, 10), mp, { robe: true }));
      });
      var msp = makeTownLabel("✦ 運命の三女神 モイライ", "#b589ff");
      msp.position.y = 2.52;
      moiraiRecs[1].grp.add(msp);
      moiraiRecs[1].labelSprite = msp;
      var mlm = { x: 0, z: 18.4, r: 2.4, label: "💬 モイライに話しかける", color: 0xb589ff, isNpcTalk: true, action: { type: "npcTalk", title: "✦ 運命の三女神モイライ", line: "「糸はすでに織り上げられた。あとは汝の手で、断つか結び直すか――19番ホールで待っておるぞ。」", talk: { kind: "moirai", name: "✦ 運命の三女神モイライ" } } };
      LANDMARKS.push(mlm); townLandmarks.push(mlm);
      /* 立ち話ペア（広場の西） */
      [{ x: -8.6, z: 16.4, face: [-9.7, 15.5] }, { x: -9.7, z: 15.5, face: [-8.6, 16.4] }].forEach(function (g) {
        spawnTownVillager("pair", g.x, g.z, townYawTo(g.x, g.z, g.face[0], g.face[1]), nextPal(), {});
      });
      var plm = { x: -9.15, z: 15.95, r: 2.2, label: "💬 住人の噂話を聞く", color: 0xffe9a8, isNpcTalk: true, action: { type: "npcTalk", title: "💬 町の住人", line: TOWN_HINTS[AREA_IDX] || TOWN_HINTS[0], talk: { kind: "pair", name: "💬 町の住人" } } };
      LANDMARKS.push(plm); townLandmarks.push(plm);
      /* 通行人（参道の往復／横丁の往復） */
      spawnTownWalker([[1.9, 30], [2.8, 14], [0.4, -6], [2.0, -26], [0.6, -40]], 1.85, nextPal(), AREA_IDX * 11 + 5);
      spawnTownWalker([[-27, 11.8], [-13, 12.0], [5, 11.2], [19, 10.8], [28, 11.4]], 1.55, nextPal(), AREA_IDX * 17 + 40);
      townLog("townspeople spawned (villagers):", townNpcs.length);
    }

    function updateTownNpcs(dt, elapsed) {
      if (townDisposed) return;
      townRoles.forEach(function (rec) {
        if (rec.mixer && rec.ready) rec.mixer.update(dt);
        if (!rec.grp) return;
        var dx = player.x - rec.def.x, dz = player.z - rec.def.z;
        var dist = Math.hypot(dx, dz);
        var targetYaw = (dist < 9) ? Math.atan2(dx, dz) : rec.yaw;
        var diff = targetYaw - rec.grp.rotation.y;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rec.grp.rotation.y += diff * Math.min(1, dt * 3.0);
        if (rec.label) rec.label.visible = dist < 26;
      });
      townWalkers.forEach(function (w) { townNpcWalkUpdate(w, dt, false); });
      for (var i = 0; i < townNpcs.length; i++) {
        var r = townNpcs[i];
        if (r.kind === "role" || r.kind === "walker") continue;
        if (r.inner) r.inner.rotation.z = Math.sin(elapsed * 0.85 + r.seed) * 0.011; /* 立ちNPCの微かな揺れ */
        if (r.labelSprite) r.labelSprite.visible = Math.hypot(player.x - r.x, player.z - r.z) < 26;
      }
    }

    function disposeTownNpcs() {
      if (townDisposed) return;
      townDisposed = true;
      townNpcs.forEach(function (rec) {
        var g = rec.grp || rec.group;
        if (!g) return;
        if (rec.mixer) { try { rec.mixer.stopAllAction(); } catch (e) {} }
        scene.remove(g);
        g.traverse(function (o) {
          if (o.geometry && townGeos.indexOf(o.geometry) < 0) { try { o.geometry.dispose(); } catch (e) {} }
          if (o.material) {
            var ms = Array.isArray(o.material) ? o.material : [o.material];
            ms.forEach(function (m) {
              if (m === townVillagerMat) return;
              for (var k in m) { var v = m[k]; if (v && v.isTexture) { try { v.dispose(); } catch (e) {} } }
              try { m.dispose(); } catch (e) {}
            });
          }
        });
      });
      townGeos.forEach(function (g) { try { g.dispose(); } catch (e) {} });
      townGeos = [];
      townLandmarks.forEach(function (lm) { var i = LANDMARKS.indexOf(lm); if (i >= 0) LANDMARKS.splice(i, 1); });
      townLandmarks = []; townNpcs = []; townRoles = []; townWalkers = [];
      if (townVillagerMat) { try { townVillagerMat.dispose(); } catch (e) {} townVillagerMat = null; }
      townLog("townspeople disposed");
    }
    window.addEventListener("pagehide", function () { try { disposeTownNpcs(); } catch (e) {} });

    /* 検証・診断用ハンドル（N3 の __GOATN3 と同型） */
    window.__GOATN4 = {
      get count() { return townNpcs.length; },
      get villagers() { return townNpcs.filter(function (r) { return r.kind !== "role"; }).length; },
      get roles() { return townRoles.map(function (r) { return { role: r.role, charId: r.charId, ready: r.ready, failed: r.failed }; }); },
      get rolesReady() { return townRoles.length === 2 && townRoles.every(function (r) { return r.ready; }); },
      get walkers() { return townWalkers.map(function (w) { return { x: +w.rec.grp.position.x.toFixed(2), z: +w.rec.grp.position.z.toFixed(2), moving: w.moving }; }); },
      get talkLandmarks() { return townLandmarks.length; },
      get disposed() { return townDisposed; },
      disposeAll: function () { disposeTownNpcs(); }
    };

/* =========================================================================
N5: 住人との会話（ユーザー指示 2026-11-21／同日追加要件で対話ループ化）
- N4 の一言バナー（npcTalk → showBanner）は本格会話へ格上げし、廃止した。
会話ランドマークは全住人に付け、近づくとプロンプトから会話ダイアログが開く。
- 対話ループ: 挨拶→話題の二択（①ゴルフ上達のコツ／②敵キャラ情報）→
プレイヤーの反応二択→住人の返し→「続きを聞く／別の話題にする」の二択、
という往復を、プレイヤーが終える（✕終える／会話を終える）まで何度でも
繰り返せる。各画面の選択肢は常に2つに統一する。
- ユニークさ: ①のコツは TALK_TIPS（66件）をローテーション（新規系統専用
キー goatn_talk_tips_v1 に保存）し一巡するまで重複なし。②の敵情報は
main／弱点／条件／備え／背景の5セグメント制で、同一会話内では一度出た
セグメントを繰り返さない。挨拶・続きの促し・相槌・セグメントの前置きも
プールから「その会話で未使用のもの」を優先して選ぶ。
- エリア固有: 敵情報はエリアごとの nextTarget（親から同期される実データ）
が土台。挨拶には土地の話題（TALK_AREA_FLAVOR）、コツには土地の切り口
（TALK_TIP_INTROS）を混ぜ、全エリア＋神域で使い回し感を出さない。
- 性能: 会話データの生成は会話中（ボタン押下時）のみ。毎フレーム処理には
何も足さない（通行人のランドマーク追随は既存の歩行更新の中で座標を
書き写すだけ）。ポーリング／常駐タイマーは追加しない。会話ランドマークは
N4 の townLandmarks 破棄経路に乗り、エリア移動で確実に解放される。
- 歩行中の住人は会話中 talkHold で停止し、立ち住人は会話中プレイヤーを向く
（閉じると元の向きに戻す）。会話中は STATE.paused でワールドを止める
（N3 のライバル選択ダイアログと同じ作法）。
- 施設・ショップ・宿屋・ライバル遭遇・対戦・セーブ形式には触れない。
========================================================================= */

/* ---- ① リアルゴルフ上達のコツ集（66件: DR10/IR10/AP10/PT12/CM8/MT7/PR9） ---- */
var TALK_TIPS = [
/* ドライバー */
{ c: "ドライバー", t: "ティーアップは、ボールの半分がドライバーのクラウン（上部）より上に出る高さが目安です。低すぎると擦って飛距離を失い、高すぎると天ぷか（高く上がって飛ばない球）の原因になります。", d: "迷ったら少し高めから始めて、打痕がフェースの少し上に付く高さに調整すると安定します。練習場では毎回同じ高さにセットする習慣をつけると、本番でも再現性が上がります。"},
{ c: "ドライバー", t: "ドライバーは『振り急がない』が鉄則。切り返しで一瞬タメを作る意識を持つと、ヘッドが自然に加速して飛距離も方向性も安定します。力むほどヘッドスピードは落ちるんですよ。", d: "素振りで『スーッ』と風切り音が一番大きくなる位置が、ボールのある位置と重なるか確認してみてください。音が手前で鳴る人は、体が突っ込んでいるサインです。"},
{ c: "ドライバー", t: "アドレスではボールを左足かかとの内側に置き、頭はボールの少し右後ろに残すのが基本。ドライバーはアッパーブロー（上昇軌道）で当てるクラブです。", d: "上体をほんの少し右に傾ける『逆K字』のアドレスにすると、アッパー軌道になりやすくスピンが減ってランも出ます。ただし傾けすぎはダフリの原因。鏡で確認しましょう。"},
{ c: "ドライバー", t: "スライスに悩むなら、まずグリップを点検。左手の甲が自分から見てナックル2〜3個見える『ストロンググリップ』気味にすると、インパクトでフェースが返りやすくなります。", d: "グリップは唯一クラブと体が触れる場所です。アドレスでは先にフェースを目標へ合わせ、それからグリップをそっと握る。この順序だけでも方向性が安定します。"},
{ c: "ドライバー", t: "飛距離アップの近道は、実はヘッドスピードより『芯に当てること』。速く振っても芯を外せば飛びません。短いスイングで芯に当て続ける練習から始めるのが、結局一番速いんです。", d: "フェースに打痕シールやパウダーを付けて打つと打点が一目瞭然。打点が安定してきたら、少しずつスイングを大きくしていきましょう。"},
{ c: "ドライバー", t: "ティーショットは『狙いを広く』取るのがコースマネジメントの基本。フェアウェイの真ん中ではなく、ミスしても次が打てる側を広く使ってください。OBのある側だけは絶対に避けること。", d: "例えば右がOBなら、左サイドのラフまでを許容範囲として狙いを左寄りに。『曲がる前提』で狙いを決めるだけで、大叩きのホールが激減しますよ。"},
{ c: "ドライバー", t: "アドレスで肩・腰・膝のラインが目標と平行か、意識していますか？ 体は右を向いているのに手だけ目標に合わせる構えは、引っかけとスライスの両方を招きます。", d: "練習場ではスタンスラインにクラブを1本置いて平行を確認。本番ではボールと目標の間にスパット（小さな目印）を見つけ、その真上にフェースを合わせると方向が定まります。"},
{ c: "ドライバー", t: "バックスイングは『クラブを上げる』のではなく、肩の回転で運ぶ意識を。右腰が後ろに引ける深いトップが作れれば、下半身リードの切り返しが自然にできるようになります。", d: "トップで一瞬止まるくらいのゆったりしたテンポがおすすめ。プロの多くはバックスイングとダウンスイングの時間比率が3対1と言われています。"},
{ c: "ドライバー", t: "風の強い日はティーを低くし、コンパクトなスイングで低い球を。飛距離を欲張らず『風に喧嘩しない』球筋を選ぶことが、そのままスコアを守ります。", d: "アゲンスト（向かい風）では番手を上げるのではなく、7〜8割の力感で振ること。力むとスピンが増えて、風に押し戻されてしまいます。"},
{ c: "ドライバー", t: "ドライバーのミスが続く日は、無理に使い続けない勇気も実力のうち。3番ウッドやユーティリティで確実にフェアウェイへ置く選択が、結果的にスコアを伸ばします。", d: "『今日はドライバーが曲がる日』と認めるのはマネジメントの第一歩。ティーショットの目的は飛ばすことではなく、次の一打を打ちやすくすることですからね。"},
/* アイアン */
{ c: "アイアン", t: "アイアンは、ボール→芝の順に当たるダウンブローを意識。アドレスでハンドファースト（手が少し目標側）に構えるのが基本形です。すくい上げる打ち方では、距離も方向も安定しません。", d: "練習ではボールの少し先にティーを倒して置き、ボールとティーを一緒に払うドリルが効果的。ターフ（芝）がボールの先から取れていれば正解です。"},
{ c: "アイアン", t: "距離が合わない人の多くは、番手ごとの飛距離を正確に把握していません。各番手10球の『平均キャリー』を測ってメモするだけで、コースマネジメントが劇的に変わりますよ。", d: "大切なのは最高飛距離ではなく平均キャリー。グリーンを狙うときは、奥のピンでも平均値で番手を選ぶと大叩きが減ります。"},
{ c: "アイアン", t: "アイアンの方向性はアドレスの向きで7割決まります。フェースを目標に合わせたら、足はそのラインと平行に。体を開く癖がある人は、意識して少し右を向くくらいが丁度です。", d: "打ちたい方向にクラブを置いてから構える『ルーティン』を固定しましょう。再現性の高い選手ほど、アドレスまでの手順が毎回同じなんです。"},
{ c: "アイアン", t: "ダフリが多い日は、ボールの位置が左すぎるか、体重が右足に残っているサイン。ボールを半個分右へ寄せ、左足体重6割で構えると改善しやすいです。", d: "逆にトップが多い日は、頭が早く上がっている可能性が。インパクトの後も一瞬だけ、ボールがあった場所を見続ける意識が効きます。"},
{ c: "アイアン", t: "グリーンを狙うときはピンではなく『グリーンの安全な広い側』が狙い目。プロでもピンを直接狙うのは絶好調のときだけです。センター狙いこそスコアの近道。", d: "ピンが端にあるときほどセンター狙いの価値が上がります。センターに乗せれば、どのピンの位置に対しても2パットの距離に収まりやすいからです。"},
{ c: "アイアン", t: "アイアンでフルスイングにこだわる必要はありません。8割の力感で振る『コントロールショット』の方が距離も方向も安定します。番手を上げて優しく打つのは、上級者の技術です。", d: "練習場で各番手『8割で何ヤード飛ぶか』を把握しておくと、風の日や緊張した場面で大きな武器になりますよ。"},
{ c: "アイアン", t: "ラフからのアイアンは、フェースに芝が絡んでフライヤー（想定より飛ぶ球）が出ることがあります。一つ番手を下げ、少し短く持ってコンパクトに振るのが基本です。", d: "ボールが沈んだ深いラフでは、無理せずウェッジでフェアウェイへ出すのも立派な選択。『出す勇気』が次のホールを救います。"},
{ c: "アイアン", t: "左足下がりのライではボールを右寄りに置いて傾斜なりの低い球を。右足下がりではその逆。ライなりの球筋をイメージして、傾斜に無理に逆らわないことが大切です。", d: "傾斜地では素振りを2回して、クラブが地面に当たる位置を確認。その位置に合わせてボールを置くと、ダフリとトップが激減します。"},
{ c: "アイアン", t: "芯を外しがちな人は、テークバックで手首の角度が崩れていることが多いもの。トップでもインパクトでも手首の形をキープする意識を持ちましょう。", d: "ゆっくりした素振りで、手首の形が崩れていないか鏡でチェック。地味ですが、一番効く練習の一つです。"},
{ c: "アイアン", t: "150ヤード前後の『中途半端な距離』こそ練習の価値があります。得意な番手で打てるよう、ティーショットやレイアップでその距離を残すマネジメントも覚えると強いですよ。", d: "自分の『得意距離』を一つ作ると、勝負どころで迷いが消えます。練習の最後にその距離だけを10球打つ習慣がおすすめです。"},
/* アプローチ */
{ c: "アプローチ", t: "寄せの基本は『転がし』です。グリーン周りでは、まずパター、次にウェッジで転がす、最後に上げる球の順で考えるのがセオリー。上げる球はミスの幅が大きいからです。", d: "転がしの目安は『落とし場所と転がりの比率』をクラブごとに覚えること。同じフォームでクラブを変えるだけで、距離を使い分けられます。"},
{ c: "アプローチ", t: "アプローチでは体重を左足に6〜7割乗せたまま小さく振るのが基本。大きな体重移動を使うと距離感が狂い、ザックリやトップの原因になります。", d: "両足の幅は拳一つ分くらいに狭くすると、体の回転が抑えられて手打ちになりにくく、再現性がぐっと上がります。"},
{ c: "アプローチ", t: "寄せの距離感は『振り幅』で作るのが鉄則。時計の針に例えて9時〜3時、8時〜4時など、振り幅ごとに何ヤード飛ぶか把握しておくと、本番で迷いません。", d: "力加減で調整すると緊張した場面で必ず狂います。振り幅と一定のテンポで打つからこそ、プレッシャーの下でも再現できるんです。"},
{ c: "アプローチ", t: "バンカーショットはボールを直接打たず、手前2〜3cmの砂を爆発させるように打って、砂ごとボールを運ぶイメージ。フェースを開いてバンス（ソールの出っ張り）を使います。", d: "砂が柔らかいときはバンスが効くので思い切って振り抜くこと。硬い砂ではフェースを開きすぎず、少し立てて打つと対応できます。"},
{ c: "アプローチ", t: "グリーン周りのザックリ（ダフリ）は、手首を使ってすくい上げる動きが原因。ハンドファーストを保ち、体の回転で運べば、ロフト（フェースの角度）が自然に仕事をしてくれます。", d: "ボール手前にコインを置き、コインも一緒に払うドリルがおすすめ。左手首の角度を保ったまま小さく往復する練習も効きます。"},
{ c: "アプローチ", t: "高い球で寄せたいときはフェースを開いてボールを少し左へ。低い転がしはボールを右に置いてロフトを立てる。ボール位置だけで、球筋は大きく変わります。", d: "ただしフェースを開くショットは距離感が狂いやすい上級者向け。まずは基本の寄せを安定させてから取り入れましょう。"},
{ c: "アプローチ", t: "寄せの狙いはカップそのものではなく『次のパットが楽になる場所』。上りのパットが残る側に寄せられれば、3パットのリスクが大きく減ります。", d: "傾斜のあるグリーンでは、ピンの下側にボールを止めるのが鉄則。下りの速いパットを残さないだけで、寄せワンの確率が上がります。"},
{ c: "アプローチ", t: "ラフからの寄せは、芝の抵抗でヘッドが止まりやすいもの。少し短く握り、手首を固めて、普段より大きめの振り幅で。フェースが芝に負けないよう、構えで腹圧を入れるのもコツです。", d: "ボールが浮いているラフはトップに注意、沈んでいるラフはザックリに注意。まずボールの沈み具合を読むことが、寄せの第一歩です。"},
{ c: "アプローチ", t: "20〜30ヤードの『中途半端な距離』が一番難しいと言われます。ここは大きな筋肉――体の回転で打ち、手先の調整に頼らないこと。練習量がそのまま結果に出る距離です。", d: "練習場では20・30・40ヤードの目印を作り、振り幅で打ち分ける練習を。10球中何球が半径2mに入るか数えると、上達が目に見えます。"},
{ c: "アプローチ", t: "寄せに迷ったら『最低限の失敗』を選ぶこと。大きくオーバーする寄せより、少しショートでもグリーンに乗る寄せの方が、スコアへのダメージは小さいです。", d: "実際、アマチュアの寄せはショートするミスが圧倒的に多いというデータもあります。気持ち大きめの振り幅を選ぶ勇気が、寄せワンを増やします。"},
/* パター */
{ c: "パター", t: "パットの距離感は『ストロークの大きさ』で合わせるのが基本。インパクトで強弱をつけると再現性が落ちます。振り子のリズムは、距離によらず一定に保ちましょう。", d: "目安はバックスイングとフォローの大きさを1対1に保つこと。距離が遠いほど振り幅だけを大きくすると、タッチが安定します。"},
{ c: "パター", t: "ライン読みの第一歩は、カップの後ろ側から低い姿勢で傾斜を見ること。ボールの後ろからだけでは分からない全体の傾斜が、反対側からだと見えてきます。", d: "グリーンに上がったら、歩きながら足裏で傾斜を感じることも大切。プロは『足で読む』と言われるほど、歩行中の情報収集を大事にしています。"},
{ c: "パター", t: "ショートパット（1m前後）は、ラインを消して『真っ直ぐ強め』が正解の場面が多いもの。カップの奥の壁に当てるイメージで、弱気にならないことが一番のコツです。", d: "弱いパットは傾斜に流されて外れますが、適度な強さなら多少の傾斜は無力化できます。ただし返しのパットが長くならない強さの見極めは、練習で身につけるものです。"},
{ c: "パター", t: "パットで頭を上げてしまう人は、ボールの行方を目で追いすぎ。『インパクトの音を聞くまで顔を残す』意識で、結果はカップインの音で知るくらいが丁度いいんです。", d: "練習ではカップを見ずに打つドリルも有効。頭の位置が安定するとフェースの向きも安定して、ボールが真っ直ぐ転がり始めます。"},
{ c: "パター", t: "パットのグリップ圧は『歯磨き粉のチューブを少しだけ押す程度』が目安。強く握ると手首が固まってストロークがギクシャクします。肩と腕の三角形を保って、振り子のように。", d: "両手の親指をグリップの上に揃えると、フェースの向きを感じやすくなります。自分に合う握りを探すのも、大切な練習の一つです。"},
{ c: "パター", t: "ロングパットは『2パットで収める円』をイメージ。カップを中心に半径1mの円に入れば成功、と考えるだけでプレッシャーが減り、結果的にも寄るようになります。", d: "10mのパットが1回で入る確率はプロでも1割ほど。『寄せ』に徹する割り切りが、3パット撲滅の近道です。"},
{ c: "パター", t: "下りのパットは、転がり始めの3分の1で傾斜の影響を最も受けます。出だしは優しく、しかしラインは多めに読むのが下り攻略のセオリーです。", d: "上りのパットは逆に『強め・ライン少なめ』。上りと下りで読みの原則を切り替えるだけで、グリーン上の判断が速くなります。"},
{ c: "パター", t: "パットのアドレスでは、目の真下にボールが来る位置が基本。目線がボールの内側や外側にずれると、ラインの見え方そのものが歪んでしまいます。", d: "確認は簡単で、アドレスの姿勢のまま目の下からもう1個ボールを真下に落とすだけ。着地点が元のボールに近ければ、正しい目の位置です。"},
{ c: "パター", t: "フックライン・スライスラインは、曲がりの頂点ではなく『カップに入る入口』をイメージして狙うのが上級テクニック。入口に仮想の小さなカップを描くと、読みが冴えます。", d: "傾斜の読みに迷ったら、カップ周辺の傾斜を最優先に。ボールは速度が落ちる終盤ほど、傾斜の影響を強く受けるからです。"},
{ c: "パター", t: "パット前のルーティンを固定化しましょう。ラインを読む→素振り2回→アドレス→すぐに打つ。この流れを毎回同じにすると、緊張した場面でも体が勝手に動いてくれます。", d: "考えすぎはパットの大敵。アドレスしてから打つまでは5秒以内が目安とされます。迷いは素振りまでに終わらせるのがコツです。"},
{ c: "パター", t: "芝目（しばめ）の影響は、順目では速く、逆目では重くなります。グリーンが明るく見える方向が順目、暗く見える方向が逆目。色の違いで読むのが基本です。", d: "特に高麗グリーンは芝目の影響が大きい。カップの切り口を見ると、芝の生えている方向が分かることもありますよ。"},
{ c: "パター", t: "ファーストパットで大きくオーバーする人は、ボールをすくい上げようとしている可能性が。パターは水平か、ほんの少しダウンブローで転がす意識で十分。上げる必要はありません。", d: "インパクトで左手首が折れる『すくい打ち』は距離感を狂わせます。左手の甲を目標へ向け続けるイメージでストロークしましょう。"},
/* コースマネジメント */
{ c: "コースマネジメント", t: "ティーショットの狙いは『フェアウェイの真ん中』ではなく『ミスしても安全な側』。自分の球筋の曲がり幅を考慮して狙い点を設定するのが、マネジメントの基本です。", d: "球筋が右に曲がるなら狙いは左寄りに。『曲がらない前提』の狙いほど、コースに翻弄されてしまいます。"},
{ c: "コースマネジメント", t: "パー5は3打で届く前提で組み立てるのが基本。2打目で無理に狙わず、得意な距離を残すレイアップの方が、結果的にバーディチャンスが増えます。", d: "『あと100ヤード残し』のように得意距離を残す設計ができると、パー5がスコアを作るホールに変わりますよ。"},
{ c: "コースマネジメント", t: "ピンの位置が端にあるときほど、グリーンセンター狙いの価値が上がります。端ピンを狙って外し、難しい寄せを残すのが一番の悪手。センターから2パットで正解です。", d: "統計でも、アマチュアはピンを狙いすぎてバンカーや深いラフに入れる損失が大きいと言われます。『狙わない勇気』がスコアを作るんです。"},
{ c: "コースマネジメント", t: "トラブル時は『一打で確実に脱出』が絶対条件。木の間を抜くような賭けは成功率が低く、大叩きの元です。確実にフェアウェイへ戻して次で勝負するのが、結局一番速い。", d: "『出せばボギーで済む』場面をパー狙いに変えない冷静さ。それこそがマネジメント力そのものです。"},
{ c: "コースマネジメント", t: "風を読むときは、旗の揺れだけでなく、空の雲の流れと木々の音も手がかりに。ホール全体の風は、ティーグラウンドの風と違うことがよくあります。", d: "芝をちぎって投げる古典的な方法も有効です。落ち際の流れで、ボールが飛ぶ高さの風の向きを推測できます。"},
{ c: "コースマネジメント", t: "ドッグレッグホールでは、曲がり角までの距離を把握して番手選びを。飛びすぎて突き抜けるのも、届かずに角が使えないのも、どちらもマネジメントミスです。", d: "距離表示や150ヤード杭から逆算する習慣を。『残り距離』ではなく『打ちたい距離』から考えるのがコツです。"},
{ c: "コースマネジメント", t: "朝イチのティーショットは体が回りにくいもの。いきなりフルスイングせず、8割の力感でフェアウェイに置くことを優先すると、その後のリズムが整います。", d: "スタート前の素振りは、大きくゆっくり回すことを意識して。体を温める素振りと、リズムを作る素振りは分けて行うと効果的です。"},
{ c: "コースマネジメント", t: "スコアが崩れ始めたら『ボギーでいい』と目標を切り替えること。一つの大叩きを引きずると、次のホールまで連鎖します。ホールの途中でも再設計できるのがマネジメントです。", d: "『パーオンしなくても、寄せワンか2パットでボギー』という現実的な組み立てに戻すと、不思議とショットも安定し始めますよ。"},
/* メンタル */
{ c: "メンタル", t: "緊張は『悪いもの』ではなく、体が準備を整えている証拠。心拍が上がったら、ゆっくり長く息を吐く呼吸を2回。それだけで手の震えが収まります。", d: "吐く息を、吸う息の倍の長さにするのがコツ。ティーグラウンドへ上がる前の歩行中に済ませておくと、アドレスで焦りません。"},
{ c: "メンタル", t: "ミスショットの後は『次の1打』だけに集中を切り替える合言葉を持ちましょう。『終わったことは変えられない。変えられるのは次だけ』――これが勝負どころの思考法です。", d: "プロは『10歩歩く間に引きずらない』など、自分なりの区切り方を持っています。歩数でも、クラブを戻す動作でも、何でも構いません。"},
{ c: "メンタル", t: "プレッシャーは『結果』を考えると強くなり、『動作』に集中すると弱くなります。勝負どころでは『肩を回す』『フィニッシュを取る』など、体の動き一つに意識を絞りましょう。", d: "結果はコントロールできませんが、動作はコントロールできます。コントロールできるものに集中する――それがメンタルトレーニングの核心です。"},
{ c: "メンタル", t: "ラウンド前のイメージトレーニングは効果的です。前の晩に各ホールを思い浮かべ、良いショットを打つ自分を映像で見るだけで、当日の迷いが減ります。", d: "特に1番ホールのティーショットは入念に。スタートの成功イメージが、その日の流れを作ります。"},
{ c: "メンタル", t: "同伴者と比べて落ち込むのは一番の毒。ゴルフは『自分とコースの対話』です。他人のナイスショットは拍手で流して、自分のプランに集中しましょう。", d: "スコアカードも、他人の欄は見ないくらいで丁度いい。自分の数字だけを追うと、プレーの質が安定します。"},
{ c: "メンタル", t: "『今日は調子が悪い』と感じた日は、目標を『丁寧にアドレスすること』のような過程の目標に切り替えること。結果目標を下げると、かえってプレーが締まります。", d: "過程目標は達成感を細かく得られるので、自信の回復にもつながります。悪いはずの日に好スコアが出るのは、だいたいこのパターンです。"},
{ c: "メンタル", t: "最終ホールや勝負どころで力むのは自然なこと。そんなときほど『いつものルーティン』を丁寧に繰り返すこと。平常心とは特別な状態ではなく、いつもの手順の繰り返しなんです。", d: "ルーティンが崩れたと感じたら、一度アドレスを解いてやり直す勇気を。それだけでミスの大半は防げます。"},
/* 練習法 */
{ c: "練習法", t: "練習の質は『1球ごとの目的』で決まります。漫然と打ち続ける100球より、狙いを定めた30球。球ごとに狙いと結果を確認する習慣をつけましょう。", d: "プロの練習は『技術練習』と『実戦練習』に分かれています。後半は本番形式で、1球ごとにクラブを変えて打つと実戦力がつきます。"},
{ c: "練習法", t: "ドライバーばかり打つ練習は、上達を遠回りさせます。スコアの約6割は100ヤード以内とパット。練習時間の半分はショートゲームに割くのが、スコアアップの王道です。", d: "アプローチとパットは、才能より練習量がものを言う分野。地味な反復が、確実にスコアを削ってくれます。"},
{ c: "練習法", t: "ハーフスイングのドリルは万能薬。腰から腰の振り幅で芯に当てる練習は、インパクトの形を体に覚え込ませ、フルスイングの精度まで底上げします。", d: "ハーフスイングで真っ直ぐ飛ばない人は、フルスイングでも飛びません。まずは小さなスイングで『当たる感覚』を作るのが順序です。"},
{ c: "練習法", t: "素振りは毎日5分でも効果があります。鏡の前でゆっくり、トップとフィニッシュの形を確認するだけでも、スイングの土台は整っていきます。", d: "室内では短いクラブや素振り用スティックで。速く振る素振りは、風切り音でヘッドスピードの確認にもなります。"},
{ c: "練習法", t: "パット練習は『距離感』と『方向』を分けて行うこと。ロングパットは距離だけ、ショートパットは真っ直ぐ打つことだけに集中すると、効率よく上達します。", d: "自宅のパターマットでも、1mを真っ直ぐ転がす練習は本物です。『カップに入れる』より『真っ直ぐ出す』反復が、本番のショートパットを救います。"},
{ c: "練習法", t: "ラウンドの反省は『良かった点』から記録すること。ミスの原因追及ばかりでは自信が削られます。良かったショットの感覚を言葉にすると、再現性が上がります。", d: "スコアカードの余白に一言メモを残す習慣を。『7番の寄せ、振り幅9時で成功』のような具体的な記録が、次のラウンドの財産になります。"},
{ c: "練習法", t: "苦手クラブの克服は『短く持って、短いスイング』から。いきなりフルスイングで直そうとせず、当たる形を小さく作ってから、徐々に大きくするのが近道です。", d: "どうしても合わないクラブは、思い切って抜いてしまうのも手。バッグの構成を考えることも、実力のうちです。"},
{ c: "練習法", t: "練習場では『コースを想定した1球』を混ぜましょう。ティーショット→アプローチ→パットの順に、本番の流れで打つ練習が、実戦とのギャップを埋めます。", d: "特にラウンド前日の練習は、量よりリズム。新球を気持ちよく打って終わるくらいが、当日の調子を整えます。"},
{ c: "練習法", t: "動画で自分のスイングを撮るなら、正面と後方の2方向から。特に後方からは、スイングプレーン（軌道）とアドレスの向きが一目で分かります。", d: "ただし動画チェックは『1回に1つの課題』まで。直す点を欲張るとスイング全体が崩れます。課題を決めたら、2週間はそれだけに集中しましょう。"}
];

/* 相槌・促し・前置きのプール（同一会話内では未使用を優先して選ぶ） */
var TALK_TIP_CHEERS = [
"その意気やよし！ 次のラウンドでさっそく試してみてください。",
"うんうん、素直に試せる人が一番伸びるんですよ。",
"いいねえ。体に染み込むまで、練習場で3球だけでも繰り返すといいですよ。",
"おお、やる気ですね。その調子で一つずつ身につけていきましょう。",
"ふむふむ、その前向きさこそ上達の証拠です。",
"いい返事だ。あとは体が覚えるまで、反復あるのみですよ。"
];
var TALK_CONT_PROMPTS = [
"他に聞きたいことはありますか？",
"さて、次は何を話そうか。",
"まだまだ話は尽きないね。他には？",
"うん、それで――他に気になることは？"
];
var TALK_ENEMY_DONE = [
"敵については、知っていることは全部話しましたよ。",
"敵の話はここまで。あとはあんたの一打が語る番だ。",
"うむ、敵情報は出し尽くした。他の話ならまだあるがね。"
];
var TALK_SEG_PREFIX = {
weak: ["よくぞ聞いてくれた。", "ここだけの話だ。", "相手の弱みなら――", ""],
cond: ["決戦の段取りなら、こうだ。", "場所と条件をまとめるよ。", ""],
prep: ["備えの話もしておこう。", "戦う前の準備なら――", ""],
lore: ["そういえば、こんな話もあってね。", "背景を知ると、相手の見方が変わる。", ""]
};
/* 土地の話題（挨拶・続きの促しに混ぜる）と、コツの土地の切り口 */
var TALK_AREA_FLAVOR = [
["この古都は、夕方の風が読みにくいんです。", "京都のグリーンは、山からの傾斜が効くと言いますね。"],
["パリの空気は芸術的でも、風は気まぐれでね。", "この街では、美しい景色に気を取られると足元をすくわれます。"],
["ローマの陽射しは強い。水分補給も立派なマネジメントです。", "闘技場の風は、渦を巻くそうですよ。"],
["アメリカの大地は広い。距離感を掴むのが一番の課題でね。", "この地では、思い切りの良さがそのまま武器になります。"],
["江戸の空は黄泉の霧に近い。視界が悪い日ほど、確実な一打を。", "この城下では、静けさが一番のプレッシャーだそうです。"],
["神域の空気は澄んでいて、嘘がつけない気がします。", "ここでは運命の糸の音が聞こえる、と古老が言います。"]
];
var TALK_TIP_INTROS = [
["この古都でも通じる話ですが――", "京都の先輩ゴルファーに教わったのですが――"],
["パリの宮廷でも評判の話でね――", "この街の常連がよく言うのですが――"],
["ローマの鉄人たちも実践しているそうで――", "闘技場の常連の知恵ですが――"],
["アメリカのツアーでは常識らしくて――", "この大地のゴルファーはよく言うんです――"],
["江戸の達人の教えでは――", "この城下に伝わる話では――"],
["神域の古老の言葉では――", "運命の糸のほとりで聞いた話では――"]
];

/* ---- ② 敵キャラ情報の素材（ゲーム内データ＝ボス編成・ライバル特性） ---- */
var TALK_AREA_NAMES = ["京都", "パリ", "ローマ", "アメリカ", "江戸城", "天空の神域"];
var TALK_RIVAL_TRAITS = {
Watu: { strong: "経験に裏打ちされた安定感と、ここ一番の勝負強さが武器。", weak: "飛距離勝負に持ち込めば若さで上回れる。ロングホールで先にバーディを奪って揺さぶるのが有効だ。"},
Matuya: { strong: "静かな集中力と、乱れないスイングリズムが武器。", weak: "ペースを乱されるのが苦手。先行してプレッシャーをかけ続けると、終盤にミスが出やすい。"},
TIiger: { strong: "圧倒的な飛距離と、勝負どころでの爆発力が武器。", weak: "パワー消費の激しい戦い方をする。長期戦に持ち込んでミスを誘い、自滅を待つのも手だ。"},
Junbo: { strong: "地の帝王の豪快な飛距離と、衰えないパワーが武器。", weak: "繊細なアプローチ勝負なら分がある。短いホールやグリーン周りで差をつけよう。"},
McIlro: { strong: "高弾道のドライバーと、流れるようなスイングが武器。", weak: "パッティングが乱れると全体のリズムを崩す。グリーン上で先にプレッシャーをかけよう。"},
DeCham: { strong: "科学的に計算し尽くされた一打と、圧倒的なヘッドスピードが武器。", weak: "計算外の状況――強風や悪ライでは精度が落ちる。天候の荒れたホールで勝負しよう。"}
};
var TALK_BOSS_WEAK = {
Junbo: "豪快な飛距離が武器だが、勝負は3ホールマッチ。グリーン周りの精度で対抗し、パワーを温存して最終ホールに勝負を持ち込むのが定石だ。",
Player: "正確無比だが、飛距離ではこちらが上回れる。ロングホールで先行し、短いホールは堅くパーで凌ぐのが攻略の型だ。",
Palmer: "大胆不敵なチャージが持ち味だが、攻めすぎて自ら崩れることもある。堅実にパーを重ねて、相手のミスを待つのがいい。",
Niklaus: "弱点らしい弱点はない。だが帝王は『守るゴルフ』に徹すると強い。先にバーディを奪って、攻めざるを得ない展開に持ち込もう。",
DarkTIiger: "闇の力で底上げされた絶対王者。だが宿主の心はまだ完全に闇に染まっていない。会心の一打で揺さぶれば、ほころびが見えるはずだ。",
DarkNiklaus: "全盛期の闘争本能を呼び覚まされた帝王。真っ向勝負では分が悪い。コースの罠と天候を味方につけ、ミスを誘うゴルフで崩そう。",
VesselBerserk: "暴走した器は力任せで精度に欠ける。盟友のクラブで冷静に対処し、暴走の隙を突くのが救出の鍵だ。",
Nox: "一度も負けたことのない原初神。だが『負ける感覚』を求めて人を育てた神だ――その願いこそが、唯一のほころびかもしれない。",
TrueWatu: "創世の追放神。勝敗以上に、神の遊戯を人に託した者の『約束のラウンド』だ。全力の一打一打で応えることが何よりの攻略だ。",
Hagen: "華麗なショーマンは、派手な勝負を好む。堅実に刻む相手を退屈がる――地味にパーを重ねると焦れてくる。",
Hogan: "彫刻のような完璧なスイングの匠。だが完璧主義ゆえ、悪天候や悪ライでは普段の再現性が揺らぐ。",
Watson: "リンクスの風を愛する達人。風のない穏やかなホールでは、持ち味の低く強い球が活きない場面もある。",
Vardon: "近代グリップの祖である紳士。クラシックな攻め筋ゆえ、現代的な高弾道の攻めには対応が遅れることがある。",
BJones: "アマチュアの皇帝。品格あるゴルフをする分、泥臭いトラブル対応では賭けに出ない。際どい場面で揺さぶろう。",
Snead: "流麗なスイングの麦わら帽。リズムが崩れると立て直しに時間がかかる。先行してリズムを狂わせるのが有効だ。",
Sarazen: "バンカーの魔術師。砂からは出てくるが、深いラフやベアグラウンドでは魔術は使えない。",
Trevino: "陽気な話術と低く強い球の名手。高い球を要求されるホールでは、本来の弾道が使いにくい。",
Faldo: "精密機械のような再現性の人。だがプレッシャー下の勝負パットでは、計算が静かに狂うことがある。",
Seve: "林や駐車場からでも奇跡を放つ魔術師。普通の状況では魔術は不要――平凡なホールの積み重ねで差をつけよう。",
Lefty: "左打ちの勝負師。ピンチでもロブショットでピンを狙う大胆さが、裏を返せば無謀な攻めで崩れる隙でもある。",
Nelson: "機械の如き正確さ『アイアン・バイロン』。正確さで真っ向勝負は避け、距離の違うホールでリズムを外そう。",
Braid: "全英5勝の設計巨匠。コースを読む力は随一だが、設計者の想定を超える大胆な攻めには驚かされることがある。",
Taylor: "嵐を切り裂くアイアンの名手。風には滅法強いが、穏やかな日はその武器が半分眠る。",
Thomson: "南半球の冷静な王者。地面の転がりを計算し尽くす分、空中戦――高く止める球が必要なホールでは計算が狂う。",
Massi: "フランスの地元英雄。地元の声援が力になる分、静かな異国の空気では平常心が試される。",
Roca: "『罪の谷』の奇跡を起こした情熱家。熱くなりすぎると大味なミスも出る。冷静なプレーで熱を空回りさせよう。"
};
var TALK_BOSS_LORE = {
Junbo: "日本ツアー94勝という空前絶後の金字塔を打ち立てた帝王。圧倒的な飛距離と繊細なアプローチで、一時代を築いた人だ。",
Player: "世界中のツアーを転戦し、総移動距離は地球何百周分にも及ぶ『ブラック・ナイト』。鍛え抜かれた肉体と不屈の精神で、生涯グランドスラムを達成した求道者だ。",
Palmer: "『アーニーズ・アーミー』と呼ばれる大観衆を熱狂させたカリスマ王。大胆不敵なチャージで、ゴルフを世界中の人々に愛されるスポーツへ変えた人だ。",
Niklaus: "4大メジャー通算18勝、人類史上最高峰の記録を持つ『ゴールデン・ベア』。本作では神器の守り人の血筋として、器の真価を問う役どころだ。",
DarkTIiger: "数々の奇跡を起こした現代の絶対王者。さらなる完全無欠を求める野心の隙をノクスの予言に突かれ、黄泉の門を開いたダークチャンピオンだ。",
DarkNiklaus: "器の成長を見たノクスが『より強き人形』として、全盛期の闘争本能を呼び覚ました18勝の帝王の姿だという。",
VesselBerserk: "誘惑の契約を重ねたことでノクスに肉体の主導権を奪われた、主人公自身の姿。盟友のクラブだけが、その魂を呼び戻せる。",
Nox: "夜の女神ニュクスと黄泉のイザナミをルーツに持つ二重の追放神。一度も負けたことがない孤独ゆえに、自らを打ち破る『人間』を育て上げたという。",
TrueWatu: "高天原とオリンポスの『最初のラウンド』に立ち会い、神の遊戯ゴルフを人間へ分け与えた真の恩人。天空の神域で、約束のラウンドを待っている。"
};
/* nextTarget が無い単独起動時などのための、エリア別ボス情報（編成マスター準拠） */
var TALK_AREA_BOSS = [
{ name: "Junbo（地の帝王）", where: "京都の決戦の門の先", strong: "日本ツアー94勝の帝王。豪快な飛距離が武器。", weak: TALK_BOSS_WEAK.Junbo, lore: TALK_BOSS_LORE.Junbo},
{ name: "運命の間の主（正体不明）", where: "パリ宮廷の決戦の門の先", strong: "往年の名選手が運命の糸で入れ替わり現れる。誰が出るかは、その巡り合わせ次第。", weak: "正体は19番ホールや町の噂で少しずつ分かる。相手のスタイルを知れば、攻略法も見えてくる。", lore: "宮廷の主は正体を隠すのが習わし。19番ホールの予想ビンゴに登録しておくと、莫大な報酬の噂もある。"},
{ name: "G.Player（黒衣の騎士）", where: "ローマ闘技場の決戦の門の先", strong: "メジャー9勝・生涯グランドスラムの鉄人。正確無比なショットが武器。", weak: TALK_BOSS_WEAK.Player, lore: TALK_BOSS_LORE.Player},
{ name: "A.Palmer → J.Niklaus", where: "アメリカの決戦の門の先", strong: "民衆の王と18冠の帝王による2連戦。体力とボールの残量が試される。", weak: "まずパーマーのチャージを堅実に受け止め、温存した力で帝王に挑む配分が鍵だ。", lore: "帝王ニクラスは『帝王の門番』。格では上だが門を守り、その先に現役最強が待つ構図だという。"},
{ name: "Dark TIiger（闇の傀儡王）", where: "江戸城の決戦の門の先", strong: "闇に操られた絶対王者。その先には、糸を引く原初神ノクスが待つという。", weak: TALK_BOSS_WEAK.DarkTIiger, lore: TALK_BOSS_LORE.DarkTIiger},
{ name: "創世神 Watu（裏ボス）", where: "天空の神域の最奥", strong: "最初のラウンドに立ち会った創世の神。その強さは全ボスの中でも最高峰。", weak: TALK_BOSS_WEAK.TrueWatu, lore: TALK_BOSS_LORE.TrueWatu}
];

/* 話者ごとの挨拶（会話の入口。毎回ランダムに1つ） */
var TALK_GREETINGS = {
receptionist: ["お疲れさまです、旅のゴルファー様。少しお話ししていきませんか？", "いらっしゃいませ。ラウンドの調子はいかがですか？", "本日もお疲れさまです。お時間よければ、お話し相手になりますよ。"],
shopkeeper: ["いらっしゃいませ！ ギアを見るついでに、耳寄りな話はいかがです？", "おや、お客さん。道具の話もいいですが、世間話もどうぞ。", "やあ、いらっしゃい。今日は道具より話が目当てかな？"],
guest: ["やあ、いいラウンドだったかい？ 一杯やりながら話そうじゃないか。", "おっと、旅のゴルファーさんだね。ここだけの話があるんだが……", "おっ、いいところに来た。ちょうど昔の武勇伝を話していたところでね。"],
pair: ["ねえねえ、今の聞いた？ ……おっと、あんたにも教えてあげようか。", "ちょいと、あんたもゴルファーだろ？ 耳寄りな話があるんだ。", "あんたもゴルフをやるんだろ？ ちょうどいい、聞いてくよ。"],
walker: ["おや、旅の方ですか？ 立ち止まってでよければ、お話ししましょう。", "こんにちは。この道はよく通るんですよ。何かお探しですか？", "やあ、散歩日和だね。歩くついでに話でもどうだい。"],
moirai: ["「運命の糸に導かれし者よ。聞きたいことがあるのだろう？」", "「三女神はすべてを見ている。……さあ、何を問う？」", "「問いの糸口は、すでに汝の手の中にある。さあ、選ぶがよい。」"]
};

/* ---- コツのローテーション（一巡するまで重複なし。新規系統専用キーに保存） ---- */
var TALK_TIP_KEY = "goatn_talk_tips_v1";
var talkTipMem = null; /* localStorage が使えない環境向けの保険（同一セッション内のみ） */
function talkLoadTipState() {
try {
var raw = localStorage.getItem(TALK_TIP_KEY);
if (raw) { var s = JSON.parse(raw); if (s && Object.prototype.toString.call(s.order) === "[object Array]" && typeof s.pos === "number") { talkTipMem = s; return s;}}
} catch (e) {}
return talkTipMem;
}
function talkSaveTipState(s) {
talkTipMem = s;
try { localStorage.setItem(TALK_TIP_KEY, JSON.stringify(s));} catch (e) {}
}
function talkDrawTip() {
var st = talkLoadTipState();
if (!st || st.order.length!== TALK_TIPS.length || st.pos >= st.order.length) {
var order = TALK_TIPS.map(function (_, i) { return i;});
for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t;}
if (st && order.length > 1 && order[0] === st.last) { var t2 = order[0]; order[0] = order[1]; order[1] = t2;}
st = { order: order, pos: 0, last: st? st.last: -1};
}
var idx = st.order[st.pos];
st.pos += 1; st.last = idx;
talkSaveTipState(st);
return { idx: idx, tip: TALK_TIPS[idx]};
}

/* ---- ② 敵情報の組み立て（nextTarget＝未撃破の相手が常に先頭の実データ）
5セグメント（main／weak／cond／prep／lore）を返す。同一会話内では
一度出したセグメントを繰り返さない（呼び出し側で seen 管理）。 ---- */
function talkPowPhrase(p) {
if (typeof p!== "number") return "実力は未知数";
if (p >= 5.5) return "神の領域の強さ";
if (p >= 5.0) return "最強クラスの強さ";
if (p >= 4.5) return "極めて強い";
if (p >= 4.0) return "強敵と呼ぶにふさわしい強さ";
if (p >= 3.4) return "手強い相手";
return "油断は禁物の相手";
}
var TALK_WEATHER_JA = { sunny: "晴れ", clear: "快晴", cloudy: "曇り", rain: "雨", fog: "霧", storm: "嵐", snow: "雪", sunset: "夕景"};
function talkEnemyInfo(kind) {
var nt = STATE.nextTarget;
var areaName = TALK_AREA_NAMES[AREA_IDX] || "";
var prefix = (kind === "moirai")? "「糸の先に見えるのは――」": (kind === "pair" || kind === "guest")? "噂ではね、": "";
if (nt && nt.kind === "rival") {
var rid = STATE.rivalId || nt.id;
var tr = TALK_RIVAL_TRAITS[rid] || { strong: "闇に囚われた好敵手としての実力は本物。", weak: "パワーを温存し、同点判定（ショットポイント→残りパワー）まで見据えて戦おう。"};
var rlines = RIVAL_LINES[rid];
return {
main: prefix + "この" + areaName + "で次に立ちはだかるのは、好敵手 " + rid + " だ。" + (nt.title? "「" + nt.title + "」として、": "") + "決戦の門の手前で待ち構えている。強みは――" + tr.strong,
weak: tr.weak + " ライバル戦は1ホール勝負だから、最初の一打から集中を切らすな。",
cond: "決戦の場所は " + (nt.courseName || "この地の決戦コース") + "、1ホールマッチだ。同点ならショットポイント、それも同点なら残りパワーで決着する。門とライバルへの挑戦は、聖地の残影を2体浄化すると解かれる。",
prep: "備えとしては、得意クラブの確認とボールの残数チェックだ。1ホール勝負は出だしが全て――最初のティーショットを安全に置く準備をしておこう。パワーは同点判定にも関わるから、温存も立派な戦術だ。",
lore: rlines? (rid + " は門の手前で、こう言い放っているらしい――" + rlines.challenge): (rid + " は闇に囚われながらも、ゴルファーとしての誇りを失っていないという。")
};
}
if (nt && nt.isBoss) {
var wk = TALK_BOSS_WEAK[nt.id] || "真っ向勝負だけでなく、コースの罠と天候を読むこと。相手の強さに臆さず、自分のゴルフを貫くのが一番の攻略だ。";
var bossMain = prefix + "この" + areaName + "の次の相手は " + nt.name + "。" + (nt.title? "「" + nt.title + "」――": "") + talkPowPhrase(nt.powTier) + "だ。決戦の門の先で待っている。";
var lore = TALK_BOSS_LORE[nt.id] || "";
if (nt.kind === "paris_boss") {
if (String(nt.name).indexOf("？？？") === 0) {
bossMain = prefix + "パリ宮廷の主は、まだ正体を明かしていない。往年の名選手が運命の糸で入れ替わり現れる――誰が出るかは、19番ホールの予想や町の噂で少しずつ見えてくる。強さはメジャー勝者の格そのもの、" + talkPowPhrase(nt.powTier) + "だ。";
}
lore = "宮廷の主の肩書きは『" + (nt.title || "") + "』。" + (nt.realBossName? "正体は " + nt.realBossName + " と目されている。": "") + "19番ホールの『予想ビンゴ』に登録しておくと、莫大な報酬の噂もある。";
}
if (!lore) lore = (nt.title? "『" + nt.title + "』の肩書きは伊達ではない。": "") + "決戦の門をくぐる者への試練として、この地に君臨している。";
return {
main: bossMain,
weak: wk,
cond: "決戦は " + (nt.courseName || "決戦のコース") + " で、" + (nt.holes || 3) + "ホールのマッチプレー（先取2勝・2連勝コールド、同点ホールはハーフ、オールスクエアならPar3ニアピン1打で決着）。天候は" + (TALK_WEATHER_JA[nt.weather] || nt.weather || "晴れ") + "の見込みだ。挑むには、まずこの地のライバルを倒し、決戦の門を開くこと。",
prep: "備えとしては、天候（" + (TALK_WEATHER_JA[nt.weather] || nt.weather || "晴れ") + "）に合うギアの見直しと、ボールの残数を多めに確保すること。" + (nt.holes || 3) + "ホールの長丁場だから、パワーとメンタルの配分を先に決めておくと崩れない。クラブハウスで回復してから門へ向かうのが定石だ。",
lore: lore
};
}
var ab = TALK_AREA_BOSS[AREA_IDX] || TALK_AREA_BOSS[0];
return {
main: prefix + "この" + areaName + "の門番は " + ab.name + "。" + ab.where + "で待っている。" + ab.strong,
weak: ab.weak,
cond: "決戦は3ホールのマッチプレー（先取2勝・2連勝コールド、同点ホールはハーフ、オールスクエアならPar3ニアピン1打で決着）。挑むには、この地のライバルを倒して決戦の門を開くことだ。",
prep: "備えとしては、ボールの残数を多めに確保し、クラブハウスで回復してから挑むこと。長丁場ではパワーとメンタルの配分が勝敗を分ける。",
lore: ab.lore
};
}

/* ---- 会話ダイアログの制御（対話ループ） ---- */
var talkState = null; /* { def, name, kind, phase, line, buttons, tipDraw, enemySegs, enemySeen, history, rounds, used, recs, walker, greeting} */
function talkLog() { try { console.log.apply(console, ["[GOAT-N5]"].concat([].slice.call(arguments)));} catch (e) {}}
function talkPick(arr) { return arr[Math.floor(Math.random() * arr.length)];}
/* その会話で未使用の要素を優先して選ぶ（プールを使い切ったら使用済みをリセット） */
function talkPickFresh(pool, usedKey) {
if (!pool ||!pool.length) return "";
var used = talkState.used[usedKey] || (talkState.used[usedKey] = {});
var avail = pool.filter(function (_, i) { return!used[i];});
if (!avail.length) { talkState.used[usedKey] = {}; used = talkState.used[usedKey]; avail = pool.slice();}
var pick = talkPick(avail);
used[pool.indexOf(pick)] = true;
return pick;
}

function talkSetButtons(list) {
talkState.buttons = list;
var box = document.getElementById("tkBtns");
box.innerHTML = "";
list.forEach(function (b, i) {
var btn = document.createElement("button");
btn.type = "button";
btn.textContent = b.label;
if (b.main) btn.className = "tk-main";
btn.setAttribute("data-talk-idx", String(i));
btn.onclick = function () { if (talkState && talkState.buttons[i]) talkState.buttons[i].fn();};
box.appendChild(btn);
});
}
function talkShow(line) {
talkState.line = line;
talkState.history.push(line);
document.getElementById("tkLine").textContent = line;
}
/* 話題選択（常に二択）。戻ってきたときは促し文＋土地の話題を混ぜて新鮮に保つ */
function talkPhaseTopic(again) {
talkState.phase = "topic";
var line = talkState.greeting;
if (again) {
line = talkPickFresh(TALK_CONT_PROMPTS, "cont");
if (talkState.rounds % 2 === 1) {
var fl = talkPickFresh(TALK_AREA_FLAVOR[AREA_IDX] || TALK_AREA_FLAVOR[0], "flavor");
if (fl) line += " " + fl;
}
}
talkShow(line);
talkSetButtons([
{ label: "🏌️ ゴルフ上達のコツを聞く", main: true, fn: talkShowTip},
{ label: "⚔ 敵キャラの情報を聞く", fn: talkPhaseEnemy}
]);
}
/* ① コツ: 土地の切り口＋コツ本文。反応二択→返し→続きの二択、でループする */
function talkShowTip() {
var draw = talkDrawTip();
talkState.phase = "tip";
talkState.tipDraw = draw;
talkState.rounds += 1;
var intro = talkPickFresh(["", ""].concat(TALK_TIP_INTROS[AREA_IDX] || []), "intro");
talkShow((intro? intro + "\n": "") + "\u3010" + draw.tip.c + "\u3011" + draw.tip.t);
talkSetButtons([
{ label: "「なるほど！ 試してみます」", main: true, fn: function () {
talkState.phase = "tipAfter";
talkShow(talkPickFresh(TALK_TIP_CHEERS, "cheer"));
talkSetButtons(talkTipNavButtons());
}},
{ label: "「もう少し詳しく教えて」", fn: function () {
talkState.phase = "tipAfter";
talkShow(draw.tip.d);
talkSetButtons(talkTipNavButtons());
}}
]);
}
function talkTipNavButtons() {
return [
{ label: "🏌️ もう一つコツを聞く", main: true, fn: talkShowTip},
{ label: "💬 別の話題にする", fn: function () { talkPhaseTopic(true);}}
];
}
/* ② 敵情報: 5セグメントを同一会話内で一度ずつ出す */
function talkPhaseEnemy() {
if (!talkState.enemySegs) talkState.enemySegs = talkEnemyInfo(talkState.kind);
if (!talkState.enemySeen.main) { talkShowEnemySeg("main"); return;}
talkEnemyNext();
}
function talkEnemyNext() {
var order = ["weak", "cond", "prep", "lore"];
for (var i = 0; i < order.length; i++) {
if (!talkState.enemySeen[order[i]]) { talkShowEnemySeg(order[i]); return;}
}
talkState.phase = "enemyAfter";
talkShow(talkPickFresh(TALK_ENEMY_DONE, "done"));
talkSetButtons([
{ label: "🏌️ ゴルフ上達のコツを聞く", main: true, fn: talkShowTip},
{ label: "👋 会話を終える", fn: function () { closeNpcTalk();}}
]);
}
function talkShowEnemySeg(key) {
var segs = talkState.enemySegs;
talkState.enemySeen[key] = true;
talkState.phase = (key === "main")? "enemy": "enemyAfter";
talkState.rounds += 1;
var pre = (key === "main")? "": talkPickFresh(TALK_SEG_PREFIX[key] || [""], "pre_" + key);
talkShow(pre + segs[key]);
if (key === "main") {
talkSetButtons([
{ label: "「弱点や攻略法はある？」", main: true, fn: function () { talkShowEnemySeg("weak");}},
{ label: "「決戦の場所と条件は？」", fn: function () { talkShowEnemySeg("cond");}}
]);
return;
}
var remain = ["weak", "cond", "prep", "lore"].some(function (k) { return!talkState.enemySeen[k];});
if (remain) {
talkSetButtons([
{ label: "⚔ もっと敵の話を聞く", main: true, fn: talkEnemyNext},
{ label: "💬 別の話題にする", fn: function () { talkPhaseTopic(true);}}
]);
} else {
talkSetButtons([
{ label: "💬 別の話題にする", main: true, fn: function () { talkPhaseTopic(true);}},
{ label: "👋 会話を終える", fn: function () { closeNpcTalk();}}
]);
}
}

function talkFaceRecs(recs, face) {
(recs || []).forEach(function (rec) {
if (!rec ||!rec.grp) return;
if (face) {
if (rec._talkPrevYaw === undefined) rec._talkPrevYaw = rec.grp.rotation.y;
rec.grp.rotation.y = Math.atan2(player.x - rec.grp.position.x, player.z - rec.grp.position.z);
} else if (rec._talkPrevYaw!== undefined) {
rec.grp.rotation.y = rec._talkPrevYaw;
rec._talkPrevYaw = undefined;
}
});
}
function talkResolveRecs(def, lm) {
if (lm && lm.talkRecs) return lm.talkRecs;
if (def.kind === "moirai" || def.kind === "pair") return townNpcs.filter(function (r) { return r.kind === def.kind;});
if (def.kind === "guest") {
var near = null, bd = 1e9;
townNpcs.forEach(function (r) { if (r.kind!== "guest") return; var d = Math.hypot(player.x - r.x, player.z - r.z); if (d < bd) { bd = d; near = r;}});
return near? [near]: [];
}
return [];
}

function openNpcTalk(def, lm) {
if (talkState ||!def) return;
if (rivalDialogOpen) return;
var recs = (def.kind === "role")? []: talkResolveRecs(def, lm);
var walker = (lm && lm.talkWalker)? lm.talkWalker: null;
talkState = {
def: def, name: def.name || "💬 住人", kind: def.kind || "pair", phase: "topic",
line: "", buttons: [], tipDraw: null, enemySegs: null,
enemySeen: {}, history: [], rounds: 0, used: {},
greeting: talkPick(TALK_GREETINGS[def.kind === "role"? def.role: def.kind] || TALK_GREETINGS.pair),
recs: recs, walker: walker
};
if (walker) {
walker.talkHold = true;
if (walker.rec && walker.rec.grp) walker.rec.grp.rotation.y = Math.atan2(player.x - walker.rec.grp.position.x, player.z - walker.rec.grp.position.z);
}
talkFaceRecs(recs, true);
document.getElementById("tkName").textContent = talkState.name;
document.getElementById("talkDialog").style.display = "flex";
var pr = document.getElementById("interactPrompt");
if (pr) pr.style.display = "none";
_lastPromptLM = null; /* 閉じた後にプロンプトを再表示させる */
STATE.paused = true; /* 会話中はワールドを止める（N3 ライバルダイアログと同じ作法） */
talkPhaseTopic(false);
talkLog("talk open:", talkState.name, talkState.kind);
}
function closeNpcTalk() {
if (!talkState) return;
if (talkState.walker) talkState.walker.talkHold = false;
talkFaceRecs(talkState.recs, false);
talkState = null;
document.getElementById("talkDialog").style.display = "none";
STATE.paused = false;
talkLog("talk close");
}
document.getElementById("tkClose").onclick = function () { closeNpcTalk();};

/* 客・通行人の会話ランドマーク（生成済みNPCに後付けする。破棄は townLandmarks 経由で既存経路に乗る） */
function talkAttachExtraLandmarks() {
townNpcs.forEach(function (rec) {
if (rec.kind!== "guest") return;
var lm = { x: rec.x, z: rec.z, r: 2.1, label: "💬 19番ホールの客と話す", color: 0xffe9a8, isNpcTalk: true,
action: { type: "npcTalk", title: "🍸 19番ホールの客", talk: { kind: "guest", name: "🍸 19番ホールの客"}}};
lm.talkRecs = [rec];
LANDMARKS.push(lm); townLandmarks.push(lm);
});
townWalkers.forEach(function (w) {
var lm = { x: w.rec.x, z: w.rec.z, r: 2.3, label: "💬 通行人と話す", color: 0xffe9a8, isNpcTalk: true,
action: { type: "npcTalk", title: "🚶 通行人", talk: { kind: "walker", name: "🚶 通行人"}}};
lm.talkWalker = w; w.talkLm = lm;
LANDMARKS.push(lm); townLandmarks.push(lm);
});
talkLog("extra talk landmarks attached. talk total:", LANDMARKS.filter(function (l) { return l.action && l.action.type === "npcTalk";}).length);
}

/* 検証・診断用ハンドル（N3/N4 と同型） */
window.__GOATN5 = {
get open() { return!!talkState;},
get phase() { return talkState? talkState.phase: null;},
get speaker() { return talkState? talkState.name: null;},
get line() { return talkState? talkState.line: "";},
get buttons() { return talkState? talkState.buttons.map(function (b) { return b.label;}): [];},
get history() { return talkState? talkState.history.slice(): [];},
get rounds() { return talkState? talkState.rounds: 0;},
get enemySeen() { return talkState? Object.assign({}, talkState.enemySeen): {};},
get lastTip() { return (talkState && talkState.tipDraw)? { idx: talkState.tipDraw.idx, cat: talkState.tipDraw.tip.c, text: talkState.tipDraw.tip.t}: null;},
tipsTotal: TALK_TIPS.length,
tipState: function () { var s = talkLoadTipState(); return s? { pos: s.pos, total: s.order.length, seen: s.order.slice(0, s.pos)}: null;},
press: function (i) { if (talkState && talkState.buttons[i]) talkState.buttons[i].fn();},
pressLabel: function (sub) {
if (!talkState) return false;
for (var i = 0; i < talkState.buttons.length; i++) {
if (talkState.buttons[i].label.indexOf(sub) >= 0) { talkState.buttons[i].fn(); return true;}
}
return false;
},
close: function () { closeNpcTalk();},
openKind: function (kind) {
for (var i = 0; i < LANDMARKS.length; i++) {
var lm = LANDMARKS[i];
if (lm.action && lm.action.type === "npcTalk" && lm.action.talk && lm.action.talk.kind === kind) { openNpcTalk(lm.action.talk, lm); return true;}
}
return false;
},
talkLandmarks: function () { return LANDMARKS.filter(function (l) { return l.action && l.action.type === "npcTalk";}).length;},
walkerHold: function (i) { var w = townWalkers[i]; return w?!!w.talkHold: null;},
walkerPos: function (i) { var w = townWalkers[i]; return (w && w.rec && w.rec.grp)? { x: w.rec.grp.position.x, z: w.rec.grp.position.z}: null;},
walkerInfo: function (i) { var w = townWalkers[i]; return (w && w.rec && w.rec.grp)? { x: w.rec.grp.position.x, z: w.rec.grp.position.z, hold: !!w.talkHold, pauseT: w.pauseT, moving: !!w.moving}: null;}
};

    spawnTownNpcs();
    talkAttachExtraLandmarks(); /* N5: 客・通行人の会話ランドマークを後付け */
    /* スタンドアロン時のフォールバック: 親の同期（ライバル確定）が来ていれば何もしない。
       同期が来ない直接起動では約12秒後に主人公だけを除外して生やす（重い環境で同期が遅れても、
       ライバルと同顔の役割住人が生える競合を避けるため段階的に待つ）。 */
    (function townRoleFallback(tries) {
      setTimeout(function () {
        if (townRolesSpawned || townDisposed) return;
        if (townSyncSeen || tries >= 4) { refreshTownRoles(); return; }
        townRoleFallback(tries + 1);
      }, 2500);
    })(0);

    /* スタンドアロン直接起動時も即動作するよう初期スポーンを実行し、親へ挨拶送信 */
    spawnAreaMobs(null, []);
    updateHudNumbers();
    postToParent({ type: "goat:hello" });
    animate();
  
;

/* v4.1（項目17）: Three.js が読み込めなかった場合の代替表示（本体が起動していない時だけ出す） */
setTimeout(function(){
  if(typeof THREE === "undefined" && !document.getElementById("v41LoadFallback")){
    var d = document.createElement("div");
    d.id = "v41LoadFallback";
    d.style.cssText = "position:fixed;inset:0;z-index:99999;background:#0a0d1e;color:#ffe9a8;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;font-family:'Noto Serif JP',serif;text-align:center;padding:24px;";
    d.innerHTML = "<div style='font-size:20px;font-weight:700;'>⛳ 3Dエンジンの読み込みに失敗しました</div>" +
      "<div style='font-size:13.5px;color:#aebadd;line-height:1.8;'>通信環境を確認してから、再読み込みしてください。<br>セーブデータはブラウザ内に安全に残っています。</div>";
    var b = document.createElement("button");
    b.textContent = "🔄 再読み込み";
    b.style.cssText = "background:#c9a227;color:#14161f;border:none;font-size:15px;font-weight:700;padding:10px 26px;border-radius:8px;cursor:pointer;";
    b.onclick = function(){ location.reload(); };
    d.appendChild(b);
    document.body.appendChild(d);
  }
}, 4000);

/* v4.1（項目8）: 時間の流れの表情 ― 太陽の方位と空の明るさが数分かけて静かに移ろう（エリア固有の空の色は変えない） */
(function(){
  var t0 = Date.now();
  var baseA = Math.atan2(-85, 58), R = Math.hypot(58, 85);
  setInterval(function(){
    if(typeof sunLight === "undefined" || typeof hemiLight === "undefined") return;
    if(typeof STATE !== "undefined" && STATE.paused) return;
    var t = (Date.now() - t0) / 1000;
    var ang = Math.sin(t * Math.PI * 2 / 300) * 0.22;
    sunLight.position.x = Math.cos(baseA + ang) * R;
    sunLight.position.z = Math.sin(baseA + ang) * R;
    hemiLight.intensity = 0.72 * Math.PI * (1 + 0.07 * Math.sin(t * Math.PI * 2 / 180));
  }, 1000);
})();

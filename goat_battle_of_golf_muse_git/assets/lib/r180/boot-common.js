/* GOAT r180 bootstrap (WebGL variant) — sets up window.THREE / renderer / shader
   factory, then injects the classic game script (assets/game-*.js) unchanged in
   global semantics. Renderer params are exact copies of the original r128
   construction arguments in world.html / golf.html. */
import * as THREE_NS from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// r128 color-pipeline parity: see boot-common-webgpu.js note.
THREE_NS.ColorManagement.enabled = false;

function inject(src) {
  const s = document.createElement('script');
  s.src = src;
  s.onload = function () {
    // The game script was injected after parsing; if lifecycle events already
    // fired, re-dispatch so game listeners registered late are not lost.
    if (document.readyState === 'complete') {
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
      window.dispatchEvent(new Event('load'));
    } else if (document.readyState === 'interactive') {
      document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
    }
  };
  document.body.appendChild(s);
}

export async function boot(opts) {
  const THREE = Object.assign({}, THREE_NS, { GLTFLoader: GLTFLoader });
  window.THREE = THREE;
  window.MeshoptDecoder = MeshoptDecoder;
  window.__GOAT_ENGINE__ = { variant: 'webgl-r180', backend: 'webgl', adapter: null, error: null };
  window.__GOAT_SHADER__ = function (name, desc) { return new THREE.ShaderMaterial(desc); };
  window.__GOAT_RENDERER__ = new THREE.WebGLRenderer(opts.params);
  console.log('[GOAT engine] variant=webgl-r180 backend=webgl');
  try { await Promise.race([MeshoptDecoder.ready, new Promise(function (r) { setTimeout(r, 3000); })]); } catch (e) {}
  inject(opts.gameSrc);
}

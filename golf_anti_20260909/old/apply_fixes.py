import os
import shutil
import re

base_file = "golf_3d_20260908_1_777.html"
bk_file = "golf_3d_777_20260909_1350_BK.html"
new_file = "golf_3d_777_20260909_1350_new.html"

# Backup
shutil.copyfile(base_file, bk_file)

with open(base_file, "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: _traceUpdate error
trace_update_old = "if(this._curTraceLine){this.scene.remove(this._curTraceLine);this._curTraceLine.geometry.dispose();}"
trace_update_new = "if(this._curTraceLine){this.scene.remove(this._curTraceLine);if(this._curTraceLine.type==='Group'){this._curTraceLine.children.forEach(c=>{if(c.geometry)c.geometry.dispose();if(c.material)c.material.dispose();});}else if(this._curTraceLine.geometry){this._curTraceLine.geometry.dispose();}}"
content = content.replace(trace_update_old, trace_update_new)

# Fix 2: Next Hole button missing
next_hole_old = '<button id="nextHoleBtn" style="display:none !important;"></button>'
next_hole_new = '<button id="nextHoleBtn" style="display:none; position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); z-index:999; padding:15px 40px; font-size:1.5rem; font-family:\'Orbitron\',sans-serif; font-weight:900; background:linear-gradient(135deg,#6600cc,#aa00ff); border:2px solid #fff; border-radius:12px; color:#fff; box-shadow:0 0 20px #a200ff; cursor:pointer; text-align:center;">NEXT HOLE ➔</button>'
content = content.replace(next_hole_old, next_hole_new)

with open(new_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Created {bk_file} and {new_file}")

with open('golf_play_caddy_vercel/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
print('Length of golf_play_caddy_vercel/index.html:', len(text))
courses = re.findall(r'id:\s*["\']([^"\']+)["\'],\s*name:\s*["\']([^"\']+)["\']', text)
print('Courses count:', len(courses))
print('Sample courses:', courses[:6])
hole_arrays = re.findall(r'const\s+([A-Z0-9_]+18HOLES)\s*=', text)
print('Hole arrays found:', len(hole_arrays), hole_arrays)

# 2タップ登録の有無
print('has quick snap:', 'toggleQuickSnapMode' in text or 'quick-snap' in text)
# キャリブレーションの保存関数の確認
print('saveCalibratedTeePinCoord:', 'saveCalibratedTeePinCoord' in text)
print('saveCurrentHoleCalibration:', 'saveCurrentHoleCalibration' in text)
print('saveCurrentHoleIps:', 'saveCurrentHoleIps' in text)
print('commitRoundWizard:', 'commitRoundWizard' in text)

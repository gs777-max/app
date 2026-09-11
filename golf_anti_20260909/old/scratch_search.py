import sys

with open('golf_3d_20260908_1_777.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

out = []
for i, line in enumerate(lines):
    if 'nextholebtn' in line.lower() or 'next hole' in line.lower() or 'nexthole' in line.lower():
        out.append(f"NEXTHOLE [{i+1}]: {line.strip()}")
    if 'trace' in line.lower():
        out.append(f"TRACE [{i+1}]: {line.strip()}")

with open('search_out.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))

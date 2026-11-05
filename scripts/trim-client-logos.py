import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; sheet = sys.argv[2]
files = sorted(f for f in os.listdir(d) if not f.endswith('.svg'))
cells = []
for f in files:
    p = os.path.join(d, f)
    im = Image.open(p).convert('RGBA')
    px = im.load(); w, h = im.size
    xs = []; ys = []
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 24 and not (r > 236 and g > 236 and b > 236):
                xs.append(x); ys.append(y)
    if xs:
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        pad = max(2, int(0.04 * max(x1 - x0, y1 - y0)))
        box = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad + 1), min(h, y1 + pad + 1))
        im = im.crop(box)
    fmt = 'PNG' if f.lower().endswith('.png') else 'JPEG'
    out = im if fmt == 'PNG' else im.convert('RGB')
    out.save(p, fmt, **({'quality': 95, 'subsampling': 0} if fmt == 'JPEG' else {}))
    cells.append((f, out.convert('RGBA')))
# contact sheet
C = 140; cols = 8; rows = (len(cells) + cols - 1) // cols
S = Image.new('RGB', (cols * C, rows * (C + 14)), 'white'); dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(cells):
    cx, cy = (i % cols) * C, (i // cols) * (C + 14)
    t = im.copy(); t.thumbnail((C - 20, C - 20))
    S.paste(t, (cx + (C - t.width) // 2, cy + (C - t.height) // 2), t)
    dr.text((cx + 4, cy + C), f'{i} {im.width}x{im.height}', fill='black')
    dr.rectangle([cx, cy, cx + C - 1, cy + C - 1], outline='#ddd')
S.save(sheet)
for i, (f, im) in enumerate(cells): print(i, f, im.size)

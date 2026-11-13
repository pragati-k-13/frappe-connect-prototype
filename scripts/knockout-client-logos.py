"""Turn a light logo printed on a filled box into dark ink on transparency.

Usage: python3 -I scripts/knockout-client-logos.py <in> <out.png> [--crop x0,y0,x1,y1]

The box color is read from the image's edge (or the crop's edge). Every pixel's
distance from that color, against white's distance from it, becomes the
alpha of one dark ink, so the white artwork turns dark and the box vanishes.
Anti-aliased edges keep their softness. The result is trimmed to the artwork
with ~4% padding, like trim-client-logos.py. Needs Pillow.

Any color inside the artwork (a yellow swoosh, red letters) becomes the same
ink: these logos show as one tone in the strip anyway.
"""
import sys
from PIL import Image

INK = (23, 23, 23)


def main():
    src, out = sys.argv[1], sys.argv[2]
    im = Image.open(src).convert('RGB')
    if '--crop' in sys.argv:
        box = tuple(int(v) for v in sys.argv[sys.argv.index('--crop') + 1].split(','))
        im = im.crop(box)
    w, h = im.size
    px = im.load()
    edge = [px[x, y] for x in range(w) for y in (0, h - 1)] + [px[x, y] for y in range(h) for x in (0, w - 1)]
    bg = tuple(sorted(p[i] for p in edge)[len(edge) // 2] for i in range(3))
    span = sum((255 - c) ** 2 for c in bg) ** 0.5 or 1

    res = Image.new('RGBA', (w, h))
    rp = res.load()
    for y in range(h):
        for x in range(w):
            d = sum((a - b) ** 2 for a, b in zip(px[x, y], bg)) ** 0.5
            a = min(1.0, d / span)
            # Ignore JPEG noise in the box itself.
            a = 0 if a < 0.12 else a
            rp[x, y] = (*INK, round(a * 255))

    bbox = res.getbbox()
    if bbox:
        pad = round(max(bbox[2] - bbox[0], bbox[3] - bbox[1]) * 0.04)
        res = res.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad)))
    res.save(out)


if __name__ == '__main__':
    main()

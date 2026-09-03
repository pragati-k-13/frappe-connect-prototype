"""Generate placeholder media for the partner profile gallery.

Deliberately abstract: soft gradients with a faint grid, so nobody mistakes
these for real partner footage.

All neutral grey, on purpose. Coloured placeholders read as design decisions —
a saturated blue-to-green tile looks like a chosen brand treatment rather than
a hole waiting for a real asset, and four of them in one gallery turn the page
into a swatch board. Grey stays legibly unfinished, and it lets the layout,
the poster, the play affordance and the lightbox be judged without the art
competing. The three stills differ only in value, so they read as three
distinct images without introducing a palette.

Outputs into src/assets/media/:
  placeholder-reel.mp4    a real, playable H.264 clip (8s, silent, loops)
  placeholder-reel-poster.jpg  its first frame, used as the poster
  placeholder-1..3.jpg    stills for the rest of the gallery
"""
import math
import subprocess
import os
from PIL import Image, ImageDraw

import imageio_ffmpeg

FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "assets", "media")
os.makedirs(OUT, exist_ok=True)

W, H = 1280, 720
FPS = 25
SECONDS = 8


def lerp(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def frame(t, a, b, grid=True):
    """One frame. `t` in [0,1) drives a slow diagonal drift, seamless at the wrap."""
    im = Image.new("RGB", (W, H))
    d = ImageDraw.Draw(im)
    # Diagonal two-stop gradient, drawn as horizontal bands offset by the phase.
    phase = math.sin(t * 2 * math.pi) * 0.18
    for y in range(H):
        f = y / (H - 1)
        im_t = min(max(f + phase, 0.0), 1.0)
        d.line([(0, y), (W, y)], fill=lerp(a, b, im_t))
    # Soft highlight orbiting slowly — this is what reads as motion when played.
    cx = W * (0.5 + 0.28 * math.cos(t * 2 * math.pi))
    cy = H * (0.5 + 0.22 * math.sin(t * 2 * math.pi))
    glow = Image.new("L", (W, H), 0)
    gd = ImageDraw.Draw(glow)
    for i in range(26):
        r = 420 - i * 15
        gd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=int(2.2 * i))
    im = Image.composite(Image.new("RGB", (W, H), (255, 255, 255)), im, glow.point(lambda v: v // 3))
    if grid:
        # Faint grid: the "this is a placeholder" tell, at ~4% contrast.
        g = ImageDraw.Draw(im, "RGBA")
        for x in range(0, W, 80):
            g.line([(x, 0), (x, H)], fill=(255, 255, 255, 16))
        for y in range(0, H, 80):
            g.line([(0, y), (W, y)], fill=(255, 255, 255, 16))
    return im


# --- the clip -----------------------------------------------------------------
A, B = (168, 173, 181), (88, 94, 103)  # mid grey -> deep grey
proc = subprocess.Popen(
    [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
     "-r", str(FPS), "-i", "pipe:0",
     "-c:v", "libx264", "-preset", "slow", "-crf", "30",
     "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an",
     f"{OUT}/placeholder-reel.mp4"],
    stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE,
)
total = FPS * SECONDS
for i in range(total):
    proc.stdin.write(frame(i / total, A, B).tobytes())
proc.stdin.close()
err = proc.stderr.read().decode(errors="replace")
if proc.wait() != 0:
    raise SystemExit("ffmpeg failed:\n" + err[-2000:])

# Poster = frame 0, so the still and the first played frame agree.
#
# Named `-poster` rather than sharing the clip's basename: `data/media.js` globs
# this folder and keys by basename, and a production build rewrites both to
# content-hashed URLs — so deriving the poster's path from the video's by
# swapping the extension would break.
frame(0, A, B).save(f"{OUT}/placeholder-reel-poster.jpg", quality=82, optimize=True)

# --- the stills ---------------------------------------------------------------
# Same ramp, three different stretches of it — light, mid, dark.
STILLS = [
    ((205, 209, 215), (139, 145, 154)),
    ((151, 157, 165), (96, 102, 111)),
    ((186, 191, 198), (72, 78, 87)),
]
for n, (a, b) in enumerate(STILLS, start=1):
    frame(0.3 * n, a, b).resize((960, 540), Image.LANCZOS).save(
        f"{OUT}/placeholder-{n}.jpg", quality=82, optimize=True
    )

for f in sorted(os.listdir(OUT)):
    print(f"{os.path.getsize(os.path.join(OUT, f)):>9,} B  {f}")

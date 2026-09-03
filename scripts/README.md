# Placeholder asset generators

One-shot scripts that produce the stand-in art in `src/assets/media/` and
`src/assets/clients/`. Committed so the placeholders are reproducible rather
than mystery binaries — **delete both once the real assets land.**

```bash
python3 -m venv .venv
.venv/bin/pip install pillow imageio-ffmpeg
.venv/bin/python scripts/gen-placeholder-media.py
.venv/bin/python scripts/gen-placeholder-clients.py
```

`imageio-ffmpeg` is only needed by the media script, and only to encode
`placeholder-reel.mp4` — a real, playable 8-second H.264 clip, so the video
controls, poster and lightbox can be reviewed for real instead of mocked. It
downloads its own ffmpeg binary; nothing is installed system-wide, and the app
itself has no Python dependency.

**The client names are fictional** (Northwind, Kestrel, Aurelia…). The partners
in this mock are real companies, but who their clients are isn't something the
public directory publishes — a real brand in that strip would assert a
commercial relationship nobody verified.

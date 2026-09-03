"""Generate placeholder client logos for the profile logo strip.

Fictional on purpose. The partners in this mock are real companies; who their
clients are is not something the public directory publishes, so putting a real
brand here would assert a commercial relationship nobody verified. These are
obviously-invented names with abstract marks, sized and weighted like the real
thing so the strip's rhythm is reviewable.

Mono-grey (#6b7280) because logo strips are conventionally desaturated so they
read as one row rather than competing.
"""
import os

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "assets", "clients")
os.makedirs(OUT, exist_ok=True)

INK = "#6b7280"

# (slug, display name, mark) — mark is SVG drawn inside a 26x26 box at x=0,y=3
MARKS = {
    "ring": '<circle cx="13" cy="16" r="9" fill="none" stroke="{ink}" stroke-width="3.4"/>',
    "wedge": '<path d="M4 25 L13 7 L22 25 Z" fill="{ink}"/>',
    "diamond": '<path d="M13 6 L23 16 L13 26 L3 16 Z" fill="{ink}"/>',
    "bars": '<rect x="4" y="8" width="4.4" height="16" rx="2.2" fill="{ink}"/>'
            '<rect x="11" y="12" width="4.4" height="12" rx="2.2" fill="{ink}"/>'
            '<rect x="18" y="6" width="4.4" height="18" rx="2.2" fill="{ink}"/>',
    "hex": '<path d="M13 6 L21 11 L21 21 L13 26 L5 21 L5 11 Z" fill="none" '
           'stroke="{ink}" stroke-width="3"/>',
    "arc": '<path d="M4 24 A9 9 0 0 1 22 24" fill="none" stroke="{ink}" '
           'stroke-width="3.4" stroke-linecap="round"/><circle cx="13" cy="24" r="2.6" fill="{ink}"/>',
    "cross": '<path d="M13 6 V26 M3 16 H23" stroke="{ink}" stroke-width="3.4" stroke-linecap="round"/>',
    "stack": '<rect x="3" y="7" width="20" height="5" rx="2.5" fill="{ink}"/>'
             '<rect x="6" y="14" width="17" height="5" rx="2.5" fill="{ink}"/>'
             '<rect x="3" y="21" width="20" height="5" rx="2.5" fill="{ink}"/>',
    "orbit": '<circle cx="13" cy="16" r="4" fill="{ink}"/><ellipse cx="13" cy="16" rx="10" ry="5" '
             'fill="none" stroke="{ink}" stroke-width="2.2" transform="rotate(-24 13 16)"/>',
    "chevron": '<path d="M5 8 L13 16 L5 24 M14 8 L22 16 L14 24" fill="none" stroke="{ink}" '
               'stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>',
}

CLIENTS = [
    ("northwind", "Northwind", "ring", 600),
    ("kestrel", "Kestrel", "wedge", 700),
    ("aurelia", "Aurelia", "diamond", 500),
    ("vantage", "Vantage", "bars", 700),
    ("meridian", "Meridian", "hex", 500),
    ("bluecrest", "Bluecrest", "arc", 600),
    ("halcyon", "Halcyon", "cross", 500),
    ("orenda", "Orenda", "stack", 700),
    ("silverpine", "Silverpine", "orbit", 500),
    ("tessellate", "Tessellate", "chevron", 600),
]

FONT = ("ui-sans-serif,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif")

for slug, name, mark, weight in CLIENTS:
    # Width tracks the name length so the strip has believable variety.
    text_w = round(len(name) * 9.6)
    w = 30 + text_w
    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 32" width="{w}" height="32" role="img" aria-label="{name}">
  <title>{name} (placeholder)</title>
  {MARKS[mark].format(ink=INK)}
  <text x="32" y="22" font-family="{FONT}" font-size="16" font-weight="{weight}"
        letter-spacing="-0.2" fill="{INK}">{name}</text>
</svg>
"""
    with open(f"{OUT}/{slug}.svg", "w") as fh:
        fh.write(svg)

print(f"wrote {len(CLIENTS)} client logos to {OUT}")
for f in sorted(os.listdir(OUT)):
    print(f"  {os.path.getsize(os.path.join(OUT, f)):>5} B  {f}")

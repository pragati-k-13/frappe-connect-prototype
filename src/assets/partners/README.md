# Partner logos

These are the **real** logos, downloaded from the live Frappe partner directory
(`frappe.io/partners/list?country=…`).

Files are named after the partner's **id** — the slug `P()` derives from the
partner name in `src/data/partners.js`. `src/data/logos.js` globs this folder
and `PartnerRow` picks the file up automatically: no import to write, no data
field to set. A partner with no file falls back to the initials tile.

`.svg`, `.png`, `.jpg` and `.webp` all work. The row renders them
`object-contain` in a 44px box on white.

## These are crops, not the originals

Every file here has been **cropped to the partner's logomark** — the glyph only,
with the wordmark cut away. The originals are full lockups, mostly 2–5× wider
than tall; `object-contain` in a 44px box turned those into an illegible strip
7px tall. Cropped to the mark they land between 0.7:1 and 1.7:1 and actually
fill the box.

Each crop takes a rough region of the original, tightens to the ink inside it,
and pads by 4% of the mark's longest side, so the marks are optically the same
size as each other rather than each sitting in whatever whitespace its export
happened to carry.

Three are left **uncropped**, because they have no mark to separate out — the
logo *is* the lettering, and slicing a single letter out of a wordmark makes a
monogram the partner doesn't actually use:

- **`hybrowlabs.webp`** — wordmark. The blue `H` is a coloured first letter, not
  a mark.
- **`korecent.jpg`** — wordmark. The orange slashed *o* is the only
  non-typographic element, and it sits inside the word.
- **`8848-digital.svg`** — the logo is the numerals. Trimming the "DIGITAL" line
  under them only makes the aspect ratio worse.

These three are the rows where the logo reads as small text at 44px. That's the
accepted trade-off: the real logo, small, beats an invented one.

Re-cropping? Work from the originals in the live directory, not from these
files — the marks have already lost their surrounding whitespace.

| File | Partner | Country |
|---|---|---|
| `tridots-tech.svg` | Tridots Tech | India |
| `software-work.png` | Software@Work | India |
| `new-indictrans.png` | New Indictrans | India |
| `8848-digital.svg` | 8848 Digital | India |
| `greycube-technologies.png` | Greycube Technologies | India |
| `wahni.jpg` | Wahni | India |
| `hybrowlabs.webp` | Hybrowlabs | India |
| `finbyz-tech.png` | Finbyz Tech | India |
| `alyf.png` | ALYF | Germany |
| `craft-interactive.png` | Craft Interactive | UAE |
| `kingstech-services.png` | Kingstech Services | Singapore |
| `navari.jpg` | Navari | Kenya |
| `korecent.jpg` | Korecent | United States |

Adding a partner? The id is `name.toLowerCase().replace(/[^a-z0-9]+/g, '-')`.
Each country page in the directory renders
`<a href="/partners/<country>/<slug>"><img class="card-logo" …><div class="card-name">`,
so pulling more is a short scrape.

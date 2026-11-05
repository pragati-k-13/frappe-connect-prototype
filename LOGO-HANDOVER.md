# Logos: how they're handled

Read this before touching any logo or thumbnail in Connect. Update it whenever a
logo decision changes.

Last updated: 2026-11-05.

## Rules from Pragati

- **Real logos only.** Take them from the partner's frappe.io page or the client's
  own site. Never invent one when a real one exists.
- **Don't crop past the logo's resolution.** Cutting a logomark out of a wordmark
  is fine only if the crop has at least 2× the display size in pixels. Crops of
  ~40px marks blurred when scaled up and were undone.
- **Scale down only, never up.** Use `max-h-full max-w-full object-contain`, not
  `size-full`, on raster logos in a box.
- **Color in lists, gray in the strip.** Success-story rows show logos in full
  color. Only the client strip under the gallery is gray.
- **No outlines or boxes** around logos in rows.

## Where each kind lives

| Kind | Files | Resolved by | Shown in |
|---|---|---|---|
| Partner logos | `src/assets/partners/<partner-id>.{svg,png,jpg,webp}` | `logoFor(id)` in `src/data/logos.js`, by filename | Directory rows, profile header, threads. No file gives an initials tile. |
| Client logos | `src/assets/clients/<partner-id>--<client-slug>.<ext>` (63) | `logoFor(name)` in `src/data/stories.js`, via the `logo` field of each story | Success stories rows and featured story, client strip |
| Featured thumbnails | `src/assets/featured/` (podcast-<youtubeId>.jpg, story-<name>.png) | `thumb()` in `src/data/featured.js` | Featured by Frappe rows |
| Frappe mark | `src/assets/frappe.svg` | added by hand to `LOGOS` | Starter Pack threads |

A firm with two country listings shares one logo. `wahni-it-solutions-fze` maps to
`wahni` in `logos.js`, and the same goes for its featured items (`FIRM` in
`featured.js`).

## Client logos

- **Source:** the customer logo on each partner's success stories at
  frappe.io/partners. Finbyz, ALYF and Momscode have no stories, so they have no
  client logos.
- **Originals:** untouched downloads are in `scripts/client-logos-orig/`.
- **Trim:** `scripts/trim-client-logos.py <dir> <sheet.png>` crops white space to
  ~4% padding, in place, saving JPEGs at quality 95 with no chroma subsampling.
  It also writes a contact sheet to check the result. Run it on a copy, with
  Pillow (`python3 -m venv` then `pip install pillow`).
- **FerTech** (`wahni--fertech.png`) is the untrimmed original, on purpose. Its
  trim looked worse.
- **Cache-bust:** `stories.js` adds `?v=2` to every client logo URL, because the
  files were edited in place and Vite kept serving the old ones. Bump it if you
  edit files in place again.
- **Unmatched invented ones:** the 10 placeholder SVGs (northwind, kestrel …)
  are deleted. `scripts/gen-placeholder-clients.py` still generates them and
  nothing uses it.

## How they're displayed

- **Featured story** (`PartnerStoriesSection.vue`): `h-7 max-w-36 object-contain
  object-left`, so 28px tall at most. No logo shows the client name as text.
- **Story rows:** a fixed `h-10 w-14` box, logo scaled down only. No logo shows
  an initials tile (`size-10 rounded-4 bg-surface-gray-2`).
- **Client strip** (`ClientStrip.vue`): one entry per customer from the
  partner's stories (`clientsFor(id)` in `src/data/media.js`), 5 slots, `h-8
  max-w-32`, `opacity-50`. Partners with no stories show no strip.
- **Strip gray:** an SVG filter `#client-ink` in `ClientStrip.vue` removes color,
  then applies a gamma curve (exponent 4). It darkens mid-tones toward ink while
  white stays white, so pale logos match dark ones and JPG white backgrounds
  don't turn gray. Plain `grayscale` left pale logos (Santi, Exotherm) faint, and
  `contrast-200` pushed them to white.

## Known gaps

- **RaajaRam** (Wahni) is drawn on a filled box, so it reads darker in the strip.
  Only an edited file fixes it.
- **Dark mode is unchecked.** JPGs with white backgrounds will likely show as
  light boxes on a dark page.
- **Production:** for an exactly even strip, prepared one-color logos with
  transparent backgrounds would replace the filter.

# Logos: how they're handled

Read this before touching any logo or thumbnail in Connect. Update it whenever a
logo decision changes.

Last updated: 2026-11-13 (client logos come only from success stories).

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
- **Boxed logos knocked out:** white artwork printed on a filled box showed as
  floating gray boxes. `scripts/knockout-client-logos.py <in> <out.png> [--crop
  x0,y0,x1,y1]` turns the box transparent and the artwork into one dark ink,
  trimmed to ~4% padding. Done for Chewy, Supreme Tile, Avon, Bren, DFM Foods,
  Opptra (cropped 6px to drop a JPEG edge), Plumage, Pupa and Sansel. Avon,
  DFM and Opptra became `.png`; `logoFor` matches by name, so the data didn't
  change. Colored parts of the artwork (Bren's swoosh) become the same ink.
  Find more with an edge-color check: a solid, non-white border.
- **Optical size:** the strip fits every logo into the same 128×32 box, so a
  compact, solid mark fills the full height and looks bigger than thin, wide
  wordmarks. Finmart (`tridots-tech--finmart.jpg`) has 17% white margin added
  so its F renders about 24px tall. Do the same for any other mark that looks
  heavy.
- **Off-white backgrounds:** the strip's gray curve keeps pure white white but
  darkens near-white into a visible box. Adeco
  (`craft-interactive--adeco-technologies.jpg`) had #F7F7F7; its white point
  was moved to 240 so the background is pure white, artwork unchanged. Making
  it transparent instead amplified JPEG noise. It was the only such logo.
- **FerTech** (`wahni--fertech.png`) is the untrimmed original, on purpose. Its
  trim looked worse.
- **Cache-bust:** `stories.js` adds `?v=5` to every client logo URL, because the
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

## Featured thumbnails

- Each story's cover is its frappe.io og:image, saved at 320px wide. Craft
  Interactive's og:image link is a 404, so `story-craft-interactive.png` is the
  cover inside the article (`CI cover imagef64405.png`), added 2026-11-05.

## Partner editing (edit page)

- Partners don't upload client logos (decided 2026-11-13). Every logo comes
  from a published success story (`clientsFor` in `data/media.js`). Adding a
  client means submitting a story on frappe.io, which is the edit grid's one
  header action. The add-by-website, upload, 200px minimum and 20-logo cap
  are gone.
- The edit grid (`ClientLogoGrid.vue`) is titled "Clients from your success
  stories". Each logo's ⋯ menu: View story, Move earlier, Move later,
  Hide/Show. Hiding keeps the story and drops the logo from the strip; hidden
  logos stay in the grid, dimmed, with a "Hidden" badge.
- Reorder and hide are part of the page draft (`draftLogos` in
  `OwnProfilePage.vue`): they wait for Publish, and Discard undoes them.
- Published logos reach the directory: `PartnerProfilePage` reads them through
  `published()` in `stores/partnerAccount.js`. Both pages render
  `PartnerProfileBody.vue`.

## Known gaps

- **RaajaRam** (Wahni) is a navy box over dark text on white, so the knockout
  script can't take it whole. It still reads darker in the strip; it needs a
  hand-edited file.
- **Dark mode is unchecked.** JPGs with white backgrounds will likely show as
  light boxes on a dark page.
- **Production:** for an exactly even strip, prepared one-color logos with
  transparent backgrounds would replace the filter.

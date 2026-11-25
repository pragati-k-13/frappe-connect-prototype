# File-type icons

Frappe Suite's Drive file icons, so collateral in Connect looks the way it does
in Drive at suite.frappe.io. Not logos: they're icons, used as CSS classes.

| File | Source |
| --- | --- |
| `folder.svg`, `slides.svg`, `pdf.svg`, `image.svg`, `archive.svg` | github.com/frappe/suite, `frontend/src/apps/drive/files/internal/file-icons/` (develop @ 06ba763, AGPL-3.0) |
| `file-icons.css` | adapted from the same folder's `icons.css` |

Use like a lucide class: `<span class="file-icon-slides size-4 text-ink-orange-6" />`.
Each type's ink colour comes from Suite's `icons.ts` (`TINTS`) and lives in
`FILE_TYPES` in `src/data/collateral.js`. To add a type, copy its SVG from Suite,
add a line to `file-icons.css`, and give it a tint.

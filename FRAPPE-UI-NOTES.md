# frappe-ui notes

Things about frappe-ui that cost time while building this prototype, none of which are
specific to Frappe Connect. Recorded here because the next person will hit them too.

The common thread: **almost none of these fail loudly.** A dead class emits no error and
no warning — it just doesn't render, which looks like a design choice rather than a bug.
Every one below was caught by measuring the DOM, not by reading the screen.

## ⚠️ frappe-ui replaces parts of the Tailwind theme

This cost real debugging time twice, so it's worth stating plainly. frappe-ui's
preset assigns to `theme.colors` and `theme.borderRadius` — **not**
`theme.extend.*` — which **replaces** Tailwind's defaults. Anything outside the
replacement silently compiles to nothing: no error, no warning, just an element
with no fill or square corners.

**Radius.** `rounded-sm/md/lg/xl/2xl` and the bare `rounded` do not exist. The
scale is numeric:

```
rounded-0  0px     rounded-3  6px     rounded-6  12px    rounded-9  999px
rounded-1  4px     rounded-4  8px     rounded-7  16px    rounded-full
rounded-2  5px     rounded-5  10px    rounded-8  20px
```

frappe-ui's own components use `rounded-4` for controls and `rounded-5/6` for
containers; this mock follows that. Corner-direction variants still compose
normally (`rounded-t-full`).

**Color.** Only these families exist:

```
gray  blue  green  red  orange  yellow  teal  violet  cyan  amber  pink  purple
black  white  white-overlay  black-overlay   (+ dark-* variants)
```

`slate`, `sky`, `emerald`, `lime`, `rose`, `indigo`, `fuchsia`, `zinc`,
`neutral` and `stone` are all gone. Prefer the semantic tokens
(`text-ink-gray-*`, `bg-surface-*`, `border-outline-gray-*`) over raw palette
classes anyway.

Three more traps in the same family:

- There is no `bg-surface-white`. The token is **`bg-surface-base`**.
- There is no `text-ink-white`. Use **`text-white`**.
- `bg-gray-*` only ships shades `100, 300, 400, 500, 900` — not the full ramp.

Because none of this errors, the only reliable check is to diff the classes you
wrote against the CSS Tailwind actually emitted. Build, then grep
`dist/assets/index-*.css` for each class before trusting it.

Placeholder art (partner logos, story covers, the photo block) uses **inline
hex**, not Tailwind classes. That sidesteps the palette issue entirely and makes
it obvious these are stand-ins for real assets rather than design tokens.

## Traps found the hard way

Each of these is written up in full where it bit, in
[DESIGN-NOTES.md](DESIGN-NOTES.md) and in the component's own comments.

**Design tokens are scoped by CSS property.** `ink-*` is text only, `outline-*` is border
only, `surface-*` is background only. Using one scale as another compiles to nothing.
Cost three separate bugs here: `bg-outline-gray-1` (a hairline that never drew),
`bg-outline-gray-3` (a sidebar seam that had never drawn since the day it was added), and
`bg-surface-modal` (a token that doesn't exist at all — the panel background is
`bg-surface-elevation-1`).

**The `surface-*` tokens aren't in the gradient palette.** `bg-gradient-to-b
from-transparent to-surface-elevation-1` compiles to `background-image: none`. Use the
variable directly: `var(--surface-elevation-1)`.

**Only the shades actually used get a utility.** `text-ink-amber-5` exists;
`text-ink-amber-1` through `-4` render black. Test the exact shade before relying on it.

**`Dialog` exposes only `default`, `title` and `actions`.** `#body-content` is an older
API that fails silently — you get a titled panel with an empty middle.

**`Dialog`'s `message` prop is only the default slot's fallback.** Any dialog with a body
of its own therefore has no accessible description, and reka-ui warns that
`aria-describedby` is unset. Import `DialogDescription` from reka-ui and render it
`as-child`.

**`Dialog`'s `size` is an enum of `max-w-*` steps.** If the width you want isn't one of
them, the panel takes no class of yours — hook it from inside with
`.dialog-content:has(.your-marker)`. Its padding is hardcoded the same way.

**`ScrollArea`'s height cap goes on `viewport-class`, not the root.** The root is
`overflow-hidden` and the viewport is `h-full`, which against a root carrying only a
max-height resolves to auto — so a cap on the root clips the content and never scrolls
it. Looks perfect in a screenshot; `scrollHeight > clientHeight` returns `false`.

**`Avatar` hardcodes `object-cover`.** Fine for faces, wrong for logos — a wide logomark
gets cropped to nothing. Override with `object-fit: contain` in CSS. Its `size` prop also
yields to any unprefixed sizing utility in `class`.

**`Alert`'s row layout is a fixed `h-10` with `truncate`.** A title-only Alert has to fit
on one line; anything longer needs `description`, which switches it to the banner layout.
Its automatic theme glyph is a filled disc, so pass `icon` explicitly to match outline
lucide icons.

**`divide-y` outranks any reasonable hover selector.** Its colour lands via
`.divide-… > :not([hidden]) ~ :not([hidden])` — three class-level components. A
`:hover` rule to suppress a divider simply never applies. Put the border on the row
itself and use a hover variant.

**`SidebarItem` matches the whole path, not a prefix.** Active state is inferred
with `current.path === target.path`, so an item pointing at a parent route lights
up on that route only — every child screen shows no location at all. Pass
`:active` explicitly for any item that heads a section of the app.

**`Sidebar`'s spacing is tuned for the collapsed rail, not the expanded one.**
The 48px collapsed width, the header's 10px logo indent and the item's 16px icon
indent (viewport `px-2` + the item's `pl-2`) exist so that a 28px logo box and a
16px icon are _both_ centred on 24px. The 6px left-edge stagger you see when
expanded is the price of that, and it can't be removed without un-centring the
collapsed rail — the two boxes are different sizes. `px-2` on the viewport is
also what keeps an active row's `shadow-sm` clear of the `ScrollArea` root's
`overflow-hidden`.

**There is no Accordion, Collapsible or Table.** reka-ui has the first two. The `list`
family is a separate import subpath (`frappe-ui/list`) with its own stylesheet.

**No currency or number formatter is exported.** The chart formatters are deliberately
unexported because they hardcode `en-US`.

## Not frappe-ui, but adjacent

**A sticky `<thead>` positions but doesn't paint.** Put `sticky`, the background and the
z-index on the `th` cells. And its `border-b` scrolls away — in a `border-collapse` table
the collapsed border belongs to the table, not the cell — so draw the rule with an inset
`box-shadow`, which paints with the cell.

**A `<tr>` cannot take padding.** CSS tables ignore it. Fold a row's padding into its
cells.

**An empty block still contributes its margin.** A `<div class="mt-24">` whose contents
`v-if` away collapses its margins _through_ itself, leaving the gap behind. Put the
margin on the thing that can disappear.

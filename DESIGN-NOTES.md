# Frappe Connect — design notes

The reasoning behind every screen in this prototype: what each decision was, what it
replaced, and what was measured to settle it. Split out of the README, which had grown to
a fifty-minute read on the front page of the repo.

Library-level traps that aren't specific to Connect live in
[FRAPPE-UI-NOTES.md](FRAPPE-UI-NOTES.md) instead.

## Decisions worth knowing

**No dividers between a page's own sections.** Nothing between the profile's header,
gallery and client strip; nothing between the sidebar's groups. Those are separated with
space — if two blocks need a line between them to read as separate, they weren't spaced
properly.

⚠️ **This does not extend to structural strokes, and I over-applied it twice.** A stroke
that is part of a component's anatomy stays:

| Stroke                           | Why it stays                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Under the top bar                | The edge of the chrome. Marks where the fixed bar ends and the scroll region begins; without it, content scrolls up against nothing.                                                                                                                                                                                           |
| Between listing rows             | List structure. It's what makes a run of rows read as a list rather than loose paragraphs. On the row, not `divide-y` on the container — the mid-list app refinement splits the listing in two, and `divide-y` would drop the rule either side of it. Hidden around a hovered row, and on the last row of each run, see below. |
| Inside the About / Services card | Card anatomy: a header rule per column, a column rule between the two, and inset rules between label/value pairs.                                                                                                                                                                                                              |
| Starter-packs comparison table   | Table structure.                                                                                                                                                                                                                                                                                                               |
| The mock frappe.io header        | Part of imitating that page.                                                                                                                                                                                                                                                                                                   |

The test is whether removing it loses information about _what something is_, rather than
just removing a line between two things that are already apart.

**One auth CTA, on every screen: the ghost "Log in or create account".** This used to
promote to a solid "Create account" on the results and profile screens. A solid button in
the app chrome outranks the page's own primary action — on the profile it read louder
than Contact, which is the entire point of the page.

**Connect does not open on a listing.** The hero _is_ the qualifier. The list is what you
get for answering. Everything below the fold — starter packs, success stories, footer CTA
— exists for people who aren't ready to answer yet, and every one of those CTAs routes
back into the same three questions rather than skipping past them.

**Every question is skippable.** A skipped answer stores `null`, which the results filter
reads as "no constraint" — identical to never having been asked. So skip needs no special
handling downstream, and if it gets cut later only the quiz page changes.

**Q1 branches, whichever group you pick.** All four industry groups have real sub-segments
in the directory's taxonomy, so choosing any of them reveals a required segment dropdown
inline, under the selected radio, rather than as a fourth step — the count stays 3/3.
Continue is blocked until a segment is picked, with Skip as the honest escape hatch. The
quiz asks for one segment; the store holds an array, because the results filter merges
industry and segment into a single multi-select that can widen it.

**Region takes more than one answer.** It's the only multi-answer question: businesses
routinely work with partners in more than one region, and each region has enough partners
that forcing a single choice throws away good matches. The chips are toggles, and
`answers.region` is an array where `[]` means "no constraint" — the same role `null` plays
for the single-answer questions. The results filter mirrors it with frappe-ui's
`MultiSelect`, so arriving at the list can't silently drop all but one of the regions you
picked. Matching is a union: a partner qualifies if their region is any of the answered
ones.

**Region is pre-answered from inferred location**, so that question costs a confirmation
instead of a decision. The store's `inferredRegion` getter is the seam where real GeoIP
goes; it currently hardcodes the common case.

⚠️ There used to be a "Guessed from your connection — change it if that's wrong" line
under the chips, on the argument that a silently pre-filled answer is the dishonest
version. It was cut for being visual noise. The pre-fill is still silent, so if that
honesty matters to you, `store.regionInferred` is still set and still cleared on the first
real pick — the flag is intact, only its disclosure is gone.

**Quiz answers become filter state, and stay editable.** The results filter bar is seeded
from the answers, so someone who over-narrowed can widen without redoing the quiz, and a
skipped question shows as an unset filter rather than an invisible constraint.

**Every quiz question has a control in the bar; nothing filters silently.** That claim was
briefly false: Q3 (implementation) had no control and filtered invisibly, while the bar
offered a starter-pack picker the quiz never asked about. The bar is now exactly four
controls — search, region, industry/segment, implementation — one per question plus search,
and the pack picker is gone. A pack is something you choose on a partner's profile, not a
way to narrow the list of partners.

**Industry and segment are ONE control, not two.** They used to be chained Selects: pick a
group, and a second control appeared to narrow inside it. That was two controls for one
dimension, an option list you could only reach through its parent, and no way to express
"Discrete Manufacturing _or_ Logistics". They are now a single `MultiSelect` with grouped
options — the industry is the **group label** and its segments are the options. Nothing is
selectable at the group level, because nothing in the data is tagged there: partners carry
segment names.

Several segments read as a union ("any of these"), the same way several regions do. The
trigger summarises: one segment shows its name, every segment of one group collapses to
that group's label ("Manufacturing"), anything else reads "N segments" — so a whole-group
selection doesn't hide behind "12 selected".

`answers.industry` survives as the answer to Q1 and **nothing more — it does not filter**.
`answers.segments` is the whole constraint: the quiz writes the one segment it asked for,
and the bar can widen that to any set across any groups.

⚠️ `implementation: 'standard'` is meant to exclude partners who sell no starter packs —
but all 13 partners in the roster have at least one, so on this data it narrows nothing.
The rule is right; the roster just has no counter-example. Give a partner `packs: []` if
you want to see it bite.

**The app-refinement question sits mid-list** (after row 5) on purpose: it's worth asking
once someone has seen enough rows to know the list is too broad, and it costs nothing to
ignore.

## Partner profile — the top section

⚠️ **Down to Marketplace contributions.** The header, media gallery, client strip, the
About / Services and Expertise card, Partner vision, Pricing, Reviews, Success stories and
Marketplace contributions are built. Anything below that is the next pass.

**The subtitle is the partner's own strapline.** It used to be a generated
"city · N success stories" line, which restated two things the page already shows — the
address is in the About card and the count is the Success stories title. ⚠️ Twelve of the
thirteen straplines are invented; only Tridots Tech's came out of the design file. They
echo that partner's `VISION` copy so the profile reads as one voice. `city` remains only
as a last resort, so a partner added without a tagline doesn't render a blank line.

**Three actions, ordered by weight rather than frequency.** Contact is the page's one
solid button because it's the outcome the whole directory exists to produce; Book a slot
and Save are `subtle` and icon-only so they don't compete with it. Save uses the same
word and the same stateful `aria-label` as the row's bookmark — one control, one
vocabulary, and the same word the sidebar's "Saved partners" uses. (It read "Shortlist"
until the vocabulary was settled on "Save".)

**Everything on this page sits in one 800px column**, including the media gallery. The
client strip is capped narrower still, at 600px: five marks stretched across the full
column read as a banner rather than a footnote.

**"Book a slot" is a real modal, not a scheduler.** Day, then time — times only appear
once a day is chosen, because offering both at once asks for two decisions with no order
and the time depends on the day. The next five _weekdays_ are generated client-side and
every slot is offered: a mock that greys out arbitrary slots invites questions about a
rule that doesn't exist yet. Nothing is submitted.

⚠️ frappe-ui's `Dialog` renders its `message` prop only as the **fallback** of its
default slot, so any dialog with a body of its own silently loses the description — and
the underlying reka-ui primitive then warns that `aria-describedby` is missing. The fix
is to render `DialogDescription` yourself inside the body. Its slots are `default`,
`title`, `actions` — `#body-content` is an older API and fails silently, leaving a panel
with a title, a footer, and nothing in between.

**The video genuinely plays.** `placeholder-reel.mp4` is a real 8-second H.264 clip, not
a fake player, so the poster, the controls and the lightbox can be reviewed for real.

**Every tile does one thing: it opens full-screen.** The clip is no exception — there is
no inline player. Its tile shows the poster with a play glyph and opens in the lightbox,
where the video gets the same room an image would. One target per tile, one behaviour for
the whole gallery. The play glyph is a decorative `<span>` _inside_ the tile's single
button, not a button of its own: nesting one would be invalid HTML, and putting it
alongside would make the tile two targets for the same outcome. The lightbox has
arrow-key navigation that wraps and Escape to close.

**Gallery heights come from the lead tile.** It carries the `aspect-[16/9]`; the side
tiles have `min-h-0` and absolutely-positioned images so they have no intrinsic height
and split the lead's instead — that's what lines all three up top and bottom. Give the
side tiles any height of their own and they drive the row, stretching the lead and
leaving an empty band under a 16:9 poster.

⚠️ Below `sm` the gallery stacks to one column and there is **no lead tile alongside to
supply that height** — so the side tiles get an aspect ratio of their own and become a
2-up row. Without it they collapsed to zero and vanished entirely.

**The logo strip rotates; it does not scroll.** Five fixed slots, ten logos: every 6s one
slot cross-fades (900ms) to the next logo, round-robin. Nothing ever changes position,
which is what keeps it quiet — a marquee moves every logo continuously and pulls the eye
down the page, whereas here the row is still and one cell dissolves. At a 6s interval
with a 900ms fade the strip is static ~85% of the time. It advances a shared cursor
rather than picking at random, so a logo can never appear in two slots at once. Hover
pauses it (a logo dissolving under the cursor mid-read is the one way this becomes
annoying), a hidden tab pauses it (otherwise a backgrounded tab wakes to a queue of
elapsed intervals and the whole row churns), and `prefers-reduced-motion` stops it
entirely.

Below `sm` it drops to **three** slots. Five 132px slots need ~820px with the gaps, so
narrower than that the row wrapped to 4 + 1 — an orphan that reads as a mistake rather
than a second line. The count is tracked in JS, not CSS: hiding two slots with CSS would
leave them rotating, so the row you saw would skip logos.

**Everything visual here is a placeholder.**

| What                  | Where                 | Note                                                 |
| --------------------- | --------------------- | ---------------------------------------------------- |
| Gallery clip + stills | `src/assets/media/`   | Generated **grey** gradients with a faint grid       |
| Client logos          | `src/assets/clients/` | **Fictional companies** — Northwind, Kestrel, …      |
| Generators            | `scripts/`            | Committed so the art is reproducible; delete with it |

⚠️ **The placeholders are grey on purpose**, here and on the success-story covers. A
saturated blue-to-green tile reads as a chosen brand treatment rather than a hole waiting
for a real asset, and four of them in one gallery turn the page into a swatch board. Grey
stays legibly unfinished, and it lets the layout, the poster, the play affordance and the
lightbox be judged without the art competing. The three stills differ by value only, so
they read as three distinct images without introducing a palette.

⚠️ The client logos are invented deliberately. The partners in this mock are real
companies, but who their clients are isn't something the public directory publishes — a
real brand in that strip would assert a commercial relationship nobody verified. Same
reasoning as the `packs`/`rate`/`rating` fields.

⚠️ `tagline` is also invented, with one exception: **Tridots Tech's is the real line from
the design file.** The rest are `null`, and the header falls back to a factual line built
from `city` and `stories` ("Munich, Germany · 5 success stories") rather than inventing
marketing copy for a real company. That means only Tridots shows the designed header at
full fidelity — the others show the fallback shape.

### The About / Services and Expertise card

**One card, split into two columns** — not two cards. These are the two halves of "who
are they, and do they do what I need?", and a single frame is what says they're read
together. Below `sm` they stack and the column rule becomes a horizontal one, which is
why the split is a `border-r` on the left column rather than a standalone element.

It's the **first framed block on the page**. Everything above it is the partner
presenting themselves; this is the specification, and the frame marks the change of
register.

**A chip gets a check when it answers something the visitor asked.** Matched industries
also sort to the front, ahead of the five-chip cap — a partner matching an industry that
got truncated into `+2` would be hiding the one fact the visitor came for. Industries
match `answers.segments`, apps match `filters.app`. Skip the quiz and nothing is checked,
which is correct: there's no requirement to match against.

The `+2` overflow carries the remaining names in a tooltip rather than just a count, the
same way the listing row's "+2 more" does. Tridots Tech was given **seven** industries so
that state is reviewable — every other partner sits at or under the cap.

**The chips are `Badge`** — `theme="gray" variant="subtle" size="md"`, which is 20px
tall with 12px text and a 10px icon slot for the check. frappe-ui has no separate `Tag`
component; `Badge` is it, and its own stories use it for row tags with `<Badge>+2</Badge>`
as the overflow. I'd hand-rolled these first and was corrected.

⚠️ `Badge` is `rounded-full`, so the chips render as **pills**, where the design draws
6px-radius rectangles. The design system's shape wins over the mock — worth confirming
against the Figma tag library. Overriding it isn't a clean option: `rounded-3` would sit
against Badge's own `rounded-full` in one class list, where the winner is whichever
Tailwind emits last.

**"Certified members" is a count per certification**, not a place: how many of the
partner's team hold each Frappe certification. Count first — `2 ERPNext`, `1 Framework` —
because the number is the answer, and leading with it lets the column be scanned instead
of read chip by chip. Highest first, and a certification nobody holds is left out rather
than shown as zero, which is why ALYF has one chip and Tridots has two.

The chip text is scannable but says nothing on its own, so the full sentence goes in an
`sr-only` span ("2 members hold an ERPNext certification"). The article is computed from
the label's initial letter, since it's assembled: _an_ ERPNext, _a_ Framework.

⚠️ The design's "Frappe apps" row shows `ERPNext` twice. That's an artifact, so the row
renders the partner's real app list instead.

⚠️ **`PMM`'s tooltip copy is a guess** ("Partner Maturity Model level, 1 to 5"). The
design shows the label and an info icon, not the tooltip. One line to correct, in
`PartnerAboutCard.vue`.

**Address and accolades are real or absent — never invented.** Inventing a street address
or an award for a real, named company asserts something about a real business. Tridots
Tech has both because both came out of the design file; the other twelve have no
accolade, and their address falls back to `city`. Same rule `tagline` already follows.
`pmm` is derived from tier (gold 5, silver 3, bronze 2) so the two can't contradict each
other, and `countries` comes from the scraped `city`. `migrations` is invented and uniform
by region. Certification counts are invented too, but kept as an explicit per-partner
table (`CERTIFIED_MEMBERS`) rather than derived from tier — the whole point of that row is
that it varies partner to partner, and a formula would make every gold partner identical.

### Partner vision

**A quote, bracketed rather than boxed.** An opening mark with a rule running off to the
right, a closing mark with a rule running back to the left. The two rules do the work a
card border would, without putting a second frame on a page that already has one.

**The air goes outside the bracket, not inside it.** 43px from the section heading down
to the top rule and 75px from the bottom rule to the first question, against 27px between
each rule and the quote's own content. The rules and the marks are one unit with the text
they enclose — space _inside_ the bracket just makes it look loose, which is what a first
pass at this got wrong in both directions.

They're real typographic quotes, not an icon — and deliberately **not** in Inter.
Inter draws `“` as two straight slabs; the design's are the curled comma shapes a
serif face makes, so the glyphs are `font-serif` (Georgia, via Tailwind's own stack —
frappe-ui doesn't touch `theme.fontFamily`, so `font-sans` / `font-serif` / `font-mono`
are all still there). Three details that took measuring:

- `bg-outline-gray-1` renders **nothing**. `outline-*` is frappe-ui's border scale, so it
  only works as `border-*` — see the token-scoping section below. The rules are
  `border-t border-outline-gray-1` on a zero-height flex child.
- `items-center` centres the rule on the glyph's **box**, and a quote glyph's ink sits in
  the upper part of its em box, so the rule crossed under the mark rather than through it.
  `translate-y-[0.1em]` moves the ink down without moving the box.
- Swapping to a serif changed those metrics, so the leading and the nudge were retuned
  together (`leading-[0.42]`, `translate-y-[0.1em]`). Both are in `em`, so they hold if
  the glyph size changes.

**The whole section sits on the base step**, 14px, with nothing stepping up — not the
quote, not the attribution, not the question headings. Hierarchy is carried by weight and
ink instead: the name is the darkest thing in the block at `ink-7` medium, and the quote
itself, the question headings, the answers and the job titles all sit at `ink-6` — the
headings separated only by `font-medium`. The only thing that is deliberately
large is the pair of quote marks (`text-12xl`), which are decoration rather than text.

**The three questions are fixed and live in the component, not the data.** They're the
directory's prompts, not the partner's copy — a partner who reworded them would break the
comparison the section exists to support. Only answers and tags come from the data. A tag
is a bare string, or `{ label, hint }` when it needs the info icon.

⚠️ Badge's `#suffix` has to be a **direct child** of the component. Wrapping it in a
`v-if` template hands Badge no suffix at all, so the condition goes on the slot template
itself (`<template v-if="t.hint" #suffix>`), and the label goes through the default slot
rather than the `label` prop.

⚠️⚠️ **Every word of the vision copy is invented**, and it's the most fabricated data in
the mock — a mission statement put in the mouth of a real, named company. Nobody at these
firms said any of it. It exists so the section's shape can be reviewed: quote length, how
the two-line headings wrap, how many tags fit on a row. Replace wholesale before this is
shown to anyone outside the team.

⚠️ **The author names are invented**, and they're the one field in here that could be
mistaken for fact: they read as a statement about who runs a real company. Only Tridots
Tech's is real, and only because it came out of the design file. The other twelve are
plausible-for-the-region placeholders and none of them is a person — a collision with a
real name at one of those firms would be coincidence, not research. `visionFor()` still
falls back to attributing the quote to the company if an entry has no author at all.

⚠️ **There is no portrait, and no initial either.** A placeholder face on a real person's
name is worse than no face, and a letter reads as their monogram rather than as a gap —
so `Avatar` gets neither `image` nor `label` and holds the space as a plain circle. Add
`:image` when the real ones arrive.

### Pricing

**The two cards are the quiz's third question.** Standard implementation off a starter
pack, or a custom engagement — the same split as `IMPLEMENTATION_TYPES` in `data/quiz.js`,
so a visitor who answered that question is looking at the card they already picked.

**The hours range is derived, not written.** It's the low and high of the starter packs
this partner actually offers: Tridots Tech sells Core ERPNext (40h), Manufacturing (70h)
and All in one (100h), which is exactly where the design's "40-100 hrs" comes from. A
partner offering one pack shows a single figure rather than a range of one — Greycube
Technologies reads "40 hrs". No pack at all and the card doesn't render, because the card
is the claim "you can buy a fixed scope from us".

**No figure on the custom card, on purpose.** A custom engagement priced on a profile page
would be a number nobody can stand behind, so it says so and hands over to the
conversation.

The two actions are `Button variant="ghost"` with a chevron suffix, pulled back by `-ml-2`
so the label lines up with the title above rather than sitting inside the button's own
padding. "Contact us" is still ⚠️ **inert** — it wants the in-app messages screen, which
doesn't exist. "Estimate quote" opens the estimator, below.

#### The estimate modal

`EstimateQuoteDialog.vue`, a 500px panel titled "Standard implementation estimate" at `2xl`
semibold (18px, one step down the frappe-ui scale from where it started) — the
title names the scope, so the totals below don't each need a qualifier. Bespoke work is the
"Custom solutions" card beside it, which carries no figure at all. **"Estimate", not
"quote"**: the quote is the thing the partner sends back, which is what the action at the
foot of the panel is for. Naming both of them "quote" was what pushed the old title onto
two lines.

**The scope is the visitor's, the rate is the partner's**, and the modal multiplies them. That's why the scope lives on the store as
`project.modules` (app → module keys) rather than on a partner: it's the same work whoever
quotes it. Only apps in `project.modules` ∩ `partner.apps` are priced — the modal is an
estimate of what this partner would do, not an audit of what they don't. Tridots reads
73 hrs (ERPNext 5 modules + CRM 2) at $85/hr = $6,205; Greycube reads 63 hrs at $75/hr =
$4,725, ERPNext only.

**The scrim behind every dialog is `black-overlay-400`** (45% black), not the
`black-overlay-200` (27%) frappe-ui ships — at 27% the page behind stayed legible enough to
compete with the panel. It's set once on `.dialog-overlay` in `index.css`, so it applies to
`BookSlotDialog` too: two overlay densities in one product would be worse than the light
one it replaces.

⚠️ The value is written as the literal `oklch(0 0 0 / 0.451)`, copied from
`frappe-ui/tailwind/generated/colors.json` → `overlay.black.400`. That scale exists as
Tailwind palette entries only — there are no CSS variables behind it, checked at runtime.
The rule also overrides frappe-ui's `dark:bg-black-overlay-700`; nothing in `src/` uses dark
mode today, but if that changes this needs its own dark half rather than one darker value.

⚠️ **The panel's width, its padding and the gap under its title are `index.css`
overrides**, for the same
reason: frappe-ui's Dialog hardcodes them and neither takes a class of ours. The body
wrapper is reached as `.dialog-content:has(.fc-estimate) > div:has(.fc-estimate)` — a
direct child of the panel, so the selector can't also match the panel, which carries the
same background class. Padding is `18px 20px 20px`: 18 on top because the title's line box
already carries a few pixels of leading above its cap, the other three measured against
ink. The gap under the title is `margin-bottom: 16px` on frappe-ui's own header block,
reached as `div:has(+ .fc-estimate)` — the previous-sibling selector CSS otherwise doesn't
have, the same trick the partner row's divider suppression uses.

⚠️ **500px isn't a `size` step.** `Dialog`'s `size` is an enum of Tailwind `max-w-*`
values — `lg` is 512px, `xl` is 576px — and the panel takes no class of ours. So the hook
is a marker _inside_ the panel: `.dialog-content:has(.fc-estimate)` in `index.css` sets the
width of only this dialog, and every other one keeps its `size` prop.

The title is the **`title` prop**, not the `#title` slot. The slot existed only to push the
heading to 3xl; at 2xl that is exactly what the prop already renders (`text-2xl-semibold`),
so the override earned nothing and is gone. The panel's × is the only close affordance,
which is why the footer holds one full-width action instead of a Close beside it.

**A total above the partner's own pack range is not a bug.** Greycube's card advertises
"40 hrs" because it sells one 40-hour pack; the estimate says 63 because that's the
visitor's scope. A pack is a fixed-scope product; an estimate is your actual project.

**Module hours are derived, never stored** — `moduleHours()` sums a module's tasks. A
module carrying its own `hours` beside a task list is two numbers claiming the same thing,
and the drill-down is exactly where they'd be seen disagreeing. Verified: zero mismatches
across every module in every app, and the printed total equals the sum of the printed rows.

**The drill-down is a second step, not an expander** — clicking a module swaps the body for
a real `<table>` of its tasks. The header of that step is a back button, the app mark and
the module name on one line: going back, which app you're in and which module you're
looking at are one thought. The back button is icon-only — beside the name it reads as
"back from this", and a label would push the name off the line at this width. `-ml-1.5` on
the row puts the chevron's own ink, not its 28px hit area, on the column edge the table
below starts from, and `gap-1` closes the rest of the distance to the title — measured, the
glyph's left edge sits exactly on the panel's 20px content edge.
Not frappe-ui's `list` family: that's a separate import subpath with its own stylesheet, a
lot of ceremony for four rows, and nothing else in `src/` uses it. frappe-ui has no
Accordion or Collapsible at all; reka-ui does, but a second step was the chosen
interaction.

The module's own figure there is labelled **"Module total"**, not "Total" — the persistent
footer below is showing a total too, of the whole estimate, and two unlabelled totals on
one screen is the confusion worth spending a word on.

#### The table, the marks and the pinned footer

**Step one is a table, not a list.** Module, `# of tasks`, `Estimated hrs` — three aligned
figures per row, which is the comparison someone scanning an estimate is actually making.
The app is a 16px mark in the first column rather than a subhead above a group: grouping
spent a whole row saying what the mark now says inline, and the list is flat and sortable
by eye.

**The first column is headed "Modules in your project", not "Module".** Without an owner
the column reads equally well as _the modules this partner implements_, which makes "so
which ones don't they do?" the reader's next question — of a panel that deliberately doesn't
answer it. The header is where someone looks to find out what a column holds, so the
provenance lands as they parse it, costing no row and no height.

⚠️ Deliberately **not** the project's name. `store.project.name` is generated for the
visitor rather than chosen by them, so a new user has never seen it — and "ERP rollout"
reads far more like one of the partner's packages than like their own thing. The general
rule: don't surface a generated name anywhere it could be mistaken for something the user
picked.

⚠️ And deliberately **no count**. The project holds nine modules; Tridots' table shows the
seven whose apps they implement. A number in the header would sit above a visibly shorter
list, which resurrects the audit question in a worse form — now with arithmetic attached.

This was the third answer to the same problem. The first two were a line under the list
("also implements 4 more modules outside your project") and a line under the title naming
the project. The first invites "which ones?" and quietly redefines _everything else they do_
as _everything else inside the apps you picked_ — Tridots does Helpdesk, and the project has
no Helpdesk in it at all. The second surfaces a name the user was given rather than chose.
Both were trying to add information; the actual defect was that the existing information had
no owner.

**No chevron on the rows.** The fill and the pointer are the affordance; a caret appearing
on hover was a second one saying the same thing, and it shifted the module name every time
the cursor crossed a row.

**A hovered row swallows the rules either side of it**, so the fill reads as one block
rather than a tinted band between two lines — the same effect as the partner listing. The
rule sits on each row's _top_ edge, so "the rule below row N" is row N+1's, which is what
`[&:hover+tr]` reaches. The header's own rule stays: it marks where the header ends, not
where a row does.

⚠️ Those rules are per-row `border-t`, **not `divide-y` on the tbody**, and the difference is
specificity. `divide-y`'s colour lands via `.divide-… > :not([hidden]) ~ :not([hidden])`,
which carries three class-level components — enough to outrank any reasonable hover
selector, so an `index.css` rule for this changed nothing at all. Measured: `borderTopColor`
identical hovered and not. On the row itself the hover variant outranks the base.

**The app marks are the real ones**, taken from the product cards on frappe.io/products and
committed to `src/assets/apps/` — see the table in that folder's README for the four files
and their sources. They resolve by convention (`<APPS[].value>.png`), the same way partner
logos do, so adding an app is dropping a file.

`AppLogo.vue` is frappe-ui's **`Avatar` at `size="xs"`** (16px, 4px radius), `shape="square"`
— including its fallback, so an app with no artwork yet gets the component's own
initial-on-a-surface rather than a second, invented visual language. `data/apps.js` used to
carry a table of approximated brand colours for that fallback; it doesn't any more. The
app's name is on the mark's tooltip and in `Avatar`'s own `alt`, so a 16px mark never names
nothing.

⚠️ **`AppLogo` carries `relative z-10`, and it's load-bearing twice over.**

- The rows are made clickable by a stretched `after:absolute after:inset-0` on the module
  button, which otherwise covers the mark completely — the cursor never reaches it, so the
  tooltip never opens. This was silently broken until it was measured with
  `elementFromPoint`. Raising the mark costs it its share of the row's click target, which
  is the right trade: the mark is a label, the module name beside it is the thing to click.
- Because the mark is now a positioned, stacked element, the sticky header has to out-rank
  it. Hence `z-20` on the `th`.

⚠️ **Three separate things a sticky table header needs**, each found by watching a row
scroll straight through it:

- `sticky` and the background go on the **`th` cells**, not on `thead` or its `tr`. A
  sticky `thead` positions, but its background doesn't paint.
- `z-20`, to beat `AppLogo`'s `z-10` (above).
- the rule under it is an **inset box-shadow**, not `border-b`. In a `border-collapse`
  table the collapsed border belongs to the table, so it stays behind and scrolls away
  while the cell sticks. A shadow paints with the cell.

`bg-surface-elevation-1` is the Dialog panel's own background. There is no `surface-modal`
token; `bg-surface-modal` renders nothing and the rows scroll under a transparent header.

**The totals and the action are pinned by the list's `max-h`, not by a slot.** They sit in
the body, not `#actions` — that slot brings its own `pt-4` on top of the body's `pb-6`,
which put 40px above the rule with no way to answer it below. Capping the list is what
keeps the panel short enough for the footer to stay on screen; verified by pushing the
project to every module of every app (11 rows, the list unchanged, the button still
visible).

⚠️ The cap is `max(120px, min(340px, 100vh - 440px))`. Without the vh term the panel simply
grows and the page scrolls the footer away — measured failing at a 460px-tall window before
it was added, passing after. Past the 120px floor the page scrolls, which is the lesser
evil.

⚠️ **`ScrollArea`'s cap goes on `viewport-class`, not on the root.** The root is
`overflow-hidden` and the viewport is `h-full`, which against a root carrying only a
max-height resolves to auto — so a cap on the root clips the list and never scrolls it.
This looked completely fine in a screenshot; it was `scrollHeight > clientHeight` coming
back `false` that caught it.

**The scrollbar is frappe-ui's `ScrollArea`**, an overlay bar that fades in on activity and
reserves no gutter — the platform bar sitting permanently down the side of a 500px panel
was the thing to get rid of. The `-mx-3` bleed puts it at the panel's edge while the text
still lines up with the totals.

⚠️ **The dashed rule is a background gradient, not `border-dashed`.** CSS gives no control
over a dashed border's dash-to-gap ratio — it's the browser's — so it's set explicitly:
3px on, 6px off, in `--outline-gray-3` rather than `-2` because there's a third less ink to
see at that ratio. Dashed rather than solid: those figures are derived from the list above
them, not a separate section below it.

⚠️ The space either side of that rule is **optically** equal, not numerically: 16px above
(clear space from the list's bottom edge, a hard clip with no leading of its own) against
12px below (padding plus the ~3.5px of half-leading a line of 14px/1.5 text carries above
its cap). Setting both to 16 sits the text a visible 3-4px lower than the gap above it
looks.

The same leading argument sets the gaps _inside_ the totals. All three rows carry `mt-1.5`,
but what that buys is measured in **baselines**: 27px from row one to row two, 27.5px to the
quote. Even spacing in a list of mixed type sizes is even baselines, not even margins.

⚠️ The quote row is `items-baseline`, not `items-center`. Its label is 14px and its figure
17px, so centring them sits the two on different baselines by about a pixel. The rows above
have one type size and don't care.

**The totals block is step one only.** In the drill-down those figures are about the whole
estimate while everything above them is about one module, and the module's own total is
right there. The action stays on both steps.

**A fade over the bottom of the list**, because a capped list clips a row through the middle
of a line. It's `v-show` state driven by a `@scroll.capture` handler and re-measured after
open and after a drill-down, not a permanent gradient: a fade still sitting over the last
row once you've scrolled to the end is dimming content that has nothing after it.

⚠️ `to-surface-elevation-1` **is a dead class** — the `surface-*` tokens aren't in the
gradient palette, so `bg-gradient-to-b from-transparent to-surface-elevation-1` compiles to
`background-image: none`. The fade uses the variable directly:
`bg-[linear-gradient(to_bottom,transparent,var(--surface-elevation-1))]`.

**Table metrics** are a spec, so they're named once in the component: a cell carries 8px
left/right and 6px top/bottom, a row a further 4px left/right and 2px top/bottom. A `<tr>`
can't take padding — CSS tables ignore it — so the row's share is folded into the cells:
every cell gets the extra 2px vertically, the outermost cell on each side the extra 4px
horizontally. Headers are `sm` regular in ink-5; module names are medium in ink-7; the two
inputs the total is made of (hours, rate) are medium, so they stop reading as a caption
under it.

The count column carries an extra `pr-6`. With an auto table it hugs the hours column, and
two right-aligned numerals 40px apart read as one field. The space goes on the count rather
than as a column width so the hours stay pinned to the table's edge.

**The action names its own mechanism** — "Message partner for a final quote", with a
message glyph. It says what pressing it does (sends a message), who it reaches (the
partner), and why (to get the real quote) — which is also where the removed disclaimer's
information ended up, at the moment it matters rather than as a banner at the top.

⚠️ **Gated later.** The estimator is meant for people who have created a project, since
that's where the scope comes from. `store.hasProject` is live and already true for the demo
switcher's "Ongoing project" viewer, so gating it is one `v-if` on the button — noted in
`PartnerPricingSection.vue`. Open to everyone until the signed-in views land, or there'd be
nothing to review.

⚠️ Money formatting is one local `Intl.NumberFormat`. frappe-ui exports nothing for it, and
its chart formatters are deliberately unexported because they hardcode a locale.

**Possessives are computed.** Three partners end in an s — Greycube Technologies, Kingstech
Services, Hybrowlabs — and a bare `${name}'s` gave "Greycube Technologies's".

#### ⚠️ The starter packs were repriced

They used to be rupee strings: ₹80,000 for the 40-hour pack, i.e. ₹2,000/hr, about $24.
Partner rates are $60–140/hr, so the estimator would have quoted three to six times the
pack price for identical hours **in the same section of the same page**. Converting the
symbol wouldn't have fixed that — ₹80,000 for 40 hours of consulting isn't plausible in any
currency.

Each pack is now `hours × $70`, a benchmark below every partner's rate, so a pack reads as
the discounted fixed-scope product it is: Core ERPNext `$2,800`, Manufacturing `$4,900`,
All in one `$7,000`, Frappe HR `$2,100`. Tridots at $85 estimates $3,400 bespoke against
the $2,800 pack for the same 40 hours. `hours` is the number both surfaces derive from, so
they can't drift. There is no `₹` left in `src/`.

### Success stories

It sits **after** Reviews: the reviews are other people's account of the partner and the
stories are the partner's own, so the independent evidence reads first and the case
studies expand on it.

**The count in the title is the real total**, and it's exactly what's rendered — no cap
and no "View all", because with 0–9 stories per partner there's nothing to truncate. It
comes from `partner.stories`, the same number the listing row reads, so the two can't
disagree.

**One story can be pinned**, and it leads the section at full width (`aspect-[4/1]` for
the banner, `2:1` for the grid tiles). A pinned story is **not** repeated in the grid —
the design mock shows it in both places, which reads as a duplicate rather than as
emphasis. Not every partner pins one: 8 of the 10 with something to pin do, which is what
makes the grid-only layout reviewable.

**The counts vary on purpose** — two partners have none, one has a single story, the top
end is nine. That forced three copy fixes elsewhere, all of which only show up once a
partner can have zero:

| Where            | At zero                           | At one                     |
| ---------------- | --------------------------------- | -------------------------- |
| Listing row      | "Works across Goods Trading, …"   | "1 success story across …" |
| Profile subtitle | the city alone                    | "…· 1 success story"       |
| Section title    | no count badge, and an empty line | badge reads `1`            |

"0 success stories across Retail" reads as a failure rather than as "these are the
industries they work in", which is that line's actual job.

**Segments are real.** Each story's industry label is drawn from the partner's own
`industries`, so a story never claims an industry the directory doesn't already list for
them. Titles are outcome-shaped ("Cuts Month-End Close from Ten Days to Two") rather than
adjective-shaped — "transforms" and "leverages" tell a reader nothing, and that register
is also the hardest to tell from real copy.

⚠️ **The story titles and their clients are invented.** Milder than the reviews but the
same family: a fabricated case study attributed to a real partner claims work they may
never have done. The clients are the same deliberately-fictional companies as the "worked
with" strip (`CLIENTS` in `data/media.js`), which is the one thing keeping them from
reading as real references.

**The middle stat has been through two rewrites, and the reasoning is worth keeping.** It
started as a client-retention rate: a claim nobody can check without asking the partner
for their books, so the wrong thing for a directory profile. Then it was the certification
count — verifiable, since Frappe issues the certificates, but it says what a partner _is
qualified for_, not whether the work went well, which is the one thing this section is
about.

It's now **the share of reviewers who would recommend them**: a success signal, computed
from reviews the platform already holds, needing no validation. Over _all_ of a partner's
reviews, not the four the profile renders — `reviewsFor()` generates the full set and the
component slices it, so the percentage matches its own label. A partner with no reviews
drops the card rather than showing a hopeful 0%.

⚠️ **The rating and the recommend rate disagree, because they're two independently
invented numbers.** Stored ratings run 4.2–4.7 while the generated rates run 63–75% — so
Tridots reads "4.5 ★" in Reviews and "75% Would recommend" two sections later. The fix is
to derive `partner.rating` from the generated review set instead of storing it, which
makes the headline, the visible stars and the rate one consistent set. Not done yet
because it moves every listing row's rating.

⚠️ `fcSites` and the tenure are still invented per partner, in an explicit table. The
tenure's label is now "Years operating" — the design's "Operating since" paired a
duration with a label that wants a year.

### Marketplace contributions

Last on the page, and it renders for only **eight of the thirteen** partners. What a
partner has published to the marketplace isn't about the engagement you're weighing up —
it's evidence of what they build when nobody has hired them to — so it comes after
everything that is.

⚠️ Every app, rating and review count is **invented** — see `data/marketplace.js`. This is
the most attributable placeholder data in the mock after the reviews: it credits a real,
named company with building and publishing a specific product, and nothing in the directory
says who publishes what, so none of it can be checked. Replace it with the real marketplace
listing before this leaves the team.

It's invented but not arbitrary. An app is only ever drawn from something the directory
already says about that partner: a localisation app comes from their **region** (the German
partner gets a European payments app, not an Indian tax one), and a product app comes from
an app they actually implement, so nobody is publishing a CRM add-on for a CRM they don't
work in. Same rule as the story segments.

**"View", not the design's "Install".** Installing is something you do to a site you own,
from inside Frappe Cloud. Nothing on this page knows what site you have, and a directory
shouldn't be installing software from a partner's profile. Viewing the listing is the action
that actually belongs here — and the row already names the app, so the button doesn't have
to. A chevron suffix, the same affordance the pricing and review links use for "this goes
somewhere". ⚠️ Inert — the destination is on Frappe Cloud, not in this app.

**No empty state**, unlike Success stories a section above — the section simply doesn't
render. Every partner _could_ have written up a project, so "none yet" there says something
about them; publishing a marketplace app is a thing most implementation partners never do,
so "no contributions" says nothing, and an empty row would read as a shortcoming rather
than a non-event.

⚠️ **This is the only optional section, so it owns its own `mt-24`** rather than taking it
from a wrapper in the page. An empty `<div class="mt-24">` still contributes its margin — a
block with no height, border or padding collapses its margins _through_ itself — which left
96px of dead space at the foot of five profiles.

⚠️ **`text-ink-amber-5` is the only live shade of that scale.** `text-ink-amber-1` through
`-4` compile to nothing and render black; all five were checked in the browser before one
was used. It lands on `#E09310`, within a hair of the `#E79913` the tier seals take from
Frappe's own badge artwork.

⚠️ **Two star treatments now share the page.** Reviews shows a single star in `ink-gray-5`
— a deliberate change, to stop a solid black star being the loudest thing in a review row —
and this section shows five amber stars, straight from the design reference. The
justification is that they say different things: one partner's own score versus a
marketplace listing's. If that reads as an inconsistency rather than a distinction, the
Reviews star is the one to move.

⚠️ Ratings are made **distinct within a partner**. There are only fifteen possible values,
so two of a partner's apps landing on the same one is a one-in-fifteen event — and it
happened to Tridots, the partner the design file uses, where two rows reading "3.9" looks
like the number is decorative rather than coincidental.

⚠️ The region pool is **rotated per partner** rather than read from the top. Eight of the
thirteen partners are Indian, and without that every one of them published an app called
"GST and E-Invoicing" — true enough to life, but two profiles showing an identical listing
read as a copy-paste bug. The cost is that a single-partner region gets an
arbitrary-but-plausible pick from its pool rather than the most characteristic one; pinning
a specific app to a specific partner is a one-line change.

### The login prompt

`LoginDialog.vue`, opened through `store.requireLogin()`. "Log in via Frappe
Cloud" spins for 1.4s and signs you in; "Sign up" is ⚠️ inert, because signing
up is a Frappe Cloud flow that lives outside this app and stubbing it here would
invent an account-creation screen nobody has designed.

**One dialog for the whole app**, mounted in `ConnectShell` because that wraps
every in-app screen. The alternative — a dialog per gated control — puts thirteen
copies of the same modal on the results page, one per partner row.

**The gate holds what you were doing.** `requireLogin(action)` runs the action
outright when you're signed in; signed out it opens the prompt and keeps the
action until `completeLogin`. So pressing Save on a partner signs you in and
_saves that partner_ — you land on the thing you wanted, not back on the button.
Dismissing drops the held action, because running it afterwards would be the app
doing something you cancelled. The callback is a module-level variable rather
than store state: it's a function, which is both pointless to make reactive and
awkward to serialise.

⚠️ **Cancelling mid-spin cancels the timer.** Without that, closing the panel a
beat after pressing the button still signs you in a second later, with no panel
left to explain why.

**Gated today:** the top bar's own "Log in or create account", Contact and Save
on the profile, and Save on every listing row. **Not gated:** "Write a review",
which needs a _completed project_ rather than an account — a different gate,
noted below — and the estimate modal's "Message partner", which sits behind a
modal that is itself meant to be gated on `store.hasProject`, so you can't reach
it signed out in the first place.

The subtitle names what an account is for rather than what you just pressed. Four
different strings saying the same thing would be four strings to maintain, and
the visitor already knows which button they hit.

⚠️ There is no auth. The 1.4s delay exists so the pending state is reviewable —
a button that swaps to "Logging you in" and back inside one frame can't be
designed against. A real build replaces the timer with the Frappe Cloud OAuth
round trip and keeps everything else.

### Reviews

**The verdict sits above the prose**: who wrote this, what they scored it, then
why. Under the body it was the last thing in the row and read as a footnote to
the paragraph, when it's the part someone scanning a list of reviews is actually
looking for.

Both the rating row and the body run full width rather than indenting beside the
avatar — at this column width an indented paragraph loses 48px of measure for no
gain, and the design runs it full width too.

⚠️ **A single line of text takes `text-base`, not `text-p-base`.** The two differ
only in line-height — 16px against 21px for the same 14px type — and the
difference hides in places you don't look for it. The reviewer's name sat 7px
above their company against a 2px margin, because the _timestamp_ beside the
name was `text-p-base`: at 21px it stretched the flex row holding the 16px name,
and `items-start` left 5px of dead air underneath. The company line's own
paragraph leading added ~2px more. The margin was doing almost none of the work.

Both are tight now and the margin is 4px, which is 4px on screen. Only the review
body keeps paragraph leading — it's the one part that actually wraps.

**The aggregate comes from the partner record** — the same `rating` and `reviews` the
listing row shows, so the two screens can't disagree. It deliberately isn't the average
of the rows below it: those are the first four of twelve, and a sample of a set doesn't
have to average to the set.

**The summary chips are the app's own `FilterChip`** — an outline ⇄ subtle `Button`, the
same control as the quiz's region chips and the mid-list app chips. It gained an optional
`icon` prop for this: the glyph carries the sentiment, a check for a positive theme and an
info mark for a caution. ⚠️ Selection is **local and does nothing downstream** — what a
click filters is still to be decided, so the chips are genuinely pressable with a real
selected state rather than dead controls that look live.

**Review media opens the same lightbox as the profile gallery** — one overlay, one set of
keyboard shortcuts, wherever media is clicked on this page. It's a separate slice of the
placeholder pool (`reviewMediaFor()`), because customers showing their go-live is a
different thing from the partner showing their own work.

Avatars are placeholders with **no image and no label**, so they render as plain circles
rather than initials — a letter would read as the reviewer's monogram, and the reviewer is
invented. The stars are `ink-gray-5`, lighter than the figures beside them —
`fill-current` inherits the row's `ink-8`, which made a solid black star the loudest thing
in each review.

**Ratings run 2.5 to 5.0 in half steps, and three of the ten bodies don't recommend.** A
profile where every row is four stars and every row says "Would recommend" doesn't show
what the section looks like when it isn't — measured across the roster, all 13 partners
show mixed ratings and 12 of 13 have at least one non-recommending review. "Would
recommend" only renders when true: a grey "would not recommend" beside a 3-star rating
reads as a label rather than a verdict, and the rating already carries it.

⚠️ The low-rated bodies are deliberately about **process** — timelines, chasing, scope —
never competence or conduct. Fabricated criticism of a real, named company is the sharpest
edge in this file, and mild and procedural is as far as placeholder copy should go.

⚠️⚠️ **The reviews are fabricated, and this is the most sensitive placeholder data in the
mock.** The partners are real, named companies. A made-up testimonial attributed to a
made-up customer reads exactly like real customer feedback, and a screenshot of this
section is indistinguishable from one of a live directory. Nobody said any of it. Replace
`data/reviews.js` wholesale, or gate the section off, before this leaves the team.

**They're generated but deterministic** — a pure function of the partner's id, so they
don't reshuffle between renders. Random-per-render placeholder content can't be
design-reviewed: the layout you just commented on would be gone by the time anyone looked.
Verified across the roster: no two partners share a review list, and no list repeats a
name or a body.

⚠️ Two bugs that only measurement caught, both worth knowing if you touch the generator:

- **A stride only visits distinct entries if it's coprime with the pool length.** The name
  stride was 3 over pools of 6, which walks `0,3,0,3` — Navari's four reviews came out as
  two people reviewing twice each. Names now step by 1 and trades by 7 over 8. The same
  trap reappeared when BODIES grew from 8 entries to 10 and the stride of 5 started
  walking `0,5,0,5`.
- **A fixed stride gives a pool only as many distinct sequences as it has entries.** Ten
  bodies against thirteen partners meant three profiles showed the same four review texts
  in the same order. The stride itself now varies per partner, drawn from the values
  coprime with the pool length (`BODY_STRIDES`), which multiplies the sequences by four
  while still keeping any single list repeat-free.
- **FNV-1a's low bits barely mix, and `% 8` reads only three of them.** Three pairs of
  partners had byte-identical review lists. Seeding each field separately did _not_ fix it:
  appending a field name shifts every id's low bits by the same amount, so
  `tridots-tech` and `new-indictrans` still agreed mod 8 on the name, body _and_ trade
  pools at once. The fix is MurmurHash3's finalizer after the FNV loop, whose whole job is
  pushing high-bit entropy down. Verified after: zero identical lists across all 13
  partners, zero repeated names within a list.

## Components and icons

Everything inside Frappe Connect is composed from frappe-ui rather than
hand-rolled:

| Surface                           | Component                                                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| App chrome                        | `Sidebar` + `SidebarHeader` / `SidebarLabel` / `SidebarItem`                                                  |
| Q1, Q3                            | `RadioGroup` + `Radio` (`padded`, label only)                                                                 |
| Q1 branch, implementation filter  | `Select`                                                                                                      |
| Book a slot                       | `Dialog` + `DialogDescription` (reka-ui)                                                                      |
| Profile actions                   | `Button` + `Tooltip`                                                                                          |
| Partner logo, row + profile       | `Avatar` (`size="2xl"`, `shape="square"`)                                                                     |
| Profile card chips, vision tags   | `Badge` (`gray` / `subtle` / `md`) — frappe-ui's tag primitive                                                |
| Quote portrait                    | `Avatar`, sized off-scale with `class="size-16"`                                                              |
| Region + industry/segment filters | `MultiSelect` (grouped options)                                                                               |
| Media gallery / lightbox          | hand-rolled — `Dialog` is a padded white panel with a max width; a lightbox needs an edge-to-edge dark ground |
| Search                            | `TextInput`                                                                                                   |
| Region and app tags               | `components/FilterChip.vue` — `Button` (outline ⇄ subtle), count as plain text                                |
| Region filter                     | `MultiSelect` — region is a multi-answer question                                                             |
| Partner tiers                     | `components/TierIcon.vue` — the real Frappe badge seal                                                        |
| Demo switcher                     | `components/DemoSwitch.vue` — `Dropdown` + `Button`, bottom-right                                             |
| Everything pressable              | `Button`                                                                                                      |

`Sidebar` owns its own collapse, including the auto-collapse below `sm`, so
there is no responsive branch to maintain in `ConnectShell`.

### The sidebar

**The header is the account control.** `SidebarHeader` is already a `Dropdown`
trigger — it takes `menuItems` and draws the chevron itself — so clicking the
logo opens **Log out** rather than needing a control of its own. Signed out,
the menu is empty and the chevron doesn't appear.

**Its second line is the signed-in viewer's name, and nothing at all when
signed out.** It used to read "Find a partner", which told a visitor what they
could already see.

⚠️ **"Find partners" needs an explicit `:active`.** `SidebarItem` infers the
active state by comparing the whole path (`current.path === target.path`), so a
child route lights nothing at all. The item points at `/connect`, which meant
the rail showed no location on the partner list and on every profile — two of
the three in-app screens, and the two you spend the most time on. Every route
under `/connect` is the partner directory, so the match is a prefix.

**Rows carry `space-y-0.5` inside a `nav` per group**, as in frappe-ui's own
reference sidebar. They were flush before, which reads denser than the component
intends and puts an active row's fill hard against its neighbours.

⚠️ **Don't try to align the logo with the nav icons.** `SidebarHeader` indents
its logo frame 10px from the rail edge (a `px-1` region holding a `px-1.5`
button); `SidebarItem` indents its icon 16px (frappe-ui's `px-2` viewport plus
the item's own `pl-2`). That 6px stagger looks like a bug, and it was "fixed"
here twice — first with a 2px margin on the logo, then by tightening the
viewport to `px-1` so both landed on 12px.

Both were wrong, and the arithmetic says why. **frappe-ui's numbers are tuned
for the collapsed rail, which is 48px wide — dead centre 24px:**

|             | frappe-ui          | The "fix"    |
| ----------- | ------------------ | ------------ |
| Logo centre | 10 + 14 = **24** ✓ | 12 + 14 = 26 |
| Icon centre | 16 + 8 = **24** ✓  | 12 + 8 = 20  |

A 28px logo box at 10px and a 16px icon at 16px are both exactly centred in the
collapsed rail. Aligning their left edges when expanded necessarily breaks that,
because the boxes are different sizes — and six pixels apart in a 48px rail is
far more visible than a 6px stagger down the edge of a 240px panel. The override
is gone and the viewport is back to frappe-ui's `px-2`.

That `px-2` is load-bearing for a second reason: the `ScrollArea` root is
`overflow-hidden`, so the padding is also what keeps an active row's `shadow-sm`
from being clipped. At `px-1` it had about a pixel of clearance.

The header's _label_ still sits 6px right of the nav labels (46px against
40px). That one is the component's own proportions — a 28px logo against 16px
icons — and closing it would mean shrinking the app mark to icon size.

**"Find partners" is a building, not a magnifying glass.** The item is the
directory of partner companies; search is a control that lives inside it.

**Collapsing is a seam handle, not a footer button.** `SidebarCollapseToggle`
was a permanent control in the rail's footer; this is the seam itself — a
full-height 12px strip sitting over the sidebar's right edge, revealing a
hairline down the seam and a chevron **at the pointer's own height**, so the
target is already under the hand. Same behaviour as the sidebar handles in
Notion and Linear.

The strip only tracks the pointer; the chevron is the button, and at 20px
centred on a 12px strip it sits under the cursor whenever it's visible. The
content column is `relative` and the strip is `-left-1.5`, so it lands on the
edge whatever width the sidebar currently is. `focus-visible:opacity-100` is
what keeps it reachable by keyboard — an `opacity-0` control is still focusable,
just invisible.

**Help & docs is gone**, which leaves the rail with only screens the product
actually has.

**Icons are lucide**, via frappe-ui's own pipeline. The `frappeui()` Vite plugin
runs `unplugin-vue-components` with an icon resolver, so `<LucideSearch />` needs
**no import** — write the tag and it resolves through `~icons/lucide/search`.
There is not one hand-drawn `<svg>` left in the app screens.

The segment `Select` renders **directly under the row that asked for it**, as a
sibling of that `Radio` inside the `RadioGroup` — not nested in the row, because
a frappe-ui `Radio` is itself a `role="radio"` button and an interactive control
inside a button is invalid (the click would toggle the radio). It's indented to
the label rather than fenced off with a rule. Arrow-key navigation still steps
Manufacturing → Services → Trading with the field open between them; the extra
sibling doesn't break reka-ui's roving focus.

## The taxonomy is real

The quiz's vocabularies come from the live directory, not from invention:

| What                        | Source                                                          |
| --------------------------- | --------------------------------------------------------------- |
| Industry groups + segments  | `window.page_data.industry_groups` on `frappe.io/partners/list` |
| App list                    | `window.page_data.app_list`, same page                          |
| Region groupings and counts | `frappe.io/partners/regions`                                    |

Three things changed once the real data went in, and they're worth reviewing
rather than just accepting:

**Every industry group branches, not just Manufacturing.** The wireframe assumed
Manufacturing was the only one with sub-segments; in the real taxonomy all four
have them (Services has 14). The segment field is still required with Skip as
the escape, same as before — if that's too much friction for three of the four,
dropping `required` on the `Select` in `ConnectLandingPage` is the whole change.

**Africa is now a region chip.** The wireframe left it to the map, but at 14
partners it outranks Europe's 11, so excluding it would have been arbitrary.
India stays split out of Asia Pacific — it's 71 of that region's 90, which is
exactly the call the wireframe made by eye. The remaining 19 are labelled
**"Asia"**, not the directory's "Asia Pacific": once India is its own chip the
long form promises a breadth the label no longer covers, and it was the widest
of the six in a row that has to line up.

**The app chips lost their counts.** The directory publishes the app list but
not per-app partner counts, and invented numbers sitting next to real app names
read as fact. The list went from 4 apps to the real 11.

Region counts now total 156, matching the directory's "155+ Partners", and
`MAP_REGIONS` is derived from `REGIONS` so the map and the chips can't drift
apart.

Partners carry real segment names, and the results filter matches them directly:
the industry group is a label in the merged filter, not a constraint of its own,
so there is no mapping step and "Others" is as real a constraint as any other
group. `GROUP_OF_SEGMENT` is still exported from `data/quiz.js` and the store no
longer imports it — it's what a group-level filter would need if one is ever
wanted again.

## The listing row's hover state

**A fill, not an underline.** Hovering a row fills it (`surface-gray-1`, 8px radius); the
name carries no underline any more.

**The fill and the divider are deliberately different widths**, which is why the row is
two nested boxes:

- The **outer** box takes the fill and bleeds 12px past the content column each side
  (`-mx-3 px-3`), so the fill has room around the content instead of stopping at the
  avatar's edge. Measured 744px against a 720px column.
- The **inner** box takes the divider, at the content column's own width — so the rule
  stays lined up with the heading and the filter bar above the list, and sits inset from
  the fill.

**A hovered row hides the divider below it _and_ the one above it**, so the fill reads as
one unbroken block rather than a band with lines clipped to its edges. CSS can only look
forward, so "the divider above" is expressed as the previous row hiding its own:
`.fc-partner-row:has(+ .fc-partner-row:hover)` in `index.css`. It sets the colour to
**transparent** rather than removing the border, so the 1px stays in the layout and
nothing shifts by a pixel as the cursor moves down the list.

⚠️ **A fill across the whole row promises the whole row is the target**, so the name's
link gets `after:absolute after:inset-0` — the standard stretched-link pattern. The
anchor still wraps only the name, which keeps its accessible name correct and keeps
Save and Contact outside it; nesting buttons inside an anchor is invalid and swallows
their clicks. Those two get `relative` so they paint above the stretched layer. Verified:
clicking dead space in a row navigates to the profile, clicking the bookmark toggles it
without navigating.

**The last row of a run has no bottom rule** — nothing below it to be separated
from. The listing splits into two runs around the mid-list app refinement, so
`:last-child` fires twice: once on the row above that block, once at the end of
the list. It sets the colour to transparent rather than the width to zero, so
every row keeps the same height and nothing shifts as rules appear and disappear
on hover.

Vertical padding is `py-7` (28px), up from `py-4` — a 146px row.

## Partner tiers

Three tiers — **gold, silver, bronze**. There is no "certified" tier; "certified
partner" is copy, not a level. (Frappe's badge zip does ship a `certified.svg`
lockup, which is what led an earlier pass astray — it isn't in
`src/assets/tiers/` for that reason.)

The seal is lifted from Frappe's own **Frappe Partner Badges** set. The full
horizontal lockups live in `src/assets/tiers/`, kept as shipped for anywhere the
wordmark version is wanted. All three carry an identical seal and differ only in
fill, so `TierIcon.vue` inlines the geometry once and varies the colour — these
are the artwork's own values, not eyeballed:

| Tier   | Fill      | In the row                                        |
| ------ | --------- | ------------------------------------------------- |
| Gold   | `#E79913` | amber `Badge` labelled "Gold", seal as its prefix |
| Silver | `#7C7C7C` | seal alone, 14px, tooltip                         |
| Bronze | `#B86E47` | seal alone, 14px, tooltip                         |

**Only gold gets a label.** Labelling every tier would flatten the hierarchy the
programme exists to show; the seal alone still marks the other two without
competing for the row.

**Tier is the listing's primary sort, always** — gold, then silver, then bronze,
then everyone else. It's the one ranking the partner programme itself publishes,
so it outranks whatever order the filters happen to leave behind; a gold partner
never sits below a bronze one. Within a tier the order is the seed list's, since
`Array.prototype.sort` is stable. See `results` in `stores/connect.js`.

A partner can have **no tier at all** — that isn't a fourth level, it's not
being in the programme. `tier: null` sorts last and `TierIcon` renders nothing
(it used to fall back to bronze for an unknown value, which turned a data gap
into a badge the partner doesn't hold).

⚠️ All 13 seed partners are tiered, so the untiered path is supported but never
exercised on this data. Demoting a real, named partner to "no tier" would be
inventing something about them, so it's left for whoever wires in real data.

Two things worth knowing:

- The lockup **crops the seal** at the badge's top edge. `TierIcon`'s viewBox is
  the seal's own bounds, so it renders whole.
- The paths are traced from the badge SVGs. Don't hand-edit them; re-lift from
  `src/assets/tiers/` if the brand set changes.

Unrelated but adjacent: the live directory tags partners `pml-3` / `pml-4` /
`pml-5` (partner maturity level) alongside a "4+ Years" line — a different axis
from the badge tiers, and not modelled here.

## Partner logos

**The partners are real.** Names, countries and logos come from
`frappe.io/partners/list?country=…` — the live directory behind the marketing
page. Everything else on a row (rate, rating, review count, response time, story
count, industries, apps, packs) is **invented**, because the directory doesn't
publish it. Don't quote those numbers at anyone.

That also removed the invented names the seed list used to carry — one of them
borrowed a real, unrelated company's brand.

The roster is 12, spread to cover every region the quiz offers:

| Region      | Partners                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| India       | Tridots Tech, Software@Work, New Indictrans, 8848 Digital, Greycube Technologies, Wahni, Hybrowlabs, Finbyz Tech |
| Europe      | ALYF (Munich)                                                                                                    |
| Middle East | Craft Interactive (Dubai)                                                                                        |
| Asia        | Kingstech Services (Singapore)                                                                                   |
| Americas    | Korecent (Chicago)                                                                                               |

Logos resolve **by convention, not by a table**: a file in
`src/assets/partners/` named after the partner's id — the slug `P()` derives
from the name, e.g. `8848-digital.svg` — is picked up by `data/logos.js` and
rendered by `PartnerRow`. No import to write, no data field to set. A partner
with no file falls back to the initials tile, so the list never breaks.

The assets are **cropped to each partner's logomark**, not the logo as
supplied. The originals are full lockups — mark plus wordmark, 2–5× wider than
tall — and `object-contain` in a square box rendered those as a 7px-tall strip.
Cropped to the mark they sit between 0.7:1 and 1.7:1 and read at 44px. The box
stays `object-contain` on white, since the crops aren't exactly square.

**The box is frappe-ui's `Avatar` at `size="2xl"`** — 40px, `rounded-[8px]` —
on both the listing row and the profile header, because that's the size the
design uses. It was a hand-rolled `<img>` at 44px (row) and 48px (profile), both
at `rounded-5` (10px): wrong on all three counts.

⚠️ **`Avatar` hardcodes `object-cover` on its `<img>`.** Right for a face,
wrong for a logo — the marks run from 0.74:1 to 5.69:1, so cover crops 8848
Digital to its middle 41% and Hybrowlabs to 18%, slicing the lettering off
both. `.fc-logo-avatar` in `index.css` flips that one declaration to `contain`
and gives the letterbox a white ground. It has to be reached from outside the
component: `object-fit` isn't inherited, so a utility on the root does nothing,
and that `<img>` takes no attrs of its own.

`Avatar`'s `size` prop also yields to a sizing utility in `class`
(`size-*`, `w-*`, `h-*`, unprefixed), if a surface ever needs an off-scale box.

**The initials fallback is not an `Avatar`.** Avatar's fallback renders
`label[0]` — one character on a theme surface — and this one is two initials on
the partner's own brand colour. It's a plain box at the same 40px and the same
8px radius, so a list mixing the two doesn't step. (Moot today: all 13 partners
have a logo file.)

**The box insets the mark by 4px; the crops themselves have no margin.**
`.fc-logo-avatar` carries the padding, so the avatar stays 40px (border-box) and
the image area is 32px. The crops are tight to each logo's ink — with no inset
at all the wider marks ran corner to corner and read as cropped rather than
contained. `tridots-tech.svg` used to carry a 4-unit viewBox margin of its own
on top of that, which inset it twice; that's now tightened to its measured ink
bounds (`0 0 117.5 81`), so the inset lives in exactly one place.

⚠️ **The 32px image area costs the wordmarks the most.** Ink height inside the
box, at `object-contain`: ~22px for Tridots, ~13px for 8848 Digital, and ~5.6px
for Hybrowlabs and Korecent — the two 5.4:1 lockups. Those two were already the
weakest at 44px with no inset and are now close to illegible. Three ways out, none
free: crop them to monograms (rejected once — slicing a letter out of a wordmark
invents a mark the partner doesn't use), let non-square crops opt out of the inset
per asset, or leave them and accept that a wordmark in a square box is small.

⚠️ That letterboxing is uneven across the roster, because the crops are. Ink
fills 89–96% of the box for the near-square marks (New Indictrans, Kingstech,
Navari, Greycube, ALYF) but 61–78% for the wider ones (Finbyz, Software@Work,
Tridots, Craft, Wahni) — and 18% for the two uncropped wordmarks below. Closing
that gap means re-cropping to square, which crops into the marks themselves.

⚠️ Three are left uncropped — **Hybrowlabs**, **Korecent** and **8848
Digital** — because they have no mark to separate out: the logo _is_ the
lettering. Slicing one letter out of a wordmark invents a monogram the partner
doesn't use, so these three stay whole and read as small text in their row.
`src/assets/partners/README.md` records the per-file reasoning.

To refresh or extend the set, the directory is scrapeable: each country page
renders `<a href="/partners/<country>/<slug>"><img class="card-logo" …><div
class="card-name">`. The page also ships a `window.page_data` blob with the real
`country_list`, `app_list` and `industry_groups` — worth a look, since
`industry_groups` is the actual taxonomy this quiz is mocking.

## Width

Everything in the app shares one measure: **`max-w-[1600px]`, centred**, on the
hero and on every below-fold section, so the page reads as one grid rather than
as bands at three different widths. Past 1400px the content stops growing and
the sidebar keeps its own width, so a 2560px display gets margins, not a
stretched layout.

Inside that measure the hero is `minmax(0,460px)` for the quiz and the rest for
the map, so the map carries the right-hand half of the screen rather than
sitting in it. 460px is the narrowest column that keeps the headline on one line
— it measures 410px at its 18px size, and `text-2xl` really is 18px here, since
frappe-ui replaces `theme.fontSize` the same way it replaces colour and radius. The map fills its panel — an earlier `max-w-2xl` on the SVG left
it floating in a much larger grey block.

**The qualifier owns the first screen.** The hero is
`lg:min-h-[calc(100vh-3rem)]` — the viewport minus the top bar — so the question
and the map are the only things visible on arrival, and starter packs, stories
and the footer CTA all have to be scrolled to deliberately. Inside the panel the
map is vertically centred and the region counts are pinned to the bottom, so the
extra height reads as composition rather than padding.

**The sidebar starts collapsed.** `ConnectShell` binds `v-model:collapsed` with
an initial `true`, which also overrides Sidebar's default behaviour of
collapsing only below `sm` — it now stays collapsed at every width until the
visitor opens it. The quiz and the map are the point of the screen, and an
expanded rail eats width the map wants.

The results list caps at **800px** — a partner row stretched to the full measure
puts too much air between the name and the Contact button.

**The chip counts are plain text, not a `Badge`.** A Badge can't sit inside a
selected chip: frappe-ui's solid gray `Button` and solid gray `Badge` both
resolve to `bg-surface-gray-10`, so a solid badge vanishes into the chip, while
`subtle` puts a pale pill on a near-black surface and `outline`/`ghost` put dark
grey text on it. The count inherits `currentColor` at 60% instead, which reads
on both states and keeps the chip the same size either way.

Not yet done: **narrow widths**. The sidebar auto-collapses below `sm` and the
sections stack, but the partner rows and the filter bar have not been tuned for
phones.

## Scrolling

No permanent scrollbar gutters anywhere. Every scroll region is frappe-ui's
**`ScrollArea`** — the same primitive `DesktopShell` uses for its content
region — which overlays a thumb that fades in on hover or scroll and hides after
an idle delay:

| Region                               | Orientation |
| ------------------------------------ | ----------- |
| Main content column (`ConnectShell`) | vertical    |
| Sidebar nav list                     | vertical    |
| Starter-packs comparison table       | horizontal  |

Two consequences worth knowing:

- The top bar moved **out** of the scroll region and is now a flex sibling of
  it, rather than `sticky top-0` inside it. Content no longer slides under a
  sticky element, and the bar can't drift.
- The hand-rolled `.fc-scroll` class is gone from `index.css`. It did roughly
  the same job with `scrollbar-width: thin`, but only in browsers that support
  it and only for regions you remembered to tag.

## Reading the map

Three tiers of dot, and the difference is deliberate:

| Dot                                | Colour         | What it is                                                        |
| ---------------------------------- | -------------- | ----------------------------------------------------------------- |
| Land                               | `#c2c2c2`      | the dotted landmass, baked into `world-map.svg` — not drawn by us |
| Partner hub, elsewhere             | `--ink-gray-5` | one of the 27 hub cities in `HUB_CITIES`                          |
| Partner hub, in an answered region | `--ink-gray-9` | same, but inside any region currently answered                    |

So the black dots are the hubs of every region the region question currently
holds — five over India once that question is reached, and more as further
regions are added, since region is multi-answer.

**The highlight is held until step 2.** The region answer is pre-seeded from
inferred location before question 1 is even shown (`seedInferredRegion`), so
without a guard the map would emphasise India while you're still choosing an
industry — answering a question nothing on screen has asked yet. The landing
page passes `:highlight="step >= 2 ? store.answers.region : []"`, so question
1 shows all 27 hubs evenly and the emphasis arrives with the question that
explains it.

Note this defers only the _display_. The inference itself is untouched: the
answer is set on mount and the chips on question 2 still show India already
selected.

## The demo switcher

`DemoSwitch.vue` is the prototype's own control, not part of the product: the
same bottom-right switch as `frappe-cloud-v2`, so reviewers already know where
to look. It uses Frappe Cloud's check/minus convention for the active option in
each group.

**It has two axes, and they behave differently.**

| Group           | Options                        | On click                           |
| --------------- | ------------------------------ | ---------------------------------- |
| View as         | Business, Partner _(disabled)_ | Wipes the store and returns to `/` |
| Business viewer | No account, Ongoing project    | Flips a flag; stays where you are  |

The second axis is where the business visitor stands with the product —
`visitor` (no account, browsing signed out) or `client` (has an account and an
implementation already under way). It only appears on the business side: a
partner looking at their own PRM is never "signed out".

Switching it deliberately does **not** reset or navigate. It's a property of the
viewer rather than a different demo, so flipping it re-renders the screen you're
on — which is the comparison a reviewer wants to make. `reset()` leaves it
alone for the same reason it leaves `role` alone: it's which demo you're in, not
something the quiz collected.

**One thing reads it so far: the top bar.** Signed out shows the ghost "Log in
or create account"; signed in shows **nothing at all** on the right. Not an
avatar, not a name, not a menu — the account surface isn't designed yet, and a
stand-in for a control whose shape nobody has decided is worse than the honest
absence. `store.viewer` holds the identity (name, email, company) for whenever
user settings land; nothing renders it today.

⚠️ **Every other screen still ignores the account state** and is built for the
signed-out visitor. The switcher's descriptions say so rather than implying
views that aren't there.

**The seam is two getters, not the string.** Read `store.signedIn` and
`store.hasProject`; never compare `store.account` at a call site. That's what
makes a third state — an account with no project yet — a change in
`stores/connect.js` alone. `setAccount()` rejects anything outside
`ACCOUNT_STATES`, because an unknown value would otherwise read as "signed in
but no project", a state that doesn't currently exist.

`store.viewer` is invented, and harmlessly so — it's the demo's own business
user, not a person at any real partner in the directory. Northwind is one of the
fictional client companies from `data/media.js`, and `.example` is the TLD
reserved for documentation, so the address can never resolve to a real mailbox.

**Picking Business restarts the whole demo.** It wipes the store — answers, the
inferred-region flag, the results filters — and returns to `/`, the Frappe
website, where the flow actually begins. Picking the view you're already in is
the natural "start over" gesture in a prototype, and there was nothing else for
it to do. The quiz's step counter is local to the landing page, so unmounting it
resets the question to 1 on its own.

Worth knowing when demoing repeatedly: restarting lands you on the marketing
page, and its CTA opens Connect in a **new tab** by design — so a few runs
through the flow will leave a few tabs open.

It's mounted in `App.vue`, not in `ConnectShell` — screen 1 is the marketing
page and has no app chrome at all, so the switch has to sit above the router to
reach every screen in the flow.

The partner option is present-but-inert on purpose. The product has two sides,
and hiding the second one would misrepresent its shape; disabled reads as
"later", where absent reads as "no". `store.setRole()` already accepts either
value, so wiring it up is a matter of building the screens, not the switch.

## Reading the map

`DottedWorldMap` uses **Frappe Cloud's own `world-map.svg`** (copied into
`src/assets/`), embedded as an `<image>` and sharing one coordinate space with
the pins — the same approach, the same Mercator constants (`LAT_TOP 83`,
`LAT_BOTTOM -56`, an 879×443 canvas stretched with `preserveAspectRatio="none"`)
as `WorldMap.vue` in `frappe-cloud-v2`. Pin placement calibrated there carries
over unchanged.

Pins are partner hubs with real lat/lng (`HUB_CITIES` in `data/quiz.js`), and
they react to the region question beside them: the answered region's hubs grow
and darken, the rest stay at the resting tier. Before any answer every hub reads
at the resting tier, so the map still shows where partners are while the
question is open.

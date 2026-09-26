<script setup>
import { computed } from 'vue'
import { Avatar, Button, Tooltip } from 'frappe-ui'
import { ListCell, ListRow } from 'frappe-ui/list'
import TierIcon from './TierIcon.vue'
import { logoFor } from '../data/logos'
import { storiesFor } from '../data/stories'
import { savedToast } from '../feedback'
import { useConnectStore } from '../stores/connect'
import { useAuthGate } from '../utils/auth'
import { useContactPartner } from '../utils/contact'

const props = defineProps({
  partner: { type: Object, required: true },
  // One line of facts beside the avatar, city first, no industry line and no
  // Contact — for places that list a few partners to get back to rather than
  // to compare or reach out from (the home screen's saved partners).
  compact: { type: Boolean, default: false },
})

const store = useConnectStore()
const { requireAccount } = useAuthGate()
const { contactPartner } = useContactPartner()

// Read from the store, not a local `ref`. A real build writes to the visitor's
// saved partners, which is the first thing an account actually buys you — and
// which is why it's gated: `requireAccount` holds the toggle while the visitor
// signs in, then runs it once they're back, so they land on a saved partner
// rather than back where they started having to press it again.
//
// It used to be a local `ref(false)` here and another one on the profile page,
// which meant saving from the row and then opening that partner showed it
// unsaved. One list on the store is what lets the confirmation be true.
const saved = computed(() => store.isSaved(props.partner.id))

// The toggle, the confirmation and the undo are one gesture, so they're one
// function. `toggleSaved` hands back the state it moved to, and Undo is simply
// the same call again.
// The partner is read BEFORE the gate. Signing in unmounts this row, and an
// action holding `props` of a dead component is a question not worth having —
// the object from `PARTNERS` outlives every screen.
const toggleSave = () => {
  const p = props.partner
  requireAccount(() => savedToast(p, store.toggleSaved(p.id), () => store.toggleSaved(p.id)))
}

// A real logo when `src/assets/partners/<id>.<ext>` exists, initials otherwise —
// see `data/logos.js`. Both render in the same 40px box so the list never
// reflows as real assets land.
const logo = computed(() => logoFor(props.partner.id))

// Still split into two spans rather than one string, and for the original
// reason: the row is one line and the named industries are the part allowed to
// give way, so the tail is pinned (`shrink-0`) and stays readable at any width.
// Wrapping to two lines made rows uneven heights and pushed the list taller
// than it needs to be.
//
// What changed is that the tail is now part of the SENTENCE — "…, Retail, and
// 4 more" — rather than a "+4" chip hung off the end of it. The chip form read
// as a badge on the row, which invited the reading that it was counting
// whatever the ellipsis had just clipped. It never was: `rest` is the number of
// industries beyond the three named, the span only renders when that's non-zero,
// and it's the same figure whether or not the text happens to be truncated at
// this width. Saying it in words is what makes that legible.
//
// The comma that joins the two halves lives at the end of the LEAD, so it
// disappears with the names it belongs to when the line truncates.
const SHOWN = 3
// ⚠️ STORIES ONLY WHEN THEY ARE IN YOUR INDUSTRY. A bare count ("9 success
// stories across …") measured how much a firm had written up, not whether it
// had done work like yours — and it was glued to the partner's full directory
// tags, so "1 success story across Discrete Manufacturing, Real Estate, Rental
// Business" claimed one story in three industries.
//
// So the line has two forms and each row gets the one that is true for it:
//
//   a story matches   "2 success stories in Discrete Manufacturing" — counted
//                     and named from the stories themselves (`storiesFor`, the
//                     same labels the profile's Success stories section shows)
//   none matches      "Works across …" — the partner's own industries
//
// "Your industry" is the listing's industry filter when one is set — what this
// screen is being asked about right now — and the account's own otherwise. With
// neither there is nothing to match against, so every row says "Works across".
const wanted = computed(() =>
  store.answers.segments?.length ? store.answers.segments : (store.company.segments ?? []),
)

const listOf = (items) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : (items[0] ?? '')

const industryLine = computed(() => {
  const { pinned, rest: others } = storiesFor(props.partner)
  const matching = [pinned, ...others].filter((st) => st && wanted.value.includes(st.segment))
  if (matching.length) {
    const n = matching.length
    const segments = [...new Set(matching.map((st) => st.segment))]
    return { lead: `${n} success ${n === 1 ? 'story' : 'stories'} in ${listOf(segments)}`, rest: 0 }
  }
  const industries = props.partner.industries
  const rest = Math.max(industries.length - SHOWN, 0)
  const shown = industries.slice(0, SHOWN).join(', ') + (rest ? ',' : '')
  return { lead: `Works across ${shown}`, rest }
})
</script>

<template>
  <!-- A frappe-ui `ListRow`, always inside `PartnerList`. STATIC — no `to`,
       no click — because the row carries two buttons of its own, and a row
       that is itself a link or button cannot hold them (nested interactive
       controls are invalid). The whole-row target is the name's stretched link
       instead, the pattern frappe-ui's List docs give for rows with actions.

       What the List owns: the grid, the 12px inset, and the divider — above
       each row but the first, at the content's width, in `outline-gray-1`.
       What this row adds back for a static row: the hover fill, its radius,
       and (in `index.css`) hiding the two dividers touching a hovered row,
       which List only does for interactive rows.

       ⚠️ One px more padding below than above. The divider is a 0-height
       overlay where the old one was a 1px border inside the row, so without
       it every row is a pixel shorter than before. -->
  <ListRow
    class="fc-list-partner rounded-4 hover:bg-surface-gray-1"
    :class="compact ? 'pb-[21px] pt-5' : 'pb-[29px] pt-7'"
  >
    <ListCell class="self-stretch">
      <!-- ⚠️ THE AVATAR SITS INSIDE THIS COLUMN, not beside it, and that is the
           whole of the row's second layout.

           It used to be the row's first flex child, which indented everything
           to its right by 52px — including the two lines that are not about
           identity at all. Those two are what the list is COMPARED on: the rate,
           the rating, the response time, and what the firm has actually done.
           Thirteen rows of them read as a column, and a column that starts 52px
           in is a column with a 52px hole down its left edge, put there by a
           logo that has nothing to do with the figures.

           So the avatar belongs to the name and the city — which are what it
           identifies — and the facts run the column's full width, flush with
           its left edge. -->
      <div class="min-w-0 flex-1">
        <!-- The identity cluster: the mark, the name, the city. -->
        <div class="flex items-start gap-3">
          <!-- Real logo if one has been dropped in, initials on the brand colour if
           not. The assets are cropped to each partner's logomark rather than the
           full lockup (see `assets/partners/README.md`), so they arrive roughly
           square and fill this box instead of letterboxing to a 6px-tall strip
           the way a wordmark does.

           `Avatar` at `2xl` — 40px, `rounded-[8px]` — is the design-system size,
           so it's the component and the prop rather than a hand-rolled box. See
           `.fc-logo-avatar` in `index.css` for the one thing it needs overriding:
           `object-cover` would crop the wider marks.

           The 4px inset is in `.fc-logo-avatar` too. The crops are tight to
           each logo's ink, so with none the wider marks ran corner to corner
           and read as cropped rather than contained. -->
          <Avatar
            v-if="logo"
            :image="logo"
            :label="`${partner.name} logo`"
            size="2xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <!-- Not an `Avatar`: its fallback renders `label[0]` on a theme surface,
           and this one is two initials on the partner's own brand colour. Same
           40px and same 8px radius as `2xl` above, so a list that mixes the two
           doesn't step. -->
          <div
            v-else
            class="flex size-10 shrink-0 items-center justify-center rounded-4 text-xs font-semibold text-white"
            :style="{ backgroundColor: partner.color }"
            aria-hidden="true"
          >
            {{ partner.initials }}
          </div>

          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
              <!-- The hover fill is the row's affordance now, so the name drops its
               underline.

               ⚠️ A fill across the whole row promises the whole row is the
               target, so `after:absolute after:inset-0` stretches this link's hit
               area over it. The anchor still wraps only the name, which keeps its
               accessible name right and keeps Save and Contact out of it —
               nesting buttons inside an anchor is invalid and swallows their
               clicks. Those two get `relative` below so they stay above the
               stretched layer. -->
              <h3 class="text-lg font-medium text-ink-gray-7">
                <RouterLink
                  :to="`/connect/partners/${partner.id}`"
                  class="after:absolute after:inset-0 after:content-['']"
                >
                  {{ partner.name }}
                </RouterLink>
              </h3>
              <!-- Gold renders as a labelled badge, silver and bronze as the seal
               alone — see TierIcon. Labelling every tier would flatten the
               hierarchy the programme exists to show. -->
              <TierIcon :tier="partner.tier" />
            </div>

            <!-- ── The row's vertical rhythm: 2 / 12 / 4 ─────────────────────
             Four stacked lines, and the gaps are uneven on purpose — they group
             the row into two clusters rather than spacing it evenly:

               name          ─┐ 2px   the identity. A city under a company name
               city          ─┘       is a subtitle, not a separate fact.
                              ── 12px  the break
               rate · rating · reply ─┐ 4px   the facts. What you compare rows
               N stories across …    ─┘       on, read as one block.

             Evenly spaced (it was 2 / 6 / 6) all four lines read as one list of
             four unrelated things, and the eye had to do the grouping itself.
             The big gap is the only structural signal in the row — there is no
             rule and no fill between them — so it has to be big enough to
             actually read as a break, which 6px was not. -->

            <!-- No icon here. The city sits directly under the name as a plain
           subtitle — the icons below label a row of unlike facts (rate, rating,
           response time) that need telling apart at a glance; this line doesn't. -->
            <p v-if="!compact" class="mt-0.5 text-p-sm text-ink-gray-6">{{ partner.city }}</p>
            <!-- Compact: the city joins the facts, with an icon like theirs,
                 since it is no longer a subtitle on a line of its own. -->
            <div
              v-else
              class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-6"
            >
              <span class="flex items-center gap-1">
                <LucideMapPin class="size-3.5 shrink-0 text-ink-gray-6" />
                {{ partner.city }}
              </span>
              <span class="flex items-center gap-1">
                <LucideCircleDollarSign class="size-3.5 shrink-0 text-ink-gray-6" />
                <template v-if="partner.rate">From ${{ partner.rate }}/hr</template>
                <span v-else class="text-ink-gray-5">Undisclosed</span>
              </span>
              <span class="flex items-center gap-1">
                <LucideStar class="size-3.5 shrink-0 text-ink-gray-6" />
                {{ partner.rating }}
                <span class="text-ink-gray-5">({{ partner.reviews }})</span>
              </span>
              <span class="flex items-center gap-1">
                <LucideClock class="size-3.5 shrink-0 text-ink-gray-6" />
                Typically {{ partner.responds }}
              </span>
            </div>
          </div>
        </div>

        <template v-if="!compact">
          <!-- ⚠️ `mt-3` still measures the 12px break described above, but from the
             bottom of the CLUSTER rather than from the city line alone. The
             avatar is 40px and the name-and-city stack is taller than that, so
             the cluster's height is still the text's — the gap reads exactly as
             it did. It would not if the avatar ever grew past the two lines. -->
          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-6">
            <!-- A partner who doesn't publish a rate still gets the slot and the
               icon, and says so. Dropping the fact entirely would close the gap
               and leave the row LOOKING complete — three facts on one partner
               and two on the next, with nothing to say which fact went missing.
               "Undisclosed" is also the honest answer to the question the
               column is asking, and it's set in `ink-gray-5` so a row of them
               doesn't read as loudly as a row of figures. -->
            <span class="flex items-center gap-1">
              <LucideCircleDollarSign class="size-3.5 shrink-0 text-ink-gray-6" />
              <template v-if="partner.rate">From ${{ partner.rate }}/hr</template>
              <span v-else class="text-ink-gray-5">Undisclosed</span>
            </span>
            <span class="flex items-center gap-1">
              <!-- Plain outline star, `ink-gray-6`, matching the dollar sign and
                 the clock either side of it. This row is three unlike facts in
                 a line and the icons are labels for them, not marks in their
                 own right — a filled amber star here is the loudest thing in a
                 list of thirteen rows, thirteen times over. Amber and filled is
                 for the places where the star IS the rating: the profile's
                 review scores and the marketplace five-star rows. -->
              <LucideStar class="size-3.5 shrink-0 text-ink-gray-6" />
              {{ partner.rating }}
              <span class="text-ink-gray-5">({{ partner.reviews }})</span>
            </span>
            <span class="flex items-center gap-1">
              <!-- A clock, not a bubble — the bubble now belongs to Contact, and
               this line is about speed rather than the channel. -->
              <LucideClock class="size-3.5 shrink-0 text-ink-gray-6" />
              Typically {{ partner.responds }}
            </span>
          </div>

          <!-- One line, always. `min-w-0` on the growing span is what lets
           `truncate` actually clip inside a flex row — a flex item defaults to
           min-width:auto and refuses to shrink below its text. -->
          <p class="mt-1 flex gap-1 text-p-sm text-ink-gray-6">
            <span class="min-w-0 truncate">{{ industryLine.lead }}</span>
            <span v-if="industryLine.rest" class="shrink-0">and {{ industryLine.rest }} more</span>
          </p>
        </template>
      </div>

    </ListCell>

    <!-- `relative` lifts these above the name's stretched hit area — without
         it the row link would sit on top of both buttons. -->
    <ListCell :class="compact ? '' : 'self-start'">
      <div class="relative flex shrink-0 items-center gap-1.5">
        <!-- One word, and the same word in both states: the filled icon
           already says whether this partner is saved. The `aria-label` stays
           stateful and names the partner — a screen reader gets no icon to
           read, so it needs the verb the tooltip can drop. -->
        <Tooltip text="Save">
          <Button
            variant="ghost"
            :aria-pressed="saved"
            :aria-label="saved ? `Remove ${partner.name} from saved` : `Save ${partner.name}`"
            @click="toggleSave"
          >
            <template #icon>
              <LucideBookmark class="size-4" :class="saved ? 'fill-current text-ink-gray-8' : ''" />
            </template>
          </Button>
        </Tooltip>
        <!-- Opens the conversation with this partner and goes to it. Gated,
             unlike before: there IS something behind it now, and a thread needs
             an account to belong to — see `useContactPartner`. -->
        <Button v-if="!compact" variant="subtle" label="Contact" @click="contactPartner(partner)">
          <!-- A message bubble, not an envelope: contact runs through in-app
             messages, and an envelope would promise email. -->
          <template #prefix><LucideMessageSquare class="size-4" /></template>
        </Button>
      </div>
    </ListCell>
  </ListRow>
</template>

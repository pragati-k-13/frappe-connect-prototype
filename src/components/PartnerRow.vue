<script setup>
import { computed } from 'vue'
import { Avatar, Button, Tooltip } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import { logoFor } from '../data/logos'
import { contactToast, savedToast } from '../feedback'
import { useConnectStore } from '../stores/connect'

const props = defineProps({
  partner: { type: Object, required: true },
})

const store = useConnectStore()

// Read from the store, not a local `ref`. A real build writes to the visitor's
// saved partners, which is the first thing an account actually buys you — and
// which is why it's gated: `requireLogin` holds the toggle until the visitor is
// in, then runs it, so they land on a saved partner rather than back where they
// started having to press it again.
//
// It used to be a local `ref(false)` here and another one on the profile page,
// which meant saving from the row and then opening that partner showed it
// unsaved. One list on the store is what lets the confirmation be true.
const saved = computed(() => store.isSaved(props.partner.id))

// The toggle, the confirmation and the undo are one gesture, so they're one
// function. `toggleSaved` hands back the state it moved to, and Undo is simply
// the same call again.
const toggleSave = () =>
  store.requireLogin(() => {
    const now = store.toggleSaved(props.partner.id)
    savedToast(props.partner, now, () => store.toggleSaved(props.partner.id))
  })

// A real logo when `src/assets/partners/<id>.<ext>` exists, initials otherwise —
// see `data/logos.js`. Both render in the same 40px box so the list never
// reflows as real assets land.
const logo = computed(() => logoFor(props.partner.id))

// Split rather than one string, so the row can truncate without eating the
// count: the named industries are the part that gives way, "+2 more" is pinned
// and always readable. Wrapping this line to two lines made rows uneven heights
// and pushed the list taller than it needs to be.
const SHOWN = 3
const industryLine = computed(() => {
  const { stories, industries } = props.partner
  const shown = industries.slice(0, SHOWN).join(', ')
  // Some partners have published none, so the line can't always lead with a
  // count — "0 success stories across Retail" reads as a failure rather than
  // as "these are the industries they work in", which is the line's actual
  // job. One story gets the singular for the same reason.
  const lead = stories
    ? `${stories} success ${stories === 1 ? 'story' : 'stories'} across ${shown}`
    : `Works across ${shown}`
  return { lead, rest: Math.max(industries.length - SHOWN, 0) }
})
</script>

<template>
  <!-- Two boxes, because the fill and the divider want different widths.

       The OUTER box carries the hover fill and bleeds 12px past the content
       column on each side (`-mx-3 px-3`), so the fill has room around the
       content instead of stopping at the avatar's edge.

       The INNER box carries the divider, at the content column's own width —
       so the rule stays lined up with the heading and the filter bar above the
       list, and sits inset from the fill. Same relationship as the reference.

       The rule is on the row rather than `divide-y` on the container so it
       survives the interstitial that splits the listing into two containers.
       `.fc-partner-row` in `index.css` is what hides the two rules touching a
       hovered row. -->
  <article
    class="fc-partner-row group relative -mx-3 rounded-4 px-3 transition-colors hover:bg-surface-gray-1"
  >
    <div class="fc-partner-row-body flex items-start gap-3 border-b border-outline-gray-1 py-7">
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

      <div class="min-w-0 flex-1">
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
          <h3 class="text-lg font-medium text-ink-gray-8">
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

        <!-- No icon here. The city sits directly under the name as a plain
           subtitle — the icons below label a row of unlike facts (rate, rating,
           response time) that need telling apart at a glance; this line doesn't. -->
        <p class="mt-0.5 text-p-sm text-ink-gray-6">{{ partner.city }}</p>

        <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-7">
          <span class="flex items-center gap-1">
            <LucideCircleDollarSign class="size-3.5 shrink-0 text-ink-gray-6" />
            From ${{ partner.rate }}/hr
          </span>
          <span class="flex items-center gap-1">
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
        <p class="mt-1.5 flex gap-1 text-p-sm text-ink-gray-6">
          <span class="min-w-0 truncate">{{ industryLine.lead }}</span>
          <span v-if="industryLine.rest" class="shrink-0">+{{ industryLine.rest }} more</span>
        </p>
      </div>

      <!-- `relative` lifts these above the name's stretched hit area — without
         it the row link would sit on top of both buttons. -->
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
        <!-- ⚠️ Still inert in the sense that matters — the messages screen
             doesn't exist — but no longer silent: `contactToast` names the
             destination rather than letting the click vanish. Ungated on
             purpose, same as before: there is nothing behind it to gate. -->
        <Button variant="subtle" label="Contact" @click="contactToast(partner)">
          <!-- A message bubble, not an envelope: contact runs through in-app
             messages, and an envelope would promise email. -->
          <template #prefix><LucideMessageSquare class="size-4" /></template>
        </Button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import IconChevronRight from '~icons/lucide/chevron-right'
import IconRate from '~icons/lucide/circle-dollar-sign'
import IconStar from '~icons/lucide/star'
import IconClock from '~icons/lucide/clock'
import { logoFor } from '../data/logos'

// Who is doing the work: the listing row's three facts, framed as a card.
//
// ⚠️ ONE CALLER — `ConfirmedPage`. It was extracted from that page to be shared
// with the project screen, and the project screen then gave the partner back to
// the rail (see `ProjectPartnerPanel` for why), which wants a different shape
// entirely. The extraction stands anyway: this is a 130-line block with three
// derived values in it, and the confirmation screen reads better without them.
//
// The `#actions` slot it grew for the project screen is gone with that caller.
// A slot nothing fills is an invitation to put something in it.
//
// ⚠️ NOT the listing row's structure, and that's the one place it departs.
// There the avatar indents everything beside it, because a row is scanned down
// a column of identical rows and the indent is what separates one from the
// next. This is a single card, so only the IDENTITY sits beside the avatar —
// the name and the city, which are what the mark is a picture of. The facts,
// the expertise line and the button belong to the card rather than to the logo,
// and they start where the avatar starts.
//
// Everything else is the row's: same 40px `2xl` avatar at 8px radius, same
// three facts with the same icons, same 2/12/4 rhythm. 16px of padding, and a
// border rather than the row's hover fill — nothing here is a list, so there is
// nothing to hover between.
const props = defineProps({
  partner: { type: Object, required: true },
})

const logo = computed(() => logoFor(props.partner.id))

// The same three facts the listing row carries, in the same order and with the
// same icons — this card is that row, framed. See `PartnerRow`.
const facts = computed(() => {
  const p = props.partner
  return [
    { icon: IconRate, text: p.rate ? `From $${p.rate}/hr` : 'Undisclosed', muted: !p.rate },
    { icon: IconStar, text: `${p.rating}`, sub: `(${p.reviews})` },
    { icon: IconClock, text: `Typically ${p.responds}` },
  ]
})

// "Expertise across A, B, C and N more" — the wireframe's line, and a different
// claim from the listing's "N success stories across…". Success stories are
// counted evidence; this is what they were hired for.
const SHOWN = 3
const expertise = computed(() => {
  const industries = props.partner.industries ?? []
  const rest = Math.max(industries.length - SHOWN, 0)
  return { lead: industries.slice(0, SHOWN).join(', '), rest }
})
</script>

<template>
  <article class="rounded-6 border border-outline-gray-1 p-4">
    <!-- The identity: the mark and what it names. -->
    <div class="flex items-start gap-3">
      <Avatar
        v-if="logo"
        :image="logo"
        :label="`${partner.name} logo`"
        size="2xl"
        shape="square"
        class="fc-logo-avatar"
      />
      <!-- Not an `Avatar`: its fallback renders `label[0]` on a theme surface,
           and this is two initials on the partner's own brand colour. Same 40px
           and 8px radius as `2xl`. -->
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
          <h2 class="text-lg font-medium text-ink-gray-8">{{ partner.name }}</h2>
          <TierIcon :tier="partner.tier" />
        </div>
        <p class="mt-0.5 text-p-sm text-ink-gray-6">{{ partner.city }}</p>
      </div>

      <!-- ⚠️ Top right, on the identity row. It is the one thing the card sends
           you to, and at the bottom it sat under the facts as though it were
           about the last line it followed. Beside the name, it is plainly about
           the partner. -->
      <Button
        class="shrink-0"
        variant="subtle"
        size="sm"
        label="Visit profile"
        :route="`/connect/partners/${partner.id}`"
      >
        <template #suffix><IconChevronRight class="size-4" /></template>
      </Button>
    </div>

    <!-- Full width from here, flush with the avatar's left edge. -->
    <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-p-sm text-ink-gray-7">
      <span v-for="f in facts" :key="f.text" class="flex items-center gap-1">
        <component :is="f.icon" class="size-3.5 shrink-0 text-ink-gray-6" />
        <span :class="f.muted ? 'text-ink-gray-5' : ''">{{ f.text }}</span>
        <span v-if="f.sub" class="text-ink-gray-5">{{ f.sub }}</span>
      </span>
    </div>

    <!-- The tail can't break. Wrapping it stranded "more" alone on a second
         line; the listing solves the same problem by pinning its tail and
         truncating the lead, and here the line is allowed to wrap so the tail
         just has to stay whole. -->
    <p class="mt-1 text-p-sm text-ink-gray-6">
      Expertise across {{ expertise.lead }}
      <span v-if="expertise.rest" class="whitespace-nowrap">and {{ expertise.rest }} more</span>
    </p>
  </article>
</template>

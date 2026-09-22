<script setup>
import { computed } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import IconRate from '~icons/lucide/circle-dollar-sign'
import IconStar from '~icons/lucide/star'
import IconClock from '~icons/lucide/clock'
import { logoFor } from '../data/logos'

// Who is doing the work, as a PANEL rather than a card in the page.
//
// ⚠️ THIS REPLACES THE PARTNER CARD AT THE TOP OF THE PROJECT PAGE, and the
// move is the biggest change the tracker has had. The card was the heaviest
// object on the screen — bordered, 40px logo, tier badge, four facts, two
// buttons — and the least actionable thing on it. The checklist, which is the
// reason anyone opens a project, sat underneath it as unbordered grey text. The
// page shouted a star rating and whispered "your data is needed".
//
// The partner is REFERENCE, exactly like the pack: something you check, not
// something you act on. So it belongs where the reference already lives, and
// the column opens on the current stage instead.
//
// Built to `PackPanel`'s anatomy on purpose — sticky header strip, 46px avatar,
// name with a badge beside it, then facts stacked with icons. The rail holds
// two panels now and they have to read as one column, not as two components
// that happened to end up next to each other.
// ⚠️ THE PANEL NO LONGER RENDERS AN EMPTY STATE, and the argument for one has
// been reversed deliberately. It used to say an absent partner is a fact about
// the project and a rail that silently loses a section reads as a loading
// failure — so it drew "Not assigned yet" through the whole of the custom
// spine's first two stages. That is a panel whose content is the absence of
// content, standing where the answer will go. The rail is REFERENCE: it holds
// what the project has. Where the project is comes from the stage above the
// checklist, which names it, and on a custom project the replies list is the
// thing that ends it. The page renders this only once there is a partner.
const props = defineProps({
  partner: { type: Object, required: true },
})

// ⚠️ 'book' IS GONE. This panel carried a "Request a slot" button back when
// the pack spine opened with an introductory call; that stage no longer exists
// — a pack is paid for and assigned in one gesture, and the first thing the
// project asks for is a start date, which is a message rather than a booking.
defineEmits(['message', 'profile'])

const logo = computed(() => logoFor(props.partner.id))

// The listing row's three facts, stacked rather than strung along a line —
// 352px cannot hold them side by side, and the rail's own idiom is a stacked
// list with an icon per row (see `PackPanel`). Spelled out further than the row
// spells them: "4.5 (12)" works in a line of three where the neighbouring star
// does the explaining, and reads as a version number on a list of its own.
const facts = computed(() => {
  const p = props.partner
  if (!p) return []
  return [
    { icon: IconRate, text: p.rate ? `From $${p.rate}/hr` : 'Rate undisclosed', muted: !p.rate },
    { icon: IconStar, text: `${p.rating} (${p.reviews} reviews)` },
    { icon: IconClock, text: `Typically replies in ${p.responds}` },
  ]
})
</script>

<template>
  <div>
    <!-- Same strip as `PackPanel`'s: `min-h-12` is `PageHeader`'s height, so
         the two panels and the top bar sit on one rhythm. -->
    <header
      class="sticky top-0 z-10 flex min-h-12 items-center border-b border-outline-gray-1 bg-surface-base px-4"
    >
      <h2 class="text-base font-medium text-ink-gray-8">Partner</h2>
    </header>

    <section class="px-4 py-4">
        <div class="flex items-start gap-3">
          <Avatar
            v-if="logo"
            :image="logo"
            :label="`${partner.name} logo`"
            size="3xl"
            shape="square"
            class="fc-logo-avatar"
          />
          <!-- Not an `Avatar`: its fallback renders `label[0]` on a theme
               surface, and this is two initials on the partner's own brand
               colour. Same 46px and 10px radius as `3xl`. -->
          <div
            v-else
            class="flex size-[46px] shrink-0 items-center justify-center rounded-[10px] text-sm font-semibold text-white"
            :style="{ backgroundColor: partner.color }"
            aria-hidden="true"
          >
            {{ partner.initials }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <RouterLink
                :to="`/connect/partners/${partner.id}`"
                class="min-w-0 truncate text-lg font-medium text-ink-gray-8 hover:underline"
              >
                {{ partner.name }}
              </RouterLink>
              <TierIcon :tier="partner.tier" />
            </div>
            <!-- ⚠️ TWO LINES ARE GONE FROM THE WIDE CARD, and both are cuts
                 rather than things that would not fit. "Expertise across Textile
                 Manufacturing, Retail, Healthcare and 4 more" and the firm's
                 tagline are both reasons to HIRE someone. You already hired
                 them — on a tracking screen they are the only facts here
                 answering a question nobody is still asking. The tagline had a
                 second problem besides: two of the thirteen partners have one,
                 so eleven panels would have carried filler in its place.

                 The city stays, under the name, where the listing row and the
                 Confirmed screen both put it. -->
            <p class="mt-0.5 text-p-sm text-ink-gray-6">{{ partner.city }}</p>
          </div>
        </div>

        <ul class="mt-4 space-y-1.5">
          <li
            v-for="f in facts"
            :key="f.text"
            class="flex items-start gap-2 text-p-base text-ink-gray-7"
          >
            <component :is="f.icon" class="mt-0.5 size-4 shrink-0 text-ink-gray-6" />
            <span class="min-w-0" :class="f.muted ? 'text-ink-gray-5' : ''">{{ f.text }}</span>
          </li>
        </ul>

        <div class="mt-4 flex flex-wrap gap-2">
          <Button variant="subtle" size="sm" label="Message" @click="$emit('message')" />
          <!-- The profile, because "who are these people" is the other question
               a partner card is opened with, and until now the only way to it
               was through the directory. -->
          <Button
            variant="subtle"
            size="sm"
            label="View profile"
            :route="{ name: 'partner', params: { id: partner.id } }"
          />
        </div>
    </section>
  </div>
</template>

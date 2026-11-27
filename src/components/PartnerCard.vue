<script setup>
import { computed } from 'vue'
import { Avatar, Button } from 'frappe-ui'
import TierIcon from './TierIcon.vue'
import { cityOf } from '../data/partners'
import { logoFor } from '../data/logos'

// One partner on a project's page: a quote, a firm you're waiting on, or a
// suggestion. Two layouts while we choose, switched from the Demo menu:
//
//   rows   Care.com's profile card. A 32px logo, the name and the quote on
//          one line; under the name, weeks, a short rule, then city and
//          rating; the opening of their story. Hire, Message and Not
//          interested stacked behind a rule, top-aligned; only Not
//          interested has an icon.
//   soft   The rows card without its inner frames: one outline-gray-2
//          hairline, 24px padding, 16px radius. Name over city, rating and
//          founding year; price over weeks. Not interested bottom left,
//          Message and Hire bottom right.
//   cards  Braintrust's card. A small logo, the name and the price on one line;
//          the note under them; a footer with location and weeks on the left
//          and the actions on the right, Hire last.
//
// ⚠️ ACTIONS ARE DATA, so each layout orders and draws them its own way:
// `primary` (Hire, Send, Restore), `secondary` (Message), `dismiss` (Not
// interested, Hide). Rows stack them most-committal first; cards run them
// left to right ending on the primary, with `dismiss` as an icon.
const props = defineProps({
  partner: { type: Object, required: true },
  layout: { type: String, default: 'rows' },
  // Weeks quoted, when there is a quote.
  weeks: { type: Number, default: null },
  note: { type: String, default: '' },
  actions: { type: Array, default: () => [] },
})

// The facts row: only what the partner has. No reviews, no rating — a
// "0.0" would read as a bad score, not a missing one.
const facts = computed(() => {
  const p = props.partner
  return [
    p.reviews > 0 && p.rating && { icon: 'lucide-star', text: p.rating.toFixed(1), strong: true, after: `(${p.reviews})` },
  ].filter(Boolean)
})
// Soft cards: the firm's facts with the founding year back — the weeks
// moved under the price, so this row is only about the firm.
const firmFacts = computed(() => {
  const year = props.partner.founding?.year
  return [...facts.value, year && { icon: 'lucide-building-2', text: `Since ${year}` }].filter(Boolean)
})
const story = computed(() => props.partner.founding?.story?.[0] ?? '')

const byKind = (kind) => props.actions.filter((a) => a.kind === kind)
const stacked = computed(() => [...byKind('primary'), ...byKind('secondary'), ...byKind('dismiss')])
const inline = computed(() => [...byKind('dismiss'), ...byKind('secondary'), ...byKind('primary')])

// Subtle at rest so a page of them doesn't shout; solid under the pointer,
// where the one you mean becomes the primary.
const HIRE_HOVER = 'hover:!bg-surface-gray-10 hover:!text-ink-base active:!bg-surface-gray-9'
</script>

<template>
  <!-- ── Rows: the profile card ─────────────────────────────────────── -->
  <article v-if="layout === 'rows'" class="flex flex-col gap-4 rounded-6 border border-outline-gray-2 bg-surface-base p-5 sm:flex-row sm:gap-6">
    <div class="min-w-0 flex-1">
      <!-- One line: who, and what they quoted. The logo is sized to that one
           line, with nothing under the name. -->
      <div class="flex items-center gap-3">
        <Avatar
          :image="logoFor(partner.id)"
          :label="partner.name"
          size="xl"
          shape="square"
          class="fc-logo-avatar fc-logo-tint shrink-0 !p-0.5"
        />
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <RouterLink
            :to="{ name: 'partner', params: { id: partner.id } }"
            class="truncate text-xl font-semibold text-ink-gray-7 hover:underline"
          >
            {{ partner.name }}
          </RouterLink>
          <TierIcon :tier="partner.tier" />
          <slot name="badges" />
        </div>
        <div class="shrink-0 text-right"><slot name="aside" /></div>
      </div>
      <!-- ⚠️ THE PROJECT, A RULE, THEN THE COMPANY. Weeks are part of this
           quote; location and rating are about the firm. The
           short rule keeps the two from reading as one list. -->
      <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-gray-6">
        <template v-if="weeks">
          <span class="inline-flex items-center gap-1.5">
            <span class="lucide-clock size-4 shrink-0" aria-hidden="true" />
            <span class="tabular-nums">{{ weeks }} weeks</span>
          </span>
          <span class="h-3.5 border-l border-outline-gray-2" aria-hidden="true" />
        </template>
        <span class="inline-flex items-center gap-1.5">
          <span class="lucide-map-pin size-4 shrink-0" aria-hidden="true" />
          {{ cityOf(partner) }}
        </span>
        <span v-for="f in facts" :key="f.icon" class="inline-flex items-center gap-1.5">
          <span :class="f.icon" class="size-4 shrink-0" aria-hidden="true" />
          <span :class="f.strong ? 'tabular-nums text-ink-gray-8' : ''">{{ f.text }}</span>
          <span v-if="f.after">{{ f.after }}</span>
        </span>
        <slot name="meta" />
      </div>
      <!-- ⚠️ THEIR STORY, NOT THE NOTE: the opening of "How we got here" from
           the profile, so each card sounds like the people behind it. The
           quote's note stays in the thread and the Hire dialog. -->
      <p v-if="story" class="mt-2.5 line-clamp-2 text-p-base text-ink-gray-6">{{ story }}</p>
    </div>
    <div class="flex shrink-0 flex-col gap-2.5 border-t border-outline-gray-1 pt-4 sm:w-[185px] sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
      <Button
        v-for="a in stacked"
        :key="a.label"
        :variant="a.kind === 'dismiss' ? 'ghost' : 'subtle'"
        :label="a.label"
        :icon-left="a.kind === 'dismiss' ? a.icon : undefined"
                :route="a.route"
        :class="a.kind === 'primary' && a.hire ? HIRE_HOVER : ''"
        @click="a.onClick?.()"
      />
    </div>
  </article>

  <!-- ── Soft: one outline, nothing inside it ──────────────────────── -->
  <article v-else-if="layout === 'soft'" class="rounded-7 border border-outline-gray-2 bg-surface-base p-6">
    <!-- Two lines a side: the firm (name over city, rating, founded) on
         the left, the offer (price over weeks) on the right. -->
    <div class="flex items-start gap-3.5">
      <Avatar
        :image="logoFor(partner.id)"
        :label="partner.name"
        size="2xl"
        shape="square"
        class="fc-logo-avatar fc-logo-tint shrink-0"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <RouterLink
            :to="{ name: 'partner', params: { id: partner.id } }"
            class="truncate text-xl font-semibold text-ink-gray-7 hover:underline"
          >
            {{ partner.name }}
          </RouterLink>
          <TierIcon :tier="partner.tier" />
          <slot name="badges" />
        </div>
        <div class="mt-1 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-sm text-ink-gray-6">
          <span class="inline-flex items-center gap-1">
            <span class="lucide-map-pin size-4 shrink-0" aria-hidden="true" />
            {{ cityOf(partner) }}
          </span>
          <span v-for="f in firmFacts" :key="f.icon" class="inline-flex items-center gap-1">
            <span :class="f.icon" class="size-4 shrink-0" aria-hidden="true" />
            <span :class="f.strong ? 'tabular-nums text-ink-gray-8' : ''">{{ f.text }}</span>
            <span v-if="f.after">{{ f.after }}</span>
          </span>
          <slot name="meta" />
        </div>
      </div>
      <div class="shrink-0 text-right">
        <slot name="aside" />
        <p v-if="weeks" class="mt-1 text-sm tabular-nums text-ink-gray-6">{{ weeks }} weeks</p>
      </div>
    </div>
    <p v-if="story" class="mt-3 line-clamp-2 text-p-base text-ink-gray-6">{{ story }}</p>
    <!-- ⚠️ NOT INTERESTED ON THE LEFT, Message and Hire on the right: the
         way out sits across the card from the way in, so a hurried click
         can't land on the wrong one. Natural widths; Hire turns solid under
         the pointer. -->
    <div class="mt-4 flex flex-wrap items-center gap-2">
      <Button
        v-for="a in byKind('dismiss')"
        :key="a.label"
        class="-ml-2.5"
        variant="ghost"
        :label="a.label"
        :icon-left="a.icon"
        @click="a.onClick?.()"
      />
      <span class="flex-1" />
      <Button
        v-for="a in [...byKind('secondary'), ...byKind('primary')]"
        :key="a.label"
        :label="a.label"
        :route="a.route"
        :class="a.kind === 'primary' && a.hire ? HIRE_HOVER : ''"
        @click="a.onClick?.()"
      />
    </div>
  </article>

  <!-- ── Cards ────────────────────────────────────────────────────────── -->
  <article v-else class="rounded-6 border border-outline-gray-1 bg-surface-base">
    <div class="px-5 pb-4 pt-5">
      <div class="flex items-center gap-2.5">
        <Avatar
          :image="logoFor(partner.id)"
          :label="partner.name"
          size="lg"
          shape="square"
          class="fc-logo-avatar fc-logo-tint shrink-0 !p-0.5"
        />
        <div class="flex min-w-0 flex-1 items-center gap-2">
          <RouterLink
            :to="{ name: 'partner', params: { id: partner.id } }"
            class="truncate text-base font-medium text-ink-gray-8 hover:underline"
          >
            {{ partner.name }}
          </RouterLink>
          <TierIcon :tier="partner.tier" />
          <slot name="badges" />
        </div>
        <div class="shrink-0"><slot name="aside" /></div>
      </div>
      <p v-if="note" class="mt-3 line-clamp-2 text-p-base text-ink-gray-6">“{{ note }}”</p>
    </div>
    <div class="flex flex-wrap items-center gap-2 border-t border-outline-gray-1 px-5 py-3">
      <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-gray-6">
        <span class="inline-flex items-center gap-1.5">
          <span class="lucide-map-pin size-4 shrink-0" aria-hidden="true" />
          {{ cityOf(partner) }}
        </span>
        <span v-if="weeks" class="inline-flex items-center gap-1.5">
          <span class="lucide-clock size-4 shrink-0" aria-hidden="true" />
          {{ weeks }} weeks
        </span>
        <slot name="meta" />
      </div>
      <template v-for="a in inline" :key="a.label">
        <!-- Not interested and Hide as an icon, named by its tooltip. -->
        <Button
          v-if="a.kind === 'dismiss'"
          variant="ghost"
          :tooltip="a.label"
          :aria-label="a.label"
          @click="a.onClick?.()"
        >
          <template #icon><span :class="a.icon" class="size-4" aria-hidden="true" /></template>
        </Button>
        <Button
          v-else
          :label="a.label"
          :icon-left="a.kind === 'primary' ? undefined : a.icon"
          :route="a.route"
          :class="a.kind === 'primary' && a.hire ? HIRE_HOVER : ''"
          @click="a.onClick?.()"
        />
      </template>
    </div>
  </article>
</template>

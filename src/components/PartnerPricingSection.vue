<script setup>
import { computed, ref } from 'vue'
import { Button } from 'frappe-ui'
import IconPacks from '~icons/lucide/package'
import IconCustom from '~icons/lucide/pencil-ruler'
import EstimateQuoteDialog from './EstimateQuoteDialog.vue'
import { STARTER_PACKS } from '../data/partners'
import { contactToast } from '../feedback'

// SCREEN 6, fourth section — "Pricing".
//
// Two cards, and they are the two answers to the quiz's third question: a
// standard implementation off a starter pack, or a custom engagement. Same
// split as `IMPLEMENTATION_TYPES` in `data/quiz.js`, so a visitor who answered
// that question is looking at the card they already chose.
const props = defineProps({
  partner: { type: Object, required: true },
})

// The hours range is REAL, in the sense that it's derived rather than written:
// the low and high of the starter packs this partner actually offers. Tridots
// Tech offers Core ERPNext (40h), Manufacturing (70h) and All in one (100h),
// which is where the design's "40-100 hrs" comes from. A partner offering one
// pack gets a single figure rather than a range of one.
const packHours = computed(() =>
  props.partner.packs
    .map((value) => STARTER_PACKS.find((p) => p.value === value)?.hours)
    .filter((h) => typeof h === 'number')
    .sort((a, b) => a - b),
)

const hoursLabel = computed(() => {
  const h = packHours.value
  if (!h.length) return null
  const [lo, hi] = [h[0], h[h.length - 1]]
  return lo === hi ? `${lo} hrs` : `${lo}-${hi} hrs`
})

// ⚠️ TODO gate: the estimator is meant to be for people who have created a
// project — the scope it prices comes from one. `store.hasProject` is live and
// already true for the demo switcher's "Ongoing project" viewer, so gating this
// is `v-if="store.hasProject"` on the Button below. Open to everyone until the
// signed-in views land, or there'd be nothing to review.
const estimating = ref(false)
</script>

<template>
  <section>
    <h2 class="text-base font-semibold text-ink-gray-8">Pricing</h2>

    <!-- Two equal cards from `sm` up, stacked below it. `items-stretch` is the
         grid default, so the shorter card matches the taller one and the two
         actions sit on the same line. -->
    <div class="mt-4 grid gap-4 sm:grid-cols-2">
      <!-- ── Standard implementation ─────────────────────────────────────
           Only offered if the partner actually sells starter packs. Every
           partner in the directory does today, but the card is the claim "you
           can buy a fixed scope from us", so it shouldn't appear without one. -->
      <div
        v-if="hoursLabel"
        class="flex items-start gap-3 rounded-5 border border-outline-gray-2 bg-surface-base p-4"
      >
        <span
          class="grid size-7 shrink-0 place-items-center rounded-3 bg-surface-gray-2 text-ink-gray-7"
          aria-hidden="true"
        >
          <IconPacks class="size-4" />
        </span>
        <div class="min-w-0">
          <p class="text-base font-medium text-ink-gray-7">
            Starter packs - Standard implementation
          </p>
          <p class="mt-0.5 text-p-base text-ink-gray-6">{{ hoursLabel }}</p>
          <!-- `-ml-2` cancels the ghost Button's own horizontal padding, so the
               label lines up with the title above it rather than sitting two
               pixels in. The chevron is a suffix rather than part of the label
               so the button owns its spacing. -->
          <!-- Opens the estimator. The hours on this card are the partner's
               fixed-scope packs; the modal prices the visitor's own project,
               which can legitimately come out higher. -->
          <Button
            variant="ghost"
            label="Estimate quote"
            class="-ml-2 mt-2"
            @click="estimating = true"
          >
            <template #suffix><LucideChevronRight class="size-4" /></template>
          </Button>
        </div>
      </div>

      <!-- ── Custom ──────────────────────────────────────────────────────
           No figure here on purpose. A custom engagement priced on a profile
           page would be a number nobody can stand behind, so the card says so
           and hands over to the conversation. -->
      <div
        class="flex items-start gap-3 rounded-5 border border-outline-gray-2 bg-surface-base p-4"
      >
        <span
          class="grid size-7 shrink-0 place-items-center rounded-3 bg-surface-gray-2 text-ink-gray-7"
          aria-hidden="true"
        >
          <IconCustom class="size-4" />
        </span>
        <div class="min-w-0">
          <p class="text-base font-medium text-ink-gray-7">Custom solutions</p>
          <p class="mt-0.5 text-p-base text-ink-gray-6">Please contact us for a detailed quote</p>
          <!-- ⚠️ Same destination as the header's Contact button — the in-app
               messages screen, which doesn't exist yet — so it raises the same
               toast rather than swallowing the click. -->
          <Button
            variant="ghost"
            label="Contact us"
            class="-ml-2 mt-2"
            @click="contactToast(partner)"
          >
            <template #suffix><LucideChevronRight class="size-4" /></template>
          </Button>
        </div>
      </div>
    </div>

    <EstimateQuoteDialog :open="estimating" :partner="partner" @close="estimating = false" />
  </section>
</template>

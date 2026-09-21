<script setup>
import { computed, ref } from 'vue'
import { Button } from 'frappe-ui'
import IconPacks from '~icons/lucide/package'
import IconCustom from '~icons/lucide/pencil-ruler'
import EstimateQuoteDialog from './EstimateQuoteDialog.vue'
import { STARTER_PACKS } from '../data/packs'
import { useContactPartner } from '../utils/contact'

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
// Tech sells all four, which are 5, 10, 5 and 5 hours, so the card reads
// "5-10 hrs". A partner offering one pack, or several of the same size, gets a
// single figure rather than a range of one — and since three of the four packs
// are 5 hours, that is now the common case rather than the exception.
//
// ⚠️ The design's "40-100 hrs" came from the old nesting packs, where a tier
// contained the ones below it. The packs are disjoint now, so these hours are
// per module set and a buyer adds them up across the packs they take.
const { contactPartner } = useContactPartner()

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

// Three of the thirteen partners don't publish an hourly rate (`rate: null` —
// see `data/partners.js`), and the estimator has nothing to multiply hours by
// for those. The card still stands: the pack hours are the partner's own and
// don't depend on a rate. What changes is the action — a conversation instead
// of a figure — so the estimator is never opened without a number behind it.
// `EstimateQuoteDialog` trusts that and reads `partner.rate` directly.
const quotable = computed(() => Boolean(props.partner.rate))

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
            v-if="quotable"
            variant="ghost"
            label="Estimate quote"
            class="-ml-2 mt-2"
            @click="estimating = true"
          >
            <template #suffix><LucideChevronRight class="size-4" /></template>
          </Button>
          <!-- Undisclosed rate. The label says which of the two cards you are
               on — "Contact us" is already the Custom card's action, and two
               identical buttons side by side would make the split between a
               fixed scope and a bespoke one look like a distinction without a
               difference. Same destination as every other Contact on the page:
               the conversation with this partner. -->
          <Button
            v-else
            variant="ghost"
            label="Ask for pack pricing"
            class="-ml-2 mt-2"
            @click="contactPartner(partner)"
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
          <!-- ⚠️ Same destination as the header's Contact button: the in-app
               messages screen, opened on this partner's thread. -->
          <Button
            variant="ghost"
            label="Contact us"
            class="-ml-2 mt-2"
            @click="contactPartner(partner)"
          >
            <template #suffix><LucideChevronRight class="size-4" /></template>
          </Button>
        </div>
      </div>
    </div>

    <!-- The one thing this section would otherwise get wrong by omission: a
         fixed price quoted on a partner's own profile reads as a price you pay
         that partner, and for a pack you don't — Frappe takes the full amount
         in advance and the partner delivers against it. Same line as the packs
         section on `/connect`, which is where the figures are.

         Under the grid rather than inside the pack card, and that's what keeps
         the two cards a pair: each is a two-line claim, and a third line in one
         of them drops its action a line below the other's. It names starter
         packs so that sitting under both cards doesn't read as a claim about
         custom work, which is priced in a conversation and not here. -->
    <p v-if="hoursLabel" class="mt-3 text-p-sm text-ink-gray-5">
      Starter packs are paid to Frappe in full, not to the partner.
    </p>

    <EstimateQuoteDialog
      v-if="quotable"
      :open="estimating"
      :partner="partner"
      @close="estimating = false"
    />
  </section>
</template>

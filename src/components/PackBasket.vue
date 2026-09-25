<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import { STARTER_PACKS, checkoutFor } from '../data/packs'

// The basket beside a pack list: the total, and the one button that acts on it.
// The same panel wherever packs are ticked — the catalogue, the recommendation
// screen and a draft project.
//
// ⚠️ ALWAYS SHOWN, empty included. It used to appear on the catalogue only once
// something was ticked, which meant the one place a total lives was invisible
// until you had already guessed that ticking would produce one.
//
// ⚠️ IT DOES NOT LIST THE PACKS. The rows beside it are the line items, each
// with its price; repeating them here would be a second printing of the same
// figures. The tax is named, and dropped where a market has no decided rate —
// see `checkoutFor`.
const props = defineProps({
  packs: { type: Array, required: true },
  region: { type: String, required: true },
  // "You'll make an account on the way" — only true for a visitor.
  signedIn: { type: Boolean, default: true },
})

const emit = defineEmits(['checkout'])

const bill = computed(() =>
  checkoutFor(
    STARTER_PACKS.filter((p) => props.packs.includes(p.value)),
    props.region,
  ),
)
</script>

<template>
  <div class="rounded-6 border border-outline-gray-2 p-4">
    <template v-if="!packs.length">
      <p class="text-p-base text-ink-gray-7">Nothing picked</p>
      <p class="mt-1 text-p-sm text-ink-gray-6">Tick a pack to see what it comes to.</p>
    </template>
    <template v-else>
      <p class="text-p-base text-ink-gray-6">Total</p>
      <p class="mt-1 text-3xl font-semibold tabular-nums text-ink-gray-8">{{ bill.total }}</p>
      <p class="mt-1 text-p-sm text-ink-gray-6">
        <template v-if="bill.exact">{{ bill.subtotal }} plus {{ bill.taxLabel }}</template>
        <template v-else>{{ bill.subtotal }} before {{ bill.taxLabel }}</template>
        · {{ bill.hours }} hours
      </p>
      <Button
        class="mt-4 w-full"
        variant="solid"
        size="md"
        label="Check out"
        @click="emit('checkout')"
      />
      <p class="mt-3 text-p-sm text-ink-gray-6">
        Paid to Frappe, in full and up front.
        <template v-if="!signedIn">You'll make an account on the way.</template>
      </p>
    </template>
  </div>
</template>

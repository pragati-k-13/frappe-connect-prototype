<script setup>
import { computed } from 'vue'
import { Button } from 'frappe-ui'
import IconUser from '~icons/lucide/user-round'
import { STARTER_PACKS, checkoutFor } from '../data/packs'
import { useConnectStore } from '../stores/connect'

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
  // Overrides Sign up / Check out where the button leads somewhere else first
  // (the catalogue's goes to the cart).
  label: { type: String, default: null },
})

const emit = defineEmits(['checkout'])

// The region's currency with nothing in it — read off a real bill so the
// symbol can never disagree with the total that replaces it.
const zero = computed(() => checkoutFor(STARTER_PACKS.slice(0, 1), props.region).total.replace(/[\d,.]+/, '0'))

const bill = computed(() =>
  checkoutFor(
    STARTER_PACKS.filter((p) => props.packs.includes(p.value)),
    props.region,
  ),
)

// ⚠️ "Sign up", NOT "Check out", for a visitor. A solid button under a price
// is read as "pay here" by anyone scanning, and a visitor's next step is an
// account, not a payment — sign-up returns them here with the basket kept, and
// Check out follows. The label is the one word a scanner reads, so it names
// the step that actually happens.
const store = useConnectStore()
const action = computed(() => props.label ?? (store.signedIn ? 'Check out' : 'Sign up'))
const signUpIcon = computed(() => !props.label && !store.signedIn)
</script>

<template>
  <div class="rounded-6 border border-outline-gray-2 p-4">
    <!-- ⚠️ EMPTY, THE BASKET STILL SHOWS WHERE THIS GOES: a zero total and a
         disabled next step. "Nothing picked" was a status with no next step in
         it; a button waiting to be unlocked says what unlocks it. -->
    <template v-if="!packs.length">
      <p class="text-p-base text-ink-gray-6">Total</p>
      <p class="mt-1 text-3xl font-semibold tabular-nums text-ink-gray-4">{{ zero }}</p>
      <Button class="mt-4 w-full" variant="solid" size="md" :label="action" disabled>
        <template v-if="signUpIcon" #prefix><IconUser class="size-4" /></template>
      </Button>
      <p class="mt-3 text-p-sm text-ink-gray-6">Select at least one pack.</p>
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
        :label="action"
        @click="emit('checkout')"
      >
        <template v-if="signUpIcon" #prefix><IconUser class="size-4" /></template>
      </Button>
      <p class="mt-3 text-p-sm text-ink-gray-6">
        Paid to Frappe, in full and up front.
      </p>
    </template>
  </div>
</template>

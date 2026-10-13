<script setup>
import { computed, ref, watch } from 'vue'
import { Button, Checkbox } from 'frappe-ui'
import PackTermsDialog from './PackTermsDialog.vue'
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
  // The cart's: the last screen before paying asks for the terms to be agreed.
  requireTerms: { type: Boolean, default: false },
})

const emit = defineEmits(['checkout'])

// The tax row's label: the market's own wording ("18% GST", "local VAT"),
// capitalised to stand as a label rather than run on in a sentence.
const taxRow = computed(() => {
  const label = checkoutFor([], props.region).taxLabel
  return label.charAt(0).toUpperCase() + label.slice(1)
})

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
const action = computed(() => props.label ?? (store.signedIn ? 'Check out' : 'Sign up to continue'))
const signUpIcon = computed(() => !props.label && !store.signedIn)

// ⚠️ AN EXPLICIT TICK, ONLY WHERE PAYING IS NEXT. A visitor's button is Sign
// up, not pay, so the box waits until they're signed in and back here. The
// button stays live: pressed unticked it says why under the box, rather than
// sitting disabled with no reason. "Starter Pack terms" opens the terms, and
// their Agree ticks the box.
const needsTerms = computed(() => props.requireTerms && store.signedIn)
const agreed = ref(false)
const termsOpen = ref(false)
const termsError = ref('')
watch(agreed, (v) => v && (termsError.value = ''))

const act = () => {
  if (needsTerms.value && !agreed.value) {
    termsError.value = 'Agree to the terms to continue'
    return
  }
  emit('checkout')
}
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
    <!-- Filled, read as an invoice: subtotal and tax as figures, ruled off,
         then the total — every amount in one right-hand column, so the sum can
         be checked down it. Where a market has no decided rate the tax row
         says so and the total is before it. No footnote under the
         button. -->
    <template v-else>
      <dl class="space-y-1.5 text-p-sm">
        <div class="flex justify-between gap-3">
          <dt class="text-ink-gray-6">Subtotal</dt>
          <dd class="font-medium tabular-nums text-ink-gray-7">{{ bill.subtotal }}</dd>
        </div>
        <div class="flex justify-between gap-3">
          <dt class="text-ink-gray-6">{{ taxRow }}</dt>
          <dd class="font-medium tabular-nums" :class="bill.exact ? 'text-ink-gray-7' : 'text-ink-gray-6'">
            {{ bill.exact ? bill.tax : 'At checkout' }}
          </dd>
        </div>
      </dl>
      <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-outline-gray-2 pt-3">
        <p class="text-p-base font-medium text-ink-gray-8">Total</p>
        <p class="text-2xl font-semibold tabular-nums text-ink-gray-8">{{ bill.total }}</p>
      </div>
      <!-- ── The act, its own section ───────────────────────────────
           Set apart by space, not a rule: 24px above it, 12px inside it. The
           terms sit 12px over the button they unlock, so the two read as one
           condition and its action, and the bill above as something else.
           Checkbox hands `class` to its input, hence the wrapper. -->
      <div class="mt-6">
        <div v-if="needsTerms" class="mb-3 flex">
          <Checkbox v-model="agreed" :error="termsError">
            <template #label>
              I agree to the
              <button
                type="button"
                class="underline decoration-outline-gray-3 underline-offset-2 hover:decoration-ink-gray-5"
                @click.prevent.stop="termsOpen = true"
              >
                Starter Pack terms
              </button>
            </template>
          </Checkbox>
        </div>
        <Button
          class="w-full"
          variant="solid"
          size="md"
          :label="action"
          @click="act"
        >
          <template v-if="signUpIcon" #prefix><IconUser class="size-4" /></template>
        </Button>
      </div>
    </template>
    <PackTermsDialog
      v-if="needsTerms"
      v-model:open="termsOpen"
      :region="region"
      :agreed="agreed"
      @agree="agreed = true"
    />
  </div>
</template>
